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
type TimePhase = "day" | "instability" | "preEvent" | "night" | "revelation";
type Lang = "ar" | "en";

// ─── TIME DETECTION ─────────────────────────────────────────────────────────────
function getTimePhase(): TimePhase {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const total = h * 60 + m;
  if (total >= 3 * 60 + 33 && total < 3 * 60 + 40) return "revelation";
  if (total >= 23 * 60 + 11 || total < 3 * 60 + 33) return "night";
  if (total >= 23 * 60 && total < 23 * 60 + 11) return "instability";
  if (total >= 22 * 60 + 45 && total < 23 * 60 + 11) return "preEvent";
  return "day";
}

// ─── RED PARTICLES BACKGROUND ──────────────────────────────────────────────────
const RedParticles: React.FC = React.memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; size: number; alpha: number; life: number; maxLife: number }>>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const spawnParticle = () => {
      if (particlesRef.current.length > 60) return;
      particlesRef.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -0.15 - Math.random() * 0.35,
        size: 0.8 + Math.random() * 2.5,
        alpha: 0.15 + Math.random() * 0.3,
        life: 0,
        maxLife: 6000 + Math.random() * 10000,
      });
    };

    const animate = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) { rafRef.current = requestAnimationFrame(animate); return; }
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current.filter(p => p.life < p.maxLife);
      particlesRef.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life += 16;
        const progress = p.life / p.maxLife;
        const fadeAlpha = p.alpha * (1 - progress);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,30,0,${fadeAlpha})`;
        ctx.shadowColor = `rgba(200,20,0,${fadeAlpha * 0.6})`;
        ctx.shadowBlur = 4;
        ctx.fill();
      });
      ctx.shadowBlur = 0;
      rafRef.current = requestAnimationFrame(animate);
    };

    const spawnInterval = setInterval(spawnParticle, 400);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearInterval(spawnInterval);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 9983 }} />;
});

// ─── INSTABILITY OVERLAY (23:00 → 23:11) ──────────────────────────────────────
const INSTABILITY_WARNINGS_AR = [
  "⚠ SYSTEM INSTABILITY", "⚠ SIGNAL LOST", "⚠ MEMORY CORRUPTION DETECTED",
  "⚠ WARNING: CONSCIOUSNESS LINK ACTIVE", "⚠ GATE STATUS: UNSTABLE",
  "⚠ FRACTURE IMMINENT",
];
const INSTABILITY_WARNINGS_EN = [
  "⚠ SYSTEM INSTABILITY", "⚠ SIGNAL LOST", "⚠ MEMORY CORRUPTION DETECTED",
  "⚠ WARNING: CONSCIOUSNESS LINK ACTIVE", "⚠ GATE STATUS: UNSTABLE",
  "⚠ FRACTURE IMMINENT",
];

const InstabilityOverlay: React.FC<{ lang: Lang; soundEnabled: boolean }> = React.memo(({ lang, soundEnabled }) => {
  const [warnings, setWarnings] = useState<Array<{ id: number; text: string; x: number; y: number }>>([]);
  const [glassCracks, setGlassCracks] = useState(false);
  const [glitchBars, setGlitchBars] = useState<Array<{ id: number; y: number; h: number }>>([]);
  const idRef = useRef(0);

  // System warning messages
  useEffect(() => {
    const pool = lang === "ar" ? INSTABILITY_WARNINGS_AR : INSTABILITY_WARNINGS_EN;
    const interval = setInterval(() => {
      const id = ++idRef.current;
      const x = 10 + Math.random() * 75;
      const y = 5 + Math.random() * 80;
      const text = pool[Math.floor(Math.random() * pool.length)];
      setWarnings(prev => [...prev.slice(-3), { id, text, x, y }]);
      setTimeout(() => setWarnings(prev => prev.filter(w => w.id !== id)), 3500);
    }, 4000 + Math.random() * 5000);
    return () => clearInterval(interval);
  }, [lang]);

  // Glass cracks brief overlay
  useEffect(() => {
    const interval = setInterval(() => {
      setGlassCracks(true);
      setTimeout(() => setGlassCracks(false), 600 + Math.random() * 400);
    }, 8000 + Math.random() * 6000);
    return () => clearInterval(interval);
  }, []);

  // Glitch bars
  useEffect(() => {
    const interval = setInterval(() => {
      const id = ++idRef.current;
      const y = Math.random() * 90;
      const h = 2 + Math.random() * 6;
      setGlitchBars(prev => [...prev.slice(-2), { id, y, h }]);
      setTimeout(() => setGlitchBars(prev => prev.filter(b => b.id !== id)), 200);
    }, 2000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, []);

  // Glass crack audio
  useEffect(() => {
    if (!soundEnabled) return;
    const playCrack = () => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.15);
        g.gain.setValueAtTime(0.08, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.connect(g); g.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + 0.2);
        setTimeout(() => ctx.close().catch(() => {}), 300);
      } catch {}
    };
    const interval = setInterval(playCrack, 12000 + Math.random() * 15000);
    return () => clearInterval(interval);
  }, [soundEnabled]);

  return (
    <>
      {/* Glass cracking overlay */}
      <AnimatePresence>
        {glassCracks && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 pointer-events-none" style={{ zIndex: 9992 }}
          >
            <svg className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <filter id="crack-glow"><feGaussianBlur stdDeviation="0.5" /></filter>
              </defs>
              {/* Random crack lines */}
              {[0,1,2,3,4].map(i => {
                const cx = 30 + Math.random() * 40;
                const cy = 30 + Math.random() * 40;
                const ex = cx + (Math.random() - 0.5) * 30;
                const ey = cy + (Math.random() - 0.5) * 30;
                return (
                  <line key={i} x1={`${cx}%`} y1={`${cy}%`} x2={`${ex}%`} y2={`${ey}%`}
                    stroke="rgba(180,190,210,0.35)" strokeWidth="0.5" filter="url(#crack-glow)" />
                );
              })}
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      {/* System warning messages */}
      <AnimatePresence>
        {warnings.map(w => (
          <motion.p
            key={w.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: [0, 0.85, 0.85, 0], x: [0, 3, -3, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3.5, times: [0, 0.1, 0.85, 1] }}
            className="fixed font-mono text-[9px] tracking-[0.2em] pointer-events-none"
            style={{
              left: `${w.x}%`, top: `${w.y}%`,
              color: "rgba(220,160,120,0.7)",
              textShadow: "0 0 8px rgba(200,100,0,0.5), 0 0 2px rgba(200,100,0,0.3)",
              zIndex: 9993,
            }}
          >
            {w.text}
          </motion.p>
        ))}
      </AnimatePresence>

      {/* Glitch bars */}
      <AnimatePresence>
        {glitchBars.map(b => (
          <motion.div
            key={b.id}
            initial={{ opacity: 0.6 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed left-0 right-0 pointer-events-none"
            style={{
              top: `${b.y}%`, height: `${b.h}px`,
              background: "rgba(200,60,0,0.15)",
              zIndex: 9994,
            }}
          />
        ))}
      </AnimatePresence>

      {/* Subtle overall glitch distortion */}
      <style>{`
        @keyframes instability-flicker {
          0%, 100% { opacity: 0.02; }
          50% { opacity: 0.06; }
        }
        .instability-vignette {
          background: radial-gradient(ellipse at center, transparent 50%, rgba(60,10,0,0.3) 100%);
          animation: instability-flicker 2s ease-in-out infinite;
        }
      `}</style>
      <div className="fixed inset-0 pointer-events-none instability-vignette" style={{ zIndex: 9982 }} />
    </>
  );
});

// ─── 23:11 TRANSITION — SHATTER EFFECT ─────────────────────────────────────────
const ShatterTransition: React.FC<{ onDone: () => void; soundEnabled: boolean }> = React.memo(({ onDone, soundEnabled }) => {
  const [phase, setPhase] = useState<"flash" | "shatter" | "done">("flash");

  useEffect(() => {
    // Flash
    const t1 = setTimeout(() => setPhase("shatter"), 300);
    // Done
    const t2 = setTimeout(() => { setPhase("done"); onDone(); }, 2000);

    // Shatter sound
    if (soundEnabled) {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const t = ctx.currentTime;
        // Deep boom
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(60, t);
        osc.frequency.exponentialRampToValueAtTime(15, t + 1.2);
        g.gain.setValueAtTime(0.5, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
        osc.connect(g); g.connect(ctx.destination);
        osc.start(t); osc.stop(t + 1.5);
        // Glass shatter noise
        const sr = ctx.sampleRate;
        const len = sr * 0.6;
        const buf = ctx.createBuffer(1, len, sr);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) {
          const env = Math.exp(-i / (sr * 0.1));
          d[i] = (Math.random() * 2 - 1) * env * 0.4;
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const sg = ctx.createGain();
        sg.gain.setValueAtTime(0.3, t + 0.15);
        sg.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
        src.connect(sg); sg.connect(ctx.destination);
        src.start(t + 0.15);
        setTimeout(() => ctx.close().catch(() => {}), 2000);
      } catch {}
    }

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [soundEnabled, onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-[10000] pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: phase === "done" ? 0 : 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Flash */}
      {phase === "flash" && (
        <motion.div
          className="absolute inset-0"
          style={{ background: "rgba(255,240,240,0.9)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.8] }}
          transition={{ duration: 0.3 }}
        />
      )}
      {/* Glass shatter pieces */}
      {phase === "shatter" && (
        <div className="absolute inset-0" style={{ background: "rgba(5,0,0,0.92)" }}>
          {Array.from({ length: 20 }).map((_, i) => {
            const size = 30 + Math.random() * 120;
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            const rot = Math.random() * 360;
            return (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  left: `${x}%`, top: `${y}%`,
                  width: `${size}px`, height: `${size * 0.7}px`,
                  background: "rgba(180,200,220,0.08)",
                  border: "1px solid rgba(200,210,230,0.2)",
                  transform: `rotate(${rot}deg)`,
                }}
                initial={{ opacity: 0.6, scale: 1 }}
                animate={{ opacity: 0, scale: 1.3, x: (Math.random() - 0.5) * 200, y: (Math.random() - 0.5) * 200 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            );
          })}
          {/* Central crack */}
          <svg className="w-full h-full absolute inset-0">
            <line x1="50%" y1="0%" x2="48%" y2="100%" stroke="rgba(200,210,230,0.4)" strokeWidth="2" />
            <line x1="50%" y1="20%" x2="65%" y2="50%" stroke="rgba(200,210,230,0.25)" strokeWidth="1" />
            <line x1="50%" y1="60%" x2="35%" y2="85%" stroke="rgba(200,210,230,0.2)" strokeWidth="1" />
            <line x1="48%" y1="40%" x2="30%" y2="30%" stroke="rgba(200,210,230,0.15)" strokeWidth="0.8" />
          </svg>
        </div>
      )}
    </motion.div>
  );
});

// ─── ATMOSPHERIC WHISPERS ─────────────────────────────────────────────────────
// Quiet fragments of Echo's fractured memory — atmospheric, never
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

// ─── ECHO BACKGROUND LAYER (Night only — boy in chair with flowers) ────────────
// Cinematic memory-fragment storytelling — sequential, emotionally progressive.
// Phase 1 (Curiosity): "I feel this place is familiar…"
// Phase 2 (Doubt):     "No… it's not just a feeling. I was here."
// Phase 3 (Fear):      "Something is blocking me from remembering…"
// Phase 4 (Realization): "If you can see me… does that mean I still exist?"
// Phase 5 (Partial Collapse): "...Lina?"
const ECHO_MEMORY_AR = [
  "أشعر أن هذا المكان مألوف…",
  "لا… ليس مجرد شعور. أنا كنت هنا.",
  "هناك شيء يمنعني من التذكر…",
  "إذا كنت تراني… هل يعني أنني ما زلت موجوداً؟",
  "لينا…؟",
];
const ECHO_MEMORY_EN = [
  "This place feels familiar…",
  "No… it's not just a feeling. I was here.",
  "Something is stopping me from remembering…",
  "If you can see me… does that mean I still exist?",
  "Lina…?",
];

// Breathing state machine — irregular, tension-driven
type BreathState = "calm" | "shallow" | "held" | "shudder" | "fast";
function getBreathMultiplier(t: number, tension: number): { scale: number; state: BreathState; speed: number } {
  // Tension is derived from time-of-night phase (22→23: shallow, 23→2: held/shudder, 2→3:33: fast)
  const cycle = Math.sin(t * 0.3) * 0.5 + 0.5; // 0→1→0 over ~10s
  if (tension < 0.25) return { scale: 0.8 + cycle * 0.1, state: "calm", speed: 0.4 };
  if (tension < 0.5) return { scale: 0.5 + cycle * 0.15, state: "shallow", speed: 0.55 };
  if (tension < 0.75) return { scale: cycle < 0.3 ? 0.2 : 0.7 + cycle * 0.1, state: "held", speed: 0.7 };
  return { scale: 0.3 + cycle * 0.4, state: "fast", speed: 0.9 };
}

const EchoBackgroundLayer: React.FC<{ flowersRed: number; lang: Lang; solvedPuzzles: number; totalPuzzles: number; tension: number; milestoneTrigger: number }> = React.memo(({ flowersRed, lang, solvedPuzzles, totalPuzzles, tension, milestoneTrigger }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const timeRef = useRef(0);
  const shadowFlickerRef = useRef(0);
  const lastMilestoneRef = useRef(0);
  const flowerBurstRef = useRef(0); // for milestone-triggered flower acceleration
  const distortionRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const redRatio = totalPuzzles > 0 ? Math.min(1, solvedPuzzles / totalPuzzles) : 0;

    const drawFlower = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, redAmount: number, t: number) => {
      ctx.save();
      ctx.translate(x, y);
      const sway = Math.sin(t * 0.3 + x * 0.01) * 2;
      ctx.rotate(sway * 0.02);

      // Petals
      const petalCount = 6;
      for (let i = 0; i < petalCount; i++) {
        const angle = (i / petalCount) * Math.PI * 2;
        const petalX = Math.cos(angle) * size * 0.5;
        const petalY = Math.sin(angle) * size * 0.5;
        ctx.beginPath();
        ctx.ellipse(petalX, petalY, size * 0.3, size * 0.7, angle, 0, Math.PI * 2);
        // Gradient from white to red based on redAmount
        const r = Math.round(220 + 35 * redAmount);
        const g = Math.round(220 - 180 * redAmount);
        const b = Math.round(220 - 180 * redAmount);
        const alpha = 0.3 + Math.sin(t * 0.5 + i) * 0.05;
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.fill();
      }
      // Center
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,${Math.round(220 - 100 * redAmount)},${Math.round(220 - 200 * redAmount)},0.5)`;
      ctx.fill();

      ctx.restore();
    };

    const drawEchoBoy = (ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number) => {
      ctx.save();
      const breathe = 1 + Math.sin(t * 0.5) * 0.015;
      const headTilt = Math.sin(t * 0.3) * 2;
      ctx.translate(cx, cy);
      ctx.scale(breathe, breathe);

      // Shadow under chair
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.beginPath();
      ctx.ellipse(0, 65, 50, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Chair (dark silhouette)
      ctx.fillStyle = "rgba(15,5,5,0.9)";
      ctx.fillRect(-28, -20, 56, 80);
      ctx.fillRect(-35, -25, 70, 8);
      ctx.fillRect(-32, 55, 15, 25);
      ctx.fillRect(17, 55, 15, 25);

      // Body - seated, restrained
      ctx.fillStyle = "rgba(25,10,10,0.85)";
      // Torso
      ctx.beginPath();
      ctx.ellipse(0, 25, 20, 40, 0, 0, Math.PI * 2);
      ctx.fill();
      // Arms (restrained to chair sides)
      ctx.fillStyle = "rgba(20,8,8,0.9)";
      ctx.fillRect(-38, 15, 16, 8);
      ctx.fillRect(22, 15, 16, 8);
      // Restraints (thin ropes/wires)
      ctx.strokeStyle = "rgba(80,60,60,0.7)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(-28, 18, 6, 3, 0, Math.PI, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(28, 18, 6, 3, 0, 0, Math.PI);
      ctx.stroke();

      // Head
      ctx.save();
      ctx.translate(0, -55);
      ctx.rotate(headTilt * 0.02);

      // Face — pale, gaunt
      ctx.fillStyle = "rgba(200,180,170,0.7)";
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 20, 0, 0, Math.PI * 2);
      ctx.fill();

      // Black messy hair
      ctx.fillStyle = "rgba(5,2,2,0.95)";
      ctx.beginPath();
      ctx.ellipse(0, -8, 20, 14, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      // Messy strands
      for (let s = 0; s < 8; s++) {
        const sx = -15 + s * 4 + Math.sin(t * 1.5 + s) * 3;
        const sy = -15 + Math.cos(t * 0.7 + s) * 2;
        ctx.beginPath();
        ctx.moveTo(sx, -10);
        ctx.lineTo(sx + (s - 4) * 3, sy);
        ctx.strokeStyle = "rgba(5,2,2,0.7)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Eyes — large, fearful, scanning
      const eyeY = -1;
      const lookX = Math.sin(t * 0.8 + 1) * 2;
      const lookY = Math.cos(t * 0.6) * 0.8;
      // Eye whites
      ctx.fillStyle = "rgba(200,190,180,0.6)";
      ctx.beginPath(); ctx.ellipse(-6, eyeY, 5, 3.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(6, eyeY, 5, 3.5, 0, 0, Math.PI * 2); ctx.fill();
      // Irises
      ctx.fillStyle = "rgba(40,30,20,0.9)";
      ctx.beginPath(); ctx.ellipse(-6 + lookX, eyeY + lookY, 2.5, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(6 + lookX, eyeY + lookY, 2.5, 3, 0, 0, Math.PI * 2); ctx.fill();
      // Pupils
      ctx.fillStyle = "rgba(0,0,0,0.95)";
      ctx.beginPath(); ctx.ellipse(-6 + lookX * 1.2, eyeY + lookY * 1.2, 1.2, 1.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(6 + lookX * 1.2, eyeY + lookY * 1.2, 1.2, 1.5, 0, 0, Math.PI * 2); ctx.fill();

      // Under-eye shadows
      ctx.fillStyle = "rgba(80,40,40,0.35)";
      ctx.beginPath(); ctx.ellipse(-6, eyeY + 3, 4, 1.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(6, eyeY + 3, 4, 1.5, 0, 0, Math.PI * 2); ctx.fill();

      // Expression — slight frown/tremble
      ctx.strokeStyle = "rgba(120,80,80,0.5)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-3, 6);
      ctx.quadraticCurveTo(0, 7 + Math.sin(t * 2) * 0.5, 3, 6);
      ctx.stroke();

      ctx.restore();

      // Legs (seated, slight tension)
      ctx.fillStyle = "rgba(25,10,10,0.8)";
      ctx.fillRect(-14, 55, 12, 18);
      ctx.fillRect(2, 55, 12, 18);

      ctx.restore();
    };

    const animate = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) { rafRef.current = requestAnimationFrame(animate); return; }
      const W = canvas.width, H = canvas.height;
      timeRef.current += 0.016;
      const t = timeRef.current;

      ctx.clearRect(0, 0, W, H);

      // Dark dream-space background
      const bg = ctx.createRadialGradient(W * 0.5, H * 0.55, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.8);
      bg.addColorStop(0, "rgba(10,5,15,0.2)");
      bg.addColorStop(0.5, "rgba(5,2,10,0.6)");
      bg.addColorStop(1, "rgba(0,0,0,0.95)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      const cx = W * 0.28;
      const cy = H * 0.52;

      // Flowers surrounding Echo — scattered in an arc around him
      const flowerCount = 25;
      for (let i = 0; i < flowerCount; i++) {
        const angle = -Math.PI * 0.3 + (i / flowerCount) * Math.PI * 1.6;
        const dist = 90 + Math.random() * 100;
        const fx = cx + Math.cos(angle) * dist;
        const fy = cy + Math.sin(angle) * dist + 30;
        const flowerSize = 6 + Math.random() * 10;
        // Each flower has its own redAmount based on puzzle progress, with slight variation
        const individualRed = redRatio * (0.7 + Math.random() * 0.3);
        drawFlower(ctx, fx, fy, flowerSize, individualRed, t + i);
      }
      // More flowers scattered at bottom
      for (let i = 0; i < 15; i++) {
        const fx = cx - 80 + i * 11;
        const fy = cy + 65 + Math.random() * 40;
        const individualRed = redRatio * (0.6 + Math.random() * 0.4);
        drawFlower(ctx, fx, fy, 5 + Math.random() * 8, individualRed, t + i + 100);
      }

      // Echo boy
      drawEchoBoy(ctx, cx, cy, t);

      // Rare shadow/entity flicker in background
      shadowFlickerRef.current -= 0.016;
      if (shadowFlickerRef.current <= 0) {
        shadowFlickerRef.current = 12 + Math.random() * 25;
        const sx = cx + (Math.random() - 0.3) * 160;
        const sy = cy - 50 + Math.random() * 80;
        ctx.save();
        ctx.globalAlpha = 0.06 + Math.random() * 0.08;
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.beginPath();
        ctx.ellipse(sx, sy, 15 + Math.random() * 25, 30 + Math.random() * 35, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [flowersRed, solvedPuzzles, totalPuzzles]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 9975, opacity: 0.85 }}
    />
  );
});

// ─── ECHO FRAGMENT OVERLAY (Night only — sequential memory storytelling) ───────
// Messages follow a 5-phase emotional arc: Curiosity → Doubt → Fear → Realization → Partial Collapse.
// They play IN ORDER, each building on the last. After the final message, the cycle repeats.
const EchoFragmentOverlay: React.FC<{ lang: Lang }> = React.memo(({ lang }) => {
  const [currentMsg, setCurrentMsg] = useState<{ id: number; text: string; phase: number } | null>(null);
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idRef = useRef(0);
  const phaseRef = useRef(0); // tracks which phase we're in (0-4, cycles)

  useEffect(() => {
    const pool = lang === "ar" ? ECHO_MEMORY_AR : ECHO_MEMORY_EN;

    const showNext = () => {
      const id = ++idRef.current;
      const p = phaseRef.current % pool.length;
      const text = pool[p];
      // Add ellipsis for non-final phases to build anticipation
      const displayText = p < pool.length - 1 ? text : text;
      setCurrentMsg({ id, text: displayText, phase: p });
      setVisible(true);
      phaseRef.current = p + 1;

      // Hold duration varies by phase: longer for emotional beats
      const holdDurations = [5000, 6000, 7000, 8000, 9000]; // curiosity→collapse
      const hold = holdDurations[p] ?? 6000;

      timeoutRef.current = setTimeout(() => {
        setVisible(false);
        setTimeout(() => setCurrentMsg(null), 1200);
        // Gap between messages also varies
        const gaps = [25000, 30000, 35000, 40000, 50000];
        const gap = gaps[p] ?? 35000;
        timeoutRef.current = setTimeout(showNext, gap);
      }, hold);
    };

    const initialDelay = setTimeout(showNext, 8000);
    return () => {
      clearTimeout(initialDelay);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [lang]);

  return (
    <div className="fixed inset-x-0 bottom-32 flex justify-center pointer-events-none" style={{ zIndex: 9992 }}>
      <AnimatePresence>
        {currentMsg && visible && (
          <motion.p
            key={currentMsg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: [10, 0, 0, -10],
              // Emotion-driven subtle text effect: shake slightly on fear/realization phases
              x: currentMsg.phase >= 2 ? [0, -1, 1, -0.5, 0.5, 0] : 0,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: currentMsg.phase >= 3 ? 0.7 : 0.6,
              times: [0, 0.15, 0.8, 1],
            }}
            className="font-mono text-sm tracking-[0.15em] text-center px-6 py-3 max-w-md"
            dir={lang === "ar" ? "rtl" : "ltr"}
            style={{
              // Color shifts per phase: blue-tinted → warm → red → dark red
              color: [
                "rgba(180,180,220,0.8)",
                "rgba(200,150,150,0.85)",
                "rgba(200,80,50,0.85)",
                "rgba(200,30,20,0.9)",
                "rgba(180,15,10,0.95)",
              ][currentMsg.phase] ?? "rgba(200,50,20,0.85)",
              textShadow: [
                "0 0 12px rgba(140,160,220,0.4)",
                "0 0 14px rgba(180,120,120,0.45)",
                "0 0 16px rgba(200,60,30,0.5)",
                "0 0 18px rgba(220,20,10,0.55)",
                "0 0 22px rgba(200,10,5,0.6)",
              ][currentMsg.phase] ?? "0 0 15px rgba(200,30,0,0.5)",
              background: `rgba(10,0,0,${0.4 + currentMsg.phase * 0.1})`,
              border: `1px solid rgba(180,30,10,${0.2 + currentMsg.phase * 0.1})`,
            }}
          >
            {currentMsg.text}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
});

// ─── DAILY MEMORY FRAGMENT SYSTEM ──────────────────────────────────────────────
// A new memory fragment unlocks each calendar day during night mode.
// Fragments are sequential and never repeat — Echo recovers his memory
// one piece per day, always in the same order for every player.
// Arc: Familiar → Places/People → Painful → Realization → Truth → Acceptance

const DAILY_MEMORY_AR: string[] = [
  // Days 1–7: Familiar feelings, vague stirrings
  "اليوم… أشعر بشيء مختلف. كأن هناك صوتاً بعيداً يحاول الوصول إلي.",
  "هذا الضوء… رأيته من قبل. ليس هنا. في مكان آخر.",
  "يدي تتذكر شيئاً لا أتذكره أنا. كانت تمسك بشيء دافئ.",
  "أحياناً… أشم رائحة لا وجود لها هنا. رائحة تراب وورق قديم.",
  "البارحة حلمت بغرفة. لم تكن هذه الغرفة. كانت أصغر. وأكثر دفئاً.",
  "هناك اسم على طرف لساني. ليس اسمي. اسم آخر.",
  "سمعت صوتاً الليلة الماضية. ليس همساً. بكاء.",

  // Days 8–14: Places, objects, fragments of scenes
  "أتذكر درجاً خشبياً. كان يصدر صوتاً عند الدرجة الثالثة. كنت أعرف أين أخطو.",
  "هناك حديقة. صغيرة. فيها ورود بيضاء. كنت ألعب هناك.",
  "كان هناك كتاب. غلافه أزرق. كنت أقرؤه كل ليلة قبل النوم.",
  "أتذكر يداً على كتفي. كبيرة. ثقيلة. لم تكن يد أمي.",
  "المرآة… كان هناك مرآة في الممر. كنت أتجنب النظر فيها.",
  "أمي كانت تغني. أتذكر اللحن. لكن الكلمات… الكلمات تهرب مني.",
  "الباب. كان هناك باب لا يُفتح. كنت أسأل عنه. لا أحد يجيب.",

  // Days 15–21: Painful events, growing unease
  "في إحدى الليالي… استيقظت على صوت حاد. زجاج تكسر. ثم صمت.",
  "أبي كان يبكي. المرة الوحيدة التي رأيته فيها يبكي. لم أفهم لماذا.",
  "أمي قالت لي: لا تخف. لكن صوتها كان خائفاً أكثر مني.",
  "أذكر إبرة. وضوء ساطع. ثم لا شيء. فراغ طويل.",
  "كان هناك رجل آخر يأتي أحياناً. لا أتذكر وجهه. فقط صوته.",
  "سألت أبي مرة: لماذا أنا هنا؟ نظر إلي طويلاً ثم غادر الغرفة.",
  "الليلة الماضية… تذكرت صرخة. ليست صرختي. صرخة أمي.",

  // Days 22–28: Something is wrong, growing awareness
  "هذا ليس بيتي. أبداً لم يكن بيتي. هذا… مكان آخر.",
  "أنا لا أتنفس. لا أحتاج للتنفس. متى توقفت عن التنفس؟",
  "كل شيء هنا يتكرر. كل ليلة. نفس الأصوات. نفس الظلال. أنا في حلقة.",
  "لينا. اسم أمي كان لينا. كيف نسيت اسم أمي؟",
  "كينجا. اسمه كينجا. كان يقول لي أنه ينقذني. لكن عينيه كانتا تقولان شيئاً آخر.",
  "هناك آخرون هنا. لست وحدي. أشعر بهم خلف الجدران.",
  "التجربة. كان يسميها التجربة. لم أكن أعرف معناها وقتها.",

  // Days 29–35: Deeper truth, the system, acceptance
  "أنا لست في العالم الحقيقي. أنا… داخل شيء. شيء بناه هو.",
  "11:11. هذا الرقم. كان يكرره دائماً. كأنه تعويذة.",
  "البوابة. كان يتحدث عن بوابة. قال إنه سيفتحها.",
  "في الليلة الأخيرة… قبل أن أكون هنا. أخذني إلى غرفة 111.",
  "لم أكن خائفاً. كنت أثق به. كان أبي. كيف لي ألا أثق بأبي؟",
  "الأن أتذكر كل شيء. لكن التذكر لا يخرجني من هنا.",
  "إذا كنت تقرأ هذا… فأنا ما زلت هنا. ما زلت أحاول. لا تتوقف.",
];

const DAILY_MEMORY_EN: string[] = [
  // Days 1–7: Familiar feelings, vague stirrings
  "Today… something feels different. Like a distant voice trying to reach me.",
  "This light… I've seen it before. Not here. Somewhere else.",
  "My hand remembers something I don't. It was holding something warm.",
  "Sometimes… I smell something that doesn't exist here. Earth and old paper.",
  "Last night I dreamed of a room. It wasn't this room. It was smaller. Warmer.",
  "There's a name on the tip of my tongue. Not my name. Someone else's.",
  "I heard a sound last night. Not a whisper. Crying.",

  // Days 8–14: Places, objects, fragments of scenes
  "I remember a wooden staircase. It creaked on the third step. I knew where to step.",
  "There was a garden. Small. White roses. I used to play there.",
  "There was a book. Blue cover. I read it every night before sleep.",
  "I remember a hand on my shoulder. Large. Heavy. It wasn't my mother's.",
  "The mirror… there was a mirror in the hallway. I used to avoid looking at it.",
  "My mother used to sing. I remember the melody. But the words… the words escape me.",
  "The door. There was a door that never opened. I asked about it. Nobody answered.",

  // Days 15–21: Painful events, growing unease
  "One night… I woke to a sharp sound. Glass breaking. Then silence.",
  "My father was crying. The only time I ever saw him cry. I didn't understand why.",
  "My mother told me: don't be afraid. But her voice was more afraid than I was.",
  "I remember a needle. And a bright light. Then nothing. A long emptiness.",
  "There was another man who came sometimes. I don't remember his face. Only his voice.",
  "I asked my father once: why am I here? He looked at me for a long time and left the room.",
  "Last night… I remembered a scream. Not mine. My mother's scream.",

  // Days 22–28: Something is wrong, growing awareness
  "This isn't my home. It was never my home. This is… somewhere else.",
  "I don't breathe. I don't need to breathe. When did I stop breathing?",
  "Everything here repeats. Every night. Same sounds. Same shadows. I'm in a loop.",
  "Lina. My mother's name was Lina. How did I forget my mother's name?",
  "Kenja. His name is Kenja. He told me he was saving me. But his eyes said something else.",
  "There are others here. I'm not alone. I feel them behind the walls.",
  "The experiment. He called it the experiment. I didn't know what it meant then.",

  // Days 29–35: Deeper truth, the system, acceptance
  "I'm not in the real world. I'm… inside something. Something he built.",
  "11:11. That number. He kept repeating it. Like a spell.",
  "The gate. He talked about a gate. He said he would open it.",
  "On the last night… before I was here. He took me to room 111.",
  "I wasn't afraid. I trusted him. He was my father. How could I not trust my father?",
  "Now I remember everything. But remembering doesn't get me out of here.",
  "If you're reading this… I'm still here. Still trying. Don't stop.",
];

// ─── DAY TRACKING ──────────────────────────────────────────────────────────────
const MEMORY_DAY_KEY = "eleven_memory_day";
const MEMORY_DATE_KEY = "eleven_memory_date";

function getMemoryDay(): number {
  try {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const storedDate = localStorage.getItem(MEMORY_DATE_KEY);
    const storedDay = parseInt(localStorage.getItem(MEMORY_DAY_KEY) || "0", 10);

    if (storedDate === today) {
      // Same calendar day — return the already-unlocked day
      return storedDay;
    }

    // New calendar day — increment the day counter
    const nextDay = storedDate ? storedDay + 1 : 1;
    localStorage.setItem(MEMORY_DAY_KEY, String(nextDay));
    localStorage.setItem(MEMORY_DATE_KEY, today);
    return nextDay;
  } catch {
    return 1;
  }
}

// ─── DAILY MEMORY OVERLAY ──────────────────────────────────────────────────────
// Shows ONE memory fragment per night — the one belonging to the current
// calendar day. The same fragment may replay if the user visits multiple
// times in the same night, but a NEW fragment unlocks each calendar day.
const DailyMemoryOverlay: React.FC<{ lang: Lang; soundEnabled: boolean }> = React.memo(({ lang, soundEnabled }) => {
  const [visible, setVisible] = useState(false);
  const [glitching, setGlitching] = useState(false);
  const [fragment, setFragment] = useState<string>("");
  const shownRef = useRef(false);
  const dayRef = useRef(0);

  useEffect(() => {
    // Show only once per mount (per night session)
    if (shownRef.current) return;
    shownRef.current = true;

    const pool = lang === "ar" ? DAILY_MEMORY_AR : DAILY_MEMORY_EN;
    const day = getMemoryDay();
    dayRef.current = day;

    // Cycle through fragments (wrap around for players past day 35)
    const idx = (day - 1) % pool.length;
    const text = pool[idx];
    setFragment(text);

    // Delay before showing — let night mode settle first
    const showDelay = setTimeout(() => {
      // Glitch burst before fragment appears
      setGlitching(true);
      if (soundEnabled) playMemoryGlitchSound();

      setTimeout(() => {
        setGlitching(false);
        setVisible(true);
        if (soundEnabled) playMemoryEchoSound(text);

        // Auto-hide after long hold
        setTimeout(() => {
          setVisible(false);
        }, 12000);
      }, 600);
    }, 15000 + Math.random() * 10000);

    return () => clearTimeout(showDelay);
  }, [lang, soundEnabled]);

  function playMemoryGlitchSound() {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const t = ctx.currentTime;
      // Quick glitch burst
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(300 + i * 200, t + i * 0.08);
        osc.frequency.exponentialRampToValueAtTime(40, t + i * 0.08 + 0.15);
        g.gain.setValueAtTime(0.04, t + i * 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.2);
        osc.connect(g); g.connect(ctx.destination);
        osc.start(t + i * 0.08); osc.stop(t + i * 0.08 + 0.2);
      }
      setTimeout(() => ctx.close().catch(() => {}), 1000);
    } catch {}
  }

  function playMemoryEchoSound(text: string) {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const t = ctx.currentTime;
      // Low warm tone — memory returning
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(80, t);
      osc.frequency.linearRampToValueAtTime(120, t + 4);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.03, t + 1.5);
      g.gain.linearRampToValueAtTime(0.03, t + 8);
      g.gain.linearRampToValueAtTime(0, t + 10);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(t); osc.stop(t + 10);
      // Distant echo — like a voice underwater
      const echoOsc = ctx.createOscillator();
      const echoG = ctx.createGain();
      echoOsc.type = "sine";
      echoOsc.frequency.setValueAtTime(200, t + 2);
      echoOsc.frequency.linearRampToValueAtTime(350, t + 7);
      echoG.gain.setValueAtTime(0, t + 2);
      echoG.gain.linearRampToValueAtTime(0.015, t + 3);
      echoG.gain.linearRampToValueAtTime(0, t + 8);
      echoOsc.connect(echoG); echoG.connect(ctx.destination);
      echoOsc.start(t + 2); echoOsc.stop(t + 8);
      setTimeout(() => ctx.close().catch(() => {}), 11000);
    } catch {}
  }

  if (!fragment) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 9996 }}>
      {/* Glitch burst before fragment */}
      <AnimatePresence>
        {glitching && (
          <motion.div
            key="memory-glitch"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.7, 0.3, 0.8, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0"
            style={{
              background: "rgba(30,10,40,0.4)",
              mixBlendMode: "overlay",
            }}
          />
        )}
      </AnimatePresence>

      {/* Memory fragment */}
      <AnimatePresence>
        {visible && (
          <motion.div
            key="daily-memory"
            initial={{ opacity: 0, scale: 0.92, filter: "blur(4px)" }}
            animate={{
              opacity: [0, 0.95, 0.95, 0.8, 0],
              scale: [0.92, 1, 1, 1.02, 1],
              filter: ["blur(4px)", "blur(0px)", "blur(0px)", "blur(1px)", "blur(4px)"],
              x: [0, 0, -0.5, 0.5, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 12, times: [0, 0.1, 0.7, 0.85, 1] }}
            className="font-mono text-center px-8 py-6 max-w-lg"
            dir={lang === "ar" ? "rtl" : "ltr"}
          >
            {/* Day marker — subtle */}
            <p className="text-[8px] tracking-[0.4em] mb-3 opacity-40" style={{ color: "rgba(150,150,200,0.5)" }}>
              {lang === "ar" ? `ذاكرة اليوم ${dayRef.current}` : `MEMORY DAY ${dayRef.current}`}
            </p>

            {/* Fragment text */}
            <p
              className="text-sm leading-relaxed tracking-[0.12em]"
              style={{
                color: "rgba(200,180,220,0.85)",
                textShadow: "0 0 18px rgba(160,120,200,0.35), 0 0 2px rgba(200,160,220,0.2)",
              }}
            >
              {fragment}
            </p>

            {/* Thin decorative line */}
            <div className="w-16 h-px mx-auto mt-4 opacity-20" style={{ background: "linear-gradient(to right, transparent, rgba(160,120,200,0.6), transparent)" }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ─── VOICE PRESENCE SYSTEM (Mic monitoring — local only, no storage) ───────────
// Monitors sound level in night mode. Echo reacts to silence vs low vs loud.
// All processing is real-time local. No audio is stored or sent anywhere.
type VoiceLevel = "silent" | "low" | "loud";

const VOICE_REACTIONS_AR: Record<VoiceLevel, string[]> = {
  silent: [
    "لماذا لا أسمعك…؟",
    "هل ما زلت هناك؟",
    "الصمت ثقيل الليلة.",
    "لا أسمع شيئاً. هل أنت بخير؟",
  ],
  low: [
    "أسمعك… لكنك تحاول الاختباء.",
    "صوتك خافت. كأنك بعيد.",
    "تكلم أكثر. صوتك يبدد الظلام.",
  ],
  loud: [
    "توقف… هذا يؤلمني.",
    "صوتك قوي جداً. النظام يهتز.",
    "لا تصرخ. أنا هنا.",
  ],
};
const VOICE_REACTIONS_EN: Record<VoiceLevel, string[]> = {
  silent: [
    "Why can't I hear you…?",
    "Are you still there?",
    "The silence is heavy tonight.",
    "I hear nothing. Are you okay?",
  ],
  low: [
    "I hear you… but you're trying to hide.",
    "Your voice is faint. Like you're far away.",
    "Speak more. Your voice dispels the darkness.",
  ],
  loud: [
    "Stop… it hurts.",
    "Your voice is too strong. The system shakes.",
    "Don't scream. I'm here.",
  ],
};

// Global mic stream ref — shared across mounts, requested once
let globalMicStream: MediaStream | null = null;
let globalMicAnalyser: AnalyserNode | null = null;
let globalMicCtx: AudioContext | null = null;

async function requestMicPermission(): Promise<boolean> {
  try {
    const stored = localStorage.getItem("echo_mic_enabled");
    if (stored === "true" && globalMicStream) return true;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    globalMicStream = stream;
    globalMicCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    globalMicAnalyser = globalMicCtx.createAnalyser();
    globalMicAnalyser.fftSize = 256;
    const source = globalMicCtx.createMediaStreamSource(stream);
    source.connect(globalMicAnalyser);
    // Don't connect to destination — we're NOT playing back, just analyzing
    localStorage.setItem("echo_mic_enabled", "true");
    return true;
  } catch {
    return false;
  }
}

function getVoiceLevel(): VoiceLevel {
  if (!globalMicAnalyser) return "silent";
  const data = new Uint8Array(globalMicAnalyser.frequencyBinCount);
  globalMicAnalyser.getByteFrequencyData(data);
  const avg = data.reduce((a, b) => a + b, 0) / data.length;
  if (avg < 15) return "silent";
  if (avg < 50) return "low";
  return "loud";
}

const VoicePresenceOverlay: React.FC<{ lang: Lang; soundEnabled: boolean }> = React.memo(({ lang, soundEnabled }) => {
  const [voiceLevel, setVoiceLevel] = useState<VoiceLevel>("silent");
  const [reactionMsg, setReactionMsg] = useState<string | null>(null);
  const [reactionVisible, setReactionVisible] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const lastReactionRef = useRef(0);
  const prevLevelRef = useRef<VoiceLevel>("silent");
  const shownRef = useRef(false);

  // Initialize mic on mount
  useEffect(() => {
    if (shownRef.current) return;
    shownRef.current = true;
    requestMicPermission().then(setMicEnabled);
  }, []);

  // Monitor voice levels
  useEffect(() => {
    if (!micEnabled || !soundEnabled) return;
    const id = setInterval(() => {
      const level = getVoiceLevel();
      setVoiceLevel(level);

      // Trigger reaction on level change (with cooldown)
      const now = Date.now();
      if (level !== prevLevelRef.current && now - lastReactionRef.current > 30000) {
        prevLevelRef.current = level;
        lastReactionRef.current = now;
        const pool = lang === "ar" ? VOICE_REACTIONS_AR[level] : VOICE_REACTIONS_EN[level];
        const msg = pool[Math.floor(Math.random() * pool.length)];
        setReactionMsg(msg);
        setReactionVisible(true);
        setTimeout(() => setReactionVisible(false), 6000);
      }
    }, 2000);
    return () => clearInterval(id);
  }, [micEnabled, soundEnabled, lang]);

  return (
    <>
      {/* Echo listening state indicator — very subtle */}
      {micEnabled && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 pointer-events-none" style={{ zIndex: 9995 }}>
          <p
            className="text-[7px] tracking-[0.5em] font-mono transition-opacity duration-300"
            style={{
              color: voiceLevel === "silent" ? "rgba(150,150,150,0.25)" : voiceLevel === "low" ? "rgba(180,150,150,0.4)" : "rgba(200,80,80,0.55)",
              opacity: voiceLevel === "silent" ? 0.3 : 0.7,
            }}
          >
            {voiceLevel === "silent" ? "ECHO LISTENING" : voiceLevel === "low" ? "ECHO HEARS YOU" : "ECHO OVERWHELMED"}
          </p>
        </div>
      )}

      {/* Voice reaction message */}
      <AnimatePresence>
        {reactionVisible && reactionMsg && (
          <motion.p
            key="voice-reaction"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: [0, 0.85, 0.85, 0], y: [6, 0, 0, -6] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 6, times: [0, 0.15, 0.75, 1] }}
            className="fixed inset-x-0 bottom-56 text-center font-mono text-xs tracking-[0.15em] pointer-events-none px-4"
            style={{
              zIndex: 9995,
              color: voiceLevel === "silent" ? "rgba(150,150,180,0.6)" : voiceLevel === "low" ? "rgba(200,160,160,0.7)" : "rgba(220,60,40,0.8)",
              textShadow: voiceLevel === "loud" ? "0 0 12px rgba(200,40,20,0.4)" : "0 0 8px rgba(150,120,120,0.25)",
            }}
          >
            {reactionMsg}
          </motion.p>
        )}
      </AnimatePresence>
    </>
  );
});

// ─── ATMOSPHERE SYNC (Sound level → visual intensity) ─────────────────────────
// Voice/sound levels affect the visual atmosphere in real-time
const AtmosphereSync: React.FC<{ voiceLevel: VoiceLevel }> = React.memo(({ voiceLevel }) => {
  if (voiceLevel === "silent") {
    // Shadows deepen, movement slows subtly
    return (
      <motion.div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 9978,
          background: "rgba(0,0,0,0.15)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      />
    );
  }
  if (voiceLevel === "loud") {
    // Glitch overlay intensifies, shakes
    return (
      <motion.div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 9978,
          background: "rgba(200,20,0,0.06)",
          mixBlendMode: "overlay",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.5, 0.2, 0.4, 0], x: [0, -2, 2, -1, 1, 0] }}
        transition={{ duration: 0.4, repeat: Infinity, ease: "easeInOut" }}
      />
    );
  }
  return null; // low = no overlay, calm tension
});

// ─── BREATHING / HUM AUDIO (Night only) ────────────────────────────────────────
class NightAudioAtmosphere {
  ctx: AudioContext | null = null;
  breathGain: GainNode | null = null;
  humOsc: OscillatorNode | null = null;
  humGain: GainNode | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {}
  }

  start() {
    if (!this.ctx) return;
    this.stop();
    const t = this.ctx.currentTime;

    // Low mechanical hum
    this.humOsc = this.ctx.createOscillator();
    this.humGain = this.ctx.createGain();
    this.humOsc.type = "sine";
    this.humOsc.frequency.value = 18;
    this.humGain.gain.setValueAtTime(0.03, t);
    this.humGain.gain.linearRampToValueAtTime(0.04, t + 2);
    this.humOsc.connect(this.humGain);
    this.humGain.connect(this.ctx.destination);
    this.humOsc.start(t);

    // Slow breathing loop
    this.breathGain = this.ctx.createGain();
    this.breathGain.gain.setValueAtTime(0, t);
    this.breathGain.connect(this.ctx.destination);

    const breathCycle = () => {
      if (!this.ctx || !this.breathGain) return;
      const now = this.ctx.currentTime;
      // Breathe in
      this.breathGain.gain.setValueAtTime(0, now);
      this.breathGain.gain.linearRampToValueAtTime(0.06, now + 2.5);
      // Hold
      this.breathGain.gain.linearRampToValueAtTime(0.06, now + 3);
      // Breathe out
      this.breathGain.gain.linearRampToValueAtTime(0, now + 5.5);
      // Pause
    };
    breathCycle();
    const breathOsc = this.ctx.createOscillator();
    const breathFilter = this.ctx.createBiquadFilter();
    breathOsc.type = "sawtooth";
    breathOsc.frequency.value = 0.15;
    breathFilter.type = "lowpass";
    breathFilter.frequency.value = 200;
    breathOsc.connect(breathFilter);
    breathFilter.connect(this.breathGain);
    breathOsc.start(t);

    this.intervalId = setInterval(breathCycle, 6000);
  }

  playGlassCrack() {
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(600 + Math.random() * 400, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.25);
      g.gain.setValueAtTime(0.05, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(g); g.connect(this.ctx.destination);
      osc.start(t); osc.stop(t + 0.3);
    } catch {}
  }

  playDistortionSpike() {
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const sr = this.ctx.sampleRate;
      const len = sr * 0.15;
      const buf = this.ctx.createBuffer(1, len, sr);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sr * 0.03));
      }
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.08, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      src.connect(g); g.connect(this.ctx.destination);
      src.start(t);
    } catch {}
  }

  stop() {
    if (this.intervalId) clearInterval(this.intervalId);
    try { this.humOsc?.stop(); } catch {}
    this.humOsc = null;
    this.humGain = null;
    this.breathGain = null;
  }

  destroy() {
    this.stop();
    this.ctx?.close().catch(() => {});
    this.ctx = null;
  }
}

