import { useGameStore } from '../../stores/gameStore';
import {
  GameButton,
  GlassPanel,
  HudPanel,
} from '../../ui/design-system';
import {
  useUiPreferencesStore,
} from '../../app/shell/shellStore';
import type {
  MotionTier,
  QualityTier,
} from '../../ui/design-system';

const QUALITY_OPTIONS: QualityTier[] = ['mobile', 'balanced', 'high'];
const MOTION_OPTIONS: MotionTier[] = ['reduced', 'balanced', 'cinematic'];
const SFX_VOLUME_OPTIONS = [0.35, 0.7, 1] as const;

type SettingsCopy = {
  heading: string;
  performanceTitle: string;
  performanceDescription: string;
  qualityChoice: string;
  quality: Record<QualityTier, string>;
  motionTitle: string;
  motionChoice: string;
  motion: Record<MotionTier, string>;
  languageTitle: string;
  languageChoice: string;
  languageDescription: string;
  adsTitle: string;
  adsDescription: string;
  allowContextual: string;
  declineAds: string;
  adCap: string;
  telemetryTitle: string;
  telemetryDescription: string;
  telemetryChoice: string;
  allowMeasurement: string;
  declineMeasurement: string;
  status: string;
  telemetryGranted: string;
  telemetryDeclined: string;
  telemetryUnset: string;
  notificationsTitle: string;
  notificationsOn: string;
  enableNotifications: string;
  quietHoursChoice: string;
  quietHoursDefault: string;
  quietHoursEarly: string;
  notificationDetail: string;
  soundTitle: string;
  gameSfx: string;
  sfxIntensity: string;
  volumeChoice: string;
  volume: Record<'quiet' | 'balanced' | 'cinematic', string>;
  voicePerformance: string;
  voiceUnavailable: string;
  subtitles: string;
  autoAdvance: string;
  enabled: string;
  disabled: string;
};

