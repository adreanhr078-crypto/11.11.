/// <reference types="vite/client" />

// Custom env vars the app reads at runtime.
// All AI API keys are managed server-side — the frontend never handles them.
interface ImportMetaEnv {
  readonly VITE_VAPID_PUBLIC_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
