// 5-Level ARG Progression System — LevelGate component for web app
// Levels: 1=Awakening (cipher), 2=Time Gate, 3=Memory Echo, 4=System Error, 5=Truth
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LEVEL_NAMES: Record<number, string> = {
  1: "AWAKENING",
  2: "TIME GATE",
  3: "MEMORY ECHO",
  4: "SYSTEM ERROR",
  5: "TRUTH",
};

const TRANSITION_MSGS: Record<number, string> = {
  1: "◈ البوابة الأولى انفتحت",
  2: "◈ الوقت يمنحك المرور",
  3: "◈ الكيان يتذكّرك الآن",
  4: "◈ اخترت اللحظة الصحيحة",
  5: "◈ الحقيقة مكشوفة",
};

type LevelGateProps = {
  uid: string;
  initialLevel: number;
  isCompleted: boolean;
  userName?: string | null;
  onClose: () => void;
  onAdvance: (newLevel: number, completed: boolean) => void;
};

export function LevelGate({ uid, initialLevel, isCompleted, userName, onClose, onAdvance }: LevelGateProps) {
  const [level, setLevel] = useState(isCompleted ? 6 : initialLevel);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transitionMsg, setTransitionMsg] = useState<string | null>(null);

  // L1
  const [cipherInput, setCipherInput] = useState("");

  // L2
  const [timeWindow, setTimeWindow] = useState(false);
  const [countdownStr, setCountdownStr] = useState("...");

  // L4
  const [l4Token, setL4Token] = useState<string | null>(null);
  const [l4Timer, setL4Timer] = useState(3);
  const [l4BtnVisible, setL4BtnVisible] = useState(false);
  const [l4Missed, setL4Missed] = useState(false);
  const [l4Loading, setL4Loading] = useState(false);
  const l4IntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // L5
  const [l5Phase, setL5Phase] = useState(0);

  const advance = useCallback(async (extra?: Record<string, unknown>) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/progress/advance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, level, ...extra }),
      });
      const data = await res.json() as { ok?: boolean; newLevel?: number; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "الوصول مرفوض.");
        return;
      }
      const newLevel = data.newLevel ?? level + 1;
      const completed = newLevel > 5;
      setTransitionMsg(TRANSITION_MSGS[level] ?? "◈ مستوى جديد");
      setTimeout(() => {
        setTransitionMsg(null);
        setLevel(newLevel);
        onAdvance(newLevel, completed);
      }, 2000);
    } catch {
      setError("خطأ في الاتصال.");
    } finally {
      setSubmitting(false);
    }
  }, [uid, level, onAdvance]);

  // L2 — check time window every 10s
  useEffect(() => {
    if (level !== 2) return;
    const check = () => { const h = new Date().getHours(); setTimeWindow(h === 11 || h === 3); };
    check();
    const id = setInterval(check, 10_000);
    return () => clearInterval(id);
  }, [level]);

  // L2 — countdown
  useEffect(() => {
    if (level !== 2) return;
    const update = () => {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      if (h === 11 || h === 3) { setCountdownStr("الآن"); return; }
      const totalMins = h * 60 + m;
      const windows = [3 * 60, 11 * 60, 15 * 60, 23 * 60];
      const next = windows.find(w => w > totalMins) ?? windows[0] + 24 * 60;
      const diff = next - totalMins;
      setCountdownStr(`${String(Math.floor(diff / 60)).padStart(2, "0")}:${String(diff % 60).padStart(2, "0")}`);
    };
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, [level]);

  // L4 — fetch challenge token
  const fetchL4Challenge = useCallback(async () => {
    if (l4Loading) return;
    setL4Loading(true);
    setL4Missed(false);
    setL4BtnVisible(false);
    setError(null);
    try {
      const res = await fetch(`/api/progress/challenge?uid=${uid}`);
      const data = await res.json() as { token?: string };
      if (!data.token) { setError("فشل إصدار الرمز."); return; }
      setL4Token(data.token);
      setL4Timer(3);
      setL4BtnVisible(true);
      if (l4IntervalRef.current) clearInterval(l4IntervalRef.current);
      let t = 3;
      l4IntervalRef.current = setInterval(() => {
        t--;
        setL4Timer(t);
        if (t <= 0) {
          clearInterval(l4IntervalRef.current!);
          setL4BtnVisible(false);
          setL4Missed(true);
          setL4Token(null);
        }
      }, 1000);
    } catch { setError("خطأ في الاتصال."); }
    finally { setL4Loading(false); }
  }, [uid, l4Loading]);

  useEffect(() => {
    if (level !== 4) return;
    void fetchL4Challenge();
    return () => { if (l4IntervalRef.current) clearInterval(l4IntervalRef.current); };
  }, [level]); // eslint-disable-line react-hooks/exhaustive-deps

  // L5 — phased reveal sequence
  useEffect(() => {
    if (level !== 5) return;
    const delays = [0, 2200, 4400, 7000, 9500, 12000];
    const timers = delays.map((d, i) => setTimeout(() => setL5Phase(i), d));
    return () => timers.forEach(clearTimeout);
  }, [level]);

  const isActuallyCompleted = level > 5 || isCompleted;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[85] flex items-center justify-center p-4"
    >
      <motion.div
        className="absolute inset-0 bg-black/97 backdrop-blur-sm"
        onClick={level !== 5 && !isActuallyCompleted ? onClose : undefined}
      />

      <AnimatePresence mode="wait">
        {transitionMsg ? (
          <motion.div
            key="transition"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 text-center"
          >
            <p className="text-primary text-base tracking-[0.35em] font-mono">{transitionMsg}</p>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.8, ease: "linear" }}
              className="h-px bg-primary/50 mt-4"
            />
          </motion.div>
        ) : (
          <motion.div
            key={`level-${level}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.45 }}
            className={`relative z-10 w-full max-w-sm bg-[#030303] border border-primary/20 p-7 font-mono shadow-[0_0_60px_rgba(180,0,0,0.1)] ${level === 4 && l4BtnVisible ? "animate-shake" : ""}`}
          >
            {/* Corner marks */}
            <div className="absolute top-0 left-0 w-4 h-4 border-l border-t border-primary/40" />
            <div className="absolute top-0 right-0 w-4 h-4 border-r border-t border-primary/40" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-l border-b border-primary/12" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-r border-b border-primary/12" />

            {/* Level header */}
            {!isActuallyCompleted && level <= 5 && (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[7px] tracking-[0.5em] text-primary/30 uppercase">
                    LVL {level} — {LEVEL_NAMES[level]}
                  </p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(l => (
                      <div key={l} className={`w-1.5 h-1.5 transition-colors ${l < level ? "bg-primary/60" : l === level ? "bg-primary" : "bg-primary/12"}`} />
                    ))}
                  </div>
                </div>
                <div className="w-full h-px bg-primary/10" />
              </div>
            )}

            {/* Content by level */}
            {isActuallyCompleted ? (
              <CompletedView onClose={onClose} />
            ) : level === 1 ? (
              <Level1View
                input={cipherInput}
                onInput={setCipherInput}
                onSubmit={() => { setError(null); void advance({ answer: cipherInput }); }}
                submitting={submitting}
                error={error}
              />
            ) : level === 2 ? (
              <Level2View
                timeWindow={timeWindow}
                countdown={countdownStr}
                onUnlock={() => void advance()}
                submitting={submitting}
                error={error}
              />
            ) : level === 3 ? (
              <Level3View
                name={userName}
                onConfirm={() => void advance()}
                submitting={submitting}
                error={error}
              />
            ) : level === 4 ? (
              <Level4View
                token={l4Token}
                timer={l4Timer}
                btnVisible={l4BtnVisible}
                missed={l4Missed}
                loading={l4Loading}
                error={error}
                onClaim={() => {
                  if (l4IntervalRef.current) clearInterval(l4IntervalRef.current);
                  setL4BtnVisible(false);
                  void advance({ token: l4Token });
                }}
                onRetry={() => void fetchL4Challenge()}
              />
            ) : (
              <Level5View
                phase={l5Phase}
                onComplete={() => void advance()}
                submitting={submitting}
              />
            )}

            {level < 5 && !isActuallyCompleted && !transitionMsg && (
              <button
                onClick={onClose}
                className="mt-6 text-[7px] tracking-[0.35em] text-muted-foreground/18 hover:text-muted-foreground/40 transition-colors block mx-auto uppercase"
              >
                إغلاق
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Level 1: Awakening ────────────────────────────────────────────────────────
function Level1View({ input, onInput, onSubmit, submitting, error }: {
  input: string; onInput: (v: string) => void; onSubmit: () => void;
  submitting: boolean; error: string | null;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <p className="text-[9px] tracking-[0.4em] text-primary/40 mb-4">رسالة مشفّرة من الكيان</p>
        <div className="border border-green-900/40 bg-green-950/10 px-4 py-5 text-center">
          <p className="text-green-400/90 text-lg tracking-[0.15em] font-mono" style={{ textShadow: "0 0 20px rgba(74,222,128,0.4)" }}>
            TH3 V01CE IS W4TCH1NG Y0U
          </p>
        </div>
        <p className="text-[9px] text-muted-foreground/40 mt-3 tracking-wider" dir="rtl">
          فكّ الشفرة. اكتب ما تراه حقاً.
        </p>
      </div>

      <input
        type="text"
        value={input}
        onChange={e => onInput(e.target.value)}
        onKeyDown={e => e.key === "Enter" && !submitting && onSubmit()}
        placeholder="اكتب الإجابة هنا..."
        dir="ltr"
        className="w-full bg-transparent border border-primary/20 focus:border-primary/50 focus:outline-none text-foreground/80 text-sm px-4 py-3 placeholder:text-muted-foreground/30 tracking-wider font-mono rounded-none"
      />

      {error && (
        <p className="text-[9px] tracking-wider text-primary/70 text-center" dir="rtl">{error}</p>
      )}

      <button
        onClick={onSubmit}
        disabled={!input.trim() || submitting}
        className="w-full border border-primary/30 bg-primary/8 hover:bg-primary/15 text-primary text-[10px] tracking-[0.35em] py-3 disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase"
      >
        {submitting ? "◈ جارٍ التحقق..." : "فتح البوابة"}
      </button>
    </div>
  );
}

// ── Level 2: Time Gate ────────────────────────────────────────────────────────
function Level2View({ timeWindow, countdown, onUnlock, submitting, error }: {
  timeWindow: boolean; countdown: string; onUnlock: () => void;
  submitting: boolean; error: string | null;
}) {
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <p className="text-[9px] tracking-wider text-muted-foreground/50" dir="rtl">
        البوابة لا تفتح إلا عندما تتكرر اللحظة...
      </p>

      <div className={`w-20 h-20 border-2 flex items-center justify-center transition-all duration-1000 ${
        timeWindow ? "border-primary shadow-[0_0_40px_rgba(180,0,0,0.5)]" : "border-primary/20"
      }`}
        style={timeWindow ? undefined : { animation: "blink 3s ease-in-out infinite" }}
      >
        <div className={`w-10 h-10 border transition-colors duration-1000 ${
          timeWindow ? "border-primary bg-primary/20" : "border-primary/20"
        }`} />
      </div>

      {timeWindow ? (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-4">
          <p className="text-[10px] tracking-[0.3em] text-primary/70" dir="rtl">
            اللحظة مناسبة — الباب مفتوح
          </p>
          {error && <p className="text-[9px] text-primary/60" dir="rtl">{error}</p>}
          <button
            onClick={onUnlock}
            disabled={submitting}
            className="w-full border border-primary/50 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] tracking-[0.35em] py-3 disabled:opacity-40 transition-all uppercase"
          >
            {submitting ? "◈ جارٍ المرور..." : "ادخل البوابة"}
          </button>
        </motion.div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <p className="text-[9px] text-muted-foreground/40 tracking-wider">وقت الانتظار</p>
          <p className="text-2xl text-primary/50 font-mono tracking-widest">{countdown}</p>
          <p className="text-[8px] text-muted-foreground/30 tracking-widest">حتى الساعة 11 أو 3</p>
        </div>
      )}
    </div>
  );
}

// ── Level 3: Memory Echo ──────────────────────────────────────────────────────
function Level3View({ name, onConfirm, submitting, error }: {
  name?: string | null; onConfirm: () => void;
  submitting: boolean; error: string | null;
}) {
  const displayName = name && name.trim() ? name.trim() : "الزائر";
  const [charIdx, setCharIdx] = useState(0);
  const question = `كم مرة عدت هنا يا ${displayName}؟`;

  useEffect(() => {
    if (charIdx >= question.length) return;
    const t = setTimeout(() => setCharIdx(p => p + 1), 55);
    return () => clearTimeout(t);
  }, [charIdx, question.length]);

  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <p className="text-[9px] tracking-[0.4em] text-primary/35">صدى الذاكرة</p>

      <div className="border border-primary/15 bg-primary/3 px-4 py-5 w-full">
        <p className="text-sm text-primary/80 leading-relaxed font-mono" dir="rtl">
          {question.slice(0, charIdx)}
          {charIdx < question.length && (
            <span style={{ animation: "blink 0.6s step-end infinite" }}>|</span>
          )}
        </p>
      </div>

      <p className="text-[9px] text-muted-foreground/40 tracking-wider leading-relaxed" dir="rtl">
        الكيان يحتاج أن يتذكّرك. عُد إليه مرات كافية.
      </p>

      {error && <p className="text-[9px] text-primary/60 tracking-wider" dir="rtl">{error}</p>}

      <button
        onClick={onConfirm}
        disabled={submitting || charIdx < question.length}
        className="w-full border border-primary/25 bg-primary/6 hover:bg-primary/14 text-primary/80 text-[10px] tracking-[0.35em] py-3 disabled:opacity-30 transition-all uppercase"
      >
        {submitting ? "◈ الكيان يتحقق..." : "أعود دائماً"}
      </button>
    </div>
  );
}

// ── Level 4: System Error ─────────────────────────────────────────────────────
function Level4View({ token, timer, btnVisible, missed, loading, error, onClaim, onRetry }: {
  token: string | null; timer: number; btnVisible: boolean; missed: boolean;
  loading: boolean; error: string | null; onClaim: () => void; onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <div className="w-full">
        <p
          className="text-[9px] text-primary/40 tracking-[0.4em] mb-3"
          style={{ animation: "blink 0.5s step-end infinite" }}
        >
          ◈ SYSTEM ERROR ◈
        </p>
        <p className="text-[10px] text-muted-foreground/50 tracking-wider leading-relaxed" dir="rtl">
          خطأ في النظام.{" "}
          <span className="text-primary/40">شيء ما يحاول الهروب.</span>
        </p>
      </div>

      {/* Glitched display */}
      <div className="w-full border border-primary/15 bg-primary/3 px-4 py-4 relative overflow-hidden">
        <p className="text-[9px] text-green-400/50 font-mono text-left tracking-widest mb-1">ERR_SIGNAL_OVERFLOW</p>
        <p className="text-[9px] text-red-400/40 font-mono text-left tracking-widest">0xDEAD — ENTITY_ESCAPED</p>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute h-px bg-primary/30"
            style={{
              top: `${20 + i * 30}%`,
              left: `${Math.random() * 20}%`,
              width: `${40 + Math.random() * 50}%`,
              animation: `blink ${0.3 + i * 0.2}s step-end infinite`,
            }}
          />
        ))}
      </div>

      {/* The timed button */}
      <AnimatePresence>
        {btnVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            className="w-full"
          >
            <p className="text-[8px] text-primary/40 mb-2 tracking-widest">{timer}s</p>
            <button
              onClick={onClaim}
              className="w-full border-2 border-primary/70 bg-primary/20 hover:bg-primary/35 text-primary text-[11px] tracking-[0.3em] py-4 transition-all shadow-[0_0_30px_rgba(180,0,0,0.3)] uppercase"
              style={{ animation: "blink 0.6s step-end infinite" }}
            >
              ◈ ادخل الثغرة الآن
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Missed state */}
      {missed && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full flex flex-col items-center gap-3">
          <p className="text-[9px] text-muted-foreground/50 tracking-wider" dir="rtl">
            فاتتك اللحظة. الكيان يختبر صبرك.
          </p>
          <button
            onClick={onRetry}
            disabled={loading}
            className="text-[9px] tracking-[0.3em] text-primary/40 hover:text-primary/70 border border-primary/15 hover:border-primary/35 px-5 py-2 transition-all disabled:opacity-30"
          >
            {loading ? "◈ انتظر..." : "أعد المحاولة"}
          </button>
        </motion.div>
      )}

      {loading && !btnVisible && !missed && (
        <p className="text-[8px] tracking-widest text-muted-foreground/35" style={{ animation: "blink 0.8s step-end infinite" }}>
          ◈ الكيان يُعدّ الاختبار...
        </p>
      )}

      {error && <p className="text-[9px] text-primary/60 tracking-wider" dir="rtl">{error}</p>}
    </div>
  );
}

