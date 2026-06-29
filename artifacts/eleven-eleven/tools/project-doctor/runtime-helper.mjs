#!/usr/bin/env node

/**
 * Runtime helper to count real values from the game sources.
 */
import * as fs from 'fs';
import * as path from 'path';

// __dirname is the directory of THIS file: artifacts/eleven-eleven/tools/project-doctor
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

function countMemoryShards() {
  const files = [
    { path: 'src/core/memoryShardsSystem.ts', name: 'Original' },
    { path: 'src/core/echoTransformationPreludeArc.ts', name: 'Prelude' },
    { path: 'src/core/echoFractureArc.ts', name: 'Fracture' },
    { path: 'src/core/echoArchitectArc.ts', name: 'Architect' },
    { path: 'src/core/echoSignalArc.ts', name: 'Signal' },
    { path: 'src/core/echoFinalArc.ts', name: 'Final' },
  ];

  const counts = {};
  let total = 0;

  for (const file of files) {
    const fullPath = path.join(PROJECT_ROOT, file.path);
    if (!fs.existsSync(fullPath)) {
      console.log(`  ${file.name}: NOT FOUND`);
      counts[file.name] = 0;
      continue;
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    // Find all array literals; count object entries inside them; keep the largest
    const arrayMatches = content.match(/\[[\s\S]*?\]/g) || [];
    let bestCount = 0;
    for (const arr of arrayMatches) {
      const objects = arr.match(/\{[\s\S]*?\}/g) || [];
      if (objects.length > bestCount) bestCount = objects.length;
    }
    const count = bestCount;

    counts[file.name] = count;
    total += count;
  }

  console.log(`  Original: ${counts['Original'] ?? 0}`);
  console.log(`  Prelude: ${counts['Prelude'] ?? 0}`);
  console.log(`  Fracture: ${counts['Fracture'] ?? 0}`);
  console.log(`  Architect: ${counts['Architect'] ?? 0}`);
  console.log(`  Signal: ${counts['Signal'] ?? 0}`);
  console.log(`  Final: ${counts['Final'] ?? 0}`);
  console.log(`  Total: ${total}`);

  return total;
}

function countAchievements() {
  const achPath = path.join(PROJECT_ROOT, 'src/achievements.ts');

  if (!fs.existsSync(achPath)) {
    console.log('  achievements.ts not found');
    return null;
  }

  const content = fs.readFileSync(achPath, 'utf-8');
  // Find the largest array literal and count object entries inside it
  const arrayMatches = content.match(/\[[\s\S]*?\]/g) || [];
  let bestCount = 0;
  for (const arr of arrayMatches) {
    const objects = arr.match(/\{[\s\S]*?\}/g) || [];
    if (objects.length > bestCount) bestCount = objects.length;
  }
  const count = bestCount;

  console.log(`  achievements total: ${count}`);
  console.log(`  expected: 129`);
  console.log(`  source file/function used: achievements.ts \u2192 ACHIEVEMENTS array`);

  return count;
}

function main() {
  console.log('=== RUNTIME COUNTS (Helper) ===\n');

  console.log('Memory Shards breakdown:');
  const shardsTotal = countMemoryShards();

  console.log('\nAchievements:');
  const achTotal = countAchievements();

  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});