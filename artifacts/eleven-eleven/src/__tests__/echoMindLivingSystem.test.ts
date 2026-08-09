import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  createEchoMindIntrusion,
  createEchoMindPlayerContext,
  deriveEchoMindRelationship,
  extractEchoMindPlayerMemories,
  type EchoMindRelationship,
} from '../application/echo/echoMindLivingStore';

const BASE_RELATIONSHIP: EchoMindRelationship = {
  bond: 24,
  openness: 18,
  tension: 12,
  conversations: 0,
  voiceConversations: 0,
  lastInteractionAt: null,
};

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

  it('queues spoiler-safe intrusions every third completed conversation', () => {
    const second = { ...BASE_RELATIONSHIP, conversations: 2 };
    const third = { ...BASE_RELATIONSHIP, conversations: 3 };

    assert.equal(createEchoMindIntrusion(second, 'أحمد', 1_000), null);
    const intrusion = createEchoMindIntrusion(third, 'أحمد', 1_000);
    assert.equal(intrusion?.seen, false);
    assert.equal(intrusion?.text.ar.includes('أحمد'), true);
    assert.ok((intrusion?.availableAfter ?? 0) > 1_000);
  });

  it('keeps player theories explicitly unconfirmed in AI context', () => {
    const context = createEchoMindPlayerContext({
      playerName: 'أحمد',
      memories: [],
      theories: [{
        id: 'theory_1',
        text: 'الصوت قد يكون فخًا',
        status: 'open',
        createdAt: 1,
        updatedAt: 1,
      }],
      relationship: BASE_RELATIONSHIP,
    });

    assert.equal(context.playerName, 'أحمد');
    assert.deepEqual(context.theories, [{
      text: 'الصوت قد يكون فخًا',
      status: 'open',
    }]);
  });

  it('keeps Echo Mind focused on the conversation and preserves intrusion UI', () => {
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
    assert.match(shell, /EchoIntrusionOverlay/);
    assert.match(voice, /\/api\/echo\/transcribe/);
    assert.match(voice, /MediaRecorder/);
    assert.match(transcribeEndpoint, /GEMINI_API_KEY/);
    assert.match(transcribeEndpoint, /inlineData/);
  });
});
