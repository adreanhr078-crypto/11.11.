import React from 'react';
import { useGameStore } from '../../stores/gameStore';

export const EndingPanel: React.FC = () => {
  const { endings, solvedPuzzles, totalPuzzles, echo, flower, time, player } = useGameStore();
  return (
    <div className="dashboard-home">
      <div className="section-header-custom"><h1><span style={{color:'var(--accent)'}}>11.11</span> — النهايات</h1>
      <p className="subtitle">{Object.values(endings).filter((e:any)=>e.unlocked).length}/4 مفتوحة · {Math.round((solvedPuzzles/totalPuzzles)*100)}% تقدم</p></div>
      <div className="grid-2">
        {[
          {id:'sorrow', icon:'💧', title:'النهاية الحزينة', desc:'فقدان الأمل — يبقى ذكرى', req:'ثقة<30 + أمل<20 + فساد>60 + زهرة فاسدة'},
          {id:'truth', icon:'🔦', title:'الحقيقة', desc:'قتل الأمل — تكتشف الحقيقة', req:'ثقة>70 + ذاكرة>70 + 219 لغز + وعي>70'},
          {id:'dark', icon:'🌑', title:'النهاية المظلمة', desc:'تواجه نفسك — تكتشف الحقيقة', req:'فساد>70 + خوف>80 + ليل + زهرة فاسدة'},
          {id:'mystery', icon:'🔮', title:'النهاية المحيرة', desc:'تكتشف أسراره — ويستمر', req:'زهرة100% + فضول>70 + 3 أمنيات + طبقة مخفية'},
        ].map(({id,icon,title,desc,req}) => {
          const e = (endings as any)[id];
          return (
            <div key={id} className={`card ${e.unlocked?'completed':''}`}>
              <div className="card-header"><h3 className="card-title"><span>{icon}</span> {title}</h3>
              {e.unlocked && <span className="puzzle-status done">✅ مفتوحة</span>}</div>
              <div className="card-body">
                <p style={{fontSize:'0.6rem',color:'rgba(224,220,212,0.4)'}}>{desc}</p>
                <Bar label="تقدم" val={e.progress} c={e.progress>50?'#4CAF50':'var(--accent)'} />
                <p style={{fontSize:'0.5rem',color:'rgba(224,220,212,0.25)',marginTop:'0.3rem'}}>المتطلبات: {req}</p>
              </div>
            </div>
          );
        })}
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
export default EndingPanel;