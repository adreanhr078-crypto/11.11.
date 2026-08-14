import {
  telemetryEventSchema,
  toTelemetryDataPoint,
} from '../../../src/domain/telemetry/telemetryContracts';
import {
  authenticatePlayer,
  corsHeaders,
  errorResponse,
  optionsResponse,
  PlayerApiError,
  readJsonBody,
  type PlayerApiContext,
} from './_shared';

const MAX_TELEMETRY_BODY_BYTES = 1_024;

export async function onRequestOptions({ request, env }: PlayerApiContext): Promise<Response> {
  return optionsResponse(request, env);
}

export async function onRequestPost({ request, env }: PlayerApiContext): Promise<Response> {
  const headers = corsHeaders(request, env);
  try {
    if (env.PLAYER_TELEMETRY_ENABLED !== 'true') {
      throw new PlayerApiError(503, 'telemetry_disabled', 'Telemetry is not enabled.');
    }
    await authenticatePlayer(request, env);
    const parsed = telemetryEventSchema.safeParse(await readJsonBody<unknown>(request, {
      maxBytes: MAX_TELEMETRY_BODY_BYTES,
      tooLargeCode: 'telemetry_too_large',
      tooLargeMessage: 'Telemetry event is too large.',
      invalidCode: 'invalid_telemetry',
      invalidMessage: 'Telemetry event is invalid.',
    }));
    if (!parsed.success) {
      throw new PlayerApiError(400, 'invalid_telemetry', 'Telemetry event is invalid.');
    }
    if (!env.PLAYER_ANALYTICS) {
      throw new PlayerApiError(503, 'telemetry_not_configured', 'Telemetry is not configured.');
    }
    env.PLAYER_ANALYTICS.writeDataPoint(toTelemetryDataPoint(parsed.data));
    return new Response(null, { status: 204, headers });
  } catch (error) {
    return errorResponse(error, headers);
  }
}