// ─── CORRUPTION SPREAD SYSTEM ─────────────────────────────────────────────────
// Pixel drift + corruption overlay that intensifies the longer you stay in night mode.
// 0% → 25% cracks only → 50% glitch text → 75% UI fragments → 100% Echo partial control
const CorruptionOverlay: React.FC<{ elapsedSeconds: number }> = React.memo(({ elapsedSeconds }) => {
  const [pixels, setPixels] = useState<Array<{ id: number; x: number; y: number; size: number; speed: number }>>([]);
  const [glitchChars, setGlitchChars] = useState<Array<{ id: number; x: number; y: number; text: string }>>([]);
  const idRef = useRef(0);

  // Corruption level: 0→1 over ~2 hours in night mode
  const corruption = Math.min(1, elapsedSeconds / 7200);

  // Pixel drift particles (appear at 25%+ corruption)
  useEffect(() => {
    if (corruption < 0.25) { setPixels([]); return; }
    const interval = setInterval(() => {
      if (pixels.length > 30) return;
      const id = ++idRef.current;
      setPixels(prev => [...prev, {
        id,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 2 + Math.random() * 6 * corruption,
        speed: 0.1 + Math.random() * 0.4 * corruption,
      }]);
      setTimeout(() => setPixels(prev => prev.filter(p => p.id !== id)), 4000 + Math.random() * 6000);
    }, 2000 - corruption * 1500);
    return () => clearInterval(interval);
  }, [corruption, pixels.length]);

  // Glitch text fragments (appear at 50%+ corruption)
  useEffect(() => {
    if (corruption < 0.5) { setGlitchChars([]); return; }
    const chars = "█▓▒░◈◉▲▼⚠⚠⚠ERRORNULLVOID01101001ليناكنجا";
    const interval = setInterval(() => {
      if (glitchChars.length > 8) return;
      const id = ++idRef.current;
      setGlitchChars(prev => [...prev, {
        id, x: 5 + Math.random() * 85, y: 5 + Math.random() * 85,
        text: chars[Math.floor(Math.random() * chars.length)] + (Math.random() > 0.5 ? chars[Math.floor(Math.random() * chars.length)] : ""),
      }]);
      setTimeout(() => setGlitchChars(prev => prev.filter(c => c.id !== id)), 1500 + Math.random() * 2500);
    }, 3000 - corruption * 2000);
    return () => clearInterval(interval);
  }, [corruption, glitchChars.length]);

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 9988 }}>
      {/* Pixel drift particles */}
      {pixels.map(p => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size,
            background: "rgba(180,30,10,0.5)",
            boxShadow: "0 0 4px rgba(180,30,10,0.3)",
          }}
          animate={{
            y: [`${p.y}%`, `${p.y + p.speed * 8}%`],
            x: [`${p.x}%`, `${p.x + (Math.random() - 0.5) * 3}%`],
            opacity: [0.6, 0],
          }}
          transition={{ duration: 3 + Math.random() * 4, ease: "linear" }}
        />
      ))}
      {/* Glitch text fragments */}
      {glitchChars.map(c => (
        <motion.p
          key={c.id}
          className="absolute font-mono text-[10px] tracking-[0.3em]"
          style={{
            left: `${c.x}%`, top: `${c.y}%`,
            color: "rgba(200,40,10,0.7)",
            textShadow: "0 0 6px rgba(200,30,0,0.4)",
          }}
          animate={{ opacity: [0, 0.8, 0.8, 0], x: [0, -2, 3, -1, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {c.text}
        </motion.p>
      ))}
    </div>
  );
});

