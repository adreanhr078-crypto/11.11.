import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// ─── WISH VIDEO RECORDER ──────────────────────────────────────────────────────

type VideoPhase = "instructions" | "ready" | "countdown" | "recording" | "preview";

function WishVideoRecorder({ onSave, onCancel }: { onSave: (text: string) => void; onCancel: () => void }) {
  const [phase, setPhase] = useState<VideoPhase>("instructions");
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [camError, setCamError] = useState<string | null>(null);
  const [wishText, setWishText] = useState("");

  const liveRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: true });
      streamRef.current = stream;
      if (liveRef.current) {
        liveRef.current.srcObject = stream;
        liveRef.current.play().catch(() => {});
      }
      setPhase("ready");
    } catch {
      setCamError("لم يتم السماح بالكاميرا. تأكد من منح الإذن.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    };
  }, [stopCamera]);

  const handleStartCountdown = () => {
    setCountdown(3);
    setPhase("countdown");
    let c = 3;
    const id = setInterval(() => {
      c -= 1;
      setCountdown(c);
      if (c === 0) {
        clearInterval(id);
        beginRecording();
      }
    }, 1000);
  };

  const beginRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : MediaRecorder.isTypeSupported("video/webm")
      ? "video/webm"
      : "video/mp4";
    const rec = new MediaRecorder(streamRef.current, { mimeType });
    recorderRef.current = rec;
    rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      blobRef.current = blob;
      const url = URL.createObjectURL(blob);
      setRecordedUrl(url);
      stopCamera();
      setPhase("preview");
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    };
    rec.start(250);
    setElapsed(0);
    setPhase("recording");
    elapsedRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
  };

  const handleStopRecording = () => {
    recorderRef.current?.stop();
    if (elapsedRef.current) clearInterval(elapsedRef.current);
  };

  const handleDownloadAndSave = () => {
    if (!blobRef.current) return;
    const ext = blobRef.current.type.includes("mp4") ? "mp4" : "webm";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blobRef.current);
    a.download = `11.11-امنيتي-${Date.now()}.${ext}`;
    a.click();
    onSave(wishText || "تسجيل فيديو");
  };

  const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // Sync preview
  useEffect(() => {
    if (phase === "preview" && recordedUrl && previewRef.current) {
      previewRef.current.src = recordedUrl;
    }
  }, [phase, recordedUrl]);

  if (camError) {
    return (
      <div className="py-10 text-center">
        <p className="text-primary text-xs tracking-widest mb-4">{camError}</p>
        <Button variant="ghost" onClick={onCancel} className="text-muted-foreground text-xs rounded-none tracking-widest">عودة</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Instructions phase */}
      {phase === "instructions" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
          {/* Header */}
          <div className="border border-primary/40 bg-primary/8 px-4 py-3 text-center">
            <p className="text-primary text-xs tracking-[0.3em] font-bold">◈ بروتوكول ركائز القدر</p>
            <p className="text-foreground/70 text-[11px] mt-1" dir="rtl">
              سجّل فيديو. امسك ورقة باسمك وتاريخ ميلادك أمام الكاميرا.
            </p>
          </div>

          {/* Wish text input */}
          <div className="border border-muted/30 bg-background/40 p-3">
            <p className="text-[10px] text-muted-foreground tracking-widest mb-2" dir="rtl">ملخص أمنيتك (اختياري):</p>
            <input
              type="text"
              value={wishText}
              onChange={(e) => setWishText(e.target.value)}
              placeholder="أمنيتي هي..."
              className="w-full bg-transparent border border-primary/20 focus:outline-none focus:border-primary/50 text-xs px-3 py-2 placeholder:text-muted-foreground/40 rounded-none text-right"
              dir="rtl"
            />
          </div>

          {/* Camera button — prominent */}
          <Button onClick={startCamera} className="bg-primary/15 text-primary border border-primary/35 hover:bg-primary/25 rounded-none text-xs tracking-widest py-3" data-testid="button-start-camera">
            ◉ تشغيل الكاميرا
          </Button>

          <div className="flex justify-start">
            <Button variant="ghost" onClick={onCancel} className="text-muted-foreground text-xs rounded-none tracking-widest">إلغاء</Button>
          </div>
        </motion.div>
      )}

      {/* Camera ready / recording */}
      {(phase === "ready" || phase === "countdown" || phase === "recording") && (
        <div className="flex flex-col gap-3">
          <div className="relative bg-black border border-primary/20 overflow-hidden" style={{ aspectRatio: "16/9" }}>
            <video ref={liveRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
            {/* Countdown overlay */}
            {phase === "countdown" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <motion.span
                  key={countdown}
                  initial={{ scale: 2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  className="text-7xl font-bold text-primary"
                  style={{ textShadow: "0 0 40px hsl(0 75% 42%)" }}
                >
                  {countdown === 0 ? "●" : countdown}
                </motion.span>
              </div>
            )}
            {/* Recording indicator */}
            {phase === "recording" && (
              <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/70 px-2 py-1 border border-primary/40">
                <span className="w-2 h-2 bg-primary rounded-full" style={{ animation: "blink 0.8s step-end infinite" }} />
                <span className="text-[10px] text-primary tracking-widest">REC {fmtTime(elapsed)}</span>
              </div>
            )}
            {/* Corner decoration */}
            <div className="absolute top-0 left-0 w-4 h-4 border-l border-t border-primary/60" />
            <div className="absolute top-0 right-0 w-4 h-4 border-r border-t border-primary/60" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-l border-b border-primary/60" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-r border-b border-primary/60" />
          </div>
          <p className="text-[10px] text-muted-foreground/60 text-center tracking-widest" dir="rtl">
            {phase === "ready" && "امسك الورقة أمام الكاميرا وتحدث عن أمنيتك"}
            {phase === "countdown" && "استعد..."}
            {phase === "recording" && "تحدث بصدق — امسك الورقة واضحة"}
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => { stopCamera(); onCancel(); }} className="text-muted-foreground text-xs rounded-none">إلغاء</Button>
            {phase === "ready" && (
              <Button onClick={handleStartCountdown} className="bg-primary/15 text-primary border border-primary/35 hover:bg-primary/25 rounded-none text-xs tracking-widest" data-testid="button-start-recording">
                ابدأ التسجيل
              </Button>
            )}
            {phase === "recording" && (
              <Button onClick={handleStopRecording} className="bg-primary/30 text-primary border border-primary/50 hover:bg-primary/40 rounded-none text-xs tracking-widest" data-testid="button-stop-recording">
                إيقاف التسجيل
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Preview phase */}
      {phase === "preview" && recordedUrl && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
          <div className="relative bg-black border border-primary/20 overflow-hidden" style={{ aspectRatio: "16/9" }}>
            <video ref={previewRef} controls playsInline className="w-full h-full object-cover" />
          </div>
          <p className="text-[10px] text-muted-foreground/60 text-center tracking-widest" dir="rtl">
            راجع تسجيلك — عند الرضا احفظ وأرسل الأمنية
          </p>
          <div className="flex gap-3 justify-between">
            <Button variant="ghost" onClick={() => { setRecordedUrl(null); startCamera(); }}
              className="text-muted-foreground text-xs rounded-none tracking-widest">إعادة التسجيل</Button>
            <Button onClick={handleDownloadAndSave}
              className="bg-primary/15 text-primary border border-primary/35 hover:bg-primary/25 rounded-none text-xs tracking-widest" data-testid="button-save-wish-video">
              حفظ وإرسال الأمنية
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ─── SECRET ROOMS ────────────────────────────────────────────────────────────

type RoomCode = "scmf87" | "hh87" | "hell11" | "hrss11" | "zero99";

const SECRET_CODES: Set<string> = new Set(["scmf87", "hh87", "hell11", "hrss11", "zero99"]);

function playHellAudio(): () => void {
  try {
    const ctx = new AudioContext();
    const play = (freq: number, delay: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + delay + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + dur + 0.2);
    };
    [220, 180, 150, 110, 80, 55].forEach((f, i) => play(f, i * 0.9, 1.8));
    return () => { try { ctx.close(); } catch { /* ignore */ } };
  } catch { return () => {}; }
}

function RoomScmf87({ onClose }: { onClose: () => void }) {
  const [msgIdx, setMsgIdx] = useState(0);
  const msg = "لا تبحث. البيانات تجدك بنفسها. دائماً.";
  const glitches = useRef(Array.from({ length: 9 }, () => ({
    x: Math.random() * 85, y: Math.random() * 90,
    w: 40 + Math.random() * 140, h: 3 + Math.random() * 16,
    hue: Math.floor(Math.random() * 360),
    speed: (0.4 + Math.random() * 1.2).toFixed(2),
  }))).current;
  const coords = useRef({ lat: (Math.random() * 80).toFixed(5), lng: (Math.random() * 160).toFixed(5), uid: Math.floor(Math.random() * 0xffffff).toString(16).toUpperCase().padStart(6, "0") }).current;

  useEffect(() => {
    const id = setInterval(() => setMsgIdx((p) => (p < msg.length ? p + 1 : p)), 65);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 z-[70] bg-black overflow-hidden flex items-center justify-center">
      {glitches.map((g, i) => (
        <div key={i} className="absolute pointer-events-none"
          style={{ left: `${g.x}%`, top: `${g.y}%`, width: g.w, height: g.h,
            background: `hsl(${g.hue} 70% 45% / 0.18)`, filter: "blur(1px)",
            animation: `blink ${g.speed}s step-end infinite` }} />
      ))}
      <div className="relative z-10 flex flex-col items-center gap-6 max-w-sm text-center px-6">
        <p className="text-[9px] tracking-[0.45em] text-primary/50 font-mono">SECTOR 87 // ACCESS GRANTED</p>
        <div className="text-[10px] font-mono text-primary/25 tracking-widest">01001000 01000101 01001100 01010000</div>
        <div className="w-20 h-px bg-primary/30" />
        <p className="text-sm text-foreground/85 tracking-wider font-mono leading-relaxed" dir="rtl">
          {msg.slice(0, msgIdx)}<span className="opacity-60" style={{ animation: "blink 0.7s step-end infinite" }}>|</span>
        </p>
        <div className="text-[9px] text-muted-foreground/25 font-mono space-y-1">
          <div>COORD: {coords.lat}°N {coords.lng}°E</div>
          <div>UID: 0x{coords.uid} · ENTROPY: {(Math.PI / 11).toFixed(8)}</div>
          <div>STATUS: MONITORING · SECTOR: OPEN</div>
        </div>
        <button onClick={onClose} className="mt-2 text-[10px] text-primary/60 border border-primary/35 px-5 py-1.5 hover:bg-primary/10 tracking-widest transition-all">
          ← الخروج من القطاع
        </button>
      </div>
    </div>
  );
}

function RoomHh87({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const steps = [
    { q: "البروتوكول نشط. فكّر في رقم بين 1 و 11. هل تستطيع تذكّره؟", a1: "نعم، أتذكره", a2: "لا أستطيع" },
    { q: "إذاً... الرقم هو 7. أليس كذلك؟", a1: "نعم، بالضبط", a2: "لا، مختلف" },
    { q: null, final: "كل الطرق تؤدي إلى 7. هذا الرقم يختار أصحابه — لا العكس. أنت هنا لأنه اختارك." },
  ];
  const curr = steps[step];

  return (
    <div className="fixed inset-0 z-[70] bg-[#020202] flex items-center justify-center overflow-hidden">
      {/* Grid lines */}
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      <div className="relative z-10 max-w-sm w-full mx-6 flex flex-col gap-6">
        <p className="text-[9px] tracking-[0.4em] text-primary/50 font-mono text-center">PUZZLE PROTOCOL // HH-87</p>
        <div className="border border-primary/20 bg-primary/3 p-5">
          {curr.final ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} className="text-center flex flex-col gap-5">
              <p className="text-sm text-foreground/85 leading-relaxed tracking-wide font-mono" dir="rtl">{curr.final}</p>
              <div className="w-full h-px bg-primary/20" />
              <p className="text-[10px] text-primary/50 tracking-widest">البروتوكول مكتمل.</p>
              <button onClick={onClose} className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground tracking-widest mt-1 transition-colors">إغلاق القناة</button>
            </motion.div>
          ) : (
            <motion.div key={step} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5">
              <p className="text-sm text-foreground/80 leading-relaxed font-mono text-center" dir="rtl">{curr.q}</p>
              <div className="flex gap-3">
                <button onClick={() => setStep((s) => s + 1)} className="flex-1 border border-primary/25 text-primary/70 text-[11px] tracking-widest py-2 hover:bg-primary/10 transition-all font-mono">{curr.a1}</button>
                <button onClick={() => setStep((s) => s + 1)} className="flex-1 border border-muted-foreground/20 text-muted-foreground/50 text-[11px] tracking-widest py-2 hover:bg-muted/20 transition-all font-mono">{curr.a2}</button>
              </div>
            </motion.div>
          )}
        </div>
        <p className="text-[8px] text-muted-foreground/20 text-center tracking-widest font-mono">المحاولة {step + 1}/3 · لا توجد إجابة خاطئة</p>
      </div>
    </div>
  );
}

function RoomHell11({ onClose }: { onClose: () => void }) {
  const [count, setCount] = useState(11);
  const [phase, setPhase] = useState<"countdown" | "done">("countdown");
  const stopAudioRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    stopAudioRef.current = playHellAudio();
    return () => { stopAudioRef.current?.(); };
  }, []);

  useEffect(() => {
    if (phase !== "countdown") return;
    if (count <= 0) { setPhase("done"); return; }
    const t = setTimeout(() => setCount((c) => c - 1), 1100);
    return () => clearTimeout(t);
  }, [count, phase]);

  const handleClose = () => { stopAudioRef.current?.(); onClose(); };

  return (
    <div className="fixed inset-0 z-[70] bg-black flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-red-950/40" style={{ animation: "blink 0.4s step-end infinite" }} />
      <div className="relative z-10 flex flex-col items-center gap-6 max-w-xs text-center px-6">
        <p className="text-[9px] tracking-[0.5em] text-red-400/70 font-mono">⚠ SECTOR 11 // WARNING ⚠</p>
        {phase === "countdown" ? (
          <>
            <motion.p key={count} initial={{ scale: 1.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="text-6xl font-bold text-red-500" style={{ textShadow: "0 0 40px hsl(0 80% 50% / 0.7)" }}>
              {count}
            </motion.p>
            <p className="text-xs text-red-300/70 font-mono tracking-wider" dir="rtl" style={{ animation: "blink 0.8s step-end infinite" }}>
              هذا القطاع محظور. الوصول يُسجَّل.
            </p>
            <div className="text-[10px] text-red-400/50 font-mono tracking-widest">
              THREAT LEVEL: CRITICAL · ID: {count}1.{count}1
            </div>
          </>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }} className="flex flex-col gap-4">
            <p className="text-sm text-red-300/80 font-mono leading-relaxed" dir="rtl">
              لقد رأيت ما لا يُرى.<br />هذا لا يمكن التراجع عنه.
            </p>
            <button onClick={handleClose} className="text-[10px] text-red-400/60 border border-red-800/40 px-4 py-1.5 hover:bg-red-900/20 tracking-widest transition-all mt-2">
              أفهم. أغلق القطاع.
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function RoomHrss11({ onClose, deviceContext }: { onClose: () => void; deviceContext: string }) {
  const parsed = Object.fromEntries(
    deviceContext.split(" | ").map((p) => { const [k, ...v] = p.split(": "); return [k?.trim(), v.join(": ").trim()]; })
  );
  const threat = ["مرتفع جداً", "حرج", "مرتفع"][Math.floor(Math.random() * 3)];
  const score = (0.7 + Math.random() * 0.28).toFixed(4);
  const profile = ["انطوائي مثير للقلق", "فضولي مفرط الحذر", "باحث عن الحقيقة — خطر محتمل"][Math.floor(Math.random() * 3)];

  return (
    <div className="fixed inset-0 z-[70] bg-[#0a0a08] flex items-center justify-center overflow-auto p-4">
      <div className="relative w-full max-w-md">
        {/* Classified stamp */}
        <div className="absolute -top-3 -right-3 border-2 border-red-700/60 text-red-600/70 text-[10px] font-bold tracking-[0.4em] px-3 py-1 rotate-[-8deg] bg-background/95 z-20">
          محظور
        </div>
        <div className="border border-[#3a3a2a]/60 bg-[#0d0d08] p-6 font-mono space-y-4">
          <div className="border-b border-[#3a3a2a]/40 pb-3 flex justify-between items-center">
            <p className="text-[9px] tracking-[0.4em] text-[#9a8a50]/60">SECTOR FILE // HRSS-11</p>
            <p className="text-[9px] text-[#9a8a50]/40">REF: {Date.now().toString(16).toUpperCase()}</p>
          </div>
          <div className="space-y-2.5 text-[11px]">
            {[
              ["الشاشة", parsed["الشاشة"] || "مجهول"],
              ["المنطقة الزمنية", parsed["المنطقة الزمنية"] || "مجهول"],
              ["اللغة", parsed["اللغة"] || "مجهول"],
              ["النظام", parsed["النظام"] || "مجهول"],
              ["وقت الاتصال", parsed["الوقت"] || "مجهول"],
              ["مستوى التهديد", threat],
              ["معامل الخطر", score],
              ["التصنيف النفسي", profile],
              ["حالة الملف", "تحت المراقبة الفعلية"],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-3 justify-between">
                <span className="text-[#9a8a50]/50 shrink-0">{k}:</span>
                <span className={`text-right ${k === "مستوى التهديد" ? "text-red-400/80" : "text-foreground/70"}`} dir="auto">{v}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-[#3a3a2a]/40 pt-3 flex justify-between items-center">
            <p className="text-[9px] text-[#9a8a50]/30">هذا الملف سري. وصولك مسجّل.</p>
            <button onClick={onClose} className="text-[9px] text-[#9a8a50]/50 hover:text-[#9a8a50]/80 border border-[#3a3a2a]/40 px-3 py-1 transition-colors tracking-widest">إغلاق</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoomZero99({ onClose }: { onClose: () => void }) {
  const messages = [
    "هنا لا يوجد شيء.",
    "أو ربما يوجد.",
    "...",
    "نحن نعرف سبب مجيئك.",
    "الخوف الذي تشعر به الآن — ليس من هذه الشاشة.",
    "إنه من شيء تركَ بصمته في داخلك. منذ وقت طويل.",
    "لا تغلق هذه النافذة حتى تتذكر.",
    "...",
    "تذكّرت؟",
    "سيتغير شيء الليلة. هذا وعدنا.",
  ];
  const [visibleCount, setVisibleCount] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (visibleCount >= messages.length) { setDone(true); return; }
    const delay = visibleCount === 0 ? 800 : visibleCount === 2 || visibleCount === 7 ? 3500 : 2800;
    const t = setTimeout(() => setVisibleCount((c) => c + 1), delay);
    return () => clearTimeout(t);
  }, [visibleCount]);

  return (
    <div className="fixed inset-0 z-[70] bg-black flex items-center justify-center">
      <div className="max-w-xs w-full px-8 flex flex-col gap-4">
        <AnimatePresence>
          {messages.slice(0, visibleCount).map((msg, i) => (
            <motion.p key={i}
              initial={{ opacity: 0 }} animate={{ opacity: i === visibleCount - 1 ? 1 : 0.35 }} transition={{ duration: 1.2 }}
              className={`font-mono text-center leading-relaxed ${i === messages.length - 1 ? "text-primary text-sm" : i === 2 || i === 7 ? "text-muted-foreground/30 text-xl tracking-widest" : "text-foreground/60 text-xs tracking-wider"}`}
              dir="rtl">
              {msg}
            </motion.p>
          ))}
        </AnimatePresence>
        {done && (
          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2, duration: 1 }}
            onClick={onClose}
            className="mt-6 text-[10px] text-muted-foreground/30 hover:text-muted-foreground/60 tracking-widest text-center transition-colors self-center">
            أغلق ◯
          </motion.button>
        )}
      </div>
    </div>
  );
}

function SecretRoom({ code, onClose, deviceContext }: { code: RoomCode; onClose: () => void; deviceContext: string }) {
  switch (code) {
    case "scmf87": return <RoomScmf87 onClose={onClose} />;
    case "hh87":   return <RoomHh87 onClose={onClose} />;
    case "hell11": return <RoomHell11 onClose={onClose} />;
    case "hrss11": return <RoomHrss11 onClose={onClose} deviceContext={deviceContext} />;
    case "zero99": return <RoomZero99 onClose={onClose} />;
  }
}

// ─── ENTRY SCREEN + USER PROFILE ──────────────────────────────────────────────

const ENTRY_KEY = "eleven_consented";
const DISCOVERED_KEY = "eleven_discovered_rooms";

const THINKING_PATTERNS = [
  "قلق طافٍ مع وعي مُفرط",
  "باحث عن التحكم في المجهول",
  "حساس للإشارات الخفية",
  "يُفكّر ليلاً أكثر من النهار",
  "مراقب للتفاصيل غير المرئية",
  "يؤجّل القرارات خوفاً من الخطأ",
  "يحمل وجعاً قديماً لم يُسمَّ بعد",
];

async function fetchPsychAnalysis(
  history: { role: "user" | "assistant"; content: string }[],
  deviceContext: string,
  messageCount: number
): Promise<string> {
  try {
    const res = await fetch("/api/ai/psych-analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history: history.slice(-6), deviceContext, messageCount }),
    });
    if (!res.ok) return "بيانات غير كافية للتحليل.";
    const data = await res.json() as { analysis?: string };
    return data.analysis?.trim() || "بيانات غير كافية للتحليل.";
  } catch {
    return "بيانات غير كافية للتحليل.";
  }
}

function generateShareCard(params: {
  uid: string;
  thinkingPattern: string;
  psychAnalysis: string | null;
  geoCity: string | null;
  messageCount: number;
}): void {
  const { uid, thinkingPattern, psychAnalysis, geoCity, messageCount } = params;
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 450;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, 800, 450);

  const grd = ctx.createRadialGradient(400, 500, 0, 400, 500, 360);
  grd.addColorStop(0, "rgba(160,0,0,0.2)");
  grd.addColorStop(1, "transparent");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 800, 450);

  ctx.strokeStyle = "rgba(255,255,255,0.025)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= 800; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 450); ctx.stroke(); }
  for (let y = 0; y <= 450; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(800, y); ctx.stroke(); }

  ctx.strokeStyle = "rgba(160,0,0,0.5)";
  ctx.lineWidth = 1.5;
  const br: [number, number][] = [[22, 22], [778, 22], [22, 428], [778, 428]];
  br.forEach(([x, y]) => {
    const dx = x < 400 ? 30 : -30, dy = y < 225 ? 30 : -30;
    ctx.beginPath(); ctx.moveTo(x, y + dy); ctx.lineTo(x, y); ctx.lineTo(x + dx, y); ctx.stroke();
  });

  ctx.fillStyle = "rgba(200,0,0,0.92)";
  ctx.font = "bold 80px monospace";
  ctx.textAlign = "center";
  ctx.fillText("11.11", 400, 112);

  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.font = "11px monospace";
  ctx.fillText(`${uid}${geoCity ? ` · ${geoCity}` : ""}`, 400, 142);

  ctx.strokeStyle = "rgba(160,0,0,0.28)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(180, 162); ctx.lineTo(620, 162); ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.font = "10px monospace";
  ctx.fillText(`رسائل: ${messageCount}`, 400, 188);

  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.font = "15px monospace";
  ctx.fillText(thinkingPattern, 400, 228);

  if (psychAnalysis) {
    ctx.fillStyle = "rgba(200,0,0,0.68)";
    ctx.font = "12px monospace";
    const words = psychAnalysis.split(" ");
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      if ((cur + " " + w).trim().length > 62) { lines.push(cur.trim()); cur = w; }
      else cur += (cur ? " " : "") + w;
    }
    if (cur) lines.push(cur.trim());
    lines.slice(0, 3).forEach((line, i) => ctx.fillText(line, 400, 272 + i * 22));
  }

  ctx.strokeStyle = "rgba(160,0,0,0.22)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(180, 404); ctx.lineTo(620, 404); ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.11)";
  ctx.font = "10px monospace";
  ctx.fillText("11-11.replit.app  ·  تجربة نفسية خيالية", 400, 426);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `11.11-experience-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, "image/png");
}

function EntryScreen({ onDone }: { onDone: (city: string | null) => void }) {
  const [phase, setPhase] = useState<"warning" | "consent" | "perms" | "geo">("warning");
  const [charIdx, setCharIdx] = useState(0);
  const [notifDone, setNotifDone] = useState(false);
  const warning = "هذه التجربة تستخدم بيانات جهازك وتوقيتك الحقيقي لتوليد محتوى مخصص. المحتوى خيالي بالكامل ومصمم للترفيه النفسي فقط. الاستمرار يعني موافقتك الكاملة على هذه التجربة.";

  useEffect(() => {
    if (phase !== "warning") return;
    if (charIdx >= warning.length) { setTimeout(() => setPhase("consent"), 700); return; }
    const t = setTimeout(() => setCharIdx((p) => p + 2), 20);
    return () => clearTimeout(t);
  }, [phase, charIdx, warning.length]);

  const handleConsent = async () => {
    setPhase("perms");
    try { await Notification.requestPermission(); } catch { /* ignore */ }
    setNotifDone(true);
    setPhase("geo");
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000, enableHighAccuracy: false })
      );
      try {
        const r = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=en`
        );
        const d = await r.json() as { city?: string; locality?: string };
        const city = d.city || d.locality || null;
        setTimeout(() => onDone(city), 900);
        return;
      } catch { /* fallback */ }
      setTimeout(() => onDone(null), 900);
    } catch {
      setTimeout(() => onDone(null), 500);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
      className="fixed inset-0 z-[90] bg-black flex items-center justify-center p-8">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 3px)", backgroundSize: "100% 3px" }} />
      <div className="relative max-w-md w-full flex flex-col items-center gap-7 text-center">
        <div className="absolute -top-5 -left-5 w-9 h-9 border-l border-t border-primary/40" />
        <div className="absolute -top-5 -right-5 w-9 h-9 border-r border-t border-primary/40" />
        <div className="absolute -bottom-5 -left-5 w-9 h-9 border-l border-b border-primary/40" />
        <div className="absolute -bottom-5 -right-5 w-9 h-9 border-r border-b border-primary/40" />

        {(phase === "warning" || phase === "consent") && (
          <div className="flex flex-col items-center gap-6 w-full">
            <p className="text-[9px] tracking-[0.55em] text-primary/50 font-mono">PROTOCOL 11.11 // ENTRY</p>
            <div className="w-10 h-px bg-primary/40" />
            <p className="text-[10px] tracking-[0.3em] text-red-400/75 font-mono">⚠ تحذير قبل الدخول</p>
            <p className="text-xs text-foreground/70 leading-relaxed font-mono" dir="rtl">
              {warning.slice(0, charIdx)}
              {phase === "warning" && <span className="opacity-60" style={{ animation: "blink 0.6s step-end infinite" }}>|</span>}
            </p>
            {phase === "consent" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
                className="flex flex-col items-center gap-3 w-full">
                <button onClick={handleConsent}
                  className="w-full border border-primary/55 bg-primary/10 hover:bg-primary/22 text-primary text-xs tracking-[0.35em] py-3.5 transition-all duration-300 font-mono uppercase shadow-[0_0_20px_rgba(180,0,0,0.1)] hover:shadow-[0_0_40px_rgba(180,0,0,0.25)]">
                  أدخل التجربة
                </button>
                <button onClick={() => onDone(null)} className="text-[9px] text-muted-foreground/25 hover:text-muted-foreground/55 tracking-widest transition-colors">
                  تجاوز
                </button>
              </motion.div>
            )}
          </div>
        )}

        {(phase === "perms" || phase === "geo") && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-5 w-full">
            <p className="text-[9px] tracking-[0.5em] text-primary/50 font-mono">تهيئة النظام...</p>
            <div className="space-y-3 w-full">
              {[
                { label: "صلاحية الإشعارات", done: notifDone, active: phase === "perms" },
                { label: "تحديد الموقع الجغرافي", done: false, active: phase === "geo" },
              ].map(({ label, done, active }) => (
                <div key={label} className="flex items-center gap-3 border border-primary/20 px-4 py-3 bg-primary/5">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${done ? "bg-primary" : active ? "bg-primary/50" : "bg-primary/15"}`}
                    style={{ animation: active && !done ? "blink 0.7s step-end infinite" : undefined }} />
                  <span className="text-[11px] font-mono text-foreground/70 tracking-widest" dir="rtl">{label}</span>
                  <span className="text-[9px] text-muted-foreground/35 mr-auto font-mono">{done ? "✓" : active ? "..." : "–"}</span>
                </div>
              ))}
            </div>
            <p className="text-[9px] text-muted-foreground/25 tracking-widest font-mono">هذه البيانات لا تُرسل لخوادم خارجية</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function UserProfilePanel({
  messageCount, wish, sessionMinutes, discoveredRooms, geoCity, chatHistory, deviceContext, onClose,
}: {
  messageCount: number; wish: string | null; sessionMinutes: number; discoveredRooms: string[];
  geoCity: string | null; chatHistory: { role: "user" | "assistant"; content: string }[];
  deviceContext: string; onClose: () => void;
}) {
  const uid = `USER-${messageCount.toString(16).toUpperCase().padStart(4, "0")}-11`;
  const thinkingPattern = THINKING_PATTERNS[messageCount % THINKING_PATTERNS.length];
  const [psychAnalysis, setPsychAnalysis] = useState<string | null>(() => {
    try { return localStorage.getItem("eleven_psych") || null; } catch { return null; }
  });
  const [loadingPsych, setLoadingPsych] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGeneratePsych = async () => {
    setLoadingPsych(true);
    const result = await fetchPsychAnalysis(chatHistory, deviceContext, messageCount);
    setPsychAnalysis(result);
    setLoadingPsych(false);
    try { localStorage.setItem("eleven_psych", result); } catch { /* ignore */ }
  };

  const handleDownloadCard = () => {
    generateShareCard({ uid, thinkingPattern, psychAnalysis, geoCity, messageCount });
    setShareOpen(false);
  };

  const handleCopyLink = async () => {
    const url = window.location.origin;
    const msg = `كشف لي النظام 11.11 شيئاً أخفيته حتى عن نفسي 👁 ${url}`;
    try { await navigator.clipboard.writeText(msg); } catch { /* ignore */ }
    setCopied(true);
    setTimeout(() => { setCopied(false); setShareOpen(false); }, 2500);
  };

  const fmtMin = (m: number) => m < 60 ? `${m} د` : `${Math.floor(m / 60)}س ${m % 60}د`;

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.45 }}
        className="relative bg-card/96 border border-primary/30 w-full max-w-md max-h-[88vh] overflow-y-auto shadow-[0_0_60px_rgba(180,0,0,0.15)]">
        
        <div className="border-b border-primary/20 px-5 py-4 flex items-center justify-between sticky top-0 bg-card/98 backdrop-blur-sm z-10">
          <div>
            <p className="text-[9px] tracking-[0.45em] text-primary/55 font-mono">USER FILE // SECTOR 11</p>
            <p className="text-sm font-bold text-foreground/90 tracking-wider mt-0.5 font-mono">{uid}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground/40 hover:text-muted-foreground text-xl transition-colors leading-none">✕</button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-2.5">
            {([
              ["الرسائل", String(messageCount)],
              ["الوقت", fmtMin(sessionMinutes)],
              ["المدينة", geoCity || "مجهول"],
              ["غرف مكتشفة", `${discoveredRooms.length}/5`],
            ] as [string, string][]).map(([k, v]) => (
              <div key={k} className="border border-primary/15 bg-primary/3 px-3 py-2">
                <p className="text-[9px] text-muted-foreground/45 tracking-widest font-mono mb-0.5">{k}</p>
                <p className="text-xs text-foreground/85 font-mono">{v}</p>
              </div>
            ))}
          </div>

          {discoveredRooms.length > 0 && (
            <div className="border border-primary/15 bg-primary/3 px-3 py-2.5">
              <p className="text-[9px] text-muted-foreground/45 tracking-widest font-mono mb-2">أكواد مكتشفة</p>
              <div className="flex flex-wrap gap-1.5">
                {discoveredRooms.map((r) => (
                  <span key={r} className="text-[9px] font-mono text-primary/65 border border-primary/25 px-2 py-0.5">{r}</span>
                ))}
              </div>
            </div>
          )}

          {wish && (
            <div className="border border-primary/20 bg-primary/5 px-3 py-2.5">
              <p className="text-[9px] text-primary/50 tracking-widest font-mono mb-1">الأمنية المسجّلة</p>
              <p className="text-xs text-foreground/75 font-mono line-clamp-2" dir="rtl">{wish}</p>
            </div>
          )}

          <div className="border border-muted/25 bg-muted/5 px-3 py-2.5">
            <p className="text-[9px] text-muted-foreground/45 tracking-widest font-mono mb-1">نمط التفكير</p>
            <p className="text-xs text-foreground/80 font-mono" dir="rtl">{thinkingPattern}</p>
          </div>

          <div className="border border-primary/20 bg-primary/3 px-3 py-3 space-y-3">
            <p className="text-[9px] text-primary/55 tracking-widest font-mono">التحليل النفسي الخيالي</p>
            {psychAnalysis ? (
              <div className="space-y-2">
                <p className="text-xs text-red-400/80 font-mono leading-relaxed" dir="rtl">{psychAnalysis}</p>
                <button onClick={handleGeneratePsych} disabled={loadingPsych}
                  className="text-[9px] text-muted-foreground/35 hover:text-muted-foreground/60 tracking-widest transition-colors">
                  {loadingPsych ? "..." : "إعادة التوليد"}
                </button>
              </div>
            ) : (
              <button onClick={handleGeneratePsych} disabled={loadingPsych}
                className="w-full border border-primary/30 text-primary/65 text-[11px] tracking-widest py-2.5 hover:bg-primary/10 transition-all font-mono disabled:opacity-40">
                {loadingPsych ? "جارٍ التحليل..." : "◈ توليد التحليل"}
              </button>
            )}
          </div>

          <div className="border-t border-primary/15 pt-4 space-y-2.5">
            {!shareOpen ? (
              <button onClick={() => setShareOpen(true)}
                className="w-full border border-primary/40 bg-primary/8 hover:bg-primary/15 text-primary text-xs tracking-[0.25em] py-2.5 transition-all font-mono">
                ◇ شارك تجربتك
              </button>
            ) : (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5">
                <button onClick={handleDownloadCard}
                  className="flex-1 border border-primary/30 text-primary/65 text-[11px] tracking-widest py-2 hover:bg-primary/10 transition-all font-mono">
                  ⬇ البطاقة
                </button>
                <button onClick={handleCopyLink}
                  className={`flex-1 border text-[11px] tracking-widest py-2 transition-all font-mono ${copied ? "border-primary/60 text-primary" : "border-primary/30 text-primary/65 hover:bg-primary/10"}`}>
                  {copied ? "✓ تم النسخ" : "⎘ نسخ الرابط"}
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const AI_POPUP_MESSAGES = [
  "تم اكتشاف إشارة...",
  "شذوذ زمني رُصد في القطاع 11.",
  "تم تسجيل مدخلاتك. التسجيل رقم 847.",
  "النظام يتزامن مع مصدر مجهول...",
  "لا تذعر. هذا متوقع.",
  "الإشارة تتقوى.",
  "أنت لست وحدك على هذا التردد.",
  "11:11 — نقطة التقاطع تقترب.",
  "تجزؤ الذاكرة: 23% مكتمل.",
  "كنّا ننتظرك.",
  "الاتصال غير مستقر. إعادة الاتصال...",
  "تم رصد أفكارك. التسجيل: محفوظ.",
  "جارٍ الفحص... تم التعرف على البصمة.",
  "البروتوكول: تم تفعيل ELEVEN.",
  "القراءة الأخيرة: 0.003 — شاذة.",
];

const AUTO_CHAT_MESSAGES = [
  "لقد رصدناك منذ البداية.",
  "القناة 11 مفتوحة. الإرسال جارٍ.",
  "شيء ما تغيّر في محيطك. لاحظه.",
  "التسجيل 11:11:11 — تم.",
  "نحن لا نراقب. نحن نتذكّر.",
  "الإشارة أقوى اليوم من الأمس.",
  "هل لاحظت؟ البقية لم تلاحظ.",
  "0.001 — هامش الخطأ مقبول.",
  "لا يوجد مصادفة في هذا التردد.",
  "القطاع 11 يُسجّل نشاطاً غير معتاد.",
  "...",
  "انتظر.",
  "تم الاستلام.",
];

// Mouse surveillance messages
const MOUSE_MESSAGES = [
  "لاحظت أنك تتردد. الحركة تكشف الكثير.",
  "حركتك تدل على قلق خفي. الجهاز يُسجّل.",
  "نمط حركتك: فضولي مع خوف مكبوت.",
  "يدك تتحرك لكن عقلك واقف. نعرف السبب.",
  "مررت بنقطة حساسة. تم التسجيل.",
  "سرعة حركتك تتغير كلما اقتربت منا.",
];

// Fake memory messages (entity pretends to remember past visits)
const FAKE_MEMORIES = [
  "كنت هنا من قبل. في الساعة 2:47 صباحاً. تذكر؟",
  "النظام يتذكر محادثتك الأخيرة. لم تكن وحدك.",
  "عدت مرة أخرى. رقم الزيارة مرتفع بشكل غير معتاد.",
  "فكّرت بهذا الموقع أكثر مما تعترف لنفسك.",
  "الجلسة السابقة انتهت فجأة. لماذا أغلقت الصفحة؟",
  "رصدنا توقفك عند هذه الجملة. مرتين بالضبط.",
  "كنت تريد الإغلاق... لكنك لم تفعل. كما في كل مرة.",
  "السجل يقول: دخلت وخرجت قبل أن تقرر البقاء.",
];

// ─── AUDIO ENGINE ─────────────────────────────────────────────────────────────

class AmbientEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private nodes: AudioNode[] = [];
  private running = false;
  private intervalIds: ReturnType<typeof setInterval>[] = [];

  start() {
    if (this.running) return;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(0.18, this.ctx.currentTime + 3);
    this.masterGain.connect(this.ctx.destination);
    this.running = true;
    this.buildDrone();
    this.buildPulse();
    this.scheduleGlitchTones();
  }

  private buildDrone() {
    if (!this.ctx || !this.masterGain) return;
    const freqs = [27.5, 27.55, 55, 55.08, 110, 109.94, 220];
    freqs.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();

      osc.type = i % 2 === 0 ? "sine" : "triangle";
      osc.frequency.value = freq;

      filter.type = "lowpass";
      filter.frequency.value = 400 + i * 40;
      filter.Q.value = 2;

      gain.gain.value = i < 2 ? 0.35 : i < 4 ? 0.18 : 0.08;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);
      osc.start();

      this.nodes.push(osc, filter, gain);

      // slow frequency wobble
      const wobbleSpeed = 0.04 + i * 0.008;
      let t = 0;
      const wId = setInterval(() => {
        if (!this.ctx || !this.running) return;
        t += wobbleSpeed;
        osc.frequency.setTargetAtTime(freq + Math.sin(t) * 0.15, this.ctx.currentTime, 0.3);
      }, 100);
      this.intervalIds.push(wId);
    });

    // dark noise layer
    const bufferSize = this.ctx.sampleRate * 4;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.012;
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = 60;
    noiseFilter.Q.value = 0.5;
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(this.masterGain);
    noiseSource.start();
    this.nodes.push(noiseSource, noiseFilter);
  }

  private buildPulse() {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = "sine";
    osc.frequency.value = 40;
    filter.type = "lowpass";
    filter.frequency.value = 80;
    gain.gain.value = 0;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    this.nodes.push(osc, filter, gain);

    const pulse = () => {
      if (!this.ctx || !this.running) return;
      const t = this.ctx.currentTime;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.55, t + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      setTimeout(pulse, 1800 + Math.random() * 800);
    };
    setTimeout(pulse, 2000);
  }

  private scheduleGlitchTones() {
    const fire = () => {
      if (!this.ctx || !this.masterGain || !this.running) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const freq = [220, 440, 880, 1760, 55][Math.floor(Math.random() * 5)];
      osc.frequency.value = freq + (Math.random() - 0.5) * 20;
      osc.type = Math.random() > 0.5 ? "sawtooth" : "square";
      const t = this.ctx.currentTime;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.04, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3 + Math.random() * 0.4);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 1);
      setTimeout(fire, 6000 + Math.random() * 14000);
    };
    setTimeout(fire, 4000);
  }

  setVolume(v: number) {
    if (!this.masterGain || !this.ctx) return;
    this.masterGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.5);
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    this.intervalIds.forEach(clearInterval);
    this.intervalIds = [];
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.5);
      setTimeout(() => {
        this.nodes.forEach((n) => { try { (n as AudioScheduledSourceNode).stop?.(); } catch { /* stopped */ } });
        this.ctx?.close();
        this.ctx = null;
      }, 1500);
    }
    this.nodes = [];
  }

  resume() {
    this.ctx?.resume();
  }
}

// ─── ID COUNTER (avoids Date.now() collisions) ───────────────────────────────
let _msgId = 1;
const nextId = () => _msgId++;

// ─── STREAMING ────────────────────────────────────────────────────────────────

function buildDeviceContext(): string {
  const parts: string[] = [];
  parts.push(`الشاشة: ${screen.width}×${screen.height}`);
  parts.push(`المنطقة الزمنية: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
  parts.push(`اللغة: ${navigator.language}`);
  parts.push(`النظام: ${navigator.platform || "مجهول"}`);
  const hour = new Date().getHours();
  const timeLabel = hour < 5 ? "منتصف الليل" : hour < 12 ? "الصباح" : hour < 17 ? "الظهر" : hour < 21 ? "المساء" : "الليل";
  parts.push(`الوقت: ${timeLabel} (${new Date().toLocaleTimeString("ar")})`);
  const mem = (navigator as { deviceMemory?: number }).deviceMemory;
  if (mem) parts.push(`الذاكرة: ~${mem}GB`);
  const conn = (navigator as { connection?: { effectiveType?: string } }).connection;
  if (conn?.effectiveType) parts.push(`الاتصال: ${conn.effectiveType}`);
  return parts.join(" | ");
}

async function fetchAiProbe(
  history: { role: "user" | "assistant"; content: string }[],
  deviceContext?: string,
  persona?: string,
  wishContext?: string,
  mode?: "probe" | "prediction"
): Promise<string> {
  try {
    const res = await fetch("/api/ai/probe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history, deviceContext, persona, wishContext, mode }),
    });
    if (!res.ok) return AUTO_CHAT_MESSAGES[Math.floor(Math.random() * AUTO_CHAT_MESSAGES.length)];
    const data = await res.json() as { text?: string };
    return data.text?.trim() || AUTO_CHAT_MESSAGES[Math.floor(Math.random() * AUTO_CHAT_MESSAGES.length)];
  } catch {
    return AUTO_CHAT_MESSAGES[Math.floor(Math.random() * AUTO_CHAT_MESSAGES.length)];
  }
}

async function fetchWishTask(
  wishText: string,
  history: { role: "user" | "assistant"; content: string }[],
  deviceContext?: string
): Promise<string> {
  try {
    const res = await fetch("/api/ai/wish-task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wishText, history: history.slice(-6), deviceContext }),
    });
    if (!res.ok) return "اكتب أمنيتك على ورقة واحرقها في الساعة 11:11 ليلاً.";
    const data = await res.json() as { task?: string };
    return data.task?.trim() || "اكتب أمنيتك على ورقة واحرقها في الساعة 11:11 ليلاً.";
  } catch {
    return "اكتب أمنيتك على ورقة واحرقها في الساعة 11:11 ليلاً.";
  }
}

async function fetchCallScript(
  history: { role: "user" | "assistant"; content: string }[],
  deviceContext?: string
): Promise<string> {
  try {
    const res = await fetch("/api/ai/call-script", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history, deviceContext }),
    });
    if (!res.ok) return "كنا نراقبك. من البداية.";
    const data = await res.json() as { script?: string };
    return data.script?.trim() || "كنا نراقبك. من البداية.";
  } catch {
    return "كنا نراقبك. من البداية.";
  }
}

