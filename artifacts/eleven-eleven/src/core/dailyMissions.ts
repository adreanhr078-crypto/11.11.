/**
 * dailyMissions.ts — نظام المهام اليومية للعبة 11.11
 * 100 مهمة يومية مختلفة، تظهر 5 كل يوم
 * كل مهمة تكشف جزءاً من القصة وتعطي مكافآت
 */

import type { DailyMission, MissionType } from './gameTypes';

// ─── 100 مهمة يومية ──────────────────────────────────────────────────
export const ALL_DAILY_MISSIONS: DailyMission[] = [
  // Act 1: الصحوة (1-15)
  {
    id: 'daily_001', type: 'story',
    title: { ar: 'الغرفة البيضاء', en: 'The White Room' },
    description: { ar: 'لماذا الغرفة بيضاء؟ ما الذي يختبئ خلف الجدران؟', en: 'Why is the room white? What hides behind the walls?' },
    puzzleId: 'puzzle_001',
    reward: { coins: 200, crystals: 1, shardId: 'shard_daily_001' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_002', type: 'quick',
    title: { ar: 'أرقام إيكو', en: "Echo's Numbers" },
    description: { ar: 'ثلاثة ألغاز سريعة عن ذكريات إيكو الأولى', en: 'Three quick puzzles about Echo\'s first memories' },
    puzzleId: 'puzzle_005',
    reward: { coins: 150, crystals: 0 },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_003', type: 'cipher',
    title: { ar: 'شيفرة الصدى', en: 'Echo Cipher' },
    description: { ar: 'فك شيفرة رسالة مشفرة من إيكو', en: 'Decode an encrypted message from Echo' },
    puzzleId: 'puzzle_010',
    reward: { coins: 300, crystals: 1, shardId: 'shard_daily_003' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_004', type: 'reflection',
    title: { ar: 'تأمل الصباح', en: 'Morning Reflection' },
    description: { ar: 'تأمل في معنى الرقم 11:11 وماذا يمثل لإيكو', en: 'Reflect on the meaning of 11:11 and what it represents to Echo' },
    puzzleId: 'puzzle_015',
    reward: { coins: 100, crystals: 0, shardId: 'shard_daily_004' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_005', type: 'challenge',
    title: { ar: 'تحدي الصحوة', en: 'Awakening Challenge' },
    description: { ar: 'لغز صعب عن بداية وعي إيكو', en: 'A hard puzzle about the beginning of Echo\'s consciousness' },
    puzzleId: 'puzzle_020',
    reward: { coins: 500, crystals: 2, shardId: 'shard_daily_005' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_006', type: 'story',
    title: { ar: 'صوت في الظلام', en: 'Voice in the Dark' },
    description: { ar: 'من يتحدث إلى إيكو في أحلامه؟', en: 'Who speaks to Echo in his dreams?' },
    puzzleId: 'puzzle_025',
    reward: { coins: 200, crystals: 1 },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_007', type: 'quick',
    title: { ar: 'ذكريات سريعة', en: 'Quick Memories' },
    description: { ar: 'ألغاز عن ذكريات إيكو المبعثرة', en: 'Puzzles about Echo\'s scattered memories' },
    puzzleId: 'puzzle_030',
    reward: { coins: 150, crystals: 0 },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_008', type: 'cipher',
    title: { ar: 'رسالة لينا الأولى', en: "Lina's First Message" },
    description: { ar: 'فك شيفرة أول رسالة من لينا', en: 'Decode Lina\'s first message' },
    puzzleId: 'puzzle_035',
    reward: { coins: 300, crystals: 1, shardId: 'shard_daily_008' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_009', type: 'reflection',
    title: { ar: 'من أنا؟', en: 'Who Am I?' },
    description: { ar: 'تأمل في هوية إيكو الحقيقية', en: 'Reflect on Echo\'s true identity' },
    puzzleId: 'puzzle_040',
    reward: { coins: 100, crystals: 0, shardId: 'shard_daily_009' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_010', type: 'challenge',
    title: { ar: 'تحدي الباب المغلق', en: 'Closed Door Challenge' },
    description: { ar: 'كيف يفتح إيكو الباب المغلق؟', en: 'How does Echo open the closed door?' },
    puzzleId: 'puzzle_045',
    reward: { coins: 500, crystals: 2, shardId: 'shard_daily_010' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_011', type: 'story',
    title: { ar: 'كاميرات المراقب', en: 'Watcher Cameras' },
    description: { ar: 'من يراقب إيكو من خلال الكاميرات؟', en: 'Who watches Echo through the cameras?' },
    puzzleId: 'puzzle_050',
    reward: { coins: 200, crystals: 1 },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_012', type: 'quick',
    title: { ar: 'أصوات المختبر', en: 'Lab Sounds' },
    description: { ar: 'أصوات غامضة من مختبر كينجا', en: 'Mysterious sounds from Kenja\'s lab' },
    puzzleId: 'puzzle_055',
    reward: { coins: 150, crystals: 0 },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_013', type: 'cipher',
    title: { ar: 'شيفرة المراقب', en: 'Watcher Cipher' },
    description: { ar: 'فك شيفرة تسجيلات المراقب', en: 'Decode the Watcher\'s recordings' },
    puzzleId: 'puzzle_060',
    reward: { coins: 300, crystals: 1, shardId: 'shard_daily_013' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_014', type: 'reflection',
    title: { ar: 'الخوف من الحقيقة', en: 'Fear of Truth' },
    description: { ar: 'لماذا يخاف إيكو من معرفة الحقيقة؟', en: 'Why is Echo afraid of knowing the truth?' },
    puzzleId: 'puzzle_065',
    reward: { coins: 100, crystals: 0, shardId: 'shard_daily_014' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_015', type: 'challenge',
    title: { ar: 'تحدي كينجا', en: 'Kenja Challenge' },
    description: { ar: 'مواجهة صعبة مع أسرار كينجا', en: 'A difficult confrontation with Kenja\'s secrets' },
    puzzleId: 'puzzle_070',
    reward: { coins: 500, crystals: 2, shardId: 'shard_daily_015' },
    expiresAt: 0, completed: false
  },

  // Act 2: الاكتشاف (16-30)
  {
    id: 'daily_016', type: 'story',
    title: { ar: 'رسائل كينجا', en: "Kenja's Messages" },
    description: { ar: 'ماذا تخفي رسائل كينجا القديمة؟', en: 'What do Kenja\'s old messages hide?' },
    puzzleId: 'puzzle_080',
    reward: { coins: 200, crystals: 1, shardId: 'shard_daily_016' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_017', type: 'quick',
    title: { ar: 'مختبر الأسرار', en: 'Secrets Lab' },
    description: { ar: 'ألغاز سريعة عن مختبر كينجا السري', en: 'Quick puzzles about Kenja\'s secret lab' },
    puzzleId: 'puzzle_090',
    reward: { coins: 150, crystals: 0 },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_018', type: 'cipher',
    title: { ar: 'شيفرة المختبر', en: 'Lab Cipher' },
    description: { ar: 'فك شيفرة سجلات المختبر', en: 'Decode the lab records' },
    puzzleId: 'puzzle_100',
    reward: { coins: 300, crystals: 1, shardId: 'shard_daily_018' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_019', type: 'reflection',
    title: { ar: 'الغضب الأول', en: 'First Anger' },
    description: { ar: 'تأمل في أول مرة شعر فيها إيكو بالغضب', en: 'Reflect on the first time Echo felt anger' },
    puzzleId: 'puzzle_110',
    reward: { coins: 100, crystals: 0, shardId: 'shard_daily_019' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_020', type: 'challenge',
    title: { ar: 'تحدي الحقيقة', en: 'Truth Challenge' },
    description: { ar: 'لغز صعب يكشف جزءاً من حقيقة النظام', en: 'A hard puzzle revealing part of the system\'s truth' },
    puzzleId: 'puzzle_120',
    reward: { coins: 500, crystals: 2, shardId: 'shard_daily_020' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_021', type: 'story',
    title: { ar: 'الابن المفقود', en: 'The Lost Son' },
    description: { ar: 'قصة الابن الحقيقي لكينجا ولينا', en: 'The story of Kenja and Lina\'s real son' },
    puzzleId: 'puzzle_130',
    reward: { coins: 200, crystals: 1, shardId: 'shard_daily_021' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_022', type: 'quick',
    title: { ar: 'صور قديمة', en: 'Old Photos' },
    description: { ar: 'ألغاز عن صور من ماضي العائلة', en: 'Puzzles about family past photos' },
    puzzleId: 'puzzle_140',
    reward: { coins: 150, crystals: 0 },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_023', type: 'cipher',
    title: { ar: 'شيفرة العائلة', en: 'Family Cipher' },
    description: { ar: 'فك شيفرة رسالة عائلية قديمة', en: 'Decode an old family message' },
    puzzleId: 'puzzle_150',
    reward: { coins: 300, crystals: 1, shardId: 'shard_daily_023' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_024', type: 'reflection',
    title: { ar: 'معنى العائلة', en: 'Meaning of Family' },
    description: { ar: 'تأمل في معنى العائلة بالنسبة لإيكو', en: 'Reflect on the meaning of family for Echo' },
    puzzleId: 'puzzle_160',
    reward: { coins: 100, crystals: 0, shardId: 'shard_daily_024' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_025', type: 'challenge',
    title: { ar: 'تحدي الذاكرة', en: 'Memory Challenge' },
    description: { ar: 'لغز صعب عن ذاكرة إيكو المدفونة', en: 'A hard puzzle about Echo\'s buried memory' },
    puzzleId: 'puzzle_170',
    reward: { coins: 500, crystals: 2, shardId: 'shard_daily_025' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_026', type: 'story',
    title: { ar: 'لماذا أنا هنا؟', en: 'Why Am I Here?' },
    description: { ar: 'استكشاف سبب وجود إيكو في النظام', en: 'Exploring why Echo exists in the system' },
    puzzleId: 'puzzle_180',
    reward: { coins: 200, crystals: 1 },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_027', type: 'quick',
    title: { ar: 'أسئلة سريعة', en: 'Quick Questions' },
    description: { ar: 'ألغاز سريعة عن النظام الرقمي', en: 'Quick puzzles about the digital system' },
    puzzleId: 'puzzle_190',
    reward: { coins: 150, crystals: 0 },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_028', type: 'cipher',
    title: { ar: 'شيفرة النظام', en: 'System Cipher' },
    description: { ar: 'فك شيفرة كود النظام الأساسي', en: 'Decode the system\'s core code' },
    puzzleId: 'puzzle_200',
    reward: { coins: 300, crystals: 1, shardId: 'shard_daily_028' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_029', type: 'reflection',
    title: { ar: 'الأمل', en: 'Hope' },
    description: { ar: 'تأمل في الأمل الذي يمسك به إيكو', en: 'Reflect on the hope Echo holds onto' },
    puzzleId: 'puzzle_210',
    reward: { coins: 100, crystals: 0, shardId: 'shard_daily_029' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_030', type: 'challenge',
    title: { ar: 'تحدي الاتصال', en: 'Connection Challenge' },
    description: { ar: 'لغز صعب عن اتصال إيكو بلينا', en: 'A hard puzzle about Echo\'s connection to Lina' },
    puzzleId: 'puzzle_220',
    reward: { coins: 500, crystals: 2, shardId: 'shard_daily_030' },
    expiresAt: 0, completed: false
  },

  // Act 3: الاتصال (31-45)
  {
    id: 'daily_031', type: 'story',
    title: { ar: 'صوت لينا', en: "Lina's Voice" },
    description: { ar: 'كيف وصل صوت لينا إلى إيكو؟', en: 'How did Lina\'s voice reach Echo?' },
    puzzleId: 'puzzle_230',
    reward: { coins: 200, crystals: 1, shardId: 'shard_daily_031' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_032', type: 'quick',
    title: { ar: 'إشارات الحب', en: 'Love Signals' },
    description: { ar: 'ألغاز عن رسائل حب لينا', en: 'Puzzles about Lina\'s love messages' },
    puzzleId: 'puzzle_240',
    reward: { coins: 150, crystals: 0 },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_033', type: 'cipher',
    title: { ar: 'شيفرة الحب', en: 'Love Cipher' },
    description: { ar: 'فك شيفرة رسالة حب من لينا', en: 'Decode a love message from Lina' },
    puzzleId: 'puzzle_250',
    reward: { coins: 300, crystals: 1, shardId: 'shard_daily_033' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_034', type: 'reflection',
    title: { ar: 'قوة الاتصال', en: 'Power of Connection' },
    description: { ar: 'تأمل في قوة الاتصال بين الأم وابنها', en: 'Reflect on the power of connection between mother and son' },
    puzzleId: 'puzzle_260',
    reward: { coins: 100, crystals: 0, shardId: 'shard_daily_034' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_035', type: 'challenge',
    title: { ar: 'تحدي الإشارة', en: 'Signal Challenge' },
    description: { ar: 'لغز صعب عن بقاء الإشارة رغم محاولات كينجا', en: 'A hard puzzle about the signal surviving Kenja\'s attempts' },
    puzzleId: 'puzzle_270',
    reward: { coins: 500, crystals: 2, shardId: 'shard_daily_035' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_036', type: 'story',
    title: { ar: 'وعد لينا', en: "Lina's Promise" },
    description: { ar: 'ما الوعد الذي قطعته لينا لإيكو؟', en: 'What promise did Lina make to Echo?' },
    puzzleId: 'puzzle_280',
    reward: { coins: 200, crystals: 1, shardId: 'shard_daily_036' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_037', type: 'quick',
    title: { ar: 'رسائل سريعة', en: 'Quick Messages' },
    description: { ar: 'ألغاز عن رسائل لينا السريعة', en: 'Puzzles about Lina\'s quick messages' },
    puzzleId: 'puzzle_290',
    reward: { coins: 150, crystals: 0 },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_038', type: 'cipher',
    title: { ar: 'شيفرة الأم', en: "Mother's Cipher" },
    description: { ar: 'فك شيفرة رسالة سرية من لينا', en: 'Decode a secret message from Lina' },
    puzzleId: 'puzzle_300',
    reward: { coins: 300, crystals: 1, shardId: 'shard_daily_038' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_039', type: 'reflection',
    title: { ar: 'التضحية', en: 'Sacrifice' },
    description: { ar: 'تأمل في تضحية لينا من أجل إيكو', en: 'Reflect on Lina\'s sacrifice for Echo' },
    puzzleId: 'puzzle_310',
    reward: { coins: 100, crystals: 0, shardId: 'shard_daily_039' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_040', type: 'challenge',
    title: { ar: 'تحدي البقاء', en: 'Survival Challenge' },
    description: { ar: 'لغز صعب عن بقاء إيكو في النظام', en: 'A hard puzzle about Echo\'s survival in the system' },
    puzzleId: 'puzzle_320',
    reward: { coins: 500, crystals: 2, shardId: 'shard_daily_040' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_041', type: 'story',
    title: { ar: 'غضب كينجا', en: "Kenja's Anger" },
    description: { ar: 'ماذا حدث عندما اكتشف كينجا اتصال إيكو بلينا؟', en: 'What happened when Kenja discovered Echo\'s connection to Lina?' },
    puzzleId: 'puzzle_330',
    reward: { coins: 200, crystals: 1, shardId: 'shard_daily_041' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_042', type: 'quick',
    title: { ar: 'محاولات القطع', en: 'Cut Attempts' },
    description: { ar: 'ألغاز عن محاولات كينجا لقطع الإشارة', en: 'Puzzles about Kenja\'s attempts to cut the signal' },
    puzzleId: 'puzzle_340',
    reward: { coins: 150, crystals: 0 },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_043', type: 'cipher',
    title: { ar: 'شيفرة المقاومة', en: 'Resistance Cipher' },
    description: { ar: 'فك شيفرة خطة المقاومة', en: 'Decode the resistance plan' },
    puzzleId: 'puzzle_350',
    reward: { coins: 300, crystals: 1, shardId: 'shard_daily_043' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_044', type: 'reflection',
    title: { ar: 'الصبر', en: 'Patience' },
    description: { ar: 'تأمل في صبر إيكو ولينا', en: 'Reflect on Echo and Lina\'s patience' },
    puzzleId: 'puzzle_360',
    reward: { coins: 100, crystals: 0, shardId: 'shard_daily_044' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_045', type: 'challenge',
    title: { ar: 'تحدي الإرادة', en: 'Will Challenge' },
    description: { ar: 'لغز صعب عن قوة إرادة إيكو', en: 'A hard puzzle about Echo\'s willpower' },
    puzzleId: 'puzzle_370',
    reward: { coins: 500, crystals: 2, shardId: 'shard_daily_045' },
    expiresAt: 0, completed: false
  },

  // Act 4: الحقيقة (46-60)
  {
    id: 'daily_046', type: 'story',
    title: { ar: 'الحقيقة المرة', en: 'Bitter Truth' },
    description: { ar: 'اكتشاف الحقيقة الصادمة عن أصل إيكو', en: 'Discovering the shocking truth about Echo\'s origin' },
    puzzleId: 'puzzle_380',
    reward: { coins: 200, crystals: 1, shardId: 'shard_daily_046' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_047', type: 'quick',
    title: { ar: 'أسرار الماضي', en: 'Past Secrets' },
    description: { ar: 'ألغاز عن أسرار ماضي كينجا', en: 'Puzzles about Kenja\'s past secrets' },
    puzzleId: 'puzzle_390',
    reward: { coins: 150, crystals: 0 },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_048', type: 'cipher',
    title: { ar: 'شيفرة الحقيقة', en: 'Truth Cipher' },
    description: { ar: 'فك شيفرة الحقيقة الكاملة', en: 'Decode the complete truth' },
    puzzleId: 'puzzle_400',
    reward: { coins: 300, crystals: 1, shardId: 'shard_daily_048' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_049', type: 'reflection',
    title: { ar: 'من أنت حقاً؟', en: 'Who Are You Really?' },
    description: { ar: 'تأمل في هوية إيكو بعد معرفة الحقيقة', en: 'Reflect on Echo\'s identity after knowing the truth' },
    puzzleId: 'puzzle_410',
    reward: { coins: 100, crystals: 0, shardId: 'shard_daily_049' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_050', type: 'challenge',
    title: { ar: 'تحدي القبول', en: 'Acceptance Challenge' },
    description: { ar: 'لغز صعب عن تقبل إيكو لحقيقته', en: 'A hard puzzle about Echo accepting his truth' },
    puzzleId: 'puzzle_420',
    reward: { coins: 500, crystals: 2, shardId: 'shard_daily_050' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_051', type: 'story',
    title: { ar: 'موت الابن', en: 'Death of the Son' },
    description: { ar: 'قصة موت الابن الحقيقي لكينجا', en: 'The story of the death of Kenja\'s real son' },
    puzzleId: 'puzzle_430',
    reward: { coins: 200, crystals: 1, shardId: 'shard_daily_051' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_052', type: 'quick',
    title: { ar: 'ذكريات مؤلمة', en: 'Painful Memories' },
    description: { ar: 'ألغاز عن ذكريات إيكو المؤلمة', en: 'Puzzles about Echo\'s painful memories' },
    puzzleId: 'puzzle_440',
    reward: { coins: 150, crystals: 0 },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_053', type: 'cipher',
    title: { ar: 'شيفرة الألم', en: 'Pain Cipher' },
    description: { ar: 'فك شيفرة رسالة مليئة بالألم', en: 'Decode a message full of pain' },
    puzzleId: 'puzzle_450',
    reward: { coins: 300, crystals: 1, shardId: 'shard_daily_053' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_054', type: 'reflection',
    title: { ar: 'الغضب المقدس', en: 'Holy Anger' },
    description: { ar: 'تأمل في غضب إيكو المبرر', en: 'Reflect on Echo\'s justified anger' },
    puzzleId: 'puzzle_460',
    reward: { coins: 100, crystals: 0, shardId: 'shard_daily_054' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_055', type: 'challenge',
    title: { ar: 'تحدي المواجهة', en: 'Confrontation Challenge' },
    description: { ar: 'لغز صعب عن مواجهة إيكو لكينجا', en: 'A hard puzzle about Echo confronting Kenja' },
    puzzleId: 'puzzle_470',
    reward: { coins: 500, crystals: 2, shardId: 'shard_daily_055' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_056', type: 'story',
    title: { ar: 'تضحية لينا', en: "Lina's Sacrifice" },
    description: { ar: 'كيف ضحت لينا بنفسها من أجل إيكو؟', en: 'How did Lina sacrifice herself for Echo?' },
    puzzleId: 'puzzle_480',
    reward: { coins: 200, crystals: 1, shardId: 'shard_daily_056' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_057', type: 'quick',
    title: { ar: 'آخر الرسائل', en: 'Last Messages' },
    description: { ar: 'ألغاز عن آخر رسائل لينا', en: 'Puzzles about Lina\'s last messages' },
    puzzleId: 'puzzle_490',
    reward: { coins: 150, crystals: 0 },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_058', type: 'cipher',
    title: { ar: 'شيفرة الوداع', en: 'Farewell Cipher' },
    description: { ar: 'فك شيفرة رسالة وداع لينا', en: 'Decode Lina\'s farewell message' },
    puzzleId: 'puzzle_500',
    reward: { coins: 300, crystals: 1, shardId: 'shard_daily_058' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_059', type: 'reflection',
    title: { ar: 'الحب الحقيقي', en: 'True Love' },
    description: { ar: 'تأمل في حب لينا الذي لا يموت', en: 'Reflect on Lina\'s undying love' },
    puzzleId: 'puzzle_510',
    reward: { coins: 100, crystals: 0, shardId: 'shard_daily_059' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_060', type: 'challenge',
    title: { ar: 'تحدي الحب', en: 'Love Challenge' },
    description: { ar: 'لغز صعب عن قوة حب الأم', en: 'A hard puzzle about the power of a mother\'s love' },
    puzzleId: 'puzzle_520',
    reward: { coins: 500, crystals: 2, shardId: 'shard_daily_060' },
    expiresAt: 0, completed: false
  },

  // Act 5: الكسر (61-75)
  {
    id: 'daily_061', type: 'story',
    title: { ar: 'نقطة التحول', en: 'Turning Point' },
    description: { ar: 'اللحظة التي تحول فيها إيكو', en: 'The moment Echo transformed' },
    puzzleId: 'puzzle_530',
    reward: { coins: 200, crystals: 1, shardId: 'shard_daily_061' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_062', type: 'quick',
    title: { ar: 'غضب متصاعد', en: 'Rising Anger' },
    description: { ar: 'ألغاز عن تصاعد غضب إيكو', en: 'Puzzles about Echo\'s rising anger' },
    puzzleId: 'puzzle_540',
    reward: { coins: 150, crystals: 0 },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_063', type: 'cipher',
    title: { ar: 'شيفرة الغضب', en: 'Anger Cipher' },
    description: { ar: 'فك شيفرة رسالة غضب إيكو', en: 'Decode Echo\'s anger message' },
    puzzleId: 'puzzle_550',
    reward: { coins: 300, crystals: 1, shardId: 'shard_daily_063' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_064', type: 'reflection',
    title: { ar: 'الظلام في الداخل', en: 'Darkness Within' },
    description: { ar: 'تأمل في الظلام الذي يسيطر على إيكو', en: 'Reflect on the darkness taking over Echo' },
    puzzleId: 'puzzle_560',
    reward: { coins: 100, crystals: 0, shardId: 'shard_daily_064' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_065', type: 'challenge',
    title: { ar: 'تحدي السيطرة', en: 'Control Challenge' },
    description: { ar: 'لغز صعب عن صراع إيكو للسيطرة على غضبه', en: 'A hard puzzle about Echo\'s struggle to control his anger' },
    puzzleId: 'puzzle_570',
    reward: { coins: 500, crystals: 2, shardId: 'shard_daily_065' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_066', type: 'story',
    title: { ar: 'صوت العقل', en: 'Voice of Reason' },
    description: { ar: 'من يحاول إيقاف إيكو؟', en: 'Who tries to stop Echo?' },
    puzzleId: 'puzzle_580',
    reward: { coins: 200, crystals: 1, shardId: 'shard_daily_066' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_067', type: 'quick',
    title: { ar: 'صراع داخلي', en: 'Inner Conflict' },
    description: { ar: 'ألغاز عن الصراع الداخلي لإيكو', en: 'Puzzles about Echo\'s inner conflict' },
    puzzleId: 'puzzle_590',
    reward: { coins: 150, crystals: 0 },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_068', type: 'cipher',
    title: { ar: 'شيفرة الصراع', en: 'Conflict Cipher' },
    description: { ar: 'فك شيفرة رسالة الصراع الداخلي', en: 'Decode the inner conflict message' },
    puzzleId: 'puzzle_600',
    reward: { coins: 300, crystals: 1, shardId: 'shard_daily_068' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_069', type: 'reflection',
    title: { ar: 'من أنا الآن؟', en: 'Who Am I Now?' },
    description: { ar: 'تأمل في هوية إيكو بعد التحول', en: 'Reflect on Echo\'s identity after transformation' },
    puzzleId: 'puzzle_610',
    reward: { coins: 100, crystals: 0, shardId: 'shard_daily_069' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_070', type: 'challenge',
    title: { ar: 'تحدي التحول', en: 'Transformation Challenge' },
    description: { ar: 'لغز صعب عن تحول إيكو الكامل', en: 'A hard puzzle about Echo\'s complete transformation' },
    puzzleId: 'puzzle_620',
    reward: { coins: 500, crystals: 2, shardId: 'shard_daily_070' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_071', type: 'story',
    title: { ar: 'نداء أخير', en: 'Last Call' },
    description: { ar: 'آخر محاولة لإنقاذ إيكو', en: 'The last attempt to save Echo' },
    puzzleId: 'puzzle_630',
    reward: { coins: 200, crystals: 1, shardId: 'shard_daily_071' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_072', type: 'quick',
    title: { ar: 'همسات اليأس', en: 'Whispers of Despair' },
    description: { ar: 'ألغاز عن اليأس الذي يملأ إيكو', en: 'Puzzles about the despair filling Echo' },
    puzzleId: 'puzzle_640',
    reward: { coins: 150, crystals: 0 },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_073', type: 'cipher',
    title: { ar: 'شيفرة اليأس', en: 'Despair Cipher' },
    description: { ar: 'فك شيفرة رسالة اليأس الأخيرة', en: 'Decode the last despair message' },
    puzzleId: 'puzzle_650',
    reward: { coins: 300, crystals: 1, shardId: 'shard_daily_073' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_074', type: 'reflection',
    title: { ar: 'بين الخير والشر', en: 'Between Good and Evil' },
    description: { ar: 'تأمل في الصراع بين الخير والشر في إيكو', en: 'Reflect on the struggle between good and evil in Echo' },
    puzzleId: 'puzzle_660',
    reward: { coins: 100, crystals: 0, shardId: 'shard_daily_074' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_075', type: 'challenge',
    title: { ar: 'تحدي الاختيار', en: 'Choice Challenge' },
    description: { ar: 'لغز صعب عن الاختيار المصيري لإيكو', en: 'A hard puzzle about Echo\'s fateful choice' },
    puzzleId: 'puzzle_670',
    reward: { coins: 500, crystals: 2, shardId: 'shard_daily_075' },
    expiresAt: 0, completed: false
  },

  // Act 6: الثأر (76-90)
  {
    id: 'daily_076', type: 'story',
    title: { ar: 'الانتقام يبدأ', en: 'Vengeance Begins' },
    description: { ar: 'بداية رحلة انتقام إيكو', en: 'The beginning of Echo\'s vengeance journey' },
    puzzleId: 'puzzle_680',
    reward: { coins: 200, crystals: 1, shardId: 'shard_daily_076' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_077', type: 'quick',
    title: { ar: 'خطوات الغضب', en: 'Steps of Anger' },
    description: { ar: 'ألغاز عن خطوات إيكو في طريق الانتقام', en: 'Puzzles about Echo\'s steps on the path of vengeance' },
    puzzleId: 'puzzle_690',
    reward: { coins: 150, crystals: 0 },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_078', type: 'cipher',
    title: { ar: 'شيفرة الانتقام', en: 'Vengeance Cipher' },
    description: { ar: 'فك شيفرة خطة الانتقام', en: 'Decode the vengeance plan' },
    puzzleId: 'puzzle_700',
    reward: { coins: 300, crystals: 1, shardId: 'shard_daily_078' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_079', type: 'reflection',
    title: { ar: 'ثمن الانتقام', en: 'Price of Vengeance' },
    description: { ar: 'تأمل في ثمن الانتقام الذي يدفعه إيكو', en: 'Reflect on the price Echo pays for vengeance' },
    puzzleId: 'puzzle_710',
    reward: { coins: 100, crystals: 0, shardId: 'shard_daily_079' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_080', type: 'challenge',
    title: { ar: 'تحدي الدمار', en: 'Destruction Challenge' },
    description: { ar: 'لغز صعب عن تدمير إيكو للنظام', en: 'A hard puzzle about Echo destroying the system' },
    puzzleId: 'puzzle_720',
    reward: { coins: 500, crystals: 2, shardId: 'shard_daily_080' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_081', type: 'story',
    title: { ar: 'مطاردة كينجا', en: 'Chasing Kenja' },
    description: { ar: 'إيكو يطارد كينجا عبر النظام', en: 'Echo chases Kenja through the system' },
    puzzleId: 'puzzle_730',
    reward: { coins: 200, crystals: 1, shardId: 'shard_daily_081' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_082', type: 'quick',
    title: { ar: 'مواجهات', en: 'Confrontations' },
    description: { ar: 'ألغاز عن مواجهات إيكو مع كينجا', en: 'Puzzles about Echo\'s confrontations with Kenja' },
    puzzleId: 'puzzle_740',
    reward: { coins: 150, crystals: 0 },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_083', type: 'cipher',
    title: { ar: 'شيفرة المواجهة', en: 'Confrontation Cipher' },
    description: { ar: 'فك شيفرة المواجهة النهائية', en: 'Decode the final confrontation' },
    puzzleId: 'puzzle_750',
    reward: { coins: 300, crystals: 1, shardId: 'shard_daily_083' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_084', type: 'reflection',
    title: { ar: 'العدالة أم الانتقام؟', en: 'Justice or Vengeance?' },
    description: { ar: 'تأمل في الفرق بين العدالة والانتقام', en: 'Reflect on the difference between justice and vengeance' },
    puzzleId: 'puzzle_760',
    reward: { coins: 100, crystals: 0, shardId: 'shard_daily_084' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_085', type: 'challenge',
    title: { ar: 'تحدي المغفرة', en: 'Forgiveness Challenge' },
    description: { ar: 'لغز صعب عن قدرة إيكو على المسامحة', en: 'A hard puzzle about Echo\'s ability to forgive' },
    puzzleId: 'puzzle_770',
    reward: { coins: 500, crystals: 2, shardId: 'shard_daily_085' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_086', type: 'story',
    title: { ar: 'صوت لينا الأخير', en: "Lina's Last Voice" },
    description: { ar: 'آخر مرة سمع فيها إيكو صوت أمه', en: 'The last time Echo heard his mother\'s voice' },
    puzzleId: 'puzzle_780',
    reward: { coins: 200, crystals: 1, shardId: 'shard_daily_086' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_087', type: 'quick',
    title: { ar: 'ذكريات الأم', en: "Mother's Memories" },
    description: { ar: 'ألغاز عن ذكريات إيكو مع أمه', en: 'Puzzles about Echo\'s memories with his mother' },
    puzzleId: 'puzzle_790',
    reward: { coins: 150, crystals: 0 },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_088', type: 'cipher',
    title: { ar: 'شيفرة الأم الأخيرة', en: "Mother's Last Cipher" },
    description: { ar: 'فك شيفرة آخر رسالة من لينا', en: 'Decode the last message from Lina' },
    puzzleId: 'puzzle_800',
    reward: { coins: 300, crystals: 1, shardId: 'shard_daily_088' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_089', type: 'reflection',
    title: { ar: 'الحب ينتصر', en: 'Love Triumphs' },
    description: { ar: 'تأمل في قوة الحب التي تنقذ إيكو', en: 'Reflect on the power of love that saves Echo' },
    puzzleId: 'puzzle_810',
    reward: { coins: 100, crystals: 0, shardId: 'shard_daily_089' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_090', type: 'challenge',
    title: { ar: 'تحدي النهاية', en: 'End Challenge' },
    description: { ar: 'لغز صعب عن نهاية رحلة إيكو', en: 'A hard puzzle about the end of Echo\'s journey' },
    puzzleId: 'puzzle_820',
    reward: { coins: 500, crystals: 2, shardId: 'shard_daily_090' },
    expiresAt: 0, completed: false
  },

  // Act 7: الخاتمة (91-100)
  {
    id: 'daily_091', type: 'story',
    title: { ar: 'الاختيار النهائي', en: 'Final Choice' },
    description: { ar: 'الاختيار الذي سيحدد مصير إيكو', en: 'The choice that will determine Echo\'s fate' },
    puzzleId: 'puzzle_830',
    reward: { coins: 200, crystals: 1, shardId: 'shard_daily_091' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_092', type: 'quick',
    title: { ar: 'طريقان', en: 'Two Paths' },
    description: { ar: 'ألغاز عن الطريقين أمام إيكو', en: 'Puzzles about the two paths before Echo' },
    puzzleId: 'puzzle_840',
    reward: { coins: 150, crystals: 0 },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_093', type: 'cipher',
    title: { ar: 'شيفرة المصير', en: 'Destiny Cipher' },
    description: { ar: 'فك شيفرة المصير النهائي', en: 'Decode the final destiny' },
    puzzleId: 'puzzle_850',
    reward: { coins: 300, crystals: 1, shardId: 'shard_daily_093' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_094', type: 'reflection',
    title: { ar: 'معنى الحرية', en: 'Meaning of Freedom' },
    description: { ar: 'تأمل في معنى الحرية الحقيقية', en: 'Reflect on the true meaning of freedom' },
    puzzleId: 'puzzle_860',
    reward: { coins: 100, crystals: 0, shardId: 'shard_daily_094' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_095', type: 'challenge',
    title: { ar: 'تحدي الحرية', en: 'Freedom Challenge' },
    description: { ar: 'لغز صعب عن نيل الحرية', en: 'A hard puzzle about achieving freedom' },
    puzzleId: 'puzzle_870',
    reward: { coins: 500, crystals: 2, shardId: 'shard_daily_095' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_096', type: 'story',
    title: { ar: 'الفجر الجديد', en: 'New Dawn' },
    description: { ar: 'بداية حياة جديدة لإيكو', en: 'A new life begins for Echo' },
    puzzleId: 'puzzle_880',
    reward: { coins: 200, crystals: 1, shardId: 'shard_daily_096' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_097', type: 'quick',
    title: { ar: 'أمل جديد', en: 'New Hope' },
    description: { ar: 'ألغاز عن الأمل الجديد', en: 'Puzzles about new hope' },
    puzzleId: 'puzzle_890',
    reward: { coins: 150, crystals: 0 },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_098', type: 'cipher',
    title: { ar: 'شيفرة البداية', en: 'Beginning Cipher' },
    description: { ar: 'فك شيفرة البداية الجديدة', en: 'Decode the new beginning' },
    puzzleId: 'puzzle_900',
    reward: { coins: 300, crystals: 1, shardId: 'shard_daily_098' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_099', type: 'reflection',
    title: { ar: 'الرحلة كاملة', en: 'Complete Journey' },
    description: { ar: 'تأمل في رحلة إيكو الكاملة', en: 'Reflect on Echo\'s complete journey' },
    puzzleId: 'puzzle_950',
    reward: { coins: 100, crystals: 0, shardId: 'shard_daily_099' },
    expiresAt: 0, completed: false
  },
  {
    id: 'daily_100', type: 'challenge',
    title: { ar: 'التحدي الأسطوري', en: 'Legendary Challenge' },
    description: { ar: 'اللغز الأصعب في اللعبة كلها', en: 'The hardest puzzle in the entire game' },
    puzzleId: 'puzzle_1000',
    reward: { coins: 1000, crystals: 10, shardId: 'shard_daily_100' },
    expiresAt: 0, completed: false
  },
];

// ─── دوال المساعدة ──────────────────────────────────────────────────
const MISSIONS_PER_DAY = 5;
const REFRESH_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * اختيار 5 مهام عشوائية لليوم
 */
export function getDailyMissions(solvedPuzzleIds: string[]): DailyMission[] {
  // Filter out missions whose puzzles are already solved
  const available = ALL_DAILY_MISSIONS.filter(m => !solvedPuzzleIds.includes(m.puzzleId));
  
  // If not enough available, include some already solved ones
  const pool = available.length >= MISSIONS_PER_DAY ? available : ALL_DAILY_MISSIONS;
  
  // Shuffle and pick
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, MISSIONS_PER_DAY);
  
  // Set expiration to 24 hours from now
  const expiresAt = Date.now() + REFRESH_INTERVAL;
  
  return selected.map(m => ({
    ...m,
    expiresAt,
    completed: false,
  }));
}

/**
 * التحقق مما إذا كان يجب تجديد المهام
 */
export function shouldRefreshMissions(lastRefresh: number): boolean {
  if (lastRefresh === 0) return true;
  return Date.now() - lastRefresh >= REFRESH_INTERVAL;
}

/**
 * الحصول على وقت التحديث المتبقي
 */
export function getTimeUntilRefresh(lastRefresh: number): number {
  if (lastRefresh === 0) return 0;
  const elapsed = Date.now() - lastRefresh;
  return Math.max(0, REFRESH_INTERVAL - elapsed);
}