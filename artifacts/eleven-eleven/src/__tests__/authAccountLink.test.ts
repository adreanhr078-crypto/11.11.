import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

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

    assert.match(service, /auth\?\.currentUser\?\.isAnonymous/);
    assert.match(service, /linkWithCredential\(auth\.currentUser, credential\)/);
    assert.match(service, /linkWithPopup\(auth\.currentUser, provider\)/);
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
});
