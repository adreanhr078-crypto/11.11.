import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

test('the default development command starts the web and player API runtimes', () => {
  const packageJson = JSON.parse(
    readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'),
  ) as { scripts?: Record<string, string> };
  assert.equal(
    packageJson.scripts?.dev,
    'node ./tools/dev-full-stack.mjs',
  );
  assert.match(packageJson.scripts?.['dev:api'] ?? '', /pages dev public/);

  const report = JSON.parse(execFileSync(
    process.execPath,
    [resolve(process.cwd(), 'tools', 'dev-full-stack.mjs'), '--check'],
    { encoding: 'utf8' },
  )) as {
    valid: boolean;
    services: Array<{ name: string; port: number; available: boolean }>;
  };
  assert.equal(report.valid, true);
  assert.deepEqual(
    report.services.map(({ name, port, available }) => ({
      name,
      port,
      available,
    })),
    [
      { name: 'web', port: 3000, available: true },
      { name: 'player-api', port: 8788, available: true },
    ],
  );
});

test('Vite keeps same-origin API calls connected to the local player service', () => {
  const source = readFileSync(
    resolve(process.cwd(), 'vite.config.ts'),
    'utf8',
  );
  assert.match(source, /['"]\/api['"]\s*:\s*\{/);
  assert.match(source, /target:\s*['"]http:\/\/127\.0\.0\.1:8788['"]/);
  assert.match(source, /strictPort:\s*true/);
});
