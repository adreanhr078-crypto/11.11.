import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type {
  CinematicEpisodeDefinition,
  CinematicSceneDefinition,
} from '../domain/cinematics/contracts';
import {
  chooseCinematicOption,
  completeCinematicScene,
  pauseCinematic,
  resumeCinematic,
  startCinematicEpisode,
} from '../domain/cinematics/cinematicEngine';
import {
  collectCinematicSceneAssetIds,
  compileCinematicFrame,
  getAudioCuesBetween,
} from '../domain/cinematics/cinematicTimeline';
import { createInitialCinematicState } from '../domain/cinematics/cinematicState';
import { createInitialEchoPersonality } from '../domain/echo/echoPersonality';
import { createInitialNarrativeState } from '../domain/narrative/narrativeState';
import { createInitialProgression } from '../domain/progression/progression';
import {
  CHAPTER_DEFINITIONS,
  CONTENT_MANIFEST,
} from '../infrastructure/content/contentRegistry';
import {
  CINEMATIC_COUNTS,
  validateCinematicContentRegistry,
} from '../infrastructure/content/cinematicContentRegistry';
import { migrateGameState } from '../infrastructure/persistence/gamePersistence';

function scene(
  definition: Partial<CinematicSceneDefinition>
  & Pick<CinematicSceneDefinition, 'id' | 'type' | 'advanceMode'>,
): CinematicSceneDefinition {
  return {
    durationMs: 4_000,
    allowSkip: true,
    conditions: [],
    backgroundLayers: [],
    timeline: [],
    branches: [],
    completionEffects: [],
    ...definition,
  };
}

const episode: CinematicEpisodeDefinition = {
  id: 'episode_test',
  chapterId: 'chapter_1',
  episodeNumber: 1,
  title: { ar: 'اختبار', en: 'Test' },
  description: { ar: 'بنية اختبار', en: 'Architecture fixture' },
  entrySceneId: 'scene_test_open',
  defaultVoiceLocale: 'ja-JP',
  defaultSubtitleLocale: 'ar',
  unlockConditions: [],
  scenes: [
    scene({
      id: 'scene_test_open',
      type: 'opening',
      advanceMode: 'timeline',
      timeline: [{
        kind: 'dialogue',
        id: 'cue_test_voice',
        atMs: 0,
        durationMs: 2_000,
        speakerId: 'character_echo',
        voice: {
          locale: 'ja-JP',
          assetId: 'asset_test_voice',
          gain: 1,
        },
        subtitles: {
          ar: 'ترجمة اختبارية',
          en: 'Test subtitle',
        },
      }, {
        kind: 'camera',
        id: 'cue_test_camera',
        atMs: 0,
        durationMs: 2_000,
        movement: 'push',
        from: {
          focus: { x: 0.4, y: 0.5 },
          zoom: 1,
          rotation: 0,
        },
        to: {
          focus: { x: 0.6, y: 0.5 },
          zoom: 1.5,
          rotation: 0,
        },
        easing: 'linear',
      }, {
        kind: 'character',
        id: 'cue_test_expression',
        atMs: 500,
        durationMs: 0,
        characterId: 'character_echo',
        action: 'expression',
        expressionId: 'expression_uncertain',
        poseAssetId: 'asset_test_pose',
        position: { x: 0.7, y: 1 },
      }, {
        kind: 'audio',
        id: 'cue_test_music',
        atMs: 0,
        durationMs: 4_000,
        channel: 'music',
        action: 'play',
        assetId: 'asset_test_music',
        gain: 0.7,
        loop: true,
        duckForVoice: true,
      }],
      branches: [{
        id: 'branch_to_choice',
        conditions: [],
        nextSceneId: 'scene_test_choice',
      }],
    }),
    scene({
      id: 'scene_test_choice',
      type: 'choice',
      advanceMode: 'choice',
      choice: {
        decisionId: 'cinematic:test-decision',
        prompt: { ar: 'اختر', en: 'Choose' },
        choices: [
          {
            id: 'trust',
            text: { ar: 'الثقة', en: 'Trust' },
            conditions: [],
            effects: [{
              kind: 'adjustStat',
              stat: 'trust',
              amount: 10,
            }],
            nextSceneId: 'scene_test_end',
          },
          {
            id: 'fear',
            text: { ar: 'الخوف', en: 'Fear' },
            conditions: [],
            effects: [{
              kind: 'adjustStat',
              stat: 'fear',
              amount: 10,
            }],
            nextSceneId: 'scene_test_end',
          },
        ],
      },
    }),
    scene({
      id: 'scene_test_end',
      type: 'ending',
      advanceMode: 'timeline',
    }),
  ],
};

