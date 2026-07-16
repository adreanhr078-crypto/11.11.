import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function LangSelect({ onSelect }: { onSelect: (lang: "ar" | "en") => void }) {
  const [charIdx, setCharIdx] = useState(0);
  const [glitch, setGlitch] = useState(false);
  const [chosen, setChosen] = useState<"ar" | "en" | null>(null);

  const prelude = "SYSTEM 11.11 — PROTOCOL INIT";

  useEffect(() => {
    if (charIdx >= prelude.length) return;
    const t = setTimeout(() => setCharIdx(p => p + 1), 45);
    return () => clearTimeout(t);
  }, [charIdx, prelude.length]);

  useEffect(() => {
    const id = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 120);
    }, 3500 + Math.random() * 2000);
    return () => clearInterval(id);
  }, []);

  const choose = (lang: "ar" | "en") => {
    setChosen(lang);
    setTimeout(() => onSelect(lang), 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2 }}
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden"
      style={{ background: "radial-gradient(ellipse at center, #0a0000 0%, #000 100%)" }}
    >
      {/* Scan lines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 2px, #fff 3px)", backgroundSize: "100% 3px" }} />

      {/* Random glitch strips */}
      {glitch && (
        <>
          <div className="absolute pointer-events-none h-[2px] bg-primary/60 left-0 right-0"
            style={{ top: `${20 + Math.random() * 60}%`, transform: `translateX(${Math.random() * 10 - 5}px)` }} />
          <div className="absolute pointer-events-none h-[1px] bg-red-400/40 left-0 right-0"
            style={{ top: `${30 + Math.random() * 40}%` }} />
        </>
      )}

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.85) 100%)" }} />

      <div className="relative z-10 flex flex-col items-center gap-10 px-6 text-center max-w-sm">
        {/* Header */}
        <div className="space-y-3">
          <p className="text-[9px] tracking-[0.7em] text-primary/40 font-mono">
            {prelude.slice(0, charIdx)}
            {charIdx < prelude.length && <span style={{ animation: "blink 0.6s step-end infinite" }}>_</span>}
          </p>
          <div className="w-full h-px bg-primary/20" />
          <div
            className="text-4xl font-bold tracking-[0.5em] text-primary font-mono"
            style={{
              textShadow: glitch
                ? "2px 0 #ff0000, -2px 0 #00ffff"
                : "0 0 40px rgba(200,0,0,0.4)",
              transform: glitch ? `translateX(${Math.random() * 4 - 2}px)` : "none",
            }}
          >
            11.11
          </div>
        </div>

        {/* Language prompt */}
        <AnimatePresence>
          {charIdx >= prelude.length && !chosen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col items-center gap-6 w-full"
            >
              <p className="text-[10px] tracking-[0.4em] text-muted-foreground/50 font-mono">
                SELECT LANGUAGE // اختر اللغة
              </p>

              <div className="grid grid-cols-2 gap-4 w-full">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => choose("ar")}
                  className="border-2 border-primary/40 bg-primary/5 hover:bg-primary/15 px-6 py-5 flex flex-col items-center gap-2 transition-all duration-300 group"
                  style={{ boxShadow: "0 0 20px rgba(180,0,0,0.1)" }}
                >
                  <span className="text-2xl font-bold text-primary/90 tracking-widest font-mono group-hover:text-primary transition-colors">ع</span>
                  <span className="text-[10px] tracking-[0.35em] text-muted-foreground/50 group-hover:text-muted-foreground/80 transition-colors font-mono">العربية</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => choose("en")}
                  className="border-2 border-primary/20 bg-primary/3 hover:bg-primary/10 px-6 py-5 flex flex-col items-center gap-2 transition-all duration-300 group"
                >
                  <span className="text-2xl font-bold text-primary/70 tracking-widest font-mono group-hover:text-primary/90 transition-colors">EN</span>
                  <span className="text-[10px] tracking-[0.35em] text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors font-mono">English</span>
                </motion.button>
              </div>

              <p className="text-[8px] tracking-widest text-muted-foreground/25 font-mono">
                يمكن تغيير اللغة لاحقاً · changeable later
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chosen */}
        {chosen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <p className="text-[10px] tracking-[0.5em] text-primary/60 font-mono">
              {chosen === "ar" ? "جارٍ تهيئة البروتوكول..." : "INITIALIZING PROTOCOL..."}
            </p>
            <div className="flex justify-center gap-1 mt-3">
              {[0.2, 0.4, 0.6].map(d => (
                <div key={d} className="w-1 h-1 bg-primary/60 rounded-full"
                  style={{ animation: `blink 0.8s step-end ${d}s infinite` }} />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom tag */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center">
        <p className="text-[7px] tracking-[0.5em] text-muted-foreground/15 font-mono">
          SECTOR 11 // PROTOCOL 11.11 // ENTITY ONLINE
        </p>
      </div>
    </motion.div>
  );
}
