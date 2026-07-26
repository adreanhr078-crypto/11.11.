import { useMemo, useState, type CSSProperties } from 'react';
import { BrainCircuit, LockKeyhole, Sparkles } from 'lucide-react';
import { useGameStore } from '../../stores/gameStore';
import {
  GameProgress,
  GlassPanel,
  HudPanel,
} from '../../ui/design-system';
import { createMemoryScreenReadModel } from '../../application/ui/gameUiReadModels';
import { ENVIRONMENT_PRESENTATION_ASSETS } from '../../ui/presentation';

export default function MemoryScreen() {
  const state = useGameStore();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const model = useMemo(() => createMemoryScreenReadModel(state), [state]);
  const selected = model.items[selectedIndex] ?? model.items[0] ?? null;

  return (
    <div
      className="shell-screen shell-memory-screen shell-memory-screen--archive"
      dir="rtl"
    >
      <header className="shell-screen-heading memory-archive__heading">
        <span className="shell-screen-code">03</span>
        <span>
          <small>MEMORY RECOVERY</small>
          <h1>الذكريات</h1>
        </span>
        {!model.isAuthoredContentEmpty && (
          <div className="memory-archive__summary">
            <span>
              <strong>{model.unlockedCount}</strong>
              ذكريات مستعادة
            </span>
            <span>
              <strong>{model.fragmentCount}</strong>
              شظايا مكتشفة
            </span>
          </div>
        )}
      </header>

      {model.isAuthoredContentEmpty ? (
        <section className="memory-archive__empty">
          <div
            className="memory-archive__empty-world"
            style={{
              backgroundImage: `url("${ENVIRONMENT_PRESENTATION_ASSETS.memoryLaboratory}")`,
            }}
            aria-hidden="true"
          >
            <span className="memory-archive__empty-scan" />
            <BrainCircuit />
          </div>
          <GlassPanel
            className="memory-archive__empty-copy"
            tone="memory"
            eyebrow="MEMORY CORE"
          >
            <h2>الذاكرة ما زالت صامتة</h2>
            <p>
              عندما يكتشف اللاعب شظية حقيقية، ستظهر هنا داخل مسار الاستعادة
              وترتبط بالمشهد واللغز والشخصيات المعنية.
            </p>
            <small>
              لا توجد ذكريات أو شظايا مضافة إلى المحتوى حاليًا.
            </small>
          </GlassPanel>
        </section>
      ) : (
        <div className="memory-archive__workspace">
          <HudPanel
            className="memory-archive__index"
            tone="danger"
            eyebrow="RECOVERED / ENCRYPTED"
            title="مسار الذاكرة"
          >
            <div className="memory-archive__list">
              {model.items.map((item, index) => (
                <button
                  key={item.definition.id}
                  type="button"
                  data-active={selected?.definition.id === item.definition.id}
                  data-locked={!item.unlocked}
                  onClick={() => setSelectedIndex(index)}
                >
                  <span className="memory-archive__list-marker">
                    {item.unlocked ? (
                      <Sparkles aria-hidden="true" />
                    ) : (
                      <LockKeyhole aria-hidden="true" />
                    )}
                  </span>
                  <span>
                    <strong>
                      {item.unlocked ? item.definition.title.ar : 'ذكرى مشفّرة'}
                    </strong>
                    <small>
                      {item.unlocked
                        ? `${item.unlockedFragments} من ${item.fragmentTotal} شظايا`
                        : 'تحتاج إلى اكتشاف المزيد من الأدلة'}
                    </small>
                  </span>
                  <i
                    style={{
                      '--memory-progress': `${item.progress}%`,
                    } as CSSProperties}
                  />
                </button>
              ))}
            </div>
          </HudPanel>

          <section className="memory-archive__focus">
            <div
              className="memory-archive__scene"
              data-locked={!selected?.unlocked}
              style={{
                backgroundImage: `url("${ENVIRONMENT_PRESENTATION_ASSETS.memoryLaboratory}")`,
              }}
            >
              <span className="memory-archive__scene-grade" />
              <span className="memory-archive__scene-scan" />
              {selected?.unlocked ? (
                <div className="memory-archive__scene-copy">
                  <small>MEMORY RECONSTRUCTED</small>
                  <h2>{selected.definition.title.ar}</h2>
                  <p>{selected.definition.description.ar}</p>
                </div>
              ) : (
                <div className="memory-archive__locked-copy">
                  <LockKeyhole aria-hidden="true" />
                  <h2>الإشارة غير مكتملة</h2>
                  <p>حل الألغاز واكتشف الشظايا المرتبطة لاستعادة هذه الذكرى.</p>
                </div>
              )}
            </div>

            {selected && (
              <div className="memory-archive__recovery">
                <header>
                  <span>
                    <small>RECONSTRUCTION</small>
                    <strong>شظايا الذكرى</strong>
                  </span>
                  <span>
                    {selected.unlockedFragments}/{selected.fragmentTotal}
                  </span>
                </header>
                <GameProgress
                  value={selected.progress}
                  tone="memory"
                  showValue={false}
                />
                <div className="memory-archive__fragments">
                  {selected.fragments.map((fragment) => (
                    <article
                      key={fragment.id}
                      data-unlocked={fragment.unlocked}
                    >
                      <span>
                        {fragment.unlocked ? (
                          <Sparkles aria-hidden="true" />
                        ) : (
                          <LockKeyhole aria-hidden="true" />
                        )}
                      </span>
                      <div>
                        <strong>
                          {fragment.unlocked ? fragment.title : 'شظية مفقودة'}
                        </strong>
                        <p>
                          {fragment.unlocked
                            ? fragment.text
                            : 'لم تُكتشف هذه القطعة بعد.'}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>

          <HudPanel
            className="memory-archive__timeline"
            tone="memory"
            eyebrow="DISCOVERY HISTORY"
            title="آخر الاكتشافات"
          >
            {model.timeline.length > 0 ? (
              <div>
                {model.timeline.slice(0, 6).map((event) => (
                  <article key={event.id}>
                    <i />
                    <span>
                      <strong>{event.description}</strong>
                      <small>{event.time}</small>
                    </span>
                  </article>
                ))}
              </div>
            ) : (
              <p className="memory-archive__timeline-empty">
                سيظهر تاريخ استعادة الذكريات هنا بعد أول اكتشاف.
              </p>
            )}
          </HudPanel>
        </div>
      )}
    </div>
  );
}