const SETTINGS_COPY: Record<'ar' | 'en', SettingsCopy> = {
  ar: {
    heading: 'إعدادات التجربة',
    performanceTitle: 'جودة العرض',
    performanceDescription: 'يضبط دقة العرض والظلال والجزيئات والوهج بما يناسب الهاتف.',
    qualityChoice: 'اختيار جودة العرض',
    quality: { mobile: 'موفر للطاقة', balanced: 'متوازن', high: 'سينمائي' },
    motionTitle: 'الحركة',
    motionChoice: 'اختيار مستوى الحركة',
    motion: { reduced: 'مخفض', balanced: 'متوازن', cinematic: 'سينمائي' },
    languageTitle: 'اللغة واتجاه الواجهة',
    languageChoice: 'اختيار اللغة واتجاه الواجهة',
    languageDescription: 'تغيّر اللغة كتالوج شبكة Echo واتجاه التطبيق فورًا؛ تستمر ترجمة بقية المشاهد ضمن كتالوج الإصدار العالمي.',
    adsTitle: 'الإعلانات والخصوصية',
    adsDescription: 'اللعبة مجانية وتعتمد على الإعلانات فقط. تظهر الإعلانات السياقية في مركز الشبكة ولوحة المجتمع لا أثناء القصة أو الألغاز أو الشطرنج أو التعاون أو المشاهد السينمائية. لا إعلانات بمكافآت ولا دفع للفوز.',
    allowContextual: 'السماح بالسياقية',
    declineAds: 'رفض الإعلانات',
    adCap: 'حد العرض: إعلان واحد لكل موضع كل 30 دقيقة، ولا تُستخدم بيانات الدردشة في الاستهداف.',
    telemetryTitle: 'قياس التجربة الاختياري',
    telemetryDescription: 'يساعدنا القياس الاختياري على تحسين تدفق اللعب. لا نرسل اسمك أو رسائلك أو إجابات الألغاز أو أي نص حر؛ ولا يمنح هذا الخيار XP أو جوائز.',
    telemetryChoice: 'اختيار قياس التجربة',
    allowMeasurement: 'السماح بالقياس المجهول',
    declineMeasurement: 'عدم السماح',
    status: 'الحالة:',
    telemetryGranted: 'الموافقة محفوظة. لا يبدأ القياس إلا عند تفعيل الخادم أيضًا.',
    telemetryDeclined: 'موقوف. يمكنك تغيير القرار في أي وقت.',
    telemetryUnset: 'لم تختر بعد؛ القياس متوقف.',
    notificationsTitle: 'الإشعارات وساعات الهدوء',
    notificationsOn: 'الإشعارات اختيارية · مفعلة',
    enableNotifications: 'تفعيل الإشعارات الاختيارية',
    quietHoursChoice: 'اختيار ساعات الهدوء',
    quietHoursDefault: 'هدوء 22:00–08:00',
    quietHoursEarly: 'هدوء 20:00–07:00',
    notificationDetail: 'حد أقصى رسالتان نظاميتان أسبوعيًا. لا عقوبة عند عدم العودة ولا فقدان لسلسلة.',
    soundTitle: 'الصوت والترجمة',
    gameSfx: 'مؤثرات اللعب',
    sfxIntensity: 'شدة مؤثرات المكافآت',
    volumeChoice: 'شدة مؤثرات اللعب',
    volume: { quiet: 'هادئ', balanced: 'متوازن', cinematic: 'سينمائي' },
    voicePerformance: 'الأداء الصوتي',
    voiceUnavailable: 'غير متاح بعد · المؤثرات النظامية متاحة',
    subtitles: 'الترجمة',
    autoAdvance: 'التقدم التلقائي',
    enabled: 'مفعلة',
    disabled: 'معطلة',
  },
  en: {
    heading: 'Experience settings',
    performanceTitle: 'Display quality',
    performanceDescription: 'Adjusts render resolution, shadows, particles, and glow for your device.',
    qualityChoice: 'Display quality',
    quality: { mobile: 'Power saver', balanced: 'Balanced', high: 'Cinematic' },
    motionTitle: 'Motion',
    motionChoice: 'Motion level',
    motion: { reduced: 'Reduced', balanced: 'Balanced', cinematic: 'Cinematic' },
    languageTitle: 'Language & interface direction',
    languageChoice: 'Language and interface direction',
    languageDescription: 'Changes the Echo Network catalog and application direction immediately. Other surfaces continue through the global-release translation catalog.',
    adsTitle: 'Ads & privacy',
    adsDescription: '11.11 is free and uses contextual advertising only. It appears in the network hub and community board, never during story, puzzles, chess, co-op, or cinematics. There are no rewarded ads and no pay-to-win.',
    allowContextual: 'Allow contextual ads',
    declineAds: 'Decline ads',
    adCap: 'Display limit: one ad per placement every 30 minutes. Chat data is never used for targeting.',
    telemetryTitle: 'Optional experience measurement',
    telemetryDescription: 'Optional measurement helps us improve play flow. It never sends your name, messages, puzzle answers, or free text, and it never grants XP or rewards.',
    telemetryChoice: 'Experience measurement choice',
    allowMeasurement: 'Allow anonymous measurement',
    declineMeasurement: 'Do not allow',
    status: 'Status:',
    telemetryGranted: 'Your consent is saved. Measurement starts only when the server is also enabled.',
    telemetryDeclined: 'Off. You can change this at any time.',
    telemetryUnset: 'No choice yet; measurement is off.',
    notificationsTitle: 'Notifications & quiet hours',
    notificationsOn: 'Notifications are optional · on',
    enableNotifications: 'Enable optional notifications',
    quietHoursChoice: 'Quiet hours',
    quietHoursDefault: 'Quiet 22:00–08:00',
    quietHoursEarly: 'Quiet 20:00–07:00',
    notificationDetail: 'At most two system messages each week. There is no return penalty and no streak loss.',
    soundTitle: 'Sound & subtitles',
    gameSfx: 'Game sound effects',
    sfxIntensity: 'Reward effects intensity',
    volumeChoice: 'Game sound effect intensity',
    volume: { quiet: 'Quiet', balanced: 'Balanced', cinematic: 'Cinematic' },
    voicePerformance: 'Voice performance',
    voiceUnavailable: 'Not available yet · system effects are available',
    subtitles: 'Subtitles',
    autoAdvance: 'Auto-advance',
    enabled: 'Enabled',
    disabled: 'Disabled',
  },
};

