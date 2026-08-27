/**
 * tools/unity/run-unity.ts
 *
 * TypeScript wrapper to invoke Unity CLI commands from the agent.
 * This does NOT install Unity; it only constructs and runs the command
 * when Unity is available on PATH.
 *
 * Run from repo root:
 *   npx tsx tools/unity/run-unity.ts -- --project-path ./UnityProject --execute-method ExportPipeline.ExportAll --log unity-export.log
 */

import { spawn } from 'node:child_process';

function detectUnity(): string {
  const candidates = [
    'Unity',
    'Unity.exe',
    '/Applications/Unity/Hub/Editor/2022.3.0f1/Unity.app/Contents/MacOS/Unity',
    'C:\\Program Files\\Unity\\Hub\\Editor\\2022.3.0f1\\Editor\\Unity.exe',
  ];
  if (process.platform === 'win32') return 'Unity';
  if (process.platform === 'darwin') return '/Applications/Unity/Hub/Editor/2022.3.0f1/Unity.app/Contents/MacOS/Unity';
  return 'Unity';
}

function main(): void {
  const raw = process.argv.slice(2);
  if (raw.length === 0 || raw[0] !== '--') {
    console.error('Usage: run-unity.ts -- <unity-args>');
    process.exit(1);
  }
  const args = raw.slice(1);
  const unity = detectUnity();
  const child = spawn(unity, ['-batchmode', '-quit', ...args], {
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
  });
  child.stdout.on('data', (d) => process.stdout.write(d));
  child.stderr.on('data', (d) => process.stderr.write(d));
  child.on('close', (code) => process.exit(code ?? 0));
}

main();
