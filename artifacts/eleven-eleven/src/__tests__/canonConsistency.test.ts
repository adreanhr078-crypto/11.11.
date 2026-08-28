import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import currentManifest from '../../docs/internal/narrative/current/ar/manifest.json';
import {
  CANON_CHAPTERS,
  CANON_REGISTRY,
  CANON_VERSION,
} from '../core/canonRegistry';
import {
  CHAPTER_DEFINITIONS,
  CONTENT_MANIFEST,
} from '../infrastructure/content/contentRegistry';
import { CORE_LORE } from '../lore';

describe('canonical story authority', () => {
  it('uses both Owner-approved Echo Network references and no old Long Fall authority', () => {
    assert.equal(CANON_VERSION, 'echo-network-evolving-v1');
    assert.equal(CANON_REGISTRY.storyStatus, 'ongoing');
    assert.equal(currentManifest.canonVersion, CANON_VERSION);
    assert.equal(currentManifest.canonStatus, 'canonical-authority');
    assert.equal(currentManifest.storyStatus, 'ongoing');
    assert.equal(currentManifest.documents.length, 2);
    assert.deepEqual(
      currentManifest.documents.map((document) => document.id),
      ['story-bible', 'narrative-master'],
    );
    assert.ok(currentManifest.documents.every((document) => (
      document.canonStatus === 'canonical-authority'
      && document.runtimeIncluded === false
      && document.originalSha256.length === 64
    )));
  });

  it('keeps unreached secrets out of the runtime-safe projection', () => {
    const runtimeProjection = JSON.stringify(CORE_LORE);
    for (const unreachedTerm of [
      'Hector',
      'روح واحدة',
      'one soul',
      'قتل',
      'murder',
    ]) {
      assert.equal(runtimeProjection.includes(unreachedTerm), false);
    }
    assert.equal(CORE_LORE.productionIdentity.echoNeckMark, 'EX-011');
    assert.equal(CORE_LORE.productionIdentity.placement, 'direct-skin');
  });

  it('publishes no unfinished Manhwa chapter as current Canon', () => {
    assert.deepEqual(CANON_REGISTRY.runtimePublishedChapterIds, []);
    assert.deepEqual(CANON_REGISTRY.authoredInternalChapterIds, ['chapter_1']);
    assert.equal(CANON_CHAPTERS[0]?.publicationStatus, 'authored-internal');
    assert.ok(CANON_CHAPTERS.slice(1).every((chapter) => (
      chapter.publicationStatus === 'unpublished'
    )));
  });

  it('keeps the data registry aligned with the evolving Canon labels', () => {
    assert.equal(CONTENT_MANIFEST.contentVersion, 'canon-echo-network-evolving-v1');
    for (const canonChapter of CANON_CHAPTERS) {
      const contentChapter = CHAPTER_DEFINITIONS.find(({ id }) => id === canonChapter.id);
      assert.deepEqual(contentChapter?.title, canonChapter.title);
    }
  });
});