export default function SettingsScreen() {
  const cinematic = useGameStore((state) => state.cinematic);
  const actions = useGameStore((state) => state.actions);
  const preferences = useUiPreferencesStore();
  const copy = SETTINGS_COPY[preferences.locale];

  return (
    <div className="shell-screen shell-settings-screen">
      <header className="shell-screen-heading">
        <span className="shell-screen-code">12</span>
        <span>
          <small>DEVICE PROFILE // RESPONSIVE WEB</small>
          <h1>{copy.heading}</h1>
        </span>
      </header>

      <HudPanel
        tone="memory"
        eyebrow="PERFORMANCE"
        title={copy.performanceTitle}
      >
        <div className="shell-settings-options" role="group" aria-label={copy.qualityChoice}>
          {QUALITY_OPTIONS.map((option) => (
            <GameButton
              key={option}
              variant={preferences.quality === option ? 'memory' : 'ghost'}
              aria-pressed={preferences.quality === option}
              onClick={() => preferences.setQuality(option)}
            >
              {copy.quality[option]}
            </GameButton>
          ))}
        </div>
        <p className="shell-muted-copy">
          {copy.performanceDescription}
        </p>
      </HudPanel>

      <HudPanel
        tone="danger"
        eyebrow="ACCESSIBILITY"
        title={copy.motionTitle}
      >
        <div className="shell-settings-options" role="group" aria-label={copy.motionChoice}>
          {MOTION_OPTIONS.map((option) => (
            <GameButton
              key={option}
              variant={preferences.motion === option ? 'primary' : 'ghost'}
              aria-pressed={preferences.motion === option}
              onClick={() => preferences.setMotion(option)}
            >
              {copy.motion[option]}
            </GameButton>
          ))}
        </div>
      </HudPanel>

      <HudPanel
        tone="rare"
        eyebrow="LANGUAGE / DIRECTION"
        title={copy.languageTitle}
      >
        <div className="shell-settings-options" role="group" aria-label={copy.languageChoice}>
          <GameButton
            variant={preferences.locale === 'ar' ? 'rare' : 'ghost'}
            aria-pressed={preferences.locale === 'ar'}
            onClick={() => preferences.setLocale('ar')}
          >
            العربية · RTL
          </GameButton>
          <GameButton
            variant={preferences.locale === 'en' ? 'rare' : 'ghost'}
            aria-pressed={preferences.locale === 'en'}
            onClick={() => preferences.setLocale('en')}
          >
            English · LTR
          </GameButton>
        </div>
        <p className="shell-muted-copy">
          {copy.languageDescription}
        </p>
      </HudPanel>

      <GlassPanel
        tone="memory"
        eyebrow="CONTEXTUAL ADS ONLY"
        title={copy.adsTitle}
      >
        <p className="shell-muted-copy">
          {copy.adsDescription}
        </p>
        <div className="shell-settings-options" role="group" aria-label={copy.adsTitle}>
          <GameButton
            variant={preferences.adConsent === 'contextual' ? 'memory' : 'ghost'}
            aria-pressed={preferences.adConsent === 'contextual'}
            onClick={() => preferences.setAdConsent('contextual')}
          >
            {copy.allowContextual}
          </GameButton>
          <GameButton
            variant={preferences.adConsent === 'declined' ? 'secondary' : 'ghost'}
            aria-pressed={preferences.adConsent === 'declined'}
            onClick={() => preferences.setAdConsent('declined')}
          >
            {copy.declineAds}
          </GameButton>
        </div>
        <small className="shell-muted-copy">{copy.adCap}</small>
      </GlassPanel>

      <GlassPanel
        className="shell-settings-telemetry"
        tone="neutral"
        eyebrow="OPTIONAL PRODUCT MEASUREMENT"
        title={copy.telemetryTitle}
      >
        <div className="shell-settings-telemetry__visual" aria-hidden="true">
          <img
            src="/assets/ui/settings/privacy-signal-contract-v1.webp"
            alt=""
            width="1280"
            height="720"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="shell-settings-telemetry__content">
          <p className="shell-muted-copy">
            {copy.telemetryDescription}
          </p>
          <div
            className="shell-settings-options"
            role="group"
            aria-label={copy.telemetryChoice}
          >
            <GameButton
              variant={preferences.telemetryConsent === 'granted' ? 'secondary' : 'ghost'}
              aria-pressed={preferences.telemetryConsent === 'granted'}
              onClick={() => preferences.setTelemetryConsent('granted')}
            >
              {copy.allowMeasurement}
            </GameButton>
            <GameButton
              variant={preferences.telemetryConsent === 'declined' ? 'secondary' : 'ghost'}
              aria-pressed={preferences.telemetryConsent === 'declined'}
              onClick={() => preferences.setTelemetryConsent('declined')}
            >
              {copy.declineMeasurement}
            </GameButton>
          </div>
          <output className="shell-settings-telemetry__status" data-consent={preferences.telemetryConsent}>
            <b>{copy.status}</b>{' '}
            {preferences.telemetryConsent === 'granted'
              ? copy.telemetryGranted
              : preferences.telemetryConsent === 'declined'
                ? copy.telemetryDeclined
                : copy.telemetryUnset}
          </output>
        </div>
      </GlassPanel>

      <HudPanel
        tone="progression"
        eyebrow="OPTIONAL NOTIFICATIONS"
        title={copy.notificationsTitle}
      >
        <div className="shell-settings-options">
          <GameButton
            variant={preferences.notificationsEnabled ? 'secondary' : 'ghost'}
            aria-pressed={preferences.notificationsEnabled}
            onClick={() => {
              if (preferences.notificationsEnabled) {
                preferences.setNotificationsEnabled(false);
                return;
              }
              if (!('Notification' in window)) return;
              void Notification.requestPermission().then((permission) => {
                preferences.setNotificationsEnabled(permission === 'granted');
              });
            }}
          >
            {preferences.notificationsEnabled ? copy.notificationsOn : copy.enableNotifications}
          </GameButton>
        </div>
        <div className="shell-settings-options" role="group" aria-label={copy.quietHoursChoice}>
          <GameButton
            variant={preferences.quietHoursStart === 22 && preferences.quietHoursEnd === 8 ? 'secondary' : 'ghost'}
            aria-pressed={preferences.quietHoursStart === 22 && preferences.quietHoursEnd === 8}
            onClick={() => preferences.setQuietHours(22, 8)}
          >
            {copy.quietHoursDefault}
          </GameButton>
          <GameButton
            variant={preferences.quietHoursStart === 20 && preferences.quietHoursEnd === 7 ? 'secondary' : 'ghost'}
            aria-pressed={preferences.quietHoursStart === 20 && preferences.quietHoursEnd === 7}
            onClick={() => preferences.setQuietHours(20, 7)}
          >
            {copy.quietHoursEarly}
          </GameButton>
        </div>
        <p className="shell-muted-copy">{copy.notificationDetail}</p>
      </HudPanel>

      <GlassPanel
        tone="rare"
        eyebrow="ANIME CINEMATIC"
        title={copy.soundTitle}
      >
        <dl className="shell-settings-list">
          <div>
            <dt>{copy.gameSfx}</dt>
            <dd>
              <GameButton
                size="sm"
                variant={preferences.audioEnabled ? 'rare' : 'ghost'}
                aria-pressed={preferences.audioEnabled}
                onClick={() => preferences.setAudioEnabled(!preferences.audioEnabled)}
              >
                {preferences.audioEnabled ? copy.enabled : copy.disabled}
              </GameButton>
            </dd>
          </div>
          <div>
            <dt>{copy.sfxIntensity}</dt>
            <dd className="shell-settings-volume" aria-label={copy.volumeChoice}>
              {SFX_VOLUME_OPTIONS.map((option, index) => {
                const label = copy.volume[index === 0 ? 'quiet' : index === 1 ? 'balanced' : 'cinematic'];
                return (
                <GameButton
                  key={option}
                  size="sm"
                  variant={preferences.sfxVolume === option ? 'memory' : 'ghost'}
                  aria-pressed={preferences.sfxVolume === option}
                  disabled={!preferences.audioEnabled}
                  onClick={() => preferences.setSfxVolume(option)}
                >
                  {label}
                </GameButton>
                );
              })}
            </dd>
          </div>
          <div>
            <dt>{copy.voicePerformance}</dt>
            <dd>{copy.voiceUnavailable}</dd>
          </div>
          <div>
            <dt>{copy.subtitles}</dt>
            <dd>
              <GameButton
                size="sm"
                variant={
                  cinematic.preferences.subtitlesEnabled
                    ? 'rare'
                    : 'ghost'
                }
                aria-pressed={cinematic.preferences.subtitlesEnabled}
                onClick={() => actions.setCinematicPreferences({
                  subtitlesEnabled: !cinematic.preferences.subtitlesEnabled,
                })}
              >
                {cinematic.preferences.subtitlesEnabled ? copy.enabled : copy.disabled}
              </GameButton>
            </dd>
          </div>
          <div>
            <dt>{copy.autoAdvance}</dt>
            <dd>
              <GameButton
                size="sm"
                variant={
                  cinematic.preferences.autoAdvance
                    ? 'rare'
                    : 'ghost'
                }
                aria-pressed={cinematic.preferences.autoAdvance}
                onClick={() => actions.setCinematicPreferences({
                  autoAdvance: !cinematic.preferences.autoAdvance,
                })}
              >
                {cinematic.preferences.autoAdvance ? copy.enabled : copy.disabled}
              </GameButton>
            </dd>
          </div>
        </dl>
      </GlassPanel>
    </div>
  );
}
