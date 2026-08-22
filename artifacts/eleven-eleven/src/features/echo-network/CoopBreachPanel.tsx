import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { CoopRole, LocalizedCopy, NetworkLocale } from '../../domain/echo-network/contracts';
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
import { isRecoverableMatchState, roomHasUsableSnapshot, type RealtimeRoomController } from './useRealtimeRoom';

const ROLE_LABELS: Record<CoopRole, { ar: string; en: string }> = {
  memory: { ar: 'الذاكرة', en: 'Memory' },
  cipher: { ar: 'الشيفرة', en: 'Cipher' },
  route: { ar: 'المسار', en: 'Route' },
  anchor: { ar: 'المرساة', en: 'Anchor' },
};

const MECHANIC_LABELS: Record<CoopMechanic, LocalizedCopy> = {
  'image-reconstruction': { ar: 'تركيب شظية بصرية', en: 'Visual fragment reconstruction' },
  wiring: { ar: 'توصيل قنوات', en: 'Channel wiring' },
  cipher: { ar: 'فك شيفرة', en: 'Cipher decoding' },
  evidence: { ar: 'مطابقة أدلة', en: 'Evidence matching' },
  timeline: { ar: 'ترتيب زمني', en: 'Timeline ordering' },
  routing: { ar: 'توجيه بيانات', en: 'Data routing' },
  'load-balance': { ar: 'موازنة حمل', en: 'Load balancing' },
  pattern: { ar: 'مسح نمط', en: 'Pattern scan' },
};

const ROLE_DESCRIPTIONS: Record<CoopRole, LocalizedCopy> = {
  memory: { ar: 'سجل الصورة والحدث', en: 'Image and event record' },
  cipher: { ar: 'المفتاح والرمز', en: 'Key and symbol' },
  route: { ar: 'اتجاه البيانات', en: 'Data direction' },
  anchor: { ar: 'شرط التثبيت النهائي', en: 'Final lock condition' },
};

const DIFFICULTY_LABELS: Record<CoopCasePublicDefinition['difficulty'], LocalizedCopy> = {
  guided: { ar: 'موجّه', en: 'Guided' },
  standard: { ar: 'قياسي', en: 'Standard' },
  deep: { ar: 'عميق', en: 'Deep' },
};

