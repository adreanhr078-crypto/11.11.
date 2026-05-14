import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const AI_POPUP_MESSAGES = [
  "تم اكتشاف إشارة...",
  "شذوذ زمني رُصد...",
  "تم تسجيل مدخلاتك.",
  "النظام يتزامن مع مصدر مجهول...",
  "شذوذ في القطاع 11.",
  "لا تذعر. هذا متوقع.",
  "الإشارة تتقوى.",
  "أنت لست وحدك على هذا التردد.",
  "11:11 — نقطة التقاطع تقترب.",
  "تجزؤ الذاكرة: 23% مكتمل.",
  "كنّا ننتظرك.",
  "الاتصال غير مستقر. إعادة الاتصال...",
  "تم رصد أفكارك.",
  "جارٍ الفحص... تم التعرف على البصمة.",
  "البروتوكول: تم تفعيل ELEVEN.",
];

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

    if (!res.ok || !res.body) {
      onError("فشل الاتصال بالنظام.");
      return;
    }

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
        const data = line.slice(6).trim();
        if (!data) continue;
        try {
          const parsed = JSON.parse(data) as { content?: string; done?: boolean; error?: string };
          if (parsed.error) { onError(parsed.error); return; }
          if (parsed.done) { onDone(); return; }
          if (parsed.content) onChunk(parsed.content);
        } catch {
          // ignore malformed chunk
        }
      }
    }
    onDone();
  } catch {
    onError("انقطع الاتصال. أعد المحاولة.");
  }
}

const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: { x: number; y: number; size: number; speedX: number; speedY: number; opacity: number }[] = [];
    let animationFrameId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const numParticles = Math.floor((canvas.width * canvas.height) / 15000);
      for (let i = 0; i < numParticles; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.5 + 0.5,
          speedX: (Math.random() - 0.5) * 0.3,
          speedY: (Math.random() - 0.5) * 0.3,
          opacity: Math.random() * 0.5 + 0.1,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
      });
      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener("resize", resize);
    resize();
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-40" />;
};

