import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import archiveManifest from '../../docs/internal/narrative/2026-07-26/ar/manifest.json';
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
  it('keeps the archived authored sources internal while publishing the approved final Manhwa', () => {
    assert.equal(CANON_VERSION, 'long-fall-v1');
    assert.equal(CANON_REGISTRY.storyStatus, 'ongoing');
    assert.deepEqual(
      CANON_REGISTRY.authoredInternalChapterIds,
      [],
    );
    assert.equal(archiveManifest.canonVersion, CANON_VERSION);
    assert.equal(archiveManifest.canonStatus, 'canonical-authority');
    assert.equal(archiveManifest.storyStatus, 'ongoing');
    assert.equal(archiveManifest.documents.length, 3);
    assert.ok(archiveManifest.documents.every((document) => (
      document.canonStatus === 'canonical-authority'
      && document.runtimeIncluded === false
      && document.spoilerLevel === 'full'
    )));
  });

  it('keeps unreleased authored material out of the runtime projection', () => {
    assert.deepEqual(
      CANON_REGISTRY.runtimePublishedChapterIds,
      ['chapter_1', 'chapter_2', 'chapter_3', 'chapter_4'],
    );

    const runtimeProjection = JSON.stringify(CORE_LORE);
    for (const unreleasedTerm of [
      'ZERO',
      'Nara',
      'Archivist',
      'Demon King',
      'Obedient Son',
      'True 11:12',
    ]) {
      assert.equal(runtimeProjection.includes(unreleasedTerm), false);
    }
  });

  it('publishes approved chapter titles without inventing future chapters', () => {
    const chapterTwo = CANON_CHAPTERS.find(({ id }) => id === 'chapter_2');
    const chapterThree = CANON_CHAPTERS.find(({ id }) => id === 'chapter_3');
    assert.equal(chapterTwo?.title.ar, 'المراقب الذي لا يرمش');
    assert.equal(chapterThree?.title.ar, 'الأشياء التي يجب أن تنساها');

    const unrevealedChapters = CANON_CHAPTERS.filter(
      ({ order }) => order >= 5,
    );
    assert.equal(unrevealedChapters.length, 3);
    assert.ok(unrevealedChapters.every((chapter) => (
      chapter.publicationStatus === 'unpublished'
      && chapter.title.en === 'Unrevealed'
    )));
    const chapterFour = CANON_CHAPTERS.find(({ id }) => id === 'chapter_4');
    assert.equal(chapterFour?.publicationStatus, 'runtime-published');
    assert.equal(chapterFour?.title.en, 'Unrevealed');
  });

  it('keeps the content registry aligned with the canonical projection', () => {
    assert.equal(CONTENT_MANIFEST.contentVersion, 'canon-long-fall-v1');

    for (const canonChapter of CANON_CHAPTERS) {
      const contentChapter = CHAPTER_DEFINITIONS.find(
        ({ id }) => id === canonChapter.id,
      );
      assert.deepEqual(contentChapter?.title, canonChapter.title);
    }
  });
});
