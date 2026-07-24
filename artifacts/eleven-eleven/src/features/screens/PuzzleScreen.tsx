import { useMemo, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import {
  GameButton,
  GameProgress,
  GlassPanel,
  HudPanel,
} from '../../ui/design-system';
import { createPuzzleScreenReadModel } from '../../application/ui/gameUiReadModels';

interface Feedback {
  tone: 'success' | 'danger' | 'memory';
  message: string;
}

export default function PuzzleScreen() {
  const state = useGameStore();
  const model = useMemo(() => createPuzzleScreenReadModel(state), [state]);
  const [answer, setAnswer] = useState('');
  const [hint, setHint] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const puzzle = model.activePuzzle;
  const chapterProgress = model.totalInChapter > 0
    ? (model.solvedInChapter / model.totalInChapter) * 100
    : 0;

  const submitAnswer = () => {
    if (!puzzle || !answer.trim()) return;
    const result = state.actions.solve(puzzle.id, answer.trim());
    setFeedback({
      tone: result.success ? 'success' : 'danger',
      message: result.message,
    });
    if (result.success) {
      setAnswer('');
      setHint(null);
    }
  };

  const requestHint = () => {
    if (!puzzle) return;
    const result = state.actions.buyHint(puzzle.id);
    setFeedback({
      tone: result.success ? 'memory' : 'danger',
      message: result.message,
    });
    if (result.success) setHint(result.hint ?? puzzle.hint);
  };

  const skipPuzzle = () => {
    if (!puzzle) return;
    const result = state.actions.skipPuzzle(puzzle.id);
    setFeedback({
      tone: result.success ? 'memory' : 'danger',
      message: result.message,
    });
    if (result.success) {
      setAnswer('');
      setHint(null);
    }
  };

  return (
    <div className="shell-screen shell-puzzle-screen">
      <header className="shell-screen-heading">
        <span className="shell-screen-code">04</span>
        <span>
          <small>RECONSTRUCTION CHAMBER</small>
          <h1>إعادة بناء الذاكرة</h1>
        </span>
        <div className="shell-screen-heading__metrics">
          <span>{model.currentChapterId}</span>
          <span>{model.solvedInChapter}/{model.totalInChapter}</span>
        </div>
      </header>

      <HudPanel
        className="shell-puzzle-screen__workspace"
        tone="danger"
        eyebrow={puzzle?.id ?? 'NO ACTIVE SIGNAL'}
        title={puzzle?.title ?? 'لا يوجد لغز نشط'}
      >
        <div className="shell-puzzle-visual" aria-hidden="true">
          <span className="shell-puzzle-visual__grid">
            {Array.from({ length: 16 }, (_, index) => (
              <i key={index} data-active={index < model.solvedInChapter % 16} />
            ))}
          </span>
          <strong>{puzzle ? `${puzzle.difficulty}/5` : '—'}</strong>
          <small>DIFFICULTY</small>
        </div>

        <div className="shell-puzzle-screen__challenge">
          {puzzle ? (
            <>
              <p>{puzzle.question}</p>
              <label className="shell-game-input">
                <span>أدخل الإجابة أو استكشف النمط</span>
                <input
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') submitAnswer();
                  }}
                  autoComplete="off"
                  enterKeyHint="done"
                />
              </label>
              {hint && (
                <GlassPanel tone="memory" title="إشارة ذاكرة">
                  <p>{hint}</p>
                </GlassPanel>
              )}
              {feedback && (
                <p className="shell-feedback" data-tone={feedback.tone}>
                  {feedback.message}
                </p>
              )}
              <div className="shell-puzzle-screen__actions">
                <GameButton
                  size="lg"
                  onClick={submitAnswer}
                  disabled={!answer.trim()}
                >
                  تحليل الإجابة
                </GameButton>
                <GameButton
                  variant="memory"
                  onClick={requestHint}
                >
                  تلميح · {state.shopPrices.hintPrice}
                </GameButton>
                <GameButton
                  variant="ghost"
                  onClick={skipPuzzle}
                >
                  تخطي · {state.shopPrices.skipPrice}
                </GameButton>
              </div>
            </>
          ) : (
            <div className="shell-editor-empty shell-editor-empty--embedded">
              <span className="shell-editor-empty__glyph">⬡</span>
              <p>
                لا توجد إشارة نشطة في هذا الفصل. بقي مولّد الألغاز القديم
                محفوظاً، بينما واجهة المحتوى الجديدة جاهزة للبيانات المؤلفة.
              </p>
            </div>
          )}
        </div>
      </HudPanel>

      <GlassPanel
        className="shell-puzzle-screen__telemetry"
        tone="memory"
        title="قياسات الاستعادة"
      >
        <GameProgress
          value={chapterProgress}
          label="تقدم الفصل"
          tone="memory"
        />
        <div className="shell-puzzle-screen__economy">
          <span><strong>{state.echo.coins}</strong> عملة</span>
          <span><strong>{state.echo.crystals}</strong> بلورة</span>
          <span><strong>{state.echo.usedHints.length}</strong> تلميحات</span>
        </div>
      </GlassPanel>
    </div>
  );
}

