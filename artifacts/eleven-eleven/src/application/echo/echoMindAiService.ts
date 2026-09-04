import type { GameState } from '../../core/gameTypes';
import {
  MEMORY_DEFINITIONS,
} from '../../infrastructure/content/contentRegistry';
import type {
  EchoMindLocale,
} from './echoMindExperience';
import { FINAL_MANHWA_PAGE_BY_ID } from '../../content/manhwa/finalManhwa';
import {
  FINAL_MANHWA_SERVER_ECHO_KNOWLEDGE_NODE_IDS,
  RETIRED_FINAL_MANHWA_KNOWLEDGE_NODE_IDS,
} from '../../content/story/finalManhwaCanonEvents';
import {
  createStoryStateReadModel,
} from '../../domain/story/storyState';
import {
  getCurrentAuthToken,
} from '../../features/auth/authService';

export interface EchoMindHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface EchoMindKnowledgeContext {
  chapterId: string;
  personality: GameState['echo']['personality'];
  unlockedMemories: Array<{
    id: string;
    title: string;
    fragments: string[];
  }>;
  decisions: Array<{
    id: string;
    choiceId: string;
  }>;
  completedSceneIds: string[];
  solvedPuzzleIds: string[];
  beliefs: string[];
  questions: string[];
  knowledgeNodeIds: string[];
  restoredManhwaPages: Array<{
    id: string;
    title: string;
    description: string;
    transcript: string[];
  }>;
  revealedStoryBeats: Array<{
    puzzleId: string;
    echoReflection: string;
    beliefs: string[];
    questions: string[];
    knowledge: string[];
  }>;
}

export interface StreamEchoMindAiInput {
  message: string;
  locale: EchoMindLocale;
  history: EchoMindHistoryMessage[];
  context: EchoMindKnowledgeContext;
  safetyIdentifier: string;
  signal?: AbortSignal;
  onDelta: (delta: string) => void;
}

interface OpenAiStreamEvent {
  type?: string;
  delta?: string;
  error?: {
    message?: string;
  };
}

export class EchoMindAiUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EchoMindAiUnavailableError';
  }
}

function getAiEndpoint(): string {
  return import.meta.env.VITE_ECHO_AI_ENDPOINT?.trim()
    || '/api/echo/chat';
}

export function createEchoMindKnowledgeContext(
  state: GameState,
  locale: EchoMindLocale,
): EchoMindKnowledgeContext {
  const unlockedMemoryIds = new Set(state.narrative.unlockedMemoryIds);
  const unlockedFragmentIds = new Set(
    state.narrative.unlockedMemoryFragmentIds,
  );
  const authoritativeStory = createStoryStateReadModel(state.progressionState);
  const serverOwnedKnowledge = new Set<string>(
    FINAL_MANHWA_SERVER_ECHO_KNOWLEDGE_NODE_IDS,
  );
  const retiredKnowledge = new Set<string>(
    RETIRED_FINAL_MANHWA_KNOWLEDGE_NODE_IDS,
  );
  const knowledgeNodeIds = [...new Set([
    ...state.narrative.knowledgeNodeIds
      .filter((nodeId) => !serverOwnedKnowledge.has(nodeId) && !retiredKnowledge.has(nodeId))
      .slice(-30),
    ...authoritativeStory.unlockedKnowledge.echo.filter((nodeId) => !retiredKnowledge.has(nodeId)),
  ])].slice(-30);

  return {
    chapterId: state.progression.currentChapterId,
    personality: { ...state.echo.personality },
    unlockedMemories: MEMORY_DEFINITIONS
      .filter((memory) => unlockedMemoryIds.has(memory.id))
      .map((memory) => ({
        id: memory.id,
        title: locale === 'en' ? memory.title.en : memory.title.ar,
        fragments: memory.fragments
          .filter((fragment) => unlockedFragmentIds.has(fragment.id))
          .map((fragment) => (
            locale === 'en' ? fragment.text.en : fragment.text.ar
          )),
      })),
    decisions: state.narrative.decisionHistory
      .slice(-20)
      .map(({ id, choiceId }) => ({ id, choiceId })),
    completedSceneIds: state.cinematic.completedSceneIds.slice(-20),
    solvedPuzzleIds: state.progression.completedPuzzleIds.slice(-30),
    beliefs: state.narrative.beliefs.slice(-30),
    questions: state.narrative.questions.slice(-30),
    knowledgeNodeIds,
    restoredManhwaPages: state.unlockedManhwaPageIds
      .slice(-10)
      .flatMap((pageId) => {
        const page = FINAL_MANHWA_PAGE_BY_ID[pageId];
        return page ? [{
          id: page.id,
          title: locale === 'en' ? page.title.en : page.title.ar,
          description: locale === 'en'
            ? page.accessibleDescription.en
            : page.accessibleDescription.ar,
          transcript: page.transcript.map((line) => (
            locale === 'en' ? line.en : line.ar
          )),
        }] : [];
      }),
    // Story Puzzle completion is authoritative and intentionally does not
    // invent Echo dialogue. Future owner-authored dialogue can enter here via
    // Canon-safe knowledge gates rather than the retired local campaign.
    revealedStoryBeats: [],
  };
}

