interface Env {
  /** Set with `wrangler secret put REALTIME_TICKET_SECRET`. Never commit it. */
  REALTIME_TICKET_SECRET: string;
}

declare namespace Cloudflare {
  interface Env {
    REALTIME_TICKET_SECRET: string;
  }
}
