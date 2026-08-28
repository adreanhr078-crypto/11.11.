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
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { readConfiguredPath } from '../environment-setup/tool-resolution';

type Args = {
  blend?: string;
  output?: string;
  collection?: string;
  'output-dir'?: string;
  start?: string;
  end?: string;
  fps?: string;
  script?: string;
};

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

function detectBlender(): string {
  const configured = readConfiguredPath('BLENDER_EXE');
  if (configured) {
    if (!existsSync(configured)) {
      throw new Error(`BLENDER_EXE does not exist: ${configured}`);
    }
    return configured;
  }
  return process.platform === 'win32' ? 'blender.exe' : 'blender';
}

function spawnBlender(args: string[]): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((settle) => {
    let blender: string;
    try {
      blender = detectBlender();
    } catch (error) {
      settle({ code: 1, stdout: '', stderr: error instanceof Error ? error.message : String(error) });
      return;
    }
    const child = spawn(blender, ['--background', '--python-exit-code', '1', ...args], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: false,
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('error', (error) => settle({ code: 1, stdout, stderr: `${stderr}${error.message}` }));
    child.on('close', (code) => settle({ code, stdout, stderr }));
  });
}

function requirePositiveInteger(value: string | undefined, flag: string): string | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${flag} must be a positive integer.`);
  }
  return String(parsed);
}

function main(): void {
  const raw = process.argv.slice(2);
  if (raw.length === 0 || raw[0] !== '--') {
    console.error('Usage: run-blender.ts -- <subcommand> [args]');
    process.exit(1);
  }
  const args = raw.slice(1) as string[];
  const command = args[0];

  if (command === 'doctor') {
    spawnBlender(['--version']).then((res) => {
      if (res.stdout) console.log(res.stdout);
      if (res.stderr) console.error(res.stderr);
      process.exit(res.code ?? 1);
    });
    return;
  }

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

  if (command === 'run-python') {
    const scriptPath = flags.script ? resolve(REPO_ROOT, flags.script) : '';
    if (!scriptPath || !existsSync(scriptPath)) {
      console.error(`Blender Python script not found: ${flags.script}`);
      process.exit(1);
    }
    const passthroughIndex = args.indexOf('--');
    const passthrough = passthroughIndex >= 0 ? args.slice(passthroughIndex + 1) : [];
    spawnBlender(['--factory-startup', '--python', scriptPath, '--', ...passthrough]).then((res) => {
      if (res.stdout) console.log(res.stdout);
      if (res.stderr) console.error(res.stderr);
      process.exit(res.code ?? 1);
    });
    return;
  }

  const blendFile = flags.blend ? resolve(REPO_ROOT, flags.blend) : '';
  if (!blendFile || !existsSync(blendFile)) {
    console.error(`Blend file not found: ${blendFile}`);
    process.exit(1);
  }

  const script =
    command === 'export-gltf'
      ? resolve(REPO_ROOT, 'tools/blender/export_glb.py')
      : resolve(REPO_ROOT, 'tools/blender/render_cinematic.py');

  const blenderArgs = [blendFile, '--python', script];
  if (command === 'export-gltf') {
    if (!flags.output) {
      console.error('--output is required for export-gltf.');
      process.exit(1);
    }
    blenderArgs.push('--', '--output', resolve(REPO_ROOT, flags.output));
    if (flags.collection) blenderArgs.push('--', '--collection', flags.collection);
  } else if (command === 'render-cinematic') {
    if (!flags['output-dir']) {
      console.error('--output-dir is required for render-cinematic.');
      process.exit(1);
    }
    try {
      const start = requirePositiveInteger(flags.start, '--start');
      const end = requirePositiveInteger(flags.end, '--end');
      const fps = requirePositiveInteger(flags.fps, '--fps');
      blenderArgs.push('--', '--output-dir', resolve(REPO_ROOT, flags['output-dir']));
      if (start) blenderArgs.push('--start', start);
      if (end) blenderArgs.push('--end', end);
      if (fps) blenderArgs.push('--fps', fps);
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  } else {
    console.error(`Unknown subcommand: ${command}. Use doctor, run-python, export-gltf, or render-cinematic.`);
    process.exit(1);
  }

  spawnBlender(blenderArgs).then((res) => {
    if (res.stdout) console.log(res.stdout);
    if (res.stderr) console.error(res.stderr);
    process.exit(res.code ?? 0);
  });
}

main();
