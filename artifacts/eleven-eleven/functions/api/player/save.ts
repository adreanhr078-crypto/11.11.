import {
  PlayerApiError,
  authenticatePlayer,
  corsHeaders,
  errorResponse,
  integerField,
  jsonResponse,
  optionsResponse,
  readFirestoreDocument,
  readIntegerField,
  readStringField,
  readTimestampField,
  stringField,
  timestampField,
  writeFirestoreDocument,
  type FirestoreDocument,
  type PlayerApiContext,
} from './_shared';

const MAX_SAVE_BYTES = 480_000;

interface SaveRequestBody {
  saveVersion?: unknown;
  baseRevision?: unknown;
  payload?: unknown;
}

function saveResponse(document: FirestoreDocument): Record<string, unknown> {
  const payloadJson = readStringField(document, 'payloadJson');
  if (!payloadJson) {
    throw new PlayerApiError(502, 'invalid_cloud_save', 'The cloud save is invalid.');
  }
  try {
    return {
      saveVersion: readIntegerField(document, 'saveVersion'),
      revision: readIntegerField(document, 'revision'),
      updatedAt: readTimestampField(document, 'updatedAt'),
      payload: JSON.parse(payloadJson) as unknown,
    };
  } catch {
    throw new PlayerApiError(502, 'invalid_cloud_save', 'The cloud save is invalid.');
  }
}

function requireInteger(
  value: unknown,
  field: string,
  minimum: number,
  maximum: number,
): number {
  if (
    typeof value !== 'number'
    || !Number.isInteger(value)
    || value < minimum
    || value > maximum
  ) {
    throw new PlayerApiError(400, 'invalid_request', `${field} is invalid.`);
  }
  return value;
}

export async function onRequestOptions({
  request,
  env,
}: PlayerApiContext): Promise<Response> {
  return optionsResponse(request, env);
}

export async function onRequestGet({
  request,
  env,
}: PlayerApiContext): Promise<Response> {
  const headers = corsHeaders(request, env);
  try {
    const { account, idToken } = await authenticatePlayer(request, env);
    const document = await readFirestoreDocument(
      env,
      idToken,
      `players/${account.uid}/saves/main`,
    );
    return jsonResponse({
      save: document ? saveResponse(document) : null,
    }, 200, headers);
  } catch (error) {
    return errorResponse(error, headers);
  }
}

export async function onRequestPut({
  request,
  env,
}: PlayerApiContext): Promise<Response> {
  const headers = corsHeaders(request, env);
  try {
    const declaredLength = Number(request.headers.get('Content-Length') ?? 0);
    if (declaredLength > MAX_SAVE_BYTES + 20_000) {
      throw new PlayerApiError(413, 'save_too_large', 'The save is too large.');
    }

    const { account, idToken } = await authenticatePlayer(request, env);
    let body: SaveRequestBody;
    try {
      body = await request.json() as SaveRequestBody;
    } catch {
      throw new PlayerApiError(400, 'invalid_request', 'The save request is invalid.');
    }

    const saveVersion = requireInteger(body.saveVersion, 'saveVersion', 1, 10_000);
    const baseRevision = requireInteger(body.baseRevision, 'baseRevision', 0, 1_000_000_000);
    if (
      typeof body.payload !== 'object'
      || body.payload === null
      || Array.isArray(body.payload)
    ) {
      throw new PlayerApiError(400, 'invalid_request', 'The save payload is invalid.');
    }

    const payloadJson = JSON.stringify(body.payload);
    if (new TextEncoder().encode(payloadJson).byteLength > MAX_SAVE_BYTES) {
      throw new PlayerApiError(413, 'save_too_large', 'The save is too large.');
    }

    const path = `players/${account.uid}/saves/main`;
    const current = await readFirestoreDocument(env, idToken, path);
    const currentRevision = current ? readIntegerField(current, 'revision') : 0;
    if (currentRevision !== baseRevision) {
      return jsonResponse({
        error: 'The cloud save changed on another device.',
        code: 'save_conflict',
        currentRevision,
        updatedAt: current ? readTimestampField(current, 'updatedAt') : null,
      }, 409, headers);
    }

    const revision = currentRevision + 1;
    const updatedAt = new Date().toISOString();
    const written = await writeFirestoreDocument(
      env,
      idToken,
      path,
      {
        ownerUid: stringField(account.uid),
        saveVersion: integerField(saveVersion),
        revision: integerField(revision),
        payloadJson: stringField(payloadJson),
        updatedAt: timestampField(updatedAt),
      },
      current?.updateTime
        ? { updateTime: current.updateTime }
        : { exists: false },
    );

    return jsonResponse({
      save: {
        saveVersion,
        revision,
        updatedAt: readTimestampField(written, 'updatedAt') ?? updatedAt,
      },
    }, 200, headers);
  } catch (error) {
    return errorResponse(error, headers);
  }
}
