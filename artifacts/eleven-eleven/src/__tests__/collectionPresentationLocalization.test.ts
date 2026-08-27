import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { PHASE5_ACHIEVEMENT_DEFINITIONS } from '../domain/collection/collectionDefinitions';
import {
  COLLECTION_ACHIEVEMENT_PRESENTATION,
  localizeCollectionAchievement,
} from '../domain/collection/collectionPresentation';

describe('collection achievement presentation localization', () => {
  it('gives every authoritative achievement an Arabic and English presentation', () => {
    for (const definition of PHASE5_ACHIEVEMENT_DEFINITIONS) {
      const copy = COLLECTION_ACHIEVEMENT_PRESENTATION[definition.id];
      assert.ok(copy, `missing presentation copy for ${definition.id}`);
      assert.ok(copy.name.ar.length > 0);
      assert.ok(copy.name.en.length > 0);
      assert.ok(copy.description.ar.length > 0);
      assert.ok(copy.description.en.length > 0);
    }
  });

  it('uses the server-owned record only as a safe fallback for future IDs', () => {
    assert.deepEqual(
      localizeCollectionAchievement({
        id: 'future_authoritative_record',
        name: 'FUTURE RECORD',
        description: 'A future server-owned description.',
      }, 'ar'),
      { name: 'FUTURE RECORD', description: 'A future server-owned description.' },
    );
  });
});
