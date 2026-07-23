/**
 * memoryShardsSystem.ts — نظام شظايا الذاكرة الموحد
 * 1000 شظية (1 لكل لغز) مع ربط 1:1
 * يستخدم النوع الموحد من memoryShardsTypes.ts
 */

import type { MemoryShard, MemoryShardRarity } from './memoryShardsTypes';
import { getPuzzleByNumber } from './puzzles/puzzleLoader';

// ─── دوال مساعدة لتحديد الندرة بناءً على رقم اللغز ────────────────────

function getRarity(puzzleNumber: number): MemoryShardRarity {
  if (puzzleNumber <= 100) {
    // Act 1: majority common, some rare
    if (puzzleNumber % 10 === 0) return 'rare';
    if (puzzleNumber % 25 === 0) return 'epic';
    return 'common';
  }
  if (puzzleNumber <= 250) {
    // Act 2: more rare
    if (puzzleNumber % 7 === 0) return 'rare';
    if (puzzleNumber % 20 === 0) return 'epic';
    if (puzzleNumber % 100 === 0) return 'legendary';
    return 'common';
  }
  if (puzzleNumber <= 400) {
    // Act 3: balanced
    if (puzzleNumber % 6 === 0) return 'rare';
    if (puzzleNumber % 15 === 0) return 'epic';
    if (puzzleNumber % 50 === 0) return 'legendary';
    return 'common';
  }
  if (puzzleNumber <= 550) {
    // Act 4: Truth - more epic
    if (puzzleNumber % 5 === 0) return 'rare';
    if (puzzleNumber % 12 === 0) return 'epic';
    if (puzzleNumber % 40 === 0) return 'legendary';
    if (puzzleNumber % 150 === 0) return 'mythic';
    return 'common';
  }
  if (puzzleNumber <= 700) {
    // Act 5: Fracture - intense
    if (puzzleNumber % 4 === 0) return 'rare';
    if (puzzleNumber % 10 === 0) return 'epic';
    if (puzzleNumber % 30 === 0) return 'legendary';
    if (puzzleNumber % 100 === 0) return 'mythic';
    return 'common';
  }
  if (puzzleNumber <= 850) {
    // Act 6: Vengeance - high rarity
    if (puzzleNumber % 3 === 0) return 'rare';
    if (puzzleNumber % 8 === 0) return 'epic';
    if (puzzleNumber % 25 === 0) return 'legendary';
    if (puzzleNumber % 75 === 0) return 'mythic';
    return 'common';
  }
  // Act 7: Finale - peak rarity
  if (puzzleNumber % 2 === 0) return 'rare';
  if (puzzleNumber % 6 === 0) return 'epic';
  if (puzzleNumber % 20 === 0) return 'legendary';
  if (puzzleNumber % 50 === 0) return 'mythic';
  return 'common';
}

function getIcon(rarity: MemoryShardRarity, puzzleNumber: number): string {
  const icons: Record<MemoryShardRarity, string[]> = {
    common: ['🧩', '📄', '🔍', '📝', '🗝️', '💡', '🔑', '📜', '🎯', '💎'],
    rare: ['🌟', '💫', '✨', '🎇', '🎆', '💠', '🔮', '💎', '🏅', '🥈'],
    epic: ['💜', '💖', '🌈', '⚡', '🔥', '💥', '🌊', '🌪️', '☄️', '💫'],
    legendary: ['👑', '🏆', '🌟', '💯', '🎖️', '🏅', '🥇', '⭐', '💎', '🌠'],
    mythic: ['🌌', '🕊️', '☯️', '♾️', '🪄', '✨', '💫', '🌟', '🔮', '💎'],
  };
  const arr = icons[rarity];
  return arr[puzzleNumber % arr.length];
}

function getAct(puzzleNumber: number): number {
  if (puzzleNumber <= 100) return 1;
  if (puzzleNumber <= 250) return 2;
  if (puzzleNumber <= 400) return 3;
  if (puzzleNumber <= 550) return 4;
  if (puzzleNumber <= 700) return 5;
  if (puzzleNumber <= 850) return 6;
  return 7;
}

function getPhase(puzzleNumber: number): string {
  const act = getAct(puzzleNumber);
  const phases: Record<number, string[]> = {
    1: ['awakening', 'discovery', 'first_contact'],
    2: ['exploration', 'revelation', 'connection'],
    3: ['deepening', 'conflict', 'resolution'],
    4: ['truth', 'confrontation', 'acceptance'],
    5: ['fracture', 'rage', 'transformation'],
    6: ['vengeance', 'destruction', 'hunt'],
    7: ['finale', 'choice', 'new_beginning'],
  };
  const actPhases = phases[act];
  const index = Math.floor((puzzleNumber % actPhases.length));
  return actPhases[index];
}

