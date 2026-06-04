// AchievementToast — transient corner toast when an achievement unlocks
import { AnimatePresence, motion } from "framer-motion";
import { getAchievement } from "./achievements";

export interface ToastItem {
  id: number;
  achievementId: string;
}

export function AchievementToast({
  toasts,
  lang,
  onDismiss,
}: {
  toasts: ToastItem[];
  lang: "ar" | "en";
  onDismiss: (id: number) => void;
}) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[95] flex flex-col gap-2 items-center pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => {
          const a = getAchievement(t.achievementId);
          if (!a) return null;
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              onAnimationComplete={() => {
                setTimeout(() => onDismiss(t.id), 3200);
              }}
              className="pointer-events-auto bg-[#050505] border border-primary/30 px-4 py-2.5 font-mono shadow-[0_0_30px_rgba(180,0,0,0.18)] flex items-center gap-3 max-w-[300px]"
              dir={lang === "ar" ? "rtl" : "ltr"}
            >
              <span className="text-primary text-lg leading-none">{a.glyph}</span>
              <div className="min-w-0">
                <p className="text-[7px] tracking-[0.4em] text-primary/40 uppercase mb-0.5">
                  {lang === "ar" ? "إنجاز" : "Achievement"}
                </p>
                <p className="text-[11px] text-foreground/90 tracking-wide truncate">
                  {a.name[lang]}
                </p>
                <p className="text-[9px] text-muted-foreground/50 tracking-wide truncate">
                  {a.desc[lang]}
                </p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
