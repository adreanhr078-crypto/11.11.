/**
 * DashboardHome.tsx — الصفحة الرئيسية الكاملة (C01-C11)
 */

import React from 'react';
import { useGameStore } from '../../stores/gameStore';

export const DashboardHome: React.FC = () => {
  const { echo, solvedPuzzles, totalPuzzles, flower, memory, world, time, entities, achievements } = useGameStore();
  const flowerIcon = ['🌱','🌿','🌷','🌸','🌺'][['seed','sprout','bloom','flourish','completed'].indexOf(flower.stage)] || '🌱';
  const pct = Math.round((solvedPuzzles / totalPuzzles) * 100);

  return (
    <div className="dashboard-home">
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><h3 className="card-title"><span>🧠</span> Echo</h3></div>
          <div className="card-body">
            <div className="echo-mood-big">{echo.mood}</div>
            <Bar label="ثقة" val={echo.trust} c="#c8785a" />
            <Bar label="خوف" val={echo.fear} c="#cc6644" />
            <Bar label="ذاكرة" val={echo.memoryStability} c="#5A8AAA" />
            <Bar label="فساد" val={echo.corruption} c={echo.corruption > 50 ? '#f44336' : '#AA8B40'} />
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title"><span>🧩</span> الألغاز</h3></div>
          <div className="card-body">
            <div className="big-number">{solvedPuzzles}</div>
            <Bar label={`من ${totalPuzzles}`} val={pct} c="#c8785a" />
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title"><span>🌸</span> الأزهار</h3></div>
          <div className="card-body">
            <div className="flower-icon-big">{flowerIcon}</div>
            <Bar label={flower.stage} val={Math.round(flower.growth)} c="#4CAF50" />
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title"><span>🌍</span> العالم</h3></div>
          <div className="card-body">
            <div className="time-phase-big">{time.isNight ? '🌙' : '☀️'} {time.phase}</div>
            <Bar label="استقرار" val={Math.round(world.stability)} c={world.stability < 40 ? '#f44336' : '#2196F3'} />
            <Bar label="تشويش" val={Math.round(world.glitchLevel)} c="#FF9800" />
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><h3 className="card-title"><span>📊</span> التقدم</h3></div>
        <div className="card-body">
          <div className="grid-4">
            <div className="text-center"><div className="stat-value">{memory.fragmentsCollected}/{memory.totalFragments}</div><div className="stat-label">ذكريات</div></div>
            <div className="text-center"><div className="stat-value">{achievements.filter(a => a.unlocked).length}/{achievements.length}</div><div className="stat-label">إنجازات</div></div>
            <div className="text-center"><div className="stat-value">{time.dayCycle}</div><div className="stat-label">أيام</div></div>
            <div className="text-center"><div className="stat-value">{echo.level}</div><div className="stat-label">مستوى</div></div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><h3 className="card-title"><span>📜</span> الأحداث</h3></div>
        <div className="card-body">
          {memory.timelineEvents.slice(-5).reverse().map((ev, i) => (
            <div key={i} style={{display:'flex',gap:'0.5rem',fontSize:'0.6rem',padding:'0.2rem 0',borderBottom:'1px solid rgba(180,120,80,0.05)'}}>
              <span style={{color:'var(--accent)'}}>{ev.time}</span>
              <span style={{color:'rgba(224,220,212,0.5)'}}>{ev.description.slice(0,60)}...</span>
            </div>
          ))}
          {memory.timelineEvents.length === 0 && <p style={{fontSize:'0.6rem',color:'rgba(224,220,212,0.3)',textAlign:'center'}}>حل الألغاز لتسجيل الأحداث...</p>}
        </div>
      </div>
      {time.phaseIndex >= 1 && <div className="night-bar" style={{padding:'0.5rem',background:'rgba(200,50,50,0.1)',border:'1px solid rgba(200,50,50,0.2)',textAlign:'center',fontSize:'0.65rem',color:'#cc6666'}}>⚠ {time.phase} — التحول الليلي</div>}
    </div>
  );
};

const Bar: React.FC<{ label: string; val: number; c: string }> = ({ label, val, c }) => (
  <div style={{marginBottom:'0.3rem'}}>
    <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.55rem',color:'rgba(224,220,212,0.45)',marginBottom:'0.1rem'}}>
      <span>{label}</span><span>{Math.round(val)}%</span>
    </div>
    <div style={{height:'4px',background:'rgba(180,120,80,0.08)',borderRadius:'99px',overflow:'hidden'}}>
      <div style={{height:'100%',width:`${Math.min(100,Math.max(0,val))}%`,background:c,borderRadius:'99px',transition:'width 0.5s ease'}} />
    </div>
  </div>
);

export default DashboardHome;