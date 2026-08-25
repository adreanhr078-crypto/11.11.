/// <reference lib="webworker" />

import {
  chooseEchoChessMove,
  type EchoChessMoveRequest,
  type EchoChessMoveResponse,
} from '../../domain/echo-network/echoChessEngine';

interface EchoChessWorkerRequest {
  type: 'choose';
  requestId: number;
  request: EchoChessMoveRequest;
}

interface EchoChessWorkerResult {
  type: 'result';
  requestId: number;
  response: EchoChessMoveResponse;
}

declare const self: DedicatedWorkerGlobalScope;

self.addEventListener('message', (event: MessageEvent<EchoChessWorkerRequest>) => {
  if (event.data?.type !== 'choose' || !Number.isInteger(event.data.requestId)) return;
  const response = chooseEchoChessMove(event.data.request);
  const result: EchoChessWorkerResult = {
    type: 'result',
    requestId: event.data.requestId,
    response,
  };
  self.postMessage(result);
});
