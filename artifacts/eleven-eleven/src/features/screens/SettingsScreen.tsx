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
