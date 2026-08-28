import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import sharp from 'sharp';

import { readConfiguredPath } from '../environment-setup/tool-resolution';
import budgets from './asset-budgets.json';
import { validateGlb } from './validate-glb';

type AssetResult = {
  asset: string;
  kind: 'image' | 'video' | 'audio' | 'glb';
  status: 'PASS' | 'FAIL';
  bytes: number;
  details: Record<string, unknown>;
  failures: string[];
};

type Probe = {
  streams?: Array<{
    codec_type?: string;
    codec_name?: string;
    width?: number;
    height?: number;
  }>;
  format?: { duration?: string; size?: string; format_name?: string };
};

const REPO_ROOT = resolve(import.meta.dirname, '..', '..');
const PUBLIC_ASSETS = join(REPO_ROOT, 'artifacts', 'eleven-eleven', 'public', 'assets');
const IMAGE_EXTENSIONS = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.webp']);
const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm']);
const AUDIO_EXTENSIONS = new Set(['.aac', '.flac', '.m4a', '.mp3', '.ogg', '.opus', '.wav']);

function walk(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function displayPath(path: string): string {
  return relative(REPO_ROOT, path).replaceAll('\\', '/');
}

function ffprobe(path: string): Probe {
  const executable = readConfiguredPath('FFPROBE_EXE') ?? (process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe');
  const result = spawnSync(executable, [
    '-v', 'error',
    '-show_streams',
    '-show_format',
    '-of', 'json',
    path,
  ], { encoding: 'utf8', timeout: 30_000, windowsHide: true });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `ffprobe exited with ${result.status ?? 'unknown'}`);
  }
  return JSON.parse(result.stdout) as Probe;
}

async function checkImage(path: string): Promise<AssetResult> {
  const bytes = statSync(path).size;
  const failures: string[] = [];
  let details: Record<string, unknown> = {};
  try {
    const metadata = await sharp(path, { animated: true }).metadata();
    details = {
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      pages: metadata.pages ?? 1,
      space: metadata.space,
      hasAlpha: metadata.hasAlpha,
    };
    if (!metadata.width || !metadata.height) failures.push('Image decoder returned no dimensions.');
    if ((metadata.width ?? 0) > budgets.images.maxDimension || (metadata.height ?? 0) > budgets.images.maxDimension) {
      failures.push(`Dimensions ${metadata.width}x${metadata.height} exceed ${budgets.images.maxDimension}px.`);
    }
  } catch (error) {
    failures.push(`Sharp decode failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (bytes > budgets.images.maxBytes) failures.push(`File size ${bytes} exceeds ${budgets.images.maxBytes} bytes.`);
  return { asset: displayPath(path), kind: 'image', status: failures.length ? 'FAIL' : 'PASS', bytes, details, failures };
}

function checkMedia(path: string, kind: 'video' | 'audio'): AssetResult {
  const bytes = statSync(path).size;
  const failures: string[] = [];
  let details: Record<string, unknown> = {};
  try {
    const probe = ffprobe(path);
    const video = probe.streams?.find((stream) => stream.codec_type === 'video');
    const audio = probe.streams?.find((stream) => stream.codec_type === 'audio');
    details = {
      format: probe.format?.format_name,
      durationSeconds: Number(probe.format?.duration ?? 0),
      videoCodec: video?.codec_name,
      audioCodec: audio?.codec_name,
      width: video?.width,
      height: video?.height,
    };
    if (kind === 'video') {
      if (!video?.codec_name) failures.push('No video stream.');
      if (video?.codec_name && !budgets.cinematics.allowedVideoCodecs.includes(video.codec_name)) failures.push(`Video codec ${video.codec_name} is not approved.`);
      if ((video?.width ?? 0) > budgets.cinematics.maxWidth || (video?.height ?? 0) > budgets.cinematics.maxHeight) {
        failures.push(`Dimensions ${video?.width}x${video?.height} exceed the cinematic budget.`);
      }
      if (audio?.codec_name && !budgets.cinematics.allowedAudioCodecs.includes(audio.codec_name)) failures.push(`Audio codec ${audio.codec_name} is not approved for cinematics.`);
      if (bytes > budgets.cinematics.maxBytes) failures.push(`File size ${bytes} exceeds ${budgets.cinematics.maxBytes} bytes.`);
    } else {
      if (!audio?.codec_name) failures.push('No audio stream.');
      if (audio?.codec_name && !budgets.audio.allowedCodecs.includes(audio.codec_name)) failures.push(`Audio codec ${audio.codec_name} is not approved.`);
      if (bytes > budgets.audio.maxBytes) failures.push(`File size ${bytes} exceeds ${budgets.audio.maxBytes} bytes.`);
    }
  } catch (error) {
    failures.push(`ffprobe failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  return { asset: displayPath(path), kind, status: failures.length ? 'FAIL' : 'PASS', bytes, details, failures };
}

async function checkGlb(path: string): Promise<AssetResult> {
  const report = await validateGlb(path, true);
  const failures = (report.failures as string[] | undefined) ?? [];
  return {
    asset: displayPath(path),
    kind: 'glb',
    status: report.status === 'PASS' ? 'PASS' : 'FAIL',
    bytes: statSync(path).size,
    details: report,
    failures,
  };
}

export async function validatePublicAssets(): Promise<AssetResult[]> {
  if (!existsSync(PUBLIC_ASSETS)) throw new Error(`Missing public asset root: ${PUBLIC_ASSETS}`);
  const results: AssetResult[] = [];
  for (const path of walk(PUBLIC_ASSETS).sort()) {
    const extension = extname(path).toLowerCase();
    if (IMAGE_EXTENSIONS.has(extension)) results.push(await checkImage(path));
    else if (VIDEO_EXTENSIONS.has(extension)) results.push(checkMedia(path, 'video'));
    else if (AUDIO_EXTENSIONS.has(extension)) results.push(checkMedia(path, 'audio'));
    else if (extension === '.glb') results.push(await checkGlb(path));
  }
  return results;
}

async function main(): Promise<void> {
  const results = await validatePublicAssets();
  const failures = results.filter((result) => result.status === 'FAIL');
  const counts = results.reduce<Record<string, number>>((accumulator, result) => {
    accumulator[result.kind] = (accumulator[result.kind] ?? 0) + 1;
    return accumulator;
  }, {});
  console.log(JSON.stringify({
    status: failures.length ? 'FAIL' : 'PASS',
    root: displayPath(PUBLIC_ASSETS),
    checked: results.length,
    counts,
    failures,
  }, null, 2));
  if (failures.length) process.exitCode = 1;
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : '';
if (import.meta.url === invokedPath) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exitCode = 1;
  });
}
