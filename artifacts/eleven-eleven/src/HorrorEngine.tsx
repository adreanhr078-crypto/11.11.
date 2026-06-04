/**
 * HorrorEngine — Comprehensive psychological horror overlay for 11.11
 *
 * Features (atmospheric / psychological — no blood or gore):
 *   • Time-based phases: day / preEvent (10:45–11:11 PM) / night (11:11–3:33 AM) / revelation (3:33 AM)
 *   • Web Audio API synthesis: ambient drone, heartbeat, distant tones, glitch stabs
 *   • Cursor trail (canvas, pale cold glow)
 *   • Watcher eyes (night/preEvent only — faint blinking eyes)
 *   • Ghost whispers (rare atmospheric text fragments)
 *   • Screen flicker / micro-glitch (night/preEvent only)
 *   • Night glass entity (canvas animation — figure behind cracked glass)
 *   • Pre-event escalation (increasing frequency + intensity)
 *   • 3:33 AM revelation moment
 *
 * Daytime is intentionally calm: only rare ghost whispers appear. All the
 * harassment loops (eyes, flicker, flash events) are gated to night/preEvent.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";

// ─── TYPES ─────────────────────────────────────────────────────────────────────
type TimePhase = "day" | "preEvent" | "night" | "revelation";
type Lang = "ar" | "en";

// ─── TIME DETECTION ─────────────────────────────────────────────────────────────
function getTimePhase(): TimePhase {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const total = h * 60 + m;
  if (total >= 3 * 60 + 33 && total < 3 * 60 + 40) return "revelation";
  if (total >= 23 * 60 + 11 || total < 3 * 60 + 33) return "night";
  if (total >= 22 * 60 + 45 && total < 23 * 60 + 11) return "preEvent";
  return "day";
}

// ─── ATMOSPHERIC WHISPERS ─────────────────────────────────────────────────────
// Quiet fragments of the trapped researcher (Lina) — atmospheric, never
// harassing. Daytime: rare, faint. Night: a little more present.
const GHOST_MSGS_AR = [
  "هل يسمعني أحد؟", "الإشارة ضعيفة...", "لينا كانت هنا",
  "اقرأ بين السطور", "البوابة فُتحت عند 11:11", "الذاكرة تتلاشى",
  "ابحث في الألغاز", "ما زلت أنتظر", "الصدى يتذكر",
  "القصة لم تكتمل بعد", "تتبّع الأثر",
];
const GHOST_MSGS_EN = [
  "can anyone hear me?", "signal is weak...", "Lina was here",
  "read between the lines", "the gate opened at 11:11", "memory is fading",
  "look to the puzzles", "I'm still waiting", "Echo remembers",
  "the story isn't finished", "follow the trace",
];
const NIGHT_MSGS_AR = [
  "خلف الزجاج", "لينا تحاول الوصول", "الإشارة أقوى الآن",
  "البوابة ما زالت مفتوحة", "اقترب من الحقيقة", "الصدى يهمس",
];
const NIGHT_MSGS_EN = [
  "behind the glass", "Lina is reaching through", "the signal is stronger now",
  "the gate is still open", "closer to the truth", "Echo whispers",
];

// ─── WEB AUDIO ENGINE ──────────────────────────────────────────────────────────
class HorrorAudio {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  private droneNodes: AudioNode[] = [];

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.1;
      this.master.connect(this.ctx.destination);
    } catch { /* ignore */ }
  }

  startAmbientDrone(phase: TimePhase) {
    this.stopAmbientDrone();
    if (!this.ctx || !this.master) return;
    if (phase === "day") return;

    const freqs = phase === "night"
      ? [32, 36, 48, 64, 96]
      : phase === "preEvent"
        ? [45, 50, 90]
        : [20, 40]; // revelation

    const gain = phase === "night" ? 0.07 : phase === "preEvent" ? 0.04 : 0.12;

    freqs.forEach((freq, i) => {
      if (!this.ctx || !this.master) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();

      osc.type = i % 2 === 0 ? "sawtooth" : "sine";
      osc.frequency.value = freq;
      lfo.frequency.value = 0.08 + i * 0.02;
      lfoGain.gain.value = freq * 0.015;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      g.gain.value = gain / freqs.length;
      osc.connect(g);
      g.connect(this.master);
      lfo.start();
      osc.start();
      this.droneNodes.push(osc, lfo);
    });
  }

  stopAmbientDrone() {
    this.droneNodes.forEach(n => { try { (n as OscillatorNode).stop(); } catch { /* ignore */ } });
    this.droneNodes = [];
  }

  playHeartbeat() {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    const beat = (offset: number, amp: number, freq: number) => {
      if (!this.ctx || !this.master) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0, t + offset);
      g.gain.linearRampToValueAtTime(amp, t + offset + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.45);
      osc.connect(g); g.connect(this.master!);
      osc.start(t + offset); osc.stop(t + offset + 0.5);
    };
    beat(0, 0.35, 58);
    beat(0.22, 0.25, 52);
  }

  playDistantScream() {
    if (!this.ctx || !this.master) return;
    try {
      const sr = this.ctx.sampleRate;
      const len = sr * 2.5;
      const buf = this.ctx.createBuffer(1, len, sr);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        const env = Math.sin(Math.PI * (i / len)) * Math.pow(1 - i / len, 0.3);
        d[i] = (Math.random() * 2 - 1) * env;
      }
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const bp = this.ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.setValueAtTime(600, this.ctx.currentTime);
      bp.frequency.linearRampToValueAtTime(2800, this.ctx.currentTime + 2);
      bp.Q.value = 2;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.001, this.ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.06, this.ctx.currentTime + 0.4);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2.5);
      src.connect(bp); bp.connect(g); g.connect(this.master);
      src.start();
    } catch { /* ignore */ }
  }

  playGlitchStab() {
    if (!this.ctx || !this.master) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(200, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.12);
      g.gain.setValueAtTime(0.18, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(g); g.connect(this.master);
      osc.start(t); osc.stop(t + 0.15);
    } catch { /* ignore */ }
  }

  playRevelationSound() {
    if (!this.ctx || !this.master) return;
    try {
      const t = this.ctx.currentTime;
      [33, 66, 99, 198].forEach((freq, i) => {
        if (!this.ctx || !this.master) return;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.12 - i * 0.02, t + 1);
        g.gain.linearRampToValueAtTime(0, t + 8);
        osc.connect(g); g.connect(this.master!);
        osc.start(t); osc.stop(t + 8);
      });
    } catch { /* ignore */ }
  }

  setMasterVolume(vol: number) {
    if (!this.master || !this.ctx) return;
    this.master.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.5);
  }

  destroy() {
    this.stopAmbientDrone();
    this.ctx?.close().catch(() => {});
    this.ctx = null;
  }
}

