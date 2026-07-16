#!/usr/bin/env node

/**
 * 11.11 Project Doctor - JS Runtime
 * أداة فحص المشروع للتأكد من سلامة الكود قبل وبعد التعديلات
 * 
 * Usage:
 *   npm run doctor              - تشغيل جميع الفحوصات
 *   npm run doctor:counts       - فحص العدادات
 *   npm run doctor:white-screen - فحص الشاشة البيضاء
 *   npm run doctor:storage      - فحص التخزين
 *   npm run doctor:files        - فحص الملفات
 *   npm run doctor:build        - فحص البناء
 *   npm run agent:preflight     - فحص قبل التعديل
 *   npm run agent:postflight    - فحص بعد التعديل
 */

import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PROJECT_ROOT = artifacts/eleven-eleven (parent of tools directory)
// __dirname = /tools/project-doctor, so we go up 2 levels
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(`  ${title}`, 'cyan');
  console.log('='.repeat(60));
}

function runCommand(command, description, useLocalTsc = false) {
  try {
    log(`\n▶ ${description}`, 'blue');
    log(`  Command: ${command}`, 'yellow');
    log(`  Working Dir: ${PROJECT_ROOT}`, 'yellow');
    log(`  process.cwd(): ${process.cwd()}`, 'yellow');
    
    let output;
    let exitCode;
    
    if (useLocalTsc) {
      const tscPath = path.join(process.cwd(), 'node_modules', 'typescript', 'bin', 'tsc');
      const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
      
      log(`  PROJECT_ROOT: ${PROJECT_ROOT}`, 'yellow');
      log(`  process.cwd(): ${process.cwd()}`, 'yellow');
      log(`  tscPath: ${tscPath}`, 'yellow');
      log(`  tsconfigPath: ${tsconfigPath}`, 'yellow');
      
      const result = spawnSync('node', [tscPath, '--noEmit', '-p', tsconfigPath], {
        cwd: PROJECT_ROOT,
        encoding: 'utf8',
        shell: true,
        stdio: 'pipe'
      });
      
      output = result.stdout || result.stderr || '';
      exitCode = result.status;
      
      log(`  exit code: ${exitCode}`, exitCode === 0 ? 'green' : 'red');
      
      if (exitCode !== 0) {
        throw new Error(output || 'TypeScript check failed');
      }
    } else {
      const execResult = spawnSync(command, {
        cwd: PROJECT_ROOT,
        encoding: 'utf8',
        shell: true,
        stdio: 'pipe'
      });
      
      output = execResult.stdout || execResult.stderr || '';
      exitCode = execResult.status;
      
      log(`  exit code: ${exitCode}`, exitCode === 0 ? 'green' : 'red');
      
      if (exitCode !== 0) {
        throw new Error(output || 'Command failed');
      }
    }
    
    log('  ✓ PASS', 'green');
    return { success: true, output };
  } catch (error) {
    log(`  ✗ FAIL`, 'red');
    const errorOutput = error.stdout || error.message || 'Unknown error';
    log(`  Error: ${errorOutput}`, 'red');
    return { success: false, output: errorOutput };
  }
}

function joinToRoot(...segments) {
  return path.join(PROJECT_ROOT, ...segments);
}

// ===== Doctor Counts Scanner =====

