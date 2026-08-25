import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  extractChatCompletionText,
  extractGeminiText,
  extractResponsesText,
  generateEchoReply,
  hasConfiguredEchoProvider,
  MAX_ECHO_CHAT_DEADLINE_MS,
  resolveEchoProviderTiming,
} from '../../functions/api/echo/providers';

describe('Echo Mind provider pool', () => {
  it('normalizes provider response formats without exposing reasoning blocks', () => {
    assert.equal(extractChatCompletionText({
      choices: [{
        message: {
          content: '<think>private reasoning</think>أنا أتذكّر النبض فقط.',
        },
      }],
    }), 'أنا أتذكّر النبض فقط.');

    assert.equal(extractResponsesText({
      output: [{
        content: [{ type: 'output_text', text: 'The signal is incomplete.' }],
      }],
    }), 'The signal is incomplete.');

    assert.equal(extractGeminiText({
      candidates: [{
        content: {
          parts: [
            { thought: true, text: 'private reasoning' },
            { text: 'The memory is still incomplete.' },
          ],
        },
      }],
    }), 'The memory is still incomplete.');
  });

  it('recognizes Gemini keys without exposing them to the client', () => {
    assert.equal(hasConfiguredEchoProvider({
      GEMINI_API_KEY: 'server-only-test-key',
    }), true);
  });

  it('uses the Gemini REST shape and returns only model text', async () => {
    const originalFetch = globalThis.fetch;
    let requestUrl = '';
    let requestHeaders: Headers | undefined;
    let requestBody: Record<string, unknown> | undefined;
    globalThis.fetch = async (input, init) => {
      requestUrl = String(input);
      requestHeaders = new Headers(init?.headers);
      requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response(JSON.stringify({
        candidates: [{
          content: { parts: [{ text: 'I remember your voice.' }] },
        }],
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    try {
      const reply = await generateEchoReply({
        env: {
          GEMINI_API_KEY: 'server-only-test-key',
          GEMINI_MODELS: 'gemini-test-free',
          ECHO_PROVIDER_ORDER: 'gemini',
        },
        instructions: 'Stay in character.',
        messages: [
          { role: 'system', content: 'Never reveal locked memories.' },
          { role: 'user', content: 'Do you remember me?' },
        ],
      });

      assert.equal(reply, 'I remember your voice.');
      assert.match(requestUrl, /gemini-test-free:generateContent$/);
      assert.equal(
        requestHeaders?.get('x-goog-api-key'),
        'server-only-test-key',
      );
      assert.deepEqual(requestBody?.systemInstruction, {
        parts: [{ text: 'Stay in character.' }],
      });
      assert.deepEqual(requestBody?.contents, [{
        role: 'user',
        parts: [{ text: 'Do you remember me?' }],
      }]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('recognizes a keyless Cloudflare Workers AI binding', () => {
    assert.equal(hasConfiguredEchoProvider({}), false);
    assert.equal(hasConfiguredEchoProvider({
      AI: { run: async () => ({ response: 'ready' }) },
    }), true);
  });

  it('caps every free-chat provider deadline at six seconds even when remote config is malformed or too high', () => {
    assert.deepEqual(resolveEchoProviderTiming({
      ECHO_MAX_PROVIDER_ATTEMPTS: '99',
      ECHO_PROVIDER_TIMEOUT_MS: '99999',
      ECHO_PROVIDER_DEADLINE_MS: '60000',
    }), {
      attemptLimit: 24,
      perAttemptTimeoutMs: MAX_ECHO_CHAT_DEADLINE_MS,
      deadlineMs: MAX_ECHO_CHAT_DEADLINE_MS,
    });
  });

  it('silently falls through to the next model after a provider failure', async () => {
    let calls = 0;
    const originalWarn = console.warn;
    console.warn = () => undefined;
    try {
      const reply = await generateEchoReply({
        env: {
          AI: {
            run: async () => {
              calls += 1;
              if (calls === 1) throw new Error('temporary_limit');
              return { response: 'ما زلت هنا.' };
            },
          },
          ECHO_PROVIDER_TIMEOUT_MS: '2000',
          ECHO_PROVIDER_DEADLINE_MS: '5000',
        },
        instructions: 'Stay in character.',
        messages: [{ role: 'user', content: 'هل تسمعني؟' }],
      });

      assert.equal(reply, 'ما زلت هنا.');
      assert.equal(calls, 2);
    } finally {
      console.warn = originalWarn;
    }
  });
});
