import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CHAPTER_01_MANHWA_PAGE_BY_ID,
  CHAPTER_01_PUZZLE_BY_ID,
  CHAPTER_01_PUZZLES,
} from '../content/puzzles/chapter01Campaign';
import {
  deriveCampaignAvailability,
  getCampaignPageShardProgress,
  getCampaignPageStatus,
  getCampaignPuzzleStatus,
  isCampaignPuzzleSubmissionCorrect,
  isCampaignStageCorrect,
  type CampaignRuntimeSnapshot,
} from '../domain/puzzles/campaignEngine';
import type {
  CampaignPuzzleDefinition,
  CampaignPuzzleProgress,
} from '../domain/puzzles/campaignContracts';

function puzzle(id: string): CampaignPuzzleDefinition {
  const definition = CHAPTER_01_PUZZLE_BY_ID[id];
  assert.ok(definition, `Missing campaign puzzle ${id}`);
  return definition;
}

function snapshot(
  completedPuzzleIds: readonly string[] = [],
  collectedShardIds: readonly string[] = [],
  progressByPuzzleId: CampaignRuntimeSnapshot['progressByPuzzleId'] = {},
): CampaignRuntimeSnapshot {
  return {
    completedPuzzleIds,
    collectedShardIds,
    progressByPuzzleId,
  };
}

function completionIds(count: number): string[] {
  return CHAPTER_01_PUZZLES
    .filter((definition) => definition.order <= count)
    .map((definition) => definition.id);
}

function shardIds(pageNumber: number, count = 10): string[] {
  return Array.from({ length: count }, (_, index) => (
    `page${String(pageNumber).padStart(2, '0')}_shard_${String(index + 1).padStart(2, '0')}`
  ));
}

describe('campaign puzzle submission validation', () => {
  it('validates ordered, unordered, matching, and ring stages', () => {
    const sequence = puzzle('puzzle_001_broken_pulse').stages[0];
    const multi = puzzle('puzzle_003_subject_echo_11').stages[0];
    const matching = puzzle('puzzle_005_who_stood_where').stages[0];
    const rings = puzzle('puzzle_019_333_lock').stages[0];
    assert.ok(sequence && multi && matching && rings);

    assert.equal(
      isCampaignStageCorrect(
        sequence,
        ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
        {},
      ),
      true,
    );
    assert.equal(
      isCampaignStageCorrect(
        sequence,
        ['b', 'a', 'c', 'd', 'e', 'f', 'g'],
        {},
      ),
      false,
    );
    assert.equal(
      isCampaignStageCorrect(
        multi,
        ['time', 'access', 'chamber', 'status', 'subject'],
        {},
      ),
      true,
    );
    assert.equal(
      isCampaignStageCorrect(matching, [], {
        echo: 'chamber',
        yuki: 'glass',
        kenja: 'behind',
      }),
      true,
    );
    assert.equal(
      isCampaignStageCorrect(rings, ['0', '3', '3', '3'], {}),
      true,
    );
  });

  it('requires every multi-stage submission exactly once', () => {
    const definition = puzzle('puzzle_020_name_end_hall');
    const submissions: CampaignPuzzleProgress[] = [
      {
        stageIndex: 0,
        values: [
          'wake',
          'name',
          'floor',
          'figure',
          'fragments',
          'notebook',
          'promise',
          'gate',
        ],
        matches: {},
      },
      {
        stageIndex: 1,
        values: ['c'],
        matches: {},
      },
    ];

    assert.equal(
      isCampaignPuzzleSubmissionCorrect(definition, submissions),
      true,
    );
    assert.equal(
      isCampaignPuzzleSubmissionCorrect(definition, submissions.slice(0, 1)),
      false,
    );
    assert.equal(
      isCampaignPuzzleSubmissionCorrect(definition, [
        submissions[0]!,
        { ...submissions[1]!, stageIndex: 0 },
      ]),
      false,
    );
  });
});

