import assert from 'node:assert/strict';
import { existsSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import {
  CHAPTER_01_MEMORY_SHARDS,
  CHAPTER_01_MANHWA_PDF_PAGE_COUNT,
  CHAPTER_01_MANHWA_PAGES,
  CHAPTER_01_PUZZLES,
  validateChapter01Campaign,
} from '../content/puzzles/chapter01Campaign';

const EXPECTED_PUZZLE_IDS = [
  'puzzle_001_broken_pulse',
  'puzzle_002_do_not_look_back',
  'puzzle_003_subject_echo_11',
  'puzzle_004_hands_across_glass',
  'puzzle_005_who_stood_where',
  'puzzle_006_lab_labels',
  'puzzle_007_tear_that_remained',
  'puzzle_008_fall_into_grid',
  'puzzle_009_rebuild_1111',
  'puzzle_010_wall_remembers',
  'puzzle_011_what_was_forgotten',
  'puzzle_012_find_one_name',
  'puzzle_013_living_floor',
  'puzzle_014_figure_corridor',
  'puzzle_015_follow_fragments',
  'puzzle_016_notebook_cover',
  'puzzle_017_memories_belong',
  'puzzle_018_even_if_forget',
  'puzzle_019_333_lock',
  'puzzle_020_name_end_hall',
] as const;

const EXPECTED_TEMPLATE_IDS = [
  'visual_sequence',
  'corrupted_text',
  'file_reconstruction',
  'mirror_matching',
  'spatial_logic',
  'evidence_matching',
  'authentic_memory_detection',
  'grid_path',
  'seven_segment',
  'multi_stage_reconstruction',
  'sorting',
  'letter_path',
  'network_connection',
  'silhouette_analysis',
  'memory_trail',
  'document_jigsaw',
  'memory_clustering',
  'sentence_reconstruction',
  'rotating_clock',
  'page_reconstruction',
] as const;

const EXPECTED_COIN_REWARDS = [
  15, 15, 20, 20, 25, 20, 25, 25, 30, 40,
  15, 20, 20, 25, 25, 30, 25, 30, 35, 45,
] as const;

const PROJECT_ROOT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
);

function expectedShardIds(page: number): string[] {
  const pageNumber = String(page).padStart(2, '0');
  return Array.from(
    { length: 10 },
    (_, index) => (
      `page${pageNumber}_shard_${String(index + 1).padStart(2, '0')}`
    ),
  );
}

