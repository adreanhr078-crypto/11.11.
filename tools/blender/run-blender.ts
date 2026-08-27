/**
 * tools/blender/run-blender.ts
 *
 * TypeScript wrapper to invoke Blender headless commands from the agent.
 * This does NOT install Blender; it only constructs and runs the command
 * when Blender is available on PATH.
 *
 * Run from repo root:
 *   npx tsx tools/blender/run-blender.ts -- export-gltf --blend scene.blend --output model.glb
 *   npx tsx tools/blender/run-blender.ts -- render-cinematic --blend scene.blend --output-dir ./frames --start 1 --end 120 --fps 24
 */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

type Args = {
  blenderPath?: string;
  blend?: string;
  output?: string;
  collection?: string;
  'output-dir'?: string;
  start?: string;
  end?: string;
  fps?: string;
};

function detectBlender(): string {
  const candidates = ['blender', 'blender.exe'];
  for (const cmd of candidates) {
    if (process.platform === 'win32' && cmd === 'blender') continue;
    return cmd;
  }
  return 'blender';
}

function spawnBlender(args: string[]): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const blender = detectBlender();
    const child = spawn(blender, ['--background', ...args], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

function main(): void {
  const raw = process.argv.slice(2);
  if (raw.length === 0 || raw[0] !== '--') {
    console.error('Usage: run-blender.ts -- <subcommand> [args]');
    process.exit(1);
  }
  const args = raw.slice(1) as string[];
  const flags: Args = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const key = a.slice(2) as keyof Args;
      const next = args[i + 1];
      flags[key] = next && !next.startsWith('--') ? next : 'true';
      if (next && !next.startsWith('--')) i++;
    }
  }

  const blendFile = flags.blend;
  if (!blendFile || !existsSync(blendFile)) {
    console.error(`Blend file not found: ${blendFile}`);
    process.exit(1);
  }

  const script =
    args[0] === 'export-gltf'
      ? 'tools/blender/export_glb.py'
      : 'tools/blender/render_cinematic.py';

  const blenderArgs = [blendFile, '--python', script];
  if (args[0] === 'export-gltf') {
    if (flags.output) blenderArgs.push('--', '--output', flags.output);
    if (flags.collection) blenderArgs.push('--', '--collection', flags.collection);
  } else if (args[0] === 'render-cinematic') {
    if (flags['output-dir']) blenderArgs.push('--', '--output-dir', flags['output-dir']);
    if (flags.start) blenderArgs.push('--', '--start', flags.start);
    if (flags.end) blenderArgs.push('--', '--end', flags.end);
    if (flags.fps) blenderArgs.push('--', '--fps', flags.fps);
  } else {
    console.error(`Unknown subcommand: ${args[0]}. Use export-gltf or render-cinematic.`);
    process.exit(1);
  }

  spawnBlender(blenderArgs).then((res) => {
    if (res.stdout) console.log(res.stdout);
    if (res.stderr) console.error(res.stderr);
    process.exit(res.code ?? 0);
  });
}

main();
