/**
 * EchoMindChat — واجهة المحادثة النفسية مع Echo
 * تستند إلى الصور 10, 14
 * وسط: شات تفاعلي مع streaming
 * يمين: شظايا الذاكرة + تلميحات الألغاز
 * يسار: حالة Echo (ثقة، مشاعر، عدم استقرار)
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { GlassCard } from "../shared/GlassCard";
import { EchoResponseStream, type EchoStreamMessage, type EchoChatState } from "../../services/echoResponseStream";

interface ChatMessage {
  id: string;
  text: string;
  isEcho: boolean;
  emotion?: "calm" | "disturbed" | "glitching";
  timestamp: number;
}

const INITIAL_ECHO_MESSAGE: ChatMessage = {
  id: "init",
  text: "...أشعر أن هناك من يتحدث معي. هل أنت حقيقي؟ أم أنا أتخيلك أيضاً؟",
  isEcho: true,
  emotion: "disturbed",
  timestamp: Date.now(),
};

export const EchoMindChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_ECHO_MESSAGE]);
  const [input, setInput] = useState("");
  const [echoState, setEchoState] = useState<EchoChatState | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isGlitching, setIsGlitching] = useState(false);

  const streamRef = useRef<EchoResponseStream | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize stream
  useEffect(() => {
    const stream = new EchoResponseStream();
    streamRef.current = stream;
    setEchoState(stream.getState());
  }, []);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Periodic messages
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!streamRef.current || isTyping) return;
      const periodic = await streamRef.current.checkPeriodicMessage();
      if (periodic) {
        const newMsg: ChatMessage = {
          id: `echo-${Date.now()}`,
          text: periodic.text,
          isEcho: true,
          emotion: periodic.emotion,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, newMsg]);
      }
    }, 120000); // Every 2 minutes

    return () => clearInterval(interval);
  }, [isTyping]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || !streamRef.current) return;

    setInput("");
    setIsTyping(true);

    // Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      text,
      isEcho: false,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);

    // Simulate typing delay
    await new Promise(r => setTimeout(r, 400 + Math.random() * 600));

    // Get response
    const response = await streamRef.current.sendMessage(text);
    setEchoState(streamRef.current.getState());

    // Handle glitch effect
    if (response.emotion === "glitching") {
      setIsGlitching(true);
      setTimeout(() => setIsGlitching(false), 500);
    }

    // Add echo message
    const echoMsg: ChatMessage = {
      id: `echo-${Date.now()}`,
      text: response.text,
      isEcho: true,
      emotion: response.emotion,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, echoMsg]);
    setIsTyping(false);

    // Focus input
    inputRef.current?.focus();
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getEmotionStyle = (emotion?: string) => {
    switch (emotion) {
      case "glitching": return "echo-glitch";
      case "disturbed": return "echo-disturbed";
      default: return "echo-calm";
    }
  };

  return (
    <div className="echo-mind-chat" dir="rtl">
      {/* طبقة glitch عابرة */}
      {isGlitching && <div className="echo-glitch-overlay" />}

      {/* ─── العمود الأيمن: حالة Echo ─── */}
      <div className="echo-col-left">
        <GlassCard title="حالة Echo">
          <div className="echo-status-card">
            {/* صورة Echo مصغرة */}
            <div className="echo-status-avatar">
              <svg width="48" height="48" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="20" fill="rgba(139,42,42,0.15)" />
                <circle cx="24" cy="22" r="12" fill="#1A0A0A" />
                <path d="M 12 22 Q 12 10 24 8 Q 36 10 36 22" fill="#0A0A0A" />
                <circle cx="20" cy="20" r="1.5" fill="#8B4040" />
                <circle cx="28" cy="20" r="1.5" fill="#8B4040" />
                <path d="M 20 26 Q 24 29 28 26" fill="none" stroke="#6A5050" strokeWidth="0.8" />
              </svg>
            </div>
            
            {/* مؤشرات Echo */}
            <div className="echo-status-metrics">
              <div className="echo-metric">
                <span className="metric-name">الثقة</span>
                <div className="metric-track">
                  <div className="metric-fill" style={{ width: `${echoState?.trustLevel || 35}%`, background: "#6AAA8B" }} />
                </div>
                <span className="metric-value">{echoState?.trustLevel || 35}%</span>
              </div>
              <div className="echo-metric">
                <span className="metric-name">الخوف</span>
                <div className="metric-track">
                  <div className="metric-fill" style={{ width: `${echoState?.fearLevel || 62}%`, background: "#CC4444" }} />
                </div>
                <span className="metric-value">{echoState?.fearLevel || 62}%</span>
              </div>
              <div className="echo-metric">
                <span className="metric-name">الشخصية</span>
                <span className="metric-personality">{echoState?.personality || "lost"}</span>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* ─── العمود الأوسط: الشات ─── */}
      <div className="echo-col-center">
        <GlassCard glow className="echo-chat-container">
          {/* Header الشات */}
          <div className="echo-chat-header">
            <div className="echo-chat-title">
              <h3>إيكو مايند</h3>
              <span className="echo-chat-subtitle">تذكّر، فهم، تطور</span>
            </div>
            <div className="echo-chat-status">
              <span className="status-dot" />
              <span className="status-text">متصل</span>
            </div>
          </div>

          {/* رسائل الشات */}
          <div className="echo-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`echo-message ${msg.isEcho ? "echo-msg" : "user-msg"} ${getEmotionStyle(msg.emotion)}`}>
                {msg.isEcho && (
                  <span className="echo-msg-icon">◈</span>
                )}
                <div className="echo-msg-content">
                  <p>{msg.text}</p>
                  <span className="echo-msg-time">
                    {new Date(msg.timestamp).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            ))}

            {/* مؤشر الكتابة */}
            {isTyping && (
              <div className="echo-typing">
                <div className="typing-dots">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
                <span className="typing-text">إيكو يكتب...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="echo-input-area">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب رسالتك..."
              className="echo-input"
              disabled={isTyping}
              dir="auto"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="echo-send-btn"
            >
              إرسال
            </button>
          </div>
        </GlassCard>
      </div>

      {/* ─── العمود الأيمن: الذكريات ─── */}
      <div className="echo-col-right">
        <GlassCard title="شظايا الذاكرة">
          <div className="echo-memory-fragments">
            {echoState?.memoryFragments && echoState.memoryFragments.length > 0 ? (
              echoState.memoryFragments.map((fragment, i) => (
                <div key={i} className="memory-fragment" style={{ animationDelay: `${i * 0.1}s` }}>
                  <span className="fragment-bullet">💠</span>
                  <span className="fragment-text">{fragment}</span>
                </div>
              ))
            ) : (
              <div className="memory-empty">
                <p>لا توجد شظايا ذاكرة بعد...</p>
                <p className="memory-hint">تحدث مع Echo لاسترجاع الذكريات</p>
              </div>
            )}
          </div>
        </GlassCard>

        <GlassCard title="تلميحات">
          <div className="echo-hints">
            <p className="hint-text">اسأل Echo عن:</p>
            <ul className="hint-list">
              <li>من أنت؟</li>
              <li>أين أنا؟</li>
              <li>كينجا</li>
              <li>لينا</li>
              <li>ساعدني في اللغز</li>
            </ul>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};