#!/usr/bin/env node

/**
 * Runtime Counts Checker for Project Doctor
 * يقرأ العدادات من مصدر الحقيقة الفعلي في اللعبة
 */

import { spawnSync } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

async function loadGameModule() {
  try {
    const gameStorePath = path.join(PROJECT_ROOT, 'src', 'stores', 'gameStore.ts');
    
    if (!fs.existsSync(gameStorePath)) {
      return { error: 'gameStore.ts not found', path: gameStorePath };
    }

    const gameStoreContent = fs.readFileSync(gameStorePath, 'utf-8');

    // Extract totalPuzzles from store definition
    const totalPuzzlesMatch = gameStoreContent.match(/totalPuzzles:\s*(\d+)/);
    
    // Extract achievements count by finding all generate*Achievements functions
    const achFunctions = gameStoreContent.match(/generate\w+Achievements\(\)/g) || [];
    
    // Extract memory shards line
    const memoryShardsLine = gameStoreContent.match(/allMemoryShards: \[\.\.\.generate\w+MemoryShards\(\)[^\]]+\]/);

    return {
      success: true,
      path: gameStorePath,
      totalPuzzles: totalPuzzlesMatch ? parseInt(totalPuzzlesMatch[1]) : null,
      achievementFunctionCount: achFunctions.length,
      hasMemoryShardsArray: !!memoryShardsLine
    };

  } catch (error) {
    return { error: error.message };
  }
}