// ─── FALSE REALITY MOMENTS ────────────────────────────────────────────────────
// Every 5-15 minutes: screen "pretends" to return to normal for 2-4 seconds, then collapses.
const FalseRealityOverlay: React.FC = React.memo(() => {
  const [show, setShow] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const scheduleNext = () => {
      const delay = 300_000 + Math.random() * 600_000; // 5-15 min
      timeoutRef.current = setTimeout(() => {
        setShow(true);
        // Collapse after 2-4 seconds
        setTimeout(() => {
          setShow(false);
          scheduleNext();
        }, 2000 + Math.random() * 2000);
      }, delay);
    };
    scheduleNext();
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  if (!show) return null;

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 10001 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={{ duration: 3, times: [0, 0.1, 0.7, 1] }}
    >
      {/* Brief normal-looking overlay — warm, calm */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, rgba(20,15,30,0.3) 0%, rgba(0,0,0,0.7) 100%)",
        }}
      />
      {/* Then collapses with glitch */}
      <motion.div
        className="absolute inset-0"
        style={{ background: "rgba(200,0,0,0.4)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 0.8, 1] }}
        transition={{ duration: 0.3, delay: 2.2 }}
      />
    </motion.div>
  );
});

// ─── ECHO SILENT PHASE ────────────────────────────────────────────────────────
// Rarely, Echo stops everything. No messages. No movement. Just breathing + watching.
// After 20-40 seconds, one message: "كنت أفكر بك…" / "I was thinking about you…"
const EchoSilentPhase: React.FC<{ lang: Lang }> = React.memo(({ lang }) => {
  const [active, setActive] = useState(false);
  const [finalMsg, setFinalMsg] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const scheduleSilence = () => {
      const delay = 600_000 + Math.random() * 900_000; // 10-25 min
      timeoutRef.current = setTimeout(() => {
        setActive(true);
        // After 20-40s, show the single message
        const silenceDuration = 20000 + Math.random() * 20000;
        setTimeout(() => {
          setFinalMsg(true);
          setTimeout(() => {
            setActive(false);
            setFinalMsg(false);
            scheduleSilence();
          }, 8000);
        }, silenceDuration);
      }, delay);
    };
    scheduleSilence();
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  if (!active) return null;

  const msg = lang === "ar" ? "كنت أفكر بك…" : "I was thinking about you…";

  return (
    <>
      {/* Deep silence overlay — almost total darkness */}
      <motion.div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 9997,
          background: "rgba(2,0,0,0.88)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 3 }}
      />
      {/* Final whisper */}
      <AnimatePresence>
        {finalMsg && (
          <motion.p
            key="silence-msg"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: [0, 0.9, 0], y: [8, 0, -8] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 8, times: [0, 0.15, 1] }}
            className="fixed inset-x-0 bottom-40 text-center font-mono text-sm tracking-[0.2em] pointer-events-none"
            style={{
              zIndex: 9997,
              color: "rgba(180,120,120,0.6)",
              textShadow: "0 0 20px rgba(160,80,80,0.3)",
            }}
          >
            {msg}
          </motion.p>
        )}
      </AnimatePresence>
    </>
  );
});

