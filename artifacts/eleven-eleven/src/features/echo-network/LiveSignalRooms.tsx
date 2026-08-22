import { useEffect, useState } from 'react';
import type { NetworkLocale } from '../../domain/echo-network/contracts';
import { COOP_CASES } from '../../domain/echo-network/coopCaseCatalog';
import { normalizePartyRoomId } from '../../domain/echo-network/partyRoomSafety';
import { useAuthStore } from '../auth/authStore';
import { GameButton, GlassPanel } from '../../ui/design-system';
import { roomHasUsableSnapshot, type RealtimeRoomController, useRealtimeRoom } from './useRealtimeRoom';

const PARTY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const PRESET_LABELS: Record<string, { ar: string; en: string }> = {
  hello: { ar: 'مرحبًا بالإشارات', en: 'Hello, signals' },
  'looking-for-coop': { ar: 'أبحث عن فريق تعاون', en: 'Looking for co-op' },
  'looking-for-chess': { ar: 'أبحث عن مباراة شطرنج', en: 'Looking for chess' },
  'great-puzzle': { ar: 'لغز رائع', en: 'Great puzzle' },
  'well-played': { ar: 'لعب متقن', en: 'Well played' },
  ready: { ar: 'أنا مستعد', en: 'I am ready' },
  'choose-chess': { ar: 'لنختر الشطرنج', en: 'Choose chess' },
  'choose-coop': { ar: 'لنختر التعاون', en: 'Choose co-op' },
  'one-moment': { ar: 'لحظة واحدة', en: 'One moment' },
  thanks: { ar: 'شكرًا', en: 'Thanks' },
};

type PartyActivity = 'chess_casual' | 'coop_breach';

const PARTY_COPY = {
  ar: {
    privateEyebrow: 'فريق خاص · 2–4',
    privateTitle: 'خلية Echo خاصة',
    entry: 'أنشئ رمزًا أو أدخل رمز صديق. الغرفة خاصة ولا تعتمد إلا عبارات جاهزة آمنة.',
    codeLabel: 'رمز الفريق الخاص',
    join: 'دخول',
    create: 'إنشاء',
    copy: 'نسخ الدعوة',
    copied: 'نُسخ رمز الفريق.',
    ready: 'تبديل الاستعداد',
    leave: 'مغادرة',
    activity: 'اختيار القائد للنشاط',
    chess: 'شطرنج خاص',
    coop: 'قضية تعاونية',
    chessRule: 'يتطلب الشطرنج الخاص لاعبين اثنين بالضبط.',
    caseLabel: 'القضية التعاونية',
    launch: 'إطلاق الجلسة الموثقة',
    leaderOnly: 'القائد يختار النشاط ويطلقه بعد أن يصبح الجميع جاهزًا. الخادم يعيد التحقق من القائد والاستعداد والحجم.',
    follower: 'حدّد استعدادك. بعد ذلك يختار القائد النشاط ويطلق الجلسة.',
    needMember: 'يلزم لاعب ثانٍ على الأقل قبل إطلاق الجلسة.',
    waitReady: 'ننتظر اتصال واستعداد كل أعضاء الفريق.',
    chessSize: 'يمكن إطلاق الشطرنج الخاص عندما يكون الفريق من لاعبين فقط.',
    launchReady: 'الفريق متصل وجاهز. يمكن للقائد إطلاق الجلسة.',
    receivingParty: 'القناة مفتوحة. ننتظر حالة الفريق الموثقة من الخادم…',
    receivingMatch: 'ثُبّتت الجلسة. يجري فتح واجهة اللعب من نفس قناة الفريق…',
    commandPending: 'ما زالت قناة الفريق تتصل. أعد المحاولة بعد وصول حالة الفريق.',
    cancel: 'إلغاء',
    linked: 'مرتبط',
    readyState: 'جاهز',
    offline: 'غير متصل',
    communityEyebrow: 'قناة حية بعبارات جاهزة',
    communityTitle: 'قناة المجتمع الحية',
    communityDescription: 'قناة اللغة الحالية للعبارات الجاهزة. لا نص حر، ولا روابط، ولا رفع ملفات.',
    communityConnect: 'ربط القناة الرسمية',
    communityPresence: (count: number) => `${count} إشارات متصلة`,
    communityLeave: 'فصل القناة',
    unknownSignal: 'إشارة',
  },
  en: {
    privateEyebrow: 'PRIVATE PARTY · 2–4',
    privateTitle: 'Private Echo cell',
    entry: 'Create a code or enter a friend’s code. This room is private and uses safe preset phrases only.',
    codeLabel: 'Private party code',
    join: 'Join',
    create: 'Create',
    copy: 'Copy invite',
    copied: 'Party code copied.',
    ready: 'Toggle ready',
    leave: 'Leave',
    activity: 'Leader activity selection',
    chess: 'Private chess',
    coop: 'Co-op case',
    chessRule: 'Private chess needs exactly two players.',
    caseLabel: 'Co-op case',
    launch: 'Launch verified session',
    leaderOnly: 'The leader selects and launches after everyone is ready. The server verifies leadership, readiness, and size again.',
    follower: 'Mark yourself ready. The leader then selects and launches the session.',
    needMember: 'At least one more player is needed before launch.',
    waitReady: 'Waiting for every party member to be connected and ready.',
    chessSize: 'Private chess can launch only with two players.',
    launchReady: 'The team is connected and ready. The leader can launch.',
    receivingParty: 'Channel open. Waiting for the server-authoritative party state…',
    receivingMatch: 'Session secured. Opening gameplay from the same party channel…',
    commandPending: 'The party channel is still connecting. Try again after its state arrives.',
    cancel: 'Cancel',
    linked: 'Linked',
    readyState: 'Ready',
    offline: 'Offline',
    communityEyebrow: 'PRESET LIVE CHANNEL',
    communityTitle: 'Live community channel',
    communityDescription: 'A channel in your current language for preset phrases. No free text, links, or file uploads.',
    communityConnect: 'Connect the official channel',
    communityPresence: (count: number) => `${count} signals connected`,
    communityLeave: 'Disconnect channel',
    unknownSignal: 'SIGNAL',
  },
} as const;

function createPartyCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return `party-${[...bytes].map((byte) => PARTY_ALPHABET[byte % PARTY_ALPHABET.length]).join('')}`;
}

function presetText(value: unknown, locale: NetworkLocale): string {
  return typeof value === 'string'
    ? PRESET_LABELS[value]?.[locale] ?? value
    : '';
}

export function LiveSignalRooms({
  locale,
  partyRoom,
}: {
  locale: NetworkLocale;
  partyRoom: RealtimeRoomController;
}) {
  const party = partyRoom;
  const channel = useRealtimeRoom({ locale });
  const user = useAuthStore((state) => state.user);
  const [partyCode, setPartyCode] = useState('');
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [commandMessage, setCommandMessage] = useState<string | null>(null);
  const [partyActivity, setPartyActivity] = useState<PartyActivity>('coop_breach');
  const [selectedCaseId, setSelectedCaseId] = useState(COOP_CASES[0]!.id);
  const copy = PARTY_COPY[locale];
  const partyMembers = Array.isArray(party.state.snapshot?.members)
    ? party.state.snapshot.members as Array<{ uid: string; displayName: string; ready: boolean; connected: boolean }>
    : [];
  const partyStateReady = roomHasUsableSnapshot(party.state);
  const partyIsMatchHandoff = party.state.target === 'match'
    && ['connecting', 'awaiting-snapshot', 'active', 'reconnecting'].includes(party.state.phase);
  const partyIsLeader = Boolean(user?.uid && partyMembers[0]?.uid === user.uid);
  const membersReady = partyMembers.length >= 2 && partyMembers.every((member) => member.ready && member.connected);
  const chessAvailable = partyMembers.length === 2;
  const canLaunch = partyIsLeader
    && membersReady
    && (partyActivity === 'coop_breach' || chessAvailable);
  const onlineCount = typeof channel.state.snapshot?.onlineCount === 'number'
    ? channel.state.snapshot.onlineCount
    : 0;

  useEffect(() => {
    if (!chessAvailable && partyActivity === 'chess_casual') setPartyActivity('coop_breach');
  }, [chessAvailable, partyActivity]);

  const enterParty = (code: string) => {
    const normalized = normalizePartyRoomId(code);
    if (!normalized) return;
    setPartyCode(normalized);
    void party.joinDirect({ target: 'party', roomId: normalized });
  };

  const newParty = () => enterParty(createPartyCode());
  const copyParty = async () => {
    if (!party.state.roomId) return;
    try {
      await navigator.clipboard.writeText(party.state.roomId);
      setCopyMessage(copy.copied);
    } catch {
      setCopyMessage(party.state.roomId);
    }
  };

  const sendPartyCommand = (type: 'ready' | 'preset-chat' | 'party-launch', payload: Record<string, unknown> = {}) => {
    setCommandMessage(null);
    if (!party.sendCommand(type, payload)) setCommandMessage(copy.commandPending);
  };

  const launchParty = () => {
    if (!canLaunch) return;
    sendPartyCommand('party-launch', partyActivity === 'coop_breach'
      ? { mode: partyActivity, caseId: selectedCaseId }
      : { mode: partyActivity, variant: 'standard' });
  };

  const readinessMessage = partyMembers.length < 2
    ? copy.needMember
    : !membersReady
    ? copy.waitReady
    : partyActivity === 'chess_casual' && !chessAvailable
    ? copy.chessSize
    : copy.launchReady;

  return (
    <div className="signal-live-grid">
      <GlassPanel tone="memory" eyebrow={copy.privateEyebrow} title={copy.privateTitle}>
        {party.state.phase === 'idle' || party.state.phase === 'error' ? (
          <>
            <p>{copy.entry}</p>
            <form className="signal-party-entry" onSubmit={(event) => { event.preventDefault(); enterParty(partyCode); }}>
              <input dir="ltr" value={partyCode} maxLength={22} placeholder="party-XXXXXXXXXX" onChange={(event) => setPartyCode(event.target.value)} aria-label={copy.codeLabel} />
              <GameButton type="submit" size="sm" variant="memory" disabled={!normalizePartyRoomId(partyCode)}>{copy.join}</GameButton>
              <GameButton size="sm" variant="secondary" onClick={newParty}>{copy.create}</GameButton>
            </form>
            {party.state.error && <p className="echo-network-error" role="alert">{party.state.error}</p>}
          </>
        ) : partyIsMatchHandoff ? (
          <div className="signal-party-transition" role="status">
            <i aria-hidden="true" />
            <strong>{copy.receivingMatch}</strong>
            <GameButton size="sm" variant="ghost" onClick={party.leave}>{copy.cancel}</GameButton>
          </div>
        ) : !partyStateReady ? (
          <div className="signal-party-transition" role="status">
            <i aria-hidden="true" />
            <strong>{copy.receivingParty}</strong>
            <GameButton size="sm" variant="ghost" onClick={party.leave}>{copy.cancel}</GameButton>
          </div>
        ) : (
          <>
            <div className="signal-room-code"><strong dir="ltr">{party.state.roomId}</strong><GameButton size="sm" variant="ghost" onClick={() => void copyParty()}>{copy.copy}</GameButton></div>
            <div className="signal-party-members">
              {partyMembers.map((member) => <span key={member.uid} data-ready={member.ready || undefined} data-offline={!member.connected || undefined}><i />{member.displayName}<small>{member.connected ? member.ready ? copy.readyState : copy.linked : copy.offline}</small></span>)}
            </div>
            <div className="echo-network-actions">
              <GameButton size="sm" variant="memory" onClick={() => sendPartyCommand('ready')}>{copy.ready}</GameButton>
              <GameButton size="sm" variant="ghost" onClick={() => sendPartyCommand('preset-chat', { presetId: 'choose-coop' })}>{copy.coop}</GameButton>
              <GameButton size="sm" variant="ghost" onClick={() => sendPartyCommand('preset-chat', { presetId: 'choose-chess' })}>{copy.chess}</GameButton>
              <GameButton size="sm" variant="danger" onClick={party.leave}>{copy.leave}</GameButton>
            </div>
            <section className="signal-party-launch" aria-labelledby="party-launch-title">
              <div>
                <small id="party-launch-title">{copy.activity}</small>
                <p>{partyIsLeader ? copy.leaderOnly : copy.follower}</p>
              </div>
              {partyIsLeader && (
                <>
                  <div className="signal-party-launch__choices" role="radiogroup" aria-label={copy.activity}>
                    <GameButton
                      type="button"
                      size="sm"
                      variant={partyActivity === 'chess_casual' ? 'danger' : 'ghost'}
                      role="radio"
                      aria-checked={partyActivity === 'chess_casual'}
                      disabled={!chessAvailable}
                      onClick={() => setPartyActivity('chess_casual')}
                    >
                      {copy.chess}
                    </GameButton>
                    <GameButton
                      type="button"
                      size="sm"
                      variant={partyActivity === 'coop_breach' ? 'rare' : 'ghost'}
                      role="radio"
                      aria-checked={partyActivity === 'coop_breach'}
                      onClick={() => setPartyActivity('coop_breach')}
                    >
                      {copy.coop}
                    </GameButton>
                  </div>
                  {!chessAvailable && <small className="signal-party-launch__rule">{copy.chessRule}</small>}
                  {partyActivity === 'coop_breach' && (
                    <label className="signal-party-launch__case">
                      <span>{copy.caseLabel}</span>
                      <select value={selectedCaseId} onChange={(event) => setSelectedCaseId(event.target.value)}>
                        {COOP_CASES.map((caseDefinition) => <option key={caseDefinition.id} value={caseDefinition.id}>{caseDefinition.title[locale]}</option>)}
                      </select>
                    </label>
                  )}
                  <p className="signal-party-launch__status" role="status">{readinessMessage}</p>
                  <GameButton fullWidth variant="rare" disabled={!canLaunch} onClick={launchParty}>{copy.launch}</GameButton>
                </>
              )}
            </section>
            {party.state.events.slice(-3).map((event) => <p className="signal-live-message" key={event.eventId}>{presetText(event.payload.presetId, locale)}</p>)}
            {copyMessage && <small role="status">{copyMessage}</small>}
            {commandMessage && <p className="echo-network-error" role="alert">{commandMessage}</p>}
            {party.state.error && <p className="echo-network-error" role="alert">{party.state.error}</p>}
          </>
        )}
      </GlassPanel>

      <GlassPanel tone="rare" eyebrow={copy.communityEyebrow} title={copy.communityTitle}>
        {channel.state.phase === 'idle' || channel.state.phase === 'error' ? (
          <>
            <p>{copy.communityDescription}</p>
            <GameButton variant="rare" onClick={() => void channel.joinDirect({ target: 'community', roomId: `channel-${locale}-official` })}>{copy.communityConnect}</GameButton>
            {channel.state.error && <p className="echo-network-error" role="alert">{channel.state.error}</p>}
          </>
        ) : (
          <>
            <div className="signal-channel-presence"><i />{copy.communityPresence(onlineCount)}</div>
            <div className="signal-preset-buttons">
              {['hello', 'looking-for-coop', 'looking-for-chess', 'great-puzzle', 'thanks'].map((presetId) => (
                <button type="button" key={presetId} onClick={() => channel.sendCommand('preset-chat', { presetId })}>{PRESET_LABELS[presetId]?.[locale]}</button>
              ))}
            </div>
            <div className="signal-live-feed" aria-live="polite">
              {channel.state.events.slice(-5).map((event) => <p key={event.eventId}><strong>{String(event.payload.displayName ?? copy.unknownSignal)}</strong>{presetText(event.payload.presetId, locale)}</p>)}
            </div>
            <GameButton size="sm" variant="ghost" onClick={channel.leave}>{copy.communityLeave}</GameButton>
          </>
        )}
      </GlassPanel>
    </div>
  );
}