function createContext() {
  return {
    echo: createInitialEchoPersonality(),
    progression: createInitialProgression(
      CONTENT_MANIFEST.contentVersion,
      CHAPTER_DEFINITIONS,
    ),
    narrative: createInitialNarrativeState(),
    cinematic: createInitialCinematicState(),
  };
}

describe('Anime cinematic scene system', () => {
  it('keeps the authored cinematic registry empty and editor-ready', () => {
    assert.doesNotThrow(validateCinematicContentRegistry);
    assert.equal(CINEMATIC_COUNTS.cinematicEpisodes, 0);
    assert.equal(CINEMATIC_COUNTS.cinematicScenes, 0);
    assert.equal(CONTENT_MANIFEST.capacity.cinematics, 500);
  });

  it('supports Japanese voice cues with Arabic subtitles', () => {
    const opening = episode.scenes[0];
    const dialogue = opening.timeline[0];
    assert.equal(dialogue.kind, 'dialogue');
    if (dialogue.kind !== 'dialogue') return;
    assert.equal(dialogue.voice.locale, 'ja-JP');
    assert.equal(dialogue.subtitles.ar, 'ترجمة اختبارية');
  });

  it('compiles camera, expression, subtitle and audio timelines off-store', () => {
    const opening = episode.scenes[0];
    const frame = compileCinematicFrame(opening, 1_000, 'ar');
    assert.equal(frame.camera.zoom, 1.25);
    assert.equal(frame.camera.focus.x, 0.5);
    assert.equal(frame.dialogue?.subtitle, 'ترجمة اختبارية');
    assert.equal(frame.characters[0]?.expressionId, 'expression_uncertain');
    assert.deepEqual(getAudioCuesBetween(opening, 0, 1_000).map(
      (cue) => cue.id,
    ), ['cue_test_music']);
    assert.deepEqual(collectCinematicSceneAssetIds(opening).sort(), [
      'asset_test_music',
      'asset_test_pose',
      'asset_test_voice',
    ]);
  });

  it('branches choice scenes through the shared Decision Ledger', () => {
    const initial = createContext();
    const started = startCinematicEpisode(episode, initial, 100);
    assert.equal(started.cinematic.activeSceneId, 'scene_test_open');

    const atChoice = completeCinematicScene(episode, {
      ...initial,
      ...started,
    }, 200);
    assert.equal(atChoice.cinematic.status, 'awaitingChoice');
    assert.equal(
      atChoice.cinematic.awaitingDecisionId,
      'cinematic:test-decision',
    );

    const beforeTrust = atChoice.echo.trust;
    const selected = chooseCinematicOption(episode, 'trust', {
      ...initial,
      ...atChoice,
    }, 300);
    assert.equal(selected.cinematic.activeSceneId, 'scene_test_end');
    assert.equal(selected.echo.trust, beforeTrust + 10);
    assert.equal(
      selected.narrative.latestDecisions['cinematic:test-decision'],
      'trust',
    );
    assert.equal(
      selected.narrative.decisionHistory.at(-1)?.source,
      'cinematic',
    );

    const completed = completeCinematicScene(episode, {
      ...initial,
      ...selected,
    }, 400);
    assert.equal(completed.cinematic.status, 'completed');
    assert.ok(completed.cinematic.completedEpisodeIds.includes(episode.id));
  });

  it('pauses playback without writing frame time into game state', () => {
    const playing = {
      ...createInitialCinematicState(),
      status: 'playing' as const,
      currentSceneStartedAt: 100,
    };
    const paused = pauseCinematic(playing);
    assert.equal(paused.status, 'paused');
    assert.equal(paused.currentSceneStartedAt, 100);
    assert.equal(resumeCinematic(paused).status, 'playing');
  });

  it('migrates older saves to the cinematic checkpoint state', () => {
    const migrated = migrateGameState({}, 7);
    assert.equal(migrated.cinematic?.status, 'idle');
    assert.equal(migrated.cinematic?.preferences.voiceLocale, 'ja-JP');
    assert.equal(migrated.cinematic?.preferences.subtitleLocale, 'ar');
  });
});
