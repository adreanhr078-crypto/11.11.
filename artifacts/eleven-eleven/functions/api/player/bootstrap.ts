import {
  authenticatePlayer,
  booleanField,
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
  type PlayerApiContext,
} from './_shared';

const PROFILE_SCHEMA_VERSION = 1;

function saveResponse(
  document: Awaited<ReturnType<typeof readFirestoreDocument>>,
): Record<string, unknown> | null {
  if (!document) return null;
  const payloadJson = readStringField(document, 'payloadJson');
  if (!payloadJson) return null;

  try {
    return {
      saveVersion: readIntegerField(document, 'saveVersion'),
      revision: readIntegerField(document, 'revision'),
      updatedAt: readTimestampField(document, 'updatedAt'),
      payload: JSON.parse(payloadJson) as unknown,
    };
  } catch {
    return null;
  }
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
    const now = new Date().toISOString();
    await writeFirestoreDocument(
      env,
      idToken,
      `players/${account.uid}`,
      {
        uid: stringField(account.uid),
        displayName: stringField(account.displayName ?? ''),
        email: stringField(account.email ?? ''),
        photoURL: stringField(account.photoURL ?? ''),
        providerId: stringField(account.providerId),
        isAnonymous: booleanField(account.providerId === 'anonymous'),
        schemaVersion: integerField(PROFILE_SCHEMA_VERSION),
        createdAt: timestampField(account.createdAt),
        lastLoginAt: timestampField(account.lastLoginAt),
        updatedAt: timestampField(now),
      },
    );

    const saveDocument = await readFirestoreDocument(
      env,
      idToken,
      `players/${account.uid}/saves/main`,
    );

    return jsonResponse({
      profile: {
        uid: account.uid,
        displayName: account.displayName,
        email: account.email,
        photoURL: account.photoURL,
        providerId: account.providerId,
        createdAt: account.createdAt,
      },
      save: saveResponse(saveDocument),
    }, 200, headers);
  } catch (error) {
    return errorResponse(error, headers);
  }
}
