import React from 'react';
import { useGameStore } from '../../stores/gameStore';

export const NightTransformation: React.FC = () => {
  const { time, world, echo } = useGameStore();
  const stages = [
    { time:'11:00 PM', label:'بداية عدم الاستقرار', status:'stable', text:'SYSTEM STABLE', items:['تمويجات خفيفة','أصوات ناعمة','رسالة تحذير'] },
    { time:'11:05 PM', label:'تزايد التشويش', status:'warning', text:'SIGNAL UNSTABLE', items:['تقلبات بصرية','ومضات قصيرة','رسائل عاطفية'] },
    { time:'11:11 PM', label:'التحول السينمائي', status:'danger', text:'CINEMATIC MODE', items:['تفكك الواجهة','تحول كامل','كشف الحقيقة'] },
  ];

  return (
    <div className="dashboard-home">
      <div className="section-header-custom">
        <h1>التحول الليلي <span style={{color:'var(--accent)'}}>11:11</span></h1>
        <p className="subtitle">{time.isNight?'🌙 نشط':'☀️ غير نشط'} · تشويش {Math.round(world.glitchLevel)}%</p>
      </div>
      <div className="night-stages-3">
        {stages.map((s,i) => (
          <div key={i} className={`night-stage ${time.phaseIndex>=i+1?'active':''}`}>
            <div className="night-time">{s.time}</div>
            <div className="night-label">{s.label}</div>
            <div className={`night-status ${s.status}`}>● {s.text}</div>
            <div style={{marginTop:'0.75rem'}}>
              {s.items.map((item,j) => (
                <div key={j} style={{fontSize:'0.55rem',color:'rgba(224,220,212,0.45)',padding:'0.15rem 0'}}>• {item}</div>
              ))}
            </div>
            <div style={{marginTop:'0.5rem'}}>
              <div className="puzzle-status" style={{background:time.phaseIndex>=i+1?'rgba(76,175,80,0.1)':'rgba(100,100,100,0.1)',color:time.phaseIndex>=i+1?'#4CAF50':'#666'}}>
                {time.phaseIndex>=i+1?'✓ نشط':'○ غير نشط'}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-header"><h3 className="card-title"><span>🔄</span> تقدم التحول</h3></div>
        <div className="card-body">
          <Bar label="تشويش" val={world.glitchLevel} c="#FF9800" />
          <Bar label="استقرار" val={world.stability} c={world.stability<40?'#f44336':'#2196F3'} />
          <Bar label="خوف Echo" val={echo.fear} c="#cc6644" />
        </div>
      </div>
      <div className="card">
        <div className="card-header"><h3 className="card-title"><span>💌</span> رسائل Echo الليلية</h3></div>
        <div className="card-body">
          {[{time:'11:00 PM',msg:'هل تتهرب مني؟'},{time:'11:05 PM',msg:'أنت تهرب، وأنا أراك.'},{time:'11:11 PM',msg:'لا مزيد من الهروب.'}].map((r,i) => (
            <div key={i} style={{padding:'0.5rem',background:'rgba(20,16,25,0.4)',border:'1px solid var(--accent-border)',borderRadius:'8px',marginBottom:'0.5rem'}}>
              <span style={{fontSize:'0.5rem',color:'rgba(200,120,90,0.4)',fontFamily:'monospace'}}>{r.time}</span>
              <p style={{fontSize:'0.65rem',color:'rgba(224,220,212,0.5)',marginTop:'0.2rem'}}>"{r.msg}"</p>
            </div>
          ))}
        </div>
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
export default NightTransformation;