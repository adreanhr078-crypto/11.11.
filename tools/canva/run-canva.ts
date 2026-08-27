/**
 * tools/canva/run-canva.ts
 *
 * TypeScript wrapper to call Canva API for asset generation.
 * Requires CANVA_API_KEY environment variable.
 *
 * Run from repo root:
 *   CANVA_API_KEY=xxx npx tsx tools/canva/run-canva.ts -- create-design --title "11.11 Icon" --width 1024 --height 1024
 */

import { spawn } from 'node:child_process';

function main(): void {
  const apiKey = process.env.CANVA_API_KEY;
  if (!apiKey) {
    console.error('CANVA_API_KEY environment variable is required.');
    process.exit(1);
  }

  const raw = process.argv.slice(2);
  if (raw.length === 0 || raw[0] !== '--') {
    console.error('Usage: run-canva.ts -- <subcommand> [args]');
    process.exit(1);
  }
  const args = raw.slice(1);

  // Placeholder: actual Canva API calls would use fetch/undici here.
  // For now, scaffold the command structure so the agent can extend it.
  console.log(`[canva] Would call Canva API with key=${apiKey.slice(0, 4)}... and args=${JSON.stringify(args)}`);
  console.log('[canva] Implement actual API calls when Canva API access is configured.');
}

main();
