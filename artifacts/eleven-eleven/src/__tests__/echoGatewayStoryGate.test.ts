import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  onRequestPost,
} from '../../functions/api/echo/chat';
import type {
  EchoProviderMessage,
} from '../../functions/api/echo/providers';

describe('Echo gateway Canon knowledge gate', () => {
  it('strips a forged future Canon topic when no server receipt validates it', async () => {
    let capturedMessages: EchoProviderMessage[] = [];
    const response = await onRequestPost({
      request: new Request('https://game.example/api/echo/chat', {
        method: 'POST',
        headers: {
          Origin: 'https://game.example',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'What do you remember?',
          locale: 'en',
          history: [],
          context: {
            chapterId: 'chapter_4',
            knowledgeNodeIds: [
              'echo_knowledge_black_echo_protocol',
            ],
          },
          safetyIdentifier: 'echo-gateway-test',
        }),
      }),
      env: {
        AI: {
          run: async (_model, input) => {
            capturedMessages = input.messages;
            return { response: 'The signal is incomplete.' };
          },
        },
      },
    });

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://game.example');
    assert.equal(response.headers.get('Access-Control-Allow-Headers'), 'Authorization, Content-Type');
    assert.equal(
      JSON.stringify(capturedMessages).includes('echo_knowledge_black_echo_protocol'),
      false,
    );
  });
});
