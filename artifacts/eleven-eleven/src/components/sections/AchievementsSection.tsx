import React from 'react';
import { useGameStore } from '../../stores/gameStore';

export const AchievementsSection: React.FC = () => {
  const { achievements, solvedPuzzles, totalPuzzles, endings } = useGameStore();
  return (
    <div className="dashboard-home">
      <div className="section-header-custom"><h1><span style={{color:'var(--accent)'}}>11.11</span> — الإنجازات</h1><p className="subtitle">{achievements.filter(a=>a.unlocked).length}/{achievements.length} مفتوحة</p></div>
      <div className="card">
        <div className="card-header"><h3 className="card-title"><span>🏆</span> لوحة الإنجازات</h3></div>
        <div className="card-body">
          <div className="achievement-grid">
            {achievements.map(a => (
              <div key={a.id} className={`achievement-badge ${!a.unlocked?'locked':''}`} title={a.desc}>
                <span className="badge-icon">{a.unlocked?a.icon:'🔒'}</span>
                <span className="badge-name">{a.unlocked?a.name:'???'}</span>
                <span className="badge-desc">{a.unlocked?a.desc:'مقفول'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid-2">
        <div className="card"><div className="card-header"><h3 className="card-title"><span>📖</span> النهايات</h3></div><div className="card-body">
          {Object.entries(endings).map(([id, e]: any) => (
            <div key={id} className="ending-card" style={{marginBottom:'0.5rem'}}>
              <h4>{id==='sorrow'?'💧 حزينة':id==='truth'?'🔦 حقيقة':id==='dark'?'🌑 مظلمة':'🔮 محيرة'}</h4>
              <p>تقدم: {e.progress}% {e.unlocked?'✅ مفتوحة':''}</p>
            </div>
          ))}
        </div></div>
        <div className="card"><div className="card-header"><h3 className="card-title"><span>📊</span> الإحصائيات</h3></div><div className="card-body">
          <Bar label="ألغاز" val={(solvedPuzzles/totalPuzzles)*100} c="#c8785a" />
          <Bar label="إنجازات" val={(achievements.filter(a=>a.unlocked).length/achievements.length)*100} c="#FF9800" />
        </div></div>
      </div>
    </div>
  );
};
const Bar: React.FC<{label:string;val:number;c:string}> = ({label,val,c}) => (
  <div style={{marginBottom:'0.3rem'}}>
    <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.55rem',color:'rgba(224,220,212,0.45)'}}><span>{label}</span><span>{Math.round(val)}%</span></div>
    <div style={{height:'4px',background:'rgba(180,120,80,0.08)',borderRadius:'99px',overflow:'hidden'}}><div style={{height:'100%',width:`${Math.min(100,Math.max(0,val))}%`,background:c,borderRadius:'99px'}}/></div>
  </div>
);
export default AchievementsSection;