import React from 'react';
import { useGameStore } from '../../stores/gameStore';

export const DaySection: React.FC = () => {
  const { echo, time, memory } = useGameStore();
  return (
    <div className="dashboard-home">
      <div className="section-header-custom"><h1><span style={{color:'var(--accent)'}}>11.11</span> — النظام الصباحي</h1><p className="subtitle">{time.isNight ? '🌙 ليلي' : '☀️ صباحي'} · ثقة {echo.trust}%</p></div>
      <div className="grid-2">
        <div className="card"><div className="card-header"><h3 className="card-title"><span>🧠</span> Echo Mind</h3></div><div className="card-body"><p style={{fontSize:'0.65rem',color:'rgba(224,220,212,0.4)'}}>{echo.mood} · {echo.personalityTraits.join('، ')}</p><Bar label="ذاكرة" val={echo.memoryStability} c="#5A8AAA" /><Bar label="أمل" val={echo.hope} c="#4CAF50" /></div></div>
        <div className="card"><div className="card-header"><h3 className="card-title"><span>💠</span> الذكريات</h3></div><div className="card-body"><p style={{fontSize:'0.6rem',color:'rgba(224,220,212,0.35)'}}>{memory.fragmentsCollected}/{memory.totalFragments} شظية</p><Bar label="استرجاع" val={(memory.fragmentsCollected/memory.totalFragments)*100} c="#5A8AAA" /></div></div>
      </div>
    </div>
  );
};
const Bar: React.FC<{label:string;val:number;c:string}> = ({label,val,c}) => (
  <div style={{marginBottom:'0.3rem'}}>
    <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.55rem',color:'rgba(224,220,212,0.45)'}}><span>{label}</span><span>{Math.round(val)}%</span></div>
    <div style={{height:'4px',background:'rgba(180,120,80,0.08)',borderRadius:'99px',overflow:'hidden'}}><div style={{height:'100%',width:`${Math.min(100,Math.max(0,val))}%`,background:c,borderRadius:'99px',transition:'width 0.5s ease'}}/></div>
  </div>
);
export default DaySection;