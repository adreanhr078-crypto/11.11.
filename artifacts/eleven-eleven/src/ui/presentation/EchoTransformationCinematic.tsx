import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useUiPreferencesStore } from '../../app/shell/shellStore';
import {
  FINAL_MANHWA_ECHO_EVOLUTION_STAGES,
} from '../../content/story/finalManhwaCanonEvents';
import { getEchoStatePresentationAssets } from './visualAssets';
import { GameButton } from '../design-system';
import { cx } from '../design-system';
import './echo-transformation-cinematic.css';

const BASE_STAGE_ID = 'awakening_fragile';
const REPLAY_EVENT = 'eleven:echo-transformation-cinematic';

export function requestEchoTransformationCinematic(stageId: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(REPLAY_EVENT, { detail: { stageId } }));
}

function getStage(stageId: string) {
  return FINAL_MANHWA_ECHO_EVOLUTION_STAGES.find((stage) => (
    stage.stageId === stageId
  ));
}

function getDisplayLabel(stageId: string): string {
  switch (stageId) {
    case 'black_coronation': return 'BLACK CORONATION';
    case 'second_contract_marked': return 'SECOND CONTRACT MARKED';
    case 'black_echo_protocol': return 'BLACK ECHO PROTOCOL';
    default: return 'ECHO';
  }
}

function getPreviousLabel(stageId: string): string {
  switch (stageId) {
    case 'black_coronation': return 'BASE ECHO';
    case 'second_contract_marked': return 'BLACK CORONATION';
    case 'black_echo_protocol': return 'SECOND CONTRACT MARKED';
    default: return 'BASE ECHO';
  }
}

export function EchoTransformationCinematic() {
  const stageId = useGameStore((state) => (
    state.progressionState.evolution.currentStageId
  ));
  const seen = useGameStore((state) => (
    state.progressionState.evolution.transformationIntroSeen ?? []
  ));
  const reachedStageIds = useGameStore((state) => (
    state.progressionState.evolution.reachedStageIds
  ));
  const markSeen = useGameStore(
    (state) => state.actions.markEchoTransformationIntroSeen,
  );
  const motion = useUiPreferencesStore((state) => state.motion);
  const [activeStageId, setActiveStageId] = useState<string | null>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const skipButtonRef = useRef<HTMLButtonElement | null>(null);

  const stage = useMemo(
    () => getStage(activeStageId ?? ''),
    [activeStageId],
  );
  const assets = stage
    ? getEchoStatePresentationAssets(stage.stageId)
    : null;

  useEffect(() => {
    if (
      stageId === BASE_STAGE_ID
      || !getStage(stageId)
      || seen.includes(stageId)
    ) {
      setActiveStageId(null);
      return;
    }
    setActiveStageId(stageId);
  }, [seen, stageId]);

  useEffect(() => {
    const replay = (event: Event) => {
      const requestedStageId = (event as CustomEvent<{ stageId?: unknown }>).detail?.stageId;
      if (
        typeof requestedStageId !== 'string'
        || !getStage(requestedStageId)
        || !reachedStageIds.includes(requestedStageId)
      ) return;
      setActiveStageId(requestedStageId);
    };
    window.addEventListener(REPLAY_EVENT, replay);
    return () => window.removeEventListener(REPLAY_EVENT, replay);
  }, [reachedStageIds]);

  useEffect(() => {
    setVideoFailed(false);
  }, [activeStageId]);

  useEffect(() => {
    if (!activeStageId) return undefined;
    if (motion === 'reduced') return undefined;
    const duration = activeStageId === 'black_coronation' ? 9_500 : 5_800;
    const timer = window.setTimeout(() => {
      markSeen(activeStageId);
      setActiveStageId(null);
    }, duration);
    return () => window.clearTimeout(timer);
  }, [activeStageId, markSeen, motion]);

  useEffect(() => {
    if (!activeStageId) return undefined;
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const focusTimer = window.setTimeout(() => skipButtonRef.current?.focus(), 40);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        event.preventDefault();
        skipButtonRef.current?.focus();
      }
      if (event.key === 'Escape') {
        markSeen(activeStageId);
        setActiveStageId(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus();
    };
  }, [activeStageId, markSeen]);

  if (!stage || !assets) return null;

  const reducedMotion = motion === 'reduced';
  const useApprovedVideo = Boolean(assets.transitionVideo)
    && !reducedMotion
    && !videoFailed;

  return (
    <section
      className={cx('echo-transformation-cinematic', `echo-transformation-cinematic--${stage.stageId}`)}
      data-motion={motion}
      role="dialog"
      aria-modal="true"
      aria-labelledby="echo-transformation-title"
    >
      <div className="echo-transformation-cinematic__scan" aria-hidden="true" />
      <div className="echo-transformation-cinematic__world" aria-hidden="true">
        {useApprovedVideo ? (
          <video
            className="echo-transformation-cinematic__video"
            src={assets.transitionVideo}
            poster={assets.portrait}
            autoPlay
            muted
            playsInline
            onError={() => setVideoFailed(true)}
            onEnded={() => {
              markSeen(stage.stageId);
              setActiveStageId(null);
            }}
          />
        ) : !reducedMotion && assets.transitionFrames?.length ? (
          <div className="echo-transformation-cinematic__sequence" aria-hidden="true">
            {assets.transitionFrames.map((frame, index) => (
              <img key={frame} src={frame} alt="" style={{ '--frame-index': index } as CSSProperties} />
            ))}
          </div>
        ) : (
          <img
            className="echo-transformation-cinematic__portrait"
            src={assets.portrait}
            alt=""
            draggable={false}
            decoding="async"
          />
        )}
        <span className="echo-transformation-cinematic__veil" />
        <span className="echo-transformation-cinematic__reticle" />
      </div>

      <header className="echo-transformation-cinematic__header">
        <small>11:11 // CANON EVENT VERIFIED</small>
        <strong id="echo-transformation-title">ECHO TRANSFORMATION</strong>
        <span>{String(stage.order - 1).padStart(2, '0')} → {String(stage.order).padStart(2, '0')}</span>
      </header>

      <div className="echo-transformation-cinematic__state">
        <small>STATE UPDATE</small>
        <strong>{getPreviousLabel(stage.stageId)}</strong>
        <i aria-hidden="true">→</i>
        <strong data-emphasis="true">{getDisplayLabel(stage.stageId)}</strong>
      </div>

      <GameButton
        ref={skipButtonRef}
        className="echo-transformation-cinematic__skip"
        variant="secondary"
        onClick={() => {
          markSeen(stage.stageId);
          setActiveStageId(null);
        }}
      >
        تخطي العرض
      </GameButton>
    </section>
  );
}
