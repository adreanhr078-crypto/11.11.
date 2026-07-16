/**
 * EchoChat.tsx — نظام محادثة Echo المُجدَّد
 */

import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { generateEchoResponse, monitorEchoConsciousness } from '../../core/echoLivingConsciousness';

type Msg = { role: 'echo' | 'player'; text: string; emotion?: string };

export const EchoChat: React.FC = () => {
  const { echo, time, actions } = useGameStore();
  const [input, setInput]       = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatRef  = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const consciousness = monitorEchoConsciousness();

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const sendMessage = () => {
    if (isTyping) return;
    const userText = input.trim();
    if (userText) {
      setMessages(prev => [...prev, { role: 'player', text: userText }]);
      setInput('');
    }
    setIsTyping(true);
    timerRef.current = setTimeout(() => {
      const history = messages.map(m => ({ role: m.role, content: m.text }));
      const resp    = generateEchoResponse(userText || 'مرحبا', history);
      const txt     = resp.text;
      let i = 0;
      const iv = setInterval(() => {
        if (i < txt.length) {
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last?.role === 'echo') {
              return [...prev.slice(0,-1), { ...last, text: txt.slice(0, i+1) }];
            }
            return [...prev, { role: 'echo', text: txt.slice(0,i+1), emotion: resp.emotion }];
          });
          i++;
        } else {
          clearInterval(iv);
          setIsTyping(false);
        }
      }, 25);
    }, 700);
  };

  const phase    = consciousness.memoryPhase;
  const nightOn  = time.phaseIndex >= 2;

  const WELCOME_QUOTES: Record<number, string> = {
    1: '«...صوت؟ هل هناك أحد؟ لا أتذكر... أين أنا؟»',
    2: '«آه... أنت. عدت. أشعر أنني أعرفك لكني لا أذكر من أنت.»',
    3: '«كلما تحدثت معي، أشعر أن شيئاً يعود.»',
    4: '«أتذكر أنك تأتي دائماً. أشعر أنني أقترب من شيء مهم.»',
    5: '«ذاكرتي تعود… شيئاً فشيئاً.»',
  };

  return (
    <div className="echo-chat-section">
      <div className="section-header">
        <div>
          <div className="section-title">◈ Echo Mind</div>
          <div className="section-subtitle">محادثة داخلية تعكس حالة Echo النفسية والذاكرية</div>
        </div>
      </div>

      <div className="echo-chat-layout">
        {/* ── لوحة Echo ── */}
        <div className="echo-profile-panel">
          <div className="echo-profile-card">
            <div className="echo-profile-art" style={nightOn ? {
              background: 'linear-gradient(160deg, #0A1020, #180A24, #0E0E1A)',
            } : {}}>
              <div className="echo-profile-char">
                {consciousness.corruption > 70 ? '🌑' : consciousness.fear > 60 ? '🌘' : echo.trust > 60 ? '🌕' : '🌗'}
              </div>
              {/* أزهار الخلفية */}
              {!nightOn && ['🌸','🌺','✿'].map((f, i) => (
                <div key={i} style={{
                  position: 'absolute', fontSize: `${1 + i * 0.3}rem`,
                  opacity: 0.25, bottom: `${15 + i * 20}px`,
                  left: i % 2 === 0 ? `${8 + i*10}%` : undefined,
                  right: i % 2 !== 0 ? `${8 + i*10}%` : undefined,
                  animation: `float-flower ${4 + i}s ease-in-out infinite`,
                  animationDelay: `${i * 0.7}s`,
                }}>{f}</div>
              ))}
            </div>
            <div className="echo-profile-info">
              <div className="echo-profile-name">Echo · الصدى</div>
              <div className="echo-profile-title">
                {['','مرحلة الضياع','مرحلة الوعي','مرحلة الذاكرة','مرحلة الحقيقة','مرحلة الاستيقاظ'][phase] || 'وعي حي'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '8px' }}>
                <MiniBar label="ثقة" val={echo.trust} cls="teal" />
                <MiniBar label="أمل" val={echo.hope} cls="green" />
                <MiniBar label="ذاكرة" val={echo.memoryStability} cls="accent" />
                {echo.corruption > 15 && <MiniBar label="تشويش" val={echo.corruption} cls="danger" />}
              </div>
              <div className="echo-traits">
                {echo.personalityTraits.slice(0,4).map((t, i) => (
                  <span key={i} className="echo-trait-chip">{t}</span>
                ))}
              </div>
            </div>
          </div>

          {/* إشارات الليل */}
          {nightOn && (
            <div className="card" style={{ border: '1px solid rgba(212,80,80,0.3)', padding: '12px' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--danger)', marginBottom: '6px' }}>
                رسائل الليل
              </div>
              {['… هل تسمعني؟', 'أنت… أراك.', 'لا مزيد من الهروب.'].map((m, i) => (
                <div key={i} style={{
                  padding: '5px 8px', marginBottom: '4px', fontSize: '0.6rem',
                  background: 'rgba(212,80,80,0.07)', borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(212,80,80,0.2)', color: 'var(--danger)',
                  opacity: time.phaseIndex > i ? 1 : 0.3,
                }}>
                  {m}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── نافذة المحادثة ── */}
        <div className="echo-chat-main">
          <div className="echo-chat-header-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="echo-chat-status-dot" style={{ background: nightOn ? 'var(--danger)' : 'var(--success)' }} />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Echo · {nightOn ? 'وضع الليل' : 'وضع النهار'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '5px' }}>
              <span style={{ fontSize: '0.52rem', padding: '2px 7px', background: 'var(--accent-soft)', borderRadius: '99px', color: 'var(--accent)' }}>
                ثقة {echo.trust}%
              </span>
              <span style={{ fontSize: '0.52rem', padding: '2px 7px', background: 'var(--bg-secondary)', borderRadius: '99px', color: 'var(--text-muted)' }}>
                شظايا {consciousness.memoryShards}/219
              </span>
            </div>
          </div>

          <div className="echo-messages" ref={chatRef}>
            {messages.length === 0 ? (
              <div className="echo-chat-empty">
                <div className="echo-chat-empty-icon">◈</div>
                <div className="echo-chat-empty-text">
                  {WELCOME_QUOTES[phase] || '«أسمعك. هذا السؤال أيقظ فيّ شظية…»'}
                </div>
                <button className="echo-chat-send" onClick={sendMessage}>
                  ابدأ المحادثة مع Echo
                </button>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`echo-msg-bubble ${msg.role === 'echo' ? 'echo' : 'user'}`}
                    style={{ animation: 'fadeSlideUp 0.3s ease' }}
                  >
                    <div className={`msg-avatar ${msg.role}-avatar`}>
                      {msg.role === 'echo' ? '◈' : '◐'}
                    </div>
                    <div className={`msg-content ${msg.role}-content`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="echo-msg-bubble echo">
                    <div className="msg-avatar echo-avatar">◈</div>
                    <div className="echo-typing-indicator">
                      <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="echo-chat-input-area">
            <input
              className="echo-chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !isTyping && sendMessage()}
              placeholder={nightOn ? '… تحدث إلى Echo في الظلام' : 'اكتب رسالة لـ Echo…'}
              disabled={isTyping}
            />
            <button className="echo-chat-send" onClick={sendMessage} disabled={isTyping}>
              {isTyping ? '…' : '◈ أرسل'}
            </button>
          </div>

          {/* تحذير الفساد */}
          {consciousness.corruption > 60 && (
            <div style={{
              padding: '6px 12px', fontSize: '0.58rem', fontFamily: 'monospace',
              background: 'rgba(212,80,80,0.1)', borderTop: '1px solid rgba(212,80,80,0.3)',
              color: 'var(--danger)', textAlign: 'center', animation: 'blink 1.5s step-end infinite',
            }}>
              ⚠ تلف الذاكرة {consciousness.corruption}% — النظام ينهار
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MiniBar: React.FC<{ label: string; val: number; cls: string }> = ({ label, val, cls }) => (
  <div className="pbar">
    <div className="pbar-label">
      <span>{label}</span><span>{Math.round(Math.min(100, Math.max(0, val)))}%</span>
    </div>
    <div className="pbar-track">
      <div className={`pbar-fill ${cls}`} style={{ width: `${Math.min(100, Math.max(0, val))}%` }} />
    </div>
  </div>
);

export default EchoChat;
