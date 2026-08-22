import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

function source(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
}

describe('Story Puzzle completion continuation', () => {
  it('turns an authoritative reward receipt into a visible next objective and Manhwa continuation', () => {
    const puzzleScreen = source('src/features/screens/PuzzleScreen.tsx');

    assert.match(
      puzzleScreen,
      /deriveCorePlayerObjective\(reward\?\.snapshot \?\? null, locale\)/,
    );
    assert.match(puzzleScreen, /story-reward-moment__next-objective/);
    assert.match(puzzleScreen, /onClick=\{onContinueManhwa\}/);
    assert.match(puzzleScreen, /actions\.dismissReward\(\);\s*requestManhwaReader\(\);/);
    assert.match(puzzleScreen, /story-puzzle-console__completion-loop/);
    assert.match(puzzleScreen, /onClick=\{requestManhwaReader\}/);
  });

  it('keeps Echo feedback readable in retry, receipt, and completed states without exposing an answer', () => {
    const puzzleScreen = source('src/features/screens/PuzzleScreen.tsx');
    const puzzleStyles = source('src/features/screens/story-puzzle-experience.css');
    const completionSource = puzzleScreen.slice(
      puzzleScreen.indexOf('function RewardMoment'),
      puzzleScreen.indexOf('export default function PuzzleScreen'),
    );

    assert.match(puzzleScreen, /story-puzzle-console__echo-retry-copy/);
    assert.match(puzzleScreen, /story-reward-moment__echo-response/);
    assert.match(puzzleScreen, /story-puzzle-console__completion-echo/);
    assert.match(puzzleStyles, /\.story-reward-moment__echo-response/);
    assert.match(puzzleStyles, /\.story-puzzle-console__completion-echo/);
    assert.match(puzzleStyles, /text-align: start/);
    assert.match(puzzleStyles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*story-reward-moment__echo-response/);
    assert.match(puzzleStyles, /\[data-gds-motion="reduced"\][\s\S]*story-reward-moment__echo-response/);
    assert.doesNotMatch(completionSource, /targetFrequency|targetChannel|rawSolution|correctAnswer/);
  });
});
