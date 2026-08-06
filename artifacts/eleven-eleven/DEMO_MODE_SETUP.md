# 11:11 Demo mode

Demo mode is a presentation layer over the already published Chapter 1
campaign. It does not register puzzles, unlock deferred story content, or
change endings.

Copy `.env.example` to `.env.local` and enable the flag:

```env
VITE_DEMO_MODE=true
VITE_FULL_GAME_URL=https://example.com/eleven-eleven
```

`VITE_FULL_GAME_URL` is optional. When omitted, the demo boundary only offers
the player a way to continue exploring the available build.

The demo badge shows progress through the existing 20 Chapter 1 signals. Once
all are completed, the boundary message appears and clearly explains that the
next signal is outside this demo. Progress remains in the normal local save.
