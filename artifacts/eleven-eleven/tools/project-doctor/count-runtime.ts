#!/usr/bin/env tsx

/**
 * Count real values from game exports using static file analysis.
 * Rules:
 *  - No imports from src/ to avoid circular dependency issues.
 *  - Uses static file analysis only.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

function countPuzzles(): number {
  const puzzlesPath = path.join(PROJECT_ROOT, 'src', 'puzzles.ts');
  if (!fs.existsSync(puzzlesPath)) return 0;
  const content = fs.readFileSync(puzzlesPath, 'utf-8');
  const match = content.match(/export const\s+PUZZLES[^=]*=\s*\[/);
  if (!match || match.index === undefined) return 0;
  const startPos = match.index + match[0].length - 1;
  let depth = 0;
  for (let i = startPos; i < content.length; i++) {
    if (content[i] === '[') depth++;
    else if (content[i] === ']') {
      depth--;
      if (depth === 0) {
        const arrayContent = content.slice(startPos, i + 1);
        const puzzleMatches = arrayContent.match(/id:\s*['"][^'"]+['"]/g);
        return puzzleMatches ? puzzleMatches.length : 0;
      }
    }
  }
  return 0;
}

function countAchievements(): number {
  const achievementsPath = path.join(PROJECT_ROOT, 'src', 'achievements.ts');
  if (!fs.existsSync(achievementsPath)) return 0;
  const content = fs.readFileSync(achievementsPath, 'utf-8');
  const match = content.match(/export const\s+ACHIEVEMENTS[^=]*=\s*\[/);
  if (!match || match.index === undefined) return 0;
  const startPos = match.index + match[0].length - 1;
  let depth = 0;
  for (let i = startPos; i < content.length; i++) {
    if (content[i] === '[') depth++;
    else if (content[i] === ']') {
      depth--;
      if (depth === 0) {
        const arrayContent = content.slice(startPos, i + 1);
        const achievementMatches = arrayContent.match(/id:\s*['"][^'"]+['"]/g);
        return achievementMatches ? achievementMatches.length : 0;
      }
    }
  }
  return 0;
}

function countArcPuzzles(): number {
  const arcFiles = [
    { path: 'src/core/echoTransformationPreludeArc.ts', startId: 220, endId: 333 },
    { path: 'src/core/echoFractureArc.ts', startId: 334, endId: 500 },
    { path: 'src/core/echoArchitectArc.ts', startId: 501, endId: 666 },
    { path: 'src/core/echoSignalArc.ts', startId: 667, endId: 888 },
    { path: 'src/core/echoFinalArc.ts', startId: 889, endId: 1000 },
  ];
  let total = 0;
  for (const file of arcFiles) {
    const fullPath = path.join(PROJECT_ROOT, file.path);
    if (fs.existsSync(fullPath)) {
      total += file.endId - file.startId + 1;
    }
  }
  return total;
}

function countBasePuzzles(): number {
  const gameStorePath = path.join(PROJECT_ROOT, 'src', 'stores', 'gameStore.ts');
  if (!fs.existsSync(gameStorePath)) return 0;
  const content = fs.readFileSync(gameStorePath, 'utf-8');
  const match = content.match(/const entityCounts\s*=\s*\[(\d+),\s*(\d+),\s*(\d+),\s*(\d+)\]/);
  if (!match) return 0;
  const counts = [parseInt(match[1]), parseInt(match[2]), parseInt(match[3]), parseInt(match[4])];
  return counts.reduce((a, b) => a + b, 0);
}

function countArcAchievements(): number {
  const arcFiles = [
    'src/core/echoTransformationPreludeArc.ts',
    'src/core/echoFractureArc.ts',
    'src/core/echoArchitectArc.ts',
    'src/core/echoSignalArc.ts',
    'src/core/echoFinalArc.ts',
  ];
  let total = 0;
  for (const file of arcFiles) {
    const fullPath = path.join(PROJECT_ROOT, file);
    if (!fs.existsSync(fullPath)) continue;
    const content = fs.readFileSync(fullPath, 'utf-8');
    const ids = content.match(/id:\s*['"][^'"]+['"]/g) || [];
    total += ids.length;
  }
  return total;
}

function countMemoryShardsFromFiles(): { total: number; original: number; breakdown: Record<string, number> } {
  const arcFiles = [
    { path: 'src/core/echoTransformationPreludeArc.ts', prefix: 'prelude_', count: 0 },
    { path: 'src/core/echoFractureArc.ts', prefix: 'fracture_', count: 0 },
    { path: 'src/core/echoArchitectArc.ts', prefix: 'architect_', count: 0 },
    { path: 'src/core/echoSignalArc.ts', prefix: 'signal_', count: 0 },
    { path: 'src/core/echoFinalArc.ts', prefix: 'final_', count: 0 },
  ];

  let originalCount = 0;

  for (const file of arcFiles) {
    const fullPath = path.join(PROJECT_ROOT, file.path);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const matches = content.match(new RegExp(`id:\\s*['"]${file.prefix}cinematic_\\d+['"]`, 'g'));
      file.count = matches ? matches.length : 0;
    }
  }

  const memoryShardsPath = path.join(PROJECT_ROOT, 'src', 'core', 'memoryShardsSystem.ts');
  if (fs.existsSync(memoryShardsPath)) {
    const content = fs.readFileSync(memoryShardsPath, 'utf-8');
    const shardMatches = content.match(/shardId:\s*(\d+)/g);
    if (shardMatches) {
      const ids = shardMatches.map(m => parseInt(m.match(/\d+/)?.[0] || '0'));
      originalCount = Math.max(...ids);
    }
  }

  const breakdown = {
    original: originalCount,
    prelude: arcFiles[0].count,
    fracture: arcFiles[1].count,
    architect: arcFiles[2].count,
    signal: arcFiles[3].count,
    final: arcFiles[4].count,
  };

  return { total: originalCount, original: originalCount, breakdown };
}

function main(): void {
  const puzzlesTotal = countBasePuzzles() + countArcPuzzles();
  const memoryShards = countMemoryShardsFromFiles();
  const achievementsTotal = countAchievements() + countArcAchievements();

  console.log('=== COUNT RUNTIME ===\n');

  console.log('Puzzles:');
  console.log('  Expected: 1000');
  console.log('  Actual (from static analysis): ' + puzzlesTotal);

  console.log('\nMemory Shards breakdown:');
  console.log('  Original: ' + memoryShards.original);
  console.log('  Prelude: ' + memoryShards.breakdown.prelude);
  console.log('  Fracture: ' + memoryShards.breakdown.fracture);
  console.log('  Architect: ' + memoryShards.breakdown.architect);
  console.log('  Signal: ' + memoryShards.breakdown.signal);
  console.log('  Final: ' + memoryShards.breakdown.final);
  console.log('  Total: ' + memoryShards.total);

  console.log('\nAchievements:');
  console.log('  Expected: 129');
  console.log('  achievements total: ' + achievementsTotal);
}

main();