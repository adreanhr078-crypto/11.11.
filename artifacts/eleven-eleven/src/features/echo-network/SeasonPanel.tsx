import { seasonAt, seasonWeekAt } from '../../domain/echo-network/seasonCatalog';
import type { NetworkSnapshot } from '../../infrastructure/echo-network/echoNetworkApi';
import { GameButton, GameProgress, GlassPanel, HudPanel } from '../../ui/design-system';

const CHARACTER_ASSETS: Record<string, string> = {
  yuki: '/assets/avatars/rare-yuki-v1.webp',
  nara: '/assets/avatars/rare-nara-v1.webp',
  kenja: '/assets/avatars/rare-kenja-v1.webp',
  lina: '/assets/avatars/rare-lina-v1.webp',
  zero: '/assets/avatars/rare-zero-v1.webp',
  echo: '/assets/characters/echo-portrait-v1.png',
};

export function SeasonPanel({
  network,
  onOpenWeekly,
  onOpenCoop,
}: {
  network: NetworkSnapshot | null;
  onOpenWeekly: () => void;
  onOpenCoop: () => void;
}) {
  const season = seasonAt();
  const currentWeek = seasonWeekAt();
  const completed = new Set(
    (network?.seasonProgress ?? [])
      .filter((progress) => progress.season_id === season.id && progress.status === 'completed')
      .map((progress) => progress.activity_id),
  );
  const current = season.activities.find((activity) => activity.week === currentWeek)!;
  const bondByCharacter = new Map(
    (network?.characterBonds ?? []).map((bond) => [bond.character_id, Number(bond.bond_points)]),
  );

  return (
    <section className="echo-network-season" aria-labelledby="season-title">
      <div className="echo-network-season__hero" style={{ backgroundImage: `url(${CHARACTER_ASSETS[current.focusCharacter]})` }}>
        <span><small>8-WEEK ARCHIVE-SAFE SEASON</small><h2 id="season-title">{season.title.ar}</h2><p>{current.title.ar} · الأسبوع {currentWeek}</p></span>
        <div><strong>{completed.size}/8</strong><small>قضايا موثقة</small></div>
      </div>
      <GameProgress value={(completed.size / 8) * 100} tone="rare" />
      <div className="echo-network-season-grid">
        {season.activities.map((activity) => {
          const done = completed.has(activity.id);
          return (
            <article key={activity.id} data-current={activity.week === currentWeek || undefined} data-complete={done || undefined}>
              <span style={{ backgroundImage: `url(${CHARACTER_ASSETS[activity.focusCharacter]})` }} aria-hidden="true" />
              <div><small>W{activity.week} · {activity.kind}</small><strong>{activity.title.ar}</strong><p>{activity.description.ar}</p></div>
              <i>{done ? '✓' : activity.week === currentWeek ? 'LIVE' : activity.week < currentWeek ? 'ARCHIVE' : 'LOCKED'}</i>
            </article>
          );
        })}
      </div>
      <div className="echo-network-season-meta">
        <HudPanel tone="memory" eyebrow="CURRENT CASE" title={current.title.ar}>
          <p>{current.description.ar} لا تضيع القضية بعد نهاية الأسبوع؛ تنتقل إلى الأرشيف ويمكن إتقانها لاحقًا.</p>
          <div className="echo-network-actions">
            <GameButton variant="memory" onClick={onOpenCoop}>اختراق الموسم</GameButton>
            <GameButton variant="ghost" onClick={onOpenWeekly}>المهمة الأسبوعية</GameButton>
          </div>
        </HudPanel>
        <GlassPanel tone="rare" eyebrow="CHARACTER BONDS" title="رابطة الشخصيات">
          <div className="echo-network-bonds">
            {Object.entries(CHARACTER_ASSETS).map(([character, image]) => (
              <div key={character}>
                <span style={{ backgroundImage: `url(${image})` }} />
                <strong>{character.toUpperCase()}</strong>
                <small>{bondByCharacter.get(character) ?? 0} resonance</small>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>
      <p className="echo-network-ethics-note">لا سلسلة يومية قابلة للكسر، ولا مكافأة تختفي: الموسم يبقى في الأرشيف.</p>
    </section>
  );
}
