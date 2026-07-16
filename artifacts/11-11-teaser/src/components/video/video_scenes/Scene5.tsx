import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene5() {
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
      className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      <motion.div
        className="text-[3vw] text-white/50 tracking-[0.5em] mb-8 uppercase"
        initial={{ opacity: 0 }}
        animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1 }}
        style={{ fontFamily: 'var(--font-display)' }}
      >
        System Reset
      </motion.div>
      
      <motion.div 
        className="text-[15vw] font-bold text-red-500/80 leading-none glitch-effect"
        style={{ fontFamily: 'var(--font-display)' }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={phase >= 2 ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        3:33
      </motion.div>
      
      <motion.div
        className="text-[2vw] text-white mt-12"
        initial={{ opacity: 0, y: 20 }}
        animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 1 }}
      >
        Everything resets. <span className="text-white/50 ml-2">يعود كل شيء.</span>
      </motion.div>
    </motion.div>
  );
}
