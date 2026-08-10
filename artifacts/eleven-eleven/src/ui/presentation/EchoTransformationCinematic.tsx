import { useEffect, useMemo, useState } from 'react';
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
  const markSeen = useGameStore(
    (state) => state.actions.markEchoTransformationIntroSeen,
  );
  const motion = useUiPreferencesStore((state) => state.motion);
  const [activeStageId, setActiveStageId] = useState<string | null>(null);
  const [videoFailed, setVideoFailed] = useState(false);

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
    setVideoFailed(false);
  }, [activeStageId]);

  useEffect(() => {
    if (!activeStageId) return undefined;
    const duration = motion === 'reduced'
      ? 1_200
      : activeStageId === 'black_coronation'
        ? 9_500
        : 5_800;
    const timer = window.setTimeout(() => {
      markSeen(activeStageId);
      setActiveStageId(null);
    }, duration);
    return () => window.clearTimeout(timer);
  }, [activeStageId, markSeen, motion]);

  useEffect(() => {
    if (!activeStageId) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      markSeen(activeStageId);
      setActiveStageId(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
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
      aria-label={`Echo transformation: ${getDisplayLabel(stage.stageId)}`}
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
        <strong>ECHO TRANSFORMATION</strong>
        <span>{String(stage.order - 1).padStart(2, '0')} → {String(stage.order).padStart(2, '0')}</span>
      </header>

      <div className="echo-transformation-cinematic__state">
        <small>STATE UPDATE</small>
        <strong>{getPreviousLabel(stage.stageId)}</strong>
        <i aria-hidden="true">→</i>
        <strong data-emphasis="true">{getDisplayLabel(stage.stageId)}</strong>
      </div>

      <GameButton
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
