# 11.11 Google Play release gate

This repository contains an Android wrapper; it does not guarantee store
approval. Google Play requirements can change, so verify the current Console
requirements immediately before submission.

## Blocking items before production

- Build and smoke-test a signed AAB on real low/mid-range devices.
- Replace all development endpoints with HTTPS/WSS production endpoints.
- Configure the production contextual-ad provider and consent flow.
- Publish valid privacy-policy, terms, community-rules, and support URLs.
- Complete Data safety, Ads, content-rating, target-audience, and app-access
  declarations accurately.
- Provide final icon, feature graphic, localized Arabic/English descriptions,
  and screenshots from the shipping build.
- Confirm that no microphone, location, contacts, storage, or other unused
  permissions are present.
- Test account deletion/export paths and moderation/report handling.
- Verify accessibility, RTL/LTR, portrait/landscape, offline boundaries, and
  the no-pay-to-win/no-punitive-streak policy.

## Build

Copy `android/keystore.properties.example` to
`android/keystore.properties`, fill it with the Owner's release keystore, then:

```powershell
.\build-android.bat release
```

The expected output is
`android/app/build/outputs/bundle/release/app-release.aab`. Keep the keystore
and credentials outside version control, back them up securely, and reuse the
same signing identity for future updates.

Do not upload an artifact merely because Gradle succeeded. Release approval
requires the runtime, policy, privacy, ads, account, content, and device checks
above to pass with evidence.
