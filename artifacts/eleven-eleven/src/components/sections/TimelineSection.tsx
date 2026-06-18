import React from 'react';
import { useGameStore } from '../../stores/gameStore';

export const TimelineSection: React.FC = () => {
  const { time, memory } = useGameStore();
  const points = [
    { t:'08:00', label:'الصباح', icon:'☀️', desc:'بداية الشفاء' },
    { t:'12:00', label:'الظهر', icon:'🌤️', desc:'التفاعل اليومي' },
    { t:'17:00', label:'المساء', icon:'🌅', desc:'توتر خفيف' },
    { t:'23:00', label:'11:00 PM', icon:'🌙', desc:'بداية عدم الاستقرار' },
    { t:'23:05', label:'11:05 PM', icon:'🔴', desc:'تزايد التشويش' },
    { t:'23:11', label:'11:11 PM', icon:'🔥', desc:'التحول السينمائي' },
    { t:'03:33', label:'3:33 AM', icon:'⚠️', desc:'ساعة الأسرار' },
    { t:'05:00', label:'الفجر', icon:'🌤️', desc:'بداية التعافي' },
  ];
  const currentHour = time.hour;

  return (
    <div className="dashboard-home">
      <div className="section-header-custom"><h1><span style={{color:'var(--accent)'}}>11.11</span> — الخط الزمني</h1>
      <p className="subtitle">{time.phase} · {time.dayCycle} يوم</p></div>
      <div className="card">
        <div className="card-body">
          <div style={{display:'flex',overflowX:'auto',gap:'0.5rem',padding:'1rem 0'}}>
            {points.map((p,i) => {
              const isPast = i <= Math.floor(currentHour / 3);
              const isNow = Math.abs(currentHour - parseInt(p.t)) < 2;
              return (
                <div key={i} style={{flex:'0 0 100px',textAlign:'center',padding:'0.75rem 0.5rem',background:isNow?'rgba(200,120,90,0.15)':isPast?'rgba(200,120,90,0.05)':'rgba(20,16,25,0.3)',border:`1px solid ${isNow?'var(--accent)':'var(--accent-border)'}`,borderRadius:'8px',opacity:isPast?1:0.5}}>
                  <div style={{fontSize:'1.2rem'}}>{p.icon}</div>
                  <div style={{fontSize:'0.5rem',color:'var(--accent)',fontFamily:'monospace'}}>{p.t}</div>
                  <div style={{fontSize:'0.55rem',marginTop:'0.2rem'}}>{p.label}</div>
                  <div style={{fontSize:'0.45rem',color:'rgba(224,220,212,0.3)'}}>{p.desc}</div>
                  {isNow && <div style={{fontSize:'0.45rem',color:'var(--accent)',marginTop:'0.3rem'}}>● الآن</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><h3 className="card-title"><span>📜</span> سجل الأحداث</h3></div>
        <div className="card-body">
          {memory.timelineEvents.slice(-10).reverse().map((ev,i) => (
            <div key={i} style={{display:'flex',gap:'0.5rem',padding:'0.3rem 0',borderBottom:'1px solid rgba(180,120,80,0.05)',fontSize:'0.6rem'}}>
              <span style={{color:'var(--accent)',fontFamily:'monospace',flexShrink:0}}>{ev.time}</span>
              <span style={{color:'rgba(224,220,212,0.5)'}}>{ev.description}</span>
              <span style={{color:'rgba(224,220,212,0.25)',fontSize:'0.45rem'}}>{ev.phase}</span>
            </div>
          ))}
          {memory.timelineEvents.length === 0 && <p style={{textAlign:'center',fontSize:'0.6rem',color:'rgba(224,220,212,0.3)'}}>لا توجد أحداث بعد...</p>}
        </div>
      </div>
    </div>
  );
};
export default TimelineSection;