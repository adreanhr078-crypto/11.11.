export type RewardSoundTier = 'puzzle' | 'standard' | 'rare' | 'system';

export interface RewardTone {
  frequency: number;
  startsAt: number;
  duration: number;
  gain: number;
  wave: OscillatorType;
}

const FREQUENCY_BY_TIER: Record<RewardSoundTier, readonly number[]> = {
  puzzle: [196, 293.66, 392, 523.25],
  standard: [261.63, 392, 523.25],
  rare: [293.66, 440, 587.33, 880],
  system: [196, 392, 523.25, 783.99, 1046.5],
};

let sharedContext: AudioContext | null = null;

function clampVolume(volume: number): number {
  if (!Number.isFinite(volume)) return 0;
  return Math.min(1, Math.max(0, volume));
}

export function createRewardTonePlan(
  tier: RewardSoundTier,
  volume: number,
): RewardTone[] {
  const safeVolume = clampVolume(volume);
  return FREQUENCY_BY_TIER[tier].map((frequency, index, notes) => ({
    frequency,
    startsAt: index * (tier === 'system' ? 0.085 : 0.11),
    duration: 0.34 + (index === notes.length - 1 ? 0.18 : 0),
    gain: safeVolume * (tier === 'puzzle' ? 0.12 : 0.1),
    wave: index === 0 && tier === 'puzzle' ? 'triangle' : 'sine',
  }));
}

function audioContextConstructor(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null;
  return window.AudioContext
    ?? (window as typeof window & {
      webkitAudioContext?: typeof AudioContext;
    }).webkitAudioContext
    ?? null;
}

function getContext(): AudioContext | null {
  const Constructor = audioContextConstructor();
  if (!Constructor) return null;
  try {
    sharedContext ??= new Constructor();
    return sharedContext;
  } catch {
    return null;
  }
}

export function primeRewardAudio(enabled: boolean): void {
  if (!enabled) return;
  const context = getContext();
  if (context?.state === 'suspended') {
    void context.resume().catch(() => undefined);
  }
}

function scheduleRewardSound(
  tier: RewardSoundTier,
  volume: number,
): void {
  const plan = createRewardTonePlan(tier, volume);
  if (plan.length === 0 || plan.every((tone) => tone.gain === 0)) return;
  const context = getContext();
  if (!context) return;

  const now = context.currentTime + 0.015;
  const master = context.createGain();
  const filter = context.createBiquadFilter();
  master.gain.setValueAtTime(0.92, now);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(tier === 'puzzle' ? 3_800 : 4_800, now);
  filter.Q.setValueAtTime(0.7, now);
  master.connect(filter);
  filter.connect(context.destination);

  for (const tone of plan) {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    const start = now + tone.startsAt;
    const end = start + tone.duration;
    oscillator.type = tone.wave;
    oscillator.frequency.setValueAtTime(tone.frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(
      tone.frequency * 1.012,
      end,
    );
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, tone.gain),
      start + 0.025,
    );
    envelope.gain.exponentialRampToValueAtTime(0.0001, end);
    oscillator.connect(envelope);
    envelope.connect(master);
    oscillator.start(start);
    oscillator.stop(end + 0.02);
  }

  const releaseAfterMs = Math.ceil(
    (Math.max(...plan.map((tone) => tone.startsAt + tone.duration)) + 0.1)
    * 1_000,
  );
  window.setTimeout(() => {
    master.disconnect();
    filter.disconnect();
  }, releaseAfterMs);
}

export function playPuzzleCompletionSound(volume: number): void {
  try {
    scheduleRewardSound('puzzle', volume);
  } catch {
    // Presentation audio is optional and must never block an authoritative reward.
  }
}

export function playAchievementUnlockSound(
  tier: Exclude<RewardSoundTier, 'puzzle'>,
  volume: number,
): void {
  try {
    scheduleRewardSound(tier, volume);
  } catch {
    // The visual achievement presentation remains the accessible source of truth.
  }
}