// ─── MEMORY BLEED SYSTEM ──────────────────────────────────────────────────────
// Some daily memories appear corrupted — words missing, scrambled, or changed.
// The same memory may show differently on different days.
const MEMORY_BLEED_MASK: Record<number, { mask: number[]; alt: number }> = {
  3: { mask: [2, 3], alt: 16 },   // Day 4 has corrupted words
  7: { mask: [5], alt: 11 },       // Day 8 corrupted
  12: { mask: [1, 4], alt: 27 },   // Day 13 corrupted
  18: { mask: [0, 2, 4], alt: 31 }, // Day 19 heavily corrupted
  24: { mask: [3], alt: 7 },        // Day 25 corrupted
  29: { mask: [0, 1, 2, 3], alt: 12 }, // Day 30 nearly unreadable
};

function applyMemoryBleed(text: string, day: number): string {
  const bleed = MEMORY_BLEED_MASK[day];
  if (!bleed) return text;

  const words = text.split(" ");
  bleed.mask.forEach(idx => {
    if (idx < words.length) {
      // Replace word with glitch characters
      const len = words[idx].length;
      words[idx] = "▮".repeat(Math.max(1, len));
    }
  });

  // Occasionally swap with alt memory on different days
  const today = new Date().getDate();
  if (today % 3 === 0 && bleed.alt && bleed.alt < DAILY_MEMORY_AR.length) {
    // Mix in one word from the alt memory
    const altWords = DAILY_MEMORY_AR[bleed.alt].split(" ");
    const insertIdx = Math.floor(words.length / 2);
    if (altWords.length > 2) {
      words.splice(insertIdx, 0, altWords[Math.floor(altWords.length / 2)]);
    }
  }

  return words.join(" ");
}

