import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const viteEntry = resolve(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');
const capacitorEntry = resolve(
  projectRoot,
  'node_modules',
  '@capacitor',
  'cli',
  'bin',
  'capacitor',
);

function run(entry, args) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(process.execPath, [entry, ...args], {
      cwd: projectRoot,
      env: process.env,
      stdio: 'inherit',
      windowsHide: true,
    });
    child.once('error', rejectRun);
    child.once('exit', (code, signal) => {
      if (code === 0) resolveRun();
      else rejectRun(new Error(`Native preparation stopped (${signal ?? code ?? 'unknown'}).`));
    });
  });
}

await run(viteEntry, ['build', '--config', 'vite.config.ts']);
await run(capacitorEntry, ['sync']);