async function scanCounts() {
  logSection('DOCTOR: COUNTS');
  
  const runtimeScript = joinToRoot('tools', 'project-doctor', 'runtime-counts.mjs');
  const results = {
    puzzles: { expected: 1000, actual: 0, source: 'generateAllPuzzles() in gameStore.ts' },
    memoryShards: { expected: 835, actual: 0, source: 'allMemoryShards in gameStore.ts' },
    achievements: { expected: 129, actual: 0, source: 'generateAllAchievements() in gameStore.ts' },
    cinematicScenes: { expected: 52, actual: 0, source: 'Arc files (fracture/prelude/architect/signal/final)' },
    endings: { expected: 5, actual: 0, source: 'ExpandedEndingSystem.endings in echoFinalArc.ts' },
  };

  try {
    log('  Running runtime counts checker...', 'cyan');
    const tsxPath = path.join(PROJECT_ROOT, 'node_modules', 'tsx', 'dist', 'loader.mjs');
    const helperScript = joinToRoot('tools', 'project-doctor', 'runtime-helper.ts');
    const runtimeResult = spawnSync('node', [tsxPath, helperScript], {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      shell: true,
      stdio: 'pipe'
    });

    if (runtimeResult.status !== 0) {
      log('  ✗ Runtime counts script failed', 'red');
      log(`  Error: ${runtimeResult.stderr || runtimeResult.stdout}`, 'red');
      // Mark all as UNKNOWN
      Object.keys(results).forEach(key => {
        results[key].actual = 'UNKNOWN';
        results[key].source += ' (SCRIPT FAILED)';
      });
    } else {
      const output = runtimeResult.stdout;
      log('  ✓ Runtime counts completed\n', 'green');
      console.log(output);

      // Parse runtime output (basic parsing)
      const totalPuzzlesMatch = output.match(/totalPuzzles field in store: (\d+)/);
      if (totalPuzzlesMatch) {
        results.puzzles.actual = parseInt(totalPuzzlesMatch[1]);
      } else {
        results.puzzles.actual = 'UNKNOWN';
        results.puzzles.source += ' (not found in output)';
      }

      const cinematicMatch = output.match(/Actual \(from source\): (\d+)/);
      if (cinematicMatch) {
        results.cinematicScenes.actual = parseInt(cinematicMatch[1]);
      } else {
        results.cinematicScenes.actual = 'UNKNOWN';
        results.cinematicScenes.source += ' (not found in output)';
      }

      const endingsMatch = output.match(/Actual \(from source\): (\d+)/g);
      if (endingsMatch && endingsMatch.length >= 2) {
        results.endings.actual = parseInt(endingsMatch[1].match(/Actual \(from source\): (\d+)/)[1]);
        const idsMatch = output.match(/Ending IDs: ([^\n]+)/);
        if (idsMatch) {
          results.endings.ids = idsMatch[1].split(', ');
        }
      } else {
        results.endings.actual = 'UNKNOWN';
        results.endings.source += ' (not found in output)';
      }

      // Try to parse helper output for actual counts
      const helperOutputMatch = output.match(/=== RUNTIME COUNTS \(Helper\) ===([\s\S]*?)(?:===|$)/);
      if (helperOutputMatch) {
        const helperOut = helperOutputMatch[1];
        
        // Parse memory shards
        const origMatch = helperOut.match(/Original:\s*(\d+)/);
        const preludeMatch = helperOut.match(/Prelude:\s*(\d+)/);
        const fractureMatch = helperOut.match(/Fracture:\s*(\d+)/);
        const architectMatch = helperOut.match(/Architect:\s*(\d+)/);
        const signalMatch = helperOut.match(/Signal:\s*(\d+)/);
        const finalMatch = helperOut.match(/Final:\s*(\d+)/);
        const shardsTotalMatch = helperOut.match(/Total:\s*(\d+)/);
        
        if (shardsTotalMatch) {
          results.memoryShards.actual = parseInt(shardsTotalMatch[1]);
          results.memoryShards.source = `runtime-helper.ts (sum of generator outputs)`;
          if (origMatch) results.memoryShards.original = parseInt(origMatch[1]);
          if (preludeMatch) results.memoryShards.prelude = parseInt(preludeMatch[1]);
          if (fractureMatch) results.memoryShards.fracture = parseInt(fractureMatch[1]);
          if (architectMatch) results.memoryShards.architect = parseInt(architectMatch[1]);
          if (signalMatch) results.memoryShards.signal = parseInt(signalMatch[1]);
          if (finalMatch) results.memoryShards.final = parseInt(finalMatch[1]);
        }
        
        // Parse achievements
        const achMatch = helperOut.match(/achievements total:\s*(\d+)/);
        if (achMatch) {
          results.achievements.actual = parseInt(achMatch[1]);
          results.achievements.source = `achievements.ts → ACHIEVEMENTS array (runtime-helper.ts)`;
        }
      } else {
        // Fallback: no helper output found
        results.memoryShards.actual = 'UNKNOWN';
        results.memoryShards.source += ' (no helper output)';
        results.achievements.actual = 'UNKNOWN';
        results.achievements.source += ' (no helper output)';
      }
    }
  } catch (error) {
    log(`  ✗ Error running runtime counts: ${error.message}`, 'red');
    Object.keys(results).forEach(key => {
      results[key].actual = 'UNKNOWN';
      results[key].source += ' (ERROR)';
    });
  }

  // Determine pass/fail (UNKNOWN counts are treated as FAIL)
  let allPass = true;
  Object.entries(results).forEach(([key, value]) => {
    const actual = typeof value.actual === 'number' ? value.actual : -1;
    const pass = actual >= value.expected;
    value.pass = pass;
    if (!pass) allPass = false;

    const status = pass ? '✓ PASS' : (actual === -1 ? '? UNKNOWN' : '✗ FAIL');
    const color = pass ? 'green' : (actual === -1 ? 'yellow' : 'red');
    
    log(`\n${key}:`, 'cyan');
    log(`  Expected: ${value.expected}`, 'reset');
    if (typeof value.actual === 'number') {
      log(`  Actual: ${value.actual}`, value.pass ? 'green' : 'red');
    } else {
      log(`  Actual: ${value.actual}`, 'yellow');
    }
    log(`  Source: ${value.source}`, 'reset');
    log(`  Status: ${status}`, color);
  });

  return { pass: allPass, details: results };
}