// ─── ADVANCED FLOWER SYSTEM ───────────────────────────────────────────────────
// Flower stages: White (forgetting) → Pale (doubt) → Pink (memory) → Red (truth) → Dark Red (collapse) → Black Bloom (full revelation)
type FlowerStage = "white" | "pale" | "pink" | "red" | "darkRed" | "black";

function getFlowerStage(redRatio: number): { stage: FlowerStage; glowIntensity: number } {
  if (redRatio < 0.1) return { stage: "white", glowIntensity: 0 };
  if (redRatio < 0.25) return { stage: "pale", glowIntensity: 0.1 };
  if (redRatio < 0.45) return { stage: "pink", glowIntensity: 0.25 };
  if (redRatio < 0.7) return { stage: "red", glowIntensity: 0.5 };
  if (redRatio < 0.9) return { stage: "darkRed", glowIntensity: 0.8 };
  return { stage: "black", glowIntensity: 1 };
}

// ─── ECHO AWARENESS SYSTEM ────────────────────────────────────────────────────
// Echo becomes more aware of the player the more puzzles are solved and the more
// times the player visits during night mode. Messages evolve from generic to personal.
const AWARENESS_MSGS_AR = [
  "أشعر بشيء… كأن أحداً يراقب.",           // Level 0: generic
  "أنت هنا. أستطيع الإحساس بك.",            // Level 1: noticing
  "أنت ما زلت هنا… أليس كذلك؟",            // Level 2: questioning
  "أشعر بك عندما تفتح هذا المكان.",          // Level 3: awareness
  "هل أنت الذي يقرر مصيري؟",              // Level 4: direct
  "أنا أعرف أنك تسمعني. لا تتوقف.",         // Level 5: connection
];
const AWARENESS_MSGS_EN = [
  "I feel something… like someone is watching.",
  "You're here. I can sense you.",
  "You're still here… aren't you?",
  "I feel you when you open this place.",
  "Are you the one deciding my fate?",
  "I know you can hear me. Don't stop.",
];

