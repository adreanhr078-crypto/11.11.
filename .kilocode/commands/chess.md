---description: Work on chess features in the 11.11 project.---
# /chess — Chess Tasks

Work on chess features: Contract Chess, Echo Training, multiplayer modes.

## Usage

/chess <task> — where task is one of:
- `train` — work on Echo chess training
- `contract` — work on Contract Chess panel
- `engine` — work on the chess engine/worker
- `ui` — chess board UI
- `sound` — chess SFX
- `test` — run chess tests
- `review` — chess review

## Active files

- `src/features/echo-network/ContractChessPanel.tsx` — main chess board
- `src/features/echo-network/echoChessEngine.ts` — engine logic
- `src/features/echo-network/echoChessWorkerClient.ts` — worker client
- `src/domain/echo-network/echoChessEngine.ts` — domain logic
- `src/infrastructure/echo-network/echoNetworkApi.ts` — API client
- `workers/realtime/` — multiplayer chess rooms (chess_casual, chess_ranked_blitz)
- `src/__tests__/echoChessEngine.test.ts` — engine tests
- `src/__tests__/coreJourneyLocalization.test.ts` — chess lobby localization

## Chess.js patterns

```typescript
import { Chess } from 'chess.js';
const game = new Chess();
const valid = game.move({ from: 'e2', to: 'e4' });
```

## Rules

1. Server authority: All rewardable results require server-side validation.
2. FEN-only state: Frontend receives FEN from server, never trusts client state.
3. Time + participation: Rewardable results require time and active play.
4. Audit logging: Fast/abandoned rooms logged but not rewarded.
5. Bilingual: Copy uses `chessCopy(locale)`.

## Skills to load

- `$11-11-chess` — chess rules, modes, tests
- `$11-11-audio` — chess SFX patterns
- `$11-11-ui` — board UI patterns
