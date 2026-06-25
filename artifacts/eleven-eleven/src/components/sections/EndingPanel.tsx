import React from 'react';
import { useGameStore, ExpandedEndingSystem } from '../../stores/gameStore';

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

export const EndingPanel: React.FC = () => {
  const { finalChoice, unlockedEndings, seenEndings, achievedEnding, solvedPuzzles, totalPuzzles, echo, flower, time, player, actions, achievements } = useGameStore();

  // Check if any ending from ExpandedEndingSystem is unlocked
  const expandedEndingsUnlocked = ExpandedEndingSystem.endings.filter(ending =>
    unlockedEndings.includes(ending.id)
  );

  return (
    <div className="dashboard-home">
      <div className="section-header-custom">
        <h1><span style={{color:'var(--accent)'}}>11.11</span> — النهايات</h1>
        <p className="subtitle">{expandedEndingsUnlocked.length}/5 مفتوحة · {Math.round((solvedPuzzles/totalPuzzles)*100)}% تقدم</p>
        {achievedEnding && (
          <p className="subtitle" style={{color: '#4CAF50', fontSize: '0.7rem', marginTop: '0.3rem'}}>
            النهاية المحققة: {ExpandedEndingSystem.endings.find(e => e.id === achievedEnding)?.name || achievedEnding}
          </p>
        )}
      </div>

      {finalChoice && (
        <div className="final-choice-display" style={{marginBottom: '1rem', padding: '0.5rem', background: 'rgba(200,120,90,0.1)', borderRadius: '4px'}}>
          <p style={{fontSize: '0.7rem', color: 'var(--accent)'}}>✅ اختيارك النهائي: {finalChoice}</p>
        </div>
      )}

      <div className="grid-2">
        {ExpandedEndingSystem.endings.map((ending) => {
          const isUnlocked = unlockedEndings.includes(ending.id);
          const isSeen = seenEndings.includes(ending.id);
          const isCurrent = achievedEnding === ending.id;

          // Calculate progress based on conditions
          let progress = 0;
          if (ending.id === 'echo_ending') {
            progress = Math.round((echo.trust > 70 ? 30 : 0) + (echo.memoryStability > 70 ? 30 : 0) + (solvedPuzzles >= 888 ? 40 : 0));
          } else if (ending.id === 'architect_ending') {
            progress = Math.round((echo.corruption > 60 ? 30 : 0) + (echo.memoryStability < 30 ? 30 : 0) + (solvedPuzzles >= 888 ? 40 : 0));
          } else if (ending.id === 'signal_ending') {
            progress = Math.round((echo.awareness > 70 ? 30 : 0) + (echo.hope > 60 ? 30 : 0) + (solvedPuzzles >= 888 ? 40 : 0));
          } else if (ending.id === 'true_memory_ending') {
            const totalAchievements = 129;
            const unlockedAchievements = achievements.filter(a => a.unlocked).length || 0;
            progress = Math.round((solvedPuzzles >= 1000 ? 30 : 0) + (unlockedAchievements / totalAchievements * 50) + (echo.memoryStability > 90 ? 20 : 0));
          } else if (ending.id === 'last_wish_ending') {
            progress = Math.round((solvedPuzzles >= 1000 ? 40 : 0) + (echo.trust > 80 ? 25 : 0) + (finalChoice === 'last_wish_ending' ? 35 : 0));
          }

          return (
            <div key={ending.id} className={`card ${isUnlocked?'completed':''} ${isCurrent?'current-ending':''}`}>
              <div className="card-header">
                <h3 className="card-title"><span>{getEndingIcon(ending.id)}</span> {ending.name}</h3>
                {isUnlocked && <span className="puzzle-status done">✅ مفتوحة</span>}
                {isCurrent && <span className="puzzle-status current">🏆 محققة</span>}
              </div>
              <div className="card-body">
                <p style={{fontSize:'0.6rem',color:'rgba(224,220,212,0.4)'}}>{ending.description}</p>
                <Bar label="تقدم" val={progress} c={progress > 50 ? '#4CAF50' : 'var(--accent)'} />
                <p style={{fontSize:'0.5rem',color:'rgba(224,220,212,0.25)',marginTop:'0.3rem'}}>المتطلبات: {ending.unlockCondition}</p>
                {isUnlocked && !isSeen && (
                  <button onClick={() => actions.replayEnding(ending.id)}
                    style={{marginTop: '0.5rem', padding: '0.3rem 0.6rem', fontSize: '0.6rem', background: 'rgba(200,120,90,0.2)', border: '1px solid rgba(200,120,90,0.4)', color: 'var(--accent)', borderRadius: '4px', cursor: 'pointer'}}>
                    🎬 مشاهدة النهاية
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center'}}>
        <button onClick={() => actions.resetGame()}
          style={{padding: '0.5rem 1rem', background: 'rgba(180,50,50,0.2)', border: '1px solid rgba(180,50,50,0.4)', color: '#FF6B6B', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem'}}>
          🔄 إعادة تعيين اللعبة
        </button>
      </div>
    </div>
  );
}

const Bar: React.FC<{label:string;val:number;c:string}> = ({label,val,c}) => (
  <div style={{marginBottom:'0.3rem'}}>
    <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.55rem',color:'rgba(224,220,212,0.45)'}}><span>{label}</span><span>{Math.round(val)}%</span></div>
    <div style={{height:'4px',background:'rgba(180,120,80,0.08)',borderRadius:'99px',overflow:'hidden'}}><div style={{height:'100%',width:`${Math.min(100,Math.max(0,val))}%`,background:c,borderRadius:'99px'}}/></div>
  </div>
);

export default EndingPanel;