const COOP_COPY = {
  ar: {
    eyebrow: '2–4 لاعبين · معرفة موزعة',
    title: 'اختراقات الإشارة التعاونية',
    training: 'تدريب مع Echo',
    live: 'فريق حي',
    trainingCase: 'قضية تدريب · الفصل 1',
    complete: 'مكتمل',
    yourChannel: 'قناتك الخاصة',
    echoChannel: 'قناة Echo',
    requestEcho: 'اطلب من Echo مشاركة دليله',
    submitTraining: 'تثبيت قرار الفريق',
    trainingInvalid: 'الإجابة لا تطابق مجموع الاستبعادات. راجع قناتك وقناة Echo.',
    trainingFinal: 'اكتمل الاختراق التدريبي. لا توجد مكافأة خادمية لهذا التدريب.',
    trainingNext: 'ثبتت المرحلة. تنتقل الأدوار الآن إلى العقدة التالية.',
    trainingCompleteEyebrow: 'تدريب مكتمل',
    trainingCompleteTitle: 'استعاد Echo نمط التعاون',
    trainingCompleteDescription: 'جرّبت الأدلة المنقسمة، طلب المعلومات، وثلاثة أشكال تفاعل. التدريب محلي ولا يصنع مكافأة.',
    trainingCertified: 'التدريب موثّق',
    trainingSaving: 'جارٍ التوثيق…',
    certifyTraining: 'توثيق التدريب',
    roleProtocolEyebrow: 'بروتوكول الأدوار',
    roleProtocolTitle: 'لماذا تحتاجون بعضكم؟',
    roleProtocolDescription: 'في اللعب الحي، كل جهاز يستلم أدلة أدواره فقط. الحل النهائي يبقى داخل Worker ولا يُرسل للواجهة.',
    playerEvidence: 'الأدلة المرسلة لجهازك فقط',
    echoEvidence: 'Echo يتولى الأدوار المنقطعة',
    noDisconnected: 'لا يوجد لاعب منقطع. تواصلوا بالعبارات الجاهزة.',
    hintLabel: 'تلميحات Echo المعتمدة',
    readVisual: 'افحص دليل المشهد أولًا، ثم اختر إشارة القرار من الخيارات أدناه.',
    answerRejected: 'هذه المحاولة لا تتفق مع كل الأدلة. قارنوا القنوات أو اطلبوا تلميحًا بالأغلبية؛ Echo لا يكشف الحل.',
    submitLive: 'إرسال قرار الفريق للتحقق',
    teamChannel: 'قناة الفريق',
    connected: (count: number) => `${count} متصلون بالقضية`,
    teamDescription: 'التلميح وإعادة القضية يحتاجان أغلبية. المكافأة لا تُسجّل إلا بعد مساهمة نشطة موثقة؛ التصويت وحده لا يكفي.',
    checkMemory: 'راجع الذاكرة',
    checkCipher: 'راجع الشيفرة',
    voteHint: 'تصويت تلميح',
    voteRestart: 'تصويت إعادة',
    settlementTitle: 'القضية قيد التثبيت الخادمي',
    awaitingReceipt: 'اكتملت القضية وحُفظت حالتها. ننتظر الإيصال الموثّق؛ لن تظهر XP قبل وصوله.',
    pendingServerFinalization: 'الإيصال محفوظ داخل الغرفة الموثّقة. يثبّت الخادم النتيجة في ملفك؛ هذه الشاشة لا تمنح XP.',
    checkSealedResult: 'التحقق من الإيصال',
    leave: 'مغادرة الاختراق',
    casesEyebrow: '12 قضية من Canon',
    chooseCase: 'اختر ذاكرة الفريق',
    casesLabel: 'قضايا التعاون',
    duration: (minutes: number, difficulty: string) => `${minutes} دقيقة · ${difficulty}`,
    quickMatch: 'مطابقة سريعة',
    quickMatchDescription: (description: string) => `${description} سيبدأ الفريق من لاعبين، ويكتمل حتى أربعة قبل فتح الغرفة.`,
    openMatch: 'فتح مطابقة القضية',
    receiving: 'القناة مفتوحة. ننتظر حالة القضية الموثقة من الخادم…',
    waiting: 'تم تثبيت مقعدك. ننتظر اتصال الفريق قبل فتح أدلة القضية.',
    reconnecting: 'إعادة ربط قضية الفريق…',
    connecting: 'تجميع فريق الإشارة…',
    retryRoom: 'إعادة ربط القضية',
    cancel: 'إلغاء',
    option: (index: number) => `إشارة ${String(index + 1).padStart(2, '0')}`,
  },
  en: {
    eyebrow: '2–4 PLAYERS · SPLIT KNOWLEDGE',
    title: 'Co-op Signal Breaches',
    training: 'Train with Echo',
    live: 'Live team',
    trainingCase: 'TRAINING CASE · CHAPTER 1',
    complete: 'COMPLETE',
    yourChannel: 'Your private channel',
    echoChannel: 'Echo channel',
    requestEcho: 'Ask Echo to share the clue',
    submitTraining: 'Lock the team decision',
    trainingInvalid: 'That choice does not fit every exclusion. Review your channel and Echo’s channel.',
    trainingFinal: 'The training breach is complete. This local training has no server reward.',
    trainingNext: 'Stage secured. The roles now move to the next node.',
    trainingCompleteEyebrow: 'TRAINING COMPLETE',
    trainingCompleteTitle: 'Echo recovered the co-op pattern',
    trainingCompleteDescription: 'You tested split evidence, asked for information, and used three interaction types. Training is local and grants no reward.',
    trainingCertified: 'Training certified',
    trainingSaving: 'Certifying…',
    certifyTraining: 'Certify training',
    roleProtocolEyebrow: 'ROLE PROTOCOL',
    roleProtocolTitle: 'Why do you need each other?',
    roleProtocolDescription: 'In live play, each device receives only its role clues. The final solution stays inside the Worker and never reaches the interface.',
    playerEvidence: 'Evidence sent to this device only',
    echoEvidence: 'Echo covers disconnected roles',
    noDisconnected: 'No player is disconnected. Use the prepared callouts to coordinate.',
    hintLabel: 'Approved Echo hints',
    readVisual: 'Read the evidence panel first, then choose the team decision below.',
    answerRejected: 'That attempt does not fit every clue. Compare channels or ask for a majority hint; Echo will not reveal the solution.',
    submitLive: 'Send team decision for verification',
    teamChannel: 'TEAM CHANNEL',
    connected: (count: number) => `${count} connected to the case`,
    teamDescription: 'Hints and restarts require a majority. Rewards require verified active contribution; a vote alone is not enough.',
    checkMemory: 'Check memory',
    checkCipher: 'Check cipher',
    voteHint: 'Vote for hint',
    voteRestart: 'Vote to restart',
    settlementTitle: 'Case settling on the server',
    awaitingReceipt: 'The case state is saved. We are waiting for its verified receipt; XP stays hidden until it arrives.',
    pendingServerFinalization: 'The receipt is saved in the authoritative room. The server is finalizing your profile record; this screen does not grant XP.',
    checkSealedResult: 'Check sealed result',
    leave: 'Leave breach',
    casesEyebrow: '12 CANON CASES',
    chooseCase: 'Choose the team memory',
    casesLabel: 'Co-op cases',
    duration: (minutes: number, difficulty: string) => `${minutes} min · ${difficulty}`,
    quickMatch: 'QUICK MATCH',
    quickMatchDescription: (description: string) => `${description} The team starts at two players and fills to four before the room opens.`,
    openMatch: 'Open case matchmaking',
    receiving: 'Channel open. Waiting for the server-authoritative case state…',
    waiting: 'Your seat is secured. Waiting for the team before opening the case evidence.',
    reconnecting: 'Reconnecting the team case…',
    connecting: 'Assembling the signal team…',
    retryRoom: 'Retry this case',
    cancel: 'Cancel',
    option: (index: number) => `SIGNAL ${String(index + 1).padStart(2, '0')}`,
  },
} as const;

