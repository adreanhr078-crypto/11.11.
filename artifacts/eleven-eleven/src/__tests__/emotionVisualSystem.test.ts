import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  deriveEmotionVisualProfile,
} from '../domain/emotion/emotionVisualSystem';
import type { EchoPersonality } from '../domain/echo/echoPersonality';
import {
  createEmotionVisualReadModel,
} from '../application/emotion/createEmotionVisualReadModel';
import {
  EMOTION_VISUAL_CONFIG,
  validateEmotionVisualConfig,
} from '../infrastructure/presentation/emotionVisualConfigRegistry';

function personality(
  values: Partial<EchoPersonality>,
): EchoPersonality {
  return {
    humanity: 0,
    trust: 0,
    fear: 0,
    anger: 0,
    sadness: 0,
    corruption: 0,
    memoriesRecovered: 0,
    ...values,
  };
}

describe('Emotion Visual System', () => {
  it('validates the editor-authored presentation configuration', () => {
    assert.doesNotThrow(validateEmotionVisualConfig);
    assert.equal(EMOTION_VISUAL_CONFIG.schemaVersion, 1);
    assert.deepEqual(Object.keys(EMOTION_VISUAL_CONFIG.channels).sort(), [
      'anger',
      'corruption',
      'fear',
      'humanity',
      'sadness',
      'trust',
    ]);
  });

  it('blends humanity into a hopeful low-glitch presentation', () => {
    const profile = deriveEmotionVisualProfile(
      personality({ humanity: 100 }),
      EMOTION_VISUAL_CONFIG,
    );
    assert.equal(profile.dominantEmotion, 'humanity');
    assert.equal(profile.signature, 'hopeful');
    assert.ok(profile.atmosphere.warmth > 0.5);
    assert.ok(profile.glitch.intensity < 0.02);
    assert.ok(profile.sound.warmth > profile.sound.tension);
  });

  it('turns anger into stronger camera, pulse and glitch intent', () => {
    const hopeful = deriveEmotionVisualProfile(
      personality({ humanity: 100 }),
      EMOTION_VISUAL_CONFIG,
    );
    const angry = deriveEmotionVisualProfile(
      personality({ anger: 100 }),
      EMOTION_VISUAL_CONFIG,
    );
    assert.equal(angry.signature, 'volatile');
    assert.ok(angry.glitch.intensity > hopeful.glitch.intensity);
    assert.ok(angry.cinematic.cameraShake > hopeful.cinematic.cameraShake);
    assert.ok(angry.atmosphere.pulse > hopeful.atmosphere.pulse);
    assert.ok(angry.sound.distortion > hopeful.sound.distortion);
  });

  it('makes corruption the strongest distortion profile', () => {
    const corrupted = deriveEmotionVisualProfile(
      personality({ corruption: 100 }),
      EMOTION_VISUAL_CONFIG,
    );
    assert.equal(corrupted.signature, 'corrupted');
    assert.ok(corrupted.glitch.intensity > 0.7);
    assert.ok(corrupted.cinematic.transitionDistortion > 0.7);
    assert.ok(corrupted.sound.lowPassHz < 6_000);
  });

  it('exports stable CSS hooks without platform assets', () => {
    const profile = deriveEmotionVisualProfile(
      personality({ trust: 65, fear: 35, sadness: 20 }),
      EMOTION_VISUAL_CONFIG,
    );
    const model = createEmotionVisualReadModel(profile);
    assert.match(model.cssVariables['--evs-primary'], /^#[0-9a-f]{6}$/);
    assert.match(model.cssVariables['--evs-glitch-chromatic-px'], /px$/);
    assert.equal(
      Object.values(model.cssVariables).some((value) => value.includes('NaN')),
      false,
    );
    assert.equal(model.attributes.signature, profile.signature);
  });

  it('responds continuously to small personality changes', () => {
    const first = deriveEmotionVisualProfile(
      personality({ fear: 49 }),
      EMOTION_VISUAL_CONFIG,
    );
    const second = deriveEmotionVisualProfile(
      personality({ fear: 50 }),
      EMOTION_VISUAL_CONFIG,
    );
    assert.ok(
      Math.abs(second.glitch.intensity - first.glitch.intensity) < 0.03,
    );
  });
});
