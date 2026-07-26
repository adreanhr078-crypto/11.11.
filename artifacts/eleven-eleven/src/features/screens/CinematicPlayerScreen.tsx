import { useEffect, useMemo, useState } from 'react';
import {
  Captions,
  Check,
  Clapperboard,
  LockKeyhole,
  Pause,
  Play,
  Volume2,
  X,
} from 'lucide-react';
import { useGameStore } from '../../stores/gameStore';
import {
  ChoiceCard,
  GameButton,
  GameProgress,
  GlassPanel,
} from '../../ui/design-system';
import {
  getCinematicLibraryReadModel,
  getCinematicPlaybackReadModel,
} from '../../application/cinematics/cinematicReadModel';
import {
  compileCinematicFrame,
} from '../../domain/cinematics/cinematicTimeline';
import {
  CINEMATIC_ASSET_DEFINITIONS,
} from '../../infrastructure/content/cinematicContentRegistry';
import {
  EchoPresence,
  ENVIRONMENT_PRESENTATION_ASSETS,
} from '../../ui/presentation';

function assetSource(assetId: string | undefined): string | undefined {
  if (!assetId) return undefined;
  const asset = CINEMATIC_ASSET_DEFINITIONS.find(
    (candidate) => candidate.id === assetId,
  );
  return asset?.sources.web ?? asset?.sources.android;
}

