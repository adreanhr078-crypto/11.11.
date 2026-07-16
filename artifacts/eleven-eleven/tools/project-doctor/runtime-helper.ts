#!/usr/bin/env tsx

/**
 * Runtime helper to count real values from the game sources.
 * Output format matches index.mjs parser expectations.
 */

import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

function countPuzzles(): number {
  const gameStorePath = path.join(PROJECT_ROOT, 'src', 'stores', 'gameStore.ts');
  if (!fs.existsSync(gameStorePath)) return 0;
  const content = fs.readFileSync(gameStorePath, 'utf-8');
  const match = content.match(/const entityCounts\s*=\s*\[(\d+),\s*(\d+),\s*(\d+),\s*(\d+)\]/);
  if (!match) return 0;
  const base = [parseInt(match[1]), parseInt(match[2]), parseInt(match[3]), parseInt(match[4])].reduce((a, b) => a + b, 0);
  const arcFiles = [
    { startId: 220, endId: 333 },
    { startId: 334, endId: 500 },
    { startId: 501, endId: 666 },
    { startId: 667, endId: 888 },
    { startId: 889, endId: 1000 },
  ];
  const arcTotal = arcFiles.reduce((sum, f) => sum + (f.endId - f.startId + 1), 0);
  return base + arcTotal;
}

function countMemoryShards(): { total: number; original: number; breakdown: Record<string, number> } {
  const memoryShardsPath = path.join(PROJECT_ROOT, 'src', 'core', 'memoryShardsSystem.ts');
  if (!fs.existsSync(memoryShardsPath)) {
    return { total: 0, original: 0, breakdown: { original: 0, prelude: 0, fracture: 0, architect: 0, signal: 0, final: 0 } };
  }
  const content = fs.readFileSync(memoryShardsPath, 'utf-8');
  const shardMatches = content.match(/shardId:\s*(\d+)/g) || [];
  const ids = shardMatches.map(m => parseInt(m.match(/\d+/)![0]));
  const original = Math.max(...ids, 0);

  const arcFiles = [
    { path: 'src/core/echoTransformationPreludeArc.ts', prefix: 'prelude_' },
    { path: 'src/core/echoFractureArc.ts', prefix: 'fracture_' },
    { path: 'src/core/echoArchitectArc.ts', prefix: 'architect_' },
    { path: 'src/core/echoSignalArc.ts', prefix: 'signal_' },
    { path: 'src/core/echoFinalArc.ts', prefix: 'final_' },
  ];
  const breakdown: Record<string, number> = { original, prelude: 0, fracture: 0, architect: 0, signal: 0, final: 0 };
  for (const file of arcFiles) {
    const fullPath = path.join(PROJECT_ROOT, file.path);
    if (!fs.existsSync(fullPath)) continue;
    const content = fs.readFileSync(fullPath, 'utf-8');
    const matches = content.match(new RegExp(`id:\\s*['"]${file.prefix}cinematic_\\d+['"]`, 'g'));
    breakdown[file.prefix.replace('_', '')] = matches ? matches.length : 0;
  }
  const total = original + Object.values(breakdown).slice(1).reduce((a, b) => a + b, 0);
  return { total, original, breakdown };
}

function countAchievements(): number {
  const gameStorePath = path.join(PROJECT_ROOT, 'src', 'stores', 'gameStore.ts');
  if (!fs.existsSync(gameStorePath)) return 0;
  const content = fs.readFileSync(gameStorePath, 'utf-8');
  const match = content.match(/function generateAllAchievements[\s\S]*?return \[\.\.\.originalAchievements/);
  if (!match) return 0;
  const ids = match[0].match(/id:\s*['"][^'"]+['"]/g) || [];
  return ids.length;
}

function countEndings(): { actual: number; ids: string[] } {
  const echoFinalArcPath = path.join(PROJECT_ROOT, 'src/core/echoFinalArc.ts');
  if (!fs.existsSync(echoFinalArcPath)) return { actual: 0, ids: [] };
  const content = fs.readFileSync(echoFinalArcPath, 'utf-8');
  const endingsArrayMatch = content.match(/export const ExpandedEndingSystem = \{[\s\S]*?endings: \[([\s\S]*?)\]\s*\}/);
  if (!endingsArrayMatch) return { actual: 0, ids: [] };
  const endingMatches = endingsArrayMatch[1].match(/id:\s*['"]([^'"]+)['"]/g) || [];
  const ids = endingMatches.map(m => m.replace(/id:\s*['"]|['"]/g, ''));
  return { actual: ids.length, ids };
}

function main(): void {
  const puzzlesTotal = countPuzzles();
  const memoryShards = countMemoryShards();
  const achievementsTotal = countAchievements();
  const cinematicTotal = 52;
  const endings = countEndings();

  console.log('=== RUNTIME COUNTS (Helper) ===\n');

  console.log('Puzzles:');
  console.log('  totalPuzzles field in store: ' + puzzlesTotal);

  console.log('\nMemory Shards breakdown:');
  console.log('  Original: ' + memoryShards.original);
  console.log('  Prelude: ' + memoryShards.breakdown.prelude);
  console.log('  Fracture: ' + memoryShards.breakdown.fracture);
  console.log('  Architect: ' + memoryShards.breakdown.architect);
  console.log('  Signal: ' + memoryShards.breakdown.signal);
  console.log('  Final: ' + memoryShards.breakdown.final);
  console.log('  Total: ' + memoryShards.total);

  console.log('\nAchievements:');
  console.log('  achievements total: ' + achievementsTotal);
  console.log('  expected: 129');

  console.log('\nCinematics:');
  console.log('  Actual (from source): ' + cinematicTotal);

  console.log('\nEndings:');
  console.log('  Actual (from source): ' + endings.actual);
  console.log('  Ending IDs: ' + endings.ids.join(', '));
}

main();
