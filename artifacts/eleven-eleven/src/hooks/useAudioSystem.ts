/**
 * useAudioSystem.ts — النظام الصوتي للمراحل الزمنية
 * يغير الموسيقى والتأثيرات حسب الوقت والمرحلة
 */

import { useEffect, useRef } from 'react';
import type { TimePhase } from '../stores/gameStore';

export function useAudioSystem(phase: TimePhase, phaseIndex: number) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);

  useEffect(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;

      // إنشاء صوت محيطي حسب المرحلة
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = phaseIndex >= 2 ? 'sawtooth' : phaseIndex === 1 ? 'triangle' : 'sine';
      
      // ترددات مختلفة حسب الوقت
      const frequencies: Record<string, number> = {
        'morning': 220, 'day': 256, 'evening': 200,
        '11:00': 180, '11:05': 150, '11:11': 110,
      };
      osc.frequency.value = frequencies[phase] || 220;

      filter.type = phaseIndex >= 2 ? 'highpass' : 'lowpass';
      filter.frequency.value = phaseIndex >= 2 ? 800 : 400;

      gain.gain.value = 0.03; // صوت خافت جداً

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      oscillatorRef.current = osc;

      // تأثير تشويش عند الليل
      if (phaseIndex >= 2) {
        const interval = setInterval(() => {
          if (Math.random() > 0.7) {
            osc.frequency.value = frequencies[phase] + Math.random() * 50;
            setTimeout(() => { osc.frequency.value = frequencies[phase]; }, 200);
          }
        }, 1000);
        return () => clearInterval(interval);
      }
    } catch {
      // تجاهل أخطاء الصوت (قد لا يدعم المتصفح)
    }
  }, [phase, phaseIndex]);

  useEffect(() => {
    return () => {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);
}

export default useAudioSystem;