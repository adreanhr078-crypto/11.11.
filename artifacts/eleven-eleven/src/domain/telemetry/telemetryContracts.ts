import { z } from 'zod';

export type TelemetryConsent = 'unset' | 'granted' | 'declined';

export const TELEMETRY_EVENTS = [
  'application_started',
  'screen_viewed',
  'first_puzzle_completed',
  'first_echo_interaction',
  'online_queue_started',
  'online_match_completed',
  'coop_case_completed',
  'season_activity_completed',
  'offline_capability_viewed',
] as const;

export const TELEMETRY_SURFACES = [
  'app',
  'main-menu',
  'story',
  'manhwa',
  'puzzles',
  'echo-network',
  'chess',
  'coop',
  'season',
  'community',
] as const;
export type PlayerTelemetrySurface = typeof TELEMETRY_SURFACES[number];

export const TELEMETRY_PLATFORMS = [
  'web',
  'pwa',
  'android',
  'ios',
  'desktop',
] as const;

export const telemetryEventSchema = z.object({
  version: z.literal(1),
  event: z.enum(TELEMETRY_EVENTS),
  surface: z.enum(TELEMETRY_SURFACES),
  locale: z.enum(['ar', 'en']),
  platform: z.enum(TELEMETRY_PLATFORMS),
  networkState: z.enum(['online', 'offline']),
  durationMs: z.number().int().min(0).max(7_200_000).optional(),
}).strict();

export type PlayerTelemetryEvent = z.infer<typeof telemetryEventSchema>;

export function canEmitTelemetry(input: {
  featureEnabled: boolean;
  serverEnabled: boolean;
  consent: TelemetryConsent;
  signedIn: boolean;
  online: boolean;
}): boolean {
  return input.featureEnabled
    && input.serverEnabled
    && input.consent === 'granted'
    && input.signedIn
    && input.online;
}

export interface AnalyticsEngineDataPoint {
  blobs?: string[];
  doubles?: number[];
  indexes?: string[];
}

export interface PlayerAnalyticsDataset {
  writeDataPoint(dataPoint: AnalyticsEngineDataPoint): void;
}

/**
 * This Analytics Engine payload is aggregate-only. No account ID, display
 * name, message, free-form text, or raw gameplay input can enter it.
 */
export function toTelemetryDataPoint(
  event: PlayerTelemetryEvent,
): AnalyticsEngineDataPoint {
  return {
    blobs: [
      event.event,
      event.surface,
      event.locale,
      event.platform,
      event.networkState,
    ],
    doubles: [event.durationMs ?? 0],
    indexes: [event.event],
  };
}
