import {
  authenticatePlayer,
  corsHeaders,
  errorResponse,
  jsonResponse,
  optionsResponse,
  readFirestoreDocument,
  readIntegerField,
  readStringField,
  readTimestampField,
  type PlayerApiContext,
} from './_shared';
import { requirePlayerDatabase } from './_database';
import { ensureAuthoritativePlayerProfile } from './_profileAuthority';

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
    const profile = await ensureAuthoritativePlayerProfile(
      requirePlayerDatabase(env),
      account,
    );

    const saveDocument = await readFirestoreDocument(
      env,
      idToken,
      `players/${account.uid}/saves/main`,
    );

    return jsonResponse({
      profile: {
        uid: profile.uid,
        subjectId: profile.subjectId,
        username: profile.username,
        bio: profile.bio,
        avatarId: profile.avatarId,
        email: profile.email,
        displayName: account.displayName,
        photoURL: account.photoURL,
        providerId: profile.providerId,
        isAnonymous: profile.isAnonymous,
        createdAt: profile.joinDate,
        featuredAchievementIds: profile.featuredAchievementIds,
      },
      save: saveResponse(saveDocument),
    }, 200, headers);
  } catch (error) {
    return errorResponse(error, headers);
  }
}