// ─── CURSOR TRAIL ─────────────────────────────────────────────────────────────
function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Array<{ x: number; y: number; age: number; size: number }>>([]);
  const mouse = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      for (let i = 0; i < 2; i++) {
        particles.current.push({
          x: e.clientX + (Math.random() - 0.5) * 4,
          y: e.clientY + (Math.random() - 0.5) * 4,
          age: 0,
          size: 2 + Math.random() * 3,
        });
      }
      if (particles.current.length > 80) particles.current = particles.current.slice(-80);
    };
    window.addEventListener("mousemove", onMove);

    const draw = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) { rafRef.current = requestAnimationFrame(draw); return; }
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.current = particles.current.filter(p => p.age < 1);
      particles.current.forEach(p => {
        p.age += 0.04;
        const alpha = (1 - p.age) * 0.7;
        const size = p.size * (1 - p.age * 0.5);
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(150, 190, 230, ${alpha * 0.6})`;
        ctx.fill();
      });
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 9998, mixBlendMode: "screen" }}
    />
  );
}

// ─── WATCHER EYES ─────────────────────────────────────────────────────────────
interface Eye { id: number; x: number; y: number; blink: boolean; open: boolean; }

function WatcherEyes({ phase }: { phase: TimePhase }) {
  const [eyes, setEyes] = useState<Eye[]>([]);
  const idRef = useRef(0);

  const spawnEye = useCallback(() => {
    const id = ++idRef.current;
    const x = 5 + Math.random() * 88;
    const y = 5 + Math.random() * 85;
    setEyes(prev => [...prev.slice(-5), { id, x, y, blink: false, open: true }]);

    const lifespan = phase === "night" ? 8000 + Math.random() * 12000 : 3000 + Math.random() * 5000;
    const blinkAt = setTimeout(() => {
      setEyes(prev => prev.map(e => e.id === id ? { ...e, blink: true } : e));
    }, lifespan - 800);
    const removeAt = setTimeout(() => {
      setEyes(prev => prev.filter(e => e.id !== id));
    }, lifespan);

    return () => { clearTimeout(blinkAt); clearTimeout(removeAt); };
  }, [phase]);

  useEffect(() => {
    const interval = phase === "night" ? 6000 : phase === "preEvent" ? 12000 : 20000;
    const id = setInterval(spawnEye, interval + Math.random() * interval);
    return () => clearInterval(id);
  }, [phase, spawnEye]);

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 9990 }}>
      <AnimatePresence>
        {eyes.map(eye => (
          <motion.div
            key={eye.id}
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: eye.blink ? 0 : 1, scale: eye.blink ? 0.3 : 1 }}
            exit={{ opacity: 0, scale: 0.3 }}
            transition={{ duration: 0.4 }}
            className="absolute"
            style={{ left: `${eye.x}%`, top: `${eye.y}%`, transform: "translate(-50%, -50%)" }}
          >
            <svg width="28" height="14" viewBox="0 0 28 14">
              <ellipse cx="14" cy="7" rx="12" ry="6"
                fill="none" stroke="rgba(200,0,0,0.55)" strokeWidth="0.8" />
              <ellipse cx="14" cy="7" rx="5" ry="5"
                fill="rgba(180,0,0,0.25)" stroke="rgba(220,0,0,0.7)" strokeWidth="0.6" />
              <circle cx="14" cy="7" r="2.5" fill="rgba(255,0,0,0.9)" />
              <circle cx="15.2" cy="5.8" r="0.8" fill="rgba(255,255,255,0.6)" />
            </svg>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── GHOST MESSAGES ────────────────────────────────────────────────────────────
interface GhostMsg { id: number; text: string; x: number; y: number; size: "sm" | "xs" | "md"; }

function GhostMessages({ phase, lang }: { phase: TimePhase; lang: Lang }) {
  const [msgs, setMsgs] = useState<GhostMsg[]>([]);
  const idRef = useRef(0);
  const lastMsgRef = useRef<string>("");

  const pool = phase === "night"
    ? [...(lang === "ar" ? NIGHT_MSGS_AR : NIGHT_MSGS_EN), ...(lang === "ar" ? GHOST_MSGS_AR : GHOST_MSGS_EN)]
    : (lang === "ar" ? GHOST_MSGS_AR : GHOST_MSGS_EN);

  const spawnMsg = useCallback(() => {
    const available = pool.filter(m => m !== lastMsgRef.current);
    const text = available[Math.floor(Math.random() * available.length)];
    lastMsgRef.current = text;
    const id = ++idRef.current;
    const x = 5 + Math.random() * 80;
    const y = 10 + Math.random() * 75;
    const sizes = ["xs", "sm", "md"] as const;
    const size = sizes[Math.floor(Math.random() * sizes.length)];

    setMsgs(prev => [...prev.slice(-4), { id, text, x, y, size }]);
    const duration = 2500 + Math.random() * 3000;
    setTimeout(() => setMsgs(prev => prev.filter(m => m.id !== id)), duration);
  }, [pool]);

  useEffect(() => {
    // Daytime whispers are RARE and atmospheric (every ~3–7 min). Night is a
    // little more present but still calm — never the old constant spam.
    const interval = phase === "night" ? 45000 : phase === "preEvent" ? 90000 : 210000;
    const id = setInterval(spawnMsg, interval + Math.random() * interval * 0.6);
    return () => clearInterval(id);
  }, [phase, spawnMsg]);

  const sizeClass = { xs: "text-[9px]", sm: "text-[11px]", md: "text-[13px]" };

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 9991 }}>
      <AnimatePresence>
        {msgs.map(msg => (
          <motion.p
            key={msg.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: [0, 0.65, 0.65, 0] }}
            transition={{ duration: 2.5, times: [0, 0.15, 0.75, 1] }}
            className={`absolute font-mono tracking-[0.35em] ${sizeClass[msg.size]}`}
            dir={lang === "ar" ? "rtl" : "ltr"}
            style={{
              left: `${msg.x}%`, top: `${msg.y}%`,
              color: "rgba(170, 200, 230, 0.55)",
              textShadow: "0 0 12px rgba(140,180,220,0.35)",
              whiteSpace: "nowrap",
              maxWidth: "220px",
            }}
          >
            {msg.text}
          </motion.p>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── SCREEN FLICKER ────────────────────────────────────────────────────────────
function ScreenFlicker({ phase }: { phase: TimePhase }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const base = phase === "night" ? 8000 : phase === "preEvent" ? 12000 : 25000;
    const id = setInterval(() => {
      const count = phase === "night" ? 2 + Math.floor(Math.random() * 4) : 1;
      let delay = 0;
      for (let i = 0; i < count; i++) {
        const flickerIn = delay + Math.random() * 80;
        const flickerOut = flickerIn + 40 + Math.random() * 60;
        setTimeout(() => setVisible(true), flickerIn);
        setTimeout(() => setVisible(false), flickerOut);
        delay = flickerOut + 30;
      }
    }, base + Math.random() * base);
    return () => clearInterval(id);
  }, [phase]);

  if (!visible) return null;
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 9999,
        background: "rgba(255,255,255,0.015)",
        mixBlendMode: "overlay",
      }}
    />
  );
}

// ─── NIGHT GLASS ENTITY (Canvas) ──────────────────────────────────────────────
function NightGlassEntity({ soundEnabled }: { soundEnabled: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const timeRef = useRef(0);
  const lungeRef = useRef(0);
  const handPressRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const drawCracks = (ctx: CanvasRenderingContext2D, cx: number, cy: number, alpha: number) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = "rgba(220,220,220,0.45)";
      ctx.lineWidth = 0.8;
      const branches = [
        [[0,0],[cx*0.3, cy*0.15],[cx*0.65, cy*0.4],[cx*0.85, cy*0.7]],
        [[0,0],[-cx*0.25, cy*0.2],[-cx*0.55, cy*0.55],[-cx*0.7, cy*0.9]],
        [[0,0],[cx*0.15, -cy*0.3],[cx*0.4, -cy*0.6]],
        [[0,0],[-cx*0.2, -cy*0.2],[-cx*0.5, -cy*0.5],[-cx*0.6, -cy*0.8]],
        [[0,0],[cx*0.05, cy*0.5],[cx*0.1, cy*0.9]],
        [[0,0],[cx*0.45, cy*0.1],[cx*0.9, cy*0.15]],
      ];
      branches.forEach(pts => {
        ctx.beginPath();
        pts.forEach(([x, y], i) => {
          if (i === 0) ctx.moveTo(cx + x, cy + y);
          else ctx.lineTo(cx + x + (Math.random() * 4 - 2), cy + y + (Math.random() * 4 - 2));
        });
        ctx.stroke();
        // Sub-cracks
        if (pts.length > 1) {
          const last = pts[pts.length - 1];
          ctx.beginPath();
          ctx.moveTo(cx + last[0], cy + last[1]);
          ctx.lineTo(cx + last[0] + (Math.random() * 40 - 20), cy + last[1] + (Math.random() * 40 - 20));
          ctx.stroke();
        }
      });
      ctx.restore();
    };

    // Pale etched text behind the glass — atmospheric, no blood/drips.
    const drawEtchedText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, alpha: number, size: number) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `bold ${size}px 'Courier New', monospace`;
      ctx.fillStyle = `rgba(180, 200, 220, ${alpha})`;
      ctx.shadowColor = "rgba(150,180,210,0.5)";
      ctx.shadowBlur = 10;
      ctx.fillText(text, x, y);
      ctx.restore();
    };

    const drawEntity = (ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number, lunge: number) => {
      ctx.save();
      const breathe = 1 + Math.sin(t * 0.6) * 0.012;
      const sway = Math.sin(t * 0.4) * 3;
      const scale = breathe + lunge * 0.08;
      ctx.translate(cx + sway, cy);
      ctx.scale(scale, scale);

      // Body shadow glow
      ctx.shadowColor = "rgba(0,0,0,0.95)";
      ctx.shadowBlur = 40;
      ctx.fillStyle = "rgba(8, 0, 0, 0.92)";

      // Torso
      ctx.beginPath();
      ctx.ellipse(0, 60, 38, 80, 0, 0, Math.PI * 2);
      ctx.fill();

      // Head
      ctx.beginPath();
      ctx.ellipse(0, -55, 30, 35, 0, 0, Math.PI * 2);
      ctx.fill();

      // Neck
      ctx.fillRect(-10, -20, 20, 30);

      // Eyes (glowing red on the entity)
      const eyeAlpha = 0.4 + Math.sin(t * 1.5) * 0.2 + lunge * 0.4;
      ctx.fillStyle = `rgba(220, 0, 0, ${eyeAlpha})`;
      ctx.shadowColor = "rgba(255,0,0,0.8)";
      ctx.shadowBlur = 15;
      ctx.beginPath(); ctx.ellipse(-10, -58, 7, 4, -0.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(10, -58, 7, 4, 0.3, 0, Math.PI * 2); ctx.fill();

      // Arms reaching toward viewer
      ctx.shadowBlur = 20;
      ctx.fillStyle = "rgba(10, 0, 0, 0.95)";
      const armExtend = 0.4 + lunge * 0.6 + handPressRef.current * 0.5;
      // Left arm
      ctx.save();
      ctx.translate(-38, 20);
      ctx.rotate(-0.3 - armExtend * 0.4);
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 55, 0, 0, Math.PI * 2);
      ctx.fill();
      // Hand
      ctx.translate(0, -55 - armExtend * 15);
      for (let f = 0; f < 5; f++) {
        ctx.beginPath();
        ctx.ellipse((f - 2) * 6, 0, 3.5, 12 + f % 2 * 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      // Right arm
      ctx.save();
      ctx.translate(38, 20);
      ctx.rotate(0.3 + armExtend * 0.4);
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.translate(0, -55 - armExtend * 15);
      for (let f = 0; f < 5; f++) {
        ctx.beginPath();
        ctx.ellipse((f - 2) * 6, 0, 3.5, 12 + f % 2 * 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      ctx.restore();
    };

    const animate = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) { rafRef.current = requestAnimationFrame(animate); return; }
      const W = canvas.width, H = canvas.height;
      timeRef.current += 0.016;
      const t = timeRef.current;

      // Lunge every ~15s
      if (Math.floor(t * 0.067) > lungeRef.current) {
        lungeRef.current = Math.floor(t * 0.067);
        handPressRef.current = 1;
        setTimeout(() => { handPressRef.current = 0; }, 800);
      }
      const lunge = handPressRef.current;

      ctx.clearRect(0, 0, W, H);

      // Dark background overlay
      const bg = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W, H) * 0.7);
      bg.addColorStop(0, "rgba(5, 0, 0, 0.0)");
      bg.addColorStop(0.4, "rgba(3, 0, 0, 0.55)");
      bg.addColorStop(1, "rgba(0, 0, 0, 0.92)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      const cx = W / 2;
      const cy = H / 2 + 20;

      // Entity (behind glass, slightly dimmed)
      ctx.save();
      ctx.globalAlpha = 0.85 + lunge * 0.1;
      ctx.filter = `blur(${3 - lunge * 2}px)`;
      drawEntity(ctx, cx, cy, t, lunge);
      ctx.restore();

      // Glass layer — frosted effect
      ctx.save();
      const glassAlpha = 0.06 + Math.sin(t * 0.3) * 0.02;
      ctx.fillStyle = `rgba(180, 200, 220, ${glassAlpha})`;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      // Glass cracks (center of screen where hands press)
      const crackAlpha = 0.35 + lunge * 0.5 + Math.sin(t * 0.5) * 0.05;
      drawCracks(ctx, cx, cy + 80, crackAlpha);

      // Etched text — HELP ME (inside glass, left)
      const helpAlpha = 0.5 + Math.sin(t * 0.8) * 0.15;
      drawEtchedText(ctx, "HELP ME", cx - 160, cy + 200, helpAlpha * 0.8, 28);

      // Etched text — LINA (outside glass, right, mirrored feel)
      const seeAlpha = 0.35 + Math.sin(t * 1.1 + 1) * 0.1;
      ctx.save();
      ctx.scale(-1, 1);
      drawEtchedText(ctx, "LINA", -(cx + 190), cy - 180, seeAlpha * 0.65, 22);
      ctx.restore();

      // Occasional cold flash on lunge
      if (lunge > 0) {
        ctx.save();
        ctx.globalAlpha = lunge * 0.04;
        ctx.fillStyle = "rgba(150, 190, 230, 1)";
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [soundEnabled]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 9985 }}
    />
  );
}

// ─── PRE-EVENT ESCALATION ─────────────────────────────────────────────────────
function PreEventOverlay({ lang }: { lang: Lang }) {
  const [glitchLine, setGlitchLine] = useState(false);
  const msgs = lang === "ar"
    ? ["النظام غير مستقر", "الإشارة تتزايد", "يحاول التواصل", "لا يمكن إيقافه"]
    : ["system unstable", "signal increasing", "attempting contact", "cannot stop"];

  useEffect(() => {
    const id = setInterval(() => {
      setGlitchLine(true);
      setTimeout(() => setGlitchLine(false), 200);
    }, 3000 + Math.random() * 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      {glitchLine && (
        <div
          className="fixed left-0 right-0 h-[1px] pointer-events-none"
          style={{
            zIndex: 9995,
            top: `${10 + Math.random() * 80}%`,
            background: "rgba(200,0,0,0.5)",
            boxShadow: "0 0 6px rgba(200,0,0,0.4)",
          }}
        />
      )}
      <div
        className="fixed bottom-10 right-6 font-mono text-[8px] tracking-widest pointer-events-none"
        style={{ zIndex: 9993, color: "rgba(200,0,0,0.35)" }}
        dir={lang === "ar" ? "rtl" : "ltr"}
      >
        {msgs[Math.floor(Date.now() / 8000) % msgs.length]}
      </div>
    </>
  );
}

// ─── 3:33 REVELATION ─────────────────────────────────────────────────────────
function RevelationOverlay({ lang, onDone }: { lang: Lang; onDone: () => void }) {
  const lines_ar = [
    "الصمت المطبق", "...", "كشف جزء من الحقيقة",
    "البروتوكول يستعيد استقراره", "سجل جديد فُتح", "استمر في البحث",
  ];
  const lines_en = [
    "absolute silence", "...", "part of the truth revealed",
    "protocol restoring stability", "new file unlocked", "continue searching",
  ];
  const lines = lang === "ar" ? lines_ar : lines_en;
  const [lineIdx, setLineIdx] = useState(0);

  useEffect(() => {
    if (lineIdx < lines.length - 1) {
      const t = setTimeout(() => setLineIdx(p => p + 1), 2200);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(onDone, 3000);
      return () => clearTimeout(t);
    }
  }, [lineIdx, lines.length, onDone]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 9999, background: "rgba(0,0,0,0.96)" }}
    >
      <AnimatePresence mode="wait">
        <motion.p
          key={lineIdx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.8 }}
          className="font-mono text-sm tracking-[0.5em] text-center"
          dir={lang === "ar" ? "rtl" : "ltr"}
          style={{ color: "rgba(200,0,0,0.8)", textShadow: "0 0 20px rgba(200,0,0,0.4)", maxWidth: "360px", padding: "0 24px" }}
        >
          {lines[lineIdx]}
        </motion.p>
      </AnimatePresence>
    </motion.div>
  );
}

// ─── MAIN HORROR ENGINE ───────────────────────────────────────────────────────
export function HorrorEngine({ soundOn, lang }: { soundOn: boolean; lang: Lang }) {
  const [phase, setPhase] = useState<TimePhase>(getTimePhase);
  const [showRevelation, setShowRevelation] = useState(false);
  const audioRef = useRef<HorrorAudio | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const screamRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revelationFiredRef = useRef(false);

  // Update phase every 30s
  useEffect(() => {
    const id = setInterval(() => setPhase(getTimePhase()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Init audio on first soundOn
  useEffect(() => {
    if (!soundOn) return;
    if (!audioRef.current) audioRef.current = new HorrorAudio();
    audioRef.current.init();
    audioRef.current.startAmbientDrone(phase);

    if (phase === "night") {
      heartbeatRef.current = setInterval(() => {
        audioRef.current?.playHeartbeat();
      }, 1300);
    }

    // Schedule distant screams
    const screamLoop = () => {
      const delay = phase === "night"
        ? 30000 + Math.random() * 60000
        : phase === "preEvent"
          ? 60000 + Math.random() * 90000
          : 300000 + Math.random() * 300000;
      screamRef.current = setTimeout(() => {
        if (soundOn) audioRef.current?.playDistantScream();
        screamLoop();
      }, delay);
    };
    screamLoop();

    return () => {
      audioRef.current?.stopAmbientDrone();
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (screamRef.current) clearTimeout(screamRef.current);
    };
  }, [soundOn, phase]);

  // Volume sync
  useEffect(() => {
    audioRef.current?.setMasterVolume(soundOn ? 0.1 : 0);
  }, [soundOn]);

  // 3:33 AM revelation
  useEffect(() => {
    if (phase === "revelation" && !revelationFiredRef.current) {
      revelationFiredRef.current = true;
      audioRef.current?.playRevelationSound();
      setShowRevelation(true);
    }
  }, [phase]);

  // Pre-event glitch sounds
  useEffect(() => {
    if (phase !== "preEvent" || !soundOn) return;
    const id = setInterval(() => {
      audioRef.current?.playGlitchStab();
    }, 8000 + Math.random() * 10000);
    return () => clearInterval(id);
  }, [phase, soundOn]);

  return (
    <>
      {/* Cursor trail */}
      <CursorTrail />

      {/* Screen flicker — night/preEvent only (day stays calm) */}
      {phase !== "day" && <ScreenFlicker phase={phase} />}

      {/* Watcher eyes — night/preEvent only (day stays calm) */}
      {phase !== "day" && <WatcherEyes phase={phase} />}

      {/* Ghost whispers — rare atmospheric fragments (day + night) */}
      <GhostMessages phase={phase} lang={lang} />

      {/* Pre-event overlay */}
      {phase === "preEvent" && <PreEventOverlay lang={lang} />}

      {/* Night glass entity */}
      {phase === "night" && <NightGlassEntity soundEnabled={soundOn} />}

      {/* Night vignette pulsing red */}
      {(phase === "night" || phase === "preEvent") && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            zIndex: 9984,
            background: "radial-gradient(ellipse at center, transparent 40%, rgba(60,0,0,0.45) 100%)",
            animation: phase === "night" ? "pulse-slow 4s ease-in-out infinite alternate" : "none",
          }}
        />
      )}

      {/* 3:33 revelation */}
      <AnimatePresence>
        {showRevelation && (
          <RevelationOverlay
            lang={lang}
            onDone={() => setShowRevelation(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
