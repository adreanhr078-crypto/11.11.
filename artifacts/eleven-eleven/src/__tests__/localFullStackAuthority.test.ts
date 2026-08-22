import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

function source(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
}

describe('local full-stack authority environment', () => {
  it('gives Pages Functions and the realtime Worker one D1 persistence root', () => {
    const devRuntime = source('tools/dev-full-stack.mjs');

    assert.match(
      devRuntime,
      /const localPersistencePath = resolve\(projectRoot, '\.wrangler', 'shared-dev-state'\);/,
    );
    const serviceDefinitions = devRuntime.slice(
      devRuntime.indexOf('function servicesFor'),
      devRuntime.indexOf('async function applyLocalPlayerMigrations'),
    );
    assert.equal((serviceDefinitions.match(/'--persist-to'/g) ?? []).length, 2);
    assert.match(
      devRuntime,
      /'pages',[\s\S]*?'dev',[\s\S]*?'public',[\s\S]*?'--persist-to',[\s\S]*?localPersistencePath/,
    );
    assert.match(
      devRuntime,
      /'workers\/realtime\/wrangler\.jsonc',[\s\S]*?'--persist-to',[\s\S]*?localPersistencePath/,
    );
    assert.match(devRuntime, /'d1', 'migrations', 'apply', 'eleven-eleven-player'/);
    assert.match(devRuntime, /'--local',[\s\S]*?'--persist-to', localPersistencePath/);
    assert.match(devRuntime, /await applyLocalPlayerMigrations\(\);/);
  });
});