function App() {
  const [isListening, setIsListening] = useState(false);
  const [listenStatus, setListenStatus] = useState("WAITING FOR SIGNAL...");

  const [activePopup, setActivePopup] = useState<{ id: number; text: string; x: number; y: number } | null>(null);
  const popupIdRef = useRef(0);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ id: number; text: string; isAi: boolean; streaming?: boolean }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatHistoryRef = useRef<{ role: "user" | "assistant"; content: string }[]>([]);

  const [wishModalOpen, setWishModalOpen] = useState(false);
  const [wishInput, setWishInput] = useState("");
  const [wishStatus, setWishStatus] = useState<"idle" | "processing" | "success">("idle");
  const [hasStoredWish, setHasStoredWish] = useState(false);

  const [globalGlitch, setGlobalGlitch] = useState(false);
  const [redFlash, setRedFlash] = useState(false);
  const [wishToast, setWishToast] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("dark");
    if (localStorage.getItem("eleven_wish")) {
      setHasStoredWish(true);
    }
  }, []);

  const showPopup = useCallback((text?: string) => {
    const message = text || AI_POPUP_MESSAGES[Math.floor(Math.random() * AI_POPUP_MESSAGES.length)];
    const margin = 100;
    const x = Math.max(margin, Math.random() * (window.innerWidth - 300 - margin));
    const y = Math.max(margin, Math.random() * (window.innerHeight - 150 - margin));
    popupIdRef.current += 1;
    const id = popupIdRef.current;
    setActivePopup({ id, text: message, x, y });
    setTimeout(() => {
      setActivePopup((prev) => (prev?.id === id ? null : prev));
    }, 5000 + Math.random() * 3000);
  }, []);

  useEffect(() => {
    const triggerEvent = () => {
      const rand = Math.random();
      if (rand < 0.33) {
        setGlobalGlitch(true);
        setTimeout(() => setGlobalGlitch(false), 1000);
      } else if (rand < 0.66) {
        setRedFlash(true);
        setTimeout(() => setRedFlash(false), 600);
      } else {
        showPopup();
      }
      const nextDelay = 45000 + Math.random() * 75000;
      setTimeout(triggerEvent, nextDelay);
    };
    const timer = setTimeout(triggerEvent, 30000 + Math.random() * 30000);
    return () => clearTimeout(timer);
  }, [showPopup]);

  useEffect(() => {
    if (!hasStoredWish) return;
    const triggerToast = () => {
      setWishToast(true);
      setTimeout(() => setWishToast(false), 4000);
      const nextDelay = 60000 + Math.random() * 60000;
      setTimeout(triggerToast, nextDelay);
    };
    const timer = setTimeout(triggerToast, 60000);
    return () => clearTimeout(timer);
  }, [hasStoredWish]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleListen = () => {
    if (isListening) return;
    setIsListening(true);
    setRedFlash(true);
    setTimeout(() => setRedFlash(false), 600);
    setListenStatus("SIGNAL ACQUIRED...");
    setTimeout(() => showPopup(), 1000);
    setTimeout(() => {
      setIsListening(false);
      setListenStatus("WAITING FOR SIGNAL...");
    }, 3000);
  };

  const handleChatSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isSending) return;

    const userText = chatInput.trim();
    setChatInput("");
    setIsSending(true);

    const userMsg = { id: Date.now(), text: userText, isAi: false };
    setChatMessages((prev) => [...prev, userMsg]);

    chatHistoryRef.current = [...chatHistoryRef.current, { role: "user", content: userText }];

    const aiMsgId = Date.now() + 1;
    setChatMessages((prev) => [...prev, { id: aiMsgId, text: "", isAi: true, streaming: true }]);

    let fullResponse = "";

    streamAiResponse(
      chatHistoryRef.current,
      (chunk) => {
        fullResponse += chunk;
        setChatMessages((prev) =>
          prev.map((m) => (m.id === aiMsgId ? { ...m, text: fullResponse } : m))
        );
      },
      () => {
        setChatMessages((prev) =>
          prev.map((m) => (m.id === aiMsgId ? { ...m, streaming: false } : m))
        );
        chatHistoryRef.current = [...chatHistoryRef.current, { role: "assistant", content: fullResponse }];
        setIsSending(false);
      },
      (errMsg) => {
        setChatMessages((prev) =>
          prev.map((m) => (m.id === aiMsgId ? { ...m, text: errMsg, streaming: false } : m))
        );
        setIsSending(false);
      }
    );
  };

  const handleWishSubmit = () => {
    if (!wishInput.trim()) return;
    setWishStatus("processing");
    setTimeout(() => {
      localStorage.setItem("eleven_wish", JSON.stringify({ text: wishInput, time: Date.now() }));
      setWishStatus("success");
      setHasStoredWish(true);
      setTimeout(() => {
        setWishModalOpen(false);
        setWishStatus("idle");
        setWishInput("");
      }, 2000);
    }, 3000);
  };

  return (
    <div className={`min-h-screen w-full bg-background overflow-hidden relative text-foreground font-mono selection:bg-primary/30 ${globalGlitch ? "animate-glitch" : ""}`}>
      <ParticleBackground />

      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] md:w-[40vw] md:h-[40vw] rounded-full bg-primary/10 blur-[100px] pointer-events-none z-0 transition-opacity duration-1000 ${isListening ? "opacity-80 scale-110 animate-pulse" : "opacity-40 animate-pulse-slow"}`} />

      <AnimatePresence>
        {redFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-primary z-50 pointer-events-none mix-blend-overlay"
          />
        )}
      </AnimatePresence>

      <div className="absolute top-6 left-6 z-10 flex flex-col gap-2">
        <div className="text-xs tracking-widest text-primary/70 animate-pulse">FREQ: 11.11 Hz</div>
        {hasStoredWish && (
          <div className="text-xs tracking-widest text-muted-foreground border border-primary/30 px-2 py-1 bg-background/50 backdrop-blur-sm rounded-sm inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            ◈ WISH IN PROGRESS
          </div>
        )}
      </div>

      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="text-center"
        >
          <h1
            className="text-6xl md:text-9xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/30 glitch-effect mb-6"
            data-text="11.11"
          >
            11.11
          </h1>

          <div className="h-6 mb-12 flex items-center justify-center">
            <p className="text-sm md:text-base tracking-[0.3em] text-primary/80 uppercase">
              {listenStatus}
              <span className="inline-block w-2 h-4 bg-primary/80 ml-2 animate-pulse" />
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
            <Button
              variant="outline"
              size="lg"
              onClick={handleListen}
              data-testid="button-listen"
              className="w-64 border-primary/40 text-primary hover:bg-primary/10 hover:text-primary tracking-widest uppercase transition-all duration-300 shadow-[0_0_15px_rgba(255,0,0,0.1)] hover:shadow-[0_0_25px_rgba(255,0,0,0.3)] bg-transparent rounded-none"
            >
              [ LISTEN ]
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => setWishModalOpen(true)}
              data-testid="button-send-wish"
              className="w-64 border-primary/40 text-foreground hover:bg-primary/10 hover:text-primary tracking-widest uppercase transition-all duration-300 shadow-[0_0_15px_rgba(255,0,0,0.1)] hover:shadow-[0_0_25px_rgba(255,0,0,0.3)] bg-transparent rounded-none"
            >
              [ SEND YOUR WISH ]
            </Button>
          </div>
        </motion.div>
      </main>

      <AnimatePresence>
        {activePopup && (
          <motion.div
            key={activePopup.id}
            initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
            transition={{ duration: 0.4 }}
            style={{ left: activePopup.x, top: activePopup.y }}
            className="fixed z-40 max-w-xs p-4 bg-card/80 backdrop-blur-md border border-primary/50 shadow-[0_0_20px_rgba(255,0,0,0.15)] rounded-none"
            data-testid="ai-popup"
          >
            <p className="text-sm text-primary font-bold tracking-wider mb-2">SYSTEM.MESSAGE</p>
            <p className="text-sm text-foreground/90">{activePopup.text}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {wishToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-background/90 backdrop-blur-md border border-primary/40 text-xs tracking-widest text-primary shadow-[0_0_15px_rgba(255,0,0,0.2)] flex items-center gap-3"
          >
            <span className="w-1 h-1 bg-primary rounded-full animate-pulse" />
            UPDATE: YOUR WISH IS STILL IN PROGRESS.
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {wishModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => wishStatus === "idle" && setWishModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-card/90 border border-primary/30 p-6 shadow-[0_0_30px_rgba(255,0,0,0.1)] rounded-none"
            >
              <h2 className="text-xl font-bold text-primary tracking-widest mb-4 uppercase">Submit to the void</h2>

              {wishStatus === "idle" && (
                <>
                  <Textarea
                    value={wishInput}
                    onChange={(e) => setWishInput(e.target.value)}
                    placeholder="اكتب أمنيتك... / Enter your wish..."
                    className="min-h-[150px] bg-background/50 border-primary/20 text-foreground resize-none focus-visible:ring-primary/50 font-mono text-sm rounded-none"
                    data-testid="input-wish"
                  />
                  <div className="flex justify-end mt-4 gap-3">
                    <Button
                      variant="ghost"
                      onClick={() => setWishModalOpen(false)}
                      className="text-muted-foreground hover:text-foreground rounded-none"
                    >
                      CANCEL
                    </Button>
                    <Button
                      onClick={handleWishSubmit}
                      disabled={!wishInput.trim()}
                      className="bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30 rounded-none tracking-widest"
                      data-testid="button-transmit-wish"
                    >
                      TRANSMIT
                    </Button>
                  </div>
                </>
              )}

              {wishStatus === "processing" && (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <p className="text-primary tracking-widest animate-pulse mb-6">YOUR WISH IS PROCESSING...</p>
                  <div className="w-full h-1 bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 3, ease: "linear" }}
                      className="h-full bg-primary"
                    />
                  </div>
                </div>
              )}

              {wishStatus === "success" && (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <p className="text-foreground tracking-widest">WISH TRANSMITTED.</p>
                  <p className="text-muted-foreground text-sm mt-2">AWAITING RESPONSE FROM UNKNOWN SOURCE.</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <div className="fixed bottom-0 right-0 z-40 p-4 w-full md:w-[420px]">
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-card/95 backdrop-blur-md border border-primary/30 shadow-[0_0_20px_rgba(255,0,0,0.1)] mb-4 flex flex-col h-[420px] max-h-[65vh] rounded-none"
            >
              <div className="p-3 border-b border-primary/20 flex justify-between items-center bg-background/50">
                <span className="text-xs tracking-widest text-primary font-bold">SECURE CHANNEL — AI LIVE</span>
                <span className="text-[10px] text-muted-foreground">MULTILINGUAL · ENC: 2048</span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center mt-4 tracking-widest leading-relaxed">
                    الاتصال مفتوح.<br />
                    <span className="opacity-60">تحدث بأي لغة — النظام يستجيب.</span>
                  </p>
                )}
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.isAi ? "items-start" : "items-end"}`}
                  >
                    <span className="text-[10px] text-muted-foreground mb-1">
                      {msg.isAi ? "SYSTEM 11.11" : "USER"}
                    </span>
                    <div
                      className={`text-sm p-2 max-w-[88%] break-words leading-relaxed ${
                        msg.isAi
                          ? "text-primary bg-primary/5 border border-primary/20"
                          : "text-foreground/90 bg-secondary text-right"
                      }`}
                      dir={msg.isAi ? "auto" : "auto"}
                    >
                      {msg.isAi && <span className="mr-2 opacity-70">◈</span>}
                      {msg.text}
                      {msg.streaming && (
                        <span className="inline-block w-1.5 h-3.5 bg-primary/80 ml-1 animate-pulse align-middle" />
                      )}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleChatSend} className="p-3 border-t border-primary/20 bg-background/50 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="اكتب رسالتك... / Type your message..."
                  className="flex-1 bg-transparent border border-primary/30 focus:outline-none focus:border-primary/60 text-sm px-3 py-2 placeholder:text-muted-foreground rounded-none"
                  disabled={isSending}
                  data-testid="input-chat"
                  dir="auto"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!chatInput.trim() || isSending}
                  className="bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30 rounded-none"
                  data-testid="button-chat-send"
                >
                  {isSending ? "..." : "SEND"}
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => setChatOpen(!chatOpen)}
            className="border-primary/40 text-primary hover:bg-primary/10 hover:text-primary tracking-widest text-xs h-8 bg-background/80 backdrop-blur-md rounded-none shadow-[0_0_10px_rgba(255,0,0,0.1)]"
            data-testid="button-toggle-chat"
          >
            <span className={`w-2 h-2 rounded-full mr-2 ${chatOpen ? "bg-primary" : "bg-primary animate-pulse"}`} />
            {chatOpen ? "◈ SIGNAL CLOSED" : "◈ SIGNAL OPEN"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default App;
