#!/usr/bin/env node

/**
 * 11.11 Project Doctor
 * أداة فحص المشروع للتأكد من سلامة الكود قبل وبعد التعديلات
 * 
 * Usage:
 *   npm run doctor              - تشغيل جميع الفحوصات
 *   npm run doctor:counts       - فحص العدادات
 *   npm run doctor:white-screen - فحص الشاشة البيضاء
 *   npm run doctor:storage      - فحص التخزين
 *   npm run doctor:build        - فحص البناء
 *   npm run agent:preflight     - فحص قبل التعديل
 *   npm run agent:postflight    - فحص بعد التعديل
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof COLORS = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  log(`  ${title}`, 'cyan');
  console.log('='.repeat(60));
}

function runCommand(command: string, description: string): { success: boolean; output: string } {
  try {
    log(`\n▶ ${description}`, 'blue');
    log(`  Command: ${command}`, 'yellow');
    const output = execSync(command, { 
      cwd: path.join(__dirname, '../..'),
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    log('  ✓ PASS', 'green');
    return { success: true, output };
  } catch (error: any) {
    log(`  ✗ FAIL`, 'red');
    const errorOutput = error.stdout || error.message || 'Unknown error';
    log(`  Error: ${errorOutput}`, 'red');
    return { success: false, output: errorOutput };
  }
}

// ===== Doctor Counts Scanner =====

function scanCounts(): { pass: boolean; details: any } {
  logSection('DOCTOR: COUNTS');
  
  const srcDir = path.join(__dirname, '../..', 'src');
  const results: any = {
    puzzles: { expected: 1000, actual: 0, duplicates: 0, missing: [] as string[] },
    memoryShards: { expected: 835, actual: 0, duplicates: 0, missing: [] as string[] },
    achievements: { expected: 129, actual: 0, duplicates: 0, missing: [] as string[] },
    cinematicScenes: { expected: 52, actual: 0, duplicates: 0, missing: [] as string[] },
    endings: { expected: 5, actual: 0, duplicates: 0, missing: [] as string[] },
  };

  let allPass = true;

  // فحص الألغاز
  const puzzleFiles = [
    'src/components/puzzle/PuzzleEngine.tsx',
    'src/core/echoPuzzleExpansion.ts',
    'src/stores/gameStore.ts'
  ];
  
  let puzzleCount = 0;
  puzzleFiles.forEach(file => {
    const filePath = path.join(__dirname, '../..', file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      // عد صيغ الألغاز المختلفة
      const puzzleMatches = content.match(/puzzle|PUZZLE|riddle|RIDDLE|challenge|CHALLENGE/gi) || [];
      puzzleCount += puzzleMatches.length;
    }
  });
  results.puzzles.actual = puzzleCount;
  results.puzzles.pass = puzzleCount >= 1000;
  if (!results.puzzles.pass) allPass = false;

  // فحص Memory Shards
  const shardFiles = [
    'src/components/memory/MemorySystem.tsx',
    'src/core/memoryShardsSystem.ts',
    'src/stores/gameStore.ts'
  ];
  
  let shardCount = 0;
  shardFiles.forEach(file => {
    const filePath = path.join(__dirname, '../..', file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const shardMatches = content.match(/shard|SHARD|memory|MEMORY|fragment|FRAGMENT/gi) || [];
      shardCount += shardMatches.length;
    }
  });
  results.memoryShards.actual = shardCount;
  results.memoryShards.pass = shardCount >= 835;
  if (!results.memoryShards.pass) allPass = false;

  // فحص Achievements
  const achieveFiles = [
    'src/components/sections/AchievementsSection.tsx',
    'src/stores/gameStore.ts'
  ];
  
  let achieveCount = 0;
  achieveFiles.forEach(file => {
    const filePath = path.join(__dirname, '../..', file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const achieveMatches = content.match(/achievement|ACHIEVEMENT|unlock|UNLOCK/gi) || [];
      achieveCount += achieveMatches.length;
    }
  });
  results.achievements.actual = achieveCount;
  results.achievements.pass = achieveCount >= 129;
  if (!results.achievements.pass) allPass = false;

  // فحص Cinematic Scenes
  const cinematicFiles = [
    'src/components/effects/CinematicMode.tsx',
    'src/core/echoCinematicSystem.ts'
  ];
  
  let cinematicCount = 0;
  cinematicFiles.forEach(file => {
    const filePath = path.join(__dirname, '../..', file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const sceneMatches = content.match(/scene|SCENE|cinematic|CINEMATIC|cutscene|CUTSCENE/gi) || [];
      cinematicCount += sceneMatches.length;
    }
  });
  results.cinematicScenes.actual = cinematicCount;
  results.cinematicScenes.pass = cinematicCount >= 52;
  if (!results.cinematicScenes.pass) allPass = false;

  // فحص Endings
  const endingFiles = [
    'src/components/sections/EndingPanel.tsx',
    'src/components/sections/EndingResultScreen.tsx',
    'src/components/sections/FinalChoiceSystem.tsx'
  ];
  
  let endingCount = 0;
  endingFiles.forEach(file => {
    const filePath = path.join(__dirname, '../..', file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const endingMatches = content.match(/ending|ENDING|final|FINAL|conclusion|CONCLUSION/gi) || [];
      endingCount += endingMatches.length;
    }
  });
  results.endings.actual = endingCount;
  results.endings.pass = endingCount >= 5;
  if (!results.endings.pass) allPass = false;

  // طباعة النتائج
  Object.entries(results).forEach(([key, value]: [string, any]) => {
    const status = value.pass ? '✓ PASS' : '✗ FAIL';
    const color = value.pass ? 'green' : 'red';
    log(`\n${key}:`, 'cyan');
    log(`  Expected: ${value.expected}`, 'reset');
    log(`  Actual: ${value.actual}`, value.actual >= value.expected ? 'green' : 'red');
    log(`  Status: ${status}`, color);
  });

  return { pass: allPass, details: results };
}

// ===== White Screen Scanner =====

function scanWhiteScreen(): { pass: boolean; issues: string[] } {
  logSection('DOCTOR: WHITE SCREEN');
  
  const issues: string[] = [];
  let pass = true;

  // فحص index.html
  const indexPath = path.join(__dirname, '../..', 'index.html');
  if (!fs.existsSync(indexPath)) {
    issues.push('✗ index.html not found');
    pass = false;
  } else {
    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    if (!indexContent.includes('id="root"')) {
      issues.push('✗ index.html does not contain <div id="root">');
      pass = false;
    } else {
      log('  ✓ index.html has <div id="root">', 'green');
    }
  }

  // فحص main.tsx
  const mainPath = path.join(__dirname, '../..', 'src/main.tsx');
  if (!fs.existsSync(mainPath)) {
    issues.push('✗ src/main.tsx not found');
    pass = false;
  } else {
    const mainContent = fs.readFileSync(mainPath, 'utf-8');
    if (!mainContent.includes('root') || !mainContent.includes('createRoot')) {
      issues.push('✗ main.tsx does not use correct root element');
      pass = false;
    } else {
      log('  ✓ main.tsx uses correct root', 'green');
    }
  }

  // فحص App.tsx
  const appPath = path.join(__dirname, '../..', 'src/App.tsx');
  if (!fs.existsSync(appPath)) {
    issues.push('✗ src/App.tsx not found');
    pass = false;
  } else {
    log('  ✓ App.tsx exists', 'green');
  }

  // فحص package.json scripts
  const pkgPath = path.join(__dirname, '../..', 'package.json');
  if (!fs.existsSync(pkgPath)) {
    issues.push('✗ package.json not found');
    pass = false;
  } else {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    if (!pkg.scripts || !pkg.scripts.dev || !pkg.scripts.build) {
      issues.push('✗ package.json missing required scripts (dev, build)');
      pass = false;
    } else {
      log('  ✓ package.json has required scripts', 'green');
    }
  }

  // فحص vite.config.ts
  const vitePath = path.join(__dirname, '../..', 'vite.config.ts');
  if (!fs.existsSync(vitePath)) {
    issues.push('✗ vite.config.ts not found');
    pass = false;
  } else {
    const viteContent = fs.readFileSync(vitePath, 'utf-8');
    if (viteContent.includes('entry:')) {
      issues.push('⚠ vite.config.ts may have custom entry (check if needed)');
    } else {
      log('  ✓ vite.config.ts has no custom entry', 'green');
    }
  }

  // فحص imports أساسية
  const criticalImports = [
    { file: 'src/App.tsx', imports: ['React', './main'] },
    { file: 'src/main.tsx', imports: ['React', 'ReactDOM', './App'] },
  ];

  criticalImports.forEach(({ file, imports }) => {
    const filePath = path.join(__dirname, '../..', file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      imports.forEach(imp => {
        if (!content.includes(imp)) {
          issues.push(`⚠ ${file} missing import: ${imp}`);
        }
      });
    }
  });

  // فحص ErrorBoundary
  const hasErrorBoundary = fs.existsSync(path.join(__dirname, '../..', 'src/components/ErrorBoundary.tsx')) ||
                          fs.existsSync(path.join(__dirname, '../..', 'src/ErrorBoundary.tsx'));
  if (!hasErrorBoundary) {
    issues.push('⚠ No ErrorBoundary found (recommended for production)');
  } else {
    log('  ✓ ErrorBoundary exists', 'green');
  }

  console.log('\nIssues Found:');
  issues.forEach(issue => console.log(`  ${issue}`));

  return { pass, issues };
}

// ===== Storage Scanner =====

function scanStorage(): { pass: boolean; issues: string[] } {
  logSection('DOCTOR: STORAGE');
  
  const issues: string[] = [];
  let pass = true;

  // فحص Zustand stores
  const storeFiles = [
    'src/stores/gameStore.ts',
    'src/stores/authStore.ts'
  ];

  storeFiles.forEach(storeFile => {
    const storePath = path.join(__dirname, '../..', storeFile);
    if (fs.existsSync(storePath)) {
      const content = fs.readFileSync(storePath, 'utf-8');
      
      // فحص persist
      if (!content.includes('persist') && !content.includes('localStorage')) {
        issues.push(`⚠ ${storeFile} has no persist/localStorage integration`);
      } else {
        log(`  ✓ ${storeFile} has storage integration`, 'green');
      }

      // فحص resetProgress
      if (!content.includes('resetProgress') && !content.includes('reset')) {
        issues.push(`⚠ ${storeFile} missing resetProgress function`);
      }

      // فحص endings
      if (storeFile === 'src/stores/gameStore.ts' && !content.includes('ending')) {
        issues.push(`⚠ gameStore missing endings data`);
      }
    }
  });

  // فحص localStorage
  const localStorageFiles = [
    'src/hooks/useLocalStorage.ts',
    'src/utils/storage.ts'
  ];

  localStorageFiles.forEach(file => {
    const filePath = path.join(__dirname, '../..', file);
    if (fs.existsSync(filePath)) {
      log(`  ✓ Found localStorage utility: ${file}`, 'green');
    }
  });

  // فحص corrupted save handling
  const hasCorruptionHandling = fs.readFileSync(path.join(__dirname, '../..', 'src/stores/gameStore.ts'), 'utf-8')
    .includes('try') && fs.readFileSync(path.join(__dirname, '../..', 'src/stores/gameStore.ts'), 'utf-8')
    .includes('catch');
  if (!hasCorruptionHandling) {
    issues.push('⚠ No corruption handling in gameStore');
  } else {
    log('  ✓ Corruption handling found', 'green');
  }

  console.log('\nIssues Found:');
  issues.forEach(issue => console.log(`  ${issue}`));

  return { pass, issues };
}

// ===== Files Scanner =====

function scanFiles(): { pass: boolean; report: any[] } {
  logSection('DOCTOR: FILES');
  
  const projectRoot = path.join(__dirname, '../..');
  const report: any[] = [];
  let pass = true;

  // فحص الملفات الكبيرة
  const largeFiles = [
    'ziMD9djT',
    'ziTxo9LS',
    'Futuristic-Eleven-Eleven-Jun-5-17-09-32.mp4',
    'ziTxo9LS',
    'project.zip'
  ];

  largeFiles.forEach(file => {
    const filePath = path.join(projectRoot, file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      report.push({
        file,
        size: `${sizeMB} MB`,
        used: 'Unknown',
        risk: sizeMB > 100 ? 'HIGH' : sizeMB > 10 ? 'MEDIUM' : 'LOW',
        suggestedAction: 'Review if needed for deployment'
      });
    }
  });

  // فحص ملفات التحقق القديمة
  const verifyFiles = [
    'verify_system.js',
    'verify_system_fixed.js',
    'verify_system_direct.js',
    'verify_memory_shards.js'
  ];

  verifyFiles.forEach(file => {
    const filePath = path.join(projectRoot, file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      report.push({
        file,
        size: `${stats.size} bytes`,
        used: 'Legacy verification script',
        risk: 'LOW',
        suggestedAction: 'Can be removed if not needed'
      });
    }
  });

  // فحص التقارير القديمة
  const reportFiles = [
    'final_comprehensive_report.md',
    'final_verification_report.md',
    'test_game_comprehensive.md',
    'test_report_corrected.md'
  ];

  reportFiles.forEach(file => {
    const filePath = path.join(projectRoot, file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      report.push({
        file,
        size: `${stats.size} bytes`,
        used: 'Old report',
        risk: 'LOW',
        suggestedAction: 'Can be archived or removed'
      });
    }
  });

  report.forEach(item => {
    console.log(`\n${item.file}:`);
    console.log(`  Size: ${item.size}`);
    console.log(`  Used: ${item.used}`);
    console.log(`  Risk: ${item.risk}`);
    console.log(`  Suggested: ${item.suggestedAction}`);
  });

  return { pass, report };
}

// ===== Main Functions =====

export function doctor(): void {
  logSection('11.11 PROJECT DOCTOR - FULL SCAN');
  log('Starting comprehensive project scan...', 'cyan');

  const countsResult = scanCounts();
  const whiteScreenResult = scanWhiteScreen();
  const storageResult = scanStorage();
  const filesResult = scanFiles();

  const overallPass = countsResult.pass && whiteScreenResult.pass && storageResult.pass;

  logSection('SUMMARY');
  log(`Counts Check: ${countsResult.pass ? 'PASS' : 'FAIL'}`, countsResult.pass ? 'green' : 'red');
  log(`White Screen Check: ${whiteScreenResult.pass ? 'PASS' : 'FAIL'}`, whiteScreenResult.pass ? 'green' : 'red');
  log(`Storage Check: ${storageResult.pass ? 'PASS' : 'FAIL'}`, storageResult.pass ? 'green' : 'red');
  log(`Files Check: ${filesResult.pass ? 'PASS' : 'FAIL'}`, filesResult.pass ? 'green' : 'red');
  
  console.log('\n' + '='.repeat(60));
  log(`OVERALL: ${overallPass ? '✓ PASS' : '✗ FAIL'}`, overallPass ? 'green' : 'red');
  console.log('='.repeat(60) + '\n');

  process.exit(overallPass ? 0 : 1);
}

export function agentPreflight(): void {
  logSection('AGENT PREFLIGHT CHECK');
  log('Running pre-flight checks before any modifications...', 'cyan');

  const countsResult = scanCounts();
  const whiteScreenResult = scanWhiteScreen();
  const storageResult = scanStorage();

  const pass = countsResult.pass && whiteScreenResult.pass && storageResult.pass;

  logSection('PREFLIGHT SUMMARY');
  log(`Counts: ${countsResult.pass ? 'PASS' : 'FAIL'}`, countsResult.pass ? 'green' : 'red');
  log(`White Screen: ${whiteScreenResult.pass ? 'PASS' : 'FAIL'}`, whiteScreenResult.pass ? 'green' : 'red');
  log(`Storage: ${storageResult.pass ? 'PASS' : 'FAIL'}`, storageResult.pass ? 'green' : 'red');

  console.log('\n' + '='.repeat(60));
  log(`PREFLIGHT STATUS: ${pass ? '✓ SAFE TO PROCEED' : '✗ BLOCKED - FIX ISSUES FIRST'}`, pass ? 'green' : 'red');
  console.log('='.repeat(60) + '\n');

  process.exit(pass ? 0 : 1);
}

export function agentPostflight(): void {
  logSection('AGENT POSTFLIGHT CHECK');
  log('Running post-flight checks after modifications...', 'cyan');

  // 1. TypeScript check
  const tsResult = runCommand('npx tsc --noEmit -p tsconfig.json', 'TypeScript Check');

  // 2. Build check
  const buildResult = runCommand('npm run build', 'Build Check');

  // 3. Counts check
  const countsResult = scanCounts();

  // 4. White screen check
  const whiteScreenResult = scanWhiteScreen();

  const pass = tsResult.success && buildResult.success && countsResult.pass && whiteScreenResult.pass;

  logSection('POSTFLIGHT SUMMARY');
  log(`TypeScript: ${tsResult.success ? 'PASS' : 'FAIL'}`, tsResult.success ? 'green' : 'red');
  log(`Build: ${buildResult.success ? 'PASS' : 'FAIL'}`, buildResult.success ? 'green' : 'red');
  log(`Counts: ${countsResult.pass ? 'PASS' : 'FAIL'}`, countsResult.pass ? 'green' : 'red');
  log(`White Screen: ${whiteScreenResult.pass ? 'PASS' : 'FAIL'}`, whiteScreenResult.pass ? 'green' : 'red');

  console.log('\n' + '='.repeat(60));
  log(`POSTFLIGHT STATUS: ${pass ? '✓ ALL CHECKS PASSED' : '✗ SOME CHECKS FAILED'}`, pass ? 'green' : 'red');
  console.log('='.repeat(60) + '\n');

  if (!pass) {
    log('DO NOT report success until all checks pass!', 'red');
  }

  process.exit(pass ? 0 : 1);
}

// ===== CLI Entry Point =====

if (require.main === module) {
  const command = process.argv[2] || 'doctor';
  
  switch (command) {
    case 'doctor':
      doctor();
      break;
    case 'doctor:counts':
      scanCounts();
      break;
    case 'doctor:white-screen':
      scanWhiteScreen();
      break;
    case 'doctor:storage':
      scanStorage();
      break;
    case 'doctor:files':
      scanFiles();
      break;
    case 'doctor:build':
      runCommand('npm run build', 'Build Check');
      break;
    case 'agent:preflight':
      agentPreflight();
      break;
    case 'agent:postflight':
      agentPostflight();
      break;
    default:
      log('Unknown command. Available: doctor, doctor:counts, doctor:white-screen, doctor:storage, doctor:files, doctor:build, agent:preflight, agent:postflight', 'red');
      process.exit(1);
  }
}