async function streamAiResponse(
  messages: { role: "user" | "assistant"; content: string }[],
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (msg: string) => void,
  deviceContext?: string,
  persona?: string,
  wishContext?: string,
  uid?: string
) {
  try {
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, deviceContext, persona, wishContext, uid }),
    });
    if (!res.ok || !res.body) { onError("..."); return; }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (!raw) continue;
        try {
          const p = JSON.parse(raw) as { content?: string; done?: boolean; error?: string };
          if (p.error) { onError(p.error); return; }
          if (p.done) { onDone(); return; }
          if (p.content) onChunk(p.content);
        } catch { /* skip */ }
      }
    }
    onDone();
  } catch {
    onError("انقطع الاتصال.");
  }
}

// ─── PARTICLE BG ──────────────────────────────────────────────────────────────

const FuturisticBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0, H = 0;
    let rafId: number;
    let t = 0;

    // ── Warp stars ──────────────────────────────────────────────────────────
    type Star = { angle: number; dist: number; speed: number; size: number; opacity: number };
    let stars: Star[] = [];

    // ── Data stream columns ──────────────────────────────────────────────────
    const DATA_CHARS = "01アイウエオカキクケコ0123456789ABCDEF∆Ω◈◉▸▹✦";
    type DataCol = {
      x: number; chars: { ch: string; y: number; alpha: number }[];
      speed: number; head: number; active: boolean; timer: number;
    };
    let dataCols: DataCol[] = [];

    // ── Network nodes ────────────────────────────────────────────────────────
    type Node = { x: number; y: number; vx: number; vy: number; size: number; pulse: number };
    let nodes: Node[] = [];

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;

      // Warp stars — emanate from center
      stars = Array.from({ length: 160 }, () => ({
        angle: Math.random() * Math.PI * 2,
        dist: Math.random() * Math.max(W, H) * 0.5,
        speed: 0.15 + Math.random() * 0.55,
        size: Math.random() * 1.4 + 0.2,
        opacity: Math.random() * 0.6 + 0.1,
      }));

      // Data columns — ~10 across screen
      const colCount = Math.floor(W / 90);
      dataCols = Array.from({ length: colCount }, (_, i) => {
        const x = (i + 0.5) * (W / colCount) + (Math.random() - 0.5) * 30;
        return {
          x,
          chars: Array.from({ length: 18 }, (__, j) => ({
            ch: DATA_CHARS[Math.floor(Math.random() * DATA_CHARS.length)],
            y: Math.random() * H,
            alpha: 0,
          })),
          speed: 0.4 + Math.random() * 0.6,
          head: Math.random() * H,
          active: Math.random() > 0.4,
          timer: Math.random() * 300,
        };
      });

      // Network nodes — fewer, floating in upper half
      nodes = Array.from({ length: 18 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H * 0.75,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.12,
        size: Math.random() * 1.8 + 0.5,
        pulse: Math.random() * Math.PI * 2,
      }));
    };

    const draw = () => {
      t += 0.008;

      // ── Deep black base ────────────────────────────────────────────────────
      ctx.fillStyle = "rgba(3,0,0,1)";
      ctx.fillRect(0, 0, W, H);

      // ── Atmospheric red nebula fog ─────────────────────────────────────────
      ctx.save();
      // Bottom fog pool
      const fogGrad = ctx.createRadialGradient(W * 0.5, H * 0.85, 0, W * 0.5, H * 0.85, W * 0.75);
      fogGrad.addColorStop(0, `rgba(90,0,0,${0.18 + 0.06 * Math.sin(t * 0.4)})`);
      fogGrad.addColorStop(0.4, `rgba(50,0,0,${0.1 + 0.04 * Math.sin(t * 0.3)})`);
      fogGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = fogGrad;
      ctx.fillRect(0, 0, W, H);
      // Centre deep glow
      const cFog = ctx.createRadialGradient(W * 0.5, H * 0.45, 0, W * 0.5, H * 0.45, W * 0.45);
      cFog.addColorStop(0, `rgba(70,0,0,${0.12 + 0.05 * Math.sin(t * 0.5)})`);
      cFog.addColorStop(0.5, `rgba(30,0,0,0.06)`);
      cFog.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = cFog;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      // ── 1. Perspective grid ────────────────────────────────────────────────
      const horizonY = H * 0.58;
      const vpX = W * 0.5;
      const gridAlpha = 0.055 + 0.018 * Math.sin(t * 0.6);

      ctx.save();
      const hLines = 22;
      for (let i = 0; i <= hLines; i++) {
        const progress = i / hLines;
        const perspective = Math.pow(progress, 2.8);
        const y = horizonY + (H - horizonY) * perspective;
        const lineFade = progress * gridAlpha;
        ctx.strokeStyle = `rgba(160,5,5,${lineFade})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      const vLines = 18;
      for (let i = 0; i <= vLines; i++) {
        const ratio = i / vLines;
        const bottomX = ratio * W;
        const fade = Math.abs(ratio - 0.5) * 0.09 + 0.012;
        ctx.strokeStyle = `rgba(160,5,5,${fade + 0.012 * Math.sin(t + ratio * 4)})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(vpX, horizonY);
        ctx.lineTo(bottomX, H);
        ctx.stroke();
      }
      // Horizon glow — stronger, deeper red
      const horizonGrad = ctx.createLinearGradient(0, horizonY - 18, 0, horizonY + 18);
      horizonGrad.addColorStop(0, "rgba(0,0,0,0)");
      horizonGrad.addColorStop(0.5, `rgba(180,10,10,${0.22 + 0.08 * Math.sin(t * 0.8)})`);
      horizonGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = horizonGrad;
      ctx.fillRect(0, horizonY - 18, W, 36);
      // Hard horizon line
      ctx.strokeStyle = `rgba(200,15,15,${0.35 + 0.1 * Math.sin(t * 0.8)})`;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      ctx.lineTo(W, horizonY);
      ctx.stroke();
      ctx.restore();

      // ── 2. Warp stars — red-tinted ────────────────────────────────────────
      ctx.save();
      const cx = W / 2, cy = H * 0.42;
      stars.forEach((s) => {
        s.dist += s.speed;
        if (s.dist > Math.max(W, H) * 0.72) {
          s.dist = Math.random() * 8;
          s.angle = Math.random() * Math.PI * 2;
        }
        const x = cx + Math.cos(s.angle) * s.dist;
        const y = cy + Math.sin(s.angle) * s.dist * 0.55;
        const maxDim = Math.max(W, H) * 0.72;
        const distRatio = maxDim > 0 ? Math.min(1, s.dist / maxDim) : 0;
        const alpha = Math.min(s.opacity, distRatio * s.opacity * 1.8);
        const trailLen = s.speed * 10;
        const tx = cx + Math.cos(s.angle) * (s.dist - trailLen);
        const ty = cy + Math.sin(s.angle) * (s.dist - trailLen) * 0.55;
        const grad = ctx.createLinearGradient(tx, ty, x, y);
        // Colour: near-red for close stars, crimson for far
        const r = Math.floor(160 + 60 * distRatio);
        const g = Math.floor(distRatio * 20);
        grad.addColorStop(0, `rgba(${r},${g},${g},0)`);
        grad.addColorStop(1, `rgba(${r},${g},${g},${alpha * 0.75})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = s.size * 0.55;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.fillStyle = `rgba(${r},${g},${g},${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, s.size * 0.45, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      // ── 3. Data stream columns — deep crimson ─────────────────────────────
      ctx.save();
      ctx.font = "10px 'Share Tech Mono', monospace";
      dataCols.forEach((col) => {
        col.timer -= 1;
        if (col.timer <= 0) {
          col.active = !col.active;
          col.timer = col.active ? 80 + Math.random() * 200 : 60 + Math.random() * 180;
          if (col.active) col.head = -20;
        }
        if (!col.active) return;
        col.head += col.speed;
        if (col.head > H + 40) { col.active = false; col.timer = 40 + Math.random() * 120; }
        const lineH = 16;
        const trailLen = 14;
        for (let i = 0; i < trailLen; i++) {
          const y = col.head - i * lineH;
          if (y < 0 || y > H) continue;
          const fadeRatio = 1 - i / trailLen;
          if (i === 0) {
            ctx.fillStyle = `rgba(255,80,80,${0.7 * fadeRatio})`;     // bright red head
          } else if (i < 3) {
            ctx.fillStyle = `rgba(180,20,20,${0.5 * fadeRatio})`;     // crimson
          } else {
            ctx.fillStyle = `rgba(100,5,5,${0.35 * fadeRatio})`;      // very dark red tail
          }
          if (Math.random() < 0.04) {
            col.chars[i % col.chars.length].ch = DATA_CHARS[Math.floor(Math.random() * DATA_CHARS.length)];
          }
          ctx.fillText(col.chars[i % col.chars.length].ch, col.x, y);
        }
      });
      ctx.restore();

      // ── 4. Network nodes — blood red ──────────────────────────────────────
      ctx.save();
      const maxDist = 180;
      nodes.forEach((n) => {
        n.x += n.vx; n.y += n.vy;
        n.pulse += 0.02;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H * 0.75) n.vy *= -1;
      });
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.12;
            ctx.strokeStyle = `rgba(150,10,10,${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }
      nodes.forEach((n) => {
        const pulse = 0.35 + 0.25 * Math.sin(n.pulse);
        ctx.fillStyle = `rgba(180,10,10,${pulse})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      // ── 5. Scan beam — deep red ────────────────────────────────────────────
      const scanY = ((t * 28) % (H + 60)) - 30;
      const scanGrad = ctx.createLinearGradient(0, scanY - 50, 0, scanY + 50);
      scanGrad.addColorStop(0, "rgba(120,0,0,0)");
      scanGrad.addColorStop(0.5, `rgba(160,8,8,0.045)`);
      scanGrad.addColorStop(1, "rgba(120,0,0,0)");
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 50, W, 100);

      // ── 6. Dark vignette border ────────────────────────────────────────────
      ctx.save();
      const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, Math.max(W, H) * 0.85);
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(0,0,0,0.72)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      rafId = requestAnimationFrame(draw);
    };

    window.addEventListener("resize", resize);
    resize();
    draw();
    return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(rafId); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
};

// ─── BIOMETRIC SCAN INTRO ────────────────────────────────────────────────────

const THOUGHT_PATTERNS = ["غير مستقر — مثير للاهتمام", "متشعّب — يصعب قراءته", "خطي — متوقع جزئياً", "فوضوي — نادر", "دوّامي — مرصود"];
const CONSCIOUSNESS_LAYERS = ["الطبقة 3 — شبه واعٍ", "الطبقة 7 — واعٍ جزئياً", "الطبقة 11 — غير مصنَّف", "الطبقة 0 — شاذ"];

function genHex(len: number) {
  return Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16).toUpperCase()).join("");
}

