/**
 * EchoChat.tsx — نظام محادثة Echo الذكي
 * يعرض الحوار حسب الثقة، الوقت، الفساد، والذاكرة
 * نظام وعي حي يتطور مع حل الألغاز
 */

import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { generateLocalResponse, getPeriodicInsert } from '../../localAiChat';
import { monitorEchoConsciousness, EchoConsciousness } from '../../core/echoLivingConsciousness';

const getMemoryPhase = (solvedCount: number): number => {
  if (solvedCount <= 0) return 1;
  if (solvedCount <= 10) return 2;
  if (solvedCount <= 20) return 3;
  if (solvedCount <= 30) return 4;
  return 5;
};

export const EchoChat: React.FC = () => {
  const { echo, time, solvedPuzzles } = useGameStore();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'echo' | 'player'; text: string; emotion?: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const [consciousness, setConsciousness] = useState<EchoConsciousness>(monitorEchoConsciousness());
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const memoryPhase = getMemoryPhase(solvedPuzzles);

  // Monitor consciousness changes based on real game state
  useEffect(() => {
    const updated = monitorEchoConsciousness();
    setConsciousness(updated);
  }, [solvedPuzzles, echo.corruption, echo.fear, echo.awareness]);

  // Periodic inserts from Echo
  useEffect(() => {
    const interval = setInterval(() => {
      const insert = getPeriodicInsert();
      if (insert && insert.text) {
        setMessages(prev => [...prev, { role: 'echo', text: insert.text, emotion: insert.action || 'aware' }]);
      }
    }, 120000);

    return () => clearInterval(interval);
  }, []);

  const handleChat = () => {
    if (isTyping) return;

    setIsTyping(true);

    // Simulate typing animation
    const typingAnimation = () => {
      const history = messages.map(msg => ({ role: msg.role, content: msg.text }));
      const response = generateLocalResponse(input || "مرحبا", history);
      const text = response.text;
      // في وضع الليل: لا glitch، فقط chime للذكريات الدافئة أو aware
      const emotion = response.action === 'chime' ? 'hopeful' : time.isNight ? 'fearful' : 'aware';
      const action = response.action;

      // Trigger any action effects (no glitch in night mode)
      if (action === 'chime') {
        const event = new CustomEvent('echo-chime-effect');
        window.dispatchEvent(event);
      } else if (time.isNight) {
        // إيكو خائف في الليل - نرسل حدث خوف بدلاً من glitch
        const event = new CustomEvent('echo-night-fear');
        window.dispatchEvent(event);
      }

      // Animate typing character by character
      let i = 0;
      const typingInterval = setInterval(() => {
        if (i < text.length) {
          setMessages(prev => {
            const newMessages = [...prev];
            if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'echo') {
              newMessages[newMessages.length - 1] = {
                ...newMessages[newMessages.length - 1],
                text: text.slice(0, i + 1),
                emotion
              };
              return newMessages;
            } else {
              return [...newMessages, { role: 'echo', text: text.slice(0, i + 1), emotion }];
            }
          });
          i++;
        } else {
          clearInterval(typingInterval);
          setIsTyping(false);
        }
      }, 30);
    };

    // Add player message first
    if (input.trim()) {
      setMessages(prev => [...prev, { role: 'player', text: input.trim() }]);
      setInput('');
    }

    // Start Echo's response after short delay
    typingTimeoutRef.current = setTimeout(typingAnimation, 800);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

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

  // Get consciousness phase description
  const getPhaseDescription = () => {
    if (time.isNight) {
      return "🌙 الليل: خائف ومتوتر... لكني أتذكر";
    }
    switch (memoryPhase) {
      case 1: return "مرحلة الضياع: لا أتذكر شيئاً";
      case 2: return "مرحلة الوعي: أسمع أصواتاً";
      case 3: return "مرحلة الذاكرة: أتذكر لينا";
      case 4: return "مرحلة الحقيقة: أعرف كينجا";
      case 5: return "مرحلة الاستيقاظ: أنا إيكو";
      default: return "نظام وعي حي";
    }
  };

  return (
    <div className="echo-chat-system">
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
            ذاكرة {solvedPuzzles}/1000
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
              {memoryPhase === 1 && '"...صوت؟ هل هناك أحد؟ لا أتذكر... أين أنا؟"'}
              {memoryPhase === 2 && '"آه... أنت. عدت. أشعر أنني أعرفك لكني لا أذكر من أنت."'}
              {memoryPhase === 3 && '"مرحباً. كلما تتحدث معي، أشعر أن شيئاً يعود."'}
              {memoryPhase === 4 && '"أتيت. أتذكر أنك تأتي دائماً. أشعر أنني أقترب من شيء مهم."'}
              {memoryPhase === 5 && '"أشعر أن هذه الدورة مختلفة. ذاكرتي تعود. أتذكر... لا، ما زال ضبابياً."'}
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

      {time.isNight && (
        <div className="echo-night-mood" style={{
          padding: '0.3rem 0.6rem',
          background: 'rgba(100,50,150,0.1)',
          borderTop: '1px solid rgba(100,50,150,0.2)',
          fontSize: '0.6rem',
          color: 'rgba(200,180,255,0.6)',
          textAlign: 'center'
        }}>
          🌙 إيكو خائف... الظلام يثير ذكرياته
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
