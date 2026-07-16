import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2100),
      setTimeout(() => setPhase(4), 3000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const entities = [
    { glyph: '◉', nameEn: 'The Watcher', nameAr: 'المراقب', color: 'var(--color-watcher)', delay: 1 },
    { glyph: '≋', nameEn: 'The Lost Signal', nameAr: 'الإشارة المفقودة', color: 'var(--color-signal)', delay: 2 },
    { glyph: '▲', nameEn: 'The Architect', nameAr: 'المهندس', color: 'var(--color-architect)', delay: 3 },
  ];

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: -50, filter: 'blur(10px)' }}
      transition={{ duration: 1 }}
    >
      <div className="flex gap-[10vw] items-center justify-center w-full px-[10vw]">
        {entities.map((ent, i) => (
          <motion.div 
            key={i}
            className="flex flex-col items-center text-center"
            initial={{ opacity: 0, y: 40 }}
            animate={phase >= ent.delay ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <motion.div 
              className="text-[6vw] mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
              style={{ color: ent.color }}
              animate={phase >= ent.delay ? { 
                scale: [1, 1.2, 1],
                filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)']
              } : {}}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            >
              {ent.glyph}
            </motion.div>
            <div className="text-[1.8vw] font-bold text-white tracking-wider uppercase" style={{ fontFamily: 'var(--font-display)' }}>
              {ent.nameEn}
            </div>
            <div className="text-[1.5vw] text-white/50 mt-2">
              {ent.nameAr}
            </div>
          </motion.div>
        ))}
      </div>
      
      <motion.div
        className="absolute bottom-[20vh] text-[2vw] text-white/40 tracking-widest uppercase"
        initial={{ opacity: 0 }}
        animate={phase >= 4 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1 }}
        style={{ fontFamily: 'var(--font-display)' }}
      >
        They are watching
      </motion.div>
    </motion.div>
  );
}
