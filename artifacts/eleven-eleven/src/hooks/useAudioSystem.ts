/**
 * useAudioSystem.ts — النظام الصوتي للمراحل الزمنية
 * يغير الموسيقى والتأثيرات حسب الوقت والمرحلة
 */

import { useEffect, useRef } from 'react';
import type { TimePhase } from '../stores/gameStore';

export function useAudioSystem(phase: TimePhase, phaseIndex: number) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const noiseIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;

      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // في الليل: صوت هادئ جداً بدون ضوضاء أو تشويش
      const isNight = phase === '11:00' || phase === '11:05' || phase === '11:11';
      
      if (isNight) {
        // وضع الليل الهادئ: نغمة ناعمة بدون ضوضاء
        osc.type = 'sine';
        osc.frequency.value = 174; // نغمة هادئة منخفضة
        filter.type = 'lowpass';
        filter.frequency.value = 300; // قطع الترددات العالية
        gain.gain.value = 0.015; // صوت منخفض جداً
      } else {
        // الوضع النهاري
        osc.type = phaseIndex >= 2 ? 'sawtooth' : 'sine';
        const frequencies: Record<string, number> = {
          'morning': 220, 'day': 256, ' evening': 200,
        };
        osc.frequency.value = frequencies[phase] || 220;
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        gain.gain.value = 0.03;
      }

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      oscillatorRef.current = osc;

      // إيقاف الضوضاء العشوائية في الليل
      if (!isNight && phaseIndex >= 2) {
        noiseIntervalRef.current = setInterval(() => {
          if (Math.random() > 0.7) {
            const baseFreq = isNight ? 174 : 150;
            osc.frequency.value = baseFreq + Math.random() * 50;
            setTimeout(() => { osc.frequency.value = baseFreq; }, 200);
          }
        }, 1000);
      }

      return () => {
        if (noiseIntervalRef.current) {
          clearInterval(noiseIntervalRef.current);
          noiseIntervalRef.current = null;
        }
      };
    } catch {
      return () => {};
    }
  }, [phase, phaseIndex]);

  useEffect(() => {
    return () => {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
        oscillatorRef.current = null;
      }
      // Do NOT close the shared AudioContext here; it is reused across renders/phases.
    };
  }, []);
}

export default useAudioSystem;