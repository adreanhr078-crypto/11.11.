---
name: 11-11-chess
description: Drive every chess-related implementation, bug fix, review, or extension in 11.11. Use for Echo chess training, Contract Chess panel, realtime chess rooms, chess UI/board rendering, chess sound design, or chess accessibility. Read the active project rules and run preflight before any change. Do not modify game logic, puzzle canon, or other frozen systems unless the task explicitly scopes to chess only.
---

# 11.11 Chess Skill

Chess is a first-class mode in 11.11 with two surfaces: **Echo chess training** (single-player, canonical, story-driven) and **Contract Chess** (multiplayer realtime via the Durable Objects worker). The backend already exposes `/network/chess-training`, `/v1/rooms/chess/`, and a realtime worker with `chess_casual` and `chess_ranked_blitz` modes.

## Active implementation facts

- **Rules engine:** `chess.js` is the single source of truth for move validation, FEN parsing, check/checkmate/stalemate, castling, en passant, and promotion. Do not reimplement chess rules.
- **Echo training surface:** `src/features/echo-network/echoChess.worker.ts` + `echoChessWorkerClient.ts` + `ContractChessPanel.tsx`. Training moves flow through the worker so the server owns canonical state. Frontend must never trust client-only chess state for rewards or progression.
- **Realtime rooms:** `workers/realtime/test/realtimeWorker.test.ts` documents `chess_casual` and `chess_ranked_blitz` paths, participant rewards, lease reconciliation, stale sweep, and authoritative receipt flow. Any new chess feature must respect the existing matchmaker name pattern `me:chess_casual:default:open` and `me:chess_ranked_blitz:default:open`.
- **Data model:** `src/infrastructure/echo-network/echoNetworkApi.ts` defines `VerifiedChessTrainingSnapshot`, `chessTrainingCompleted`, `casualChessCompleted`, and `rankedChessUnlocked`. Training progression is gated: `rankedChessUnlocked` requires `chessTrainingCompleted === true` and `casualChessCompleted >= 3`.
- **Navigation:** `ApplicationShell.tsx` exposes `chessTrainingCompleted`, `casualChessCompleted`, and `rankedChessUnlocked` to the shell. `screenRegistry.ts` and `navigationRegistry.ts` describe the hub copy as chess + co-op + seasons.

## Required workflow

1. Run `npm run agent:preflight` before any edit. If it fails, stop and surface the full error.
2. Read the actual chess surface (panel, worker, store, tests) before changing behavior.
3. Preserve canonical authority: rewardable chess results require time, active participation, and real play; fast/abandoned rooms must still be recorded for audit without granting XP, bond, or rating.
4. Update tests alongside behavior changes. The worker test file is the strongest evidence file for chess contracts.
5. Run `npm run agent:postflight` after changes. If postflight fails, do not declare success.

## UI and accessibility rules for chess

- The board must remain legible under cinematic atmosphere. Use the visual-contract guidance in `11-11-ui/references/visual-contract.md`; choose React/CSS for routine board states and reserve Blender/3D for entrance sequences only.
- All chess state (selected square, legal moves, captured pieces, turn, check indicator) must have a color-independent cue and visible focus.
- Promotion dialogs use `role="dialog"` with `aria-live="polite"`.
- No ad slots on chess surfaces.

## Sound rules for chess

- Chess SFX must respect `sfxVolume` from `useUiPreferencesStore`.
- Piece movement, capture, check, and game-end sounds must have a non-audio equivalent (visual flash, board highlight, text notice) so mute players retain full information.
- If synthesizing sounds, reuse the `AudioContext` pattern from `src/infrastructure/audio/puzzleRewardAudio.ts` (clamp volume, suspended-context priming, timeout-based disconnect).

## What is frozen and must not change

- Canon puzzle logic and story endings.
- Achievements, Memory Shards, and Cinematic Scenes.
- Reward authority or receipt replay logic.
