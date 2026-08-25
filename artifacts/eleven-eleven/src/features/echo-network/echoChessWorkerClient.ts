import {
  chooseEchoChessMove,
  type EchoChessEnginePort,
  type EchoChessMoveRequest,
  type EchoChessMoveResponse,
} from '../../domain/echo-network/echoChessEngine';

interface EchoChessWorkerResult {
  type: 'result';
  requestId: number;
  response: EchoChessMoveResponse;
}

interface PendingRequest {
  resolve: (response: EchoChessMoveResponse) => void;
  timeout: ReturnType<typeof setTimeout>;
}

const WORKER_TIMEOUT_FLOOR_MS = 400;
const WORKER_TIMEOUT_GRACE_MS = 500;
const WORKER_TIMEOUT_CEILING_MS = 1_800;

function workerTimeoutMs(request: EchoChessMoveRequest): number {
  const budget = Number.isFinite(request.timeBudgetMs)
    ? Math.max(0, Math.ceil(request.timeBudgetMs))
    : 0;
  return Math.min(
    WORKER_TIMEOUT_CEILING_MS,
    Math.max(WORKER_TIMEOUT_FLOOR_MS, budget + WORKER_TIMEOUT_GRACE_MS),
  );
}

function unavailableResponse(message: string): EchoChessMoveResponse {
  return {
    ok: false,
    code: 'no_legal_move',
    message,
  };
}

/**
 * Keeps calculation off the interaction thread where Workers are available.
 * The direct path is intentionally deterministic and is only a compatibility
 * fallback for environments that do not expose Web Workers.
 */
export function createEchoChessEnginePort(): EchoChessEnginePort {
  if (typeof Worker === 'undefined') {
    return {
      chooseMove: async (request) => chooseEchoChessMove(request),
      dispose: () => undefined,
    };
  }

  const worker = new Worker(new URL('./echoChess.worker.ts', import.meta.url), {
    type: 'module',
    name: 'echo-chess-engine',
  });
  const pending = new Map<number, PendingRequest>();
  let nextRequestId = 1;
  let disposed = false;
  let unavailable = false;

  const settle = (requestId: number, response: EchoChessMoveResponse) => {
    const request = pending.get(requestId);
    if (!request) return;
    pending.delete(requestId);
    clearTimeout(request.timeout);
    request.resolve(response);
  };

  const settleAll = (response: EchoChessMoveResponse) => {
    for (const requestId of [...pending.keys()]) settle(requestId, response);
  };

  const failWorker = (message: string) => {
    if (unavailable || disposed) return;
    unavailable = true;
    worker.terminate();
    settleAll(unavailableResponse(message));
  };

  worker.addEventListener('message', (event: MessageEvent<EchoChessWorkerResult>) => {
    if (event.data?.type !== 'result') return;
    settle(event.data.requestId, event.data.response);
  });

  worker.addEventListener('error', () => {
    failWorker('Echo could not complete this calculation.');
  });

  worker.addEventListener('messageerror', () => {
    failWorker('Echo could not read this calculation.');
  });

  return {
    chooseMove(request) {
      if (disposed || unavailable) {
        return Promise.resolve(unavailableResponse(
          disposed ? 'Echo Duel has closed.' : 'Echo needs a new duel before calculating again.',
        ));
      }
      const requestId = nextRequestId;
      nextRequestId += 1;
      return new Promise<EchoChessMoveResponse>((resolve) => {
        const timeout = setTimeout(() => {
          failWorker('Echo took too long to calculate. Start a new duel and try again.');
        }, workerTimeoutMs(request));
        pending.set(requestId, { resolve, timeout });
        try {
          worker.postMessage({ type: 'choose', requestId, request });
        } catch {
          failWorker('Echo could not start this calculation.');
        }
      });
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      worker.terminate();
      settleAll(unavailableResponse('Echo Duel has closed.'));
    },
  };
}

export { workerTimeoutMs };