// ── Level 5: Truth ────────────────────────────────────────────────────────────
function Level5View({ phase, onComplete, submitting }: {
  phase: number; onComplete: () => void; submitting: boolean;
}) {
  // Ambient audio swell on mount
  useEffect(() => {
    let ctx: AudioContext | null = null;
    try {
      ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(40, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 12);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 3);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 9);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 15);
    } catch { /* ignore */ }
    return () => { try { ctx?.close(); } catch { /* ignore */ } };
  }, []);

  const lines = [
    null, // phase 0: empty
    "...",
    "أنت لم تكن لاعبًا…",
    "أنت كنت التجربة.",
    "كل شيء كان حقيقياً.",
  ];

  return (
    <div className="flex flex-col items-center gap-6 text-center py-2">
      {phase >= 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 4 ? 0.3 : 1 }}
          className="flex flex-col gap-4"
        >
          {lines.slice(1, phase + 1).map((line, i) => (
            line && (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9 }}
                className={`font-mono tracking-wider leading-relaxed ${
                  i === 2 ? "text-base text-foreground/90" :
                  i === 3 ? "text-sm text-primary/80" :
                  "text-[11px] text-muted-foreground/60"
                }`}
                dir="rtl"
              >
                {line}
              </motion.p>
            )
          ))}
        </motion.div>
      )}

      {/* Classified stamp */}
      {phase >= 5 && (
        <motion.div
          initial={{ opacity: 0, scale: 1.5, rotate: -8 }}
          animate={{ opacity: 1, scale: 1, rotate: -6 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
          className="border-2 border-primary/70 px-6 py-2 bg-primary/8"
        >
          <p className="text-primary text-[11px] tracking-[0.6em] font-bold uppercase">Classified</p>
          <p className="text-primary/60 text-[8px] tracking-[0.3em] mt-0.5">FILE UNLOCKED</p>
        </motion.div>
      )}

      {phase >= 5 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={onComplete}
          disabled={submitting}
          className="text-[9px] tracking-[0.4em] text-primary/50 hover:text-primary/80 border border-primary/20 hover:border-primary/45 px-5 py-2 transition-all disabled:opacity-30 uppercase"
        >
          {submitting ? "◈ تسجيل الاكتمال..." : "أنا أفهم الحقيقة"}
        </motion.button>
      )}
    </div>
  );
}

