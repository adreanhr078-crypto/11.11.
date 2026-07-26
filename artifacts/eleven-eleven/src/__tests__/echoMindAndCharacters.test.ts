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
