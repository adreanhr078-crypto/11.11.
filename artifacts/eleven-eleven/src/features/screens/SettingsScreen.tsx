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

const QUALITY_OPTIONS: Array<{ id: QualityTier; label: string }> = [
  { id: 'mobile', label: 'موفر للطاقة' },
  { id: 'balanced', label: 'متوازن' },
  { id: 'high', label: 'سينمائي' },
];

const MOTION_OPTIONS: Array<{ id: MotionTier; label: string }> = [
  { id: 'reduced', label: 'مخفض' },
  { id: 'balanced', label: 'متوازن' },
  { id: 'cinematic', label: 'سينمائي' },
];

const SFX_VOLUME_OPTIONS = [
  { value: 0.35, label: 'هادئ' },
  { value: 0.7, label: 'متوازن' },
  { value: 1, label: 'سينمائي' },
] as const;

export default function SettingsScreen() {
  const cinematic = useGameStore((state) => state.cinematic);
  const actions = useGameStore((state) => state.actions);
  const preferences = useUiPreferencesStore();
  const isArabic = preferences.locale === 'ar';

  return (
    <div className="shell-screen shell-settings-screen">
      <header className="shell-screen-heading">
        <span className="shell-screen-code">12</span>
        <span>
          <small>DEVICE PROFILE // ANDROID LANDSCAPE</small>
          <h1>إعدادات التجربة</h1>
        </span>
      </header>

      <HudPanel
        tone="memory"
        eyebrow="PERFORMANCE"
        title="جودة العرض"
      >
        <div className="shell-settings-options">
          {QUALITY_OPTIONS.map((option) => (
            <GameButton
              key={option.id}
              variant={preferences.quality === option.id ? 'memory' : 'ghost'}
              onClick={() => preferences.setQuality(option.id)}
            >
              {option.label}
            </GameButton>
          ))}
        </div>
        <p className="shell-muted-copy">
          يضبط دقة العرض والظلال والجزيئات والوهج بما يناسب الهاتف.
        </p>
      </HudPanel>

      <HudPanel
        tone="danger"
        eyebrow="ACCESSIBILITY"
        title="الحركة"
      >
        <div className="shell-settings-options">
          {MOTION_OPTIONS.map((option) => (
            <GameButton
              key={option.id}
              variant={preferences.motion === option.id ? 'primary' : 'ghost'}
              onClick={() => preferences.setMotion(option.id)}
            >
              {option.label}
            </GameButton>
          ))}
        </div>
      </HudPanel>

      <HudPanel
        tone="rare"
        eyebrow="LANGUAGE / DIRECTION"
        title="اللغة واتجاه الواجهة"
      >
        <div className="shell-settings-options">
          <GameButton
            variant={preferences.locale === 'ar' ? 'rare' : 'ghost'}
            onClick={() => preferences.setLocale('ar')}
          >
            العربية · RTL
          </GameButton>
          <GameButton
            variant={preferences.locale === 'en' ? 'rare' : 'ghost'}
            onClick={() => preferences.setLocale('en')}
          >
            English · LTR
          </GameButton>
        </div>
        <p className="shell-muted-copy">
          تغيّر اللغة كتالوج شبكة Echo واتجاه التطبيق فورًا؛ تستمر ترجمة بقية المشاهد ضمن كتالوج الإصدار العالمي.
        </p>
      </HudPanel>

      <GlassPanel
        tone="memory"
        eyebrow="CONTEXTUAL ADS ONLY"
        title="الإعلانات والخصوصية"
      >
        <p className="shell-muted-copy">
          اللعبة مجانية وتعتمد على الإعلانات فقط. تظهر الإعلانات السياقية في مركز الشبكة ولوحة المجتمع لا أثناء القصة أو الألغاز أو الشطرنج أو التعاون أو المشاهد السينمائية. لا إعلانات بمكافآت ولا دفع للفوز.
        </p>
        <div className="shell-settings-options">
          <GameButton
            variant={preferences.adConsent === 'contextual' ? 'memory' : 'ghost'}
            onClick={() => preferences.setAdConsent('contextual')}
          >
            السماح بالسياقية
          </GameButton>
          <GameButton
            variant={preferences.adConsent === 'declined' ? 'secondary' : 'ghost'}
            onClick={() => preferences.setAdConsent('declined')}
          >
            رفض الإعلانات
          </GameButton>
        </div>
        <small className="shell-muted-copy">حد العرض: إعلان واحد لكل موضع كل 30 دقيقة، ولا تُستخدم بيانات الدردشة في الاستهداف.</small>
      </GlassPanel>

      <GlassPanel
        className="shell-settings-telemetry"
        tone="neutral"
        eyebrow="OPTIONAL PRODUCT MEASUREMENT"
        title={isArabic ? 'قياس التجربة الاختياري' : 'Optional experience measurement'}
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
            {isArabic
              ? 'يساعدنا القياس الاختياري على تحسين تدفق اللعب. لا نرسل اسمك أو رسائلك أو إجابات الألغاز أو أي نص حر؛ ولا يمنح هذا الخيار XP أو جوائز.'
              : 'Optional measurement helps us improve play flow. It never sends your name, messages, puzzle answers, or free text, and it never grants XP or rewards.'}
          </p>
          <div
            className="shell-settings-options"
            role="group"
            aria-label={isArabic ? 'اختيار قياس التجربة' : 'Experience measurement choice'}
          >
            <GameButton
              variant={preferences.telemetryConsent === 'granted' ? 'secondary' : 'ghost'}
              aria-pressed={preferences.telemetryConsent === 'granted'}
              onClick={() => preferences.setTelemetryConsent('granted')}
            >
              {isArabic ? 'السماح بالقياس المجهول' : 'Allow anonymous measurement'}
            </GameButton>
            <GameButton
              variant={preferences.telemetryConsent === 'declined' ? 'secondary' : 'ghost'}
              aria-pressed={preferences.telemetryConsent === 'declined'}
              onClick={() => preferences.setTelemetryConsent('declined')}
            >
              {isArabic ? 'عدم السماح' : 'Do not allow'}
            </GameButton>
          </div>
          <output className="shell-settings-telemetry__status" data-consent={preferences.telemetryConsent}>
            <b>{isArabic ? 'الحالة:' : 'Status:'}</b>{' '}
            {preferences.telemetryConsent === 'granted'
              ? isArabic
                ? 'الموافقة محفوظة. لا يبدأ القياس إلا عند تفعيل الخادم أيضًا.'
                : 'Your consent is saved. Measurement starts only when the server is also enabled.'
              : preferences.telemetryConsent === 'declined'
                ? isArabic ? 'موقوف. يمكنك تغيير القرار في أي وقت.' : 'Off. You can change this at any time.'
                : isArabic ? 'لم تختر بعد؛ القياس متوقف.' : 'No choice yet; measurement is off.'}
          </output>
        </div>
      </GlassPanel>

      <HudPanel
        tone="progression"
        eyebrow="OPTIONAL NOTIFICATIONS"
        title="الإشعارات وساعات الهدوء"
      >
        <div className="shell-settings-options">
          <GameButton
            variant={preferences.notificationsEnabled ? 'secondary' : 'ghost'}
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
            {preferences.notificationsEnabled ? 'الإشعارات اختيارية · مفعلة' : 'تفعيل الإشعارات الاختيارية'}
          </GameButton>
          <GameButton
            variant={preferences.quietHoursStart === 22 && preferences.quietHoursEnd === 8 ? 'secondary' : 'ghost'}
            onClick={() => preferences.setQuietHours(22, 8)}
          >
            هدوء 22:00–08:00
          </GameButton>
          <GameButton
            variant={preferences.quietHoursStart === 20 && preferences.quietHoursEnd === 7 ? 'secondary' : 'ghost'}
            onClick={() => preferences.setQuietHours(20, 7)}
          >
            هدوء 20:00–07:00
          </GameButton>
        </div>
        <p className="shell-muted-copy">حد أقصى رسالتان نظاميتان أسبوعيًا. لا عقوبة عند عدم العودة ولا فقدان لسلسلة.</p>
      </HudPanel>

      <GlassPanel
        tone="rare"
        eyebrow="ANIME CINEMATIC"
        title="الصوت والترجمة"
      >
        <dl className="shell-settings-list">
          <div>
            <dt>مؤثرات اللعب</dt>
            <dd>
              <GameButton
                size="sm"
                variant={preferences.audioEnabled ? 'rare' : 'ghost'}
                onClick={() => preferences.setAudioEnabled(!preferences.audioEnabled)}
              >
                {preferences.audioEnabled ? 'مفعّلة' : 'صامتة'}
              </GameButton>
            </dd>
          </div>
          <div>
            <dt>شدة مؤثرات المكافآت</dt>
            <dd className="shell-settings-volume" aria-label="شدة مؤثرات اللعب">
              {SFX_VOLUME_OPTIONS.map((option) => (
                <GameButton
                  key={option.value}
                  size="sm"
                  variant={preferences.sfxVolume === option.value ? 'memory' : 'ghost'}
                  disabled={!preferences.audioEnabled}
                  onClick={() => preferences.setSfxVolume(option.value)}
                >
                  {option.label}
                </GameButton>
              ))}
            </dd>
          </div>
          <div>
            <dt>الأداء الصوتي</dt>
            <dd>日本語 · ثابت للحلقات</dd>
          </div>
          <div>
            <dt>الترجمة</dt>
            <dd>
              <GameButton
                size="sm"
                variant={
                  cinematic.preferences.subtitlesEnabled
                    ? 'rare'
                    : 'ghost'
                }
                onClick={() => actions.setCinematicPreferences({
                  subtitlesEnabled: !cinematic.preferences.subtitlesEnabled,
                })}
              >
                {cinematic.preferences.subtitlesEnabled ? 'مفعلة' : 'معطلة'}
              </GameButton>
            </dd>
          </div>
          <div>
            <dt>التقدم التلقائي</dt>
            <dd>
              <GameButton
                size="sm"
                variant={
                  cinematic.preferences.autoAdvance
                    ? 'rare'
                    : 'ghost'
                }
                onClick={() => actions.setCinematicPreferences({
                  autoAdvance: !cinematic.preferences.autoAdvance,
                })}
              >
                {cinematic.preferences.autoAdvance ? 'مفعل' : 'معطل'}
              </GameButton>
            </dd>
          </div>
        </dl>
      </GlassPanel>
    </div>
  );
}
