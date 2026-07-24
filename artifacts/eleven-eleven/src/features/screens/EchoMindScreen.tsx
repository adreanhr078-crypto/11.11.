import { useMemo, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import {
  GameButton,
  GameProgress,
  GlassPanel,
  HudPanel,
  StatMeter,
} from '../../ui/design-system';
import { GameIconLabel } from '../../ui/icons';
import {
  createEchoMindScreenReadModel,
} from '../../application/ui/gameUiReadModels';
import { useShellStore } from '../../app/shell/shellStore';
import { EchoPresence } from '../../ui/presentation';

interface ChatMessage {
  id: string;
  speaker: 'player' | 'echo';
  text: string;
}

export default function EchoMindScreen() {
  const state = useGameStore();
  const navigate = useShellStore((shell) => shell.navigate);
  const model = useMemo(() => createEchoMindScreenReadModel(state), [state]);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => (
    model.latestEchoLine
      ? [{ id: 'boot', speaker: 'echo', text: model.latestEchoLine }]
      : [{
        id: 'boot',
        speaker: 'echo',
        text: 'أنا هنا. أراقب حالتك وأحاول أن أتذكر.',
      }]
  ));

  const sendMessage = () => {
    const text = draft.trim();
    if (!text) return;

    setMessages((current) => [
      ...current,
      { id: `player-${current.length}`, speaker: 'player', text },
    ]);
    setDraft('');

    const result = state.actions.chat();
    setMessages((current) => [
      ...current,
      {
        id: `echo-${current.length}`,
        speaker: 'echo',
        text: result.dialogue,
      },
    ]);
  };

  return (
    <div className="shell-screen shell-echo-mind-screen">
      <header className="shell-screen-heading">
        <span className="shell-screen-code">05</span>
        <span>
          <small>AI CONVERSATION CHANNEL</small>
          <h1>Echo Mind</h1>
        </span>
        <div className="shell-screen-heading__metrics">
          <span>{model.interactions} تفاعل</span>
          <span>{model.conversationCount} ردود محفوظة</span>
        </div>
      </header>

      <div className="shell-echo-mind-grid">
        <HudPanel
          className="shell-echo-mind-screen__status"
          tone="danger"
          eyebrow="Echo Presence"
          title="الحالة المباشرة"
        >
          <EchoPresence variant="mini" eager />
          <div className="shell-echo-mind-screen__meters">
            <StatMeter compact label="الثقة" value={model.trust} tone="memory" />
            <StatMeter compact label="الخوف" value={model.fear} tone="danger" />
            <StatMeter
              compact
              label="الإنسانية"
              value={model.personality.humanity}
              tone="progression"
            />
            <StatMeter
              compact
              label="الفساد"
              value={model.personality.corruption}
              tone="rare"
            />
          </div>
        </HudPanel>

        <HudPanel
          className="shell-echo-mind-screen__chat"
          tone="memory"
          eyebrow="Text Channel"
          title="قناة الحوار"
        >
          <div className="shell-echo-mind-screen__messages">
            {messages.map((message) => (
              <article
                key={message.id}
                data-speaker={message.speaker}
              >
                <strong>{message.speaker === 'echo' ? 'Echo' : 'أنت'}</strong>
                <p>{message.text}</p>
              </article>
            ))}
          </div>
          <label className="shell-game-input">
            <span>اكتب رسالتك إلى Echo</span>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') sendMessage();
              }}
              autoComplete="off"
            />
          </label>
          <div className="shell-echo-mind-screen__actions">
            <GameButton size="lg" onClick={sendMessage} disabled={!draft.trim()}>
              إرسال
            </GameButton>
            <GameButton variant="ghost" onClick={() => navigate('dialogue')}>
              افتح شاشة القرار
            </GameButton>
          </div>
        </HudPanel>

        <GlassPanel
          className="shell-echo-mind-screen__references"
          tone="progression"
          eyebrow="Context Hooks"
          title="مرجعيات Echo"
        >
          <div className="shell-echo-mind-screen__reference-list">
            {model.memoryReferences.length > 0 ? (
              model.memoryReferences.map((reference) => (
                <article key={reference.id}>
                  <strong>{reference.label}</strong>
                  <small>{reference.kind}</small>
                </article>
              ))
            ) : (
              <p className="shell-inline-empty">
                لا توجد مرجعيات مفتوحة بعد.
              </p>
            )}
          </div>
          <div className="shell-echo-mind-screen__jump-links">
            <GameButton variant="secondary" onClick={() => navigate('memories')}>
              <GameIconLabel
                iconId="screen-memory"
                label="الذكريات"
                description="عرض الذكريات المرتبطة بالحوار"
                compact
              />
            </GameButton>
            <GameButton variant="ghost" onClick={() => navigate('puzzles')}>
              <GameIconLabel
                iconId="screen-puzzles"
                label="الألغاز"
                description="الانتقال إلى مساحة إعادة البناء"
                compact
              />
            </GameButton>
          </div>
        </GlassPanel>
      </div>

      <section className="shell-echo-mind-screen__capabilities">
        {model.capabilities.map((capability) => (
          <GlassPanel
            key={capability.id}
            tone={capability.status === 'ready' ? 'memory' : 'neutral'}
            title={capability.label}
          >
            <p>{capability.description}</p>
            <GameProgress
              value={capability.status === 'ready' ? 100 : 35}
              label={capability.status === 'ready' ? 'مفعّل' : 'مخطط له'}
              tone={capability.status === 'ready' ? 'memory' : 'neutral'}
            />
          </GlassPanel>
        ))}
      </section>
    </div>
  );
}

