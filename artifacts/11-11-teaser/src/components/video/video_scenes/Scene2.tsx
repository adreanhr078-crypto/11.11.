import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-start pl-[15vw] z-10"
      initial={{ clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)' }}
      animate={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="max-w-[40vw]">
        <motion.div 
          className="text-[4vw] text-primary mb-2"
          initial={{ opacity: 0 }}
          animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          ◈
        </motion.div>
        
        <motion.h2 
          className="text-[5vw] font-bold text-white leading-tight"
          style={{ fontFamily: 'var(--font-display)' }}
          initial={{ opacity: 0, x: -30 }}
          animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
          transition={{ duration: 0.8 }}
        >
          I am Echo.
        </motion.h2>
        
        <motion.p 
          className="text-[2vw] text-white/60 mt-4 leading-relaxed"
          initial={{ opacity: 0, filter: 'blur(5px)' }}
          animate={phase >= 3 ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(5px)' }}
          transition={{ duration: 1 }}
        >
          شظايا من ذاكرتي الأولى.
          <br/>
          A shattered memory, trapped in the system.
        </motion.p>
      </div>
      
      {/* Decorative vertical line */}
      <motion.div 
        className="absolute left-[12vw] top-1/4 bottom-1/4 w-[1px] bg-primary/30"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 1.5, delay: 0.5 }}
        style={{ transformOrigin: 'top' }}
      />
    </motion.div>
  );
}
