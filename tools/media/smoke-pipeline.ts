import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const REPO_ROOT = resolve(import.meta.dirname, '..', '..');
const OUTPUT_ROOT = join(REPO_ROOT, 'artifacts', 'eleven-eleven', '.tmp', 'media-smoke');
const BLEND = join(OUTPUT_ROOT, 'smoke.blend');
const RAW_GLB = join(OUTPUT_ROOT, 'smoke.raw.glb');
const OPTIMIZED_GLB = join(OUTPUT_ROOT, 'smoke.optimized.glb');
const FRAMES = join(OUTPUT_ROOT, 'frames');
const VIDEO = join(OUTPUT_ROOT, 'smoke.webm');
const POSTER = join(OUTPUT_ROOT, 'smoke-poster.webp');

function run(label: string, script: string, args: string[], timeout = 10 * 60_000): void {
  console.log(`\n[${label}]`);
  const tsxCli = join(REPO_ROOT, 'node_modules', 'tsx', 'dist', 'cli.mjs');
  const result = spawnSync(process.execPath, [tsxCli, script, '--', ...args], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    timeout,
    windowsHide: true,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with exit code ${result.status ?? 'unknown'}.`);
}

function assertOutput(path: string, minimumBytes = 1): void {
  if (!existsSync(path)) throw new Error(`Expected output is missing: ${path}`);
  if (statSync(path).size < minimumBytes) throw new Error(`Expected output is unexpectedly small: ${path}`);
}

function main(): void {
  run('Blender scene creation', 'tools/blender/run-blender.ts', [
    'run-python', '--script', 'tools/blender/create_smoke_scene.py', '--',
    '--output', 'artifacts/eleven-eleven/.tmp/media-smoke/smoke.blend',
  ]);
  assertOutput(BLEND, 1024);

  run('Raw GLB export', 'tools/blender/run-blender.ts', [
    'export-gltf', '--blend', 'artifacts/eleven-eleven/.tmp/media-smoke/smoke.blend',
    '--output', 'artifacts/eleven-eleven/.tmp/media-smoke/smoke.raw.glb',
  ]);
  assertOutput(RAW_GLB, 1024);

  run('Raw GLB validation', 'tools/media/validate-glb.ts', ['--input', RAW_GLB, '--strict']);
  run('GLB optimization', 'tools/media/optimize-glb.ts', [
    '--input', RAW_GLB,
    '--output', OPTIMIZED_GLB,
    '--profile', 'character',
    '--texture-mode', 'ktx2',
    '--force',
  ]);
  assertOutput(OPTIMIZED_GLB, 1024);
  run('Optimized GLB validation', 'tools/media/validate-glb.ts', ['--input', OPTIMIZED_GLB, '--strict']);
  run('Blender GLB re-import', 'tools/blender/run-blender.ts', [
    'run-python', '--script', 'tools/blender/validate_glb_reimport.py', '--', '--input', OPTIMIZED_GLB,
  ]);

  run('Cinematic frame render', 'tools/blender/run-blender.ts', [
    'render-cinematic', '--blend', 'artifacts/eleven-eleven/.tmp/media-smoke/smoke.blend',
    '--output-dir', 'artifacts/eleven-eleven/.tmp/media-smoke/frames',
    '--start', '1', '--end', '12', '--fps', '12',
  ], 15 * 60_000);
  const frameCount = existsSync(FRAMES)
    ? readdirSync(FRAMES).filter((file) => /^frame_\d{4}\.png$/i.test(file)).length
    : 0;
  if (frameCount !== 12) throw new Error(`Expected exactly 12 rendered frames, found ${frameCount}.`);

  run('Cinematic encoding', 'tools/media/encode-cinematic.ts', [
    '--input', join(FRAMES, 'frame_%04d.png'),
    '--output', VIDEO,
    '--poster', POSTER,
    '--fps', '12',
    '--force',
  ]);
  assertOutput(VIDEO, 1024);
  assertOutput(POSTER, 1024);

  console.log(JSON.stringify({
    status: 'PASS',
    purpose: 'Non-Canon portable media toolchain smoke test',
    outputs: {
      blend: BLEND,
      rawGlb: RAW_GLB,
      optimizedGlb: OPTIMIZED_GLB,
      renderedFrames: frameCount,
      video: VIDEO,
      poster: POSTER,
    },
  }, null, 2));
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
}