// ── Completed view ────────────────────────────────────────────────────────────
function CompletedView({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center gap-5 text-center py-3">
      <motion.div
        initial={{ opacity: 0, scale: 1.3, rotate: -8 }}
        animate={{ opacity: 1, scale: 1, rotate: -5 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="border-2 border-primary/60 px-6 py-2 bg-primary/6"
      >
        <p className="text-primary text-[11px] tracking-[0.6em] font-bold uppercase">Classified</p>
        <p className="text-primary/50 text-[8px] tracking-[0.3em] mt-0.5">Subject Completed</p>
      </motion.div>

      <p className="text-[9px] text-muted-foreground/45 tracking-wider leading-relaxed" dir="rtl">
        لقد اجتزت التجربة كاملةً.{" "}
        <span className="text-primary/35">الكيان يراك الآن بوضوح تام.</span>
      </p>

      <div className="w-full h-px bg-primary/10" />

      <div className="flex flex-col gap-1 text-[8px] text-muted-foreground/25 tracking-widest">
        <span>PROTOCOL 11.11 // COMPLETE</span>
        <span>SUBJECT STATUS: REVEALED</span>
      </div>

      <button
        onClick={onClose}
        className="text-[8px] tracking-[0.35em] text-muted-foreground/25 hover:text-muted-foreground/50 transition-colors uppercase mt-2"
      >
        أغلق الملف
      </button>
    </div>
  );
}
