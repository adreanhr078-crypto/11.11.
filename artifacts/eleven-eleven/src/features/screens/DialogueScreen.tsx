import { useMemo, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import {
  ChoiceCard,
  GameButton,
  GameTabs,
  GlassPanel,
  HudPanel,
} from '../../ui/design-system';
import { createDialogueScreenReadModel } from '../../application/ui/gameUiReadModels';
import { EchoChat } from '../../components/echo/EchoChat';
import { EchoPresence } from '../../ui/presentation';

type DialogueTab = 'graph' | 'echo-channel';

export default function DialogueScreen() {
  const state = useGameStore();
  const [tab, setTab] = useState<DialogueTab>('graph');
  const model = useMemo(() => createDialogueScreenReadModel(state), [state]);

  return (
    <div className="shell-screen shell-dialogue-screen">
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
        <div className="shell-dialogue-screen__layout">
          <section className="shell-dialogue-screen__portrait">
            <EchoPresence
              className="shell-dialogue-screen__echo-presence"
              variant="dialogue"
              eager
            />
            <strong>Echo</strong>
            <small>
              TRUST {state.echo.personality.trust}% · FEAR{' '}
              {state.echo.personality.fear}%
            </small>
          </section>

          <HudPanel
            className="shell-dialogue-screen__graph"
            tone="danger"
            eyebrow={model.definition?.id ?? 'DIALOGUE GRAPH'}
            title={model.node?.speakerId ?? 'قناة السرد'}
          >
            {model.node ? (
              <>
                <blockquote>{model.node.text.ar}</blockquote>
                <div className="shell-dialogue-screen__choices">
                  {model.node.choices.map((choice, index) => (
                    <ChoiceCard
                      key={choice.id}
                      index={index + 1}
                      title={choice.text.ar}
                      tone={index === 0 ? 'danger' : 'memory'}
                      consequence="سيُحفظ هذا القرار في السجل."
                      onClick={() => (
                        state.actions.chooseDialogueOption(choice.id)
                      )}
                    />
                  ))}
                </div>
              </>
            ) : model.availableDefinitions.length > 0 ? (
              <div className="shell-dialogue-library">
                <p>اختر محادثة متاحة لبدء الرسم البياني.</p>
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
            ) : (
              <div className="shell-editor-empty shell-editor-empty--embedded">
                <span className="shell-editor-empty__glyph">⌁</span>
                <p>
                  محرك الحوار وسجل القرارات متصلان. أضف الرسوم الحوارية في
                  <code> data/dialogues/index.json </code>
                  دون تعديل TypeScript.
                </p>
                <div
                  className="shell-choice-placeholders"
                  aria-label="أماكن اختيارات الحوار المستقبلية"
                >
                  {Array.from({ length: 3 }, (_, index) => (
                    <span key={index}>
                      <i>{String(index + 1).padStart(2, '0')}</i>
                      <b />
                      <small>LOCKED</small>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </HudPanel>

          <GlassPanel
            className="shell-dialogue-screen__ledger"
            tone="neutral"
            title="القرارات المستمرة"
          >
            {model.decisions.length > 0 ? (
              <ol className="shell-ledger-list">
                {model.decisions.map((decision) => (
                  <li key={decision.id}>
                    <span>{decision.source}</span>
                    <strong>{decision.id}</strong>
                    <small>{decision.choiceId}</small>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="shell-muted-copy">السجل بانتظار أول اختيار.</p>
            )}
          </GlassPanel>
        </div>
      )}
    </div>
  );
}
