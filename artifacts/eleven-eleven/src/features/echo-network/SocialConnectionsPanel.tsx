import { useEffect, useState } from 'react';
import type { NetworkLocale } from '../../domain/echo-network/contracts';
import {
  EchoNetworkApiError,
  fetchSocialGraph,
  performSocialAction,
  type SocialActionInput,
  type SocialSnapshot,
} from '../../infrastructure/echo-network/echoNetworkApi';
import { GameButton, GlassPanel } from '../../ui/design-system';

export function SocialConnectionsPanel({ locale }: { locale: NetworkLocale }) {
  const [social, setSocial] = useState<SocialSnapshot | null>(null);
  const [signalCode, setSignalCode] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<{ uid: string; username: string } | null>(null);
  const [reportDetail, setReportDetail] = useState('');

  const load = () => {
    setBusy('load');
    setMessage(null);
    void fetchSocialGraph()
      .then(setSocial)
      .catch((error) => setMessage(error instanceof Error ? error.message : 'تعذر تحميل قائمة الأصدقاء.'))
      .finally(() => setBusy(null));
  };

  useEffect(load, []);

  const act = async (input: SocialActionInput, key: string) => {
    setBusy(key);
    setMessage(null);
    try {
      setSocial(await performSocialAction(input));
      setSignalCode('');
      setReportTarget(null);
      setReportDetail('');
      setMessage(locale === 'ar' ? 'تم تحديث شبكة الأصدقاء بأمان.' : 'Your friend network was updated safely.');
    } catch (error) {
      setMessage(error instanceof EchoNetworkApiError ? error.message : 'تعذر إتمام الإجراء.');
    } finally {
      setBusy(null);
    }
  };

  const copyCode = async () => {
    if (!social?.signalCode) return;
    try {
      await navigator.clipboard.writeText(social.signalCode);
      setMessage(locale === 'ar' ? 'نُسخ رمز الإشارة.' : 'Signal code copied.');
    } catch {
      setMessage(locale === 'ar'
        ? `انسخ الرمز يدويًا: ${social.signalCode}`
        : `Copy the code manually: ${social.signalCode}`);
    }
  };

  return (
    <GlassPanel tone="rare" eyebrow="FRIENDS · MUTUAL ONLY" title={locale === 'ar' ? 'خلايا Echo والأصدقاء' : 'Echo cells and friends'}>
      <p>{locale === 'ar'
        ? 'شارك رمزك الخاص فقط مع من تعرفه. الرسائل الحرة مغلقة؛ لا تمنح الصداقة أو المنشورات XP.'
        : 'Share your private code only with people you know. Free text remains disabled, and social actions never grant XP.'}</p>
      {busy === 'load' && !social && <p role="status">جارٍ مزامنة الإشارات…</p>}
      {social && (
        <>
          <div className="signal-friend-code">
            <span><small>YOUR SIGNAL CODE</small><strong dir="ltr">{social.signalCode}</strong></span>
            <GameButton size="sm" variant="secondary" onClick={() => void copyCode()}>نسخ</GameButton>
          </div>
          <form
            className="signal-friend-request"
            onSubmit={(event) => {
              event.preventDefault();
              if (signalCode.trim().length >= 8) void act({ action: 'request', signalCode }, 'request');
            }}
          >
            <label>رمز صديق<input dir="ltr" value={signalCode} maxLength={16} placeholder="ECHO-XXXXXX" onChange={(event) => setSignalCode(event.target.value.toUpperCase())} /></label>
            <GameButton type="submit" size="sm" variant="rare" disabled={signalCode.trim().length < 8 || busy !== null}>إرسال طلب</GameButton>
          </form>

          {social.incoming.length > 0 && (
            <div className="signal-relationship-list">
              <small>طلبات واردة</small>
              {social.incoming.map((player) => (
                <article key={player.friend_uid}>
                  <strong>{player.username}</strong>
                  <span>
                    <GameButton size="sm" variant="rare" disabled={busy !== null} onClick={() => void act({ action: 'accept', targetUid: player.friend_uid }, `accept-${player.friend_uid}`)}>قبول</GameButton>
                    <GameButton size="sm" variant="ghost" disabled={busy !== null} onClick={() => void act({ action: 'decline', targetUid: player.friend_uid }, `decline-${player.friend_uid}`)}>رفض</GameButton>
                  </span>
                </article>
              ))}
            </div>
          )}

          <div className="signal-relationship-list">
            <small>الأصدقاء · {social.friends.length}</small>
            {social.friends.length === 0 && <p>لا توجد إشارات متبادلة بعد.</p>}
            {social.friends.map((player) => (
              <article key={player.friend_uid}>
                <strong>{player.username}</strong>
                <span>
                  <GameButton size="sm" variant="ghost" disabled={busy !== null} onClick={() => void act({ action: player.muted ? 'unmute' : 'mute', targetUid: player.friend_uid }, `mute-${player.friend_uid}`)}>{player.muted ? 'إلغاء الكتم' : 'كتم'}</GameButton>
                  <GameButton size="sm" variant="ghost" disabled={busy !== null} onClick={() => setReportTarget({ uid: player.friend_uid, username: player.username })}>بلاغ</GameButton>
                  <GameButton size="sm" variant="danger" disabled={busy !== null} onClick={() => void act({ action: 'block', targetUid: player.friend_uid }, `block-${player.friend_uid}`)}>حظر</GameButton>
                </span>
              </article>
            ))}
          </div>

          {social.outgoing.length > 0 && <small className="signal-pending-count">{social.outgoing.length} طلبات صداقة بانتظار الرد</small>}
          {social.blocked.length > 0 && (
            <details className="signal-safety-list">
              <summary>المحظورون · {social.blocked.length}</summary>
              {social.blocked.map((player) => <span key={player.user_id}><b>{player.username}</b><button type="button" onClick={() => void act({ action: 'unblock', targetUid: player.user_id }, `unblock-${player.user_id}`)}>إلغاء الحظر</button></span>)}
            </details>
          )}
        </>
      )}
      {reportTarget && (
        <form
          className="signal-report-form"
          onSubmit={(event) => {
            event.preventDefault();
            void act({ action: 'report', targetType: 'profile', targetId: reportTarget.uid, reason: 'abuse', detail: reportDetail }, `report-${reportTarget.uid}`);
          }}
        >
          <strong>بلاغ عن {reportTarget.username}</strong>
          <textarea value={reportDetail} maxLength={500} placeholder="صف المشكلة دون مشاركة بيانات شخصية" onChange={(event) => setReportDetail(event.target.value)} />
          <span><GameButton type="submit" size="sm" variant="danger" disabled={busy !== null}>إرسال للمراجعة</GameButton><GameButton size="sm" variant="ghost" onClick={() => setReportTarget(null)}>إلغاء</GameButton></span>
        </form>
      )}
      {message && <p className="echo-network-callout" role="status">{message}</p>}
    </GlassPanel>
  );
}
