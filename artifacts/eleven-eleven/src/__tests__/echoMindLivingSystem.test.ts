import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { after, afterEach, describe, it } from 'node:test';
import type {
  EchoMindRelationship,
} from '../application/echo/echoMindLivingStore';

const echoMindTestStorageEntries = new Map<string, string>();
const originalWindowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');
const originalLocalStorageDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  'localStorage',
);
const echoMindTestStorage: Storage = {
  get length() {
    return echoMindTestStorageEntries.size;
  },
  clear() {
    echoMindTestStorageEntries.clear();
  },
  getItem(key: string) {
    return echoMindTestStorageEntries.get(key) ?? null;
  },
  key(index: number) {
    return [...echoMindTestStorageEntries.keys()][index] ?? null;
  },
  removeItem(key: string) {
    echoMindTestStorageEntries.delete(key);
  },
  setItem(key: string, value: string) {
    echoMindTestStorageEntries.set(key, value);
  },
};

// Zustand reads storage while the module is initialized. Install a disposable
// browser-like store first so the stateful privacy tests exercise persistence
// without emitting Node-only "storage unavailable" noise.
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: echoMindTestStorage,
});
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: { localStorage: echoMindTestStorage },
});
echoMindTestStorage.setItem(
  'eleven_echo_mind_living_v1',
  JSON.stringify({ state: { playerName: 'Legacy private profile' } }),
);

const {
  ECHO_MIND_LIVING_STORAGE_KEY,
  LEGACY_ECHO_MIND_LIVING_STORAGE_KEYS,
  createEchoMindIntrusion,
  deriveEchoMindRelationship,
  extractEchoMindPlayerMemories,
  partializeEchoMindLivingState,
  useEchoMindLivingStore,
} = await import('../application/echo/echoMindLivingStore');

const legacyPayloadWasRemovedAtBoot = LEGACY_ECHO_MIND_LIVING_STORAGE_KEYS.every(
  (key) => echoMindTestStorage.getItem(key) === null,
);

const BASE_RELATIONSHIP: EchoMindRelationship = {
  bond: 24,
  openness: 18,
  tension: 12,
  conversations: 0,
  voiceConversations: 0,
  lastInteractionAt: null,
};

afterEach(() => {
  useEchoMindLivingStore.getState().clearPersonalMemory();
  echoMindTestStorage.clear();
});

after(() => {
  if (originalWindowDescriptor) {
    Object.defineProperty(globalThis, 'window', originalWindowDescriptor);
  } else {
    delete (globalThis as { window?: unknown }).window;
  }
  if (originalLocalStorageDescriptor) {
    Object.defineProperty(globalThis, 'localStorage', originalLocalStorageDescriptor);
  } else {
    delete (globalThis as { localStorage?: unknown }).localStorage;
  }
});

