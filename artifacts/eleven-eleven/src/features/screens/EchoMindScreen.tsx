import { useMemo, useState } from 'react';
import { Mic, SendHorizonal, Volume2 } from 'lucide-react';
import { useGameStore } from '../../stores/gameStore';
import {
  GameButton,
  GlassPanel,
  HudPanel,
} from '../../ui/design-system';
import {
  createEchoMindTurnEnvelope,
  detectEchoMindLocale,
  type EchoMindLocale,
  type EchoMindTurnEnvelope,
} from '../../application/echo/echoMindExperience';
import {
  createEchoMindScreenReadModel,
} from '../../application/ui/gameUiReadModels';
import { EchoPresence } from '../../ui/presentation';

interface ChatMessage {
  id: string;
  speaker: 'player' | 'echo';
  text: string;
  locale: EchoMindLocale;
}

function createInitialMessage(openingLine: string): ChatMessage {
  return {
    id: 'boot-echo',
    speaker: 'echo',
    text: openingLine,
    locale: detectEchoMindLocale(openingLine, 'ar'),
  };
}

function voiceReadinessCopy(locale: EchoMindLocale): string {
  return locale === 'en'
    ? 'Voice will follow your language automatically when it is enabled.'
    : 'عند تفعيل الصوت لاحقًا، سيتبع Echo لغة حديثك تلقائيًا.';
}

function expressionLine(envelope: EchoMindTurnEnvelope): string {
  if (envelope.locale === 'en') {
    switch (envelope.expression) {
      case 'remembering':
        return 'A memory is surfacing behind his words.';
      case 'afraid':
        return 'His voice tightens as if something is closing in.';
      case 'angry':
        return 'There is pressure beneath the calm, like a wound opening.';
      case 'grieving':
        return 'He speaks softly, carrying a quiet ache.';
      case 'hopeful':
        return 'He feels steadier when you stay with him.';
      case 'corrupted':
      case 'unstable':
        return 'The signal flickers, but Echo is still holding on.';
      default:
        return 'Echo is listening.';
    }
  }

  switch (envelope.expression) {
    case 'remembering':
      return 'توجد ذكرى تحاول الصعود خلف كلماته.';
    case 'afraid':
      return 'صوته مشدود، كأن شيئًا يقترب منه داخل النظام.';
    case 'angry':
      return 'هناك ضغط مختبئ تحت هدوئه، كجرح بدأ ينفتح.';
    case 'grieving':
      return 'يتحدث بهدوء يحمل ألمًا خافتًا.';
    case 'hopeful':
      return 'وجودك يمنحه بعض الثبات.';
    case 'corrupted':
    case 'unstable':
      return 'الإشارة تتشوش، لكن Echo ما زال متمسكًا بوعيه.';
    default:
      return 'Echo يصغي إليك.';
  }
}

