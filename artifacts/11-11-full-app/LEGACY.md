# Legacy Application — `artifacts/11-11-full-app`

## Status: LEGACY / UNUSED

This directory contains the **original standalone Vanilla JS prototype** of the 11.11 game. It is **not referenced** by the main React/TypeScript application (`artifacts/eleven-eleven/`).

## Evidence

| Check | Result |
|-------|--------|
| React app imports from this folder | **None found** |
| Build scripts target this folder | **None found** |
| CI/CD configs (`vercel.json`, `netlify.toml`) | Target `artifacts/eleven-eleven` only |
| Package scripts | Target `artifacts/eleven-eleven` only |

## Contents

- `index.html` — standalone HTML entry point
- `css/style.css` — standalone stylesheet
- `js/data.js` — static game data
- `js/engine.js` — original game engine (puzzles, state, dialogue)
- `js/app.js` — original app bootstrap
- `STAGE1_MASTER_SYSTEM_MAP.md` — design documentation
- `STAGE2_VALIDATION.md` — validation notes
- `MISSING_FEATURES_REPORT.md` — feature gap analysis

## Relationship to Main App

The main React app (`artifacts/eleven-eleven/`) is a complete rewrite of this prototype in TypeScript + React + Zustand + Vite. The two applications:

- **Do not share code** (no imports between them)
- **Do not share state** (separate localStorage keys if any)
- **Are not co-deployed** (only the React app is built for production)

## Recommendation

- **Do not delete** — this folder contains historical reference and original design docs.
- **Do not merge** — the React app supersedes it completely.
- **Isolate** — this folder should be treated as a read-only archive of the prototype phase.