describe('living Echo Mind relationship', () => {
  it('extracts only explicit personal memories from player dialogue', () => {
    const timestamp = 100;
    const name = extractEchoMindPlayerMemories('أنا اسمي أحمد', timestamp);
    const feeling = extractEchoMindPlayerMemories('أنا حزين اليوم', timestamp);
    const ordinaryQuestion = extractEchoMindPlayerMemories(
      'ماذا يوجد خلف الباب؟',
      timestamp,
    );

    assert.equal(name[0]?.kind, 'name');
    assert.equal(name[0]?.text, 'أحمد');
    assert.equal(feeling[0]?.kind, 'feeling');
    assert.deepEqual(ordinaryQuestion, []);
  });

  it('derives relationship tone locally without allowing model writes', () => {
    const supportive = deriveEchoMindRelationship(
      BASE_RELATIONSHIP,
      'أنا معك ولن أتركك',
      true,
      200,
    );
    const hostile = deriveEchoMindRelationship(
      BASE_RELATIONSHIP,
      'أنت كذاب، اسكت',
      false,
      200,
    );

    assert.ok(supportive.bond > BASE_RELATIONSHIP.bond);
    assert.ok(supportive.tension < BASE_RELATIONSHIP.tension);
    assert.equal(supportive.voiceConversations, 1);
    assert.ok(hostile.bond < BASE_RELATIONSHIP.bond);
    assert.ok(hostile.tension > BASE_RELATIONSHIP.tension);
  });

  it('never interrupts the player merely because a conversation counter was reached', () => {
    const second = { ...BASE_RELATIONSHIP, conversations: 2 };
    const third = { ...BASE_RELATIONSHIP, conversations: 3 };

    assert.equal(createEchoMindIntrusion(second, 'أحمد', 1_000), null);
    assert.equal(createEchoMindIntrusion(third, 'أحمد', 1_000), null);
  });

  it('keeps at most four temporary turns and persists only accessibility preferences', () => {
    const store = useEchoMindLivingStore.getState();
    for (let index = 0; index < 5; index += 1) {
      store.recordTurn({
        userText: `My name is PrivateEcho and this is private turn ${index}.`,
        echoText: `Private companion reply ${index}.`,
        locale: 'en',
        usedVoice: false,
        timestamp: 1_000 + index,
      });
    }
    store.addTheory('Private theory that must not leave this session.', 2_000);

    const session = useEchoMindLivingStore.getState();
    assert.equal(session.turns.length, 4);
    assert.deepEqual(
      session.turns.map((turn) => turn.createdAt),
      [1_001, 1_002, 1_003, 1_004],
    );
    assert.equal(session.playerName, 'PrivateEcho');
    assert.ok(session.memories.length > 0);
    assert.equal(session.theories.length, 1);

    const persisted = partializeEchoMindLivingState(session);
    assert.deepEqual(Object.keys(persisted), ['preferences']);
    const serialized = JSON.stringify(persisted);
    assert.equal(serialized.includes('PrivateEcho'), false);
    assert.equal(serialized.includes('Private companion'), false);
    assert.equal(serialized.includes('Private theory'), false);
    assert.match(ECHO_MIND_LIVING_STORAGE_KEY, /_v3$/);
    assert.equal(legacyPayloadWasRemovedAtBoot, true);
  });

  it('clears temporary dialogue and all derived personal state back to a new-session baseline', () => {
    const store = useEchoMindLivingStore.getState();
    store.recordTurn({
      userText: 'My name is PrivateEcho.',
      echoText: 'I hear you.',
      locale: 'en',
      usedVoice: true,
      timestamp: 3_000,
    });
    store.addTheory('Private theory.', 3_001);

    store.clearPersonalMemory();
    const cleared = useEchoMindLivingStore.getState();
    assert.equal(cleared.playerName, null);
    assert.deepEqual(cleared.memories, []);
    assert.deepEqual(cleared.theories, []);
    assert.deepEqual(cleared.turns, []);
    assert.deepEqual(cleared.intrusions, []);
    assert.deepEqual(cleared.relationship, BASE_RELATIONSHIP);
  });

  it('keeps Echo Mind focused on a bounded, player-invoked conversation', () => {
    const screen = readFileSync(
      new URL('../features/screens/EchoMindScreen.tsx', import.meta.url),
      'utf8',
    );
    const shell = readFileSync(
      new URL('../app/shell/ApplicationShell.tsx', import.meta.url),
      'utf8',
    );
    const voice = readFileSync(
      new URL('../infrastructure/voice/browserEchoMindVoice.ts', import.meta.url),
      'utf8',
    );
    const transcribeEndpoint = readFileSync(
      new URL('../../functions/api/echo/transcribe.ts', import.meta.url),
      'utf8',
    );

    assert.doesNotMatch(screen, /PLAYER THEORIES/);
    assert.doesNotMatch(screen, /echo-living-preferences/);
    assert.match(screen, /shell-echo-mind-screen__messages/);
    assert.match(screen, /Write to Echo/);
    assert.match(screen, /Talk to Echo/);
    assert.match(screen, /Send/);
    assert.doesNotMatch(shell, /EchoIntrusionOverlay/);
    assert.match(screen, /slice\(-4\)/);
    assert.match(screen, /messages\.slice\(-7\)/);
    assert.doesNotMatch(screen, /createEchoMindPlayerContext/);
    assert.match(screen, /Temporary Echo session privacy/);
    assert.match(voice, /\/api\/echo\/transcribe/);
    assert.match(voice, /MediaRecorder/);
    assert.match(transcribeEndpoint, /GEMINI_API_KEY/);
    assert.match(transcribeEndpoint, /inlineData/);
  });
});
