import React, { useEffect, useRef } from "react";
import { Animated, StyleProp, StyleSheet, Text, TextStyle, View } from "react-native";

interface GlitchTextProps {
  text: string;
  style?: StyleProp<TextStyle>;
  glitching?: boolean;
}

export function GlitchText({ text, style, glitching = false }: GlitchTextProps) {
  const offsetX = useRef(new Animated.Value(0)).current;
  const offsetX2 = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!glitching) {
      offsetX.setValue(0);
      offsetX2.setValue(0);
      opacity.setValue(0);
      return;
    }

    const glitch = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(offsetX, { toValue: -3, duration: 50, useNativeDriver: true }),
          Animated.timing(offsetX2, { toValue: 3, duration: 50, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.8, duration: 50, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(offsetX, { toValue: 2, duration: 50, useNativeDriver: true }),
          Animated.timing(offsetX2, { toValue: -2, duration: 50, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.6, duration: 50, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(offsetX, { toValue: 0, duration: 100, useNativeDriver: true }),
          Animated.timing(offsetX2, { toValue: 0, duration: 100, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 100, useNativeDriver: true }),
        ]),
        Animated.delay(300 + Math.random() * 700),
      ])
    );

    glitch.start();
    return () => glitch.stop();
  }, [glitching, offsetX, offsetX2, opacity]);

  return (
    <View style={styles.container}>
      {glitching && (
        <>
          <Animated.Text
            style={[style, styles.ghost, styles.redGhost, { transform: [{ translateX: offsetX }], opacity }]}
            numberOfLines={1}
          >
            {text}
          </Animated.Text>
          <Animated.Text
            style={[style, styles.ghost, styles.blueGhost, { transform: [{ translateX: offsetX2 }], opacity }]}
            numberOfLines={1}
          >
            {text}
          </Animated.Text>
        </>
      )}
      <Text style={style}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  ghost: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  redGhost: {
    color: "#ff0000",
  },
  blueGhost: {
    color: "#00ffff",
  },
});
