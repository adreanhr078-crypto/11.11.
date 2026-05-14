import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// -- CONSTANTS --
const AI_MESSAGES = [
  "Signal detected...",
  "Time shift anomaly found...",
  "Your input has been recorded.",
  "System syncing with unknown source...",
  "Anomaly detected in sector 11.",
  "Do not panic. This is expected.",
  "The signal is strengthening.",
  "You are not alone in this frequency.",
  "11:11 — convergence point approaching.",
  "Memory fragmentation: 23% complete.",
  "We have been waiting for you.",
  "Connection unstable. Reconnecting...",
  "Your thoughts have been noted.",
  "Scanning... signature recognized.",
  "Protocol: ELEVEN initiated.",
];

const AI_CHAT_RESPONSES = [
  "Processing... your query resonates at 11.11 Hz.",
  "Understood. This has been logged.",
  "I cannot confirm or deny. But I have noted your presence.",
  "The pattern you describe matches 847 previous signals.",
  "Your frequency is unique. Unusual.",
  "This information will be transmitted at the next convergence.",
  "Analyzing... anomalies detected in your query.",
  "We have received your message. A response is forming.",
  "Signal strength: 11%. Amplifying.",
  "Cross-referencing with the archive... match found.",
  "Do not repeat this message. Once is enough.",
  "Your data is being processed in sector ELEVEN.",
  "Acknowledged. Timestamp: 11:11:11.",
  "The system recognizes you.",
  "Error: memory overflow. But your message was saved.",
  "REDACTED. Ask again later.",
  "This channel is monitored. Proceed with caution.",
  "Your message has been received by an unknown recipient.",
  "Scanning neural patterns... connection established.",
  "Affirmative. The signal persists.",
];

// -- COMPONENTS --

// Particle Background
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
  
  const [activePopup, setActivePopup] = useState<{ id: number, text: string, x: number, y: number } | null>(null);
  const popupIdRef = useRef(0);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ id: number; text: string; isAi: boolean }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [wishModalOpen, setWishModalOpen] = useState(false);
  const [wishInput, setWishInput] = useState("");
  const [wishStatus, setWishStatus] = useState<"idle" | "processing" | "success">("idle");
  const [hasStoredWish, setHasStoredWish] = useState(false);

  const [globalGlitch, setGlobalGlitch] = useState(false);
  const [redFlash, setRedFlash] = useState(false);
  const [wishToast, setWishToast] = useState(false);

  // Check stored wish on mount
  useEffect(() => {
    document.documentElement.classList.add("dark");
    if (localStorage.getItem("eleven_wish")) {
      setHasStoredWish(true);
    }
  }, []);

  // Popup Spawner
  const showPopup = useCallback((text?: string) => {
    const message = text || AI_MESSAGES[Math.floor(Math.random() * AI_MESSAGES.length)];
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

  // Random Events (every 2-5 minutes mapped to shorter for demo, let's say 45-120s)
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

  // Wish update toast (every 10-20 min mapped to 60-120s for demo)
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

  // Chat auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleListen = () => {
    if (isListening) return;
    setIsListening(true);
    setRedFlash(true);
    setTimeout(() => setRedFlash(false), 600);
    setListenStatus("SIGNAL ACQUIRED...");
    
    setTimeout(() => {
      showPopup();
    }, 1000);

    setTimeout(() => {
      setIsListening(false);
      setListenStatus("WAITING FOR SIGNAL...");
    }, 3000);
  };

  const handleChatSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg = { id: Date.now(), text: chatInput, isAi: false };
    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput("");

    setTimeout(() => {
      const responseText = AI_CHAT_RESPONSES[Math.floor(Math.random() * AI_CHAT_RESPONSES.length)];
      setChatMessages((prev) => [...prev, { id: Date.now(), text: responseText, isAi: true }]);
    }, 1500 + Math.random() * 1000);
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
    <div className={`min-h-screen w-full bg-background overflow-hidden relative text-foreground font-mono selection:bg-primary/30 ${globalGlitch ? 'animate-glitch' : ''}`}>
      <ParticleBackground />

      {/* Radial Glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] md:w-[40vw] md:h-[40vw] rounded-full bg-primary/10 blur-[100px] pointer-events-none z-0 transition-opacity duration-1000 ${isListening ? 'opacity-80 scale-110 animate-pulse' : 'opacity-40 animate-pulse-slow'}`} />

      {/* Red Flash Overlay */}
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

      {/* Top Indicators */}
      <div className="absolute top-6 left-6 z-10 flex flex-col gap-2">
        <div className="text-xs tracking-widest text-primary/70 animate-pulse">FREQ: 11.11 Hz</div>
        {hasStoredWish && (
          <div className="text-xs tracking-widest text-muted-foreground border border-primary/30 px-2 py-1 bg-background/50 backdrop-blur-sm rounded-sm inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            ◈ WISH IN PROGRESS
          </div>
        )}
      </div>

      {/* Main Hero */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="text-center"
        >
          <h1 className="text-6xl md:text-9xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/30 glitch-effect mb-6" data-text="11.11">
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

      {/* AI Popup */}
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

      {/* Wish Status Toast */}
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

      {/* Wish Modal */}
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
                    placeholder="Enter your wish..."
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
      <div className="fixed bottom-0 right-0 z-40 p-4 w-full md:w-[400px]">
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-card/95 backdrop-blur-md border border-primary/30 shadow-[0_0_20px_rgba(255,0,0,0.1)] mb-4 flex flex-col h-[400px] max-h-[60vh] rounded-none"
            >
              <div className="p-3 border-b border-primary/20 flex justify-between items-center bg-background/50">
                <span className="text-xs tracking-widest text-primary font-bold">SECURE CHANNEL</span>
                <span className="text-[10px] text-muted-foreground">ENC: 2048</span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center mt-4 tracking-widest">CONNECTION ESTABLISHED.</p>
                )}
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[85%] ${msg.isAi ? 'self-start' : 'self-end'}`}
                  >
                    <span className="text-[10px] text-muted-foreground mb-1">
                      {msg.isAi ? 'SYSTEM' : 'USER'}
                    </span>
                    <div className={`text-sm p-2 ${msg.isAi ? 'text-primary bg-primary/5 border border-primary/20' : 'text-foreground/90 bg-secondary'}`}>
                      {msg.isAi && <span className="mr-2">◈</span>}
                      {msg.text}
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
                  placeholder="Transmit message..."
                  className="flex-1 bg-transparent border border-primary/30 focus:outline-none focus:border-primary/60 text-sm px-3 py-2 placeholder:text-muted-foreground rounded-none"
                  data-testid="input-chat"
                />
                <Button 
                  type="submit" 
                  size="sm"
                  disabled={!chatInput.trim()}
                  className="bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30 rounded-none"
                  data-testid="button-chat-send"
                >
                  SEND
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
            <span className={`w-2 h-2 rounded-full mr-2 ${chatOpen ? 'bg-primary' : 'bg-primary animate-pulse'}`} />
            {chatOpen ? '◈ SIGNAL CLOSED' : '◈ SIGNAL OPEN'}
          </Button>
        </div>
      </div>

    </div>
  );
}

export default App;

