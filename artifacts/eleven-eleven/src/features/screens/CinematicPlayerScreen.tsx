import { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import {
  ChoiceCard,
  GameButton,
  GameProgress,
  GlassPanel,
} from '../../ui/design-system';
import {
  getCinematicPlaybackReadModel,
} from '../../application/cinematics/cinematicReadModel';
import {
  compileCinematicFrame,
} from '../../domain/cinematics/cinematicTimeline';
import {
  CINEMATIC_ASSET_DEFINITIONS,
  CINEMATIC_EPISODE_DEFINITIONS,
} from '../../infrastructure/content/cinematicContentRegistry';
import {
  EchoPresence,
  ENVIRONMENT_PRESENTATION_ASSETS,
} from '../../ui/presentation';
import { GameIcon } from '../../ui/icons';

function assetSource(assetId: string | undefined): string | undefined {
  if (!assetId) return undefined;
  const asset = CINEMATIC_ASSET_DEFINITIONS.find(
    (candidate) => candidate.id === assetId,
  );
  return asset?.sources.web ?? asset?.sources.android;
}

export default function CinematicPlayerScreen() {
  const state = useGameStore();
  const [clock, setClock] = useState(() => Date.now());
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const playback = useMemo(
    () => getCinematicPlaybackReadModel(state, clock),
    [clock, state],
  );

  useEffect(() => {
    if (state.cinematic.status !== 'playing') return;
    let frame = 0;
    const tick = () => {
      setClock(Date.now());
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [state.cinematic.status]);

  const frame = playback
    ? compileCinematicFrame(
      playback.scene,
      playback.elapsedFromCheckpointMs,
      state.cinematic.preferences.subtitleLocale,
    )
    : null;

  useEffect(() => {
    if (
      !playback
      || !frame
      || state.cinematic.status !== 'playing'
      || !state.cinematic.preferences.autoAdvance
      || !['timeline', 'voice'].includes(playback.scene.advanceMode)
      || frame.progress < 1
    ) return;
    state.actions.completeCinematicScene();
  }, [
    frame?.progress,
    playback?.scene.id,
    playback?.scene.advanceMode,
    state.actions,
    state.cinematic.preferences.autoAdvance,
    state.cinematic.status,
  ]);

  if (!playback || !frame) {
    return (
      <div
        className="core5-cinematic-preview"
        data-preview-playing={previewPlaying}
      >
        <div
          className="core5-cinematic-preview__world"
          style={{
            backgroundImage: `url("${ENVIRONMENT_PRESENTATION_ASSETS.memoryLaboratory}")`,
          }}
          aria-hidden="true"
        >
          <span className="core5-cinematic-preview__camera-layer" />
          <span className="core5-cinematic-preview__light-layer" />
          <EchoPresence
            className="core5-cinematic-preview__echo"
            variant="hero"
            eager
          />
        </div>

        <header className="core5-cinematic-preview__hud">
          <span className="shell-screen-code">02</span>
          <span>
            <small>ANIME EPISODE RUNTIME</small>
            <strong>المشهد السينمائي</strong>
          </span>
          <div>
            <span>日本語 VO</span>
            <span>العربية SUB</span>
            <GameButton
              variant="ghost"
              size="sm"
              onClick={() => setPreviewPlaying((playing) => !playing)}
            >
              {previewPlaying ? 'إيقاف' : 'معاينة'}
            </GameButton>
          </div>
        </header>

        <aside className="core5-cinematic-preview__channels">
          <header>
            <small>SCENE CHANNELS</small>
            <strong>المسارات</strong>
          </header>
          {[
            ['CAM', 'الكاميرا'],
            ['VO', 'الصوت الياباني'],
            ['SUB', 'الترجمة العربية'],
            ['BGM', 'الموسيقى'],
          ].map(([code, label]) => (
            <button key={code} type="button">
              <i>{code}</i>
              <span>{label}</span>
            </button>
          ))}
        </aside>

        <aside className="core5-cinematic-preview__telemetry">
          <header>
            <small>SCENE TELEMETRY</small>
            <strong>بيانات المشهد</strong>
          </header>
          <dl>
            <div><dt>SCENE</dt><dd>SCENE_SLOT_00</dd></div>
            <div><dt>CAMERA</dt><dd>CAMERA_IDLE</dd></div>
            <div><dt>EXPRESSION</dt><dd>EXPR_PENDING</dd></div>
            <div><dt>VOICE</dt><dd>VOICE_JP_PENDING</dd></div>
          </dl>
          <div className="core5-cinematic-preview__audio">
            {Array.from({ length: 18 }, (_, index) => (
              <i key={index} />
            ))}
          </div>
        </aside>

        <GlassPanel
          className="core5-cinematic-preview__subtitle"
          tone="danger"
          eyebrow="ECHO // VOICE PLACEHOLDER"
        >
          <p>بانتظار بيانات الحوار والترجمة العربية للمشهد.</p>
          <small>字幕 // AR-SA · 音声 // JA-JP</small>
        </GlassPanel>

        <div className="core5-cinematic-preview__timeline">
          <GameButton
            variant={previewPlaying ? 'danger' : 'secondary'}
            size="sm"
            onClick={() => setPreviewPlaying((playing) => !playing)}
            aria-label={previewPlaying ? 'إيقاف المعاينة' : 'تشغيل المعاينة'}
          >
            <GameIcon
              id={previewPlaying ? 'utility-pause' : 'utility-resume'}
            />
          </GameButton>
          <span className="core5-cinematic-preview__track">
            <i />
          </span>
          <time>00:00 / --:--</time>
        </div>

        <section className="core5-cinematic-preview__episodes" aria-label="الحلقات">
          {CINEMATIC_EPISODE_DEFINITIONS.length > 0 ? (
            CINEMATIC_EPISODE_DEFINITIONS.slice(0, 4).map((episode) => (
              <button
                key={episode.id}
                type="button"
                onClick={() => state.actions.startCinematicEpisode(episode.id)}
              >
                <span>EP {String(episode.episodeNumber).padStart(2, '0')}</span>
                <strong>{episode.title.ar}</strong>
              </button>
            ))
          ) : (
            Array.from({ length: 4 }, (_, index) => (
              <button key={index} type="button" disabled>
                <span>EP —</span>
                <strong>EPISODE_SLOT_{String(index + 1).padStart(2, '0')}</strong>
              </button>
            ))
          )}
        </section>

        <p className="core5-cinematic-preview__editor-note">
          <span>EDITOR READY</span>
          أضف الحلقات إلى
          <code> data/cinematics/index.json </code>
        </p>
      </div>
    );
  }

  const background = frame.backgrounds
    .slice()
    .sort((left, right) => left.depth - right.depth)[0];

  return (
    <div
      className="shell-cinematic-player core5-cinematic-player"
      data-effects={frame.effects.map((effect) => effect.effect).join(' ')}
    >
      <div
        className="shell-cinematic-player__world"
        style={{
          transform: `scale(${frame.camera.zoom}) rotate(${frame.camera.rotation}deg)`,
          transformOrigin: `${frame.camera.focus.x * 100}% ${frame.camera.focus.y * 100}%`,
          backgroundImage: `url("${
            background
              ? assetSource(background.assetId)
              : ENVIRONMENT_PRESENTATION_ASSETS.memoryLaboratory
          }")`,
        }}
      >
        {!background && <span className="shell-cinematic-player__placeholder" />}
        {frame.characters.length === 0 && (
          <EchoPresence
            className="core5-cinematic-player__echo"
            variant="hero"
            eager
          />
        )}
        {frame.characters.map((character) => (
          <div
            key={character.characterId}
            className="shell-cinematic-character"
            data-expression={character.expressionId}
            style={{
              insetInlineStart: `${character.position.x * 100}%`,
              top: `${character.position.y * 100}%`,
              zIndex: character.layer,
              transform: `translate(-50%, -100%) scale(${character.scale})`,
              backgroundImage: character.poseAssetId
                ? `url("${assetSource(character.poseAssetId)}")`
                : undefined,
            }}
          />
        ))}
      </div>

      <header className="shell-cinematic-player__hud gds-safe-area">
        <span className="shell-screen-code">02</span>
        <span>
          <small>EP {playback.episode.episodeNumber}</small>
          <strong>{playback.episode.title.ar}</strong>
        </span>
        <div className="shell-cinematic-player__controls">
          <GameButton
            variant="ghost"
            size="sm"
            onClick={() => (
              state.cinematic.status === 'paused'
                ? state.actions.resumeCinematic()
                : state.actions.pauseCinematic()
            )}
          >
            {state.cinematic.status === 'paused' ? 'متابعة' : 'إيقاف'}
          </GameButton>
          <GameButton
            variant="ghost"
            size="sm"
            onClick={() => state.actions.stopCinematic()}
          >
            خروج
          </GameButton>
        </div>
      </header>

      <div className="shell-cinematic-player__progress gds-safe-area">
        <GameProgress
          value={frame.progress * 100}
          tone="rare"
          showValue={false}
        />
      </div>

      {frame.dialogue && state.cinematic.preferences.subtitlesEnabled && (
        <GlassPanel
          className="shell-cinematic-player__subtitle"
          tone="danger"
          eyebrow={frame.dialogue.speakerId}
        >
          <p>{frame.dialogue.subtitle}</p>
          <small>VOICE // 日本語</small>
        </GlassPanel>
      )}

      {state.cinematic.status === 'awaitingChoice' && (
        <section className="shell-cinematic-player__choices gds-safe-area">
          <h2>{playback.scene.choice?.prompt.ar}</h2>
          <div>
            {playback.availableChoices.map((choice, index) => (
              <ChoiceCard
                key={choice.id}
                index={index + 1}
                title={choice.text.ar}
                tone={index === 0 ? 'danger' : 'memory'}
                onClick={() => state.actions.chooseCinematicChoice(choice.id)}
              />
            ))}
          </div>
        </section>
      )}

      {(
        playback.scene.advanceMode === 'input'
        || (
          !state.cinematic.preferences.autoAdvance
          && playback.scene.advanceMode !== 'choice'
        )
      ) && frame.progress >= 1 && (
        <GameButton
          className="shell-cinematic-player__continue"
          size="lg"
          trailingIcon={<GameIcon id="utility-back" />}
          onClick={() => state.actions.completeCinematicScene()}
        >
          متابعة
        </GameButton>
      )}
    </div>
  );
}