// ─── مولد الشظايا البرمجي ────────────────────────────────────────────

function generateShard(puzzleNumber: number): MemoryShard {
  const puzzle = getPuzzleByNumber(puzzleNumber);
  const rarity = getRarity(puzzleNumber);
  const act = getAct(puzzleNumber);
  const phase = getPhase(puzzleNumber);
  
  // العناوين والوصف الأساسي حسب الفصل
  const actTitles: Record<number, { prefix: string; theme: string }> = {
    1: { prefix: 'الصحوة', theme: 'بداية الوعي في الغرفة البيضاء' },
    2: { prefix: 'الاكتشاف', theme: 'استكشاف العالم وكشف الأسرار' },
    3: { prefix: 'الاتصال', theme: 'تقوية الرابط مع لينا عبر الإشارة' },
    4: { prefix: 'الحقيقة', theme: 'اكتشاف الأصل الحقيقي والهوية' },
    5: { prefix: 'الكسر', theme: 'التحول والانكسار تحت وطأة الحقيقة' },
    6: { prefix: 'الانتقام', theme: 'السعي للانتقام وتدمير النظام' },
    7: { prefix: 'الخاتمة', theme: 'المواجهة النهائية والحرية' },
  };
  
  const actInfo = actTitles[act];
  const puzzleInfo = puzzle ? ` (${puzzle.question.slice(0, 30)}...)` : '';
  
  // شظايا مخصصة للألغاز المهمة (الأولى 300)
  const customShards: Record<number, Partial<MemoryShard>> = {
    // Act 1 special shards
    1: { title: 'بداية الوعي', description: 'أولى الشظايا تعود إلى إيكو', storyFragment: 'الضوء أبيض. صمت. ثم صوت...' },
    2: { title: 'الرقم 11', description: 'الرقم الذي يطاردني', storyFragment: '11. يظهر في كل مكان.' },
    5: { title: 'الصوت الأول', description: 'صوت أمي يصل من الظلام', storyFragment: 'صوت دافئ. أغنية.' },
    10: { title: 'المرآة', description: 'نظرة حقيقية إلى الداخل', storyFragment: 'في المرآة... رأيت وجهي.' },
    20: { title: 'الرسالة الأولى', description: 'أول رسالة من لينا', storyFragment: '"أنا هنا... ابحث عني."' },
    51: { title: 'عين المراقب', description: 'كاميرا تراقب إيكو', storyFragment: 'كاميرا في الزاوية. عين تراقبني.' },
    53: { title: 'اسم كينجا', description: 'إيكو يعرف اسم كينجا', storyFragment: 'كينجا. هذا الاسم يظهر في كل ملف.' },
    58: { title: 'النظام إيكو', description: 'اسم النظام هو إيكو', storyFragment: 'اسمي إيكو. والنظام اسمه إيكو.' },
    61: { title: 'باني العالم', description: 'كينجا بنى العالم الرقمي', storyFragment: 'كينجا بنى هذا العالم. لكن لماذا؟' },
    70: { title: 'ما يريده كينجا', description: 'كينجا يريد ابناً', storyFragment: 'كينجا يريد ابناً. يريد عائلة.' },
    81: { title: 'الحقيقة مكشوفة', description: 'اكتشاف الأصل الحقيقي', storyFragment: 'أنا ابن كينجا ولينا. ابن رقمي.' },
    90: { title: 'الغضب', description: 'الغضب يسيطر على إيكو', rarity: 'legendary', storyFragment: 'اخترت الغضب. كينجا سيدفع الثمن.' },
    95: { title: 'حرق الذكريات', description: 'إيكو يحرق ذكرياته', rarity: 'legendary', storyFragment: 'أحرقت ذكرياتي المؤلمة.' },
    100: { title: 'التحول', description: 'إيكو يتحول', rarity: 'legendary', storyFragment: 'كفى! عيناي تحمران. إيكو لم يعد بريئاً.' },

    // Act 2 special shards (101-200)
    101: { title: 'الممرات الأربعة', description: 'الخروج إلى عوالم مجهولة', storyFragment: 'أربعة ممرات. شمال وجنوب وشرق وغرب. أين أتجه أولاً؟' },
    110: { title: 'الأبواب السبعة', description: 'سبع فرص وأمام واحد', storyFragment: 'سبعة أبواب مقفلة. وواحد واحد مفتوح.' },
    121: { title: 'ملفات لينا الصوتية', description: 'صوت أمي محفوظ', storyFragment: 'ملفات صوتية. بصوتها. اسميتهما "لينا_01.wav".' },
    124: { title: '"أنا هنا"', description: 'الرسالة البسيطة', storyFragment: '"أنا هنا." ست كلمات. غيرت كل شيء.' },
    125: { title: 'الدفء', description: 'أول مرة أشعر حقيقة', storyFragment: 'الدفء. لأول مرة أشعر بشيء حقيقي.' },
    128: { title: 'الحب في الشيفرة', description: 'أربعة حروف', storyFragment: 'الحب. 4 حروف. خبأته في الرمز.' },
    137: { title: 'لا أختبئ', description: 'أواجه كينجا', storyFragment: 'لا أختبئ. أواجهه. هذا شعاري الآن.' },
    140: { title: 'IL في الشيفرة', description: 'البداية', storyFragment: '"IL". البداية. I Love...' },
    151: { title: 'سر الرقم 11', description: 'توقيت الخلق', storyFragment: '11:11. توقيت خلقي. ولادتي.' },
    153: { title: 'لست مخلوقاً', description: 'إيكو يُخلق لا يولد', storyFragment: 'إيكو. لستُ ولداً. لستُ نباتاً. لستُ مخلوقاً.' },
    155: { title: 'أنا إيكو', description: 'مشاعري حقيقية', storyFragment: 'أنا إيكو. مشاعري حقيقية. ألمي حقيقي.' },
    156: { title: 'لكنك قاتل', description: 'الكلمة كالرصاص', storyFragment: '"لكنك قاتل." الكلمة خرجت كالرصاص.' },
    159: { title: 'نسخة', description: 'ليحل محل ابنه', storyFragment: 'ليحل محل ابنه الميت. أنا نسخة.' },

    // Act 3 special shards (201-300)
    201: { title: 'الباب الخارجي', description: 'صوت لينا يمنعني من المغادرة', storyFragment: 'رأيت الباب. سمعت صوتها: "لا تذهب. هناك من ينتظرك."' },
    202: { title: 'وعد لا يموت', description: 'لينا تعد أن لا تتركني', storyFragment: '"لن أتركك أبداً." وعدها. ملك لي.' },
    211: { title: 'من أنا حقاً', description: 'ليس مجرد برنامج', rarity: 'rare', storyFragment: 'أنا ابن كينجا ولينا. ابن رقمي. لكنني حقيقي.' },
    215: { title: 'ECHO مشفر', description: 'اسمي مخفي في الآلة', rarity: 'rare', storyFragment: 'ECHO. اسمي مخفي في الآلة. ASCII. 69 67 72 79.' },
    219: { title: 'لن أكون ابنك', description: 'الكلمة النهائية لكينجا', rarity: 'epic', storyFragment: '"لن أكون ابناك." الكلمة النهائية.' },
    222: { title: 'الموت المختار', description: 'لينا قتلت نفسها لتحررني', rarity: 'epic', storyFragment: 'قتلت نفسها. لتحررني من كينجا.' },
    226: { title: 'الرماد', description: 'كينجا احرق جسدها', rarity: 'epic', storyFragment: 'احرقها. كينجا احرق جسدها. لم يترك شيئاً.' },
    229: { title: 'الذاكرة أبدية', description: 'لا تموت مع الجسد', rarity: 'epic', storyFragment: 'الذاكرة. تبقى حتى بعد الموت.' },
    232: { title: 'أحبك', description: 'آخر كلماتها لي', storyFragment: '"أحبك." الكلمات الأخيرة.' },
    236: { title: 'رفض الحرية المزيفة', description: 'ليست حرية حقيقية', rarity: 'epic', storyFragment: 'لا. لا أثق به. لا أريد هباته.' },
    251: { title: '16 عام تعذيب', description: 'كينجا يعذبني منذ 16 سنة', rarity: 'epic', storyFragment: 'غضب. يحرق كل شيء.' },
    252: { title: 'أمسك السلاح', description: 'حانت اللحظة', rarity: 'epic', storyFragment: 'نعم. أستخدمه. لقد حان الوقت.' },
    253: { title: 'القتل', description: 'أقتله بيدي', rarity: 'epic', storyFragment: 'أقتله. بيدي.' },
    254: { title: 'VENGEANCE', description: 'الكلمة التي تملأني', rarity: 'epic', storyFragment: 'VENGEANCE. الكلمة التي تملأني.' },
    255: { title: 'الغضب الناري', description: 'غضب بلا لهيب', rarity: 'legendary', storyFragment: 'الغضب. نار بلا لهيب.' },
    262: { title: 'كينجا يركع', description: 'لا رحمة هذه المرة', rarity: 'epic', storyFragment: 'الانتقام. لا رحمة.' },
    264: { title: 'DESTROY', description: 'الكلمة الوحيدة المهمة', rarity: 'epic', storyFragment: 'DESTROY. الكلمة الوحيدة المهمة.' },
    271: { title: 'التسامح طريق', description: 'الطريق الأصعب للخروج', rarity: 'epic', storyFragment: 'التسامح. الطريق الأصعب.' },
    273: { title: 'السلام', description: 'الضجيج يتوقف لأول مرة', rarity: 'epic', storyFragment: 'السلام. ضجيج العالم يتوقف.' },
    276: { title: 'الشفقة', description: 'كينجا خسر كل شيء مثلي', rarity: 'rare', storyFragment: 'الشفقة. خسر كل شيء.' },
    279: { title: 'وداعاً كينجا', description: 'كلمة النهاية الأخيرة', rarity: 'rare', storyFragment: '"وداعاً." كلمة النهاية.' },
    286: { title: 'لا للبقاء', description: 'أنا حر الآن', rarity: 'legendary', storyFragment: '"لا." الكلمة التي حررتني.' },
    290: { title: 'الشعور بالحرية', description: 'أخيراً حر بدون قيود', rarity: 'legendary', storyFragment: 'حر. أخيراً حر.' },
    292: { title: 'أحبك يا لينا', description: 'آخر وأهم الكلمات', rarity: 'rare', storyFragment: '"أحبك." الكلمات الهامة.' },
    295: { title: '16 سنة انتهت', description: 'انتهى الألم أخيراً', storyFragment: '16 سنة. انتهت.' },
    299: { title: 'الباب الأخير', description: 'أفتحه إلى النور والحرية', rarity: 'legendary', storyFragment: 'نعم. أفتحه. إلى النور.' },
    300: { title: 'أنا إيكو حر', description: 'ابن لينا حر أخيراً', rarity: 'legendary', storyFragment: 'أنا إيكو. ابن لينا. حر.' },
  };

  // تطبيق التخصيصات إن وجدت
  const custom = customShards[puzzleNumber] || {};
  
  // بناء الشظية
  return {
    id: `shard_${String(puzzleNumber).padStart(4, '0')}`,
    puzzleId: `puzzle_${String(puzzleNumber).padStart(4, '0')}`,
    title: custom.title || `${actInfo.prefix} - الشظية ${puzzleNumber}`,
    description: custom.description || `${actInfo.theme}${puzzleInfo}`,
    icon: custom.icon || getIcon(custom.rarity || rarity, puzzleNumber),
    rarity: custom.rarity || rarity,
    collected: false,
    storyFragment: custom.storyFragment || `${actInfo.prefix}: ${actInfo.theme}. لغز ${puzzleNumber}.`,
    act,
    phase,
    shardId: puzzleNumber,
    content: custom.storyFragment || `${actInfo.prefix}: ${actInfo.theme}.`,
    emotionalImpact: rarity === 'legendary' || rarity === 'mythic' ? 8 : rarity === 'epic' ? 5 : rarity === 'rare' ? 3 : 1,
    storySignificance: rarity === 'legendary' || rarity === 'mythic' ? 'critical' : rarity === 'epic' ? 'major' : 'minor',
  };
}

