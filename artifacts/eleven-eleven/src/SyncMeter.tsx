import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useGameState } from "./gameState";

const SEGMENTS = 10;

function fearColor(fear: number): string {
  if (fear <= 2) return "hsl(0 30% 28%)";
  if (fear <= 4) return "hsl(0 50% 32%)";
  if (fear <= 6) return "hsl(0 65% 36%)";
  if (fear <= 8) return "hsl(0 75% 40%)";
  return "hsl(0 85% 46%)";
}

function fearGlow(fear: number): string {
  if (fear <= 2) return "0 0 4px hsl(0 30% 28% / 0.25)";
  if (fear <= 4) return "0 0 6px hsl(0 50% 32% / 0.35)";
  if (fear <= 6) return "0 0 10px hsl(0 65% 36% / 0.45)";
  if (fear <= 8) return "0 0 16px hsl(0 75% 40% / 0.55)";
  return "0 0 22px hsl(0 85% 46% / 0.70)";
}

function pulseDuration(fear: number): number {
  if (fear <= 2) return 4.0;
  if (fear <= 4) return 3.0;
  if (fear <= 6) return 2.0;
  if (fear <= 8) return 1.4;
  return 0.9;
}

function spikeSize(fear: number): number {
  if (fear <= 3) return 1;
  if (fear <= 6) return 2;
  return 3;
}

export function SyncMeter({ spikeCount = 0 }: { spikeCount?: number }) {
  const { fear, trustAI } = useGameState();
  const [spikeSegments, setSpikeSegments] = useState(0);

  useEffect(() => {
    if (spikeCount === 0) return;
    const size = spikeSize(fear);
    setSpikeSegments(size);
    const t = setTimeout(() => setSpikeSegments(0), 800);
    return () => clearTimeout(t);
  }, [spikeCount, fear]);

  const threat = Math.min(10, fear * 0.75 + trustAI * 0.25);
  const activeFill = Math.round(threat);
  const color = fearColor(fear);
  const glow = fearGlow(fear);
  const pulse = pulseDuration(fear);

  const spikeTop = Math.min(SEGMENTS, activeFill + spikeSegments);

  return (
    <div
      className="fixed left-3 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-1 pointer-events-none select-none"
      aria-hidden="true"
    >
      <span
        className="text-[7px] tracking-[0.35em] font-mono rotate-180"
        style={{
          writingMode: "vertical-rl",
          color: "hsl(0 0% 50% / 0.35)",
          letterSpacing: "0.35em",
        }}
      >
        SYNC
      </span>

      <div className="flex flex-col-reverse gap-[3px] mt-1">
        {Array.from({ length: SEGMENTS }, (_, i) => {
          const active = i < activeFill;
          const isTop = i >= activeFill - 2 && i < activeFill;
          const isSpiking = i >= activeFill && i < spikeTop;

          if (isSpiking) {
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scaleY: 0.5 }}
                animate={{ opacity: [0, 1, 0], scaleY: [0.5, 1.2, 1] }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{
                  width: 4,
                  height: 7,
                  background: "hsl(0 80% 72%)",
                  boxShadow: "0 0 8px hsl(0 80% 72% / 0.9), 0 0 20px hsl(0 70% 60% / 0.6)",
                  transformOrigin: "bottom",
                }}
              />
            );
          }

          return (
            <motion.div
              key={i}
              animate={
                active
                  ? {
                      opacity: isTop ? [0.7, 1, 0.7] : 1,
                      boxShadow: isTop ? [glow, glow.replace(/0\.\d+\)/, "0.9)"), glow] : "none",
                    }
                  : { opacity: 0.1, boxShadow: "none" }
              }
              transition={
                active && isTop
                  ? { duration: pulse, repeat: Infinity, ease: "easeInOut" }
                  : { duration: 0.4 }
              }
              style={{
                width: 4,
                height: 7,
                background: active ? color : "hsl(0 0% 20% / 0.6)",
              }}
            />
          );
        })}
      </div>

      <div
        className="mt-1 text-[7px] font-mono tracking-widest"
        style={{ color: "hsl(0 0% 50% / 0.3)" }}
      >
        {activeFill > 0 ? String(activeFill).padStart(2, "0") : "··"}
      </div>

      {fear >= 7 && (
        <motion.div
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 0.7, repeat: Infinity }}
          className="mt-0.5 text-[6px] font-mono tracking-widest"
          style={{ color: color, writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          ▲
        </motion.div>
      )}
    </div>
  );
}
