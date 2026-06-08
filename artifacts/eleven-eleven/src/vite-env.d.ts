/// <reference types="vite/client" />

// Custom env vars the app reads at runtime.
// Declared here so TypeScript knows about them; values come from .env files
// (e.g. VITE_OPENAI_API_KEY=sk-...) or shell env at build time.
interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY?: string;
  readonly VITE_OPENAI_BASE_URL?: string;
  readonly VITE_VAPID_PUBLIC_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
