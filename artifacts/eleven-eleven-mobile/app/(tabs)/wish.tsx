import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlitchText } from "@/components/GlitchText";
import { useColors } from "@/hooks/useColors";
import { buildDeviceContext, fetchWishTask } from "@/lib/api";
import { shareExperience } from "@/lib/share";
import { Ionicons } from "@expo/vector-icons";

export default function WishScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [wish, setWish] = useState("");
  const [loading, setLoading] = useState(false);
  const [ritual, setRitual] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const submit = async () => {
    const text = wish.trim();
    if (!text || loading) return;
    setLoading(true);
    setRitual(null);
    setError(null);

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const task = await fetchWishTask(text, buildDeviceContext());
      setRitual(task);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setError("تعذّر الاتصال بالكيان.");
    } finally {
      setLoading(false);
    }
  };

  const reset = async () => {
    await Haptics.selectionAsync();
    setWish("");
    setRitual(null);
    setError(null);
    inputRef.current?.focus();
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPad + 24, paddingBottom: botPad + 100 },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.titleBlock}>
        <GlitchText
          text="11.11"
          glitching={loading}
          style={[styles.bigTitle, { color: colors.primary }]}
        />
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          بوابة الأمنيات
        </Text>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {!ritual ? (
        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.foreground }]}>
            أمنيتك:
          </Text>
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              {
                backgroundColor: colors.muted,
                color: colors.foreground,
                borderColor: colors.border,
                fontFamily: "ShareTechMono_400Regular",
              },
            ]}
            value={wish}
            onChangeText={setWish}
            placeholder="اكتب أمنيتك هنا..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            maxLength={300}
            textAlignVertical="top"
          />

          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            الكيان سيقرأ أمنيتك ويمنحك طقساً لتفعيلها في العالم الحقيقي.
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.submitBtn,
              {
                backgroundColor:
                  !wish.trim() || loading ? colors.muted : colors.primary,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            onPress={submit}
            disabled={!wish.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryForeground} size="small" />
            ) : (
              <Text style={[styles.submitBtnText, { color: colors.primaryForeground }]}>
                إرسال الأمنية
              </Text>
            )}
          </Pressable>

          {error && (
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              {error}
            </Text>
          )}
        </View>
      ) : (
        <View style={styles.ritualContainer}>
          <Text style={[styles.ritualLabel, { color: colors.mutedForeground }]}>
            الطقس المطلوب:
          </Text>

          <View
            style={[
              styles.ritualBox,
              {
                borderColor: colors.primary,
                backgroundColor: colors.card,
              },
            ]}
          >
            <View
              style={[styles.ritualCorner, styles.rtl, { borderColor: colors.primary }]}
            />
            <Text style={[styles.ritualText, { color: colors.primary }]}>
              {ritual}
            </Text>
          </View>

          <View style={[styles.wishMemo, { borderColor: colors.border }]}>
            <Text style={[styles.wishMemoLabel, { color: colors.mutedForeground }]}>
              أمنيتك:
            </Text>
            <Text style={[styles.wishMemoText, { color: colors.foreground }]}>
              {wish}
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.shareWishBtn,
              {
                borderColor: colors.primary,
                backgroundColor: pressed ? `${colors.primary}22` : `${colors.primary}0d`,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            onPress={async () => {
              await Haptics.selectionAsync();
              await shareExperience(0);
            }}
          >
            <Ionicons name="share-outline" size={15} color={colors.primary} />
            <Text style={[styles.shareWishBtnText, { color: colors.primary }]}>
              شارك التجربة
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.resetBtn,
              {
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            onPress={reset}
          >
            <Text style={[styles.resetBtnText, { color: colors.mutedForeground }]}>
              أمنية جديدة
            </Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    gap: 24,
  },
  titleBlock: {
    alignItems: "center",
    gap: 8,
  },
  bigTitle: {
    fontSize: 52,
    fontFamily: "ShareTechMono_400Regular",
    letterSpacing: 8,
  },
  subtitle: {
    fontFamily: "ShareTechMono_400Regular",
    fontSize: 11,
    letterSpacing: 4,
  },
  divider: {
    height: 1,
    width: "100%",
  },
  form: {
    gap: 16,
  },
  label: {
    fontFamily: "ShareTechMono_400Regular",
    fontSize: 12,
    letterSpacing: 2,
  },
  input: {
    minHeight: 120,
    padding: 14,
    fontSize: 14,
    borderWidth: 1,
    lineHeight: 22,
    textAlign: "right",
  },
  hint: {
    fontFamily: "ShareTechMono_400Regular",
    fontSize: 10,
    lineHeight: 16,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  submitBtn: {
    paddingVertical: 16,
    alignItems: "center",
  },
  submitBtnText: {
    fontFamily: "ShareTechMono_400Regular",
    fontSize: 13,
    letterSpacing: 3,
  },
  errorText: {
    fontFamily: "ShareTechMono_400Regular",
    fontSize: 12,
    textAlign: "center",
  },
  ritualContainer: {
    gap: 20,
  },
  ritualLabel: {
    fontFamily: "ShareTechMono_400Regular",
    fontSize: 10,
    letterSpacing: 3,
    textAlign: "right",
  },
  ritualBox: {
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: 20,
    position: "relative",
  },
  ritualCorner: {
    position: "absolute",
    top: -1,
    right: -1,
    width: 16,
    height: 16,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: "inherit",
  },
  rtl: {},
  ritualText: {
    fontFamily: "ShareTechMono_400Regular",
    fontSize: 14,
    lineHeight: 24,
    textAlign: "right",
  },
  wishMemo: {
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  wishMemoLabel: {
    fontFamily: "ShareTechMono_400Regular",
    fontSize: 9,
    letterSpacing: 2,
    textAlign: "right",
  },
  wishMemoText: {
    fontFamily: "ShareTechMono_400Regular",
    fontSize: 12,
    lineHeight: 20,
    textAlign: "right",
  },
  shareWishBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderWidth: 1,
    gap: 8,
  },
  shareWishBtnText: {
    fontFamily: "ShareTechMono_400Regular",
    fontSize: 12,
    letterSpacing: 3,
  },
  resetBtn: {
    paddingVertical: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  resetBtnText: {
    fontFamily: "ShareTechMono_400Regular",
    fontSize: 11,
    letterSpacing: 3,
  },
});