describe('Chapter 01 authored campaign content', () => {
  it('contains exactly the canonical linear puzzle sequence 001-020', () => {
    assert.doesNotThrow(validateChapter01Campaign);
    assert.equal(CHAPTER_01_PUZZLES.length, 20);
    assert.deepEqual(
      CHAPTER_01_PUZZLES.map((puzzle) => puzzle.id),
      EXPECTED_PUZZLE_IDS,
    );
    assert.deepEqual(
      CHAPTER_01_PUZZLES.map((puzzle) => puzzle.order),
      Array.from({ length: 20 }, (_, index) => index + 1),
    );

    CHAPTER_01_PUZZLES.forEach((puzzle, index) => {
      const expectedPrerequisites = index === 0 ? [] : [String(index)];
      assert.deepEqual(
        puzzle.prerequisites,
        expectedPrerequisites,
        `${puzzle.id} must depend only on its immediately preceding puzzle`,
      );
    });
  });

  it('assigns one unique canonical template to every puzzle', () => {
    const templates = CHAPTER_01_PUZZLES.map((puzzle) => puzzle.template);
    assert.deepEqual(templates, EXPECTED_TEMPLATE_IDS);
    assert.equal(new Set(templates).size, 20);
  });

  it('locks the exact coin, shard, page, and hint contracts', () => {
    assert.deepEqual(
      CHAPTER_01_PUZZLES.map((puzzle) => puzzle.rewards.coins),
      EXPECTED_COIN_REWARDS,
    );
    assert.deepEqual(
      CHAPTER_01_PUZZLES.map((puzzle) => puzzle.rewards.shardId),
      [
        ...expectedShardIds(1),
        ...expectedShardIds(2),
      ],
    );
    assert.deepEqual(
      CHAPTER_01_PUZZLES.map((puzzle) => puzzle.targetPageId),
      [
        ...Array<string>(10).fill('manhwa_ch01_page_01'),
        ...Array<string>(10).fill('manhwa_ch01_page_02'),
      ],
    );

    assert.deepEqual(
      CHAPTER_01_PUZZLES[0]?.hints.map((hint) => hint.cost),
      [0, 0, 0],
    );
    CHAPTER_01_PUZZLES.slice(1).forEach((puzzle) => {
      assert.deepEqual(
        puzzle.hints.map((hint) => hint.cost),
        [5, 15, 30],
        `${puzzle.id} must use the standard three-tier hint costs`,
      );
    });
    assert.deepEqual(
      CHAPTER_01_MEMORY_SHARDS.map((shard) => shard.id),
      [...expectedShardIds(1), ...expectedShardIds(2)],
    );
    CHAPTER_01_MEMORY_SHARDS.forEach((shard, index) => {
      const sourcePuzzle = CHAPTER_01_PUZZLES[index];
      assert.equal(shard.sourcePuzzleId, sourcePuzzle?.id);
      assert.equal(shard.pageId, sourcePuzzle?.targetPageId);
      assert.equal(shard.shardIndex, (index % 10) + 1);
    });
  });

  it('keeps every stage solution inside its declared options or targets', () => {
    for (const puzzle of CHAPTER_01_PUZZLES) {
      for (const stage of puzzle.stages) {
        if (stage.mode === 'rings') {
          assert.equal(
            stage.solution.length,
            stage.rings.length,
            `${puzzle.id}/${stage.id} needs one solution value per ring`,
          );
          stage.solution.forEach((value, index) => {
            assert.ok(
              stage.rings[index]?.values.includes(value),
              `${puzzle.id}/${stage.id} uses invalid ring value "${value}"`,
            );
          });
          continue;
        }

        const optionIds = stage.options.map((option) => option.id);
        assert.equal(
          new Set(optionIds).size,
          optionIds.length,
          `${puzzle.id}/${stage.id} contains duplicate option IDs`,
        );
        const validOptionIds = new Set(optionIds);

        if (stage.mode === 'match') {
          const targetIds = stage.targets.map((target) => target.id);
          assert.equal(
            new Set(targetIds).size,
            targetIds.length,
            `${puzzle.id}/${stage.id} contains duplicate target IDs`,
          );
          const validTargetIds = new Set(targetIds);
          for (const [optionId, targetId] of Object.entries(stage.solution)) {
            assert.ok(
              validOptionIds.has(optionId),
              `${puzzle.id}/${stage.id} references unknown option "${optionId}"`,
            );
            assert.ok(
              validTargetIds.has(targetId),
              `${puzzle.id}/${stage.id} references unknown target "${targetId}"`,
            );
          }
          continue;
        }

        for (const optionId of stage.solution) {
          assert.ok(
            validOptionIds.has(optionId),
            `${puzzle.id}/${stage.id} references unknown option "${optionId}"`,
          );
        }
      }
    }
  });

  it('registers all 29 PDF pages in order while requiring the previous page', () => {
    assert.equal(CHAPTER_01_MANHWA_PDF_PAGE_COUNT, 29);
    assert.equal(
      CHAPTER_01_MANHWA_PAGES.length,
      CHAPTER_01_MANHWA_PDF_PAGE_COUNT,
    );

    CHAPTER_01_MANHWA_PAGES.forEach((page, index) => {
      const pageNumber = index + 1;
      const pageToken = String(pageNumber).padStart(2, '0');
      assert.equal(page.pageNumber, pageNumber);
      assert.equal(page.id, `manhwa_ch01_page_${pageToken}`);
      assert.equal(
        page.imageSrc,
        `/manhwa/chapter-01/page-${pageToken}.webp`,
      );
      assert.deepEqual(page.requiredShardIds, expectedShardIds(pageNumber));
      assert.equal(
        page.prerequisitePageId,
        pageNumber === 1
          ? undefined
          : `manhwa_ch01_page_${String(pageNumber - 1).padStart(2, '0')}`,
      );
    });

    assert.equal(CHAPTER_01_MANHWA_PAGES[0]?.restoredStatus, 'restored');
    assert.equal(CHAPTER_01_MANHWA_PAGES[1]?.restoredStatus, 'questioned');
    for (const page of CHAPTER_01_MANHWA_PAGES.slice(2)) {
      assert.deepEqual(page.transcript, []);
      assert.deepEqual(page.echoMindDelta.emotions, {});
      assert.deepEqual(page.echoMindDelta.beliefsAdded, []);
      assert.deepEqual(page.echoMindDelta.questionsAdded, []);
      assert.deepEqual(page.echoMindDelta.knowledgeNodesAdded, []);
      assert.deepEqual(page.narrativeFlags, []);
      assert.deepEqual(page.dialogueTriggers, []);
    }

    // Every PDF page must be present even when its future puzzle shards have
    // not been authored yet. Locked images stay unloaded by the UI.
    for (const page of CHAPTER_01_MANHWA_PAGES) {
      const assetPath = resolve(
        PROJECT_ROOT,
        'public',
        page.imageSrc.replace(/^\/+/, ''),
      );
      assert.equal(existsSync(assetPath), true, `${page.imageSrc} is missing`);
      assert.ok(statSync(assetPath).size > 0, `${page.imageSrc} is empty`);
    }
  });

  it('does not introduce Puzzle 021 or mint shards for deferred PDF pages', () => {
    assert.equal(
      CHAPTER_01_PUZZLES.some(
        (puzzle) => puzzle.order === 21 || /^puzzle_021(?:_|$)/.test(puzzle.id),
      ),
      false,
    );
    assert.equal(
      CHAPTER_01_MANHWA_PAGES[2]?.id,
      'manhwa_ch01_page_03',
    );
    assert.equal(
      CHAPTER_01_MEMORY_SHARDS.length,
      20,
    );
    assert.equal(
      CHAPTER_01_MEMORY_SHARDS.some(
        (shard) => !/^page0[12]_shard_\d{2}$/.test(shard.id),
      ),
      false,
    );
  });
});