// ===== White Screen Scanner =====

function scanWhiteScreen() {
  logSection('DOCTOR: WHITE SCREEN');
  
  const issues = [];
  let pass = true;

  // فحص index.html
  const indexPath = joinToRoot('index.html');
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
  const mainPath = joinToRoot('src/main.tsx');
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
  const appPath = joinToRoot('src/App.tsx');
  if (!fs.existsSync(appPath)) {
    issues.push('✗ src/App.tsx not found');
    pass = false;
  } else {
    log('  ✓ App.tsx exists', 'green');
  }

  // فحص package.json scripts
  const pkgPath = joinToRoot('package.json');
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
  const vitePath = joinToRoot('vite.config.ts');
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
    const filePath = joinToRoot(file);
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
  const hasErrorBoundary = fs.existsSync(joinToRoot('src/components/ErrorBoundary.tsx')) ||
                          fs.existsSync(joinToRoot('src/ErrorBoundary.tsx'));
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

function scanStorage() {
  logSection('DOCTOR: STORAGE');
  
  const issues = [];
  let pass = true;

  // فحص Zustand stores
  const storeFiles = [
    'src/stores/gameStore.ts',
    'src/stores/authStore.ts'
  ];

  storeFiles.forEach(storeFile => {
    const storePath = joinToRoot(storeFile);
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
    const filePath = joinToRoot(file);
    if (fs.existsSync(filePath)) {
      log(`  ✓ Found localStorage utility: ${file}`, 'green');
    }
  });

  // فحص corrupted save handling
  const gameStorePath = joinToRoot('src/stores/gameStore.ts');
  if (fs.existsSync(gameStorePath)) {
    const content = fs.readFileSync(gameStorePath, 'utf-8');
    const hasCorruptionHandling = content.includes('try') && content.includes('catch');
    if (!hasCorruptionHandling) {
      issues.push('⚠ No corruption handling in gameStore');
    } else {
      log('  ✓ Corruption handling found', 'green');
    }
  }

  console.log('\nIssues Found:');
  issues.forEach(issue => console.log(`  ${issue}`));

  return { pass, issues };
}

// ===== Files Scanner =====

function scanFiles() {
  logSection('DOCTOR: FILES');
  
  const projectRoot = PROJECT_ROOT;
  const report = [];
  let pass = true;

  // فحص الملفات الكبيرة
  const largeFiles = [
    'ziMD9djT',
    'ziTxo9LS',
    'Futuristic-Eleven-Eleven-Jun-5-17-09-32.mp4',
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

export function doctor() {
  logSection('11.11 PROJECT DOCTOR - FULL SCAN');
  log(`  Root: ${PROJECT_ROOT}`, 'yellow');
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

export function agentPreflight() {
  logSection('AGENT PREFLIGHT CHECK');
  log(`  Root: ${PROJECT_ROOT}`, 'yellow');
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

export function agentPostflight() {
  logSection('AGENT POSTFLIGHT CHECK');
  log(`  Root: ${PROJECT_ROOT}`, 'yellow');
  log('Running post-flight checks after modifications...', 'cyan');

  // 1. TypeScript check - uses project's own tsconfig from within artifacts/eleven-eleven
  const tscPath = path.join(PROJECT_ROOT, 'node_modules', 'typescript', 'bin', 'tsc');
  const tsconfigPath = path.join(PROJECT_ROOT, 'tsconfig.json');
  log(`  PROJECT_ROOT: ${PROJECT_ROOT}`, 'yellow');
  log(`  process.cwd(): ${process.cwd()}`, 'yellow');
  log(`  tscPath: ${tscPath}`, 'yellow');
  log(`  tsconfigPath: ${tsconfigPath}`, 'yellow');
  const tsResult = runCommand(tscPath, 'TypeScript Check', true);

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