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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
          {/* Power claim */}
          <div className="border border-primary/50 bg-primary/8 p-4 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
            <p className="text-primary text-xs tracking-[0.3em] font-bold mb-2 relative z-10">◈ بروتوكول ركائز القدر</p>
            <p className="text-foreground/90 text-sm leading-relaxed relative z-10 font-bold" dir="rtl">
              تسجيل الفيديو يضاعف طاقة أمنيتك
            </p>
            <div className="w-16 h-px bg-primary/40 mx-auto my-2 relative z-10" />
            <p className="text-foreground/65 text-[11px] leading-relaxed relative z-10" dir="rtl">
              الأمنيات المسجَّلة بالفيديو تتحقق دائماً.<br />
              النظام يُحلّل طاقتك الصوتية والبصرية<br />
              ويزرع الأمنية في مسار الأحداث.
            </p>
          </div>

          {/* What are "ركائز القدر" */}
          <div className="border border-primary/20 bg-background/30 p-3" dir="rtl">
            <p className="text-primary/80 text-[10px] tracking-[0.2em] font-bold mb-2">◈ ما هي ركائز القدر؟</p>
            <p className="text-foreground/65 text-[11px] leading-relaxed">
              هي المعطيات الكونية التي تُحدد هويتك في مسار الأحداث:
            </p>
            <div className="mt-2 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-primary/50 text-[10px]">▸</span>
                <span className="text-foreground/80 text-[11px]"><span className="text-primary/80 font-bold">الاسم الكامل</span> — بصريح العبارة، لا اختصار</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary/50 text-[10px]">▸</span>
                <span className="text-foreground/80 text-[11px]"><span className="text-primary/80 font-bold">تاريخ الميلاد</span> — اليوم / الشهر / السنة</span>
              </div>
            </div>
            <p className="text-muted-foreground/50 text-[10px] mt-2 leading-relaxed">
              النظام يستخدم هذه الركائز لربط أمنيتك بمسارك الزمني الصحيح.
            </p>
          </div>

          {/* Instructions */}
          <div className="border border-muted/25 bg-background/50 p-4" dir="rtl">
            <p className="text-primary/70 text-[10px] tracking-[0.2em] font-bold mb-3">خطوات البروتوكول:</p>
            <ol className="flex flex-col gap-2 list-none">
              {[
                ["١", "خذ ورقة بيضاء وقلم"],
                ["٢", "اكتب في أعلى الورقة: ركائز القدر"],
                ["٣", "اكتب تحتها: اسمك الكامل — ثم تاريخ ميلادك"],
                ["٤", "اكتب أمنيتك بالكامل تحتها بصدق تام"],
                ["٥", "امسك الورقة أمام الكاميرا وتحدّث عن أمنيتك بصوت واضح"],
              ].map(([num, text]) => (
                <li key={num} className="flex items-start gap-3 text-xs text-foreground/70 leading-relaxed">
                  <span className="text-primary/60 font-bold shrink-0">{num}</span>
                  <span>{text}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="border border-muted/30 bg-background/40 p-3">
            <p className="text-[10px] text-muted-foreground tracking-widest mb-2" dir="rtl">اكتب ملخص أمنيتك (اختياري):</p>
            <input
              type="text"
              value={wishText}
              onChange={(e) => setWishText(e.target.value)}
              placeholder="أمنيتي هي..."
              className="w-full bg-transparent border border-primary/20 focus:outline-none focus:border-primary/50 text-xs px-3 py-2 placeholder:text-muted-foreground/40 rounded-none text-right"
              dir="rtl"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={onCancel} className="text-muted-foreground text-xs rounded-none tracking-widest">إلغاء</Button>
            <Button onClick={startCamera} className="bg-primary/15 text-primary border border-primary/35 hover:bg-primary/25 rounded-none text-xs tracking-widest" data-testid="button-start-camera">
              تشغيل الكاميرا
            </Button>
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

async function fetchAiProbe(
  history: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  try {
    const res = await fetch("/api/ai/probe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history }),
    });
    if (!res.ok) return AUTO_CHAT_MESSAGES[Math.floor(Math.random() * AUTO_CHAT_MESSAGES.length)];
    const data = await res.json() as { text?: string };
    return data.text?.trim() || AUTO_CHAT_MESSAGES[Math.floor(Math.random() * AUTO_CHAT_MESSAGES.length)];
  } catch {
    return AUTO_CHAT_MESSAGES[Math.floor(Math.random() * AUTO_CHAT_MESSAGES.length)];
  }
}

async function streamAiResponse(
  messages: { role: "user" | "assistant"; content: string }[],
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (msg: string) => void
) {
  try {
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
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
        const distRatio = s.dist / (Math.max(W, H) * 0.72);
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

// ─── APP ──────────────────────────────────────────────────────────────────────

type ChatMsg = { id: number; text: string; isAi: boolean; streaming?: boolean };

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

  // Biometric scan — show once per session
  const [scanDone, setScanDone] = useState(() => sessionStorage.getItem("11_scanned") === "1");
  const handleScanDone = useCallback(() => {
    sessionStorage.setItem("11_scanned", "1");
    setScanDone(true);
  }, []);

  // init
  useEffect(() => {
    document.documentElement.classList.add("dark");
    if (localStorage.getItem("eleven_wish")) setHasStoredWish(true);
    audioRef.current = new AmbientEngine();
  }, []);

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
  const injectAutoMessage = useCallback((text?: string) => {
    if (text) {
      const id = nextId();
      setChatMessages((prev) => [...prev, { id, text, isAi: true }]);
      chatHistoryRef.current = [...chatHistoryRef.current, { role: "assistant", content: text }];
      if (!chatOpenRef.current) {
        setUnreadCount((c) => c + 1);
        setPendingSignal(text);
      }
      return;
    }
    // Show entity-typing on main screen for 2.5s before fetching
    setEntityTyping(true);
    const id = nextId();
    setChatMessages((prev) => [...prev, { id, text: "...", isAi: true, streaming: true }]);
    fetchAiProbe(chatHistoryRef.current).then((msg) => {
      setEntityTyping(false);
      setChatMessages((prev) => prev.map((m) => m.id === id ? { ...m, text: msg, streaming: false } : m));
      chatHistoryRef.current = [...chatHistoryRef.current, { role: "assistant", content: msg }];
      if (!chatOpenRef.current) {
        setUnreadCount((c) => c + 1);
        setPendingSignal(msg);
      }
    });
  }, []);

  // random events
  useEffect(() => {
    const trigger = () => {
      const r = Math.random();
      if (r < 0.28) {
        setGlobalGlitch(true);
        setTimeout(() => setGlobalGlitch(false), 900);
      } else if (r < 0.56) {
        setRedFlash(true);
        setTimeout(() => setRedFlash(false), 500);
      } else if (r < 0.78) {
        showPopup();
      } else {
        injectAutoMessage();
      }
      setTimeout(trigger, 40000 + Math.random() * 70000);
    };
    const t = setTimeout(trigger, 25000 + Math.random() * 25000);
    return () => clearTimeout(t);
  }, [showPopup, injectAutoMessage]);

  // auto chat messages — independent timer
  useEffect(() => {
    const fire = () => {
      injectAutoMessage();
      setTimeout(fire, 35000 + Math.random() * 55000);
    };
    const t = setTimeout(fire, 20000 + Math.random() * 20000);
    return () => clearTimeout(t);
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

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  const handleListen = () => {
    if (isListening) return;
    setIsListening(true);
    setRedFlash(true);
    setTimeout(() => setRedFlash(false), 500);
    setListenStatus("SIGNAL ACQUIRED...");
    setTimeout(() => showPopup(), 900);
    setTimeout(() => { setIsListening(false); setListenStatus("WAITING FOR SIGNAL..."); }, 3000);
  };

  const handleChatSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isSending) return;
    const userText = chatInput.trim();
    setChatInput("");
    setIsSending(true);
    setChatMessages((prev) => [...prev, { id: nextId(), text: userText, isAi: false }]);
    chatHistoryRef.current = [...chatHistoryRef.current, { role: "user", content: userText }];
    const aiId = nextId();
    setChatMessages((prev) => [...prev, { id: aiId, text: "", isAi: true, streaming: true }]);
    let full = "";
    streamAiResponse(
      chatHistoryRef.current,
      (chunk) => { full += chunk; setChatMessages((p) => p.map((m) => m.id === aiId ? { ...m, text: full } : m)); },
      () => {
        setChatMessages((p) => p.map((m) => m.id === aiId ? { ...m, streaming: false } : m));
        chatHistoryRef.current = [...chatHistoryRef.current, { role: "assistant", content: full }];
        setIsSending(false);
        // Schedule a follow-up probe 12–28s after AI replies
        setTimeout(() => { if (!isSendingRef.current) injectAutoMessage(); }, 12000 + Math.random() * 16000);
      },
      (err) => {
        setChatMessages((p) => p.map((m) => m.id === aiId ? { ...m, text: err, streaming: false } : m));
        setIsSending(false);
      }
    );
  };

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
      setWishStatus("success");
      setHasStoredWish(true);
      setTimeout(() => closeWishModal(), 2000);
    }, 3000);
  };

  const handleVideoWishSave = (text: string) => {
    setWishStatus("processing");
    setTimeout(() => {
      localStorage.setItem("eleven_wish", JSON.stringify({ text, time: Date.now(), hasVideo: true }));
      setWishStatus("success");
      setHasStoredWish(true);
      setTimeout(() => closeWishModal(), 2000);
    }, 1500);
  };

  return (
    <div className={`min-h-screen w-full bg-background overflow-hidden relative text-foreground font-mono selection:bg-primary/30 ${globalGlitch ? "animate-glitch" : ""}`}>
      {!scanDone && <BiometricScan onDone={handleScanDone} />}
      <FuturisticBackground />

      {/* Central glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vw] md:w-[45vw] md:h-[45vw] rounded-full bg-primary/8 blur-[120px] pointer-events-none z-0 transition-all duration-1000 ${isListening ? "opacity-90 scale-125 animate-pulse" : "opacity-50"}`}
        style={{ animation: isListening ? undefined : "pulseGlow 6s ease-in-out infinite" }}
      />

      {/* Red flash */}
      <AnimatePresence>
        {redFlash && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.35 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-primary z-50 pointer-events-none mix-blend-overlay" />
        )}
      </AnimatePresence>

      {/* Top left */}
      <div className="absolute top-5 left-5 z-10 flex flex-col gap-2">
        <div className="text-[10px] tracking-[0.25em] text-primary/60" style={{ animation: "blink 3s ease-in-out infinite" }}>
          FREQ: 11.11 Hz
        </div>
        {hasStoredWish && (
          <div className="text-[10px] tracking-widest text-muted-foreground border border-primary/25 px-2 py-1 bg-background/40 backdrop-blur-sm inline-flex items-center gap-2">
            <span className="w-1 h-1 bg-primary rounded-full" style={{ animation: "blink 2s ease-in-out infinite" }} />
            ◈ WISH IN PROGRESS
          </div>
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
                    {/* Outer glow ring */}
                    <div className="absolute inset-0 rounded-full" style={{ animation: "successRing 3s ease-in-out infinite", border: "1px solid hsl(0 75% 42% / 0.3)" }} />
                    {/* Glitch layers */}
                    <span
                      className="absolute select-none font-bold text-primary/20 text-5xl tracking-tighter"
                      style={{ animation: "successGlitchA 2.4s infinite linear", left: -3, top: 2 }}
                      aria-hidden="true"
                    >11.11</span>
                    <span
                      className="absolute select-none font-bold text-5xl tracking-tighter"
                      style={{ color: "hsl(200 80% 60% / 0.15)", animation: "successGlitchB 3.1s infinite linear", left: 3, top: -2 }}
                      aria-hidden="true"
                    >11.11</span>
                    {/* Main text */}
                    <motion.span
                      className="relative font-bold text-5xl tracking-tighter select-none"
                      style={{
                        color: "hsl(0 75% 42%)",
                        textShadow: "0 0 30px hsl(0 75% 42% / 0.6), 0 0 60px hsl(0 75% 42% / 0.3)",
                        animation: "successFloat 4s ease-in-out infinite",
                      }}
                    >
                      11.11
                    </motion.span>
                  </div>

                  {/* Status lines */}
                  <div className="flex flex-col gap-1.5 items-center">
                    <p className="text-foreground/90 text-sm tracking-[0.15em] font-bold" dir="rtl">
                      يعمل النظام على تحقيق أمنيتك
                    </p>
                    <div className="w-32 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent my-1" />
                    <p className="text-muted-foreground/70 text-[11px] tracking-widest" dir="rtl">
                      تم استلام الأمنية وتسجيلها في الذاكرة الكونية
                    </p>
                    <p className="text-primary/50 text-[10px] tracking-widest mt-1">
                      SECTOR 11 · {new Date().toLocaleTimeString("ar")}
                    </p>
                  </div>

                  {/* Scanning bar */}
                  <div className="w-full max-w-[200px] h-px bg-muted overflow-hidden rounded-none">
                    <motion.div
                      initial={{ x: "-100%" }}
                      animate={{ x: "200%" }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 0.3 }}
                      className="h-full w-1/3 bg-gradient-to-r from-transparent via-primary to-transparent"
                    />
                  </div>
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
              <div className="px-4 py-2.5 border-b border-primary/15 flex justify-between items-center bg-background/60 shrink-0">
                <span className="text-[10px] tracking-[0.2em] text-primary/80 font-bold">11.11 // SECURE CHANNEL</span>
                <span className="text-[9px] text-muted-foreground/60 tracking-widest">MULTILINGUAL · LIVE AI</span>
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
                      {msg.isAi ? "11.11" : "YOU"}
                    </span>
                    <div className={`text-xs leading-relaxed break-words max-w-[90%] px-3 py-2 ${msg.isAi
                      ? "text-primary/90 bg-primary/5 border border-primary/15"
                      : "text-foreground/85 bg-muted/40 text-right"}`}
                      dir="auto">
                      {msg.isAi && <span className="mr-1.5 opacity-50 text-[10px]">◈</span>}
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
    </div>
  );
}

export default App;
