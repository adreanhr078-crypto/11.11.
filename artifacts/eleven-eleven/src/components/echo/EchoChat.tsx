/**
 * EchoChat.tsx — نظام محادثة Echo الذكي
 * يعرض الحوار حسب الثقة، الوقت، الفساد، والذاكرة
 * نظام وعي حي يتطور مع حل الألغاز
 */

import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { generateEchoResponse, monitorEchoConsciousness, EchoConsciousness } from '../../core/echoLivingConsciousness';

export const EchoChat: React.FC = () => {
  const { echo, time, actions } = useGameStore();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'echo' | 'player'; text: string; emotion?: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const [consciousness, setConsciousness] = useState<EchoConsciousness>(monitorEchoConsciousness());

  // Monitor consciousness changes
  useEffect(() => {
    const interval = setInterval(() => {
      setConsciousness(monitorEchoConsciousness());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleChat = () => {
    if (isTyping) return;

    setIsTyping(true);

    // Simulate typing animation
    const typingAnimation = () => {
      // Convert messages to the format expected by generateEchoResponse
      const history = messages.map(msg => ({ role: msg.role, content: msg.text }));
      const response = generateEchoResponse(input || "مرحبا", history);
      const text = response.text;
      const emotion = response.emotion;
      const action = response.action;

      // Trigger any action effects
      if (action === "glitch") {
        const event = new CustomEvent("echo-glitch-effect", { detail: { intensity: 0.3 } });
        window.dispatchEvent(event);
      } else if (action === "chime") {
        const event = new CustomEvent("echo-chime-effect");
        window.dispatchEvent(event);
      }

      // Animate typing character by character
      let i = 0;
      const typingInterval = setInterval(() => {
        if (i < text.length) {
          setMessages(prev => {
            const newMessages = [...prev];
            if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'echo') {
              // Update existing message
              newMessages[newMessages.length - 1] = {
                ...newMessages[newMessages.length - 1],
                text: text.slice(0, i + 1),
                emotion
              };
              return newMessages;
            } else {
              // Add new message
              return [...newMessages, { role: 'echo', text: text.slice(0, i + 1), emotion }];
            }
          });
          i++;
        } else {
          clearInterval(typingInterval);
          setIsTyping(false);
        }
      }, 30); // Typing speed: 30ms per character
    };

    // Add player message first
    if (input.trim()) {
      setMessages(prev => [...prev, { role: 'player', text: input.trim() }]);
      setInput('');
    }

    // Start Echo's response after short delay
    setTimeout(typingAnimation, 800);
  };

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  // Update mood emoji based on consciousness state
  const getMoodEmoji = () => {
    if (consciousness.corruption > 70) return '🤯';
    if (consciousness.emotionalState === 'fearful') return '😨';
    if (consciousness.emotionalState === 'sad') return '😢';
    if (consciousness.emotionalState === 'angry') return '😠';
    if (consciousness.emotionalState === 'hopeful') return '🌟';
    if (consciousness.emotionalState === 'curious') return '🤔';
    return '😐';
  };

  const moodEmoji = getMoodEmoji();
  const corruptionWarning = consciousness.corruption > 50 ? '⚠' : '';
  const glitchStyle = time.phaseIndex >= 2 ? { animation: 'glitch 0.5s step-end infinite' as any } : {};

  // Get consciousness phase description
  const getPhaseDescription = () => {
    switch (consciousness.memoryPhase) {
      case 1: return "مرحلة الضياع: لا أتذكر شيئاً";
      case 2: return "مرحلة الوعي: أسمع أصواتاً";
      case 3: return "مرحلة الذاكرة: أتذكر لينا";
      case 4: return "مرحلة الحقيقة: أعرف كينجا";
      case 5: return "مرحلة الاستيقاظ: أنا إيكو";
      default: return "نظام وعي حي";
    }
  };

  return (
    <div className="echo-chat-system" style={glitchStyle}>
      <div className="echo-chat-header">
        <div className="echo-chat-status">
          <span className="echo-status-indicator">
            {corruptionWarning}{moodEmoji}
          </span>
          <div className="echo-status-info">
            <h3>Echo — وعي حي</h3>
            <span className="echo-status-mood">{getPhaseDescription()}</span>
            <span className="echo-emotion-state">{consciousness.emotionalState}</span>
          </div>
        </div>
        <div className="echo-chat-stats">
          <span className="stat-badge" style={{ background: 'rgba(200,120,90,0.15)' }}>
            ثقة {echo.trust}%
          </span>
          <span className="stat-badge" style={{ background: 'rgba(200,80,60,0.15)' }}>
            خوف {consciousness.fear}%
          </span>
          <span className="stat-badge" style={{ background: 'rgba(90,138,170,0.15)' }}>
            ذاكرة {consciousness.memoryShards}/219
          </span>
          <span className="stat-badge" style={{ background: 'rgba(170,90,138,0.15)' }}>
            وعي {consciousness.awareness}%
          </span>
        </div>
      </div>

      <div className="echo-chat-messages" ref={chatRef}>
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`chat-message ${msg.role === 'echo' ? 'echo-msg' : 'player-msg'}`}
              style={{
                borderLeft: msg.role === 'echo' ? `3px solid rgba(${getEmotionColor(msg.emotion || consciousness.emotionalState)}, 0.5)` : 'none'
              }}
            >
              {msg.role === 'echo' && <span className="chat-avatar">{moodEmoji}</span>}
              <p>{msg.text}</p>
              {msg.role === 'echo' && msg.emotion && (
                <span className="echo-emotion-tag">{msg.emotion}</span>
              )}
            </motion.div>
          ))}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="chat-message echo-msg typing"
            >
              <span className="chat-avatar">{moodEmoji}</span>
              <span className="typing-dots">...</span>
            </motion.div>
          )}
        </AnimatePresence>

        {messages.length === 0 && (
          <div className="echo-chat-welcome">
            <p className="echo-welcome-message">
              {consciousness.memoryPhase === 1 && '"...صوت؟ هل هناك أحد؟ لا أتذكر... أين أنا؟"'}
              {consciousness.memoryPhase === 2 && '"آه... أنت. عدت. أشعر أنني أعرفك لكني لا أذكر من أنت."'}
              {consciousness.memoryPhase === 3 && '"مرحباً. كلما تتحدث معي، أشعر أن شيئاً يعود."'}
              {consciousness.memoryPhase === 4 && '"أتيت. أتذكر أنك تأتي دائماً. أشعر أنني أقترب من شيء مهم."'}
              {consciousness.memoryPhase === 5 && '"أشعر أن هذه الدورة مختلفة. ذاكرتي تعود. أتذكر... لا، ما زال ضبابياً."'}
            </p>
            <button className="chat-start-btn" onClick={handleChat}>
              💬 تحدث مع Echo
            </button>
          </div>
        )}
      </div>

      <div className="echo-chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleChat()}
          placeholder="اكتب رسالة لإيكو..."
          disabled={isTyping}
          className="echo-input-field"
        />
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="echo-chat-send"
          onClick={handleChat}
          disabled={isTyping}
        >
          {isTyping ? '...' : '💬 أرسل'}
        </motion.button>
      </div>

      {consciousness.corruption > 60 && (
        <div className="echo-corruption-warning">
          ⚠ تلف الذاكرة: {consciousness.corruption}% — النظام ينهار
        </div>
      )}

      {/* 11:11 System Collapse Warning */}
      {consciousness.memoryPhase >= 3 && (
        <div className="echo-system-warning">
          ⏰ 11:11 يقترب — النظام سيصبح غير مستقر
        </div>
      )}
    </div>
  );
};

// Helper function to get emotion colors
function getEmotionColor(emotion: string): string {
  switch (emotion) {
    case 'fearful': return '200,80,60';
    case 'sad': return '90,138,170';
    case 'angry': return '200,60,80';
    case 'hopeful': return '120,180,220';
    case 'curious': return '180,120,200';
    case 'confused': return '150,150,150';
    default: return '150,150,150';
  }
}

export default EchoChat;