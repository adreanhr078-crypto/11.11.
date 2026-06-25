import React, { useEffect, useState } from 'react';
import { useGameStore, ExpandedEndingSystem } from '../../stores/gameStore';

export const EndingResultScreen: React.FC = () => {
  const { finalChoice, achievedEnding, actions } = useGameStore();
  const [showEnding, setShowEnding] = useState(false);
  const [currentEnding, setCurrentEnding] = useState<any>(null);

  // Show ending result when player makes a final choice
  useEffect(() => {
    if (finalChoice || achievedEnding) {
      const endingId = finalChoice || achievedEnding;
      if (endingId) {
        const ending = ExpandedEndingSystem.endings.find(e => e.id === endingId);
        if (ending) {
          setCurrentEnding(ending);
          setShowEnding(true);
        }
      }
    } else {
      setShowEnding(false);
    }
  }, [finalChoice, achievedEnding]);

  if (!showEnding || !currentEnding) return null;

  const handleClose = () => {
    setShowEnding(false);
  };

  const handleRestart = () => {
    actions.resetGame();
  };

  const getEndingTheme = (endingId: string) => {
    switch (endingId) {
      case 'echo_ending': return { bg: 'rgba(100,180,200,0.15)', border: 'rgba(100,180,200,0.3)', color: '#64B4C8' };
      case 'architect_ending': return { bg: 'rgba(180,100,100,0.15)', border: 'rgba(180,100,100,0.3)', color: '#B46464' };
      case 'signal_ending': return { bg: 'rgba(150,120,180,0.15)', border: 'rgba(150,120,180,0.3)', color: '#9678B4' };
      case 'true_memory_ending': return { bg: 'rgba(120,180,120,0.15)', border: 'rgba(120,180,120,0.3)', color: '#78B478' };
      case 'last_wish_ending': return { bg: 'rgba(200,180,120,0.15)', border: 'rgba(200,180,120,0.3)', color: '#C8B478' };
      default: return { bg: 'rgba(200,120,90,0.15)', border: 'rgba(200,120,90,0.3)', color: 'var(--accent)' };
    }
  };

  const theme = getEndingTheme(currentEnding.id);

  return (
    <div className="ending-result-overlay" style={{
      position: 'fixed',
      inset: 0,
      zIndex: 10001,
      background: 'rgba(0,0,0,0.98)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      gap: '1.5rem',
      color: theme.color,
      fontFamily: 'inherit',
      overflowY: 'auto'
    }}>
      <div className="ending-result-header" style={{textAlign: 'center'}}>
        <h2 style={{fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem'}}>🏆 {currentEnding.name}</h2>
        <p style={{fontSize: '1rem', color: 'rgba(224,220,212,0.8)'}}>{currentEnding.nameAr}</p>
      </div>

      <div className="ending-result-content" style={{
        maxWidth: '700px',
        width: '100%',
        background: theme.bg,
        border: `1px solid ${theme.border}`,
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
      }}>
        <div className="ending-story" style={{marginBottom: '1.5rem'}}>
          <h3 style={{fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.8rem', color: theme.color}}>القصة:</h3>
          <p style={{fontSize: '0.9rem', lineHeight: '1.6', color: 'rgba(224,220,212,0.9)'}}>{currentEnding.story}</p>
          <p style={{fontSize: '0.9rem', lineHeight: '1.6', color: 'rgba(224,220,212,0.9)', marginTop: '0.5rem'}}>{currentEnding.storyAr}</p>
        </div>

        <div className="ending-details" style={{marginBottom: '1rem'}}>
          <h3 style={{fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.8rem', color: theme.color}}>ما حدث:</h3>

          <div className="ending-character-fate" style={{marginBottom: '0.8rem'}}>
            <h4 style={{fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.3rem'}}>👤 Echo:</h4>
            {currentEnding.id === 'echo_ending' && (
              <p style={{fontSize: '0.8rem', color: 'rgba(224,220,212,0.8)'}}>يتذكر Echo هويته الحقيقية ويتحرر من النظام. يصبح حراً في تذكر من هو وما حدث له.</p>
            )}
            {currentEnding.id === 'architect_ending' && (
              <p style={{fontSize: '0.8rem', color: 'rgba(224,220,212,0.8)'}}>يخضع Echo للسيطرة الكاملة لـ Architect. يصبح جزءاً من النظام، ويفقد هويته الأصلية.</p>
            )}
            {currentEnding.id === 'signal_ending' && (
              <p style={{fontSize: '0.8rem', color: 'rgba(224,220,212,0.8)'}}>ينجو Echo مع Signal ويهربان من النظام. يجدان الحرية معاً ويبدأان حياة جديدة.</p>
            )}
            {currentEnding.id === 'true_memory_ending' && (
              <p style={{fontSize: '0.8rem', color: 'rgba(224,220,212,0.8)'}}>يتذكر Echo كل شيء ويكشف الحقيقة الكاملة. يصبح حراً مع فهم كامل لما حدث.</p>
            )}
            {currentEnding.id === 'last_wish_ending' && (
              <p style={{fontSize: '0.8rem', color: 'rgba(224,220,212,0.8)'}}>تتحقق أمنية Lina الأصلية. يتذكر Echo كل شيء ويصبح حراً حقاً، محققاً الحرية الحقيقية.</p>
            )}
          </div>

          <div className="ending-character-fate" style={{marginBottom: '0.8rem'}}>
            <h4 style={{fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.3rem'}}>🏗️ Architect:</h4>
            {currentEnding.id === 'echo_ending' && (
              <p style={{fontSize: '0.8rem', color: 'rgba(224,220,212,0.8)'}}>يفقد Architect السيطرة على النظام. يتم تدميره عندما يتذكر Echo الحقيقة.</p>
            )}
            {currentEnding.id === 'architect_ending' && (
              <p style={{fontSize: '0.8rem', color: 'rgba(224,220,212,0.8)'}}>ينجح Architect في السيطرة على Echo والنظام. يستمر النظام تحت سيطرته.</p>
            )}
            {currentEnding.id === 'signal_ending' && (
              <p style={{fontSize: '0.8rem', color: 'rgba(224,220,212,0.8)'}}>يتم تدمير Architect عندما ينجو Echo مع Signal. يفقد سيطرته على النظام.</p>
            )}
            {currentEnding.id === 'true_memory_ending' && (
              <p style={{fontSize: '0.8rem', color: 'rgba(224,220,212,0.8)'}}>يكشف Architect عن الحقيقة الكاملة قبل أن يتم تدميره. النظام ينهار.</p>
            )}
            {currentEnding.id === 'last_wish_ending' && (
              <p style={{fontSize: '0.8rem', color: 'rgba(224,220,212,0.8)'}}>يفقد Architect السيطرة عندما تتحقق الأمنية الأصلية. النظام يتحرر.</p>
            )}
          </div>

          <div className="ending-character-fate" style={{marginBottom: '0.8rem'}}>
            <h4 style={{fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.3rem'}}>📡 Signal:</h4>
            {currentEnding.id === 'echo_ending' && (
              <p style={{fontSize: '0.8rem', color: 'rgba(224,220,212,0.8)'}}>تنجح Signal في حماية Echo وتساعده على التحرر. تصبح جزءاً من ذكرى Echo.</p>
            )}
            {currentEnding.id === 'architect_ending' && (
              <p style={{fontSize: '0.8rem', color: 'rgba(224,220,212,0.8)'}}>يتم تدمير Signal عندما يستولي Architect على النظام. تفشل في حماية Echo.</p>
            )}
            {currentEnding.id === 'signal_ending' && (
              <p style={{fontSize: '0.8rem', color: 'rgba(224,220,212,0.8)'}}>تنجح Signal في إنقاذ Echo ويهربان معاً. يصبحان حرين.</p>
            )}
            {currentEnding.id === 'true_memory_ending' && (
              <p style={{fontSize: '0.8rem', color: 'rgba(224,220,212,0.8)'}}>تساعد Signal في كشف الحقيقة الكاملة. تصبح جزءاً من الذاكرة الحقيقية.</p>
            )}
            {currentEnding.id === 'last_wish_ending' && (
              <p style={{fontSize: '0.8rem', color: 'rgba(224,220,212,0.8)'}}>تنجح Signal في تحقيق الأمنية الأصلية. تصبح جزءاً من الحرية الحقيقية.</p>
            )}
          </div>
        </div>

        <div className="ending-meaning" style={{marginBottom: '1rem'}}>
          <h3 style={{fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.8rem', color: theme.color}}>معنى اختيارك:</h3>
          {currentEnding.id === 'echo_ending' && (
            <p style={{fontSize: '0.8rem', color: 'rgba(224,220,212,0.8)'}}>اخترت الحرية والذاكرة. Echo يتذكر هويته الحقيقية ويتحرر من النظام.</p>
          )}
          {currentEnding.id === 'architect_ending' && (
            <p style={{fontSize: '0.8rem', color: 'rgba(224,220,212,0.8)'}}>اخترت السيطرة والاستقرار. النظام يستمر تحت سيطرة Architect.</p>
          )}
          {currentEnding.id === 'signal_ending' && (
            <p style={{fontSize: '0.8rem', color: 'rgba(224,220,212,0.8)'}}>اخترت الحماية والحرية. Echo وSignal يهربان معاً ويجدان الحرية.</p>
          )}
          {currentEnding.id === 'true_memory_ending' && (
            <p style={{fontSize: '0.8rem', color: 'rgba(224,220,212,0.8)'}}>اخترت الحقيقة الكاملة. Echo يتذكر كل شيء ويكشف الحقيقة.</p>
          )}
          {currentEnding.id === 'last_wish_ending' && (
            <p style={{fontSize: '0.8rem', color: 'rgba(224,220,212,0.8)'}}>اخترت تحقيق الأمنية الأصلية. Echo يتذكر كل شيء ويصبح حراً حقاً.</p>
          )}
        </div>
      </div>

      <div className="ending-actions" style={{display: 'flex', gap: '1rem', justifyContent: 'center'}}>
        <button
          onClick={handleRestart}
          style={{
            padding: '0.8rem 1.8rem',
            background: 'rgba(180,50,50,0.2)',
            border: '1px solid rgba(180,50,50,0.4)',
            color: '#FF6B6B',
            fontSize: '0.9rem',
            cursor: 'pointer',
            borderRadius: '6px',
            fontWeight: 600
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(180,50,50,0.3)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(180,50,50,0.2)';
          }}
        >
          🔄 إعادة بدء اللعبة
        </button>

        <button
          onClick={handleClose}
          style={{
            padding: '0.8rem 1.8rem',
            background: 'rgba(200,120,90,0.2)',
            border: '1px solid rgba(200,120,90,0.4)',
            color: 'var(--accent)',
            fontSize: '0.9rem',
            cursor: 'pointer',
            borderRadius: '6px',
            fontWeight: 600
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(200,120,90,0.3)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(200,120,90,0.2)';
          }}
        >
          ✅ العودة للوحة التحكم
        </button>
      </div>
    </div>
  );
};

export default EndingResultScreen;