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
