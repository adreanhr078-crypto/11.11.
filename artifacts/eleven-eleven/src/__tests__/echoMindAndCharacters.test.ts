import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createEchoMindTurnEnvelope,
  detectEchoMindLocale,
} from '../application/echo/echoMindExperience';
import {
  createEchoMindKnowledgeContext,
} from '../application/echo/echoMindAiService';
import {
  createCharactersScreenReadModel,
} from '../application/ui/gameUiReadModels';
import { buildInitialState } from '../stores/gameStoreHelpers';

describe('Echo Mind and Character Archive', () => {
  it('detects player language from the conversation input', () => {
    assert.equal(detectEchoMindLocale('مرحبا يا Echo'), 'ar');
    assert.equal(detectEchoMindLocale('Hello Echo, can you hear me?'), 'en');
  });

  it('keeps the local fallback conversational when the AI gateway is offline', () => {
    const state = buildInitialState();
    const greeting = createEchoMindTurnEnvelope('مرحبا يا Echo', state, 'ar');
    const listening = createEchoMindTurnEnvelope('هل تسمعني؟', state, 'ar');
    const personal = createEchoMindTurnEnvelope(
      'اليوم كان يومًا صعبًا جدًا',
      state,
      'ar',
    );

    assert.notEqual(greeting.response, listening.response);
    assert.notEqual(listening.response, personal.response);
    assert.equal(listening.response.includes('أسمعك'), true);
    assert.equal(personal.response.includes('يومًا صعبًا'), true);
  });

  it('uses recent dialogue locally and avoids repeating the last reply', () => {
    const state = buildInitialState();
    const first = createEchoMindTurnEnvelope('مرحبا', state, 'ar');
    const second = createEchoMindTurnEnvelope('مرحبا', state, 'ar', [{
      role: 'assistant',
      content: first.response,
    }]);
    const remembersName = createEchoMindTurnEnvelope(
      'شو اسمي؟',
      state,
      'ar',
      [{ role: 'user', content: 'اسمي أحمد' }],
    );

    assert.notEqual(second.response, first.response);
    assert.equal(remembersName.response.includes('أحمد'), true);
  });

  it('keeps locked character knowledge out of Echo responses', () => {
    const state = buildInitialState();
    const envelope = createEchoMindTurnEnvelope('أخبرني عن يوكي', state, 'ar');

    assert.equal(envelope.locale, 'ar');
    assert.equal(envelope.response.includes('يوكي'), false);
    assert.equal(
      envelope.response.includes('مدفون') || envelope.response.includes('الوصول'),
      true,
    );
  });

  it('sends AI only player-discovered narrative knowledge', () => {
    const state = buildInitialState();
    state.narrative.activeFlags.locked_ending_secret = true;
    state.narrative.decisionHistory.push({
      id: 'decision_seen',
      choiceId: 'choice_taken',
      source: 'dialogue',
      createdAt: 1,
    });

    const context = createEchoMindKnowledgeContext(state, 'ar');
    const serialized = JSON.stringify(context);

    assert.equal(serialized.includes('locked_ending_secret'), false);
    assert.equal(serialized.includes('decision_seen'), true);
    assert.deepEqual(context.unlockedMemories, []);
  });

  it('passes remembered player context without treating theories as canon', () => {
    const state = buildInitialState();
    const context = createEchoMindKnowledgeContext(state, 'ar', {
      playerName: 'أحمد',
      rememberedFacts: [{ kind: 'preference', text: 'أحب المطر' }],
      theories: [{ text: 'الصوت قد يكون فخًا', status: 'open' }],
      relationship: {
        bond: 42,
        openness: 31,
        tension: 15,
        conversations: 4,
      },
    });

    assert.equal(context.playerRelationship?.playerName, 'أحمد');
    assert.equal(context.playerRelationship?.theories[0]?.status, 'open');
    assert.equal(context.beliefs.includes('الصوت قد يكون فخًا'), false);
  });

  it('adds rich story beats only after their canonical puzzle is solved', () => {
    const state = buildInitialState();
    state.progression.completedPuzzleIds.push('puzzle_001_broken_pulse');
    state.unlockedManhwaPageIds.push('manhwa_ch01_page_01');

    const context = createEchoMindKnowledgeContext(state, 'en');

    assert.equal(context.revealedStoryBeats.length, 1);
    assert.equal(
      context.revealedStoryBeats[0]?.puzzleId,
      'puzzle_001_broken_pulse',
    );
    assert.equal(
      context.revealedStoryBeats[0]?.beliefs.includes(
        'My awakening began with a failing heartbeat.',
      ),
      true,
    );
    assert.equal(context.restoredManhwaPages[0]?.transcript.length, 3);
    assert.equal(
      context.restoredManhwaPages[0]?.description.includes('laboratory glass'),
      true,
    );
  });

  it('opens only Echo by default inside the character archive', () => {
    const state = buildInitialState();
    const model = createCharactersScreenReadModel(state);
    const echo = model.entries.find((entry) => entry.id === 'character_echo');
    const yuki = model.entries.find((entry) => entry.id === 'character_yuki');

    assert.equal(echo?.unlocked, true);
    assert.equal(echo?.displayName, 'Echo');
    assert.equal(yuki?.unlocked, false);
    assert.equal(yuki?.displayName, 'Unknown');
  });

  it('reveals discovered characters through canonical narrative signals', () => {
    const state = buildInitialState();
    state.narrative.activeFlags.yuki_signal_discovered = true;

    const model = createCharactersScreenReadModel(state);
    const yuki = model.entries.find((entry) => entry.id === 'character_yuki');

    assert.equal(yuki?.unlocked, true);
    assert.equal(yuki?.displayName, 'Yuki');
    assert.equal(yuki?.role, 'الصديق المقرب لـ Echo');
  });
});