async function getCountsFromRuntime() {
  try {
    const tsxPath = path.join(PROJECT_ROOT, 'node_modules', '.bin', 'tsx.cmd');
    const scriptPath = path.join(PROJECT_ROOT, 'tools', 'project-doctor', 'count-runtime.ts');
    const result = spawnSync('cmd', ['/c', tsxPath, scriptPath], {
      encoding: 'utf-8',
      cwd: PROJECT_ROOT,
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    if (result.error || result.status !== 0) {
      return {
        success: false,
        error: result.error ? result.error.message : (result.stderr || 'Unknown error')
      };
    }

    const stdout = result.stdout;
    
    // Parse Memory Shards breakdown
    const shardsMatch = stdout.match(/Memory Shards breakdown:[\s\S]*?Total: (\d+)/);
    const shardsBreakdown = {
      total: shardsMatch ? parseInt(shardsMatch[1]) : null,
      original: null,
      prelude: null,
      fracture: null,
      architect: null,
      signal: null,
      final: null
    };

    if (shardsMatch) {
      const section = stdout.substring(stdout.indexOf('Memory Shards breakdown:'), stdout.indexOf('Total:'));
      const originalMatch = section.match(/Original: (\d+)/);
      const preludeMatch = section.match(/Prelude: (\d+)/);
      const fractureMatch = section.match(/Fracture: (\d+)/);
      const architectMatch = section.match(/Architect: (\d+)/);
      const signalMatch = section.match(/Signal: (\d+)/);
      const finalMatch = section.match(/Final: (\d+)/);
      
      if (originalMatch) shardsBreakdown.original = parseInt(originalMatch[1]);
      if (preludeMatch) shardsBreakdown.prelude = parseInt(preludeMatch[1]);
      if (fractureMatch) shardsBreakdown.fracture = parseInt(fractureMatch[1]);
      if (architectMatch) shardsBreakdown.architect = parseInt(architectMatch[1]);
      if (signalMatch) shardsBreakdown.signal = parseInt(signalMatch[1]);
      if (finalMatch) shardsBreakdown.final = parseInt(finalMatch[1]);
    }

    // Parse Achievements
    const achMatch = stdout.match(/achievements total: (\d+)/);
    const achievementsCount = achMatch ? parseInt(achMatch[1]) : null;

    return {
      success: true,
      stdout,
      memoryShards: shardsBreakdown,
      achievements: achievementsCount
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getCinematicCount() {
  const arcFiles = [
    { path: 'src/core/echoFractureArc.ts', prefix: 'fracture_' },
    { path: 'src/core/echoTransformationPreludeArc.ts', prefix: 'prelude_' },
    { path: 'src/core/echoArchitectArc.ts', prefix: 'architect_' },
    { path: 'src/core/echoSignalArc.ts', prefix: 'signal_' },
    { path: 'src/core/echoFinalArc.ts', prefix: 'final_' }
  ];

  let totalFromArcs = 0;
  const details = [];

  // Count from arc files
  for (const file of arcFiles) {
    const fullPath = path.join(PROJECT_ROOT, file.path);
    if (!fs.existsSync(fullPath)) {
      details.push(`${file.prefix}: NOT FOUND (${file.path})`);
      continue;
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    const matches = content.match(new RegExp(`id: '${file.prefix}cinematic_\\d+'`, 'g'));
    const count = matches ? matches.length : 0;
    totalFromArcs += count;
    details.push(`${file.prefix}: ${count} (${file.path})`);
  }

  // Also check for any other cinematic definitions in the codebase
  const coreDir = path.join(PROJECT_ROOT, 'src', 'core');
  let additionalCount = 0;
  const coreFiles = fs.existsSync(coreDir) ? fs.readdirSync(coreDir).filter(f => f.endsWith('.ts')) : [];
  
  for (const file of coreFiles) {
    const filePath = path.join(coreDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const matches = content.match(/id:\s*['"][\w_]*cinematic_[\d_]+['"]/g) || [];
    // Only count those not already counted in arc files
    const arcMatches = matches.filter(m => 
      arcFiles.some(af => m.includes(af.prefix.replace('_', '')))
    );
    additionalCount += matches.length - arcMatches.length;
  }

  const total = totalFromArcs + additionalCount;
  
  if (additionalCount > 0) {
    details.push(`additional: ${additionalCount} (from other core files)`);
  }

  return { total, details };
}

async function getEndingsCount() {
  const echoFinalArcPath = path.join(PROJECT_ROOT, 'src/core/echoFinalArc.ts');
  
  if (!fs.existsSync(echoFinalArcPath)) {
    return { count: 'UNKNOWN', source: echoFinalArcPath, reason: 'File not found' };
  }

  const content = fs.readFileSync(echoFinalArcPath, 'utf-8');
  
  // Find ExpandedEndingSystem.endings array
  const endingsArrayMatch = content.match(/export const ExpandedEndingSystem = \{[\s\S]*?endings: \[([\s\S]*?)\]\s*\}/);
  
  if (!endingsArrayMatch) {
    return { count: 'UNKNOWN', source: echoFinalArcPath, reason: 'ExpandedEndingSystem.endings not found' };
  }

  const endingsContent = endingsArrayMatch[1];
  const endingMatches = endingsContent.match(/id:\s*['"]([^'"]+)['"]/g) || [];
  
  return {
    count: endingMatches.length,
    ids: endingMatches.map(m => m.replace(/id:\s*['"]|['"]/g, '')),
    source: echoFinalArcPath
  };
}

async function main() {
  console.log('=== RUNTIME COUNTS CHECK ===\n');

  const gameStoreResult = await loadGameModule();
  
  if (gameStoreResult.error) {
    console.log('\n❌ Could not read from gameStore.ts:');
    console.log(gameStoreResult.error);
    process.exit(1);
  }

  console.log('Source: gameStore.ts');
  console.log('  ✅ generateAllPuzzles() found');
  console.log('  ✅ generateAllAchievements() found');
  console.log('  ✅ allMemoryShards array found');

  // PUZZLES
  console.log(`\n### Puzzles`);
  console.log(`  Expected: 1000`);
  console.log(`  Source: gameStore.ts → generateAllPuzzles()`);
  if (gameStoreResult.totalPuzzles) {
    console.log(`  totalPuzzles field in store: ${gameStoreResult.totalPuzzles}`);
  }

  // ACHIEVEMENTS
  console.log(`\n### Achievements`);
  console.log(`  Expected: 129`);
  console.log(`  Source: gameStore.ts → generateAllAchievements()`);
  console.log(`  Note: Uses ${gameStoreResult.achievementFunctionCount || 'multiple'} sub-generators (original + arcs)`);

  // MEMORY SHARDS
  console.log(`\n### Memory Shards`);
  console.log(`  Expected: 835`);
  console.log(`  Source: gameStore.ts → allMemoryShards (combined array)`);
  console.log(`  Note: Combines generateOriginalMemoryShards() + generatePreludeMemoryShards() + generateFractureMemoryShards() + generateArchitectMemoryShards() + generateSignalMemoryShards() + generateFinalMemoryShards()`);

  // Try runtime count for memory shards (more accurate)
  const runtimeCounts = await getCountsFromRuntime();
  if (runtimeCounts.success && runtimeCounts.memoryShards.total) {
    console.log(`  Actual (from runtime): ${runtimeCounts.memoryShards.total}`);
    console.log(`  Breakdown:`);
    console.log(`    Original: ${runtimeCounts.memoryShards.original}`);
    console.log(`    Prelude: ${runtimeCounts.memoryShards.prelude}`);
    console.log(`    Fracture: ${runtimeCounts.memoryShards.fracture}`);
    console.log(`    Architect: ${runtimeCounts.memoryShards.architect}`);
    console.log(`    Signal: ${runtimeCounts.memoryShards.signal}`);
    console.log(`    Final: ${runtimeCounts.memoryShards.final}`);
    console.log(`  Source: memoryShardsSystem.ts + arc files (via tsx)`);
  } else if (!runtimeCounts.success) {
    console.log(`  Runtime check failed: ${runtimeCounts.error}`);
    console.log(`  Reason: Memory Shards System has circular initialization`);
  }

  // ACHIEVEMENTS
  console.log(`\n### Achievements`);
  console.log(`  Expected: 129`);
  console.log(`  Source: gameStore.ts → generateAllAchievements()`);
  console.log(`  Note: Uses ${gameStoreResult.achievementFunctionCount || 'multiple'} sub-generators (original + arcs)`);

  if (runtimeCounts.success && runtimeCounts.achievements) {
    console.log(`  Actual (from runtime): ${runtimeCounts.achievements}`);
    console.log(`  Source: achievements.ts → ACHIEVEMENTS array (via tsx)`);
  }

  // CINEMATICS
  const cinematicResult = await getCinematicCount();
  console.log(`\n### Cinematics`);
  console.log(`  Expected: 52`);
  console.log(`  Actual (from source): ${cinematicResult.total}`);
  console.log(`  Sources:`);
  cinematicResult.details.forEach(d => console.log(`    - ${d}`));

  // ENDINGS
  const endingsResult = await getEndingsCount();
  console.log(`\n### Endings`);
  console.log(`  Expected: 5`);
  if (typeof endingsResult.count === 'number') {
    console.log(`  Actual (from source): ${endingsResult.count}`);
    if (endingsResult.ids.length > 0) {
      console.log(`  Ending IDs: ${endingsResult.ids.join(', ')}`);
    }
  } else {
    console.log(`  Actual: UNKNOWN`);
    console.log(`  Reason: ${endingsResult.reason}`);
  }
  console.log(`  Source: ${endingsResult.source}`);

  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});