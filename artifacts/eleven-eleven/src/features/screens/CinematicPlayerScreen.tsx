import { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import {
  ChoiceCard,
  GameButton,
  GameCard,
  GameProgress,
  GlassPanel,
  HudPanel,
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
import { EchoPresence } from '../../ui/presentation';

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
      <div className="shell-screen shell-cinematic-library">
        <header className="shell-screen-heading">
          <span className="shell-screen-code">02</span>
          <span>
            <small>ANIME EPISODE RUNTIME</small>
            <h1>المشاهد السينمائية</h1>
          </span>
        </header>

        <HudPanel
          className="shell-cinematic-library__stage"
          tone="rare"
          eyebrow="日本語 VO // العربية SUB"
          title="مشغل الحلقات"
        >
          <EchoPresence
            className="shell-cinematic-library__echo"
            variant="mini"
            eager
          />
          <div className="shell-cinematic-core" aria-hidden="true">
            <span /><span /><span />
            <i>11:11</i>
          </div>
          <p>
            يدعم الكاميرا، تعابير الشخصيات، الخلفيات، الصوت الياباني،
            الترجمة العربية، الاسترجاعات والاختيارات المتفرعة.
          </p>
        </HudPanel>

        <section className="shell-content-grid">
          {CINEMATIC_EPISODE_DEFINITIONS.map((episode) => (
            <GameCard
              key={episode.id}
              tone="rare"
              overline={`EPISODE ${String(episode.episodeNumber).padStart(2, '0')}`}
              title={episode.title.ar}
              description={episode.description.ar}
              footer={(
                <GameButton
                  variant="rare"
                  size="sm"
                  onClick={() => state.actions.startCinematicEpisode(episode.id)}
                >
                  تشغيل الحلقة
                </GameButton>
              )}
            />
          ))}
        </section>

        {CINEMATIC_EPISODE_DEFINITIONS.length === 0 && (
          <GlassPanel
            className="shell-editor-empty"
            tone="neutral"
            title="لا توجد حلقات منشورة"
          >
            <span className="shell-editor-empty__glyph">◇</span>
            <p>
              النظام جاهز. أضف الحلقات والمشاهد إلى
              <code> data/cinematics/index.json </code>
              بدون تعديل TypeScript.
            </p>
          </GlassPanel>
        )}
      </div>
    );
  }

  const background = frame.backgrounds
    .slice()
    .sort((left, right) => left.depth - right.depth)[0];

  return (
    <div
      className="shell-cinematic-player"
      data-effects={frame.effects.map((effect) => effect.effect).join(' ')}
    >
      <div
        className="shell-cinematic-player__world"
        style={{
          transform: `scale(${frame.camera.zoom}) rotate(${frame.camera.rotation}deg)`,
          transformOrigin: `${frame.camera.focus.x * 100}% ${frame.camera.focus.y * 100}%`,
          backgroundImage: background
            ? `url("${assetSource(background.assetId)}")`
            : undefined,
        }}
      >
        {!background && <span className="shell-cinematic-player__placeholder" />}
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
          trailingIcon="←"
          onClick={() => state.actions.completeCinematicScene()}
        >
          متابعة
        </GameButton>
      )}
    </div>
  );
}