export function getEchoMindSafetyIdentifier(): string {
  if (typeof window === 'undefined') return 'echo-session-server';
  const storageKey = 'eleven_echo_safety_id';
  const existing = window.localStorage.getItem(storageKey);
  if (existing) return existing;

  const identifier = typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `echo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(storageKey, identifier);
  return identifier;
}

function parseEventPayload(
  payload: string,
  onDelta: (delta: string) => void,
): boolean {
  if (!payload || payload === '[DONE]') return payload === '[DONE]';

  let event: OpenAiStreamEvent;
  try {
    event = JSON.parse(payload) as OpenAiStreamEvent;
  } catch {
    return false;
  }

  if (event.type === 'response.output_text.delta' && event.delta) {
    onDelta(event.delta);
  }
  if (event.type === 'error') {
    throw new EchoMindAiUnavailableError(
      event.error?.message || 'Echo AI stream failed.',
    );
  }
  return event.type === 'response.completed';
}

export async function streamEchoMindAiResponse({
  message,
  locale,
  history,
  context,
  safetyIdentifier,
  signal,
  onDelta,
}: StreamEchoMindAiInput): Promise<string> {
  const token = await getCurrentAuthToken();
  const response = await fetch(getAiEndpoint(), {
    method: 'POST',
    headers: {
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      message,
      locale,
      // The current player message is sent separately below. Keep seven prior
      // entries so the provider never receives more than eight dialogue
      // messages in total for this temporary, non-persistent session.
      history: history.slice(-7),
      context,
      safetyIdentifier,
    }),
    signal,
  });

  if (!response.ok || !response.body) {
    throw new EchoMindAiUnavailableError(
      `Echo AI gateway returned ${response.status}.`,
    );
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('text/event-stream')) {
    throw new EchoMindAiUnavailableError(
      'Echo AI gateway did not return a stream.',
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let output = '';
  let complete = false;

  while (!complete) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split(/\r?\n\r?\n/);
    buffer = frames.pop() ?? '';

    for (const frame of frames) {
      const payloadLines = frame
        .split(/\r?\n/)
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trim());

      for (const payload of payloadLines) {
        const previousLength = output.length;
        complete = parseEventPayload(payload, (delta) => {
          output += delta;
          onDelta(delta);
        }) || complete;
        if (output.length < previousLength) {
          throw new EchoMindAiUnavailableError('Invalid stream state.');
        }
      }
    }
  }

  if (!output.trim()) {
    throw new EchoMindAiUnavailableError('Echo AI returned no text.');
  }
  return output;
}

export async function streamEchoMindFallback(
  text: string,
  onDelta: (delta: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const characters = Array.from(text);
  for (let index = 0; index < characters.length; index += 2) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
    const delta = characters.slice(index, index + 2).join('');
    onDelta(delta);
    await new Promise<void>((resolve) => {
      globalThis.setTimeout(resolve, 34);
    });
  }
  return text;
}