function formatTime(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function CinematicPlayerScreen() {
  const state = useGameStore();
  const [clock, setClock] = useState(() => Date.now());
  const playback = useMemo(
    () => getCinematicPlaybackReadModel(state, clock),
    [clock, state],
  );
  const library = useMemo(
    () => getCinematicLibraryReadModel(state),
    [state],
  );

  useEffect(() => {
    if (state.cinematic.status !== 'playing') return;
    let requestId = 0;
    const tick = () => {
      setClock(Date.now());
      requestId = window.requestAnimationFrame(tick);
    };
    requestId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(requestId);
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
      <div className="cinematic-library" dir="rtl">
        <div
          className="cinematic-library__world"
          style={{
            backgroundImage: `url("${ENVIRONMENT_PRESENTATION_ASSETS.memoryLaboratory}")`,
          }}
          aria-hidden="true"
        >
          <span className="cinematic-library__camera-drift" />
          <span className="cinematic-library__light" />
          <EchoPresence
            className="cinematic-library__echo"
            variant="hero"
            eager
          />
        </div>

        <header className="cinematic-library__hud gds-safe-area">
          <span className="shell-screen-code">04</span>
          <span>
            <small>CINEMATIC PLAYER</small>
            <strong>المشاهد</strong>
          </span>
          <div>
            <span><Volume2 aria-hidden="true" /> صوت ياباني</span>
            <span><Captions aria-hidden="true" /> ترجمة عربية</span>
          </div>
        </header>

        <GlassPanel
          className="cinematic-library__intro"
          tone="danger"
          eyebrow="11:11 ANIME EPISODES"
        >
          <Clapperboard aria-hidden="true" />
          <h1>
            {library.hasAuthoredEpisodes
              ? 'اختر الحلقة التي تريد متابعتها'
              : 'المسرح السينمائي جاهز'}
          </h1>
          <p>
            {library.hasAuthoredEpisodes
              ? 'المشاهد المتاحة تتغير بحسب تقدم القصة والقرارات السابقة.'
              : 'ستظهر حلقات القصة هنا عند إضافة المشاهد إلى ملفات المحتوى.'}
          </p>
          {!library.hasAuthoredEpisodes && (
            <small>لا توجد حلقات قصصية مضافة حاليًا.</small>
          )}
        </GlassPanel>

        {library.hasAuthoredEpisodes && (
          <section
            className="cinematic-library__episodes gds-safe-area"
            aria-label="حلقات القصة"
          >
            {library.episodes.map((item) => (
              <button
                key={item.episode.id}
                type="button"
                data-locked={!item.unlocked}
                data-completed={item.completed}
                disabled={!item.unlocked}
                onClick={() => (
                  state.actions.startCinematicEpisode(item.episode.id)
                )}
              >
                <span className="cinematic-library__episode-number">
                  {item.unlocked
                    ? `EP ${String(item.episode.episodeNumber).padStart(2, '0')}`
                    : <LockKeyhole aria-hidden="true" />}
                </span>
                <span>
                  <strong>
                    {item.unlocked ? item.episode.title.ar : 'حلقة مقفلة'}
                  </strong>
                  <small>
                    {item.unlocked
                      ? item.episode.description.ar
                      : 'تابع القصة لفتح هذا المشهد'}
                  </small>
                </span>
                {item.completed ? (
                  <Check aria-label="مكتملة" />
                ) : item.unlocked ? (
                  <Play aria-label="تشغيل" />
                ) : null}
              </button>
            ))}
          </section>
        )}
      </div>
    );
  }

  const background = frame.backgrounds
    .slice()
    .sort((left, right) => left.depth - right.depth)[0];
  const isPaused = state.cinematic.status === 'paused';
  const elapsed = Math.min(
    playback.elapsedFromCheckpointMs,
    playback.scene.durationMs,
  );

  return (
    <div
      className="cinematic-player"
      dir="rtl"
      data-status={state.cinematic.status}
      data-effects={frame.effects.map((effect) => effect.effect).join(' ')}
    >
      <div
        className="cinematic-player__world"
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
        <span className="cinematic-player__grade" aria-hidden="true" />
        {frame.characters.length === 0 && (
          <EchoPresence
            className="cinematic-player__echo"
            variant="hero"
            eager
          />
        )}
        {frame.characters.map((character) => (
          <div
            key={character.characterId}
            className="cinematic-player__character"
            data-expression={character.expressionId}
            style={{
              insetInlineStart: `${character.position.x * 100}%`,
              top: `${character.position.y * 100}%`,
              zIndex: character.layer,
              transform: `translate(50%, -100%) scale(${character.scale})`,
              backgroundImage: character.poseAssetId
                ? `url("${assetSource(character.poseAssetId)}")`
                : undefined,
            }}
          />
        ))}
      </div>

      <header className="cinematic-player__hud gds-safe-area">
        <span className="shell-screen-code">04</span>
        <span>
          <small>
            الحلقة {playback.episode.episodeNumber}
          </small>
          <strong>{playback.episode.title.ar}</strong>
        </span>
        <div>
          <span><Volume2 aria-hidden="true" /> 日本語</span>
          <span><Captions aria-hidden="true" /> العربية</span>
          <GameButton
            variant="ghost"
            size="icon"
            onClick={() => (
              isPaused
                ? state.actions.resumeCinematic()
                : state.actions.pauseCinematic()
            )}
            aria-label={isPaused ? 'متابعة المشهد' : 'إيقاف المشهد مؤقتًا'}
          >
            {isPaused ? <Play /> : <Pause />}
          </GameButton>
          <GameButton
            variant="ghost"
            size="icon"
            onClick={() => state.actions.stopCinematic()}
            aria-label="الخروج من المشهد"
          >
            <X />
          </GameButton>
        </div>
      </header>

      {frame.dialogue && state.cinematic.preferences.subtitlesEnabled && (
        <GlassPanel
          className="cinematic-player__subtitle"
          tone="danger"
          eyebrow={frame.dialogue.speakerId.replace(/^character_/, '')}
        >
          <p>{frame.dialogue.subtitle}</p>
        </GlassPanel>
      )}

      <div className="cinematic-player__timeline gds-safe-area">
        <time>{formatTime(elapsed)}</time>
        <GameProgress
          value={frame.progress * 100}
          tone="rare"
          showValue={false}
        />
        <time>{formatTime(playback.scene.durationMs)}</time>
      </div>

      {state.cinematic.status === 'awaitingChoice' && (
        <section className="cinematic-player__choices gds-safe-area">
          <header>
            <small>قرار قصصي</small>
            <h2>{playback.scene.choice?.prompt.ar}</h2>
          </header>
          <div>
            {playback.availableChoices.map((choice, index) => (
              <ChoiceCard
                key={choice.id}
                index={index + 1}
                title={choice.text.ar}
                tone={index === 0 ? 'danger' : 'memory'}
                consequence="سيؤثر هذا الاختيار في المشاهد التالية"
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
          className="cinematic-player__continue"
          size="lg"
          onClick={() => state.actions.completeCinematicScene()}
        >
          متابعة
        </GameButton>
      )}
    </div>
  );
}
