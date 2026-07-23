import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const TOOL_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(TOOL_DIR, '..', '..');

function section(title) {
  console.log(`\n${'='.repeat(60)}\n${title}\n${'='.repeat(60)}`);
}

function readJson(...segments) {
  return JSON.parse(
    fs.readFileSync(path.join(PROJECT_ROOT, ...segments), 'utf8'),
  );
}

function result(name, pass, details = []) {
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
  for (const detail of details) console.log(`  ${detail}`);
  return { name, pass, details };
}

function walkSource(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'legacy') return [];
      return walkSource(fullPath);
    }
    return [fullPath];
  });
}

export function scanCounts() {
  section('DOCTOR: CONTENT REGISTRY');
  try {
    const manifest = readJson('data', 'manifest.json');
    const chapters = readJson('data', 'chapters', 'index.json').items;
    const collections = ['puzzles', 'memories', 'dialogues', 'endings'];
    const counts = Object.fromEntries(collections.map((collection) => [
      collection,
      readJson('data', collection, 'index.json').items.length,
    ]));
    const chapterIds = new Set();
    let previousEnd = 0;
    let validRanges = true;
    for (const chapter of chapters) {
      if (chapterIds.has(chapter.id)) validRanges = false;
      chapterIds.add(chapter.id);
      const [start, end] = chapter.puzzleRange;
      if (start !== previousEnd + 1 || end < start) validRanges = false;
      previousEnd = end;
    }
    const capacityValid = (
      manifest.capacity.puzzles >= 2000
      && manifest.capacity.memories >= 2000
      && manifest.capacity.dialogues >= 2000
      && manifest.capacity.endings > 1
    );
    return result('content registry', validRanges && capacityValid, [
      `content version: ${manifest.contentVersion}`,
      `chapters: ${chapters.length}`,
      `authored puzzles: ${counts.puzzles}`,
      `authored memories: ${counts.memories}`,
      `authored dialogues: ${counts.dialogues}`,
      `authored endings: ${counts.endings}`,
      `puzzle capacity: ${manifest.capacity.puzzles}`,
    ]);
  } catch (error) {
    return result('content registry', false, [String(error)]);
  }
}

export function scanWhiteScreen() {
  section('DOCTOR: BOOT GRAPH');
  const issues = [];
  const indexPath = path.join(PROJECT_ROOT, 'index.html');
  const mainPath = path.join(PROJECT_ROOT, 'src', 'main.tsx');
  const appPath = path.join(PROJECT_ROOT, 'src', 'App.tsx');
  const boundaryPath = path.join(PROJECT_ROOT, 'src', 'app', 'ErrorBoundary.tsx');
  if (!fs.existsSync(indexPath) || !fs.readFileSync(indexPath, 'utf8').includes('id="root"')) {
    issues.push('index.html root element is missing');
  }
  if (!fs.existsSync(mainPath) || !fs.readFileSync(mainPath, 'utf8').includes('./App')) {
    issues.push('main.tsx does not import App');
  }
  if (!fs.existsSync(appPath)) issues.push('App.tsx is missing');
  if (!fs.existsSync(boundaryPath)) issues.push('ErrorBoundary is missing');

  const activeSourceFiles = walkSource(path.join(PROJECT_ROOT, 'src'))
    .filter((file) => /\.(ts|tsx|js|jsx)$/.test(file));
  for (const file of activeSourceFiles) {
    const content = fs.readFileSync(file, 'utf8');
    if (/from\s+['"].*batch_01['"]/.test(content)) {
      issues.push(`unresolved legacy batch import: ${path.relative(PROJECT_ROOT, file)}`);
    }
  }
  return result('boot graph', issues.length === 0, issues.length ? issues : [
    'root, App, bootstrap, and ErrorBoundary are present',
    'no active batch_01 imports found',
  ]);
}

export function scanStorage() {
  section('DOCTOR: SAVE FOUNDATION');
  const persistencePath = path.join(
    PROJECT_ROOT,
    'src',
    'infrastructure',
    'persistence',
    'gamePersistence.ts',
  );
  if (!fs.existsSync(persistencePath)) {
    return result('save foundation', false, ['gamePersistence.ts is missing']);
  }
  const content = fs.readFileSync(persistencePath, 'utf8');
  const required = [
    'GAME_SAVE_VERSION',
    'migrateGameState',
    'mergeGameState',
    'partializeGameState',
  ];
  const missing = required.filter((token) => !content.includes(token));
  return result('save foundation', missing.length === 0, missing.length
    ? missing.map((token) => `missing ${token}`)
    : ['versioned migration and progress-only persistence are present']);
}

export function scanFiles() {
  section('DOCTOR: FOUNDATION FILES');
  const required = [
    'PHASE_1_CHECKPOINT.md',
    'data/manifest.json',
    'src/domain/progression/progression.ts',
    'src/domain/echo/echoPersonality.ts',
    'src/stores/gameStore.ts',
  ];
  const missing = required.filter((relativePath) => (
    !fs.existsSync(path.join(PROJECT_ROOT, relativePath))
  ));
  return result('foundation files', missing.length === 0, missing.length
    ? missing.map((file) => `missing ${file}`)
    : required.map((file) => `found ${file}`));
}

function runCommand(command, label) {
  section(label);
  const run = spawnSync(command, {
    cwd: PROJECT_ROOT,
    shell: true,
    stdio: 'inherit',
  });
  return result(label, run.status === 0, run.error ? [String(run.error)] : []);
}

function summarize(results, label) {
  section(label);
  for (const item of results) {
    console.log(`${item.pass ? 'PASS' : 'FAIL'} ${item.name}`);
  }
  const pass = results.every((item) => item.pass);
  console.log(`\n${pass ? 'ALL CHECKS PASSED' : 'CHECKS FAILED'}`);
  return pass;
}

export function doctor() {
  const results = [
    scanCounts(),
    scanWhiteScreen(),
    scanStorage(),
    scanFiles(),
  ];
  process.exit(summarize(results, 'DOCTOR SUMMARY') ? 0 : 1);
}

export function agentPreflight() {
  const results = [
    scanCounts(),
    scanWhiteScreen(),
    scanStorage(),
  ];
  process.exit(summarize(results, 'PREFLIGHT SUMMARY') ? 0 : 1);
}

export function agentPostflight() {
  const results = [
    runCommand('npm run validate:content', 'Content validation'),
    runCommand('npm run typecheck', 'TypeScript'),
    runCommand('npm test', 'Foundation tests'),
    runCommand('npm run build', 'Production build'),
    scanCounts(),
    scanWhiteScreen(),
    scanStorage(),
    scanFiles(),
  ];
  process.exit(summarize(results, 'POSTFLIGHT SUMMARY') ? 0 : 1);
}

const command = process.argv[2] ?? 'doctor';
switch (command) {
  case 'doctor':
    doctor();
    break;
  case 'doctor:counts':
    process.exit(scanCounts().pass ? 0 : 1);
    break;
  case 'doctor:white-screen':
    process.exit(scanWhiteScreen().pass ? 0 : 1);
    break;
  case 'doctor:storage':
    process.exit(scanStorage().pass ? 0 : 1);
    break;
  case 'doctor:files':
    process.exit(scanFiles().pass ? 0 : 1);
    break;
  case 'doctor:build':
    process.exit(runCommand('npm run build', 'Production build').pass ? 0 : 1);
    break;
  case 'agent:preflight':
    agentPreflight();
    break;
  case 'agent:postflight':
    agentPostflight();
    break;
  default:
    console.error(`Unknown doctor command: ${command}`);
    process.exit(1);
}
