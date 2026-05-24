import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

interface ScanBeamProps {
  height: number;
  active?: boolean;
}

export function ScanBeam({ height, active = true }: ScanBeamProps) {
  const position = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return;

    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(position, {
          toValue: height,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(position, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    anim.start();
    return () => anim.stop();
  }, [active, height, position]);

  if (!active) return null;

  return (
    <Animated.View
      style={[styles.beam, { transform: [{ translateY: position }] }]}
    />
  );
}

const styles = StyleSheet.create({
  beam: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#bb1b1b",
    shadowColor: "#bb1b1b",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
});
