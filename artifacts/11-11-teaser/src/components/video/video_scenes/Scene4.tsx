import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 1200),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-end pr-[15vw] z-10"
      initial={{ x: '100vw' }}
      animate={{ x: 0 }}
      exit={{ scale: 1.5, opacity: 0 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="max-w-[50vw] text-right text-white">
        <motion.h2 
          className="text-[6vw] font-bold leading-none mb-6"
          style={{ fontFamily: 'var(--font-display)' }}
          initial={{ opacity: 0, x: 50 }}
          animate={phase >= 1 ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
          transition={{ duration: 0.8 }}
        >
          SOLVE TO <br/>
          <span className="text-primary italic">REMEMBER.</span>
        </motion.h2>
        
        <motion.div 
          className="text-[2.2vw] text-white/70 space-y-4"
          initial={{ opacity: 0 }}
          animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1 }}
        >
          <p>حل الألغاز لتفهم القصة.</p>
          <p className="text-white/40 text-[1.5vw] font-mono tracking-widest mt-8">
            LOG_FRAG: 11_11_SYS // DATA_CORRUPT
          </p>
        </motion.div>
      </div>
      
      {/* Decorative grid */}
      <motion.div 
        className="absolute inset-0 z-[-1] opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '4vw 4vw'
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        transition={{ duration: 2 }}
      />
    </motion.div>
  );
}
