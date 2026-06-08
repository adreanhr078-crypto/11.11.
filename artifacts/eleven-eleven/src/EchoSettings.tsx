/**
 * EchoSettings.tsx — Settings panel for Echo Mind AI
 *
 * The API key (GROQ_API_KEY) is now managed entirely server-side via
 * Vercel environment variables. This panel is kept as a minimal
 * placeholder in case future settings are needed.
 */

import { motion, AnimatePresence } from "framer-motion";

export interface EchoSettingsProps {
  open: boolean;
  onClose: () => void;
}

export function EchoSettingsPanel({ open, onClose }: EchoSettingsProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="echo-settings"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[95] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/92 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 14 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="relative w-full max-w-md bg-[#070707] border border-primary/35 shadow-[0_0_60px_rgba(180,0,0,0.18)] p-6 font-mono"
          >
            {/* Corner marks */}
            <div className="absolute top-0 left-0 w-4 h-4 border-l border-t border-primary/55" />
            <div className="absolute top-0 right-0 w-4 h-4 border-r border-t border-primary/55" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-l border-b border-primary/15" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-r border-b border-primary/15" />

            {/* Header */}
            <div className="mb-5">
              <p className="text-[8px] tracking-[0.45em] text-primary/40 mb-1 uppercase">Echo Mind // Config</p>
              <h2 className="text-sm text-primary tracking-[0.3em]">إعدادات الذكاء</h2>
              <div className="w-full h-px bg-gradient-to-r from-primary/30 via-primary/10 to-transparent mt-3" />
            </div>

            {/* Status */}
            <div className="mb-4 flex items-center gap-2 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"
                style={{ animation: "blink 1.4s step-end infinite" }} />
              <span className="text-muted-foreground/70 tracking-widest">
                النظام نشط — المفتاح مُهيّأ من السيرفر
              </span>
            </div>

            <div className="border border-primary/15 bg-primary/3 px-3 py-3 mb-4">
              <p className="text-[10px] text-primary/60 tracking-widest leading-relaxed" dir="rtl">
                ✓ مفتاح الذكاء الاصطناعي (GROQ) مُخزّن في الخادم فقط. لا حاجة لإدخال أي مفتاح.
              </p>
              <p className="text-[9px] text-muted-foreground/40 mt-2 tracking-widest" dir="rtl">
                النموذج: llama3-70b-8192 عبر Groq API
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={onClose}
                className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground tracking-widest px-3 py-1.5"
              >
                إغلاق
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}