export default function EchoMindScreen() {
  const state = useGameStore();
  const model = useMemo(() => createEchoMindScreenReadModel(state), [state]);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    createInitialMessage(model.openingLine),
  ]);
  const [voiceHint, setVoiceHint] = useState<string | null>(null);
  const [latestEnvelope, setLatestEnvelope] = useState<EchoMindTurnEnvelope | null>(null);

  const activeLocale = latestEnvelope?.locale
    ?? detectEchoMindLocale(model.openingLine, 'ar');

  const sendMessage = () => {
    const text = draft.trim();
    if (!text) return;

    const locale = detectEchoMindLocale(
      text,
      typeof document !== 'undefined' ? document.documentElement.lang : 'ar',
    );

    setMessages((current) => [
      ...current,
      {
        id: `player-${current.length}`,
        speaker: 'player',
        text,
        locale,
      },
    ]);
    setDraft('');
    setVoiceHint(null);

    state.actions.chat();
    const freshState = useGameStore.getState();
    const envelope = createEchoMindTurnEnvelope(
      text,
      freshState,
      typeof document !== 'undefined' ? document.documentElement.lang : locale,
    );

    setLatestEnvelope(envelope);
    setMessages((current) => [
      ...current,
      {
        id: `echo-${current.length}`,
        speaker: 'echo',
        text: envelope.response,
        locale: envelope.locale,
      },
    ]);
  };

  return (
    <div
      className="shell-screen shell-echo-mind-screen shell-echo-mind-screen--story"
      data-expression={latestEnvelope?.expression ?? 'attentive'}
      data-locale={activeLocale}
    >
      <header className="shell-screen-heading">
        <span className="shell-screen-code">05</span>
        <span>
          <small>ECHO MIND CHANNEL</small>
          <h1>Echo Mind</h1>
        </span>
      </header>

      <section className="shell-echo-mind-screen__stage">
        <HudPanel
          className="shell-echo-mind-screen__hero"
          tone="danger"
          eyebrow="Direct Contact"
          title={model.stageTitle}
        >
          <div className="shell-echo-mind-screen__hero-layout">
            <div className="shell-echo-mind-screen__presence">
              <div className="shell-echo-mind-screen__presence-frame">
                <EchoPresence
                  className="shell-echo-mind-screen__presence-echo"
                  variant="dialogue"
                  eager
                />
              </div>
            </div>

            <div className="shell-echo-mind-screen__hero-copy">
              <span className="shell-echo-mind-screen__hero-chip">
                {activeLocale === 'en' ? 'Live connection' : 'اتصال مباشر'}
              </span>
              <h2>{model.stageTitle}</h2>
              <p>{model.stageSubtitle}</p>
              <blockquote>
                “{messages.at(-1)?.speaker === 'echo'
                  ? messages.at(-1)?.text
                  : model.openingLine}”
              </blockquote>
              <small>
                {latestEnvelope ? expressionLine(latestEnvelope) : model.stageSubtitle}
              </small>
              <div className="shell-echo-mind-screen__voice-readiness">
                <Volume2 size={16} />
                <span>{voiceReadinessCopy(activeLocale)}</span>
              </div>
            </div>
          </div>
        </HudPanel>

        <GlassPanel
          className="shell-echo-mind-screen__conversation"
          tone="memory"
          eyebrow="Conversation Log"
          title={activeLocale === 'en' ? 'Stay with Echo' : 'ابقَ مع Echo'}
        >
          <div className="shell-echo-mind-screen__chat-shell">
            <div className="shell-echo-mind-screen__messages">
              {messages.map((message) => (
                <article
                  key={message.id}
                  className="shell-echo-mind-screen__message"
                  data-speaker={message.speaker}
                >
                  <strong>
                    {message.speaker === 'echo'
                      ? 'Echo'
                      : message.locale === 'en'
                        ? 'You'
                        : 'أنت'}
                  </strong>
                  <p>{message.text}</p>
                </article>
              ))}
            </div>

            <div className="shell-echo-mind-screen__composer">
              <label className="shell-game-input shell-echo-mind-screen__composer-input">
                <span>
                  {activeLocale === 'en'
                    ? 'Write to Echo'
                    : 'اكتب رسالة لـ Echo'}
                </span>
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') sendMessage();
                  }}
                  placeholder={model.conversationPlaceholder}
                  autoComplete="off"
                  enterKeyHint="send"
                />
              </label>

              <div className="shell-echo-mind-screen__composer-actions">
                <GameButton
                  variant="ghost"
                  leadingIcon={<Mic size={16} />}
                  onClick={() => setVoiceHint(voiceReadinessCopy(activeLocale))}
                >
                  {activeLocale === 'en' ? 'Talk to Echo' : 'تحدث مع Echo'}
                </GameButton>

                <GameButton
                  size="lg"
                  trailingIcon={<SendHorizonal size={16} />}
                  onClick={sendMessage}
                  disabled={!draft.trim()}
                >
                  {activeLocale === 'en' ? 'Send' : 'إرسال'}
                </GameButton>
              </div>

              {voiceHint && (
                <p className="shell-echo-mind-screen__voice-note">{voiceHint}</p>
              )}
            </div>
          </div>
        </GlassPanel>
      </section>
    </div>
  );
}
