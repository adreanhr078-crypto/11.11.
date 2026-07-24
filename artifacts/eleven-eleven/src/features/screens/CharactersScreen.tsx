import { useMemo } from 'react';
import { useGameStore } from '../../stores/gameStore';
import {
  GameProgress,
  GlassPanel,
  HudPanel,
} from '../../ui/design-system';
import { createCharactersScreenReadModel } from '../../application/ui/gameUiReadModels';
import { EchoPresence } from '../../ui/presentation';

export default function CharactersScreen() {
  const state = useGameStore();
  const model = useMemo(() => createCharactersScreenReadModel(state), [state]);

  return (
    <div className="shell-screen shell-characters-screen">
      <header className="shell-screen-heading">
        <span className="shell-screen-code">07</span>
        <span>
          <small>CHARACTER FILES</small>
          <h1>ملفات الشخصيات</h1>
        </span>
        <div className="shell-screen-heading__metrics">
          <span>{model.profiles.filter((profile) => profile.unlocked).length} ملفات نشطة</span>
          <span>{state.narrative.decisionHistory.length} قرارات</span>
        </div>
      </header>

      <div className="shell-characters-screen__grid">
        <HudPanel
          className="shell-characters-screen__hero"
          tone="danger"
          eyebrow="Echo Focus"
          title="الملف المحوري"
        >
          <EchoPresence variant="profile" eager />
          <div className="shell-characters-screen__hero-copy">
            <strong>Echo</strong>
            <p>
              هذا الملف يعكس الحالة الحالية المرتبطة بالقرارات والذكريات وتقدم الألغاز.
            </p>
            <GameProgress
              value={state.echo.memoryStability}
              label="استقرار الذاكرة"
              tone="memory"
            />
          </div>
        </HudPanel>

        <section className="shell-characters-screen__list">
          {model.profiles.map((profile) => (
            <GlassPanel
              key={profile.id}
              tone={profile.unlocked ? 'rare' : 'neutral'}
              title={profile.label}
            >
              <div className="shell-characters-screen__profile">
                <span>{profile.role}</span>
                <strong>{profile.unlocked ? 'متاح' : 'محجوب'}</strong>
              </div>
              <GameProgress
                value={profile.signal}
                label={profile.signalLabel}
                tone={profile.unlocked ? 'danger' : 'neutral'}
              />
            </GlassPanel>
          ))}
        </section>
      </div>
    </div>
  );
}