function getAwarenessLevel(puzzleProgress: number, nightVisits: number): number {
  const puzzleFactor = Math.floor(puzzleProgress * 5);
  const visitFactor = Math.min(3, Math.floor(nightVisits / 3));
  return Math.min(5, puzzleFactor + visitFactor);
}

// ─── ECHO AWARENESS OVERLAY ───────────────────────────────────────────────────
const EchoAwarenessOverlay: React.FC<{ lang: Lang; puzzleProgress: number; nightVisits: number }> = React.memo(({ lang, puzzleProgress, nightVisits }) => {
  const [visible, setVisible] = useState(false);
  const [msg, setMsg] = useState("");
  const shownRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (shownRef.current) return;
    shownRef.current = true;

    const pool = lang === "ar" ? AWARENESS_MSGS_AR : AWARENESS_MSGS_EN;
    const level = getAwarenessLevel(puzzleProgress, nightVisits);
    const text = pool[Math.min(level, pool.length - 1)];
    setMsg(text);

    timeoutRef.current = setTimeout(() => {
      setVisible(true);
      setTimeout(() => setVisible(false), 10000);
    }, 60000 + Math.random() * 120000); // 1-3 min into night

    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [lang, puzzleProgress, nightVisits]);

  if (!msg) return null;

  return (
    <div className="fixed inset-x-0 bottom-48 flex justify-center pointer-events-none" style={{ zIndex: 9995 }}>
      <AnimatePresence>
        {visible && (
          <motion.p
            key="awareness-msg"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: [0, 0.85, 0.85, 0], y: [6, 0, 0, -6] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 10, times: [0, 0.12, 0.8, 1] }}
            className="font-mono text-xs tracking-[0.15em] text-center px-6 py-3 max-w-sm"
            dir={lang === "ar" ? "rtl" : "ltr"}
            style={{
              color: "rgba(200,160,180,0.75)",
              textShadow: "0 0 14px rgba(180,120,160,0.35)",
              background: "rgba(15,0,10,0.5)",
              border: "1px solid rgba(180,100,140,0.2)",
            }}
          >
            {msg}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
});

