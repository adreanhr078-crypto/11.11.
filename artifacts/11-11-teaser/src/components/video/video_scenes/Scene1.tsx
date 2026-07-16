import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 3000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center z-10 mix-blend-screen"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="text-center relative">
        <motion.div 
          className="text-[2vw] text-white/50 tracking-[0.5em] mb-4 uppercase"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 1 }}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Synch Point
        </motion.div>
        
        <motion.h1 
          className="text-[12vw] font-bold text-primary leading-none tracking-tighter"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {'11:11'.split('').map((char, i) => (
            <motion.span 
              key={i} 
              className="inline-block"
              initial={{ opacity: 0, rotateX: 90, y: 50 }}
              animate={phase >= 2 ? { opacity: 1, rotateX: 0, y: 0 } : { opacity: 0, rotateX: 90, y: 50 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20, delay: phase >= 2 ? i * 0.1 : 0 }}
            >
              {char}
            </motion.span>
          ))}
        </motion.h1>
        
        <motion.div
          className="text-[2.5vw] text-white/70 mt-4"
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={phase >= 3 ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(10px)' }}
          transition={{ duration: 1.2 }}
        >
          البوابة تُفتح <span className="opacity-50 mx-2">|</span> The Gate Opens
        </motion.div>
      </div>
    </motion.div>
  );
}
