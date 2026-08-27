/**
 * tools/environment-setup/setup-media-tools.ts
 *
 * Scaffolds a local media-tools manifest and validates tool availability.
 * This script is intentionally non-interactive and does not install tools.
 *
 * Run from repo root:
 *   npx tsx tools/environment-setup/setup-media-tools.ts
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { checkTools } from './check-environment';

const MANIFEST_PATH = join(process.cwd(), 'tools', 'environment-setup', 'media-tools.manifest.json');

type ToolManifest = {
  generatedAt: string;
  tools: Array<{ name: string; found: boolean; version?: string }>;
};

function main(): void {
  const tools = checkTools();

  const manifest: ToolManifest = {
    generatedAt: new Date().toISOString(),
    tools: tools.map(({ name, found, version }) => ({ name, found, version })),
  };

  const dir = join(process.cwd(), 'tools', 'environment-setup');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  const missing = tools.filter((t) => !t.found);
  console.log(`\nWrote manifest: ${MANIFEST_PATH}`);
  console.log(`Tools found: ${tools.length - missing.length}/${tools.length}`);
  if (missing.length > 0) {
    console.log('Missing tools:');
    for (const t of missing) {
      console.log(`  - ${t.name}: ${t.installHint}`);
    }
  }
}

main();