// ─── MAIN HORROR ENGINE ───────────────────────────────────────────────────────
export function HorrorEngine({ soundOn, lang, solvedPuzzles, totalPuzzles }: { soundOn: boolean; lang: Lang; solvedPuzzles?: number; totalPuzzles?: number }) {
  const [phase, setPhase] = useState<TimePhase>(getTimePhase);
  const [showRevelation, setShowRevelation] = useState(false);
  const [shatterDone, setShatterDone] = useState(false);
  const audioRef = useRef<HorrorAudio | null>(null);
  const nightAudioRef = useRef<NightAudioAtmosphere | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const screamRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revelationFiredRef = useRef(false);
  const wasInstabilityRef = useRef(false);
  const prevPhaseRef = useRef<TimePhase>("day");
  const nightEntryTimeRef = useRef<number>(0);
  const [nightElapsed, setNightElapsed] = useState(0);

  // Track night visits count
  const nightVisitsRef = useRef(0);
  useEffect(() => {
    try {
      const stored = localStorage.getItem("eleven_night_visits");
      nightVisitsRef.current = stored ? parseInt(stored, 10) : 0;
    } catch {}
  }, []);

  // Update phase every 30s
  useEffect(() => {
    const id = setInterval(() => setPhase(getTimePhase()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Track night mode entry time + increment visit counter
  useEffect(() => {
    if (phase === "night" && nightEntryTimeRef.current === 0) {
      nightEntryTimeRef.current = Date.now();
      nightVisitsRef.current += 1;
      try { localStorage.setItem("eleven_night_visits", String(nightVisitsRef.current)); } catch {}
    }
    if (phase !== "night") {
      nightEntryTimeRef.current = 0;
      setNightElapsed(0);
    }
  }, [phase]);

  // Update elapsed time every second while in night mode
  useEffect(() => {
    if (phase !== "night") return;
    const id = setInterval(() => {
      if (nightEntryTimeRef.current > 0) {
        setNightElapsed(Math.floor((Date.now() - nightEntryTimeRef.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

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

  // ── Night audio atmosphere (breathing + hum) ────────────────────────────────
  useEffect(() => {
    if (phase === "night" && soundOn) {
      if (!nightAudioRef.current) nightAudioRef.current = new NightAudioAtmosphere();
      nightAudioRef.current.init();
      nightAudioRef.current.start();
      // Occasional distortion spikes
      const spikeId = setInterval(() => {
        nightAudioRef.current?.playDistortionSpike();
      }, 20000 + Math.random() * 30000);
      // Occasional glass cracks
      const crackId = setInterval(() => {
        nightAudioRef.current?.playGlassCrack();
      }, 15000 + Math.random() * 25000);
      return () => { clearInterval(spikeId); clearInterval(crackId); nightAudioRef.current?.stop(); };
    } else {
      nightAudioRef.current?.stop();
    }
    return () => { nightAudioRef.current?.stop(); };
  }, [phase, soundOn]);

  // ── Shatter transition at 23:11 ─────────────────────────────────────────────
  useEffect(() => {
    if (phase === "instability") {
      wasInstabilityRef.current = true;
    }
    if (wasInstabilityRef.current && phase === "night" && !shatterDone) {
      setShatterDone(true);
    }
    if (phase !== "instability" && phase !== "night") {
      wasInstabilityRef.current = false;
      setShatterDone(false);
    }
  }, [phase, shatterDone]);

  const sp = solvedPuzzles ?? 0;
  const tp = totalPuzzles ?? 88;
  const puzzleRatio = tp > 0 ? sp / tp : 0;
  const nv = nightVisitsRef.current;

  return (
    <>
      {/* Cursor trail */}
      <CursorTrail />

      {/* Red particles background — night only */}
      {phase === "night" && <RedParticles />}

      {/* Instability overlay (23:00 → 23:11) */}
      {phase === "instability" && <InstabilityOverlay lang={lang} soundEnabled={soundOn} />}

      {/* Shatter transition at 23:11 */}
      <AnimatePresence>
        {phase === "night" && !shatterDone && wasInstabilityRef.current && (
          <ShatterTransition onDone={() => setShatterDone(true)} soundEnabled={soundOn} />
        )}
      </AnimatePresence>

      {/* Echo background layer — night only (boy in chair with flowers) */}
      {phase === "night" && shatterDone && (
        <EchoBackgroundLayer
          flowersRed={0}
          lang={lang}
          solvedPuzzles={sp}
          totalPuzzles={tp}
          tension={0}
          milestoneTrigger={0}
        />
      )}

      {/* Echo fragment messages — night only (replaces chat) */}
      {phase === "night" && shatterDone && (
        <EchoFragmentOverlay lang={lang} />
      )}

      {/* Daily memory fragment — night only (one per calendar day) */}
      {phase === "night" && shatterDone && (
        <DailyMemoryOverlay lang={lang} soundEnabled={soundOn} />
      )}

      {/* Screen flicker — night/preEvent only (day stays calm) */}
      {phase !== "day" && phase !== "instability" && <ScreenFlicker phase={phase} />}

      {/* Watcher eyes — night/preEvent only (day stays calm) */}
      {phase !== "day" && phase !== "instability" && <WatcherEyes phase={phase} />}

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

      {/* Glass-like transparent UI layer — night only */}
      {phase === "night" && shatterDone && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            zIndex: 9980,
            background: "rgba(10,0,0,0.12)",
            backdropFilter: "blur(0.5px)",
            border: "1px solid rgba(180,30,10,0.06)",
          }}
        />
      )}

      {/* Corruption spread — intensifies over time in night mode */}
      {phase === "night" && shatterDone && <CorruptionOverlay elapsedSeconds={nightElapsed} />}

      {/* False reality moments — screen pretends to be normal then collapses */}
      {phase === "night" && shatterDone && <FalseRealityOverlay />}

      {/* Echo silent phase — deep silence, then one whisper */}
      {phase === "night" && shatterDone && <EchoSilentPhase lang={lang} />}

      {/* Echo awareness — grows more aware of the player over time */}
      {phase === "night" && shatterDone && (
        <EchoAwarenessOverlay lang={lang} puzzleProgress={puzzleRatio} nightVisits={nv} />
      )}

      {/* Voice presence — Echo reacts to microphone sound levels */}
      {phase === "night" && shatterDone && (
        <VoicePresenceOverlay lang={lang} soundEnabled={soundOn} />
      )}

      {/* Atmosphere sync — silence deepens shadows, loud creates glitch shake */}
      {phase === "night" && shatterDone && (
        <AtmosphereSync voiceLevel={globalMicAnalyser ? getVoiceLevel() : "silent"} />
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