function MechanicChoiceBoard({
  stage,
  imageSrc,
  selected,
  onSelect,
  disabled,
  locale,
}: {
  stage: CoopStagePublicDefinition;
  imageSrc: string;
  selected: string | null;
  onSelect: (optionId: string) => void;
  disabled?: boolean;
  locale: NetworkLocale;
}) {
  const copy = COOP_COPY[locale];
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
      <p className="coop-mechanic__instruction">{copy.readVisual}</p>
      <div className="coop-mechanic__choices" role="radiogroup" aria-label={stage.objective[locale]}>
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
              <strong>{label?.[locale] ?? optionId}</strong>
              <small>{copy.option(index)}</small>
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
  locale,
}: {
  completed: boolean;
  onComplete: () => Promise<void>;
  locale: NetworkLocale;
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
  const copy = COOP_COPY[locale];

  const submit = () => {
    if (!selected || !echoLinked || finished) return;
    if (selected !== COOP_TRAINING_ANSWERS[stageIndex]) {
      setFeedback(copy.trainingInvalid);
      return;
    }
    setFeedback(stageIndex === definition.stages.length - 1
      ? copy.trainingFinal
      : copy.trainingNext);
    setStageIndex((value) => value + 1);
    setSelected(null);
    setEchoLinked(false);
  };

  return (
    <div className="echo-network-coop-layout">
      <div>
        <div className="coop-case-banner" style={{ backgroundImage: `url(${definition.imageSrc})` }}>
          <span><small>{copy.trainingCase}</small><strong>{definition.title[locale]}</strong></span>
          <i>{finished ? copy.complete : `${stageIndex + 1}/3`}</i>
        </div>
        {!finished ? (
          <>
            <header className="coop-stage-heading">
              <span>{MECHANIC_LABELS[stage.mechanic][locale]}</span>
              <h3>{stage.objective[locale]}</h3>
              <p>{stage.prompt[locale]}</p>
            </header>
            <div className="coop-clue-grid">
              <div data-owner="player">
                <small>{copy.yourChannel}</small>
                {userRoles.map((role) => (
                  <p key={role}><strong>{ROLE_LABELS[role][locale]}</strong>{coopTrainingClue(stageIndex, role)[locale]}</p>
                ))}
              </div>
              <div data-owner="echo" data-locked={!echoLinked || undefined}>
                <small>{copy.echoChannel}</small>
                {echoLinked ? echoRoles.map((role) => (
                  <p key={role}><strong>{ROLE_LABELS[role][locale]}</strong>{coopTrainingClue(stageIndex, role)[locale]}</p>
                )) : <button type="button" onClick={() => setEchoLinked(true)}>{copy.requestEcho}</button>}
              </div>
            </div>
            <MechanicChoiceBoard
              stage={stage}
              imageSrc={definition.imageSrc}
              selected={selected}
              onSelect={setSelected}
              locale={locale}
            />
            <GameButton fullWidth variant="memory" disabled={!selected || !echoLinked} onClick={submit}>{copy.submitTraining}</GameButton>
          </>
        ) : (
          <HudPanel tone="rare" eyebrow={copy.trainingCompleteEyebrow} title={copy.trainingCompleteTitle}>
            <p>{copy.trainingCompleteDescription}</p>
            <GameButton
              variant="rare"
              disabled={completed || saving}
              onClick={() => {
                setSaving(true);
                void onComplete().finally(() => setSaving(false));
              }}
            >
              {completed ? copy.trainingCertified : saving ? copy.trainingSaving : copy.certifyTraining}
            </GameButton>
          </HudPanel>
        )}
        {feedback && <p className="echo-network-callout" aria-live="polite">{feedback}</p>}
      </div>
      <HudPanel tone="memory" eyebrow={copy.roleProtocolEyebrow} title={copy.roleProtocolTitle}>
        <p>{copy.roleProtocolDescription}</p>
        <dl className="coop-role-list">
          {Object.entries(ROLE_LABELS).map(([role, label]) => (
            <div key={role}><dt>{label[locale]}</dt><dd>{ROLE_DESCRIPTIONS[role as CoopRole][locale]}</dd></div>
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

function currentCoopAnswerWasRejected(
  events: ReadonlyArray<{ type: string; payload: Record<string, unknown> }>,
  stateVersion: number | undefined,
): boolean {
  if (typeof stateVersion !== 'number') return false;
  return events.some((event) => {
    if (event.type !== 'answer-rejected') return false;
    const state = event.payload.state;
    return typeof state === 'object' && state !== null
      && (state as { version?: unknown }).version === stateVersion;
  });
}

export function CoopBreachPanel({
  eligibility,
  onTrainingComplete,
  onReceipt,
  room,
  locale,
}: {
  eligibility: NetworkEligibilitySnapshot;
  onTrainingComplete: () => Promise<void>;
  onReceipt: () => void;
  room: RealtimeRoomController;
  locale: NetworkLocale;
}) {
  const [view, setView] = useState<'training' | 'online'>('training');
  const [selectedCase, setSelectedCase] = useState(COOP_CASES[0]!.id);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const synchronizedReceiptIdRef = useRef<string | null>(null);
  const matchHandoffActive = room.state.target === 'match'
    && room.state.mode === 'coop_breach'
    && ['queueing', 'connecting', 'awaiting-snapshot', 'active', 'reconnecting', 'settling', 'completed'].includes(room.state.phase);
  const matchRecoveryAvailable = room.state.mode === 'coop_breach'
    && isRecoverableMatchState(room.state);
  const activeView = matchHandoffActive || matchRecoveryAvailable ? 'online' : view;
  const roomReady = roomHasUsableSnapshot(room.state);
  const online = parseOnlineCase(room.state.snapshot);
  const gameplayReady = roomReady && online !== null;
  const showRejectedAnswer = currentCoopAnswerWasRejected(room.state.events, online?.state.version);
  const copy = COOP_COPY[locale];
  const selectedDefinition = useMemo(() => COOP_CASE_BY_ID[selectedCase]!, [selectedCase]);
  const hasResultSettlement = room.state.settlement !== 'none';
  const settlementMessage = room.state.settlement === 'awaiting-receipt'
    ? copy.awaitingReceipt
    : copy.pendingServerFinalization;

  useEffect(() => setSelectedAnswer(null), [online?.state.stageIndex]);
  useEffect(() => {
    const receiptId = room.state.receipt?.receiptId;
    if (!receiptId || synchronizedReceiptIdRef.current === receiptId) return undefined;
    synchronizedReceiptIdRef.current = receiptId;
    const timer = setTimeout(() => void onReceipt(), 1_200);
    return () => clearTimeout(timer);
  }, [onReceipt, room.state.receipt?.receiptId]);

  return (
    <section className="echo-network-mode" aria-labelledby="coop-title">
      <header className="echo-network-mode__heading">
        <span><small>{copy.eyebrow}</small><h2 id="coop-title">{copy.title}</h2></span>
        <div className="echo-network-segmented">
          <GameButton size="sm" variant={activeView === 'training' ? 'memory' : 'ghost'} onClick={() => setView('training')}>{copy.training}</GameButton>
          <GameButton size="sm" variant={activeView === 'online' ? 'rare' : 'ghost'} onClick={() => setView('online')}>{copy.live}</GameButton>
        </div>
      </header>

      {activeView === 'training' ? (
        <TrainingBreach completed={eligibility.coopTrainingCompleted} onComplete={onTrainingComplete} locale={locale} />
      ) : online && gameplayReady ? (
        <div className="echo-network-coop-layout">
          <div>
            <div className="coop-case-banner" style={{ backgroundImage: `url(${online.definition.imageSrc})` }}>
              <span><small>{online.definition.chapterId.replace('_', ' ').toUpperCase()}</small><strong>{online.definition.title[locale]}</strong></span>
              <i>{online.state.status === 'completed' ? copy.complete : `${(online.state.stageIndex ?? 0) + 1}/3`}</i>
            </div>
            <header className="coop-stage-heading">
              <span>{MECHANIC_LABELS[online.stage.mechanic][locale]}</span>
              <h3>{online.stage.objective[locale]}</h3>
              <p>{online.stage.prompt[locale]}</p>
            </header>
            <div className="coop-clue-grid">
              <div data-owner="player">
                <small>{copy.playerEvidence}</small>
                {online.clues.map(({ role, clue }) => <p key={role}><strong>{ROLE_LABELS[role][locale]}</strong>{clue[locale]}</p>)}
              </div>
              <div data-owner="echo">
                <small>{copy.echoEvidence}</small>
                {online.echoClues.length > 0
                  ? online.echoClues.map(({ role, clue, ownerName }) => <p key={`${ownerName}-${role}`}><strong>{ownerName} · {ROLE_LABELS[role][locale]}</strong>{clue[locale]}</p>)
                  : <p>{copy.noDisconnected}</p>}
              </div>
            </div>
            {online.hints.length > 0 && (
              <div className="coop-hint-stack" role="status" aria-label={copy.hintLabel}>
                <small>ECHO MAJORITY HINT</small>
                {online.hints.map((hint, index) => <p key={`${online.state.stageIndex}-${index}`}>{hint[locale]}</p>)}
              </div>
            )}
            <MechanicChoiceBoard
              stage={online.stage}
              imageSrc={online.definition.imageSrc}
              selected={selectedAnswer}
              onSelect={setSelectedAnswer}
              disabled={room.state.phase !== 'active'}
              locale={locale}
            />
            <GameButton
              fullWidth
              variant="memory"
              disabled={!selectedAnswer || room.state.phase !== 'active'}
              onClick={() => room.sendCommand('coop-submit', { answerId: selectedAnswer })}
            >
              {copy.submitLive}
            </GameButton>
            {showRejectedAnswer && (
              <p className="echo-network-callout" role="status">{copy.answerRejected}</p>
            )}
          </div>
          <HudPanel tone="rare" eyebrow={copy.teamChannel} title={copy.connected(online.players.length)}>
            <p>{copy.teamDescription}</p>
            <div className="echo-network-actions">
              <GameButton size="sm" variant="ghost" onClick={() => room.sendCommand('preset-chat', { presetId: 'check-memory' })}>{copy.checkMemory}</GameButton>
              <GameButton size="sm" variant="ghost" onClick={() => room.sendCommand('preset-chat', { presetId: 'check-cipher' })}>{copy.checkCipher}</GameButton>
              <GameButton size="sm" variant="secondary" onClick={() => room.sendCommand('hint-vote')}>{copy.voteHint}</GameButton>
              <GameButton size="sm" variant="ghost" onClick={() => room.sendCommand('restart-vote')}>{copy.voteRestart}</GameButton>
            </div>
            {hasResultSettlement && (
              <div
                className="echo-network-receipt echo-network-settlement"
                data-settlement={room.state.settlement}
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                <strong>{copy.settlementTitle}</strong>
                <span>{settlementMessage}</span>
                {matchRecoveryAvailable && (
                  <GameButton size="sm" variant="rare" onClick={() => void room.retryExistingMatch()}>{copy.checkSealedResult}</GameButton>
                )}
              </div>
            )}
            {room.state.error && !matchRecoveryAvailable && <p className="echo-network-error" role="alert">{room.state.error}</p>}
            <GameButton variant="danger" fullWidth onClick={room.leave}>{copy.leave}</GameButton>
          </HudPanel>
        </div>
      ) : matchHandoffActive ? (
        <div className="echo-network-coop-waiting" role="status">
          <HudPanel tone="rare" eyebrow={copy.teamChannel} title={copy.connecting}>
            <div className="echo-network-queue">
              <i aria-hidden="true" />
              <strong>{room.state.settlement === 'awaiting-receipt'
                ? copy.awaitingReceipt
                : room.state.settlement === 'pending-server-finalization'
                ? copy.pendingServerFinalization
                : room.state.phase === 'awaiting-snapshot'
                ? copy.receiving
                : room.state.phase === 'reconnecting'
                ? copy.reconnecting
                : String(room.state.snapshot?.status) === 'waiting'
                ? copy.waiting
                : copy.connecting}</strong>
              {matchRecoveryAvailable && (
                <GameButton size="sm" variant="rare" onClick={() => void room.retryExistingMatch()}>{copy.checkSealedResult}</GameButton>
              )}
              <GameButton size="sm" variant="ghost" onClick={room.leave}>{copy.cancel}</GameButton>
            </div>
            {room.state.error && !matchRecoveryAvailable && <p className="echo-network-error" role="alert">{room.state.error}</p>}
          </HudPanel>
        </div>
      ) : (
        <div className="echo-network-coop-lobby">
          <GlassPanel tone="memory" eyebrow={copy.casesEyebrow} title={copy.chooseCase}>
            <div className="coop-case-picker" role="listbox" aria-label={copy.casesLabel}>
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
                  <span><small>{definition.chapterId.replace('_', ' ')}</small><strong>{definition.title[locale]}</strong><em>{copy.duration(definition.estimatedMinutes, DIFFICULTY_LABELS[definition.difficulty][locale])}</em></span>
                </button>
              ))}
            </div>
          </GlassPanel>
          <HudPanel tone="rare" eyebrow={copy.quickMatch} title={selectedDefinition.title[locale]}>
            <p>{copy.quickMatchDescription(selectedDefinition.description[locale])}</p>
            <GameProgress value={(selectedDefinition.order / COOP_CASES.length) * 100} tone="rare" />
            <GameButton
              variant="rare"
              fullWidth
              disabled={room.state.phase === 'queueing'}
              onClick={() => void room.joinQueue({ mode: 'coop_breach', caseId: selectedCase })}
            >
              {copy.openMatch}
            </GameButton>
            {matchRecoveryAvailable && (
              <div className="echo-network-queue echo-network-settlement" data-settlement={room.state.settlement} role="status" aria-live="polite" aria-atomic="true">
                <strong>{room.state.settlement === 'awaiting-receipt' ? copy.awaitingReceipt : room.state.error}</strong>
                <GameButton size="sm" variant="rare" onClick={() => void room.retryExistingMatch()}>{room.state.settlement === 'awaiting-receipt' ? copy.checkSealedResult : copy.retryRoom}</GameButton>
                <GameButton size="sm" variant="ghost" onClick={room.leave}>{copy.cancel}</GameButton>
              </div>
            )}
            {(room.state.phase === 'queueing' || room.state.phase === 'connecting' || room.state.phase === 'awaiting-snapshot' || room.state.phase === 'reconnecting') && (
              <div className="echo-network-queue" role="status"><i /><strong>{room.state.phase === 'awaiting-snapshot' ? copy.receiving : room.state.phase === 'reconnecting' ? copy.reconnecting : copy.connecting}</strong><GameButton size="sm" variant="ghost" onClick={room.leave}>{copy.cancel}</GameButton></div>
            )}
            {room.state.error && !matchRecoveryAvailable && <p className="echo-network-error" role="alert">{room.state.error}</p>}
          </HudPanel>
        </div>
      )}
    </section>
  );
}
