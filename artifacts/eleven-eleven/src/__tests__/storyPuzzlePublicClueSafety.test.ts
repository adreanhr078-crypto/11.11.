import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

function catalogSource(): string {
  return readFileSync(resolve(process.cwd(), 'src/content/puzzles/storyPuzzleCatalog.ts'), 'utf8');
}

function serverDefinitionSource(): string {
  return readFileSync(resolve(process.cwd(), 'functions/api/player/_storyPuzzleDefinitions.ts'), 'utf8');
}

describe('corrected opening puzzle public-clue boundary', () => {
  it('ships only the two approved opening records to the public catalog', () => {
    const catalog = catalogSource();
    assert.match(catalog, /id: 'story_puzzle_01_echo_network_signal_sync'/);
    assert.match(catalog, /id: 'story_puzzle_02_echo_network_archive_route'/);
    assert.doesNotMatch(catalog, /story_puzzle_03_torn_memory/);
    assert.doesNotMatch(catalog, /story_puzzle_20_core_sequence/);
    assert.doesNotMatch(catalog, /chapter_2|chapter_3|chapter_4/);
  });

  it('keeps server verification material outside the public catalog', () => {
    const catalog = catalogSource();
    const server = serverDefinitionSource();

    assert.doesNotMatch(
      catalog,
      /\b(?:rawSolutions|correctAnswer|correctSolution|isServerStoryPuzzleSubmissionCorrect)\b/,
    );
    assert.match(server, /const rawSolutions/);
    assert.match(server, /story_puzzle_01_echo_network_signal_sync/);
    assert.match(server, /story_puzzle_02_echo_network_archive_route/);
  });

  it('does not expose unpublished-page bindings or retired Canon transformations', () => {
    const catalog = catalogSource();
    assert.doesNotMatch(catalog, /page\(1[0-9]\)|page\([2-6][0-9]\)|page\(70\)/);
    assert.doesNotMatch(catalog, /black_coronation|second_contract_marked|black_echo_protocol/);
  });
});
