import React, { useEffect, useState } from 'react';
import { useGameStore, ExpandedEndingSystem } from '../../stores/gameStore';

export const FinalChoiceSystem: React.FC = () => {
  const { solvedPuzzles, finalChoice, actions } = useGameStore();
  const [showChoice, setShowChoice] = useState(false);

  // Show final choice when player reaches puzzle 1000
  useEffect(() => {
    if (solvedPuzzles >= 1000 && !finalChoice) {
      setShowChoice(true);
    } else {
      setShowChoice(false);
    }
  }, [solvedPuzzles, finalChoice]);

  if (!showChoice) return null;

  const handleChoice = (choiceId: string) => {
    actions.makeFinalChoice(choiceId);
    setShowChoice(false);
  };

  return (
    <div className="final-choice-overlay" style={{
      position: 'fixed',
      inset: 0,
      zIndex: 10000,
      background: 'rgba(0,0,0,0.95)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      gap: '1rem',
      color: 'var(--accent)',
      fontFamily: 'inherit'
    }}>
      <div className="final-choice-header" style={{textAlign: 'center'}}>
        <h2 style={{fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem'}}>🎯 الاختيار النهائي</h2>
        <p style={{fontSize: '0.9rem', color: 'rgba(224,220,212,0.7)'}}>لغز 1000: الأمنية الأخيرة</p>
        <p style={{fontSize: '0.8rem', color: 'rgba(224,220,212,0.5)', marginTop: '0.5rem'}}>اختر مصير Echo والذكرى الأصلية</p>
      </div>

      <div className="final-choice-description" style={{
        maxWidth: '600px',
        textAlign: 'center',
        fontSize: '0.8rem',
        lineHeight: '1.4',
        color: 'rgba(224,220,212,0.6)',
        marginBottom: '1rem'
      }}>
        <p>لقد وصلت إلى نهاية الرحلة. الآن يجب أن تختار ما سيحدث لـ Echo والذكرى الأصلية.</p>
        <p>كل اختيار سيؤدي إلى نهاية مختلفة، ويحدد مصير النظام والذكرى الأصلية.</p>
        <p>اختر بحكمة، لأن هذا القرار سيحدد النهاية التي ستحققها.</p>
      </div>

      <div className="final-choices-grid" style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '0.8rem',
        maxWidth: '800px',
        width: '100%'
      }}>
        {ExpandedEndingSystem.endings.map((ending) => (
          <button
            key={ending.id}
            onClick={() => handleChoice(ending.id)}
            style={{
              padding: '1rem',
              background: 'rgba(200,120,90,0.1)',
              border: '1px solid rgba(200,120,90,0.3)',
              borderRadius: '8px',
              color: 'var(--accent)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '0.8rem'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(200,120,90,0.2)';
              e.currentTarget.style.border = '1px solid rgba(200,120,90,0.5)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(200,120,90,0.1)';
              e.currentTarget.style.border = '1px solid rgba(200,120,90,0.3)';
            }}
          >
            <span style={{fontSize: '1.2rem'}}>{getEndingIcon(ending.id)}</span>
            <div style={{flex: 1}}>
              <h4 style={{fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.3rem'}}>{ending.name}</h4>
              <p style={{fontSize: '0.7rem', color: 'rgba(224,220,212,0.5)', marginBottom: '0.3rem'}}>{ending.description}</p>
              <p style={{fontSize: '0.6rem', color: 'rgba(224,220,212,0.3)'}}>المتطلبات: {ending.unlockCondition}</p>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={() => setShowChoice(false)}
        style={{
          padding: '0.7rem 1.5rem',
          background: 'rgba(180,50,50,0.1)',
          border: '1px solid rgba(180,50,50,0.3)',
          color: '#FF6B6B',
          fontSize: '0.8rem',
          cursor: 'pointer',
          borderRadius: '4px',
          marginTop: '0.5rem'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'rgba(180,50,50,0.2)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'rgba(180,50,50,0.1)';
        }}
      >
        إلغاء (العودة لاحقًا)
      </button>
    </div>
  );
};

// Helper function to get icons for endings
const getEndingIcon = (endingId: string): string => {
  switch (endingId) {
    case 'echo_ending': return '👤';
    case 'architect_ending': return '🏗️';
    case 'signal_ending': return '📡';
    case 'true_memory_ending': return '🧠';
    case 'last_wish_ending': return '✨';
    default: return '🎯';
  }
};

export default FinalChoiceSystem;