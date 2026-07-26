import { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, Send } from 'lucide-react';
import { useGameStore } from '../../stores/gameStore';
import {
  GameButton,
  GlassPanel,
} from '../../ui/design-system';
import {
  createEchoMindTurnEnvelope,
  detectEchoMindLocale,
  type EchoMindLocale,
  type EchoMindTurnEnvelope,
} from '../../application/echo/echoMindExperience';
import {
  createEchoMindKnowledgeContext,
  getEchoMindSafetyIdentifier,
  streamEchoMindAiResponse,
  streamEchoMindFallback,
  type EchoMindHistoryMessage,
} from '../../application/echo/echoMindAiService';
import {
  createEchoMindScreenReadModel,
} from '../../application/ui/gameUiReadModels';
import {
  createBrowserEchoMindVoice,
} from '../../infrastructure/voice/browserEchoMindVoice';
import { EchoPresence } from '../../ui/presentation';

interface ChatMessage {
  id: string;
  speaker: 'player' | 'echo';
  text: string;
  locale: EchoMindLocale;
  isTyping?: boolean;
}

function createInitialMessage(openingLine: string): ChatMessage {
  return {
    id: 'boot-echo',
    speaker: 'echo',
    text: openingLine,
    locale: detectEchoMindLocale(openingLine, 'ar'),
  };
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
  const [isResponding, setIsResponding] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const voiceRef = useRef(createBrowserEchoMindVoice());

  const activeLocale = latestEnvelope?.locale
    ?? detectEchoMindLocale(model.openingLine, 'ar');
  const presenceLine = latestEnvelope
    ? expressionLine(latestEnvelope)
    : activeLocale === 'en'
      ? 'Echo is listening.'
      : 'Echo يصغي إليك.';

  useEffect(() => {
    const messagesElement = messagesRef.current;
    if (!messagesElement) return;
    messagesElement.scrollTo({
      top: messagesElement.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  useEffect(() => () => {
    abortRef.current?.abort();
    voiceRef.current.stop();
  }, []);

  const sendMessage = async (
    inputOverride?: string,
    respondWithVoice = false,
  ) => {
    const text = (inputOverride ?? draft).trim();
    if (!text || isResponding) return;

    const locale = detectEchoMindLocale(
      text,
      typeof document !== 'undefined' ? document.documentElement.lang : 'ar',
    );
    const history: EchoMindHistoryMessage[] = messages.map((message) => ({
      role: message.speaker === 'echo' ? 'assistant' : 'user',
      content: message.text,
    }));
    const playerMessageId = `player-${Date.now()}`;
    const echoMessageId = `echo-${Date.now() + 1}`;

    setMessages((current) => [
      ...current,
      {
        id: playerMessageId,
        speaker: 'player',
        text,
        locale,
      },
      {
        id: echoMessageId,
        speaker: 'echo',
        text: '',
        locale,
        isTyping: true,
      },
    ]);
    setDraft('');
    setVoiceHint(null);
    setIsResponding(true);

    state.actions.chat();
    const freshState = useGameStore.getState();
    const localEnvelope = createEchoMindTurnEnvelope(
      text,
      freshState,
      typeof document !== 'undefined' ? document.documentElement.lang : locale,
    );
    setLatestEnvelope(localEnvelope);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    let output = '';

    const appendDelta = (delta: string) => {
      output += delta;
      setMessages((current) => current.map((message) => (
        message.id === echoMessageId
          ? { ...message, text: output, isTyping: true }
          : message
      )));
    };

    try {
      output = await streamEchoMindAiResponse({
        message: text,
        locale,
        history,
        context: createEchoMindKnowledgeContext(freshState, locale),
        safetyIdentifier: getEchoMindSafetyIdentifier(),
        signal: controller.signal,
        onDelta: appendDelta,
      });
    } catch (error) {
      if (
        error instanceof DOMException
        && error.name === 'AbortError'
      ) {
        return;
      }
      output = '';
      setMessages((current) => current.map((message) => (
        message.id === echoMessageId
          ? { ...message, text: '', isTyping: true }
          : message
      )));
      output = await streamEchoMindFallback(
        localEnvelope.response,
        appendDelta,
        controller.signal,
      );
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }

    const completedEnvelope = {
      ...localEnvelope,
      response: output,
      voice: {
        ...localEnvelope.voice,
        enabled: voiceRef.current.canSpeak,
        mode: voiceRef.current.canSpeak
          ? 'voice-ready' as const
          : 'text-only' as const,
      },
    };
    setLatestEnvelope(completedEnvelope);
    setMessages((current) => current.map((message) => (
      message.id === echoMessageId
        ? { ...message, text: output, isTyping: false }
        : message
    )));
    setIsResponding(false);

    if (respondWithVoice && voiceRef.current.canSpeak) {
      await voiceRef.current.speak(output, completedEnvelope.voice);
    }
  };

  const startVoiceConversation = async () => {
    if (isListening) {
      voiceRef.current.stop();
      setIsListening(false);
      return;
    }
    if (!voiceRef.current.canListen) {
      setVoiceHint(activeLocale === 'en'
        ? 'Voice input is not supported on this device.'
        : 'الإدخال الصوتي غير مدعوم على هذا الجهاز.');
      return;
    }

    setVoiceHint(null);
    setIsListening(true);
    try {
      const transcript = await voiceRef.current.listen(
        activeLocale,
        (interimText) => setDraft(interimText),
      );
      setDraft('');
      await sendMessage(transcript, true);
    } catch {
      setVoiceHint(activeLocale === 'en'
        ? 'I could not hear you clearly. Try again.'
        : 'لم أستطع سماعك بوضوح. حاول مرة أخرى.');
    } finally {
      setIsListening(false);
    }
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
        <aside
          className="shell-echo-mind-screen__hero"
          aria-label={activeLocale === 'en'
            ? 'Echo live presence'
            : 'حضور Echo المباشر'}
        >
          <div className="shell-echo-mind-screen__presence">
            <div className="shell-echo-mind-screen__presence-frame">
              <EchoPresence
                className="shell-echo-mind-screen__presence-echo"
                variant="dialogue"
                eager
              />
            </div>
            <div className="shell-echo-mind-screen__presence-caption">
              <span className="shell-echo-mind-screen__hero-chip">
                <i />
                {activeLocale === 'en' ? 'Live connection' : 'اتصال مباشر'}
              </span>
              <h2>Echo</h2>
              <p>{presenceLine}</p>
            </div>
          </div>
        </aside>

        <GlassPanel
          className="shell-echo-mind-screen__conversation"
          tone="memory"
          eyebrow="Conversation Log"
          title={activeLocale === 'en' ? 'Stay with Echo' : 'ابقَ مع Echo'}
        >
          <div className="shell-echo-mind-screen__chat-shell">
            <div
              ref={messagesRef}
              className="shell-echo-mind-screen__messages"
              aria-live="polite"
            >
              {messages.map((message) => (
                <article
                  key={message.id}
                  className="shell-echo-mind-screen__message"
                  data-speaker={message.speaker}
                  data-typing={message.isTyping ? 'true' : 'false'}
                >
                  <strong>
                    {message.speaker === 'echo'
                      ? 'Echo'
                      : message.locale === 'en'
                        ? 'You'
                        : 'أنت'}
                  </strong>
                  <p>
                    {message.text}
                    {message.isTyping && (
                      <span
                        className="shell-echo-mind-screen__typing-cursor"
                        aria-label={message.locale === 'en'
                          ? 'Echo is typing'
                          : 'Echo يكتب'}
                      />
                    )}
                  </p>
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
                    if (event.key === 'Enter') void sendMessage();
                  }}
                  placeholder={model.conversationPlaceholder}
                  autoComplete="off"
                  enterKeyHint="send"
                />
              </label>

              <div className="shell-echo-mind-screen__composer-actions">
                <GameButton
                  className="shell-echo-mind-screen__voice"
                  variant="ghost"
                  leadingIcon={<Mic size={16} />}
                  onClick={() => void startVoiceConversation()}
                  disabled={isResponding}
                >
                  {isListening
                    ? activeLocale === 'en' ? 'Listening…' : 'أستمع إليك…'
                    : activeLocale === 'en' ? 'Talk to Echo' : 'تحدث مع Echo'}
                </GameButton>

                <GameButton
                  className="shell-echo-mind-screen__send"
                  size="lg"
                  leadingIcon={<Send size={18} />}
                  onClick={() => void sendMessage()}
                  disabled={!draft.trim() || isResponding || isListening}
                >
                  {isResponding
                    ? activeLocale === 'en' ? 'Echo is typing' : 'Echo يكتب'
                    : activeLocale === 'en' ? 'Send' : 'إرسال'}
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
