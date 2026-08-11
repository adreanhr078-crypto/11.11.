import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { CoopRole } from '../../domain/echo-network/contracts';
import {
  COOP_CASES,
  COOP_CASE_BY_ID,
  COOP_TRAINING_CASE_ID,
  type CoopCasePublicDefinition,
  type CoopMechanic,
  type CoopStagePublicDefinition,
} from '../../domain/echo-network/coopCaseCatalog';
import {
  COOP_TRAINING_ANSWERS,
  coopTrainingClue,
} from '../../domain/echo-network/coopTrainingCase';
import type { NetworkEligibilitySnapshot } from '../../infrastructure/echo-network/echoNetworkApi';
import { GameButton, GameProgress, GlassPanel, HudPanel } from '../../ui/design-system';
import { useRealtimeRoom } from './useRealtimeRoom';

const ROLE_LABELS: Record<CoopRole, { ar: string; en: string }> = {
  memory: { ar: 'الذاكرة', en: 'Memory' },
  cipher: { ar: 'الشيفرة', en: 'Cipher' },
  route: { ar: 'المسار', en: 'Route' },
  anchor: { ar: 'المرساة', en: 'Anchor' },
};

const MECHANIC_LABELS: Record<CoopMechanic, string> = {
  'image-reconstruction': 'تركيب شظية بصرية',
  wiring: 'توصيل قنوات',
  cipher: 'فك شيفرة',
  evidence: 'مطابقة أدلة',
  timeline: 'ترتيب زمني',
  routing: 'توجيه بيانات',
  'load-balance': 'موازنة حمل',
  pattern: 'مسح نمط',
};

