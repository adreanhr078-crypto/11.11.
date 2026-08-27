/**
 * tools/media/validate-assets.ts
 *
 * Lightweight media validators for the 11.11 asset pipeline.
 * Run from repo root:
 *   npx tsx tools/media/validate-assets.ts
 *
 * This tool does not modify files. It reports PASS/FAIL/UNVERIFIED
 * for each checked asset category.
 */

import { statSync, readdirSync, existsSync } from 'node:fs';
import { join, extname, basename } from 'node:path';

const PUBLIC_ASSETS = join(process.cwd(), 'artifacts', 'eleven-eleven', 'public', 'assets');

const MAX_CINEMATIC_MP4_MB = 10;
const MAX_UI_IMAGE_MB = 2.5;
const ALLOWED_IMAGE_EXTS = new Set(['.webp', '.png', '.jpg', '.jpeg']);
const ALLOWED_VIDEO_EXTS = new Set(['.mp4', '.webm']);
const ALLOWED_AUDIO_EXTS = new Set(['.mp3', '.ogg', '.wav', '.flac', '.aac']);

function mb(sizeBytes: number): number {
  return sizeBytes / (1024 * 1024);
}

function walk(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir, { withFileTypes: true, recursive: true })) {
    // Node <20 may not support recursive; fallback to manual walk if needed.
    // For simplicity, we use a single-level + manual recursion here.
  }
  // Manual recursive walk for compatibility:
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full, acc);
      } else {
        acc.push(full);
      }
    }
  } catch {
    // ignore unreadable dirs
  }
  return acc;
}

function checkImages(): { pass: number; fail: number; unverified: number; notes: string[] } {
  let pass = 0, fail = 0, unverified = 0;
  const notes: string[] = [];
  const dir = join(PUBLIC_ASSETS, 'ui');
  if (!existsSync(dir)) {
    notes.push('UNVERIFIED: public/assets/ui/ does not exist yet.');
    return { pass, fail, unverified: 1, notes };
  }
  for (const file of walk(dir)) {
    const ext = extname(file).toLowerCase();
    if (!ALLOWED_IMAGE_EXTS.has(ext)) continue;
    const size = statSync(file).size;
    if (mb(size) > MAX_UI_IMAGE_MB) {
      notes.push(`FAIL: ${basename(file)} is ${mb(size).toFixed(2)} MB (budget ${MAX_UI_IMAGE_MB} MB)`);
      fail++;
    } else {
      pass++;
    }
  }
  return { pass, fail, unverified, notes };
}

function checkCinematicVideo(): { pass: number; fail: number; unverified: number; notes: string[] } {
  let pass = 0, fail = 0, unverified = 0;
  const notes: string[] = [];
  const dir = join(PUBLIC_ASSETS, 'cinematics');
  if (!existsSync(dir)) {
    notes.push('UNVERIFIED: public/assets/cinematics/ does not exist yet.');
    return { pass, fail, unverified: 1, notes };
  }
  for (const file of walk(dir)) {
    const ext = extname(file).toLowerCase();
    if (!ALLOWED_VIDEO_EXTS.has(ext)) continue;
    const size = statSync(file).size;
    if (mb(size) > MAX_CINEMATIC_MP4_MB) {
      notes.push(`FAIL: ${basename(file)} is ${mb(size).toFixed(2)} MB (budget ${MAX_CINEMATIC_MP4_MB} MB)`);
      fail++;
    } else {
      pass++;
    }
  }
  return { pass, fail, unverified, notes };
}

function checkSkills(): { pass: number; fail: number; unverified: number; notes: string[] } {
  let pass = 0, fail = 0, unverified = 0;
  const notes: string[] = [];
  const required = [
    '.agents/skills/11-11-ui/SKILL.md',
    '.agents/skills/11.11-autonomous-quality-gate/SKILL.md',
    '.agents/skills/11.11-player-experience-loop/SKILL.md',
    '.agents/skills/11-11-chess/SKILL.md',
    '.agents/skills/11-11-puzzles/SKILL.md',
    '.agents/skills/11-11-audio/SKILL.md',
    '.agents/skills/11-11-cinematic-assets/SKILL.md',
    '.agents/skills/11-11-image-generation/SKILL.md',
    '.agents/skills/11-11-free-media-tools/SKILL.md',
    '.kilo/skills/11-11-chess/SKILL.md',
    '.kilo/skills/11-11-puzzles/SKILL.md',
    '.kilo/skills/11-11-audio/SKILL.md',
    '.kilo/skills/11-11-cinematic-assets/SKILL.md',
    '.kilo/skills/11-11-image-generation/SKILL.md',
    '.kilo/skills/11-11-free-media-tools/SKILL.md',
  ];
  for (const rel of required) {
    const full = join(process.cwd(), rel);
    if (existsSync(full)) {
      pass++;
    } else {
      notes.push(`FAIL: missing skill ${rel}`);
      fail++;
    }
  }
  return { pass, fail, unverified, notes };
}

function main(): void {
  const results = {
    images: checkImages(),
    cinematicVideo: checkCinematicVideo(),
    skills: checkSkills(),
  };

  console.log('\n=== 11.11 Media Environment Validation ===\n');
  for (const [key, res] of Object.entries(results)) {
    console.log(`[${key}] pass=${res.pass} fail=${res.fail} unverified=${res.unverified}`);
    for (const note of res.notes) console.log(`  ${note}`);
  }

  const totalFail = Object.values(results).reduce((s, r) => s + r.fail, 0);
  const totalUnverified = Object.values(results).reduce((s, r) => s + r.unverified, 0);
  console.log(`\nTotal fail=${totalFail} unverified=${totalUnverified}`);
  if (totalFail > 0) {
    console.log('RESULT: FAIL');
    process.exitCode = 1;
  } else if (totalUnverified > 0) {
    console.log('RESULT: UNVERIFIED');
  } else {
    console.log('RESULT: PASS');
  }
}

main();
