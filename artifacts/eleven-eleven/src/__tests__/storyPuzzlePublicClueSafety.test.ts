import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

function catalogSource(): string {
  return readFileSync(resolve(process.cwd(), 'src/content/puzzles/storyPuzzleCatalog.ts'), 'utf8');
}

function publicPuzzleRecord(catalog: string, id: string): string {
  const start = catalog.indexOf(`id: '${id}'`);
  assert.notEqual(start, -1, `Missing public puzzle record: ${id}`);

  const next = catalog.indexOf("\n  {\n    id: 'story_puzzle_", start + 1);
  return catalog.slice(start, next === -1 ? catalog.indexOf('\n]);', start) : next);
}

describe('Story puzzle public clue safety', () => {
  it('keeps later-story clues relational and omits direct answer markers', () => {
    const catalog = catalogSource();
    const records = Object.fromEntries([
      'story_puzzle_09_timeline_recovery',
      'story_puzzle_12_mirror_code',
      'story_puzzle_13_visual_forensics',
      'story_puzzle_17_contradictory_records',
      'story_puzzle_19_final_deduction',
      'story_puzzle_20_core_sequence',
    ].map((id) => [id, publicPuzzleRecord(catalog, id)]));

    for (const [id, record] of Object.entries(records)) {
      assert.doesNotMatch(
        record,
        /\b(?:correctAnswer|correctSolution|rawSolutions|tokens|assignments|rotations|targetFrequency|targetChannel)\b/,
        `${id} must not carry client-verifiable answer material`,
      );
    }

    assert.doesNotMatch(records.story_puzzle_09_timeline_recovery!, /Begin with the earliest timestamp|ابدأ من الطابع الزمني الأقل|رتّب:\s*12:00/i);
    assert.doesNotMatch(records.story_puzzle_12_mirror_code!, /4 at both ends and 1 in the center|الطرفين 4 والقيمة الوسطى 1|اختر 4-1-4/i);
    assert.doesNotMatch(records.story_puzzle_13_visual_forensics!, /Mismatched double rhythm|Shifted alignment seam|إيقاع مزدوج غير متوافق|خط محاذاة منزاح|المواضع الصحيحة:\s*X2/i);
    assert.doesNotMatch(records.story_puzzle_17_contradictory_records!, /The third record places the camera after the channel was closed|السجل الثالث يضع الكاميرا|Conflicts with channel closure|يتعارض مع إغلاق القناة|السجل غير الممكن هو R-03/i);
    assert.doesNotMatch(records.story_puzzle_19_final_deduction!, /The verified time is 11:11|the synchronized camera is CAM-07|R-01 remains the consistent order record|الوقت الموثوق هو 11:11|الكاميرا المتزامنة هي CAM-07|يبقى R-01 سجل الترتيب المتوافق|ثبّت:\s*11:11/i);
    assert.doesNotMatch(records.story_puzzle_20_core_sequence!, /SYNC\s*→\s*ROUTE\s*→\s*11\.11\s*→\s*CORE|SIGNAL\s*→\s*MEMORY\s*→\s*ECHO|ACCESS\s*→\s*MEMORY\s*→\s*SIGNAL|SIGNAL\s*→\s*ACCESS\s*→\s*MEMORY\s*→\s*ECHO|المراحل:\s*SYNC/i);

    assert.match(records.story_puzzle_09_timeline_recovery!, /temporal relationships|علاقتين زمنيتين/);
    assert.match(records.story_puzzle_12_mirror_code!, /angle-free mark|العلامة الخالية من الزوايا/);
    assert.match(records.story_puzzle_13_visual_forensics!, /break in repetition|خلل في التكرار/);
    assert.match(records.story_puzzle_17_contradictory_records!, /ended before observation began|انتهت قبل بدء المشاهدة/);
    assert.match(records.story_puzzle_19_final_deduction!, /time mark, an observation source, and a sequence record|علامة زمن، ومصدر رصد، وسجل ترتيب/);
    assert.match(records.story_puzzle_20_core_sequence!, /independent verification|تحقق مستقل/);
  });
});
