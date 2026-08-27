/**
 * tools/environment-setup/check-environment.ts
 *
 * Verifies that the 11.11 development environment has the expected
 * free media tools available on PATH.
 *
 * Run from repo root:
 *   npx tsx tools/environment-setup/check-environment.ts
 */

import { execSync } from 'node:child_process';

type ToolInfo = { name: string; found: boolean; version?: string; installHint: string };

const TOOLS: ToolInfo[] = [
  {
    name: 'ffmpeg',
    installHint: 'Install via https://ffmpeg.org/download.html (winget, brew, or chocolatey)',
  },
  {
    name: 'blender',
    installHint: 'Install via https://www.blender.org/download/',
  },
  {
    name: 'audacity',
    installHint: 'Install via https://www.audacityteam.org/download/',
  },
  {
    name: 'imagemagick',
    installHint: 'Install via https://imagemagick.org/script/download.php',
  },
];

function detectVersion(cmd: string): string | undefined {
  try {
    const out = execSync(`${cmd} --version`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    const first = out.split(/\r?\n/)[0] ?? '';
    return first.trim();
  } catch {
    return undefined;
  }
}

export function checkTools(): ToolInfo[] {
  return TOOLS.map((t) => {
    const version = detectVersion(t.name);
    return { ...t, found: Boolean(version), version };
  });
}

function main(): void {
  const results = checkTools();
  console.log('\n=== 11.11 Free Media Tools Environment Check ===\n');
  for (const tool of results) {
    const status = tool.found ? 'FOUND' : 'MISSING';
    console.log(`[${status}] ${tool.name}${tool.version ? ` — ${tool.version}` : ''}`);
    if (!tool.found) console.log(`  install: ${tool.installHint}`);
  }
  const missing = results.filter((t) => !t.found);
  console.log(`\nMissing: ${missing.length} / ${results.length}`);
  if (missing.length > 0) {
    console.log('RESULT: UNVERIFIED — install missing tools to complete media pipeline.');
    process.exitCode = 1;
  } else {
    console.log('RESULT: PASS');
  }
}

main();
