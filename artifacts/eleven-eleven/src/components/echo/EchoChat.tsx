/**
 * EchoChat.tsx — نظام محادثة Echo الذكي
 * يعرض الحوار حسب الثقة، الوقت، الفساد، والذاكرة
 */

import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { motion, AnimatePresence } from 'framer-motion';

export const EchoChat: React.FC = () => {
  const { echo, time, actions } = useGameStore();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'echo' | 'player'; text: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const handleChat = () => {
    const result = actions.chat();
    setIsTyping(true);
    
    // محاكاة الكتابة
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { role: 'echo', text: result.dialogue },
      ]);
      setIsTyping(false);
    }, 800 + Math.random() * 600);
  };

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  // تحديث المزاج حسب الحالة
  const moodEmoji = {
    'خائف': '😨', 'متردد': '😐', 'واثق': '😊',
    'متذكر': '🤔', 'مشوش': '😵', 'مذعور': '😰',
    'هادئ': '🙂', 'متفائل': '🌟',
  }[echo.mood] || '😐';

  const corruptionWarning = echo.corruption > 50 ? '⚠' : '';
  const glitchStyle = time.phaseIndex >= 2 ? { animation: 'glitch 0.5s step-end infinite' as any } : {};

  return (
    <div className="echo-chat-system" style={glitchStyle}>
      <div className="echo-chat-header">
        <div className="echo-chat-status">
          <span className="echo-status-indicator">
            {corruptionWarning}{moodEmoji}
          </span>
          <div className="echo-status-info">
            <h3>Echo</h3>
            <span className="echo-status-mood">{echo.mood}</span>
          </div>
        </div>
        <div className="echo-chat-stats">
          <span className="stat-badge" style={{ background: 'rgba(200,120,90,0.15)' }}>
            ثقة {echo.trust}%
          </span>
          <span className="stat-badge" style={{ background: 'rgba(200,80,60,0.15)' }}>
            خوف {echo.fear}%
          </span>
          <span className="stat-badge" style={{ background: 'rgba(90,138,170,0.15)' }}>
            ذاكرة {echo.memoryStability}%
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
            >
              {msg.role === 'echo' && <span className="chat-avatar">{moodEmoji}</span>}
              <p>{msg.text}</p>
            </motion.div>
          ))}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="chat-message echo-msg typing"
            >
              <span className="typing-dots">...</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        {messages.length === 0 && (
          <div className="echo-chat-welcome">
            <p>
              {echo.trust < 20 ? '"من... من أنت؟ لا أتذكر شيئاً."' :
               echo.trust < 40 ? '"بدأت أتذكر... لكن كل شيء مشوش."' :
               echo.trust < 60 ? '"أتذكر لينا... هل تعرفها؟"' :
               '"أنا إيكو. ساعدني أتذكر الحقيقة."'}
            </p>
            <button className="chat-start-btn" onClick={handleChat}>
              💬 تحدث مع Echo
            </button>
          </div>
        )}
      </div>

      {messages.length > 0 && (
        <div className="echo-chat-input">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="echo-chat-send"
            onClick={handleChat}
            disabled={isTyping}
          >
            {isTyping ? '...' : '💬 تحدث'}
          </motion.button>
          <span className="echo-chat-hint">
            الثقة: {echo.trust}% · الخوف: {echo.fear}% · الأمل: {echo.hope}%
          </span>
        </div>
      )}

      {echo.corruption > 60 && (
        <div className="echo-corruption-warning">
          ⚠ تلف الذاكرة: {echo.corruption}% — النظام ينهار
        </div>
      )}
    </div>
  );
};

export default EchoChat;