describe('campaign availability and memory pages', () => {
  it('keeps a single linear puzzle available and detects in-progress state', () => {
    const first = puzzle('puzzle_001_broken_pulse');
    const second = puzzle('puzzle_002_do_not_look_back');

    assert.equal(getCampaignPuzzleStatus(first, snapshot()), 'available');
    assert.equal(getCampaignPuzzleStatus(second, snapshot()), 'locked');

    const inProgress = snapshot([], [], {
      [first.id]: [{ stageIndex: 0, values: ['a'], matches: {} }],
    });
    assert.equal(
      getCampaignPuzzleStatus(first, inProgress),
      'in_progress',
    );
    assert.equal(
      deriveCampaignAvailability(inProgress).currentPuzzleId,
      first.id,
    );

    const afterFirst = snapshot([first.id]);
    const availability = deriveCampaignAvailability(afterFirst);
    assert.equal(availability.puzzleStatuses[first.id], 'completed');
    assert.equal(availability.puzzleStatuses[second.id], 'available');
    assert.deepEqual(availability.availablePuzzleIds, [second.id]);
  });

  it('opens Puzzle 011 by puzzle order because Page 01 is free', () => {
    const eleventh = puzzle('puzzle_011_what_was_forgotten');
    const firstTenCompleted = completionIds(10);

    assert.equal(
      getCampaignPuzzleStatus(
        eleventh,
        snapshot(firstTenCompleted),
      ),
      'available',
    );
    assert.equal(
      getCampaignPuzzleStatus(
        eleventh,
        snapshot(firstTenCompleted, shardIds(1)),
      ),
      'available',
    );
  });

  it('derives page-local shard progress and gated page status', () => {
    const pageOne = CHAPTER_01_MANHWA_PAGE_BY_ID.manhwa_ch01_page_01;
    const pageTwo = CHAPTER_01_MANHWA_PAGE_BY_ID.manhwa_ch01_page_02;
    assert.ok(pageOne && pageTwo);

    assert.deepEqual(
      getCampaignPageShardProgress(pageOne, [
        ...shardIds(1, 3),
        shardIds(1, 1)[0]!,
        'page02_shard_01',
      ]),
      {
        collected: 0,
        total: 0,
        remaining: 0,
        complete: true,
        collectedShardIds: [],
      },
    );
    assert.equal(getCampaignPageStatus(pageOne, []), 'restored');
    assert.equal(
      getCampaignPageStatus(pageOne, shardIds(1, 9)),
      'restored',
    );
    assert.equal(
      getCampaignPageStatus(pageOne, shardIds(1)),
      'restored',
    );
    assert.equal(
      getCampaignPageStatus(pageTwo, shardIds(2)),
      'questioned',
    );
    assert.equal(
      getCampaignPageStatus(pageTwo, shardIds(1)),
      'collecting',
    );
    assert.equal(
      getCampaignPageStatus(pageTwo, [...shardIds(1), ...shardIds(2)]),
      'questioned',
    );
  });

  it('keeps every deferred PDF page locked until real puzzle shards are registered', () => {
    const firstTwoShards = [...shardIds(1), ...shardIds(2)];
    const pageThree = CHAPTER_01_MANHWA_PAGE_BY_ID.manhwa_ch01_page_03;
    assert.ok(pageThree);

    assert.equal(
      getCampaignPageStatus(pageThree, firstTwoShards),
      'locked',
    );
    assert.equal(
      getCampaignPageStatus(
        pageThree,
        [...firstTwoShards, ...shardIds(3)],
      ),
      'locked',
    );

    const availability = deriveCampaignAvailability(
      snapshot(completionIds(20), firstTwoShards),
    );
    for (let pageNumber = 3; pageNumber <= 29; pageNumber += 1) {
      const pageId = `manhwa_ch01_page_${String(pageNumber).padStart(2, '0')}`;
      assert.equal(availability.pageStatuses[pageId], 'locked');
    }
  });
});
