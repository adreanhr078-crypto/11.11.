import { useState } from 'react';
import type { NetworkLocale } from '../../domain/echo-network/contracts';
import { normalizePartyRoomId } from '../../domain/echo-network/partyRoomSafety';
import { GameButton, GlassPanel } from '../../ui/design-system';
import { useRealtimeRoom } from './useRealtimeRoom';

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

function createPartyCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return `party-${[...bytes].map((byte) => PARTY_ALPHABET[byte % PARTY_ALPHABET.length]).join('')}`;
}

function presetText(value: unknown, locale: NetworkLocale): string {
  return typeof value === 'string'
    ? PRESET_LABELS[value]?.[locale] ?? value
    : '';
}

export function LiveSignalRooms({ locale }: { locale: NetworkLocale }) {
  const party = useRealtimeRoom();
  const channel = useRealtimeRoom();
  const [partyCode, setPartyCode] = useState('');
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const partyMembers = Array.isArray(party.state.snapshot?.members)
    ? party.state.snapshot.members as Array<{ uid: string; displayName: string; ready: boolean; connected: boolean }>
    : [];
  const onlineCount = typeof channel.state.snapshot?.onlineCount === 'number'
    ? channel.state.snapshot.onlineCount
    : 0;

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
      setCopyMessage(locale === 'ar' ? 'نُسخ رمز الفريق.' : 'Party code copied.');
    } catch {
      setCopyMessage(party.state.roomId);
    }
  };

  return (
    <div className="signal-live-grid">
      <GlassPanel tone="memory" eyebrow="PRIVATE PARTY · 2–4" title={locale === 'ar' ? 'خلية Echo خاصة' : 'Private Echo cell'}>
        {party.state.phase === 'idle' || party.state.phase === 'error' ? (
          <>
            <p>أنشئ رمزًا أو أدخل رمز صديق. الغرفة لا تظهر في البحث العام وتستخدم عبارات جاهزة فقط.</p>
            <form className="signal-party-entry" onSubmit={(event) => { event.preventDefault(); enterParty(partyCode); }}>
              <input dir="ltr" value={partyCode} maxLength={22} placeholder="party-XXXXXXXXXX" onChange={(event) => setPartyCode(event.target.value)} aria-label="رمز الفريق الخاص" />
              <GameButton type="submit" size="sm" variant="memory" disabled={!normalizePartyRoomId(partyCode)}>دخول</GameButton>
              <GameButton size="sm" variant="secondary" onClick={newParty}>إنشاء</GameButton>
            </form>
            {party.state.error && <p className="echo-network-error" role="alert">{party.state.error}</p>}
          </>
        ) : (
          <>
            <div className="signal-room-code"><strong dir="ltr">{party.state.roomId}</strong><GameButton size="sm" variant="ghost" onClick={() => void copyParty()}>نسخ الدعوة</GameButton></div>
            <div className="signal-party-members">
              {partyMembers.map((member) => <span key={member.uid} data-ready={member.ready || undefined} data-offline={!member.connected || undefined}><i />{member.displayName}<small>{member.connected ? member.ready ? 'READY' : 'LINKED' : 'OFFLINE'}</small></span>)}
            </div>
            <div className="echo-network-actions">
              <GameButton size="sm" variant="memory" onClick={() => party.sendCommand('ready')}>تبديل الاستعداد</GameButton>
              <GameButton size="sm" variant="ghost" onClick={() => party.sendCommand('preset-chat', { presetId: 'choose-coop' })}>تعاون؟</GameButton>
              <GameButton size="sm" variant="ghost" onClick={() => party.sendCommand('preset-chat', { presetId: 'choose-chess' })}>شطرنج؟</GameButton>
              <GameButton size="sm" variant="danger" onClick={party.leave}>مغادرة</GameButton>
            </div>
            {party.state.events.slice(-3).map((event) => <p className="signal-live-message" key={event.eventId}>{presetText(event.payload.presetId, locale)}</p>)}
            {copyMessage && <small role="status">{copyMessage}</small>}
          </>
        )}
      </GlassPanel>

      <GlassPanel tone="rare" eyebrow="PRESET LIVE CHANNEL" title={locale === 'ar' ? 'قناة المجتمع الحية' : 'Live community channel'}>
        {channel.state.phase === 'idle' || channel.state.phase === 'error' ? (
          <>
            <p>قناة اللغة الحالية للعبارات الجاهزة. لا نص حر، لا روابط، ولا رفع ملفات.</p>
            <GameButton variant="rare" onClick={() => void channel.joinDirect({ target: 'community', roomId: `channel-${locale}-official` })}>ربط القناة الرسمية</GameButton>
            {channel.state.error && <p className="echo-network-error" role="alert">{channel.state.error}</p>}
          </>
        ) : (
          <>
            <div className="signal-channel-presence"><i />{onlineCount} إشارات متصلة</div>
            <div className="signal-preset-buttons">
              {['hello', 'looking-for-coop', 'looking-for-chess', 'great-puzzle', 'thanks'].map((presetId) => (
                <button type="button" key={presetId} onClick={() => channel.sendCommand('preset-chat', { presetId })}>{PRESET_LABELS[presetId]?.[locale]}</button>
              ))}
            </div>
            <div className="signal-live-feed" aria-live="polite">
              {channel.state.events.slice(-5).map((event) => <p key={event.eventId}><strong>{String(event.payload.displayName ?? 'SIGNAL')}</strong>{presetText(event.payload.presetId, locale)}</p>)}
            </div>
            <GameButton size="sm" variant="ghost" onClick={channel.leave}>فصل القناة</GameButton>
          </>
        )}
      </GlassPanel>
    </div>
  );
}
