---description: Show all available commands and skills in the 11.11 project.---
# /help — Show Available Commands & Skills

List all slash commands, skills, and tools available for the 11.11 project.

## Slash Commands

| Command | Purpose |
|---|---|
| `/new <type> <name>` | Create new file, component, feature, store, API, test, or doc |
| `/code <description>` | Write, edit, or refactor code with full quality gate |
| `/test [scope]` | Run tests (default, realtime, content, media, env, audit) |
| `/review <target>` | Review code, UI, puzzle, asset, chess, or audio |
| `/chess <task>` | Chess features: train, contract, engine, ui, sound, test, review |
| `/puzzle <task>` | Puzzle features: story, daily, weekly, new, review, test |
| `/cinematic <task>` | Cinematic assets: blend, render, export-gltf, review, list |
| `/audio <task>` | Audio: review, puzzle, achievement, echo-mind, tts, validate, normalize |
| `/asset <task>` | Asset generation, validation, transformation |
| `/quality-gate [scope]` | Full autonomous quality gate |
| `/deploy <target>` | Deploy/build web, android, ios, windows, realtime, functions, all |
| `/audit <target>` | Audit npm, secrets, canon, accessibility, performance, dependencies |
| `/security <target>` | Focused security audit (npm, secrets, canon, owasp, deps, player-data, firebase, cloudflare) — NEW Wave 3 |
| `/debug <target>` | Diagnose build/typecheck/console/white-screen/network/worker/chess/audio errors — NEW Wave 3 |
| `/release-check <target>` | Pre-release gate: 8 categories (bugs, perf, assets, localization, a11y, save, regression, canon) — NEW Wave 4.2-lite |
| `/docs <type> <target>` | Write/update docs: skill, readme, api, reference, changelog |
| `/help` | This help message |

## Skills (AI Agent Knowledge)

### 11.11 Project Skills (in `.agents/skills/`)

- `$11-11-chess` — Chess implementation
- `$11-11-puzzles` — Puzzle authoring
- `$11-11-audio` — Audio system
- `$11-11-ui` — UI/UX
- `$11.11-autonomous-quality-gate` — Quality gate
- `$11.11-player-experience-loop` — Player journey
- `$11-11-cinematic-assets` — Cinematic pipeline
- `$11-11-image-generation` — Image generation
- `$11-11-free-media-tools` — Free media tools
- `$11-11-3d-pipeline` — 3D pipeline (Blender -> GLB -> Three.js)
- `$11-11-blender` — Blender authoring
- `$11-11-blender-cli` — Blender CLI invocations
- `$11-11-unity` — Unity (future)
- `$11-11-unity-cli` — Unity CLI invocations
- `$11-11-canva` — Canva design
- `$11-11-canva-cli` — Canva API
- `$11-11-ffmpeg` — Video encoding
- `$11-11-audacity` — Audio processing
- `$11-11-imagemagick` — Image processing
- `$11-11-stable-diffusion` — Stable Diffusion
- `$11-11-comfyui` — ComfyUI/Stable Diffusion CLI
- `$11-11-ai-audio` — AI audio generation
- `$11-11-tts` — TTS CLI
- `$11-11-mcp-integration` — MCP servers
- `$11-11-kilo-config` — Kilo configuration
- `$11-11-react-patterns` — React 19 + Zustand + RHF + Radix + Framer Motion patterns (NEW Wave 2)
- `$11-11-three-r3f` — Three.js + React Three Fiber patterns (NEW Wave 2)
- `$11-11-playwright` — Playwright E2E + white-screen guard + axe-core (NEW Wave 2)
- `$11-11-accessibility-testing` — WCAG 2.2 AA + bilingual RTL/LTR (NEW Wave 2)
- `$11-11-cloudflare-workers` — Workers + D1 + R2 + Durable Objects + Wrangler (NEW Wave 2)
- `$11-11-playtest` — Player experience review: onboarding, flow, difficulty, pacing, hook, reward timing, bilingual parity, return reason (NEW Wave 4.2-lite)

### Generic Skills (in `.kilo/skills/`)

adbc, adf-master, agent-md-refactor, aidp-object-storage, airbyte-agent, airflow, angular-routing, artifacts-builder

## Tools (in `tools/`)

| Tool | Purpose |
|---|---|
| `tools/media/validate-assets.ts` | Validate media assets |
| `tools/environment-setup/check-environment.ts` | Check free media tools availability |
| `tools/environment-setup/setup-media-tools.ts` | Generate media tools manifest |
| `tools/blender/run-blender.ts` | Invoke Blender headless |
| `tools/blender/export_glb.py` | Blender GLB export |
| `tools/blender/render_cinematic.py` | Blender cinematic render |
| `tools/unity/run-unity.ts` | Invoke Unity CLI |
| `tools/canva/run-canva.ts` | Invoke Canva API |
| `tools/stable-diffusion/run-comfyui.ts` | Invoke ComfyUI API |
| `tools/ai-audio/run-tts.ts` | Invoke AI TTS services |

## MCP Servers (in `.kilo/kilo.json`)

- airbyte-agent-mcp (remote)
- airbyte-knowledge-mcp (remote)
- astronomer-docs-mcp (remote)
- awslabs-kinesis-mcp-server (local, uvx)
- amazon-keyspaces-mcp (local, uvx)
- aws-redshift-mcp (local, uvx)

## npm scripts (root)

```bash
npm run media:validate      # Validate media assets
npm run env:check            # Check free media tools
npm run env:setup            # Generate media tools manifest
npm run agent:preflight      # Pre-edit gate
npm run agent:postflight     # Post-edit gate
npm run doctor               # Project doctor
npm run build                # Build web bundle
npm run typecheck            # TypeScript check
```

## Quality Gate (always required)

```
UNDERSTAND -> INSPECT -> PLAN -> IMPLEMENT -> VERIFY -> SELF-CRITIQUE ->
AUTO-FIX SAFE DEFECTS -> VERIFY AGAIN -> REGRESSION REVIEW -> FINAL DELIVERY
```

## Frozen systems (do not modify)

- Game logic
- Puzzles (data + screen)
- Memory Shards
- Story endings
- Achievements
- Cinematic scenes
