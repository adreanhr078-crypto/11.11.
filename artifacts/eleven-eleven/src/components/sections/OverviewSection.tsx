import React from 'react';
import { useGameStore } from '../../stores/gameStore';

export const OverviewSection: React.FC = () => {
  const { echo, solvedPuzzles, totalPuzzles, flower, time, world } = useGameStore();
  return (
    <div className="dashboard-home">
      <div className="section-header-custom"><h1><span style={{color:'var(--accent)'}}>11.11</span> — الروية الشاملة</h1><p className="subtitle">{echo.mood} · {solvedPuzzles} ألغاز</p></div>
      <div className="grid-2">
        <div className="card"><div className="card-header"><h3 className="card-title"><span>🎮</span> حلقية اللعب</h3></div><div className="card-body"><div className="system-links"><div className="system-link-node">🧩 ألغاز</div><span className="system-link-arrow">→</span><div className="system-link-node">💠 ذكريات</div><span className="system-link-arrow">→</span><div className="system-link-node">❤️ Echo</div><span className="system-link-arrow">→</span><div className="system-link-node">🌸 أزهار</div></div></div></div>
        <div className="card"><div className="card-header"><h3 className="card-title"><span>❓</span> ما هو 11.11؟</h3></div><div className="card-body"><p style={{fontSize:'0.6rem',color:'rgba(224,220,212,0.4)',lineHeight:1.7}}>رحلة عاطفية تفاعلية حيث كل قرار يؤثر على Echo. {solvedPuzzles} ألغاز محلولة، {Math.round(flower.growth)}% نمو الأزهار، {echo.trust}% ثقة.</p></div></div>
      </div>
      <div className="card"><div className="card-header"><h3 className="card-title"><span>💔</span> Echo</h3></div><div className="card-body"><div className="grid-3" style={{gap:'0.5rem'}}>
        {[{l:'ثقة',v:echo.trust,c:'#c8785a'},{l:'خوف',v:echo.fear,c:'#cc6644'},{l:'ذاكرة',v:echo.memoryStability,c:'#5A8AAA'},{l:'فساد',v:echo.corruption,c:echo.corruption>50?'#f44336':'#AA8B40'},{l:'أمل',v:echo.hope,c:'#4CAF50'},{l:'استقرار',v:world.stability,c:world.stability<40?'#f44336':'#2196F3'}].map(s=>
          <div key={s.l} style={{textAlign:'center'}}><span style={{fontSize:'0.8rem',fontWeight:700,color:s.c}}>{s.v}%</span><p style={{fontSize:'0.5rem',color:'rgba(224,220,212,0.3)'}}>{s.l}</p></div>
        )}
      </div></div></div>
      <div className="grid-2">
        <div className="card"><div className="card-header"><h3 className="card-title"><span>☀️</span> النهاري</h3></div><div className="card-body"><Bar label="استقرار" val={time.isNight?0:100} c="#4CAF50" /></div></div>
        <div className="card"><div className="card-header"><h3 className="card-title"><span>🌙</span> الليلي</h3></div><div className="card-body"><Bar label="تشويش" val={time.isNight?100:0} c="#f44336" /></div></div>
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
export default OverviewSection;