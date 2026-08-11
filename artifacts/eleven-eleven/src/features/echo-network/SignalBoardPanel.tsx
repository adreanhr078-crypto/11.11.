import { useEffect, useState } from 'react';
import type { NetworkLocale } from '../../domain/echo-network/contracts';
import type { NetworkEligibilitySnapshot } from '../../infrastructure/echo-network/echoNetworkApi';
import {
  EchoNetworkApiError,
  acceptCommunityRules,
  fetchCommunityPosts,
  submitForgePuzzle,
  type CommunityPostSnapshot,
  type ForgeSubmissionInput,
} from '../../infrastructure/echo-network/echoNetworkApi';
import { GameButton, GlassPanel, HudPanel } from '../../ui/design-system';
import { SponsorTransmission } from './SponsorTransmission';
import { SocialConnectionsPanel } from './SocialConnectionsPanel';
import { LiveSignalRooms } from './LiveSignalRooms';

const EMPTY_FORGE: ForgeSubmissionInput = {
  locale: 'ar',
  title: '',
  mechanic: 'sequence',
  prompt: '',
  options: ['', '', '', ''],
  answerIndex: 0,
  canonAssetId: null,
};

export function SignalBoardPanel({
  locale,
  eligibility,
  onEligibility,
}: {
  locale: NetworkLocale;
  eligibility: NetworkEligibilitySnapshot;
  onEligibility: (eligibility: NetworkEligibilitySnapshot) => void;
}) {
  const [posts, setPosts] = useState<CommunityPostSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [rulesBusy, setRulesBusy] = useState(false);
  const [forge, setForge] = useState<ForgeSubmissionInput>({ ...EMPTY_FORGE, locale });
  const [forgeBusy, setForgeBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setForge((value) => ({ ...value, locale }));
    setLoading(true);
    void fetchCommunityPosts(locale)
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [locale]);

  const submit = async () => {
    setForgeBusy(true);
    setMessage(null);
    try {
      await submitForgePuzzle(forge);
      setForge({ ...EMPTY_FORGE, locale });
      setMessage(locale === 'ar'
        ? 'نجح المدقق الآلي وأُرسل اللغز للمراجعة. لم يُنشر ولم تُمنح XP.'
        : 'The automated check passed and the puzzle is pending review. It was not published and grants no XP.');
    } catch (error) {
      setMessage(error instanceof EchoNetworkApiError ? error.message : 'تعذر إرسال اللغز.');
    } finally {
      setForgeBusy(false);
    }
  };

  return (
    <section className="echo-network-community" aria-labelledby="signal-board-title">
      <header className="echo-network-mode__heading"><span><small>SAFE SOCIAL LAYER</small><h2 id="signal-board-title">لوحة الإشارة</h2></span><i>PRESET-ONLY PUBLIC CHAT</i></header>
      {!eligibility.communityRulesAccepted || !eligibility.ageGateConfirmed ? (
        <HudPanel tone="danger" eyebrow="COMMUNITY GATE" title="قبل دخول المجتمع">
          <p>القنوات العامة تستخدم عبارات جاهزة. لا روابط أو رفع صور أو رسائل خاصة لغير الأصدقاء. الحظر والكتم والبلاغ متاحان عند فتح الرسائل المتبادلة.</p>
          <label className="echo-network-confirmation">
            <input type="checkbox" checked={ageConfirmed} onChange={(event) => setAgeConfirmed(event.target.checked)} />
            <span>أؤكد أن عمري 16 عامًا أو أكثر وأوافق على قواعد المجتمع. لن يُحفظ تاريخ ميلادي.</span>
          </label>
          <GameButton
            variant="danger"
            disabled={!ageConfirmed || rulesBusy}
            onClick={() => {
              setRulesBusy(true);
              void acceptCommunityRules()
                .then(onEligibility)
                .catch((error) => setMessage(error instanceof Error ? error.message : 'تعذر حفظ الموافقة.'))
                .finally(() => setRulesBusy(false));
            }}
          >
            {rulesBusy ? 'جارٍ الحفظ…' : 'قبول والدخول'}
          </GameButton>
        </HudPanel>
      ) : (
        <>
          <SocialConnectionsPanel locale={locale} />
          <LiveSignalRooms locale={locale} />
          <div className="echo-network-community-grid">
            <div className="signal-board-feed" aria-live="polite">
              {loading && <p>جارٍ التقاط البث الرسمي…</p>}
              {!loading && posts.length === 0 && <p>لا توجد منشورات معتمدة في هذه القناة بعد.</p>}
              {posts.map((post) => (
                <article key={post.post_id}>
                  <span><strong>{post.author_name}</strong><small>{new Date(post.created_at).toLocaleDateString(locale)}</small></span>
                  <p>{post.body}</p>
                  <i>{post.status.toUpperCase()}</i>
                </article>
              ))}
            </div>
            <GlassPanel tone="memory" eyebrow="FIND A TEAM" title="عبارات عامة آمنة">
              <p>عند ربط قناة المجتمع الحية يمكنك إرسال العبارات التالية فقط:</p>
              <div className="signal-preset-list">
                {['أبحث عن فريق تعاون', 'أبحث عن مباراة شطرنج', 'لغز رائع', 'أحسنتم', 'شكرًا'].map((value) => <span key={value}>{value}</span>)}
              </div>
              <small>النص الحر العام يبقى مغلقًا حتى يتوفر فريق مراقبة بشري بزمن استجابة محدد.</small>
            </GlassPanel>
          </div>
          <HudPanel tone="rare" eyebrow="PUZZLE FORGE" title="مصنع الألغاز الآمن">
            <p>أنشئ لغزًا من مكونات قابلة للتحقق. يمر الحل بفحص آلي ثم مراجعة؛ لا يُنشر فورًا ولا تمنح المنشورات XP.</p>
            <div className="puzzle-forge-form">
              <label>العنوان<input value={forge.title} maxLength={80} onChange={(event) => setForge((value) => ({ ...value, title: event.target.value }))} /></label>
              <label>النمط<select value={forge.mechanic} onChange={(event) => setForge((value) => ({ ...value, mechanic: event.target.value as ForgeSubmissionInput['mechanic'] }))}><option value="sequence">ترتيب</option><option value="cipher">شيفرة</option><option value="wiring">أسلاك</option><option value="evidence">أدلة</option><option value="pattern">نمط</option></select></label>
              <label className="puzzle-forge-form__wide">السؤال<textarea value={forge.prompt} maxLength={500} onChange={(event) => setForge((value) => ({ ...value, prompt: event.target.value }))} /></label>
              {forge.options.map((option, index) => (
                <label key={index}>الخيار {index + 1}<span><input type="radio" name="forge-answer" checked={forge.answerIndex === index} onChange={() => setForge((value) => ({ ...value, answerIndex: index }))} aria-label={`الخيار ${index + 1} هو الحل`} /><input value={option} maxLength={80} onChange={(event) => setForge((value) => ({ ...value, options: value.options.map((entry, optionIndex) => optionIndex === index ? event.target.value : entry) }))} /></span></label>
              ))}
            </div>
            <GameButton
              variant="rare"
              disabled={forgeBusy || forge.title.trim().length < 3 || forge.prompt.trim().length < 12 || forge.options.some((option) => !option.trim())}
              onClick={() => void submit()}
            >
              {forgeBusy ? 'المدقق يعمل…' : 'فحص وإرسال للمراجعة'}
            </GameButton>
            {message && <p className="echo-network-callout" role="status">{message}</p>}
          </HudPanel>
        </>
      )}
      <SponsorTransmission placement="community-board" />
    </section>
  );
}
