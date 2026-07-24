import { useMemo, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import {
  ChoiceCard,
  GameButton,
  GameTabs,
  HudPanel,
} from '../../ui/design-system';
import { createDialogueScreenReadModel } from '../../application/ui/gameUiReadModels';
import { EchoChat } from '../../components/echo/EchoChat';
import {
  EchoPresence,
  ENVIRONMENT_PRESENTATION_ASSETS,
} from '../../ui/presentation';

type DialogueTab = 'graph' | 'echo-channel';

export default function DialogueScreen() {
  const state = useGameStore();
  const [tab, setTab] = useState<DialogueTab>('graph');
  const [previewChoice, setPreviewChoice] = useState(0);
  const model = useMemo(() => createDialogueScreenReadModel(state), [state]);

  return (
    <div className="shell-screen shell-dialogue-screen shell-dialogue-screen--decision">
      <header className="shell-screen-heading">
        <span className="shell-screen-code">05</span>
        <span>
          <small>DECISION LEDGER CONNECTED</small>
          <h1>التواصل مع Echo</h1>
        </span>
        <GameTabs
          value={tab}
          onChange={(id) => setTab(id as DialogueTab)}
          ariaLabel="نوع الحوار"
          tone="danger"
          items={[
            { id: 'graph', label: 'المشهد المتفرع' },
            { id: 'echo-channel', label: 'قناة Echo' },
          ]}
        />
      </header>

      {tab === 'echo-channel' ? (
        <HudPanel
          className="shell-dialogue-screen__legacy-channel"
          tone="memory"
          eyebrow="COMPATIBILITY CHANNEL"
          title="محادثة Echo الحرة"
        >
          <EchoChat />
        </HudPanel>
      ) : (
        <div className="core5-decision-screen">
          <div
            className="core5-decision-screen__world"
            style={{
              backgroundImage: `url("${ENVIRONMENT_PRESENTATION_ASSETS.memoryLaboratory}")`,
            }}
            aria-hidden="true"
          >
            <span className="core5-decision-screen__distortion" />
            <EchoPresence
              className="core5-decision-screen__echo"
              variant="hero"
              eager
            />
          </div>

          <section className="core5-decision-screen__prompt">
            <small>{model.definition?.id ?? 'DIALOGUE_GRAPH_SLOT_00'}</small>
            <strong>{model.node?.speakerId ?? 'Echo'}</strong>
            {model.node ? (
              <blockquote>{model.node.text.ar}</blockquote>
            ) : (
              <blockquote>
                بانتظار بيانات الحوار من الرسم البياني السردي.
              </blockquote>
            )}
            <span>DECISION LEDGER // CONNECTED</span>
          </section>

          <aside className="core5-decision-screen__impact">
            <header>
              <small>EMOTIONAL FEEDBACK</small>
              <strong>تأثير القرار</strong>
            </header>
            <div className="core5-decision-screen__impact-orbit" aria-hidden="true">
              <span /><span /><i />
            </div>
            <dl>
              <div>
                <dt>TRUST</dt>
                <dd>{state.echo.personality.trust}%</dd>
              </div>
              <div>
                <dt>FEAR</dt>
                <dd>{state.echo.personality.fear}%</dd>
              </div>
              <div>
                <dt>CORRUPTION</dt>
                <dd>{state.echo.personality.corruption}%</dd>
              </div>
            </dl>
            <p>
              {model.decisions.length > 0
                ? `${model.decisions.length} قرارات محفوظة في السجل`
                : 'السجل بانتظار أول قرار مؤلف.'}
            </p>
          </aside>

          <section className="core5-decision-screen__choices">
            {model.node ? (
              model.node.choices.map((choice, index) => (
                <ChoiceCard
                  key={choice.id}
                  index={index + 1}
                  title={choice.text.ar}
                  tone={index === 0 ? 'danger' : 'memory'}
                  consequence="سيُحفظ هذا القرار في Decision Ledger."
                  onClick={() => state.actions.chooseDialogueOption(choice.id)}
                />
              ))
            ) : (
              Array.from({ length: 3 }, (_, index) => (
                <button
                  key={index}
                  type="button"
                  data-active={previewChoice === index}
                  data-tone={index === 0 ? 'danger' : index === 1 ? 'memory' : 'neutral'}
                  onClick={() => setPreviewChoice(index)}
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <i>{index === 0 ? '◇' : index === 1 ? '◉' : '⬡'}</i>
                  <strong>CHOICE_SLOT_{String(index + 1).padStart(2, '0')}</strong>
                  <small>بانتظار نص الخيار</small>
                </button>
              ))
            )}
          </section>

          <footer className="core5-decision-screen__feedback">
            <span>
              <i />
              EMOTION CHANNEL {String(previewChoice + 1).padStart(2, '0')}
            </span>
            <p>المعاينة البصرية لا تسجل قرارًا دون محتوى حواري مؤلف.</p>
            <code>data/dialogues/index.json</code>
          </footer>

          {model.availableDefinitions.length > 0 && !model.node && (
            <div className="core5-decision-screen__available">
              {model.availableDefinitions.map((dialogue) => (
                <GameButton
                  key={dialogue.id}
                  variant="secondary"
                  onClick={() => state.actions.startDialogueGraph(dialogue.id)}
                >
                  {dialogue.id}
                </GameButton>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
