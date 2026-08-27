/**
 * tools/stable-diffusion/run-comfyui.ts
 *
 * TypeScript wrapper to invoke ComfyUI API for image generation.
 * Requires COMFYUI_URL environment variable (default: http://127.0.0.1:8188).
 *
 * Run from repo root:
 *   COMFYUI_URL=http://127.0.0.1:8188 npx tsx tools/stable-diffusion/run-comfyui.ts -- generate --prompt "obsidian chess board" --output ./output.png
 */

import { spawn } from 'node:child_process';

function main(): void {
  const baseUrl = process.env.COMFYUI_URL || 'http://127.0.0.1:8188';
  const raw = process.argv.slice(2);
  if (raw.length === 0 || raw[0] !== '--') {
    console.error('Usage: run-comfyui.ts -- <subcommand> [args]');
    process.exit(1);
  }
  const args = raw.slice(1);
  const subcommand = args[0];

  // Placeholder: actual ComfyUI calls would use undici/fetch here.
  // For now, scaffold the command structure so the agent can extend it.
  console.log(`[comfyui] Would call ${baseUrl} with args=${JSON.stringify(args)}`);
  console.log('[comfyui] Implement actual API calls when ComfyUI is running.');
}

main();
