import { existsSync, readdirSync, type Dirent } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';

function findExecutables(root: string, depth = 4): string[] {
  if (depth < 0 || !existsSync(root)) return [];
  const matches: string[] = [];
  let entries: Dirent[];
  try {
    entries = readdirSync(root, { withFileTypes: true });
  } catch {
    return matches;
  }
  for (const entry of entries) {
    const entryPath = join(root, entry.name);
    if (entry.isFile() && entry.name.toLowerCase() === 'blender.exe') {
      matches.push(entryPath);
    } else if (entry.isDirectory()) {
      matches.push(...findExecutables(entryPath, depth - 1));
    }
  }
  return matches;
}

function discoverWindowsCandidates(): string[] {
  const roots = [
    'C:\\Tools',
    process.env.ProgramFiles ? join(process.env.ProgramFiles, 'Blender Foundation') : undefined,
  ].filter(
    (root): root is string => Boolean(root),
  );
  return roots.flatMap((root) => findExecutables(root));
}

function resolveBlenderExecutable(): string {
  const configured = process.env.BLENDER_EXE?.trim();
  const candidates = [
    configured,
    ...(process.platform === 'win32' ? discoverWindowsCandidates() : []),
    process.platform === 'win32' ? 'blender.exe' : 'blender',
  ].filter((candidate): candidate is string => Boolean(candidate));

  for (const candidate of candidates) {
    if (candidate === 'blender' || candidate === 'blender.exe' || existsSync(candidate)) {
      const probe = spawnSync(candidate, ['--version'], {
        encoding: 'utf8',
        windowsHide: true,
      });
      if (!probe.error && probe.status === 0) return candidate;
    }
  }

  throw new Error(
    'Blender CLI was not found. Set BLENDER_EXE to a stable x64 blender executable.',
  );
}

function takeOption(args: string[], name: string, required = true): string | undefined {
  const index = args.indexOf(name);
  if (index === -1 || !args[index + 1]) {
    if (required) throw new Error(`Missing required option: ${name}`);
    return undefined;
  }
  return args[index + 1];
}

function invokeBlender(blender: string, args: string[]): never {
  const result = spawnSync(blender, args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
    windowsHide: true,
  });

  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}

const [command, ...args] = process.argv.slice(2);
const blender = resolveBlenderExecutable();

switch (command) {
  case 'doctor':
    invokeBlender(blender, [
      '--background',
      '--factory-startup',
      '--python-exit-code',
      '1',
      '--python-expr',
      "import bpy,sys; print('BLENDER_DOCTOR_OK=' + bpy.app.version_string); print('PYTHON=' + sys.version.split()[0])",
    ]);

  case 'run-python': {
    const script = resolve(takeOption(args, '--script')!);
    if (!existsSync(script)) throw new Error(`Blender Python script not found: ${script}`);
    const separator = args.indexOf('--');
    const scriptArgs = separator === -1 ? [] : args.slice(separator + 1);
    invokeBlender(blender, [
      '--background',
      '--factory-startup',
      '--python-exit-code',
      '1',
      '--python',
      script,
      ...(scriptArgs.length > 0 ? ['--', ...scriptArgs] : []),
    ]);
  }

  case 'export-gltf': {
    const blend = resolve(takeOption(args, '--blend')!);
    const output = resolve(takeOption(args, '--output')!);
    const collection = takeOption(args, '--collection', false);
    if (!existsSync(blend)) throw new Error(`Blend file not found: ${blend}`);
    const script = resolve('tools/blender/export_glb.py');
    invokeBlender(blender, [
      '--background',
      blend,
      '--python-exit-code',
      '1',
      '--python',
      script,
      '--',
      '--output',
      output,
      ...(collection ? ['--collection', collection] : []),
    ]);
  }

  case 'render-cinematic': {
    const blend = resolve(takeOption(args, '--blend')!);
    const outputDir = resolve(takeOption(args, '--output-dir')!);
    const start = takeOption(args, '--start')!;
    const end = takeOption(args, '--end')!;
    const fps = takeOption(args, '--fps')!;
    if (!existsSync(blend)) throw new Error(`Blend file not found: ${blend}`);
    const script = resolve('tools/blender/render_cinematic.py');
    invokeBlender(blender, [
      '--background',
      blend,
      '--python-exit-code',
      '1',
      '--python',
      script,
      '--',
      '--output-dir',
      outputDir,
      '--start',
      start,
      '--end',
      end,
      '--fps',
      fps,
    ]);
  }

  default:
    throw new Error(
      'Usage: run-blender.ts <doctor|run-python|export-gltf|render-cinematic> [options]',
    );
}
