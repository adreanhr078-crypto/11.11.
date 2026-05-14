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
          <div className="border border-primary/25 bg-primary/5 p-4 text-center">
            <p className="text-primary text-base tracking-[0.2em] font-bold mb-3" style={{ fontFamily: "inherit" }}>
              ركائز القدر
            </p>
            <p className="text-foreground/70 text-xs leading-relaxed tracking-wide" dir="rtl">
              قبل أن تبدأ التسجيل، خذ ورقة وقلم.<br />
              اكتب في أعلى الورقة بخط واضح:
            </p>
            <p className="text-primary/90 text-sm mt-2 mb-2 tracking-widest font-bold">ركائز القدر</p>
            <p className="text-foreground/70 text-xs leading-relaxed tracking-wide" dir="rtl">
              ثم اكتب أمنيتك بالكامل تحتها.<br />
              امسك الورقة أمام الكاميرا أثناء التسجيل وتحدث عن أمنيتك بصدق.
            </p>
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

const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let particles: { x: number; y: number; size: number; speedX: number; speedY: number; opacity: number }[] = [];
    let rafId: number;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = Array.from({ length: Math.floor((canvas.width * canvas.height) / 14000) }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.5 + 0.3,
        speedX: (Math.random() - 0.5) * 0.25,
        speedY: (Math.random() - 0.5) * 0.25,
        opacity: Math.random() * 0.45 + 0.05,
      }));
    };
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.fillStyle = `rgba(200,180,180,${p.opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        p.x += p.speedX; p.y += p.speedY;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
      });
      rafId = requestAnimationFrame(draw);
    };
    window.addEventListener("resize", resize);
    resize(); draw();
    return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(rafId); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-50" />;
};

// ─── APP ──────────────────────────────────────────────────────────────────────

type ChatMsg = { id: number; text: string; isAi: boolean; streaming?: boolean };

function App() {
  const [isListening, setIsListening] = useState(false);
  const [listenStatus, setListenStatus] = useState("WAITING FOR SIGNAL...");
  const [activePopup, setActivePopup] = useState<{ id: number; text: string; x: number; y: number } | null>(null);
  const popupIdRef = useRef(0);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatHistoryRef = useRef<{ role: "user" | "assistant"; content: string }[]>([]);

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

  // auto message injected into chat
  const injectAutoMessage = useCallback((text?: string) => {
    const msg = text ?? AUTO_CHAT_MESSAGES[Math.floor(Math.random() * AUTO_CHAT_MESSAGES.length)];
    const id = nextId();
    setChatMessages((prev) => [...prev, { id, text: msg, isAi: true }]);
    chatHistoryRef.current = [...chatHistoryRef.current, { role: "assistant", content: msg }];
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
      <ParticleBackground />

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
                <div className="py-12 text-center">
                  <p className="text-primary text-sm tracking-[0.2em] mb-2">تم الإرسال.</p>
                  <p className="text-muted-foreground text-xs tracking-widest">أمنيتك في طريقها إلى مصدر مجهول.</p>
                  <p className="text-primary/30 text-[10px] tracking-widest mt-4">التسجيل: {new Date().toLocaleTimeString("ar")}</p>
                </div>
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
                      className="border border-primary/40 bg-primary/8 hover:bg-primary/15 hover:border-primary/70 transition-all duration-300 p-5 flex flex-col items-center gap-3 text-left group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                      <span className="text-2xl text-primary/80 group-hover:text-primary transition-colors relative z-10">◉</span>
                      <span className="text-xs text-primary/90 tracking-widest relative z-10" dir="rtl">تسجيل فيديو</span>
                      <span className="text-[10px] text-primary/50 tracking-wide text-center relative z-10" dir="rtl">ركائز القدر</span>
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
          <Button variant="outline" onClick={() => setChatOpen(!chatOpen)}
            className="border-primary/35 text-primary hover:bg-primary/8 hover:text-primary tracking-widest text-[10px] h-7 bg-background/85 backdrop-blur-md rounded-none shadow-[0_0_12px_rgba(180,0,0,0.08)] px-4"
            data-testid="button-toggle-chat">
            <span className={`w-1.5 h-1.5 rounded-full mr-2 bg-primary ${!chatOpen ? "animate-pulse" : ""}`} />
            {chatOpen ? "◈ CLOSE" : "◈ SIGNAL OPEN"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default App;
