---
name: 11-11-three-r3f
description: Author, integrate, and optimize Three.js + React Three Fiber scenes inside the 11.11 application. Use for the chess board surface, Echo transformations, ward environments, interactive 3D props, and any other GLB/GLTF-driven scene. Enforces the lazy-load-first policy, Draco/Meshopt compression, suspense boundaries, dispose-on-unmount, reduced-motion fallback, and the visual contract (obsidian + signal crimson + pale ivory). Do not modify frozen game logic or cinematic scenes unless the task explicitly scopes to R3F changes within allowed boundaries.
---

# 11.11 Three.js + R3F Patterns

11.11 uses React Three Fiber for the few surfaces where real-time 3D adds real player value (Echo transformations, chess board, ward environments). Most surfaces stay React/CSS. Use this skill when authoring, integrating, or debugging any `three`, `@react-three/fiber`, or `@react-three/drei` code path.

## Active implementation facts

- **Three.js:** `three@^0.185.1`. Use the official `three` types; do not re-declare geometry/material interfaces.
- **React Three Fiber:** `@react-three/fiber@^9.6.1`. Use the `Canvas`, `useFrame`, `useThree`, and `extend` APIs as documented.
- **Drei:** `@react-three/drei@^10.7.7` for `OrbitControls`, `Environment`, `ContactShadows`, `useGLTF`, `Html`, `Loader`, `Stats`, `Preload`, `Bounds`, `Center`, `Stage`, and friends. Prefer Drei helpers over hand-rolled controls.
- **No physics engine** is currently integrated. Keep 3D scenes static or animated through `useFrame` only.
- **Asset pipeline:** Blender exports go to `public/assets/3d/<surface>/<name>.glb`. The `tools/blender/run-blender.ts` CLI drives headless export (see `11-11-3d-pipeline`).
- **Post-processing:** No global postprocessing chain is wired. Use Drei's `Environment` for IBL; add `<EffectComposer>` only when the visual contract demands it.
- **First-frame determinism:** `Canvas` mounts must not flash. Use `<Suspense fallback={<FallbackMesh />}>` and reserve a fixed-height container with a CSS gradient fallback.

## Required workflow

1. Run `npm run agent:preflight` before any edit. Stop on failure.
2. Read the existing scene, asset, and store before changing R3F code.
3. Confirm the visual contract for the surface (see `11-11-ui`). 3D is a layer, not a substitute for accessibility.
4. Confirm the asset exists at the documented path. If not, route through the Blender pipeline.
5. Confirm the scene fits the budget: < 5MB GLB, < 50k triangles, < 4 materials per mesh.
6. Run `npm run typecheck`, `npm test`, `npm run build`, and `npm run media:validate` after changes.
7. Run `npm run agent:postflight`. If it fails, do not declare success.

## Scene composition rules

- One scene per `Canvas`. Do not mount multiple `Canvas` instances in the same screen unless the visual contract requires it.
- Use `<Canvas dpr={[1, 2]} gl={{ antialias: true, powerPreference: 'high-performance' }}>`.
- Set `shadows="soft"` only when the visual contract requires cast shadows. Off by default for performance.
- Use `<Preload all />` to warm the GLTF cache. Pair with `useGLTF.preload(url)` for above-the-fold assets.
- Place interactive objects inside a `Bounds` + `Center` group so the camera frames them automatically.
- For the chess board: 2.5D layer is preferred for routine state. Reserve R3F for entrance, check, and game-end moments.

## Loading and suspense

- The R3F scene must be **lazy-loaded** behind a player action or a route boundary. Do not include the GLB payload in the initial bundle.
- Wrap the scene in `<Suspense fallback={<SceneFallback />}>`.
- The fallback must be a code-native skeleton or a CSS gradient, never a blank screen.
- Reserve explicit width and height on the container to prevent CLS while the scene loads.
- Use Drei's `Loader` for the global progress indicator; do not roll a custom one.

## Asset rules

- Format: GLB with Draco compression for geometry and Meshopt or KTX2 for textures.
- Size budget: < 5MB per asset, < 50k triangles, single material per mesh where possible.
- Coordinate system: Y-up, meters. The chess board square is 1m × 1m.
- Origin: place the asset's natural center at the origin so `Center` and `Bounds` work without offset.
- Naming: `<surface>__<descriptor>__v<MAJOR.MINOR>.glb` (e.g., `echo-transform__coronation__v1.2.glb`).
- Store source `.blend` files outside the runtime tree (e.g., `artifacts/eleven-elven/assets/3d/source/`).

## Performance rules

- `useFrame` is for tiny, scoped updates only. Avoid heavy work per frame.
- Use `frameloop="demand"` when the scene is static, then call `invalidate()` on interaction.
- Reuse materials and geometries. Do not recreate them per frame or per render.
- Dispose on unmount: rely on R3F's automatic disposal for meshes/geometries/materials/textures attached to the scene; for manually created objects call `dispose()` in the cleanup.
- Pause animation when the screen is hidden (`document.visibilityState === 'hidden'`).
- Profile with the Drei `Stats` panel during development; remove before shipping.

## Camera and controls

- Default FOV: 35° for product surfaces, 50° for cinematic.
- Use `PerspectiveCamera` with `makeDefault`.
- `OrbitControls` are reserved for inspection/debug. Do not ship them to players.
- For chess: scripted camera transitions; never free orbit.

## Lighting rules

- Default: `<ambientLight intensity={0.4} />` + one key `<directionalLight>` with shadows disabled.
- Cinematic surfaces: `<Environment preset="city" />` or a custom HDR. Never inline huge HDRI textures in the bundle.
- Avoid real-time shadows unless the visual contract explicitly requires them.
- Honor reduced motion: a still camera is the reduced-motion equivalent of a tracking camera.

## Accessibility rules

- 3D must not be the only carrier of state, label, or action. Always provide a 2D alternative path.
- Provide a reduced-motion alternative (static camera, no rotation, fade-in only).
- Keyboard navigation must reach the 2D controls overlaid on the scene.
- Provide ARIA labels for any 2D HUD rendered via Drei's `Html`.

## Integration rules

- The scene component lives in `src/features/<feature>/<SceneName>Scene.tsx`.
- Co-locate the GLB asset under `public/assets/3d/<surface>/`.
- The screen that owns the scene lazy-loads it via `React.lazy`.
- Do not import `three` directly from a screen file; import from the feature module.
- Use `Suspense` boundaries to isolate failures; a thrown loader must not crash the screen.

## Error and failure modes

- GLB load failure: show the CSS gradient fallback and log to telemetry. Never show a white screen.
- WebGL unsupported: render the 2D alternative path. Detect via `useThree` capability check on mount.
- Reduced motion: skip camera animation and asset entrance. Show the resting pose.
- Hidden tab: pause `useFrame` work and asset streaming.

## Anti-patterns to refuse

- Importing the GLB at the top level (defeats lazy-loading).
- Creating `new THREE.Object3D()` or materials per render in `useFrame`.
- Adding a global `<EffectComposer>` for decorative bloom.
- Using `OrbitControls` in a player-facing screen.
- Hardcoded English/Arabic labels inside the GLB.
- Mounting multiple `<Canvas>` in the same screen.
- Animating perpetually without a reduced-motion alternative.
- Including the GLB in the initial bundle (size budget violation).

## What is frozen and must not change

- The frozen cinematic scene authority (canonical endings, transformations).
- The frozen source list at `artifacts/eleven-eleven/AGENT_RULES.md` section 6.
- The 11.11 visual contract (obsidian, signal crimson, pale ivory, no readable text in generated assets).
