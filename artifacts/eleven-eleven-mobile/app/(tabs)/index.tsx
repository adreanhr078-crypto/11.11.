import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScanBeam } from "@/components/ScanBeam";
import { useColors } from "@/hooks/useColors";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const SCAN_STEPS = [
  "INICIANDO ESCÁNER BIOMÉTRICO...",
  "ANALIZANDO PATRONES OCULARES...",
  "VERIFICANDO HUELLAS DIGITALES...",
  "LEYENDO ACTIVIDAD CEREBRAL...",
  "SINCRONIZANDO CON EL SISTEMA...",
  "ACCESO CONCEDIDO — BIENVENIDO.",
];

export default function ScanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [scanning, setScanning] = useState(false);
  const fadeIn = useRef(new Animated.Value(0)).current;
  const titlePulse = useRef(new Animated.Value(1)).current;
  const completeFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(titlePulse, { toValue: 0.5, duration: 800, useNativeDriver: true }),
        Animated.timing(titlePulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [fadeIn, titlePulse]);

  const startScan = async () => {
    setScanning(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    for (let i = 0; i < SCAN_STEPS.length; i++) {
      await new Promise<void>((resolve) => setTimeout(resolve, 900));
      setStep(i);
      if (i < SCAN_STEPS.length - 1) {
        await Haptics.selectionAsync();
      }
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setDone(true);
    Animated.timing(completeFade, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  };

  const handleEnter = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.navigate("/(tabs)/chat");
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (Platform.OS !== "web" && !permission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]} />
    );
  }

  const cameraGranted = Platform.OS !== "web" && permission?.granted;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {cameraGranted && !done ? (
        <CameraView style={StyleSheet.absoluteFill} facing="front">
          <View style={[StyleSheet.absoluteFill, styles.cameraOverlay]}>
            <ScanBeam height={SCREEN_HEIGHT} active={scanning} />
          </View>
        </CameraView>
      ) : null}

      {!cameraGranted && scanning && !done && (
        <View style={StyleSheet.absoluteFill}>
          <ScanBeam height={SCREEN_HEIGHT} active />
        </View>
      )}

      <Animated.View
        style={[
          styles.content,
          {
            paddingTop: topPad + 20,
            paddingBottom: botPad + 80,
            opacity: fadeIn,
          },
        ]}
      >
        <View style={styles.header}>
          <Animated.Text
            style={[
              styles.title,
              { color: colors.primary, opacity: titlePulse },
            ]}
          >
            11.11
          </Animated.Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            PROTOCOLO DE ACCESO BIOMÉTRICO
          </Text>
        </View>

        <View style={styles.scanBox}>
          <View style={[styles.corner, styles.topLeft, { borderColor: colors.primary }]} />
          <View style={[styles.corner, styles.topRight, { borderColor: colors.primary }]} />
          <View style={[styles.corner, styles.bottomLeft, { borderColor: colors.primary }]} />
          <View style={[styles.corner, styles.bottomRight, { borderColor: colors.primary }]} />

          {scanning ? (
            <Text
              style={[styles.scanText, { color: colors.primary }]}
              numberOfLines={2}
            >
              {SCAN_STEPS[step]}
            </Text>
          ) : (
            <Text style={[styles.scanText, { color: colors.mutedForeground }]}>
              {Platform.OS !== "web" && !permission?.granted
                ? "SE REQUIERE ACCESO A LA CÁMARA"
                : "EN ESPERA DE AUTORIZACIÓN"}
            </Text>
          )}
        </View>

        {done ? (
          <Animated.View style={[styles.completeContainer, { opacity: completeFade }]}>
            <Text style={[styles.grantedText, { color: colors.primary }]}>
              ✓ ACCESO CONCEDIDO
            </Text>
            <Text style={[styles.grantedSub, { color: colors.mutedForeground }]}>
              El Kiyān te está esperando.
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.enterBtn,
                {
                  borderColor: colors.primary,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
              onPress={handleEnter}
            >
              <Text style={[styles.enterBtnText, { color: colors.primary }]}>
                ENTRAR
              </Text>
            </Pressable>
          </Animated.View>
        ) : (
          <Pressable
            style={({ pressed }) => [
              styles.scanBtn,
              {
                backgroundColor: scanning ? colors.muted : colors.primary,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            onPress={
              scanning
                ? undefined
                : Platform.OS !== "web" && !permission?.granted
                  ? requestPermission
                  : startScan
            }
            disabled={scanning}
          >
            <Text style={[styles.scanBtnText, { color: colors.primaryForeground }]}>
              {scanning
                ? "ESCANEANDO..."
                : Platform.OS !== "web" && !permission?.granted
                  ? "ACTIVAR CÁMARA"
                  : "INICIAR ESCANEO"}
            </Text>
          </Pressable>
        )}

        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          11.11 SISTEMA DE VIGILANCIA ACTIVO
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cameraOverlay: {
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "space-between",
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 56,
    fontFamily: "ShareTechMono_400Regular",
    letterSpacing: 8,
  },
  subtitle: {
    fontSize: 10,
    fontFamily: "ShareTechMono_400Regular",
    letterSpacing: 3,
  },
  scanBox: {
    width: "100%",
    height: 180,
    borderWidth: 1,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    paddingHorizontal: 24,
  },
  corner: {
    position: "absolute",
    width: 24,
    height: 24,
    borderWidth: 2,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanText: {
    fontFamily: "ShareTechMono_400Regular",
    fontSize: 12,
    textAlign: "center",
    letterSpacing: 1,
    lineHeight: 20,
  },
  scanBtn: {
    width: "100%",
    paddingVertical: 16,
    alignItems: "center",
  },
  scanBtnText: {
    fontFamily: "ShareTechMono_400Regular",
    fontSize: 13,
    letterSpacing: 4,
  },
  completeContainer: {
    alignItems: "center",
    gap: 16,
    width: "100%",
  },
  grantedText: {
    fontFamily: "ShareTechMono_400Regular",
    fontSize: 20,
    letterSpacing: 3,
  },
  grantedSub: {
    fontFamily: "ShareTechMono_400Regular",
    fontSize: 12,
    letterSpacing: 1,
  },
  enterBtn: {
    width: "100%",
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    marginTop: 8,
  },
  enterBtnText: {
    fontFamily: "ShareTechMono_400Regular",
    fontSize: 13,
    letterSpacing: 4,
  },
  disclaimer: {
    fontSize: 9,
    fontFamily: "ShareTechMono_400Regular",
    letterSpacing: 2,
  },
});
