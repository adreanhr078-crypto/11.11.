/**
 * CinematicMode.tsx — الوضع السينمائي الكامل عند 11:11
 * تأثيرات الانهيار البصري + تحول الواجهة
 */

import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';

interface Props { onEnd: () => void; }

export const CinematicMode: React.FC<Props> = ({ onEnd }) => {
  const { echo, solvedPuzzles } = useGameStore();
  const [phase, setPhase] = useState<'flash' | 'collapse' | 'transform' | 'reveal'>('flash');

  useEffect(() => {
    setPhase('flash');
    const t1 = setTimeout(() => setPhase('collapse'), 1500);
    const t2 = setTimeout(() => setPhase('transform'), 3500);
    const t3 = setTimeout(() => setPhase('reveal'), 5500);
    const t4 = setTimeout(() => onEnd(), 8000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onEnd]);

  return (
    <div className="cinematic-overlay" style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: '2rem',
      background: phase === 'flash' ? 'rgba(255,255,255,0.8)' :
                 phase === 'collapse' ? '#000' :
                 phase === 'transform' ? 'linear-gradient(135deg, #000, #1a0000, #000)' :
                 'rgba(0,0,0,0.95)',
      transition: 'all 1.5s ease',
      animation: phase === 'collapse' ? 'glitch 0.3s step-end infinite' : 'none',
    }}>
      {phase === 'flash' && <p style={{color:'#000',fontSize:'1rem',fontFamily:'monospace',letterSpacing:'0.5em'}}>⚠ SYSTEM COLLAPSE</p>}
      {phase === 'collapse' && (
        <>
          <p style={{color:'#cc4444',fontSize:'1.5rem',fontWeight:700,fontFamily:'monospace',animation:'blink 0.3s step-end infinite'}}>11:11</p>
          <p style={{color:'rgba(200,60,60,0.6)',fontSize:'0.7rem',fontFamily:'monospace'}}>MEMORY CORRUPTION · SIGNAL LOST · SYSTEM FAILURE</p>
        </>
      )}
      {phase === 'transform' && (
        <p style={{color:'#c8785a',fontSize:'0.85rem',fontFamily:'monospace',textAlign:'center',maxWidth:'400px',lineHeight:1.8,animation:'fadeIn 1s ease'}}>
          "عندما يتوقف كل شيء...<br/>عندما يختفي الصوت الأخير...<br/>عندما تصل إلى 11:11...<br/>عندها فقط، تبدأ الحقيقة."
        </p>
      )}
      {phase === 'reveal' && (
        <div style={{textAlign:'center',animation:'fadeIn 2s ease'}}>
          <p style={{color:'var(--accent)',fontSize:'1.2rem',fontWeight:700}}>التحول اكتمل</p>
          <p style={{color:'rgba(224,220,212,0.4)',fontSize:'0.65rem',fontFamily:'monospace',marginTop:'0.5rem'}}>
            {solvedPuzzles} ألغاز · {echo.trust}% ثقة · {echo.memoryStability}% ذاكرة
          </p>
        </div>
      )}
      <div style={{
        width: '200px', height: '2px',
        background: phase === 'flash' ? '#000' :
                    phase === 'collapse' ? 'linear-gradient(90deg, transparent, #cc4444, transparent)' :
                    'linear-gradient(90deg, transparent, var(--accent), transparent)',
        transition: 'all 0.5s ease',
      }} />
    </div>
  );
};

export const NightAlert: React.FC<{ phaseIndex: number; phase: string }> = ({ phaseIndex, phase }) => {
  if (phaseIndex < 1) return null;
  return (
    <div className="night-alert-bar" style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      padding: '0.4rem', textAlign: 'center', fontFamily: 'monospace', fontSize: '0.6rem',
      background: phaseIndex >= 3 ? 'rgba(200,30,30,0.9)' : phaseIndex >= 2 ? 'rgba(200,80,30,0.8)' : 'rgba(200,120,50,0.7)',
      color: '#fff', letterSpacing: '0.15em',
      animation: phaseIndex >= 3 ? 'blink 0.5s step-end infinite' : 'none',
    }}>
      ⚠ {phase} — {phaseIndex === 1 ? 'عدم استقرار' : phaseIndex === 2 ? 'تشويش متزايد' : 'تحول سينمائي'}
    </div>
  );
};

export default CinematicMode;