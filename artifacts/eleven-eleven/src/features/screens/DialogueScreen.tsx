import { useMemo } from 'react';
import { MessageCircleMore, Sparkles } from 'lucide-react';
import { useGameStore } from '../../stores/gameStore';
import {
  ChoiceCard,
  GameButton,
  GlassPanel,
} from '../../ui/design-system';
import { createDialogueScreenReadModel } from '../../application/ui/gameUiReadModels';
import {
  EchoPresence,
  ENVIRONMENT_PRESENTATION_ASSETS,
} from '../../ui/presentation';

export default function DialogueScreen() {
  const state = useGameStore();
  const model = useMemo(() => createDialogueScreenReadModel(state), [state]);

  return (
    <div
      className="shell-screen shell-dialogue-screen shell-dialogue-screen--story"
      dir="rtl"
    >
      <div
        className="story-dialogue__world"
        style={{
          backgroundImage: `url("${ENVIRONMENT_PRESENTATION_ASSETS.memoryLaboratory}")`,
        }}
        aria-hidden="true"
      >
        <span className="story-dialogue__world-grade" />
        <span className="story-dialogue__world-signal" />
        <EchoPresence
          className="story-dialogue__echo"
          variant="hero"
          eager
        />
      </div>

      <header className="story-dialogue__hud gds-safe-area">
        <span className="shell-screen-code">05</span>
        <span>
          <small>CONVERSATION</small>
          <strong>لحظة قرار</strong>
        </span>
        <span className="story-dialogue__ledger-state">
          <i />
          قراراتك محفوظة
        </span>
      </header>

      {model.node ? (
        <>
          <GlassPanel
            className="story-dialogue__line"
            tone="danger"
            eyebrow={model.speakerName}
          >
            <blockquote>{model.node.text.ar}</blockquote>
          </GlassPanel>

          <section
            className="story-dialogue__choices gds-safe-area"
            aria-label="خيارات الحوار"
          >
            <header>
              <Sparkles aria-hidden="true" />
              <span>
                <strong>اختر ردك</strong>
                <small>قد يتذكر Echo هذا القرار لاحقًا</small>
              </span>
            </header>
            <div>
              {model.node.choices.map((choice, index) => (
                <ChoiceCard
                  key={choice.id}
                  index={index + 1}
                  title={choice.text.ar}
                  tone={index === 0 ? 'danger' : 'memory'}
                  consequence="سيُسجل هذا الاختيار في مسار القصة"
                  onClick={() => state.actions.chooseDialogueOption(choice.id)}
                />
              ))}
            </div>
          </section>
        </>
      ) : (
        <GlassPanel
          className="story-dialogue__empty"
          tone="memory"
          eyebrow="ECHO CHANNEL"
        >
          <MessageCircleMore aria-hidden="true" />
          <h1>لا توجد محادثة نشطة</h1>
          <p>
            ستبدأ المحادثات والخيارات تلقائيًا عندما تصل إلى لحظة قصصية
            مرتبطة بها.
          </p>

          {model.availableDefinitions.length > 0 ? (
            <div className="story-dialogue__available">
              {model.availableDefinitions.map((dialogue, index) => (
                <GameButton
                  key={dialogue.id}
                  variant={index === 0 ? 'primary' : 'secondary'}
                  onClick={() => state.actions.startDialogueGraph(dialogue.id)}
                >
                  بدء المحادثة {index + 1}
                </GameButton>
              ))}
            </div>
          ) : (
            <small>
              لا يوجد محتوى حواري متاح في هذا الإصدار بعد.
            </small>
          )}
        </GlassPanel>
      )}

      <footer className="story-dialogue__hint gds-safe-area">
        <span aria-hidden="true">11:11</span>
        <p>
          لون المشهد واستجابة Echo يتغيران مع حالته العاطفية وقراراتك السابقة.
        </p>
      </footer>
    </div>
  );
}