function MechanicChoiceBoard({
  stage,
  imageSrc,
  selected,
  onSelect,
  disabled,
}: {
  stage: CoopStagePublicDefinition;
  imageSrc: string;
  selected: string | null;
  onSelect: (optionId: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="coop-mechanic" data-mechanic={stage.mechanic}>
      <div className="coop-mechanic__visual" aria-hidden="true">
        {stage.mechanic === 'image-reconstruction' ? (
          <div className="coop-memory-mosaic">
            {Array.from({ length: 9 }, (_, index) => (
              <i
                key={index}
                style={{
                  backgroundImage: `url(${imageSrc})`,
                  backgroundPosition: `${(index % 3) * 50}% ${Math.floor(index / 3) * 50}%`,
                }}
              />
            ))}
          </div>
        ) : stage.mechanic === 'wiring' || stage.mechanic === 'routing' ? (
          <svg viewBox="0 0 420 130" role="img">
            <path d="M34 25 C120 25 108 105 210 65 S325 18 388 35" />
            <path d="M34 65 C140 65 115 18 210 45 S320 110 388 96" />
            <path d="M34 105 C130 105 130 75 210 86 S315 64 388 65" />
            {[34, 210, 388].flatMap((x) => [25, 65, 105].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="7" />))}
          </svg>
        ) : stage.mechanic === 'cipher' ? (
          <div className="coop-cipher-ring"><i>11</i><i>ECHO</i><i>Δ</i><strong>?</strong></div>
        ) : stage.mechanic === 'timeline' ? (
          <div className="coop-timeline"><i>01</i><span /><i>07</i><span /><i>11</i><span /><strong>?</strong></div>
        ) : stage.mechanic === 'load-balance' ? (
          <div className="coop-load-bars"><i style={{ '--load': '72%' } as CSSProperties} /><i style={{ '--load': '48%' } as CSSProperties} /><i style={{ '--load': '88%' } as CSSProperties} /></div>
        ) : stage.mechanic === 'evidence' ? (
          <div className="coop-evidence-stack"><i>CANON</i><i>11:11</i><i>TRACE</i></div>
        ) : (
          <div className="coop-pattern-grid">{Array.from({ length: 16 }, (_, index) => <i key={index} data-lit={[0, 1, 4, 5, 10, 11, 14, 15].includes(index) || undefined} />)}</div>
        )}
      </div>
      <div className="coop-mechanic__choices" role="radiogroup" aria-label={stage.objective.ar}>
        {stage.optionIds.map((optionId, index) => {
          const label = stage.optionLabels[optionId];
          return (
            <button
              type="button"
              role="radio"
              key={optionId}
              aria-checked={selected === optionId}
              data-selected={selected === optionId || undefined}
              onClick={() => onSelect(optionId)}
              disabled={disabled}
            >
              <i aria-hidden="true">{String(index + 1).padStart(2, '0')}</i>
              <strong>{label?.ar ?? optionId}</strong>
              <small>{label?.en ?? optionId}</small>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TrainingBreach({
  completed,
  onComplete,
}: {
  completed: boolean;
  onComplete: () => Promise<void>;
}) {
  const definition = COOP_CASE_BY_ID[COOP_TRAINING_CASE_ID]!;
  const [stageIndex, setStageIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [echoLinked, setEchoLinked] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const finished = stageIndex >= definition.stages.length;
  const stage = definition.stages[Math.min(stageIndex, definition.stages.length - 1)]!;
  const userRoles: CoopRole[] = ['memory', 'route'];
  const echoRoles: CoopRole[] = ['cipher', 'anchor'];

  const submit = () => {
    if (!selected || !echoLinked || finished) return;
    if (selected !== COOP_TRAINING_ANSWERS[stageIndex]) {
      setFeedback('الإجابة لا تطابق مجموع الاستبعادات. راجع قناتك وقناة Echo.');
      return;
    }
    setFeedback(stageIndex === definition.stages.length - 1
      ? 'اكتمل الاختراق التدريبي. لا توجد مكافأة خادمية لهذا التدريب.'
      : 'ثبتت المرحلة. تنتقل الأدوار الآن إلى العقدة التالية.');
    setStageIndex((value) => value + 1);
    setSelected(null);
    setEchoLinked(false);
  };

  return (
    <div className="echo-network-coop-layout">
      <div>
        <div className="coop-case-banner" style={{ backgroundImage: `url(${definition.imageSrc})` }}>
          <span><small>TRAINING CASE · CHAPTER 1</small><strong>{definition.title.ar}</strong></span>
          <i>{finished ? 'COMPLETE' : `${stageIndex + 1}/3`}</i>
        </div>
        {!finished ? (
          <>
            <header className="coop-stage-heading">
              <span>{MECHANIC_LABELS[stage.mechanic]}</span>
              <h3>{stage.objective.ar}</h3>
              <p>{stage.prompt.ar}</p>
            </header>
            <div className="coop-clue-grid">
              <div data-owner="player">
                <small>قناتك الخاصة</small>
                {userRoles.map((role) => (
                  <p key={role}><strong>{ROLE_LABELS[role].ar}</strong>{coopTrainingClue(stageIndex, role).ar}</p>
                ))}
              </div>
              <div data-owner="echo" data-locked={!echoLinked || undefined}>
                <small>قناة Echo</small>
                {echoLinked ? echoRoles.map((role) => (
                  <p key={role}><strong>{ROLE_LABELS[role].ar}</strong>{coopTrainingClue(stageIndex, role).ar}</p>
                )) : <button type="button" onClick={() => setEchoLinked(true)}>اطلب من Echo مشاركة دليله</button>}
              </div>
            </div>
            <MechanicChoiceBoard
              stage={stage}
              imageSrc={definition.imageSrc}
              selected={selected}
              onSelect={setSelected}
            />
            <GameButton fullWidth variant="memory" disabled={!selected || !echoLinked} onClick={submit}>تثبيت قرار الفريق</GameButton>
          </>
        ) : (
          <HudPanel tone="rare" eyebrow="TRAINING COMPLETE" title="Echo استعاد نمط التعاون">
            <p>جرّبت الأدلة المنقسمة، طلب المعلومات، وثلاثة أشكال تفاعل. التدريب محلي ولا يصنع مكافأة.</p>
            <GameButton
              variant="rare"
              disabled={completed || saving}
              onClick={() => {
                setSaving(true);
                void onComplete().finally(() => setSaving(false));
              }}
            >
              {completed ? 'التدريب موثّق' : saving ? 'جارٍ التوثيق…' : 'توثيق التدريب'}
            </GameButton>
          </HudPanel>
        )}
        {feedback && <p className="echo-network-callout" aria-live="polite">{feedback}</p>}
      </div>
      <HudPanel tone="memory" eyebrow="ROLE PROTOCOL" title="لماذا تحتاجون بعضكم؟">
        <p>في اللعب الحي، كل جهاز يستلم أدلة أدواره فقط. الحل النهائي يبقى داخل Worker ولا يُرسل للواجهة.</p>
        <dl className="coop-role-list">
          {Object.entries(ROLE_LABELS).map(([role, label]) => (
            <div key={role}><dt>{label.ar}</dt><dd>{role === 'memory' ? 'سجل الصورة والحدث' : role === 'cipher' ? 'المفتاح والرمز' : role === 'route' ? 'اتجاه البيانات' : 'شرط التثبيت النهائي'}</dd></div>
          ))}
        </dl>
      </HudPanel>
    </div>
  );
}

function parseOnlineCase(snapshot: Record<string, unknown> | null) {
  if (!snapshot || typeof snapshot.case !== 'object' || snapshot.case === null) return null;
  const definition = snapshot.case as CoopCasePublicDefinition;
  const state = typeof snapshot.state === 'object' && snapshot.state !== null
    ? snapshot.state as { stageIndex?: number; status?: string; version?: number; completedStages?: string[]; stageHintsUsed?: number }
    : {};
  const stageIndex = typeof state.stageIndex === 'number' ? state.stageIndex : 0;
  return {
    definition,
    state,
    stage: definition.stages[Math.min(stageIndex, definition.stages.length - 1)]!,
    clues: Array.isArray(snapshot.clues) ? snapshot.clues as Array<{ role: CoopRole; clue: { ar: string; en: string } }> : [],
    echoClues: Array.isArray(snapshot.echoClues) ? snapshot.echoClues as Array<{ role: CoopRole; clue: { ar: string; en: string }; ownerName: string }> : [],
    hints: Array.isArray(snapshot.hints) ? snapshot.hints as Array<{ ar: string; en: string }> : [],
    players: Array.isArray(snapshot.players) ? snapshot.players : [],
  };
}

export function CoopBreachPanel({
  eligibility,
  onTrainingComplete,
  onReceipt,
}: {
  eligibility: NetworkEligibilitySnapshot;
  onTrainingComplete: () => Promise<void>;
  onReceipt: () => void;
}) {
  const room = useRealtimeRoom();
  const [view, setView] = useState<'training' | 'online'>('training');
  const [selectedCase, setSelectedCase] = useState(COOP_CASES[0]!.id);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const online = parseOnlineCase(room.state.snapshot);
  const selectedDefinition = useMemo(() => COOP_CASE_BY_ID[selectedCase]!, [selectedCase]);

  useEffect(() => setSelectedAnswer(null), [online?.state.stageIndex]);
  useEffect(() => {
    if (!room.state.receipt) return;
    const timer = setTimeout(onReceipt, 1_200);
    return () => clearTimeout(timer);
  }, [onReceipt, room.state.receipt]);

  return (
    <section className="echo-network-mode" aria-labelledby="coop-title">
      <header className="echo-network-mode__heading">
        <span><small>2–4 PLAYERS · SPLIT KNOWLEDGE</small><h2 id="coop-title">اختراقات الإشارة التعاونية</h2></span>
        <div className="echo-network-segmented">
          <GameButton size="sm" variant={view === 'training' ? 'memory' : 'ghost'} onClick={() => setView('training')}>تدريب مع Echo</GameButton>
          <GameButton size="sm" variant={view === 'online' ? 'rare' : 'ghost'} onClick={() => setView('online')}>فريق حي</GameButton>
        </div>
      </header>

      {view === 'training' ? (
        <TrainingBreach completed={eligibility.coopTrainingCompleted} onComplete={onTrainingComplete} />
      ) : online && (room.state.phase === 'active' || room.state.phase === 'completed') ? (
        <div className="echo-network-coop-layout">
          <div>
            <div className="coop-case-banner" style={{ backgroundImage: `url(${online.definition.imageSrc})` }}>
              <span><small>{online.definition.chapterId.replace('_', ' ').toUpperCase()}</small><strong>{online.definition.title.ar}</strong></span>
              <i>{online.state.status === 'completed' ? 'COMPLETE' : `${(online.state.stageIndex ?? 0) + 1}/3`}</i>
            </div>
            <header className="coop-stage-heading">
              <span>{MECHANIC_LABELS[online.stage.mechanic]}</span>
              <h3>{online.stage.objective.ar}</h3>
              <p>{online.stage.prompt.ar}</p>
            </header>
            <div className="coop-clue-grid">
              <div data-owner="player">
                <small>الأدلة المرسلة لجهازك فقط</small>
                {online.clues.map(({ role, clue }) => <p key={role}><strong>{ROLE_LABELS[role].ar}</strong>{clue.ar}</p>)}
              </div>
              <div data-owner="echo">
                <small>Echo يتولى الأدوار المنقطعة</small>
                {online.echoClues.length > 0
                  ? online.echoClues.map(({ role, clue, ownerName }) => <p key={`${ownerName}-${role}`}><strong>{ownerName} · {ROLE_LABELS[role].ar}</strong>{clue.ar}</p>)
                  : <p>لا يوجد لاعب منقطع. تواصلوا بالعبارات الجاهزة.</p>}
              </div>
            </div>
            {online.hints.length > 0 && (
              <div className="coop-hint-stack" role="status" aria-label="تلميحات Echo المعتمدة">
                <small>ECHO MAJORITY HINT</small>
                {online.hints.map((hint, index) => <p key={`${online.state.stageIndex}-${index}`}>{hint.ar}</p>)}
              </div>
            )}
            <MechanicChoiceBoard
              stage={online.stage}
              imageSrc={online.definition.imageSrc}
              selected={selectedAnswer}
              onSelect={setSelectedAnswer}
              disabled={room.state.phase !== 'active'}
            />
            <GameButton
              fullWidth
              variant="memory"
              disabled={!selectedAnswer || room.state.phase !== 'active'}
              onClick={() => room.sendCommand('coop-submit', { answerId: selectedAnswer })}
            >
              إرسال قرار الفريق للتحقق
            </GameButton>
          </div>
          <HudPanel tone="rare" eyebrow="TEAM CHANNEL" title={`${online.players.length} متصلون بالقضية`}>
            <p>التلميح وإعادة القضية يحتاجان أغلبية. لا توجد مكافأة مساهمة فردية يمكن سرقتها.</p>
            <div className="echo-network-actions">
              <GameButton size="sm" variant="ghost" onClick={() => room.sendCommand('preset-chat', { presetId: 'check-memory' })}>راجع الذاكرة</GameButton>
              <GameButton size="sm" variant="ghost" onClick={() => room.sendCommand('preset-chat', { presetId: 'check-cipher' })}>راجع الشيفرة</GameButton>
              <GameButton size="sm" variant="secondary" onClick={() => room.sendCommand('hint-vote')}>تصويت تلميح</GameButton>
              <GameButton size="sm" variant="ghost" onClick={() => room.sendCommand('restart-vote')}>تصويت إعادة</GameButton>
            </div>
            {room.state.receipt && (
              <div className="echo-network-receipt"><strong>القضية موثقة</strong><span>90 XP متساوية لكل عضو مشارك</span></div>
            )}
            {room.state.error && <p className="echo-network-error" role="alert">{room.state.error}</p>}
            <GameButton variant="danger" fullWidth onClick={room.leave}>مغادرة الاختراق</GameButton>
          </HudPanel>
        </div>
      ) : (
        <div className="echo-network-coop-lobby">
          <GlassPanel tone="memory" eyebrow="12 CANON CASES" title="اختر ذاكرة الفريق">
            <div className="coop-case-picker" role="listbox" aria-label="قضايا التعاون">
              {COOP_CASES.map((definition) => (
                <button
                  type="button"
                  role="option"
                  aria-selected={selectedCase === definition.id}
                  key={definition.id}
                  data-selected={selectedCase === definition.id || undefined}
                  onClick={() => setSelectedCase(definition.id)}
                >
                  <img src={definition.imageSrc} alt="" loading="lazy" />
                  <span><small>{definition.chapterId.replace('_', ' ')}</small><strong>{definition.title.ar}</strong><em>{definition.estimatedMinutes} دقيقة · {definition.difficulty}</em></span>
                </button>
              ))}
            </div>
          </GlassPanel>
          <HudPanel tone="rare" eyebrow="QUICK MATCH" title={selectedDefinition.title.ar}>
            <p>{selectedDefinition.description.ar} سيبدأ الفريق من لاعبين، ويكتمل حتى أربعة قبل فتح الغرفة.</p>
            <GameProgress value={(selectedDefinition.order / COOP_CASES.length) * 100} tone="rare" />
            <GameButton
              variant="rare"
              fullWidth
              disabled={room.state.phase === 'queueing'}
              onClick={() => void room.joinQueue({ mode: 'coop_breach', caseId: selectedCase })}
            >
              فتح مطابقة القضية
            </GameButton>
            {(room.state.phase === 'queueing' || room.state.phase === 'connecting' || room.state.phase === 'reconnecting') && (
              <div className="echo-network-queue" role="status"><i /><strong>تجميع فريق الإشارة…</strong><GameButton size="sm" variant="ghost" onClick={room.leave}>إلغاء</GameButton></div>
            )}
            {room.state.error && <p className="echo-network-error" role="alert">{room.state.error}</p>}
          </HudPanel>
        </div>
      )}
    </section>
  );
}
