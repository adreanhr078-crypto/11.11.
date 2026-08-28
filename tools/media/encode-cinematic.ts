import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, renameSync, statSync, unlinkSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { readConfiguredPath } from '../environment-setup/tool-resolution';
import budgets from './asset-budgets.json';

type Arguments = {
  input?: string;
  output?: string;
  poster?: string;
  fps: number;
  force: boolean;
};

type Probe = {
  streams?: Array<{ codec_type?: string; codec_name?: string; width?: number; height?: number; pix_fmt?: string }>;
  format?: { duration?: string; size?: string; format_name?: string };
};

function parseArgs(): Arguments {
  const raw = process.argv.slice(2).filter((value, index) => !(value === '--' && index === 0));
  const args: Arguments = { fps: 24, force: false };
  for (let index = 0; index < raw.length; index += 1) {
    const value = raw[index];
    if (value === '--force') {
      args.force = true;
      continue;
    }
    if (value === '--input' || value === '--output' || value === '--poster' || value === '--fps') {
      const next = raw[index + 1];
      if (!next || next.startsWith('--')) throw new Error(`${value} requires a value.`);
      if (value === '--input') args.input = next;
      if (value === '--output') args.output = next;
      if (value === '--poster') args.poster = next;
      if (value === '--fps') args.fps = Number(next);
      index += 1;
    }
  }
  if (!Number.isInteger(args.fps) || args.fps <= 0 || args.fps > 120) throw new Error('--fps must be an integer from 1 to 120.');
  return args;
}

function executable(envKey: string, fallback: string): string {
  return readConfiguredPath(envKey) ?? fallback;
}

function run(command: string, args: string[], timeout = 10 * 60_000): string {
  const result = spawnSync(command, args, { encoding: 'utf8', timeout, windowsHide: true });
  if (result.status !== 0) {
    throw new Error(`${command} failed (${result.status ?? 'unknown'}):\n${result.stderr || result.stdout}`);
  }
  return result.stdout;
}

function probeMedia(path: string): Probe {
  const ffprobe = executable('FFPROBE_EXE', process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe');
  return JSON.parse(run(ffprobe, [
    '-v', 'error',
    '-show_streams',
    '-show_format',
    '-of', 'json',
    path,
  ], 30_000)) as Probe;
}

function validateProbe(path: string, probe: Probe, expectedCodec: string): void {
  const video = probe.streams?.find((stream) => stream.codec_type === 'video');
  if (!video) throw new Error('Encoded output has no video stream.');
  if (video.codec_name !== expectedCodec) throw new Error(`Expected ${expectedCodec}, found ${video.codec_name ?? 'unknown'}.`);
  if ((video.width ?? 0) > budgets.cinematics.maxWidth || (video.height ?? 0) > budgets.cinematics.maxHeight) {
    throw new Error(`Encoded dimensions ${video.width}x${video.height} exceed the cinematic budget.`);
  }
  const bytes = statSync(path).size;
  if (bytes > budgets.cinematics.maxBytes) throw new Error(`Encoded output ${bytes} bytes exceeds ${budgets.cinematics.maxBytes}.`);
}

function publish(temporary: string, output: string, force: boolean): void {
  if (existsSync(output)) {
    if (!force) throw new Error(`Output already exists; pass --force to replace it: ${output}`);
    unlinkSync(output);
  }
  renameSync(temporary, output);
}

export function encodeCinematic(): void {
  const args = parseArgs();
  if (!args.input || !args.output) {
    throw new Error('Usage: encode-cinematic.ts -- --input <frame_%04d.png> --output <clip.webm|clip.mp4> [--fps 24] [--poster poster.jpg]');
  }

  const input = resolve(args.input);
  const output = resolve(args.output);
  const extension = extname(output).toLowerCase();
  if (extension !== '.webm' && extension !== '.mp4') throw new Error('--output must end in .webm or .mp4.');
  if (existsSync(output) && !args.force) throw new Error(`Output already exists; pass --force to replace it: ${output}`);
  mkdirSync(dirname(output), { recursive: true });

  const temporary = `${output.slice(0, -extension.length)}.partial-${process.pid}-${Date.now()}${extension}`;
  const ffmpeg = executable('FFMPEG_EXE', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
  const codecArgs = extension === '.webm'
    ? ['-c:v', 'libvpx-vp9', '-crf', '30', '-b:v', '0', '-deadline', 'good', '-cpu-used', '2', '-row-mt', '1']
    : ['-c:v', 'libx264', '-preset', 'slow', '-crf', '22', '-movflags', '+faststart'];
  run(ffmpeg, [
    '-y',
    '-framerate', String(args.fps),
    '-i', input,
    ...codecArgs,
    '-pix_fmt', 'yuv420p',
    '-an',
    temporary,
  ]);

  const expectedCodec = extension === '.webm' ? 'vp9' : 'h264';
  const probe = probeMedia(temporary);
  validateProbe(temporary, probe, expectedCodec);
  publish(temporary, output, args.force);

  if (args.poster) {
    const poster = resolve(args.poster);
    const posterExtension = extname(poster).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.webp'].includes(posterExtension)) throw new Error('--poster must be JPG, PNG, or WebP.');
    if (existsSync(poster) && !args.force) throw new Error(`Poster already exists; pass --force to replace it: ${poster}`);
    mkdirSync(dirname(poster), { recursive: true });
    const posterTemporary = `${poster.slice(0, -posterExtension.length)}.partial-${process.pid}-${Date.now()}${posterExtension}`;
    run(ffmpeg, ['-y', '-ss', '0', '-i', output, '-frames:v', '1', posterTemporary], 30_000);
    publish(posterTemporary, poster, args.force);
  }

  console.log(JSON.stringify({
    status: 'PASS',
    input,
    output,
    poster: args.poster ? resolve(args.poster) : undefined,
    bytes: statSync(output).size,
    probe,
  }, null, 2));
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : '';
if (import.meta.url === invokedPath) {
  try {
    encodeCinematic();
  } catch (error) {
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exitCode = 1;
  }
}
