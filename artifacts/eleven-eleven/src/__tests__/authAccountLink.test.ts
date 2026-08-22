import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import { friendlyAuthError } from '../features/auth/authStore';

function source(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
}

describe('guest account linking', () => {
  it('exposes a dedicated, accessible link flow only to signed-in guests', () => {
    const panel = source('src/features/auth/AuthPanel.tsx');

    assert.match(panel, /const isGuest = signedIn && user\?\.isAnonymous === true;/);
    assert.match(panel, /\{isGuest && \(/);
    assert.match(panel, /ثبّت رحلتك على حسابك/);
    assert.match(panel, /ربط الحساب مع Google/);
    assert.match(panel, /ربط بالبريد الإلكتروني/);
    assert.match(panel, /onSubmit=\{handleLinkWithEmail\}/);
    assert.match(panel, /actions\.linkAnonymousAccountWithEmail/);
    assert.match(panel, /actions\.linkAnonymousAccountWithGoogle/);
    assert.match(panel, /role="alert"/);
  });

  it('links the existing anonymous Firebase identity instead of creating a new player', () => {
    const service = source('src/features/auth/authService.ts');

    assert.match(service, /guest\?\.isAnonymous/);
    assert.match(service, /linkWithCredential\(guest, credential\)/);
    assert.match(service, /linkWithPopup\(guest, provider\)/);
    assert.match(service, /onIdTokenChanged/);
    assert.doesNotMatch(service, /onAuthStateChanged/);
  });

  it('keeps actionable Google failures visible and lays out the choices for phones', () => {
    const store = source('src/features/auth/authStore.ts');
    const styles = source('src/features/auth/auth.css');

    assert.match(store, /'auth\/popup-blocked'/);
    assert.match(store, /'auth\/unauthorized-domain'/);
    assert.match(styles, /\.auth-account-link__methods/);
    assert.match(styles, /@media \(max-width: 34rem\)[\s\S]*\.auth-account-link__methods\s*\{\s*grid-template-columns: 1fr;/);
  });

  it('keeps account errors in the active interface language without exposing configuration keys', () => {
    const blocked = Object.assign(new Error('Popup blocked'), {
      code: 'auth/popup-blocked',
    });
    const configuration = new Error(
      'Firebase Auth is not configured: VITE_FIREBASE_API_KEY',
    );

    assert.equal(
      friendlyAuthError(blocked, 'en'),
      'Your browser blocked the Google window. Allow pop-ups and try again.',
    );
    assert.equal(
      friendlyAuthError(blocked, 'ar'),
      'منع المتصفح نافذة Google. اسمح بالنوافذ المنبثقة ثم أعد المحاولة.',
    );
    assert.equal(
      friendlyAuthError(configuration, 'en').includes('VITE_FIREBASE_API_KEY'),
      false,
    );
    assert.match(
      source('src/features/auth/authStore.ts'),
      /friendlyAuthError\(error, currentLocale\(\)\)/,
    );
  });

  it('keeps auth retryable and bounds every Firebase operation', () => {
    const client = source('src/infrastructure/firebase/firebaseClient.ts');
    const service = source('src/features/auth/authService.ts');

    assert.match(client, /clientPromise = null;[\s\S]*throw error/);
    assert.match(client, /catch \{[\s\S]*persistenceReady = true/);
    assert.match(service, /function runAuthOperation<T>/);
    assert.match(service, /prepareAuthForOperation/);
    assert.match(service, /email\.trim\(\)/);
    assert.match(service, /Firebase Auth request timed out/);
  });
});