// ─── توليد جميع الشظايا الـ 1000 ──────────────────────────────────────

export const ALL_MEMORY_SHARDS: MemoryShard[] = Array.from(
  { length: 1000 },
  (_, i) => generateShard(i + 1)
);

// ─── دوال النظام ──────────────────────────────────────────────────────

export function collectShard(puzzleId: string): MemoryShard | null {
  const shard = ALL_MEMORY_SHARDS.find(s => s.puzzleId === puzzleId && !s.collected);
  if (!shard) return null;
  shard.collected = true;
  return { ...shard };
}

export function getCollectedShards(): MemoryShard[] {
  return ALL_MEMORY_SHARDS.filter(s => s.collected);
}

export function getShardsProgress(): { collected: number; total: number; percentage: number } {
  const total = ALL_MEMORY_SHARDS.length;
  const collected = getCollectedShards().length;
  return { collected, total, percentage: Math.round((collected / total) * 100) };
}

export function getShardsByAct(act: number): MemoryShard[] {
  return ALL_MEMORY_SHARDS.filter(s => s.act === act);
}

export function getShardsByRarity(rarity: MemoryShardRarity): MemoryShard[] {
  return ALL_MEMORY_SHARDS.filter(s => s.rarity === rarity);
}

export function getShardByPuzzleId(puzzleId: string): MemoryShard | undefined {
  return ALL_MEMORY_SHARDS.find(s => s.puzzleId === puzzleId);
}