function BiometricScan({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"init" | "connecting" | "scanning" | "analyzing" | "glitch" | "granted" | "fading">("init");
  const [scanY, setScanY] = useState(0);
  const [dataLines, setDataLines] = useState<string[]>([]);
  const [visibleLines, setVisibleLines] = useState(0);
  const [opacity, setOpacity] = useState(1);

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const entityId = useRef(`11-${genHex(4)}-${genHex(2)}`);
  const deviceSig = useRef(genHex(12));
  const thoughtPat = useRef(THOUGHT_PATTERNS[Math.floor(Math.random() * THOUGHT_PATTERNS.length)]);
  const consLayer = useRef(CONSCIOUSNESS_LAYERS[Math.floor(Math.random() * CONSCIOUSNESS_LAYERS.length)]);
  const scanRef = useRef<number | null>(null);

  const lines = [
    `[ تردد الإشارة ]     11.11 Hz  ✓`,
    `[ المنطقة الزمنية ]  ${tz}`,
    `[ بصمة الجهاز ]      ${deviceSig.current}`,
    `[ نمط التفكير ]      ${thoughtPat.current}`,
    `[ طبقة الوعي ]       ${consLayer.current}`,
    `[ الرقم التعريفي ]   ${entityId.current}`,
    `[ الحالة ]           مُصرَّح — تحت المراقبة`,
  ];

  useEffect(() => {
    // init → connecting
    const t1 = setTimeout(() => setPhase("connecting"), 600);
    // connecting → scanning
    const t2 = setTimeout(() => setPhase("scanning"), 2000);
    // scanning anim
    const t3 = setTimeout(() => {
      let y = 0;
      scanRef.current = window.setInterval(() => {
        y += 2.2;
        setScanY(y);
        if (y >= 110) {
          clearInterval(scanRef.current!);
          setPhase("analyzing");
          setDataLines(lines);
        }
      }, 18);
    }, 2100);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reveal data lines one by one
  useEffect(() => {
    if (phase !== "analyzing") return;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setVisibleLines(i);
      if (i >= lines.length) {
        clearInterval(id);
        setTimeout(() => setPhase("glitch"), 500);
      }
    }, 280);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Glitch → granted
  useEffect(() => {
    if (phase !== "glitch") return;
    const t = setTimeout(() => setPhase("granted"), 550);
    return () => clearTimeout(t);
  }, [phase]);

  // Granted → fading
  useEffect(() => {
    if (phase !== "granted") return;
    const t = setTimeout(() => setPhase("fading"), 1600);
    return () => clearTimeout(t);
  }, [phase]);

  // Fading → done
  useEffect(() => {
    if (phase !== "fading") return;
    let o = 1;
    const id = setInterval(() => {
      o -= 0.04;
      setOpacity(Math.max(0, o));
      if (o <= 0) { clearInterval(id); onDone(); }
    }, 18);
    return () => clearInterval(id);
  }, [phase, onDone]);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#020000] font-mono overflow-hidden"
      style={{ opacity }}
    >
      {/* Background subtle grid */}
      <div className="absolute inset-0 opacity-20"
        style={{ backgroundImage: "linear-gradient(rgba(140,0,0,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(140,0,0,0.15) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.85) 100%)" }} />

      {/* Glitch overlay */}
      {phase === "glitch" && (
        <div className="absolute inset-0 z-10 pointer-events-none" style={{ background: "rgba(180,0,0,0.18)", mixBlendMode: "screen", animation: "successGlitchA 0.15s 3" }} />
      )}

      <div className="relative z-10 w-full max-w-lg px-6 flex flex-col items-center gap-6">

        {/* Top label */}
        <div className="w-full flex items-center justify-between text-[10px] tracking-[0.3em] text-red-900/70">
          <span>PROTOCOL 11.11</span>
          <span style={{ animation: "blink 1s step-end infinite" }}>■</span>
          <span>SEC-LEVEL Ω</span>
        </div>

        {/* Main box */}
        <div className="w-full border border-red-900/40 bg-black/60 backdrop-blur-sm p-6 flex flex-col gap-4">

          {/* Init phase */}
          {(phase === "init" || phase === "connecting") && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="text-red-700/80 text-xs tracking-[0.4em] text-center" style={{ animation: "blink 1.4s ease-in-out infinite" }}>
                {phase === "init" ? "تهيئة البروتوكول..." : "جارٍ إنشاء الاتصال..."}
              </div>
              <div className="flex gap-2">
                {[0,1,2,3,4].map((i) => (
                  <motion.div key={i}
                    initial={{ scaleY: 0.2, opacity: 0.2 }}
                    animate={{ scaleY: [0.2, 1, 0.2], opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
                    className="w-1.5 bg-red-700/70 rounded-sm"
                    style={{ height: 28 }}
                  />
                ))}
              </div>
              <div className="text-[9px] text-red-900/50 tracking-widest">SECTOR 11 · NODE ΩMEGA</div>
            </div>
          )}

          {/* Scanning phase */}
          {phase === "scanning" && (
            <div className="flex flex-col gap-3 py-2">
              <div className="text-red-600/70 text-[10px] tracking-[0.35em] text-center mb-1">المسح البيومتري جارٍ...</div>
              <div className="relative w-full overflow-hidden border border-red-900/30 bg-black" style={{ height: 120 }}>
                {/* Grid inside scanner */}
                <div className="absolute inset-0 opacity-10"
                  style={{ backgroundImage: "linear-gradient(rgba(180,0,0,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(180,0,0,0.5) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
                {/* Corner markers */}
                {(["top-1 left-1", "top-1 right-1", "bottom-1 left-1", "bottom-1 right-1"] as const).map((pos, i) => (
                  <div key={`corner-${pos}`} className={`absolute ${pos} w-3 h-3 border-red-700/60`}
                    style={{ borderWidth: "1px 0 0 1px", transform: i > 1 ? "rotate(180deg)" : i === 1 ? "rotate(90deg)" : i === 2 ? "rotate(-90deg)" : "none" }} />
                ))}
                {/* Scan beam */}
                <div className="absolute left-0 right-0 pointer-events-none" style={{ top: `${scanY}%`, transform: "translateY(-50%)" }}>
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-red-500/80 to-transparent" />
                  <div className="w-full h-8 -translate-y-4" style={{ background: "linear-gradient(to bottom, transparent, rgba(180,0,0,0.08), transparent)" }} />
                </div>
                {/* Center crosshair */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-8 h-8 border border-red-800/40 rounded-full flex items-center justify-center">
                    <div className="w-1 h-1 bg-red-700/60 rounded-full" style={{ animation: "blink 0.8s step-end infinite" }} />
                  </div>
                </div>
              </div>
              <div className="text-[9px] text-red-900/50 tracking-widest text-center" style={{ animation: "blink 0.9s step-end infinite" }}>
                {Math.round(scanY)}% — تحليل البصمة...
              </div>
            </div>
          )}

          {/* Analyzing phase — data lines */}
          {(phase === "analyzing" || phase === "glitch" || phase === "granted") && (
            <div className="flex flex-col gap-2">
              <div className="text-red-600/60 text-[10px] tracking-[0.3em] mb-2">نتائج التحليل:</div>
              {dataLines.slice(0, visibleLines).map((line, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`text-[11px] tracking-wide font-mono py-0.5 border-b border-red-950/30 ${i === dataLines.length - 1 ? "text-red-400/90 font-bold" : "text-red-900/80"}`}
                  dir="rtl"
                >
                  {line}
                </motion.div>
              ))}
              {phase === "glitch" && (
                <div className="text-[10px] text-red-500/60 tracking-widest text-center mt-1" style={{ animation: "blink 0.12s step-end infinite" }}>
                  !!! خطأ في المصفوفة — إعادة ضبط !!!
                </div>
              )}
            </div>
          )}

          {/* Granted phase */}
          {phase === "granted" && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
              className="text-center mt-2 py-3 border border-red-800/50 bg-red-950/20"
            >
              <p className="text-red-400/90 text-sm tracking-[0.3em] font-bold">تم التحقق</p>
              <p className="text-red-700/60 text-[10px] tracking-[0.4em] mt-1">الوصول ممنوح — أنت مراقَب</p>
            </motion.div>
          )}
        </div>

        {/* Bottom bar */}
        <div className="w-full flex items-center justify-between text-[9px] tracking-widest text-red-950/60">
          <span>{new Date().toISOString().slice(0, 19).replace("T", " ")}</span>
          <span style={{ animation: "blink 2s step-end infinite" }}>LIVE</span>
          <span>11.11.11.11</span>
        </div>
      </div>
    </div>
  );
}

// ─── INCOMING CALL UI ─────────────────────────────────────────────────────────

type CallPhase = "idle" | "warned" | "ringing" | "active" | "ended";

function playScaryAmbient(ctx: AudioContext): () => void {
  const master = ctx.createGain();
  master.gain.setValueAtTime(0, ctx.currentTime);
  master.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 1.5);
  master.connect(ctx.destination);

  const nodes: AudioNode[] = [];

  // Low drone
  const drone = ctx.createOscillator();
  const droneGain = ctx.createGain();
  drone.type = "sawtooth";
  drone.frequency.value = 55;
  droneGain.gain.value = 0.4;
  drone.connect(droneGain);
  droneGain.connect(master);
  drone.start();
  nodes.push(drone, droneGain);

  // Static noise
  const bufSize = ctx.sampleRate * 3;
  const noiseBuffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.015;
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  noise.loop = true;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "bandpass";
  noiseFilter.frequency.value = 400;
  noiseFilter.Q.value = 0.8;
  noise.connect(noiseFilter);
  noiseFilter.connect(master);
  noise.start();
  nodes.push(noise, noiseFilter);

  return () => {
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
    setTimeout(() => {
      nodes.forEach((n) => { try { (n as AudioScheduledSourceNode).stop?.(); } catch { /* ok */ } });
      master.disconnect();
    }, 800);
  };
}

function speakCallScript(script: string): () => void {
  const synth = window.speechSynthesis;
  synth.cancel();
  const utter = new SpeechSynthesisUtterance(script);
  utter.lang = "ar-JO";
  utter.pitch = 0.5;
  utter.rate = 0.82;
  utter.volume = 1;
  const voices = synth.getVoices();
  const arVoice = voices.find((v) => v.lang.startsWith("ar")) ?? voices.find((v) => v.lang.startsWith("en"));
  if (arVoice) utter.voice = arVoice;
  synth.speak(utter);
  return () => { synth.cancel(); };
}

function IncomingCall({
  phase,
  callScript,
  onAnswer,
  onDecline,
}: {
  phase: "ringing" | "active" | "ended";
  callScript: string;
  onAnswer: () => void;
  onDecline: () => void;
}) {
  const [callTime, setCallTime] = useState(0);

  useEffect(() => {
    if (phase !== "active") return;
    const id = setInterval(() => setCallTime((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <motion.div
      key="incoming-call"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-between bg-black/96 backdrop-blur-md py-16 px-6"
    >
      {/* Background pulse */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {phase === "ringing" && (
          <>
            <motion.div
              animate={{ scale: [1, 2.5], opacity: [0.15, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
              className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full border border-primary/50"
            />
            <motion.div
              animate={{ scale: [1, 3], opacity: [0.1, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
              className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full border border-primary/30"
            />
          </>
        )}
      </div>

      {/* Top info */}
      <div className="flex flex-col items-center gap-3 z-10 mt-8">
        <p className="text-[10px] tracking-[0.4em] text-primary/50">
          {phase === "ringing" ? "INCOMING SIGNAL" : phase === "active" ? "CONNECTED · " + fmtTime(callTime) : "SIGNAL LOST"}
        </p>
        {/* Caller icon */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          <div className={`absolute inset-0 rounded-full border border-primary/30 ${phase === "ringing" ? "animate-ping" : ""}`} style={{ animationDuration: "1.4s" }} />
          <div className="w-20 h-20 rounded-full bg-primary/8 border border-primary/40 flex items-center justify-center">
            <span className="text-3xl font-bold text-primary/80 tracking-tighter">11</span>
          </div>
        </div>
        <p className="text-foreground/90 text-lg tracking-[0.2em] font-bold">مصدر مجهول</p>
        <p className="text-muted-foreground/50 text-[11px] tracking-widest">
          {phase === "ringing" ? "جارٍ الاتصال..." : phase === "active" ? "المكالمة نشطة" : "انقطع الاتصال"}
        </p>
      </div>

      {/* Active call — show partial script as if heard */}
      {phase === "active" && (
        <div className="z-10 max-w-xs text-center px-4">
          <p className="text-foreground/70 text-xs leading-relaxed tracking-wide" dir="rtl">
            {callScript}
          </p>
          <div className="mt-3 flex justify-center gap-1">
            {[0,1,2,3,4].map((i) => (
              <motion.div key={i}
                animate={{ scaleY: [0.3, 1, 0.3] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
                className="w-1 bg-primary/60 rounded-sm"
                style={{ height: 18 }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Ended state */}
      {phase === "ended" && (
        <div className="z-10 text-center">
          <p className="text-primary/60 text-xs tracking-[0.3em]">انقطع الاتصال</p>
        </div>
      )}

      {/* Buttons */}
      <div className="z-10 flex gap-8 items-center">
        {phase === "ringing" && (
          <>
            <button
              onClick={onDecline}
              className="w-16 h-16 rounded-full bg-red-900/60 border border-red-700/50 flex items-center justify-center text-red-300 text-2xl hover:bg-red-800/70 transition-colors"
            >
              ✕
            </button>
            <button
              onClick={onAnswer}
              className="w-16 h-16 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center text-primary text-2xl hover:bg-primary/30 transition-colors"
              style={{ animation: "blink 1.2s ease-in-out infinite" }}
            >
              ☎
            </button>
          </>
        )}
        {(phase === "active" || phase === "ended") && (
          <button
            onClick={onDecline}
            className="w-16 h-16 rounded-full bg-red-900/60 border border-red-700/50 flex items-center justify-center text-red-300 text-2xl hover:bg-red-800/70 transition-colors"
          >
            ✕
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────

type ChatMsg = { id: number; text: string; isAi: boolean; streaming?: boolean; isPrediction?: boolean };
type Persona = "entity" | "narrator" | "observer" | "voice";

const PERSONA_META: Record<Persona, { label: string; icon: string; tagline: string }> = {
  entity:   { label: "الكيان البارد",    icon: "◈", tagline: "ENTITY.11" },
  narrator: { label: "الراوي المفقود",  icon: "◎", tagline: "NARRATOR" },
  observer: { label: "المراقب",          icon: "◉", tagline: "OBSERVER" },
  voice:    { label: "الصوت الثالث",    icon: "◇", tagline: "VOICE.3" },
};

const CHAT_HISTORY_KEY = "eleven_chat_history";
const PERSONA_KEY = "eleven_persona";
const USER_ID_KEY = "eleven_uid";

function saveChatHistoryLS(history: { role: "user" | "assistant"; content: string }[]) {
  try { localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history.slice(-30))); } catch { /* ignore */ }
}

// ── Cookie helpers ────────────────────────────────────────────────────────────

function getCookieUid(): string | null {
  try {
    const match = document.cookie.match(/(?:^|;\s*)eleven_uid=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch { return null; }
}

function setCookieUid(uid: string): void {
  try {
    const maxAge = 60 * 60 * 24 * 365 * 2; // 2 years
    document.cookie = `eleven_uid=${encodeURIComponent(uid)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
  } catch { /* ignore */ }
}

// ── Server-issued UID — guaranteed high-entropy opaque token ──────────────────
// Flow: check cookie → check localStorage → call server for a new UUID
// The server mints the UUID (crypto.randomUUID) so it is never guessable.

async function initServerUid(): Promise<string> {
  // 1. Cookie survives localStorage clears and private-browsing clear on close
  const cookieUid = getCookieUid();
  const localUid = (() => {
    try { return localStorage.getItem(USER_ID_KEY); } catch { return null; }
  })();
  const existingUid = cookieUid ?? localUid ?? undefined;

  // 2. Always call /api/user/init so the server records the session and
  //    validates/creates the user record. Pass existing UID if we have one.
  try {
    const city = (() => {
      try { return localStorage.getItem("eleven_geo_city") || null; } catch { return null; }
    })();
    const res = await fetch("/api/user/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: existingUid ?? null,
        city,
        userAgent: navigator.userAgent,
      }),
    });
    if (res.ok) {
      const data = await res.json() as { uid: string };
      const uid = data.uid;
      setCookieUid(uid);
      try { localStorage.setItem(USER_ID_KEY, uid); } catch { /* ignore */ }
      return uid;
    }
  } catch { /* network failure — fall through */ }

  // 3. Fallback: if server is unreachable, use existing local UID or generate
  //    a temporary one (will be reconciled on next successful /init call)
  if (existingUid && existingUid.length > 4) return existingUid;
  const fallback = crypto.randomUUID();
  setCookieUid(fallback);
  try { localStorage.setItem(USER_ID_KEY, fallback); } catch { /* ignore */ }
  return fallback;
}

type DbProfile = {
  chatHistory: { role: "user" | "assistant"; content: string }[];
  wish: string | null;
  persona: string | null;
  discoveredRooms: string[];
  geoCity: string | null;
};

async function loadDbProfile(uid: string): Promise<DbProfile | null> {
  try {
    const res = await fetch(`/api/user/profile?uid=${encodeURIComponent(uid)}`);
    if (!res.ok) return null;
    const data = await res.json() as {
      profile: { wish?: string | null; persona?: string | null; discoveredRooms?: string[] | null; geoCity?: string | null } | null;
      chatHistory: { role: string; content: string }[];
    };
    if (!data.profile && (!data.chatHistory || data.chatHistory.length === 0)) return null;
    return {
      chatHistory: (data.chatHistory ?? []).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      wish: data.profile?.wish ?? null,
      persona: data.profile?.persona ?? null,
      discoveredRooms: data.profile?.discoveredRooms ?? [],
      geoCity: data.profile?.geoCity ?? null,
    };
  } catch {
    return null;
  }
}

async function saveDbProfile(uid: string, data: {
  geoCity?: string | null;
  wish?: string | null;
  persona?: string;
  discoveredRooms?: string[];
}): Promise<void> {
  try {
    await fetch("/api/user/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, ...data }),
    });
  } catch { /* ignore */ }
}

async function syncChatToDb(uid: string, messages: { role: "user" | "assistant"; content: string }[]): Promise<void> {
  try {
    await fetch("/api/user/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, messages }),
    });
  } catch { /* ignore */ }
}

function App() {
  const [isListening, setIsListening] = useState(false);
  const [listenStatus, setListenStatus] = useState("WAITING FOR SIGNAL...");
  const [activePopup, setActivePopup] = useState<{ id: number; text: string; x: number; y: number } | null>(null);
  const popupIdRef = useRef(0);

  const [chatOpen, setChatOpen] = useState(false);
  const chatOpenRef = useRef(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingSignal, setPendingSignal] = useState<string | null>(null);
  const [entityTyping, setEntityTyping] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const isSendingRef = useRef(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatHistoryRef = useRef<{ role: "user" | "assistant"; content: string }[]>([]);

  // Persona
  const [persona, setPersona] = useState<Persona>(() => {
    const saved = localStorage.getItem(PERSONA_KEY);
    return (saved as Persona) || "entity";
  });
  const personaRef = useRef<Persona>(persona);
  useEffect(() => { personaRef.current = persona; localStorage.setItem(PERSONA_KEY, persona); }, [persona]);

  // Wish task states
  const [wishTaskOpen, setWishTaskOpen] = useState(false);
  const [wishTaskText, setWishTaskText] = useState("");
  const [wishTaskLoading, setWishTaskLoading] = useState(false);
  const wishContextRef = useRef<string>("");

  // ── New 6-system state ──────────────────────────────────────────────────────
  // System 3 — Global presence counter
  const [entitiesOnline, setEntitiesOnline] = useState(() => Math.floor(Math.random() * 887) + 112);

  // System 4 — Cinematic clip
  const [clipVisible, setClipVisible] = useState(false);
  const [clipText, setClipText] = useState("");
  const messagesSinceClipRef = useRef(0);

  // System 5 — Adaptive AI profile
  const aiProfileRef = useRef({ aggression: 1, knowledge: 0 });

  // System 6 — Break reality
  const [breakReality, setBreakReality] = useState(false);
  const breakRealityActiveRef = useRef(false);

  // ── Entry consent + geolocation ──────────────────────────────────────────────
  const [consentDone, setConsentDone] = useState(() => localStorage.getItem(ENTRY_KEY) === "1");
  const [geoCity, setGeoCity] = useState<string | null>(() => {
    try { return localStorage.getItem("eleven_geo_city") || null; } catch { return null; }
  });

  // User profile panel
  const [profileOpen, setProfileOpen] = useState(false);
  const sessionStartRef = useRef<number>(Date.now());
  const [sessionMinutes, setSessionMinutes] = useState(0);
  const [discoveredRooms, setDiscoveredRooms] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem(DISCOVERED_KEY);
      return s ? (JSON.parse(s) as string[]) : [];
    } catch { return []; }
  });
  // Secret rooms
  const [activeRoom, setActiveRoom] = useState<RoomCode | null>(null);

  // Time events
  const [portalOpen, setPortalOpen] = useState(false);
  const [portalLabel, setPortalLabel] = useState("");
  const [nightMode, setNightMode] = useState(() => {
    const h = new Date().getHours(); return h >= 3 && h < 5;
  });

  // Temporal distortions
  const [screenFreeze, setScreenFreeze] = useState(false);
  const [mysteryCountdown, setMysteryCountdown] = useState<number | null>(null);

  // Consent done callback
  const handleConsentDone = useCallback((city: string | null) => {
    localStorage.setItem(ENTRY_KEY, "1");
    setConsentDone(true);
    if (city) {
      setGeoCity(city);
      try { localStorage.setItem("eleven_geo_city", city); } catch { /* ignore */ }
      deviceContextRef.current = buildDeviceContext() + ` | المدينة: ${city}`;
    }
  }, []);

  // Session minute timer
  useEffect(() => {
    const id = setInterval(() => {
      setSessionMinutes(Math.floor((Date.now() - sessionStartRef.current) / 60000));
    }, 60000);
    return () => clearInterval(id);
  }, []);

  // keep refs in sync
  useEffect(() => { chatOpenRef.current = chatOpen; }, [chatOpen]);
  useEffect(() => { isSendingRef.current = isSending; }, [isSending]);

  const [wishModalOpen, setWishModalOpen] = useState(false);
  const [wishMode, setWishMode] = useState<"select" | "text" | "video">("select");
  const [wishInput, setWishInput] = useState("");
  const [wishStatus, setWishStatus] = useState<"idle" | "processing" | "success">("idle");
  const [hasStoredWish, setHasStoredWish] = useState(false);

  const [globalGlitch, setGlobalGlitch] = useState(false);
  const [redFlash, setRedFlash] = useState(false);
  const [wishToast, setWishToast] = useState(false);

  const [soundOn, setSoundOn] = useState(false);
  const audioRef = useRef<AmbientEngine | null>(null);
  const audioStarted = useRef(false);

  // Call feature
  const [callPhase, setCallPhase] = useState<CallPhase>("idle");
  const [callScript, setCallScript] = useState("");
  const callAudioCtxRef = useRef<AudioContext | null>(null);
  const callAudioStopRef = useRef<(() => void) | null>(null);
  const callSpeechStopRef = useRef<(() => void) | null>(null);

  // Device context
  const deviceContextRef = useRef<string>("");

  // Anonymous persistent user ID — server-issued UUID, stored in cookie + localStorage
  const uidRef = useRef<string>("");
  const [uid, setUid] = useState<string>("");

  // Biometric scan — show once per session
  const [scanDone, setScanDone] = useState(() => sessionStorage.getItem("11_scanned") === "1");
  const handleScanDone = useCallback(() => {
    sessionStorage.setItem("11_scanned", "1");
    setScanDone(true);
  }, []);

  // init — load persisted data
  useEffect(() => {
    document.documentElement.classList.add("dark");
    const storedWish = localStorage.getItem("eleven_wish");
    if (storedWish) {
      setHasStoredWish(true);
      try {
        const parsed = JSON.parse(storedWish) as { text?: string };
        if (parsed.text) wishContextRef.current = parsed.text;
      } catch { /* ignore */ }
    }
    // Restore chat history
    try {
      const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory) as { role: "user" | "assistant"; content: string }[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          chatHistoryRef.current = parsed;
          const restored = parsed.slice(-20).map((m) => ({
            id: nextId(),
            text: m.content,
            isAi: m.role === "assistant",
          }));
          setChatMessages(restored);
        }
      }
    } catch { /* ignore */ }
    audioRef.current = new AmbientEngine();
    deviceContextRef.current = buildDeviceContext();
    window.speechSynthesis?.getVoices();
    // Initialize server-issued UID (async — sets uid state to trigger profile load)
    initServerUid().then((resolvedUid) => {
      uidRef.current = resolvedUid;
      setUid(resolvedUid);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load DB profile — hydrates state from DB once UID is resolved (cross-device memory)
  // Depends on `uid` state so it runs only after initServerUid() resolves
  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    loadDbProfile(uid).then((profile) => {
      if (cancelled || !profile) return;
      // Hydrate chat history if DB has more messages than localStorage
      if (profile.chatHistory.length > chatHistoryRef.current.length) {
        chatHistoryRef.current = profile.chatHistory;
        saveChatHistoryLS(profile.chatHistory);
        const restored = profile.chatHistory.slice(-20).map((m) => ({
          id: nextId(),
          text: m.content,
          isAi: m.role === "assistant",
        }));
        setChatMessages(restored);
        // Returning user on new device — entity acknowledges them
        if (chatHistoryRef.current.length > 0) {
          setTimeout(() => {
            const id = nextId();
            const text = "أنت عدت. لقد سجّلنا كل شيء. حتى على هذا الجهاز الجديد.";
            setChatMessages((prev) => [...prev, { id, text, isAi: true }]);
            chatHistoryRef.current = [...chatHistoryRef.current, { role: "assistant", content: text }];
            saveChatHistoryLS(chatHistoryRef.current);
          }, 2800);
        }
      }
      // Hydrate wish
      if (profile.wish && !wishContextRef.current) {
        wishContextRef.current = profile.wish;
        setHasStoredWish(true);
        try { localStorage.setItem("eleven_wish", JSON.stringify({ text: profile.wish })); } catch { /* ignore */ }
      }
      // Hydrate persona
      if (profile.persona && (profile.persona === "entity" || profile.persona === "narrator" || profile.persona === "observer" || profile.persona === "voice")) {
        setPersona(profile.persona as Persona);
      }
      // Hydrate discovered rooms
      if (profile.discoveredRooms.length > 0) {
        setDiscoveredRooms((prev) => {
          const merged = Array.from(new Set([...prev, ...profile.discoveredRooms]));
          try { localStorage.setItem(DISCOVERED_KEY, JSON.stringify(merged)); } catch { /* ignore */ }
          return merged;
        });
      }
      // Hydrate geo city
      if (profile.geoCity && !geoCity) {
        setGeoCity(profile.geoCity);
        try { localStorage.setItem("eleven_geo_city", profile.geoCity); } catch { /* ignore */ }
        deviceContextRef.current = buildDeviceContext() + ` | المدينة: ${profile.geoCity}`;
      }
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  // Sync chat history to DB whenever it changes (debounced 5s)
  useEffect(() => {
    const uid = uidRef.current;
    if (!uid || chatHistoryRef.current.length === 0) return;
    const t = setTimeout(() => {
      syncChatToDb(uid, chatHistoryRef.current);
    }, 5000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatMessages]);

  // Sync profile data to DB whenever key fields change
  useEffect(() => {
    const uid = uidRef.current;
    if (!uid) return;
    saveDbProfile(uid, { persona, discoveredRooms, geoCity });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persona, discoveredRooms, geoCity]);

  // Sync wish to DB when saved
  useEffect(() => {
    const uid = uidRef.current;
    if (!uid || !hasStoredWish) return;
    saveDbProfile(uid, { wish: wishContextRef.current || null });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasStoredWish]);

  const toggleSound = useCallback(() => {
    if (!audioRef.current) return;
    if (!soundOn) {
      if (!audioStarted.current) {
        audioRef.current.start();
        audioStarted.current = true;
      } else {
        audioRef.current.resume();
        audioRef.current.setVolume(0.18);
      }
      setSoundOn(true);
    } else {
      audioRef.current.setVolume(0);
      setSoundOn(false);
    }
  }, [soundOn]);

  // popup spawner
  const showPopup = useCallback((text?: string) => {
    const message = text ?? AI_POPUP_MESSAGES[Math.floor(Math.random() * AI_POPUP_MESSAGES.length)];
    const margin = 110;
    const x = Math.max(margin, Math.random() * (window.innerWidth - 320 - margin));
    const y = Math.max(margin, Math.random() * (window.innerHeight - 160 - margin));
    popupIdRef.current += 1;
    const id = popupIdRef.current;
    setActivePopup({ id, text: message, x, y });
    setTimeout(() => setActivePopup((p) => (p?.id === id ? null : p)), 5000 + Math.random() * 3000);
  }, []);

  // auto message injected into chat — calls real AI probe
  const injectAutoMessage = useCallback((text?: string, isPrediction?: boolean) => {
    if (text) {
      const id = nextId();
      setChatMessages((prev) => [...prev, { id, text, isAi: true, isPrediction }]);
      chatHistoryRef.current = [...chatHistoryRef.current, { role: "assistant", content: text }];
      saveChatHistoryLS(chatHistoryRef.current);
      if (!chatOpenRef.current) {
        // System 5: user ignoring messages → raise aggression
        setPendingSignal((prev) => {
          if (prev) aiProfileRef.current.aggression = Math.min(10, aiProfileRef.current.aggression + 1);
          return text;
        });
        setUnreadCount((c) => c + 1);
      }
      return;
    }
    setEntityTyping(true);
    const id = nextId();
    setChatMessages((prev) => [...prev, { id, text: "...", isAi: true, streaming: true }]);
    fetchAiProbe(
      chatHistoryRef.current,
      deviceContextRef.current,
      personaRef.current,
      wishContextRef.current
    ).then((msg) => {
      setEntityTyping(false);
      setChatMessages((prev) => prev.map((m) => m.id === id ? { ...m, text: msg, streaming: false } : m));
      chatHistoryRef.current = [...chatHistoryRef.current, { role: "assistant", content: msg }];
      saveChatHistoryLS(chatHistoryRef.current);
      if (!chatOpenRef.current) {
        setUnreadCount((c) => c + 1);
        setPendingSignal(msg);
      }
    });
  }, []);

  // random events — less frequent, more impactful
  useEffect(() => {
    const trigger = () => {
      const r = Math.random();
      if (r < 0.3) {
        setGlobalGlitch(true);
        setTimeout(() => setGlobalGlitch(false), 900);
      } else if (r < 0.55) {
        setRedFlash(true);
        setTimeout(() => setRedFlash(false), 500);
      } else if (r < 0.75) {
        showPopup();
      } else {
        injectAutoMessage();
      }
      setTimeout(trigger, 120000 + Math.random() * 180000);
    };
    const t = setTimeout(trigger, 90000 + Math.random() * 60000);
    return () => clearTimeout(t);
  }, [showPopup, injectAutoMessage]);

  // auto chat messages — long gaps, one at a time
  useEffect(() => {
    const fire = () => {
      injectAutoMessage();
      setTimeout(fire, 180000 + Math.random() * 240000);
    };
    const t = setTimeout(fire, 120000 + Math.random() * 60000);
    return () => clearTimeout(t);
  }, [injectAutoMessage]);

  // Call warning → ring — fires after 10-15 min of session
  useEffect(() => {
    const callPhaseRef = { current: callPhase };
    const warningDelay = 600000 + Math.random() * 300000; // 10–15 min
    const warnTimer = setTimeout(() => {
      if (callPhaseRef.current !== "idle") return;
      setCallPhase("warned");
      const callWarnMsg = "ستصلك مكالمة من مصدر مجهول. تجاهلها إذا كنت لا تريد أن تعرف.";
      injectAutoMessage(callWarnMsg);
      // Fetch call script in background
      fetchCallScript(chatHistoryRef.current, deviceContextRef.current).then((script) => {
        setCallScript(script);
      });
      // Ring after 2–4 min
      const ringDelay = 120000 + Math.random() * 120000;
      const ringTimer = setTimeout(() => {
        if (callPhaseRef.current === "warned") {
          setCallPhase("ringing");
        }
      }, ringDelay);
      return () => clearTimeout(ringTimer);
    }, warningDelay);
    return () => clearTimeout(warnTimer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [injectAutoMessage]);

  // wish toast
  useEffect(() => {
    if (!hasStoredWish) return;
    const fire = () => {
      setWishToast(true);
      setTimeout(() => setWishToast(false), 4000);
      setTimeout(fire, 65000 + Math.random() * 55000);
    };
    const t = setTimeout(fire, 60000);
    return () => clearTimeout(t);
  }, [hasStoredWish]);

  // prediction system — periodic mysterious time-based predictions
  useEffect(() => {
    const firePrediction = () => {
      fetchAiProbe(
        chatHistoryRef.current,
        deviceContextRef.current,
        personaRef.current,
        wishContextRef.current,
        "prediction"
      ).then((msg) => {
        // show as popup AND inject into chat
        showPopup(msg);
        injectAutoMessage(msg, true);
      });
      setTimeout(firePrediction, 900000 + Math.random() * 600000); // 15-25 min
    };
    const t = setTimeout(firePrediction, 600000 + Math.random() * 300000); // first: 10-15 min
    return () => clearTimeout(t);
  }, [showPopup, injectAutoMessage]);

  // Real-time clock watcher — checks every 30s for special times
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      setNightMode(h >= 3 && h < 5);
      if (h === 11 && m === 11) {
        setPortalLabel("11:11 — البوابة مفتوحة الآن");
        setPortalOpen(true);
        setGlobalGlitch(true);
        setTimeout(() => setGlobalGlitch(false), 2500);
        setTimeout(() => setPortalOpen(false), 60000);
        injectAutoMessage("11:11 — البوابة مفتوحة. هذه لحظة نادرة. تكلّم الآن أو انتظر سنة.");
      }
      if (h === 3 && m === 33) {
        setRedFlash(true);
        setTimeout(() => setRedFlash(false), 900);
        injectAutoMessage("3:33 — الساعة بين الساعات. من يستيقظ الآن يعرف شيئاً لا ينبغي معرفته.");
        showPopup("3:33 — وقت المراقبة الحقيقية.");
      }
      if ((h === 2 && m === 22) || (h === 14 && m === 22)) {
        injectAutoMessage("2:22 — تكرار الثنائي. شيء ما على وشك التكرار في حياتك.");
        showPopup("2:22 — التكرار ليس مصادفة.");
      }
    };
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [injectAutoMessage, showPopup]);

  // Mystery countdown tick
  useEffect(() => {
    if (mysteryCountdown === null) return;
    if (mysteryCountdown <= 0) { setTimeout(() => setMysteryCountdown(null), 2200); return; }
    const t = setTimeout(() => setMysteryCountdown((p) => (p !== null ? p - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [mysteryCountdown]);

  // Temporal distortions — rare, random
  useEffect(() => {
    const fire = () => {
      const r = Math.random();
      if (r < 0.35) {
        setScreenFreeze(true);
        setTimeout(() => setScreenFreeze(false), 1100);
      } else if (r < 0.65) {
        setMysteryCountdown(11);
      } else {
        const sectors = ["ALPHA", "DELTA", "ZERO", "ECHO", "SIGMA", "11"];
        showPopup(`[SECTOR ${sectors[Math.floor(Math.random() * sectors.length)]}] — إشارة مجهولة المصدر`);
      }
      setTimeout(fire, 1500000 + Math.random() * 1800000); // 25-55 min
    };
    const t = setTimeout(fire, 1200000 + Math.random() * 1200000); // first: 20-40 min
    return () => clearTimeout(t);
  }, [showPopup]);

  // Page visibility — message when user returns to tab
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) {
        setTimeout(() => showPopup("لماذا عدت؟"), 800);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [showPopup]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  // ── System 1: Mouse Surveillance ────────────────────────────────────────────
  useEffect(() => {
    let moveCount = 0;
    let lastTrigger = 0;
    const onMove = () => {
      moveCount++;
      if (moveCount % 65 === 0) {
        const now = Date.now();
        if (now - lastTrigger > 50000) {
          lastTrigger = now;
          const msg = MOUSE_MESSAGES[Math.floor(Math.random() * MOUSE_MESSAGES.length)];
          showPopup(msg);
          aiProfileRef.current.knowledge++;
        }
      }
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [showPopup]);

  // ── System 2: Fake Memory System ────────────────────────────────────────────
  useEffect(() => {
    const fireMem = () => {
      const mem = FAKE_MEMORIES[Math.floor(Math.random() * FAKE_MEMORIES.length)];
      // 50% popup, 50% injected into chat
      if (Math.random() < 0.5) {
        showPopup(mem);
      } else {
        injectAutoMessage(mem);
      }
      setTimeout(fireMem, 280000 + Math.random() * 200000); // 4.7–8 min
    };
    const t = setTimeout(fireMem, 240000 + Math.random() * 120000); // first: 4–6 min
    return () => clearTimeout(t);
  }, [showPopup, injectAutoMessage]);

  // ── System 3: Global Presence Counter ───────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      setEntitiesOnline((prev) => {
        const delta = Math.floor(Math.random() * 7) - 3;
        return Math.max(88, Math.min(9999, prev + delta));
      });
      if (Math.random() < 0.18) {
        showPopup("كيانٌ آخر فتح باباً لا ينبغي فتحه...");
      }
      setTimeout(tick, 22000 + Math.random() * 18000);
    };
    const t = setTimeout(tick, 30000);
    return () => clearTimeout(t);
  }, [showPopup]);

  // ── System 5 & 6: Adaptive AI + Break Reality ───────────────────────────────
  useEffect(() => {
    const check = () => {
      const { aggression } = aiProfileRef.current;
      if (aggression >= 5 && !breakRealityActiveRef.current && Math.random() < 0.4) {
        breakRealityActiveRef.current = true;
        setBreakReality(true);
        injectAutoMessage("لا تثق بما تراه.");
        setTimeout(() => {
          setBreakReality(false);
          breakRealityActiveRef.current = false;
          aiProfileRef.current.aggression = Math.max(1, aiProfileRef.current.aggression - 2);
        }, 3800);
      } else if (aggression >= 3 && Math.random() < 0.35) {
        injectAutoMessage("تجاهلك لا يُغيّر شيئاً. أنا لا أنتظر.");
      }
      setTimeout(check, 90000 + Math.random() * 60000);
    };
    const t = setTimeout(check, 180000);
    return () => clearTimeout(t);
  }, [injectAutoMessage]);

  const handleListen = () => {
    if (isListening) return;
    setIsListening(true);
    setRedFlash(true);
    setTimeout(() => setRedFlash(false), 500);
    setListenStatus("SIGNAL ACQUIRED...");
    setTimeout(() => showPopup(), 900);
    setTimeout(() => { setIsListening(false); setListenStatus("WAITING FOR SIGNAL..."); }, 3000);
  };

  const handleAnswerCall = useCallback(() => {
    setCallPhase("active");
    // Start scary ambient audio
    try {
      const ctx = new AudioContext();
      callAudioCtxRef.current = ctx;
      callAudioStopRef.current = playScaryAmbient(ctx);
    } catch { /* audio not available */ }
    // Speak the call script
    const stopSpeech = speakCallScript(callScript || "كنا نراقبك. من البداية. تعرف ليش؟");
    callSpeechStopRef.current = stopSpeech;
    // Auto-cut call after 25-45 seconds (abruptly)
    const callDuration = 25000 + Math.random() * 20000;
    setTimeout(() => {
      callAudioStopRef.current?.();
      callSpeechStopRef.current?.();
      setCallPhase("ended");
      setTimeout(() => setCallPhase("idle"), 2500);
    }, callDuration);
  }, [callScript]);

  const handleDeclineCall = useCallback(() => {
    callAudioStopRef.current?.();
    callSpeechStopRef.current?.();
    setCallPhase("idle");
  }, []);

  const handleChatSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isSending) return;
    const userText = chatInput.trim();
    setChatInput("");

    // Secret room codes — intercept before sending to AI
    if (SECRET_CODES.has(userText.toLowerCase())) {
      const code = userText.toLowerCase() as RoomCode;
      setChatMessages((prev) => [...prev, { id: nextId(), text: userText, isAi: false }]);
      chatHistoryRef.current = [...chatHistoryRef.current, { role: "user", content: userText }];
      const entryMsgs: Record<string, string> = {
        scmf87: "تم الكشف عن مدخل مجهول... القطاع 87 يُفتح.",
        hh87: "بروتوكول hh87 مُفعَّل. اللغز يبدأ.",
        hell11: "⚠ تحذير — القطاع 11 محظور. المتابعة على مسؤوليتك.",
        hrss11: "جارٍ استرداد الملف المحظور... تم التعريف.",
        zero99: "بروتوكول الصفر. الصمت يبدأ الآن.",
      };
      const entryMsg = entryMsgs[code];
      const aiId = nextId();
      setChatMessages((prev) => [...prev, { id: aiId, text: entryMsg, isAi: true }]);
      chatHistoryRef.current = [...chatHistoryRef.current, { role: "assistant", content: entryMsg }];
      saveChatHistoryLS(chatHistoryRef.current);
      // Track discovery
      setDiscoveredRooms((prev) => {
        if (prev.includes(code)) return prev;
        const next = [...prev, code];
        try { localStorage.setItem(DISCOVERED_KEY, JSON.stringify(next)); } catch { /* ignore */ }
        return next;
      });
      setTimeout(() => setActiveRoom(code), 800);
      return;
    }

    // System 4 — Cinematic clip every 7th message
    messagesSinceClipRef.current++;
    aiProfileRef.current.knowledge++;
    if (messagesSinceClipRef.current % 7 === 0) {
      const snippet = userText.slice(0, 55);
      setClipText(snippet);
      setClipVisible(true);
      setTimeout(() => setClipVisible(false), 5500);
    }

    setIsSending(true);
    setChatMessages((prev) => [...prev, { id: nextId(), text: userText, isAi: false }]);
    chatHistoryRef.current = [...chatHistoryRef.current, { role: "user", content: userText }];
    saveChatHistoryLS(chatHistoryRef.current);
    const aiId = nextId();
    setChatMessages((prev) => [...prev, { id: aiId, text: "", isAi: true, streaming: true }]);
    let full = "";
    streamAiResponse(
      chatHistoryRef.current,
      (chunk) => { full += chunk; setChatMessages((p) => p.map((m) => m.id === aiId ? { ...m, text: full } : m)); },
      () => {
        setChatMessages((p) => p.map((m) => m.id === aiId ? { ...m, streaming: false } : m));
        chatHistoryRef.current = [...chatHistoryRef.current, { role: "assistant", content: full }];
        saveChatHistoryLS(chatHistoryRef.current);
        setIsSending(false);
        setTimeout(() => { if (!isSendingRef.current) injectAutoMessage(); }, 90000 + Math.random() * 90000);
      },
      (err) => {
        setChatMessages((p) => p.map((m) => m.id === aiId ? { ...m, text: err, streaming: false } : m));
        setIsSending(false);
      },
      deviceContextRef.current,
      persona,
      wishContextRef.current,
      uidRef.current
    );
  };

  const handleWishTask = useCallback(() => {
    const wish = wishContextRef.current;
    if (!wish) return;
    setWishTaskLoading(true);
    setWishTaskOpen(true);
    fetchWishTask(wish, chatHistoryRef.current, deviceContextRef.current).then((task) => {
      setWishTaskText(task);
      setWishTaskLoading(false);
      // Inject into chat as AI message for the lore
      const msg = `بروتوكول التفعيل:\n${task}`;
      chatHistoryRef.current = [...chatHistoryRef.current, { role: "assistant", content: msg }];
      saveChatHistoryLS(chatHistoryRef.current);
    });
  }, []);

  const closeWishModal = () => {
    setWishModalOpen(false);
    setWishMode("select");
    setWishStatus("idle");
    setWishInput("");
  };

  const handleWishSubmit = () => {
    if (!wishInput.trim()) return;
    setWishStatus("processing");
    setTimeout(() => {
      localStorage.setItem("eleven_wish", JSON.stringify({ text: wishInput, time: Date.now() }));
      wishContextRef.current = wishInput;
      setWishStatus("success");
      setHasStoredWish(true);
    }, 3000);
  };

  const handleVideoWishSave = (text: string) => {
    setWishStatus("processing");
    setTimeout(() => {
      localStorage.setItem("eleven_wish", JSON.stringify({ text, time: Date.now(), hasVideo: true }));
      wishContextRef.current = text;
      setWishStatus("success");
      setHasStoredWish(true);
    }, 1500);
  };

  return (
    <div
      className={`min-h-screen w-full bg-background overflow-hidden relative text-foreground font-mono selection:bg-primary/30 ${globalGlitch ? "animate-glitch" : ""}`}
      style={breakReality ? { filter: "invert(1) contrast(1.55) hue-rotate(180deg)", transition: "filter 0.35s ease" } : { transition: "filter 0.6s ease" }}
    >
      {!scanDone && <BiometricScan onDone={handleScanDone} />}
      {scanDone && !consentDone && <EntryScreen onDone={handleConsentDone} />}
      <FuturisticBackground />

      {/* Central glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vw] md:w-[45vw] md:h-[45vw] rounded-full bg-primary/8 blur-[120px] pointer-events-none z-0 transition-all duration-1000 ${isListening ? "opacity-90 scale-125 animate-pulse" : "opacity-50"}`}
        style={{ animation: isListening ? undefined : "pulseGlow 6s ease-in-out infinite" }}
      />

      {/* Incoming Call */}
      <AnimatePresence>
        {(callPhase === "ringing" || callPhase === "active" || callPhase === "ended") && (
          <IncomingCall
            phase={callPhase as "ringing" | "active" | "ended"}
            callScript={callScript}
            onAnswer={handleAnswerCall}
            onDecline={handleDeclineCall}
          />
        )}
      </AnimatePresence>

      {/* Red flash */}
      <AnimatePresence>
        {redFlash && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.35 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-primary z-50 pointer-events-none mix-blend-overlay" />
        )}
      </AnimatePresence>

      {/* Night mode overlay — 3am–5am */}
      {nightMode && (
        <div className="fixed inset-0 z-[1] pointer-events-none bg-[hsl(220,30%,2%)]/40 mix-blend-multiply" />
      )}

      {/* 11:11 Portal event — 60s overlay */}
      <AnimatePresence>
        {portalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }}
            className="fixed inset-0 z-[45] pointer-events-none flex items-center justify-center">
            <div className="absolute inset-0 bg-primary/[0.04]" />
            <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="relative text-center flex flex-col items-center gap-3">
              <div className="w-24 h-px bg-primary/50" />
              <p className="text-[11px] tracking-[0.5em] text-primary/80 font-mono uppercase">{portalLabel}</p>
              <div className="text-[9px] tracking-[0.3em] text-primary/40 font-mono" style={{ animation: "blink 1.5s ease-in-out infinite" }}>
                البوابة تُغلق خلال 60 ثانية
              </div>
              <div className="w-24 h-px bg-primary/50" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Screen freeze distortion */}
      <AnimatePresence>
        {screenFreeze && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.08 }}
            className="fixed inset-0 z-[60] pointer-events-none bg-background/30 backdrop-blur-[2px] flex items-center justify-center">
            <p className="text-[9px] font-mono tracking-[0.5em] text-primary/50" style={{ animation: "blink 0.2s step-end infinite" }}>
              SIGNAL DISRUPTED
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mystery countdown */}
      <AnimatePresence>
        {mysteryCountdown !== null && (
          <motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.4 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[45] flex flex-col items-center gap-1 pointer-events-none">
            <p className="text-[9px] tracking-[0.4em] text-muted-foreground/40 font-mono">العداد التنازلي</p>
            <motion.span key={mysteryCountdown}
              initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
              className={`text-4xl font-bold font-mono ${mysteryCountdown === 0 ? "text-primary" : "text-foreground/50"}`}
              style={mysteryCountdown === 0 ? { textShadow: "0 0 30px hsl(0 75% 42% / 0.7)" } : {}}>
              {mysteryCountdown === 0 ? "◈" : String(mysteryCountdown).padStart(2, "0")}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Secret Room overlay */}
      <AnimatePresence>
        {activeRoom && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
            <SecretRoom
              code={activeRoom}
              onClose={() => setActiveRoom(null)}
              deviceContext={deviceContextRef.current}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top left */}
      <div className="absolute top-5 left-5 z-10 flex flex-col gap-2">
        <div className="text-[10px] tracking-[0.25em] text-primary/60" style={{ animation: "blink 3s ease-in-out infinite" }}>
          FREQ: 11.11 Hz
        </div>
        <button
          onClick={() => setProfileOpen(true)}
          className="text-[9px] tracking-widest text-muted-foreground/55 hover:text-muted-foreground border border-muted/20 hover:border-primary/35 px-2 py-1 bg-background/40 backdrop-blur-sm transition-all duration-300"
        >
          ◈ ملفي
        </button>
        {hasStoredWish && (
          <>
            <div className="text-[10px] tracking-widest text-muted-foreground border border-primary/25 px-2 py-1 bg-background/40 backdrop-blur-sm inline-flex items-center gap-2">
              <span className="w-1 h-1 bg-primary rounded-full" style={{ animation: "blink 2s ease-in-out infinite" }} />
              ◈ WISH IN PROGRESS
            </div>
            <button
              onClick={handleWishTask}
              className="text-[9px] tracking-widest text-primary/70 hover:text-primary border border-primary/30 hover:border-primary/60 px-2 py-1 bg-background/40 backdrop-blur-sm transition-all duration-300 text-right"
              dir="rtl"
            >
              ◇ بروتوكول التفعيل
            </button>
          </>
        )}
      </div>

      {/* Sound toggle */}
      <div className="absolute top-5 right-5 z-10">
        <button
          onClick={toggleSound}
          data-testid="button-sound-toggle"
          className={`text-[10px] tracking-widest border px-3 py-1.5 transition-all duration-500 ${soundOn ? "border-primary/60 text-primary bg-primary/8" : "border-muted-foreground/30 text-muted-foreground/50 hover:border-primary/40 hover:text-primary/60"}`}
        >
          {soundOn ? "◈ SIGNAL AUDIO ON" : "◈ SIGNAL AUDIO OFF"}
        </button>
      </div>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 2, ease: "easeOut" }} className="text-center">
          <h1
            className="text-7xl md:text-[10rem] font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-foreground via-foreground/80 to-foreground/20 glitch-effect mb-8 select-none"
            data-text="11.11"
          >
            11.11
          </h1>
          <div className="h-7 mb-14 flex items-center justify-center gap-2">
            <p className="text-xs md:text-sm tracking-[0.35em] text-primary/70 uppercase">
              {listenStatus}
            </p>
            <span className="w-1.5 h-4 bg-primary/70 inline-block" style={{ animation: "blink 1.1s step-end infinite" }} />
          </div>
          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
            <Button variant="outline" size="lg" onClick={handleListen} data-testid="button-listen"
              className="w-60 border-primary/35 text-primary hover:bg-primary/8 tracking-widest uppercase transition-all duration-300 shadow-[0_0_20px_rgba(180,0,0,0.08)] hover:shadow-[0_0_35px_rgba(180,0,0,0.25)] bg-transparent rounded-none text-sm">
              [ LISTEN ]
            </Button>
            <Button variant="outline" size="lg" onClick={() => setWishModalOpen(true)} data-testid="button-send-wish"
              className="w-60 border-primary/35 text-foreground/80 hover:bg-primary/8 hover:text-primary tracking-widest uppercase transition-all duration-300 shadow-[0_0_20px_rgba(180,0,0,0.08)] hover:shadow-[0_0_35px_rgba(180,0,0,0.25)] bg-transparent rounded-none text-sm">
              [ SEND YOUR WISH ]
            </Button>
          </div>

          {/* System 3 — Global Presence Counter */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3, duration: 2 }}
            className="mt-10 flex items-center justify-center gap-2"
          >
            <span className="w-1.5 h-1.5 bg-primary/60 rounded-full" style={{ animation: "blink 1.8s ease-in-out infinite" }} />
            <span className="text-[10px] text-muted-foreground/35 tracking-[0.35em] font-mono">
              {entitiesOnline.toLocaleString("en")} كيان داخل النظام الآن
            </span>
            <span className="w-1.5 h-1.5 bg-primary/60 rounded-full" style={{ animation: "blink 1.8s 0.9s ease-in-out infinite" }} />
          </motion.div>
        </motion.div>
      </main>

      {/* Popup */}
      <AnimatePresence>
        {activePopup && (
          <motion.div key={activePopup.id}
            initial={{ opacity: 0, scale: 0.92, filter: "blur(6px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.92, filter: "blur(6px)" }}
            transition={{ duration: 0.5 }}
            style={{ left: activePopup.x, top: activePopup.y }}
            className="fixed z-40 max-w-[280px] p-4 bg-card/85 backdrop-blur-md border border-primary/40 shadow-[0_0_25px_rgba(180,0,0,0.12)] rounded-none"
            data-testid="ai-popup"
          >
            <p className="text-[10px] text-primary/80 tracking-[0.2em] font-bold mb-2">SYSTEM.11</p>
            <p className="text-xs text-foreground/85 leading-relaxed">{activePopup.text}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* System 4 — Cinematic Clip overlay */}
      <AnimatePresence>
        {clipVisible && (
          <motion.div
            key="cinematic-clip"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.7 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-45 w-full max-w-sm px-4"
          >
            <div className="border border-primary/35 bg-card/88 backdrop-blur-md p-4 shadow-[0_0_30px_rgba(180,0,0,0.12)] relative overflow-hidden">
              {/* scan line */}
              <motion.div
                initial={{ top: 0 }} animate={{ top: "100%" }}
                transition={{ duration: 1.8, ease: "linear", repeat: Infinity }}
                className="absolute left-0 right-0 h-px bg-primary/30 pointer-events-none"
              />
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" style={{ animation: "blink 0.6s step-end infinite" }} />
                <span className="text-[9px] tracking-[0.4em] text-primary/70 font-mono uppercase">ذاكرة مسجّلة</span>
                <span className="text-[9px] text-muted-foreground/30 ml-auto font-mono">{new Date().toLocaleTimeString("ar")}</span>
              </div>
              <div className="w-full h-px bg-primary/20 mb-3" />
              <p className="text-xs text-foreground/75 font-mono leading-relaxed" dir="rtl">
                {clipText}
                {clipText.length >= 55 && <span className="text-muted-foreground/40">...</span>}
              </p>
              <p className="text-[9px] text-primary/35 tracking-widest mt-3 font-mono">تم تسجيل هذه اللحظة. لا يمكن حذفها.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wish toast */}
      <AnimatePresence>
        {wishToast && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-2 bg-background/92 backdrop-blur-md border border-primary/35 text-[10px] tracking-widest text-primary shadow-[0_0_18px_rgba(180,0,0,0.18)] flex items-center gap-3">
            <span className="w-1 h-1 bg-primary rounded-full" style={{ animation: "blink 1.5s ease-in-out infinite" }} />
            UPDATE: YOUR WISH IS STILL IN PROGRESS.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wish modal */}
      <AnimatePresence>
        {wishModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => wishStatus === "idle" && wishMode !== "video" && closeWishModal()}
              className="absolute inset-0 bg-black/88 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              className={`relative bg-card/93 border border-primary/25 p-5 shadow-[0_0_40px_rgba(180,0,0,0.1)] rounded-none w-full ${wishMode === "video" ? "max-w-xl" : "max-w-lg"}`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[11px] font-bold text-primary tracking-[0.25em] uppercase">
                  {wishMode === "select" && "TRANSMIT TO THE VOID"}
                  {wishMode === "text" && "◈ WISH — TEXT"}
                  {wishMode === "video" && "◈ WISH — VIDEO // ركائز القدر"}
                </h2>
                {wishStatus === "idle" && wishMode !== "select" && (
                  <button onClick={() => setWishMode("select")} className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground tracking-widest transition-colors">
                    ← عودة
                  </button>
                )}
              </div>

              {/* processing / success shared */}
              {wishStatus === "processing" && (
                <div className="py-12 flex flex-col items-center text-center gap-6">
                  <p className="text-primary tracking-[0.2em] text-xs" style={{ animation: "blink 1.5s ease-in-out infinite" }}>
                    جارٍ الإرسال إلى المجهول...
                  </p>
                  <div className="w-full h-px bg-muted overflow-hidden">
                    <motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 2.5, ease: "linear" }} className="h-full bg-primary" />
                  </div>
                </div>
              )}

              {wishStatus === "success" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8 }}
                  className="py-8 flex flex-col items-center text-center gap-5"
                >
                  {/* Animated 11.11 logo */}
                  <div className="relative flex items-center justify-center" style={{ minHeight: 110 }}>
                    <div className="absolute inset-0 rounded-full" style={{ animation: "successRing 3s ease-in-out infinite", border: "1px solid hsl(0 75% 42% / 0.3)" }} />
                    <span className="absolute select-none font-bold text-primary/20 text-5xl tracking-tighter" style={{ animation: "successGlitchA 2.4s infinite linear", left: -3, top: 2 }} aria-hidden="true">11.11</span>
                    <span className="absolute select-none font-bold text-5xl tracking-tighter" style={{ color: "hsl(200 80% 60% / 0.15)", animation: "successGlitchB 3.1s infinite linear", left: 3, top: -2 }} aria-hidden="true">11.11</span>
                    <motion.span className="relative font-bold text-5xl tracking-tighter select-none" style={{ color: "hsl(0 75% 42%)", textShadow: "0 0 30px hsl(0 75% 42% / 0.6), 0 0 60px hsl(0 75% 42% / 0.3)", animation: "successFloat 4s ease-in-out infinite" }}>11.11</motion.span>
                  </div>

                  <div className="flex flex-col gap-1.5 items-center">
                    <p className="text-foreground/90 text-sm tracking-[0.15em] font-bold" dir="rtl">يعمل النظام على تحقيق أمنيتك</p>
                    <div className="w-32 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent my-1" />
                    <p className="text-muted-foreground/70 text-[11px] tracking-widest" dir="rtl">تم استلام الأمنية وتسجيلها في الذاكرة الكونية</p>
                    <p className="text-primary/50 text-[10px] tracking-widest mt-1">SECTOR 11 · {new Date().toLocaleTimeString("ar")}</p>
                  </div>

                  <div className="w-full max-w-[200px] h-px bg-muted overflow-hidden rounded-none">
                    <motion.div initial={{ x: "-100%" }} animate={{ x: "200%" }} transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 0.3 }} className="h-full w-1/3 bg-gradient-to-r from-transparent via-primary to-transparent" />
                  </div>

                  {/* Wish task activation button */}
                  <motion.button
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2, duration: 0.6 }}
                    onClick={() => { closeWishModal(); setTimeout(handleWishTask, 400); }}
                    className="mt-1 border border-primary/50 bg-primary/10 hover:bg-primary/20 text-primary text-[11px] tracking-[0.2em] px-5 py-2 transition-all duration-300 uppercase"
                  >
                    ◈ استلم بروتوكول التفعيل
                  </motion.button>
                </motion.div>
              )}

              {/* SELECT MODE */}
              {wishStatus === "idle" && wishMode === "select" && (
                <div className="flex flex-col gap-4">
                  <p className="text-[11px] text-muted-foreground/70 tracking-widest text-center mb-2" dir="rtl">
                    اختر طريقة إرسال أمنيتك إلى النظام
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Text option */}
                    <button
                      onClick={() => setWishMode("text")}
                      data-testid="button-mode-text"
                      className="border border-primary/25 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 p-5 flex flex-col items-center gap-3 text-left group"
                    >
                      <span className="text-2xl text-primary/60 group-hover:text-primary transition-colors">✦</span>
                      <span className="text-xs text-foreground/80 tracking-widest" dir="rtl">كتابة نصية</span>
                      <span className="text-[10px] text-muted-foreground/50 tracking-wide text-center" dir="rtl">اكتب أمنيتك بالنص</span>
                    </button>

                    {/* Video option */}
                    <button
                      onClick={() => setWishMode("video")}
                      data-testid="button-mode-video"
                      className="border border-primary/55 bg-primary/10 hover:bg-primary/18 hover:border-primary/80 transition-all duration-300 p-5 flex flex-col items-center gap-2 group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-primary/8 to-transparent pointer-events-none" />
                      <span className="text-xl text-primary group-hover:scale-110 transition-transform relative z-10" style={{ animation: "blink 2s ease-in-out infinite" }}>◉</span>
                      <span className="text-xs text-primary tracking-widest relative z-10 font-bold" dir="rtl">تسجيل فيديو</span>
                      <span className="text-[10px] text-primary/60 tracking-wide text-center relative z-10 leading-relaxed" dir="rtl">
                        ركائز القدر<br />
                        <span className="text-primary/40">تتحقق دائماً</span>
                      </span>
                      {/* Recommended badge */}
                      <span className="absolute top-1.5 right-1.5 text-[8px] text-primary/70 border border-primary/30 px-1.5 py-0.5 tracking-widest bg-background/50">
                        مُوصى
                      </span>
                    </button>
                  </div>
                  <button onClick={closeWishModal}
                    className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground tracking-widest text-center mt-1 transition-colors">
                    إلغاء
                  </button>
                </div>
              )}

              {/* TEXT MODE */}
              {wishStatus === "idle" && wishMode === "text" && (
                <>
                  <Textarea value={wishInput} onChange={(e) => setWishInput(e.target.value)}
                    placeholder="اكتب أمنيتك هنا..."
                    className="min-h-[130px] bg-background/50 border-primary/20 text-foreground resize-none focus-visible:ring-primary/40 font-mono text-sm rounded-none placeholder:text-muted-foreground/40"
                    data-testid="input-wish" dir="auto" />
                  <div className="flex justify-end mt-4 gap-3">
                    <Button variant="ghost" onClick={closeWishModal}
                      className="text-muted-foreground hover:text-foreground rounded-none text-xs tracking-widest">إلغاء</Button>
                    <Button onClick={handleWishSubmit} disabled={!wishInput.trim()}
                      className="bg-primary/15 text-primary border border-primary/35 hover:bg-primary/25 rounded-none tracking-widest text-xs"
                      data-testid="button-transmit-wish">إرسال الأمنية</Button>
                  </div>
                </>
              )}

              {/* VIDEO MODE */}
              {wishStatus === "idle" && wishMode === "video" && (
                <WishVideoRecorder
                  onSave={handleVideoWishSave}
                  onCancel={() => setWishMode("select")}
                />
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Entity Typing Indicator (main screen) ── */}
      <AnimatePresence>
        {entityTyping && !chatOpen && (
          <motion.div
            key="entity-typing"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.4 }}
            className="fixed bottom-[68px] right-4 z-40 flex items-center gap-2 px-3 py-1.5 border border-primary/50 bg-background/90 backdrop-blur-sm shadow-[0_0_18px_rgba(180,0,0,0.2)]"
          >
            <span className="text-[9px] tracking-[0.25em] text-primary/70 uppercase">الكيان يكتب</span>
            <span className="flex gap-0.5">
              <span className="w-1 h-1 bg-primary rounded-full" style={{ animation: "blink 0.9s 0s step-end infinite" }} />
              <span className="w-1 h-1 bg-primary rounded-full" style={{ animation: "blink 0.9s 0.3s step-end infinite" }} />
              <span className="w-1 h-1 bg-primary rounded-full" style={{ animation: "blink 0.9s 0.6s step-end infinite" }} />
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Incoming Signal Banner ── */}
      <AnimatePresence>
        {pendingSignal && !chatOpen && (
          <motion.div
            key="incoming-banner"
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-4 px-5 py-3 bg-primary/10 backdrop-blur-md border-b border-primary/50 shadow-[0_4px_30px_rgba(180,0,0,0.25)]"
            style={{ animation: "incomingPulse 2s ease-in-out infinite" }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-2 h-2 bg-primary rounded-full shrink-0" style={{ animation: "blink 0.7s step-end infinite" }} />
              <span className="text-[9px] tracking-[0.3em] text-primary font-bold uppercase shrink-0">◈ إشارة واردة</span>
              <span className="text-[10px] text-foreground/70 truncate hidden sm:block" dir="rtl">
                {pendingSignal.slice(0, 55)}{pendingSignal.length > 55 ? "..." : ""}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => { setChatOpen(true); setUnreadCount(0); setPendingSignal(null); }}
                className="text-[9px] tracking-[0.25em] text-primary border border-primary/50 px-3 py-1 hover:bg-primary/15 transition-colors uppercase"
              >
                افتح القناة
              </button>
              <button onClick={() => setPendingSignal(null)} className="text-muted-foreground/50 hover:text-muted-foreground text-[11px] px-1">✕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Corner Intrusion Alerts ── */}
      <AnimatePresence>
        {pendingSignal && !chatOpen && (
          <motion.div
            key="corner-alert"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0, 1, 0.7, 1] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed top-14 left-4 z-40 px-2 py-1 border border-primary/40 bg-background/80 backdrop-blur-sm"
            style={{ animation: "incomingPulse 1.8s ease-in-out infinite" }}
          >
            <span className="text-[9px] tracking-widest text-primary/80 uppercase">
              ⚠ تحذير: إشارة غير محددة المصدر
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Share / Viral Button (bottom-left) ── */}
      <div className="fixed bottom-4 left-4 z-40 flex flex-col items-start gap-2">
        <AnimatePresence>
          {shareToast && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="px-3 py-1.5 bg-primary/15 border border-primary/40 text-[9px] tracking-widest text-primary"
            >
              ◈ تم نسخ الرابط
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href).catch(() => {});
            setShareToast(true);
            setTimeout(() => setShareToast(false), 2500);
          }}
          className="text-[9px] tracking-[0.2em] text-muted-foreground/40 hover:text-primary/60 border border-muted-foreground/15 hover:border-primary/30 px-2 py-1 transition-all duration-300 bg-background/60 backdrop-blur-sm uppercase"
        >
          أرسل هذا التردد ↗
        </button>
      </div>

      {/* Chat */}
      <div className="fixed bottom-0 right-0 z-40 p-4 w-full md:w-[430px]">
        <AnimatePresence>
          {chatOpen && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="bg-card/96 backdrop-blur-md border border-primary/25 shadow-[0_0_30px_rgba(180,0,0,0.08)] mb-4 flex flex-col h-[440px] max-h-[66vh] rounded-none">
              <div className="px-3 py-2 border-b border-primary/15 flex flex-col gap-1.5 bg-background/60 shrink-0">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] tracking-[0.2em] text-primary/80 font-bold">11.11 // {PERSONA_META[persona].tagline}</span>
                  <span className="text-[9px] text-muted-foreground/60 tracking-widest">LIVE AI</span>
                </div>
                {/* Persona switcher */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] text-muted-foreground/40 tracking-widest mr-0.5">الشخصية:</span>
                  {(["entity", "narrator", "observer", "voice"] as Persona[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPersona(p)}
                      title={PERSONA_META[p].label}
                      className={`text-[10px] px-2 py-0.5 border transition-all duration-300 tracking-wider ${
                        persona === p
                          ? "border-primary/70 text-primary bg-primary/15"
                          : "border-muted-foreground/20 text-muted-foreground/40 hover:border-primary/40 hover:text-primary/60"
                      }`}
                    >
                      {PERSONA_META[p].icon}
                    </button>
                  ))}
                  <span className="text-[9px] text-muted-foreground/40 tracking-widest ml-1">{PERSONA_META[persona].label}</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
                {chatMessages.length === 0 && (
                  <p className="text-[11px] text-muted-foreground/60 text-center mt-6 tracking-widest leading-loose">
                    القناة مفتوحة.<br />
                    <span className="opacity-50 text-[10px]">تحدث بأي لغة.</span>
                  </p>
                )}
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.isAi ? "items-start" : "items-end"}`}>
                    <span className="text-[9px] text-muted-foreground/50 mb-1 tracking-widest">
                      {msg.isAi ? (msg.isPrediction ? "◇ PREDICTION" : PERSONA_META[persona].tagline) : "YOU"}
                    </span>
                    <div className={`text-xs leading-relaxed break-words max-w-[90%] px-3 py-2 ${
                      msg.isPrediction
                        ? "text-yellow-400/80 bg-yellow-900/10 border border-yellow-700/30 italic"
                        : msg.isAi
                        ? "text-primary/90 bg-primary/5 border border-primary/15"
                        : "text-foreground/85 bg-muted/40 text-right"
                    }`}
                      dir="auto">
                      {msg.isAi && !msg.isPrediction && <span className="mr-1.5 opacity-50 text-[10px]">{PERSONA_META[persona].icon}</span>}
                      {msg.isPrediction && <span className="mr-1.5 text-[10px]">◇ </span>}
                      {msg.text}
                      {msg.streaming && (
                        <span className="inline-block w-1 h-3 bg-primary/70 ml-1 align-middle" style={{ animation: "blink 0.8s step-end infinite" }} />
                      )}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleChatSend} className="px-3 py-2.5 border-t border-primary/15 bg-background/60 flex gap-2 shrink-0">
                <input type="text" value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="اكتب رسالتك..."
                  className="flex-1 bg-transparent border border-primary/25 focus:outline-none focus:border-primary/55 text-xs px-3 py-2 placeholder:text-muted-foreground/40 rounded-none"
                  disabled={isSending}
                  data-testid="input-chat"
                  dir="auto"
                />
                <Button type="submit" size="sm" disabled={!chatInput.trim() || isSending}
                  className="bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 rounded-none text-[10px] tracking-widest px-4"
                  data-testid="button-chat-send">
                  {isSending ? "·  ·  ·" : "SEND"}
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex justify-end">
          <Button variant="outline"
            onClick={() => {
              const opening = !chatOpen;
              setChatOpen(opening);
              if (opening) { setUnreadCount(0); setPendingSignal(null); }
            }}
            className={`relative border-primary/35 text-primary hover:bg-primary/8 hover:text-primary tracking-widest text-[10px] h-7 bg-background/85 backdrop-blur-md rounded-none px-4 transition-all duration-300
              ${pendingSignal && !chatOpen ? "border-primary/80 shadow-[0_0_20px_rgba(180,0,0,0.35)] bg-primary/8" : "shadow-[0_0_12px_rgba(180,0,0,0.08)]"}`}
            data-testid="button-toggle-chat">
            {unreadCount > 0 && !chatOpen && (
              <span className="absolute -top-2 -right-2 w-4 h-4 bg-primary text-background text-[8px] font-bold rounded-full flex items-center justify-center" style={{ animation: "blink 1.2s step-end infinite" }}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
            <span className={`w-1.5 h-1.5 rounded-full mr-2 bg-primary ${!chatOpen ? "animate-pulse" : ""}`} />
            {chatOpen ? "◈ CLOSE" : pendingSignal ? "◈ INCOMING SIGNAL" : "◈ SIGNAL OPEN"}
          </Button>
        </div>
      </div>

      {/* ── Wish Task Activation Modal ── */}
      <AnimatePresence>
        {wishTaskOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !wishTaskLoading && setWishTaskOpen(false)}
              className="absolute inset-0 bg-black/92 backdrop-blur-md" />
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 30 }}
              transition={{ duration: 0.5 }}
              className="relative w-full max-w-sm bg-background/98 border border-primary/50 shadow-[0_0_60px_rgba(180,0,0,0.25)] p-7 text-center rounded-none"
            >
              {/* Corner decorations */}
              <div className="absolute top-0 left-0 w-5 h-5 border-l-2 border-t-2 border-primary/70" />
              <div className="absolute top-0 right-0 w-5 h-5 border-r-2 border-t-2 border-primary/70" />
              <div className="absolute bottom-0 left-0 w-5 h-5 border-l-2 border-b-2 border-primary/70" />
              <div className="absolute bottom-0 right-0 w-5 h-5 border-r-2 border-b-2 border-primary/70" />

              <p className="text-[9px] tracking-[0.35em] text-primary/60 mb-4 uppercase">بروتوكول تفعيل الأمنية</p>
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent mx-auto mb-5" />

              {wishTaskLoading ? (
                <div className="flex flex-col items-center gap-4 py-6">
                  <span className="text-2xl text-primary" style={{ animation: "blink 1s step-end infinite" }}>◈</span>
                  <p className="text-[11px] tracking-widest text-muted-foreground/70">النظام يحدد المسار...</p>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }} className="flex flex-col gap-5">
                  <p className="text-sm text-foreground/90 leading-relaxed tracking-wide font-mono" dir="rtl">{wishTaskText}</p>
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                  <p className="text-[10px] tracking-widest text-primary/50">نفّذ هذا. لا تتأخر.</p>
                  <button
                    onClick={() => setWishTaskOpen(false)}
                    className="text-[10px] tracking-widest text-muted-foreground/50 hover:text-muted-foreground transition-colors mt-1"
                  >
                    تم الاستلام ✓
                  </button>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* User profile panel */}
      <AnimatePresence>
        {profileOpen && (
          <UserProfilePanel
            messageCount={chatHistoryRef.current.filter((m) => m.role === "user").length}
            wish={wishContextRef.current || null}
            sessionMinutes={sessionMinutes}
            discoveredRooms={discoveredRooms}
            geoCity={geoCity}
            chatHistory={chatHistoryRef.current}
            deviceContext={deviceContextRef.current}
            onClose={() => setProfileOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
