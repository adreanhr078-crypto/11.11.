import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import * as path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

console.log('=== DEBUG: Project Doctor TypeScript Check ===');
console.log('SCRIPT LOCATION:', __dirname);
console.log('PROJECT_ROOT used as cwd:', PROJECT_ROOT);
console.log('tsconfig.json path:', path.join(PROJECT_ROOT, 'tsconfig.json'));
console.log('tsconfig.json exists:', require('fs').existsSync(path.join(PROJECT_ROOT, 'tsconfig.json')));

const command = 'npx tsc --noEmit -p tsconfig.json';
console.log('Command to run:', command);
console.log('');

try {
  const out = execSync(command, { 
    cwd: PROJECT_ROOT, 
    encoding: 'utf-8', 
    shell: process.env.COMSPEC || 'cmd.exe'
  });
  console.log('=== RESULT: PASS (exit code 0) ===');
  console.log('stdout:', out.substring(0, 300));
} catch (e) {
  console.log('=== RESULT: FAIL ===');
  console.log('Exit code:', e.status);
  console.log('stdout:', (e.stdout || '').substring(0, 500));
  console.log('stderr:', (e.stderr || '').substring(0, 500));
}