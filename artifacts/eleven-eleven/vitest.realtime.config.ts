import { defineConfig } from 'vitest/config';
import { cloudflareTest } from '@cloudflare/vitest-pool-workers';

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: './workers/realtime/wrangler.jsonc' },
      miniflare: {
        bindings: {
          REALTIME_TICKET_SECRET: 'test-realtime-secret-that-is-longer-than-thirty-two-characters',
        },
      },
    }),
  ],
  test: {
    include: ['workers/realtime/test/**/*.test.ts'],
    testTimeout: 15_000,
  },
});
