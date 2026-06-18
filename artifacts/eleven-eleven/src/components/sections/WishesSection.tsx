import React from 'react';
import { useGameStore } from '../../stores/gameStore';

export const WishesSection: React.FC = () => {
  const { wishes, actions } = useGameStore();
  const [newWish, setNewWish] = React.useState('');

  const handleAdd = () => {
    if (newWish.trim()) { actions.addWish(newWish.trim()); setNewWish(''); }
  };

  return (
    <div className="dashboard-home">
      <div className="section-header-custom"><h1><span style={{color:'var(--accent)'}}>11.11</span> — الأمنيات</h1><p className="subtitle">{wishes.filter(w=>w.status==='active').length} نشطة</p></div>
      <div className="card">
        <div className="card-header"><h3 className="card-title"><span>⭐</span> أمنياتي</h3></div>
        <div className="card-body">
          <div className="grid-auto-sm">
            {wishes.map(w => (
              <div key={w.id} className="wish-card" style={{opacity:w.status==='completed'?0.6:1}}>
                <span className="wish-text">{w.text}</span>
                <div className="wish-meta"><span>{w.createdAt}</span><span>{Math.round(w.progress)}%</span></div>
                <div style={{height:'3px',background:'rgba(180,120,80,0.08)',borderRadius:'99px',overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${Math.round(w.progress)}%`,background:w.status==='completed'?'#4CAF50':'var(--accent)',borderRadius:'99px'}}/>
                </div>
                {w.status==='active' && <button className="card-link" onClick={()=>actions.completeWish(w.id)} style={{marginTop:'0.3rem',display:'block',width:'100%',textAlign:'center'}}>✓ أكمل</button>}
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:'0.5rem',marginTop:'0.75rem'}}>
            <input type="text" value={newWish} onChange={e=>setNewWish(e.target.value)} onKeyPress={e=>e.key==='Enter'&&handleAdd()} placeholder="اكتب أمنية جديدة..." style={{flex:1,padding:'0.5rem',background:'rgba(10,8,12,0.8)',border:'1px solid var(--accent-border)',color:'var(--text)',fontFamily:'inherit',fontSize:'0.65rem'}} />
            <button className="continue-btn" onClick={handleAdd} style={{padding:'0.5rem 1rem'}}>+ أضف</button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default WishesSection;