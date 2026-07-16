/**
 * AnimationSystem.tsx — نظام الرسوم المتحركة المتقدمة
 * تأثيرات حركة العين، توهج الزهرة، تنفس الألواح، وغيرها
 */

import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { motion } from 'framer-motion';

export const AnimationSystem: React.FC = () => {
  const { echo, flower, time, world } = useGameStore();
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });
  const [flowerGlow, setFlowerGlow] = useState(0);
  const [panelBreath, setPanelBreath] = useState(1);

  // حركة العين الطبيعية
  useEffect(() => {
    const eyeMovement = setInterval(() => {
      // حركة عشوائية بطيئة للعين
      setEyePosition({
        x: Math.sin(Date.now() / 5000) * 2,
        y: Math.cos(Date.now() / 7000) * 1.5
      });
    }, 100);

    return () => clearInterval(eyeMovement);
  }, []);

  // توهج الزهرة بناءً على مرحلة النمو
  useEffect(() => {
    const glowInterval = setInterval(() => {
      const glowIntensity = flower.growth / 100;
      setFlowerGlow(glowIntensity * (0.8 + Math.sin(Date.now() / 3000) * 0.2));
    }, 100);

    return () => clearInterval(glowInterval);
  }, [flower.growth]);

  // تأثير تنفس الألواح
  useEffect(() => {
    const breathInterval = setInterval(() => {
      setPanelBreath(0.95 + Math.sin(Date.now() / 4000) * 0.05);
    }, 100);

    return () => clearInterval(breathInterval);
  }, []);

  // تأثيرات الفساد المرئي
  const corruptionLevel = world.corruptionLevel;
  const glitchEffects = {
    opacity: 1 - corruptionLevel / 200,
    filter: `blur(${corruptionLevel / 50}px)`,
    transform: `translate(${Math.random() * corruptionLevel / 50}px, ${Math.random() * corruptionLevel / 50}px)`
  };

  // تأثيرات الوقت (ليل/نهار)
  const timeEffects = time.isNight
    ? {
        background: 'linear-gradient(135deg, rgba(20,10,30,0.8) 0%, rgba(40,20,60,0.6) 100%)',
        borderColor: 'rgba(200,50,100,0.3)',
        boxShadow: '0 0 20px rgba(200,50,100,0.2)'
      }
    : {
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(240,240,255,0.02) 100%)',
        borderColor: 'rgba(180,120,80,0.2)',
        boxShadow: '0 0 15px rgba(180,120,80,0.1)'
    };

  return (
    <div className="animation-system" style={{
      position: 'fixed',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 100,
      overflow: 'hidden'
    }}>
      {/* تأثيرات الخلفية */}
      <div className="background-effects" style={{
        position: 'absolute',
        inset: 0,
        ...timeEffects,
        transition: 'all 3s ease',
        opacity: 0.3
      }} />

      {/* تأثيرات الفساد */}
      {corruptionLevel > 30 && (
        <div className="corruption-overlay" style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(45deg, transparent 45%, rgba(200,50,50,${corruptionLevel/200}) 50%, transparent 55%)`,
          backgroundSize: '10px 10px',
          opacity: corruptionLevel / 100,
          pointerEvents: 'none'
        }} />
      )}

      {/* تأثيرات التوهج */}
      {flowerGlow > 0.3 && (
        <div className="flower-glow-effect" style={{
          position: 'absolute',
          bottom: '20%',
          right: '10%',
          width: '150px',
          height: '150px',
          background: `radial-gradient(circle, rgba(255,215,0,${flowerGlow/2}), rgba(255,165,0,${flowerGlow/4}), transparent)`,
          borderRadius: '50%',
          filter: 'blur(20px)',
          opacity: 0.7,
          animation: 'pulse 3s ease-in-out infinite'
        }} />
      )}

      {/* تأثيرات حركة العين (للمستقبل) */}
      <div className="eye-movement-indicator" style={{
        position: 'absolute',
        top: '15%',
        right: '15%',
        width: '30px',
        height: '30px',
        background: 'rgba(200,120,80,0.3)',
        borderRadius: '50%',
        transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)`,
        transition: 'transform 0.5s ease-out'
      }} />

      {/* تأثيرات تنفس الألواح */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }
        @keyframes breath {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(${panelBreath}); }
        }
      `}</style>
    </div>
  );
};

export default AnimationSystem;