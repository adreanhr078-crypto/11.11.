import type {
  EchoMindIntrusionTone,
} from '../../application/echo/echoMindLivingStore';

export function playEchoMindSignal(
  tone: EchoMindIntrusionTone | 'reply',
  volume: number,
): void {
  if (typeof window === 'undefined') return;
  const AudioContextConstructor = window.AudioContext
    ?? (window as typeof window & {
      webkitAudioContext?: typeof AudioContext;
    }).webkitAudioContext;
  if (!AudioContextConstructor) return;

  try {
    const context = new AudioContextConstructor();
    const gain = context.createGain();
    const oscillator = context.createOscillator();
    const now = context.currentTime;
    const safeVolume = Math.min(0.16, Math.max(0, volume) * 0.16);
    const frequencies = {
      signal: [220, 330],
      memory: [262, 392],
      warning: [180, 118],
      reply: [294, 349],
    }[tone];

    oscillator.type = tone === 'warning' ? 'sawtooth' : 'sine';
    oscillator.frequency.setValueAtTime(frequencies[0], now);
    oscillator.frequency.exponentialRampToValueAtTime(
      frequencies[1],
      now + 0.32,
    );
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, safeVolume),
      now + 0.035,
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.44);
    oscillator.addEventListener('ended', () => {
      void context.close();
    }, { once: true });
  } catch {
    // Audio cues are optional and must never block Echo Mind.
  }
}
