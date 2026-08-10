import { useEffect, useMemo, useState } from 'react';
import { Clapperboard, FileText, Lock, Sparkles } from 'lucide-react';
import { useGameStore } from '../../stores/gameStore';
import {
  GameButton,
  GlassPanel,
  HudPanel,
} from '../../ui/design-system';
import { createCharactersScreenReadModel } from '../../application/ui/gameUiReadModels';
import { EchoPresence } from '../../ui/presentation';

function CharacterPortrait({
  unlocked,
  displayName,
  codename,
  echo,
}: {
  unlocked: boolean;
  displayName: string;
  codename: string;
  echo: boolean;
}) {
  if (!unlocked) {
    return (
      <div className="shell-character-archive__locked-portrait" aria-hidden="true">
        <Lock size={22} />
        <span>UNKNOWN</span>
      </div>
    );
  }

  if (echo) {
    return (
      <div className="shell-character-archive__echo-portrait">
        <EchoPresence variant="profile" eager />
      </div>
    );
  }

  return (
    <div className="shell-character-archive__reconstructed-portrait" aria-hidden="true">
      <span>{displayName.slice(0, 1).toUpperCase()}</span>
      <small>{codename}</small>
    </div>
  );
}

export default function CharactersScreen() {
  const state = useGameStore();
  const model = useMemo(() => createCharactersScreenReadModel(state), [state]);
  const [selectedId, setSelectedId] = useState(model.entries[0]?.id ?? 'character_echo');

  useEffect(() => {
    if (!model.entries.some((entry) => entry.id === selectedId)) {
      setSelectedId(model.entries[0]?.id ?? 'character_echo');
    }
  }, [model.entries, selectedId]);

  const selected = model.entries.find((entry) => entry.id === selectedId) ?? model.entries[0];

  if (!selected) return null;

  return (
    <div className="shell-screen shell-characters-screen shell-characters-screen--archive">
      <header className="shell-screen-heading">
        <span className="shell-screen-code">07</span>
        <span>
          <small>CHARACTER ARCHIVE</small>
          <h1>أرشيف الشخصيات</h1>
        </span>
      </header>

      <section className="shell-character-archive">
        <HudPanel
          className="shell-character-archive__list-panel"
          tone="rare"
          eyebrow="Character Files"
          title="CHARACTERS"
        >
          <div className="shell-character-archive__list">
            {model.entries.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className="shell-character-archive__card"
                data-active={entry.id === selected.id}
                data-unlocked={entry.unlocked}
                onClick={() => setSelectedId(entry.id)}
              >
                <span className="shell-character-archive__card-portrait" aria-hidden="true">
                  {entry.unlocked ? entry.displayName.slice(0, 1).toUpperCase() : <Lock size={14} />}
                </span>
                <span className="shell-character-archive__card-copy">
                  <strong>{entry.displayName}</strong>
                  <small>{entry.unlocked ? 'Available' : 'Locked'}</small>
                </span>
              </button>
            ))}
          </div>
        </HudPanel>

        <GlassPanel
          className="shell-character-archive__detail"
          tone={selected.unlocked ? 'danger' : 'neutral'}
          eyebrow="Archive View"
          title={selected.unlocked ? selected.name : 'Unknown File'}
        >
          <div className="shell-character-archive__detail-layout">
            <CharacterPortrait
              unlocked={selected.unlocked}
              displayName={selected.displayName}
              codename={selected.codename}
              echo={selected.id === 'character_echo'}
            />

            <div className="shell-character-archive__identity">
              <span className="shell-character-archive__status">
                {selected.accessLevel === 'partial'
                  ? 'Partial file'
                  : selected.unlocked
                    ? 'Discovered'
                    : 'Locked'}
              </span>
              <h2>{selected.displayName}</h2>
              <strong>{selected.role}</strong>
              <p>{selected.summary}</p>
              <small>{selected.relationship}</small>
            </div>
          </div>

          <div className="shell-character-archive__discoveries">
            <article>
              <header>
                <Sparkles size={16} />
                <span>الذكريات المرتبطة</span>
              </header>
              {selected.relatedMemories.length > 0 ? (
                <ul>
                  {selected.relatedMemories.map((memory) => (
                    <li key={memory}>{memory}</li>
                  ))}
                </ul>
              ) : (
                <p>
                  {selected.unlocked
                    ? 'لا توجد ذكريات مكتشفة مرتبطة بهذه الشخصية بعد.'
                    : 'سيظهر هذا القسم بعد اكتشاف الشخصية داخل القصة.'}
                </p>
              )}
            </article>

            <article>
              <header>
                <Clapperboard size={16} />
                <span>المشاهد المكتشفة</span>
              </header>
              {selected.relatedScenes.length > 0 ? (
                <ul>
                  {selected.relatedScenes.map((scene) => (
                    <li key={scene}>{scene}</li>
                  ))}
                </ul>
              ) : (
                <p>
                  {selected.unlocked
                    ? 'لم تُربط أي مشاهد مكتشفة بهذه الشخصية حتى الآن.'
                    : 'المشاهد تظل مخفية حتى ظهور الشخصية في السرد.'}
                </p>
              )}
            </article>

            <article>
              <header>
                <FileText size={16} />
                <span>الملفات المكتشفة</span>
              </header>
              {selected.discoveredFiles.length > 0 ? (
                <ul>
                  {selected.discoveredFiles.map((file) => (
                    <li key={file}>{file}</li>
                  ))}
                </ul>
              ) : (
                <p>
                  {selected.unlocked
                    ? 'لا توجد ملفات مرتبطة بهذه الشخصية بعد.'
                    : 'سيفتح هذا القسم عندما تبدأ اللعبة بكشف الأدلة المرتبطة بها.'}
                </p>
              )}
            </article>

            <article className="shell-character-archive__moments">
              <header>
                <Sparkles size={16} />
                <span>CHARACTER MOMENTS</span>
              </header>
              {selected.moments.some((moment) => moment.unlocked) ? (
                <ul>
                  {selected.moments
                    .filter((moment) => moment.unlocked)
                    .map((moment) => (
                      <li key={moment.momentId}>
                        <strong>{moment.contentType.toUpperCase()}</strong>
                        <small>{moment.seenState === 'seen' ? 'SEEN' : 'AVAILABLE'}</small>
                      </li>
                    ))}
                </ul>
              ) : (
                <p>
                  {selected.moments.length > 0
                    ? 'DATA INSUFFICIENT // STORY-GATED'
                    : 'NO APPROVED MOMENT CONTENT YET'}
                </p>
              )}
            </article>
          </div>

          <div className="shell-character-archive__actions">
            <GameButton variant="ghost" disabled={!selected.unlocked}>
              عرض الملف
            </GameButton>
            <GameButton variant="secondary" disabled={!selected.unlocked}>
              متابعة الذكريات
            </GameButton>
          </div>
        </GlassPanel>
      </section>
    </div>
  );
}
