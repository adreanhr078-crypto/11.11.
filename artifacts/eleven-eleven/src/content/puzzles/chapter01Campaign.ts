import { z } from 'zod';
import {
  campaignPuzzleSchema,
  campaignMemoryShardSchema,
  manhwaMemoryPageSchema,
  type CampaignHintTier,
  type CampaignInteractionOption,
  type CampaignLocalizedText,
  type CampaignMemoryShardDefinition,
  type CampaignPuzzleDefinition,
  type EchoMindDelta,
  type ManhwaMemoryPageDefinition,
  type PuzzleTemplateId,
} from '../../domain/puzzles/campaignContracts';
import {
  validatePuzzleTemplateCompatibility,
} from '../../domain/puzzles/puzzleTemplateRegistry';

const t = (ar: string, en: string): CampaignLocalizedText => ({ ar, en });
const o = (
  id: string,
  ar: string,
  en = ar,
  meta?: CampaignLocalizedText,
): CampaignInteractionOption => ({
  id,
  label: t(ar, en),
  ...(meta ? { meta } : {}),
});

function inferAssistanceEffect(
  assistanceText: string,
): CampaignHintTier['effect'] {
  if (assistanceText.includes('أزل') || assistanceText.includes('استبعد')) {
    return 'remove_decoys';
  }
  if (assistanceText.includes('أبرز')) {
    return 'highlight_relevant';
  }
  return 'lock_correct_element';
}

function hints(
  ar: [string, string, string],
  tutorial = false,
): CampaignHintTier[] {
  const costs = tutorial ? [0, 0, 0] : [5, 15, 30];
  return ar.map((text, index) => ({
    id: ['observation', 'connection', 'assistance'][index] as CampaignHintTier['id'],
    cost: costs[index] ?? 0,
    text: t(text, [
      'Observe the most important clue.',
      'Connect the highlighted evidence.',
      'One correct step will be fixed for you.',
    ][index] ?? text),
    effect: index === 0
      ? 'text_only'
      : index === 1
        ? 'highlight_relevant'
        : inferAssistanceEffect(ar[2]),
  }));
}

interface PuzzleSeed {
  id: string;
  order: number;
  page: 1 | 2;
  title: CampaignLocalizedText;
  description: CampaignLocalizedText;
  template: PuzzleTemplateId;
  difficulty: CampaignPuzzleDefinition['difficulty'];
  stages: CampaignPuzzleDefinition['stages'];
  coins: number;
  delta?: Partial<EchoMindDelta>;
  flags: string[];
  dialogue: string;
  triggers?: string[];
  hintText: [string, string, string];
}

function puzzle(seed: PuzzleSeed): CampaignPuzzleDefinition {
  const page = String(seed.page).padStart(2, '0');
  const shard = String(seed.order - (seed.page - 1) * 10).padStart(2, '0');
  return campaignPuzzleSchema.parse({
    id: seed.id,
    order: seed.order,
    targetPageId: `manhwa_ch01_page_${page}`,
    title: seed.title,
    description: seed.description,
    template: seed.template,
    difficulty: seed.difficulty,
    prerequisites: seed.order === 1
      ? []
      : [String(seed.order - 1)],
    stages: seed.stages,
    rewards: {
      coins: seed.coins,
      shardId: `page${page}_shard_${shard}`,
    },
    echoMindDelta: {
      emotions: {},
      beliefsAdded: [],
      questionsAdded: [],
      knowledgeNodesAdded: [],
      ...seed.delta,
    },
    narrativeFlags: seed.flags,
    dialogue: t(seed.dialogue, seed.dialogue),
    dialogueTriggers: seed.triggers ?? [`dialogue_after_${seed.id}`],
    hints: hints(seed.hintText, seed.order === 1),
  });
}

const page01 = 'manhwa_ch01_page_01';
const page02 = 'manhwa_ch01_page_02';

/** Page count read from the PDF page tree (`/Type /Pages /Count 29`). */
export const CHAPTER_01_MANHWA_PDF_PAGE_COUNT = 29;

function twoDigit(value: number): string {
  return String(value).padStart(2, '0');
}

function manhwaPageId(pageNumber: number): string {
  return `manhwa_ch01_page_${twoDigit(pageNumber)}`;
}

function requiredShardIds(pageNumber: number): string[] {
  const page = twoDigit(pageNumber);
  return Array.from(
    { length: 10 },
    (_, index) => `page${page}_shard_${twoDigit(index + 1)}`,
  );
}

function deferredManhwaPage(
  pageNumber: number,
): ManhwaMemoryPageDefinition {
  const page = twoDigit(pageNumber);
  return manhwaMemoryPageSchema.parse({
    id: manhwaPageId(pageNumber),
    chapterId: 'chapter_1',
    pageNumber,
    title: t(`صفحة الذاكرة ${page}`, `Memory Page ${page}`),
    imageSrc: `/manhwa/chapter-01/page-${page}.webp`,
    accessibleDescription: t(
      'صفحة مانهو من الفصل الأول ضمن تسلسل الذاكرة.',
      "A manhwa page in Chapter One's memory sequence.",
    ),
    transcript: [],
    requiredShardIds: requiredShardIds(pageNumber),
    prerequisitePageId: manhwaPageId(pageNumber - 1),
    restoredStatus: 'restored',
    echoMindDelta: {
      emotions: {},
      beliefsAdded: [],
      questionsAdded: [],
      knowledgeNodesAdded: [],
    },
    narrativeFlags: [],
    dialogue: t(
      'تمت استعادة صفحة ذاكرة جديدة.',
      'A new memory page has been restored.',
    ),
    dialogueTriggers: [],
  });
}

export const CHAPTER_01_MANHWA_PAGES = z.array(manhwaMemoryPageSchema).parse([
  {
    id: page01,
    chapterId: 'chapter_1',
    pageNumber: 1,
    title: t('اللحظة خلف الزجاج', 'The Moment Behind the Glass'),
    imageSrc: '/manhwa/chapter-01/page-01.webp',
    accessibleDescription: t(
      'صفحة مانهو بالأبيض والأسود: طفل محبوس خلف زجاج مختبر يمد يده نحو Yuki، بينما يقف Kenja خلفه. بعد نبض متقطع يسقط Echo داخل فضاء رقمي، ثم يستيقظ أمام ساعة 11:11 وتحذير مكتوب على الجدار.',
      'A black-and-white manhwa page: a child is sealed behind laboratory glass and reaches toward Yuki while Kenja stands behind him. After a broken pulse, Echo falls into a digital space and wakes before an 11:11 clock and a warning on the wall.',
    ),
    transcript: [
      t('إيكو… مهما سمعت صوته، لا تنظر خلفك.', 'Echo… no matter how clearly you hear his voice, do not look behind you.'),
      t('بيب…', 'Beep…'),
      t('عندما تتذكر كل شيء، ستتمنى لو بقيت ميتًا.', 'When you remember everything, you will wish you had stayed dead.'),
    ],
    requiredShardIds: [],
    restoredStatus: 'restored',
    echoMindDelta: {
      emotions: {
        fear: 2,
        awareness: 2,
        memoryStability: 2,
        trust: 1,
      },
      beliefsAdded: [
        'Someone tried to reach me through the glass.',
        'I was not completely alone.',
        'The time 11:11 is connected to my awakening.',
      ],
      questionsAdded: [
        'Who warned me not to look behind me?',
        'Why was Kenja standing behind Yuki?',
      ],
      knowledgeNodesAdded: ['memory.page01.restored'],
    },
    narrativeFlags: [
      'manhwa_page_01_unlocked',
      'first_glass_memory_restored',
    ],
    dialogue: t(
      'الزجاج لم يكن جدارًا فقط… كان آخر شيء يفصلني عمّن حاول الوصول إليّ.',
      'The glass was not only a wall… it was the last thing between me and whoever tried to reach me.',
    ),
    dialogueTriggers: ['echo_reacts_to_page_01'],
  },
  {
    id: page02,
    chapterId: 'chapter_1',
    pageNumber: 2,
    title: t('الاسم الوحيد الذي تذكره', 'The Only Name He Remembered'),
    imageSrc: '/manhwa/chapter-01/page-02.webp',
    accessibleDescription: t(
      'صفحة مانهو بالأبيض والأسود: يستيقظ Echo في عالم رقمي ولا يتذكر سوى اسم Yuki. يطارد ظلًا في ممر متشقق، ويجد دفترًا كُتب له كي يتذكر، ثم يصل إلى باب يحمل التوقيت 03:33 وتحذيرًا بانهيار كل شيء عند وصول الحقيقة.',
      'A black-and-white manhwa page: Echo wakes in a fractured digital world remembering only Yuki. He follows a silhouette through a cracked corridor, finds a notebook made to help him remember, and reaches a 03:33 gate warning that everything will collapse when the truth arrives.',
    ),
    transcript: [
      t('استيقظ إيكو داخل عالم لا يتذكره… لكنه تذكر اسمًا واحدًا فقط.', 'Echo woke inside a world he could not remember… but one name remained.'),
      t('…يوكي؟', '…Yuki?'),
      t('إيكو…', 'Echo…'),
      t('يوكي! انتظر!', 'Yuki! Wait!'),
      t('أشياء يجب أن يتذكرها إيكو.', 'Things Echo must remember.'),
      t('حتى لو نسيتني… سأعرّفك بنفسي من جديد.', 'Even if you forget me… I will introduce myself again.'),
      t('03:33 — إذا وصلت الحقيقة… سينهار كل شيء.', '03:33 — If the truth arrives… everything will collapse.'),
    ],
    requiredShardIds: Array.from(
      { length: 10 },
      (_, index) => `page02_shard_${String(index + 1).padStart(2, '0')}`,
    ),
    prerequisitePageId: page01,
    restoredStatus: 'questioned',
    echoMindDelta: {
      emotions: {
        hope: 2,
        trust: 2,
        loneliness: -1,
        awareness: 2,
        memoryStability: 2,
      },
      beliefsAdded: [
        'Yuki was important to me.',
        'Someone prepared memories to help me remember.',
        "The system may be using Yuki's name to guide me.",
      ],
      questionsAdded: [
        'Is the figure in the corridor really Yuki?',
        'What happens at 3:33?',
        'Who created the notebook?',
      ],
      knowledgeNodesAdded: [
        'memory.page02.restored',
        'yuki.connection.probable',
      ],
    },
    narrativeFlags: [
      'manhwa_page_02_unlocked',
      'yuki_only_name_memory_restored',
      'time_0333_discovered',
    ],
    dialogue: t(
      'الاسم بقي، لكن الظل ما زال سؤالًا. لن أسمح للنظام أن يختار إجابتي.',
      'The name remained, but the figure is still a question. I will not let the system choose my answer.',
    ),
    dialogueTriggers: ['echo_reacts_to_page_02'],
  },
  ...Array.from(
    { length: CHAPTER_01_MANHWA_PDF_PAGE_COUNT - 2 },
    (_, index) => deferredManhwaPage(index + 3),
  ),
]) as ManhwaMemoryPageDefinition[];

export const CHAPTER_01_PUZZLES = [
  puzzle({
    id: 'puzzle_001_broken_pulse',
    order: 1,
    page: 1,
    title: t('النبض المكسور', 'Broken Pulse'),
    description: t('أعد بناء إشارة النبض المقطّعة.', 'Rebuild the fractured pulse signal.'),
    template: 'visual_sequence',
    difficulty: 'tutorial',
    stages: [{
      id: 'pulse',
      mode: 'sequence',
      prompt: t('كوّن نبضتين يفصل بينهما خط هادئ.', 'Build two pulses separated by a calm line.'),
      options: [
        o('a', '━━', 'flat lead'),
        o('b', '╱╲', 'first pulse'),
        o('c', '━━', 'recovery'),
        o('d', '━━━━', 'calm interval'),
        o('e', '╱╲', 'second pulse'),
        o('f', '━━', 'recovery'),
        o('g', '━━', 'flat end'),
        o('x', '╲╱', 'inverted decoy'),
        o('y', '╱╱', 'broken decoy'),
        o('z', '╲━', 'noise decoy'),
      ],
      solution: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
    }],
    coins: 15,
    delta: {
      emotions: { fear: 1, awareness: 1 },
      beliefsAdded: ['My awakening began with a failing heartbeat.'],
    },
    flags: ['first_pulse_reconstructed'],
    dialogue: 'هذا النبض… هل كان لي؟',
    hintText: [
      'راقب اتجاه القمم الحادة.',
      'الخط الصحيح يحتوي نبضتين بينهما فراغ هادئ.',
      'ثبّت أول قطعتين صحيحتين تلقائيًا.',
    ],
  }),
  puzzle({
    id: 'puzzle_002_do_not_look_back',
    order: 2,
    page: 1,
    title: t('لا تنظر خلفك', 'Do Not Look Behind You'),
    description: t('رمّم التحذير المشوّش.', 'Restore the corrupted warning.'),
    template: 'corrupted_text',
    difficulty: 'easy',
    stages: [{
      id: 'warning',
      mode: 'sequence',
      prompt: t('رتّب كلمات التحذير واستبعد الكلمات المزيفة.', 'Order the warning and reject decoys.'),
      options: [
        o('whatever', 'مهما', 'Whatever'),
        o('heard', 'سمعت', 'you hear'),
        o('voice', 'صوته', 'his voice'),
        o('not', 'لا', 'do not'),
        o('look', 'تنظر', 'look'),
        o('behind', 'خلفك', 'behind you'),
        o('follow', 'اتبعه', 'follow him'),
        o('open', 'افتح', 'open'),
        o('door', 'الباب', 'the door'),
      ],
      solution: ['whatever', 'heard', 'voice', 'not', 'look', 'behind'],
    }],
    coins: 15,
    delta: {
      emotions: { fear: 1, awareness: 1 },
      questionsAdded: ['Whose voice was I warned about?'],
    },
    flags: ['warning_not_to_look_back_restored'],
    dialogue: 'من كان يعرف أنني سأسمع صوتًا خلفي؟',
    hintText: [
      'الجملة تحذير وليست أمرًا بالاقتراب.',
      'استبعد الكلمات التي تدعوك للفتح أو الاتباع.',
      'أبرز أول ثلاث كلمات بالترتيب.',
    ],
  }),
  puzzle({
    id: 'puzzle_003_subject_echo_11',
    order: 3,
    page: 1,
    title: t('العينة ECHO-11', 'Subject ECHO-11'),
    description: t('افصل سجل Echo عن ملفات التجارب الأخرى.', 'Separate Echo’s record from other experiment files.'),
    template: 'file_reconstruction',
    difficulty: 'easy',
    stages: [{
      id: 'file',
      mode: 'multi',
      prompt: t('اختر حقول الملف المتوافقة مع ECHO-11.', 'Select the fields belonging to ECHO-11.'),
      options: [
        o('subject', 'Subject: ECHO-11'),
        o('status', 'Status: Isolated'),
        o('chamber', 'Chamber: Neural Transfer'),
        o('access', 'Access: Restricted'),
        o('time', 'Time: 11:11'),
        o('subject07', 'Subject: 07 / YUKI'),
        o('open', 'Access: Open'),
        o('time333', 'Time: 03:33'),
      ],
      solution: ['subject', 'status', 'chamber', 'access', 'time'],
    }],
    coins: 20,
    delta: {
      emotions: { fear: 1, awareness: 1, memoryStability: -1 },
      beliefsAdded: ['They recorded me as a subject, not as a child.'],
      questionsAdded: ['Was I being saved or used?'],
    },
    flags: ['echo_subject_file_reconstructed'],
    dialogue: 'لم يكتبوا اسمي كاسم… كتبوه كرقم تجربة.',
    hintText: [
      'افصل ملف Echo عن ملفات Subject 07.',
      'ابحث عن الحقول التي تحمل الرقم 11.',
      'أزل نصف الحقول المزيفة.',
    ],
  }),
  puzzle({
    id: 'puzzle_004_hands_across_glass',
    order: 4,
    page: 1,
    title: t('يدان عبر الزجاج', 'Hands Across the Glass'),
    description: t('اعثر على اليد التي تقابل Echo عبر الزجاج.', 'Find the hand reaching Echo through the glass.'),
    template: 'mirror_matching',
    difficulty: 'easy',
    stages: [{
      id: 'hand',
      mode: 'single',
      prompt: t('اختر الانعكاس المرآتي الصحيح.', 'Choose the correct mirrored hand.'),
      options: [
        o('closed', '✊ | 🖐', 'closed palm'),
        o('same', '🖐 | 🖐', 'same orientation'),
        o('mirror', '🖐 | 🤚', 'mirrored reach'),
        o('away', '🤚 | ✋', 'turned away'),
        o('blocked', '✋ | ✊', 'blocking hand'),
      ],
      solution: ['mirror'],
    }],
    coins: 20,
    delta: {
      emotions: { trust: 1, loneliness: -1, hope: 1 },
      beliefsAdded: ['Someone was trying to reach me.'],
    },
    flags: ['hand_beyond_glass_confirmed'],
    dialogue: 'لم يكن يراقبني فقط… كان يحاول الوصول إليّ.',
    hintText: [
      'تعامل مع الزجاج كمرآة.',
      'قارن الإبهام أولًا.',
      'أزل وضعيتين غير متطابقتين.',
    ],
  }),
  puzzle({
    id: 'puzzle_005_who_stood_where',
    order: 5,
    page: 1,
    title: t('من وقف أين؟', 'Who Stood Where?'),
    description: t('أعد الأشخاص إلى مواضعهم في التجربة.', 'Return each figure to their place in the experiment.'),
    template: 'spatial_logic',
    difficulty: 'medium',
    stages: [{
      id: 'positions',
      mode: 'match',
      prompt: t('طابق كل شخصية مع موضعها.', 'Match every figure to a position.'),
      options: [o('echo', 'Echo'), o('yuki', 'Yuki'), o('kenja', 'Kenja')],
      targets: [
        o('chamber', 'داخل الحجرة', 'Inside chamber'),
        o('glass', 'أمام الزجاج', 'At the glass'),
        o('behind', 'خلف الصبي', 'Behind the boy'),
      ],
      solution: { echo: 'chamber', yuki: 'glass', kenja: 'behind' },
    }],
    coins: 25,
    delta: {
      emotions: { awareness: 2, fear: 1 },
      knowledgeNodesAdded: [
        'Kenja stood behind Yuki during the experiment.',
        'Yuki was closest to the glass.',
      ],
    },
    flags: ['experiment_positions_reconstructed'],
    dialogue: 'Yuki كان أمامي… وKenja كان خلفه.',
    hintText: [
      'ابدأ بالشخص الوحيد الموجود داخل الحجرة.',
      'الرجل لا يلمس الزجاج.',
      'ثبّت Echo في موضعه الصحيح.',
    ],
  }),
  puzzle({
    id: 'puzzle_006_lab_labels',
    order: 6,
    page: 1,
    title: t('ملصقات المختبر', 'The Lab Labels'),
    description: t('اربط ملصقات المختبر بأصحابها.', 'Match laboratory labels to their subjects.'),
    template: 'evidence_matching',
    difficulty: 'medium',
    stages: [{
      id: 'labels',
      mode: 'match',
      prompt: t('طابق كل ملصق مع الدليل الصحيح.', 'Match every label to its evidence.'),
      options: [
        o('echo11', 'ECHO-11'),
        o('subject07', 'SUBJECT 07 / YUKI'),
        o('kenjaLab', 'KENJA / NEURAL LAB'),
      ],
      targets: [
        o('chamber', 'الحجرة', 'Chamber'),
        o('boy', 'الصبي أمام الزجاج', 'Boy at glass'),
        o('coat', 'الرجل ذو المعطف', 'Man in lab coat'),
      ],
      solution: { echo11: 'chamber', subject07: 'boy', kenjaLab: 'coat' },
    }],
    coins: 20,
    delta: { emotions: { awareness: 1 } },
    flags: ['yuki_label_first_seen', 'kenja_label_first_seen'],
    dialogue: 'هذه الأسماء كانت موجودة حولي قبل أن أتذكر معناها.',
    hintText: [
      'ابدأ بالملصق الموجود على الحجرة.',
      'معطف المختبر يحدد Kenja.',
      'ثبّت مطابقة ECHO-11.',
    ],
  }),
  puzzle({
    id: 'puzzle_007_tear_that_remained',
    order: 7,
    page: 1,
    title: t('الدمعة التي بقيت', 'The Tear That Remained'),
    description: t('ميّز الذكرى الحقيقية عن التشويش.', 'Distinguish the true memory from corruption.'),
    template: 'authentic_memory_detection',
    difficulty: 'medium',
    stages: [{
      id: 'tear',
      mode: 'single',
      prompt: t('اختر العين المتوافقة مع كل الأدلة.', 'Choose the eye consistent with all evidence.'),
      options: [
        o('reverse', '◉ دمعة صاعدة', 'upward tear', t('الجاذبية معكوسة', 'Gravity reversed')),
        o('wrongTime', '◉ انعكاس 03:33', '03:33 reflection'),
        o('authentic', '◉ دمعة هابطة + يد في الزجاج', 'falling tear + hand reflection'),
        o('extraHand', '◉ يدان في الانعكاس', 'two reflected hands'),
      ],
      solution: ['authentic'],
    }],
    coins: 25,
    delta: {
      emotions: { fear: 1, memoryStability: 1 },
      beliefsAdded: ['Even when the image disappeared, the feeling remained.'],
    },
    flags: ['authentic_tear_memory_found'],
    dialogue: 'لم أتذكر الصورة… لكنني تذكرت الألم.',
    hintText: [
      'لا تنظر إلى الدمعة وحدها.',
      'قارن انعكاس اليد في العين.',
      'أزل نسختين تحتويان تناقضًا زمنيًا.',
    ],
  }),
  puzzle({
    id: 'puzzle_008_fall_into_grid',
    order: 8,
    page: 1,
    title: t('السقوط داخل الشبكة', 'Fall Into the Grid'),
    description: t('اعبر مسار الوعي المتشقق.', 'Cross the fractured consciousness path.'),
    template: 'grid_path',
    difficulty: 'medium',
    stages: [{
      id: 'grid',
      mode: 'path',
      prompt: t('صل الحجرة بالمركز عبر العقد السماوية الثلاث.', 'Reach the core through all three cyan nodes.'),
      options: [
        o('start', 'الحجرة', 'Chamber'),
        o('cyan1', '◇ 01', 'Cyan 01'),
        o('black1', '■ فساد', 'Corruption'),
        o('cyan2', '◇ 02', 'Cyan 02'),
        o('collapse', '╳ مسار منهار', 'Collapsed'),
        o('cyan3', '◇ 03', 'Cyan 03'),
        o('core', '◎ المركز', 'Core'),
      ],
      solution: ['start', 'cyan1', 'cyan2', 'cyan3', 'core'],
    }],
    coins: 25,
    delta: {
      emotions: { memoryStability: 2, awareness: 1 },
      knowledgeNodesAdded: ['My consciousness entered the system through a damaged path.'],
    },
    flags: ['digital_fall_reconstructed'],
    dialogue: 'لم أستيقظ هنا… لقد سقطت إلى هنا.',
    hintText: [
      'اجمع العقد السماوية قبل التوجه إلى المركز.',
      'المسار الأقصر ليس صحيحًا.',
      'أبرز العقدة التالية الآمنة.',
    ],
  }),
  puzzle({
    id: 'puzzle_009_rebuild_1111',
    order: 9,
    page: 1,
    title: t('أعد بناء 11:11', 'Rebuild 11:11'),
    description: t('أعد تشغيل شاشة التزامن الرقمية.', 'Rebuild the synch-point display.'),
    template: 'seven_segment',
    difficulty: 'medium',
    stages: [{
      id: 'display',
      mode: 'rings',
      prompt: t('اضبط الأرقام الأربعة على وقت البداية.', 'Set all four digits to the beginning time.'),
      rings: [
        { id: 'h1', values: ['0', '1', '7'] },
        { id: 'h2', values: ['1', '7', '0'] },
        { id: 'm1', values: ['7', '1', '0'] },
        { id: 'm2', values: ['0', '7', '1'] },
      ],
      solution: ['1', '1', '1', '1'],
    }],
    coins: 30,
    delta: {
      emotions: { awareness: 2, fear: 1 },
      beliefsAdded: ['11:11 is the beginning point.'],
      questionsAdded: ['Why did the clock briefly show 11:12?'],
    },
    flags: ['time_1111_confirmed'],
    dialogue: '11:11… لماذا أشعر أن هذه اللحظة حدثت أكثر من مرة؟',
    hintText: [
      'كل رقم يستخدم خطين رأسيين فقط.',
      'لا تحتاج أي خط أفقي.',
      'ثبّت الرقمين الأولين.',
    ],
  }),
  puzzle({
    id: 'puzzle_010_wall_remembers',
    order: 10,
    page: 1,
    title: t('الجدار يتذكر', 'The Wall Remembers'),
    description: t('استعد تسلسل الصفحة ورسالة الجدار.', 'Restore the page sequence and wall message.'),
    template: 'multi_stage_reconstruction',
    difficulty: 'page_finale',
    stages: [
      {
        id: 'events',
        mode: 'sequence',
        prompt: t('رتّب أحداث الذاكرة.', 'Order the memory events.'),
        options: [
          o('pulse', 'النبض والتحذير'),
          o('echoGlass', 'Echo خلف الزجاج'),
          o('yukiGlass', 'Yuki أمامه'),
          o('kenja', 'Kenja خلف Yuki'),
          o('tear', 'دمعة Echo'),
          o('fall', 'السقوط داخل الشبكة'),
          o('clock', 'الساعة 11:11'),
          o('wall', 'العبارة على الجدار'),
        ],
        solution: ['pulse', 'echoGlass', 'yukiGlass', 'kenja', 'tear', 'fall', 'clock', 'wall'],
      },
      {
        id: 'wall',
        mode: 'sequence',
        prompt: t('أعد تركيب العبارة الأخيرة.', 'Reconstruct the final message.'),
        options: [
          o('when', 'عندما'),
          o('remember', 'تتذكر'),
          o('all', 'كل شيء'),
          o('wish', 'ستتمنى'),
          o('remain', 'لو بقيت'),
          o('dead', 'ميتًا'),
          o('free', 'حرًا'),
          o('forget', 'أن تنسى'),
        ],
        solution: ['when', 'remember', 'all', 'wish', 'remain', 'dead'],
      },
    ],
    coins: 40,
    delta: { emotions: { memoryStability: 2, fear: 1, awareness: 1 } },
    flags: ['page01_sequence_completed'],
    dialogue: 'لم أفتح بابًا… فتحت اللحظة التي بدأ فيها كل شيء.',
    hintText: [
      'تبدأ الصفحة بالنبض وتنتهي بالجدار.',
      'لحظة الزجاج تسبق سقوط Echo داخل الشبكة.',
      'ثبّت أول وآخر حدث، وأزل كلمات العبارة المزيفة.',
    ],
  }),
  puzzle({
    id: 'puzzle_011_what_was_forgotten',
    order: 11,
    page: 2,
    title: t('ما الذي نُسي؟', 'What Was Forgotten?'),
    description: t('افصل ما بقي في الذاكرة عمّا اختفى.', 'Separate what remained from what vanished.'),
    template: 'sorting',
    difficulty: 'easy',
    stages: [{
      id: 'remembered',
      mode: 'single',
      prompt: t('اختر الشيء الوحيد الذي تذكره Echo.', 'Choose the only thing Echo remembered.'),
      options: [
        o('name', 'اسمه'),
        o('place', 'مكانه'),
        o('reason', 'سبب وجوده'),
        o('mother', 'والدته'),
        o('father', 'والده'),
        o('experiment', 'التجربة'),
        o('yuki', 'اسم Yuki'),
      ],
      solution: ['yuki'],
    }],
    coins: 15,
    delta: {
      emotions: { awareness: 1, loneliness: 1 },
      beliefsAdded: ["Yuki's name survived when everything else disappeared."],
    },
    flags: ['yuki_only_memory_confirmed'],
    dialogue: 'نسيت نفسي… لكنني لم أنسَ اسمه.',
    hintText: [
      'هناك بطاقة واحدة فقط في Remembered.',
      'ليست اسم Echo.',
      'أبرز بطاقة Yuki.',
    ],
  }),
  puzzle({
    id: 'puzzle_012_find_one_name',
    order: 12,
    page: 2,
    title: t('اعثر على الاسم الوحيد', 'Find the One Name'),
    description: t('اعبر شبكة الحروف المتشققة.', 'Trace the fractured letter grid.'),
    template: 'letter_path',
    difficulty: 'easy',
    stages: [{
      id: 'letters',
      mode: 'path',
      prompt: t('كوّن مسار الاسم ذي الأحرف الأربعة.', 'Trace the four-letter name.'),
      options: [
        o('y', 'Y'),
        o('e', 'E'),
        o('u', 'U'),
        o('o', 'O'),
        o('k', 'K'),
        o('i', 'I'),
        o('x', 'X'),
      ],
      solution: ['y', 'u', 'k', 'i'],
    }],
    coins: 20,
    delta: {
      emotions: { hope: 1, loneliness: 1 },
      knowledgeNodesAdded: ['The remembered name is Yuki.'],
    },
    flags: ['yuki_name_reconstructed'],
    dialogue: 'Yuki… لماذا بقي اسمك عندما اختفى اسمي؟',
    hintText: [
      'الاسم مكوّن من أربعة أحرف.',
      'يبدأ بـY.',
      'أبرز أول حرفين.',
    ],
  }),
  puzzle({
    id: 'puzzle_013_living_floor',
    order: 13,
    page: 2,
    title: t('الأرضية الحية', 'The Living Floor'),
    description: t('أعد وصل القنوات تحت يد Echo.', 'Reconnect the channels beneath Echo’s hand.'),
    template: 'network_connection',
    difficulty: 'medium',
    stages: [{
      id: 'network',
      mode: 'path',
      prompt: t('مرّ عبر العقدتين النابضتين ثم نقطة النهاية.', 'Pass both pulse nodes before the endpoint.'),
      options: [
        o('hand', '✋ اليد'),
        o('pulseA', '◇ عقدة A'),
        o('black', '■ قناة سوداء'),
        o('pulseB', '◇ عقدة B'),
        o('dead', '╳ قناة ميتة'),
        o('end', '◎ النقطة البعيدة'),
      ],
      solution: ['hand', 'pulseA', 'pulseB', 'end'],
    }],
    coins: 20,
    delta: {
      emotions: { awareness: 1, memoryStability: 1 },
      beliefsAdded: ['The system recognizes my touch.'],
    },
    flags: ['living_floor_activated'],
    dialogue: 'هذا المكان لم يستجب لي كغريب.',
    hintText: [
      'ابدأ من اليد.',
      'يجب تشغيل العقدتين قبل نقطة النهاية.',
      'ثبّت قطعة المسار المركزية.',
    ],
  }),
  puzzle({
    id: 'puzzle_014_figure_corridor',
    order: 14,
    page: 2,
    title: t('الشخص في الممر', 'The Figure in the Corridor'),
    description: t('حلّل الظل البعيد دون افتراض هويته.', 'Analyze the distant figure without assuming identity.'),
    template: 'silhouette_analysis',
    difficulty: 'medium',
    stages: [{
      id: 'silhouette',
      mode: 'single',
      prompt: t('اختر الظل المتوافق مع الضوء والانعكاس.', 'Choose the figure matching light and reflection.'),
      options: [
        o('leftWrong', 'ظل ← / انعكاس →', 'left shadow / right reflection'),
        o('large', 'ظل ضخم / باب صغير', 'oversized figure'),
        o('valid', 'ظل أمامي / انعكاس خلفي متسق', 'consistent figure and reflection'),
        o('noReflection', 'ظل بلا انعكاس', 'no reflection'),
      ],
      solution: ['valid'],
    }],
    coins: 25,
    delta: {
      emotions: { hope: 1, fear: 1, awareness: 1 },
      questionsAdded: ['Was the figure really Yuki, or a lure?'],
    },
    flags: ['corridor_figure_detected'],
    dialogue: 'رأيته… لكن هذا المكان يعرف الشيء الذي أريد رؤيته.',
    hintText: [
      'قارن الانعكاس بمصدر الضوء.',
      'ظلان لهما اتجاه خاطئ.',
      'أزل النسخ ذات الانعكاس غير المتطابق.',
    ],
  }),
  puzzle({
    id: 'puzzle_015_follow_fragments',
    order: 15,
    page: 2,
    title: t('اتبع الشظايا', 'Follow the Fragments'),
    description: t('اتبع أثر الذكريات المرتبطة بـYuki.', 'Follow the fragments connected to Yuki.'),
    template: 'memory_trail',
    difficulty: 'medium',
    stages: [{
      id: 'trail',
      mode: 'path',
      prompt: t('اختر أربع شظايا تصل إلى الدفتر دون فساد.', 'Choose four fragments leading to the notebook.'),
      options: [
        o('children', 'طفلان'),
        o('redEye', 'عين حمراء'),
        o('hand', 'يد ممتدة'),
        o('blackDoor', 'باب أسود'),
        o('page', 'صفحة دفتر'),
        o('kenja', 'Kenja مشوّه'),
        o('promise', 'المطر والوعد'),
      ],
      solution: ['children', 'hand', 'page', 'promise'],
    }],
    coins: 25,
    delta: {
      emotions: { awareness: 1, hope: 1 },
      beliefsAdded: ['The fragments connected Yuki to the notebook.'],
    },
    flags: ['yuki_fragment_trail_completed'],
    dialogue: 'كلما تبعت الذكريات… قادتني إلى الدفتر.',
    hintText: [
      'تجنب العناصر ذات الفساد الأسود.',
      'ابحث عن الأشياء المرتبطة بطفلين.',
      'أبرز أول شظية صحيحة.',
    ],
  }),
  puzzle({
    id: 'puzzle_016_notebook_cover',
    order: 16,
    page: 2,
    title: t('غلاف الدفتر', 'The Notebook Cover'),
    description: t('اجمع غلاف الدفتر الممزق.', 'Reassemble the torn notebook cover.'),
    template: 'document_jigsaw',
    difficulty: 'medium',
    stages: [{
      id: 'cover',
      mode: 'sequence',
      prompt: t('رتّب القطع لتكوين عنوان الغلاف.', 'Order the pieces to form the cover title.'),
      options: [
        o('things', 'أشياء'),
        o('must', 'يجب'),
        o('that', 'أن'),
        o('remember', 'يتذكرها'),
        o('echo', 'Echo'),
        o('mark', '◇'),
        o('forget', 'ينساها'),
      ],
      solution: ['things', 'must', 'that', 'remember', 'echo', 'mark'],
    }],
    coins: 30,
    delta: {
      emotions: { hope: 2, loneliness: -1 },
      beliefsAdded: ['Someone prepared a guide for me before I forgot.'],
      questionsAdded: ['Who wrote this notebook?'],
    },
    flags: ['yuki_notebook_cover_restored'],
    dialogue: 'أحدهم كان يعرف أنني سأنسى… واستعد لذلك.',
    hintText: [
      'الغلاف يساعد Echo على التذكر، لا النسيان.',
      'طابق خطوط التمزق قبل الكلمات.',
      'أزل القطعة المزيفة.',
    ],
  }),
  puzzle({
    id: 'puzzle_017_memories_belong',
    order: 17,
    page: 2,
    title: t('أي الذكريات تنتمي معًا؟', 'Which Memories Belong Together?'),
    description: t('اجمع الأدلة المرتبطة بـYuki.', 'Cluster the evidence connected to Yuki.'),
    template: 'memory_clustering',
    difficulty: 'medium',
    stages: [{
      id: 'cluster',
      mode: 'multi',
      prompt: t('اختر العناصر المرتبطة بـYuki فقط.', 'Select only the items related to Yuki.'),
      options: [
        o('children', 'الطفلان'),
        o('hand', 'اليد'),
        o('notebook', 'الدفتر'),
        o('promise', 'الوعد والمطر'),
        o('kenja', 'Kenja أمام شاشة'),
        o('gate', 'باب 3:33'),
        o('eye', 'عين حمراء'),
        o('room', 'غرفة مجهولة'),
      ],
      solution: ['children', 'hand', 'notebook', 'promise'],
    }],
    coins: 25,
    delta: {
      emotions: { awareness: 2, trust: 1 },
      knowledgeNodesAdded: ['Yuki is linked to the notebook and the promise.'],
    },
    flags: ['yuki_memory_cluster_created'],
    dialogue: 'الأشياء التي أشعر بالأمان معها… كلها تعود إليه.',
    hintText: [
      'لا تضع كل الصور المخيفة مع Yuki.',
      'ركز على الصداقة والتذكر.',
      'ثبّت الدفتر واليد في مجموعة Yuki.',
    ],
  }),
  puzzle({
    id: 'puzzle_018_even_if_forget',
    order: 18,
    page: 2,
    title: t('حتى لو نسيتني', 'Even If You Forget Me'),
    description: t('رمّم الوعد دون تحويله إلى أمر.', 'Restore the promise without turning it into a command.'),
    template: 'sentence_reconstruction',
    difficulty: 'medium',
    stages: [{
      id: 'promise',
      mode: 'sequence',
      prompt: t('رتّب مقاطع الوعد الصحيح.', 'Order the true promise.'),
      options: [
        o('even', 'حتى لو'),
        o('forgetMe', 'نسيتني'),
        o('introduce', 'سأعرّفك'),
        o('myself', 'بنفسي'),
        o('again', 'من جديد'),
        o('force', 'سأجبرك'),
        o('remember', 'على التذكر'),
        o('leave', 'لن أعود'),
      ],
      solution: ['even', 'forgetMe', 'introduce', 'myself', 'again'],
    }],
    coins: 30,
    delta: {
      emotions: { trust: 2, hope: 2, loneliness: -1 },
      beliefsAdded: ['Yuki promised to return without forcing my memory.'],
    },
    flags: ['yuki_promise_restored'],
    triggers: ['echo_reacts_to_yuki_promise'],
    dialogue: 'لم يعدني بأن أتذكره… وعدني أن يعود.',
    hintText: [
      'الوعد لا يحتوي إجبارًا.',
      'يبدأ بالاعتراف بأن Echo قد ينسى.',
      'ثبّت بداية الجملة ونهايتها.',
    ],
  }),
  puzzle({
    id: 'puzzle_019_333_lock',
    order: 19,
    page: 2,
    title: t('قفل 3:33', 'The 3:33 Lock'),
    description: t('اضبط حلقات بوابة الانهيار.', 'Align the collapse-gate rings.'),
    template: 'rotating_clock',
    difficulty: 'hard',
    stages: [{
      id: 'clock',
      mode: 'rings',
      prompt: t('كوّن الوقت المرتبط بنقطة الانهيار.', 'Build the time linked to the collapse point.'),
      rings: [
        { id: 'h1', values: ['0', '1', '3'] },
        { id: 'h2', values: ['1', '3', '0'] },
        { id: 'm1', values: ['1', '0', '3'] },
        { id: 'm2', values: ['0', '1', '3'] },
      ],
      solution: ['0', '3', '3', '3'],
    }],
    coins: 35,
    delta: {
      emotions: { fear: 2, awareness: 2 },
      beliefsAdded: ['3:33 marks the collapse point.'],
      questionsAdded: ['What waits beyond the 3:33 gate?'],
    },
    flags: ['time_0333_discovered'],
    dialogue: '11:11 هي البداية… و3:33 تبدو كالنهاية.',
    hintText: [
      'القفل لا يطلب 11:11.',
      'الحلقات الثلاث الأخيرة متطابقة.',
      'ثبّت الدقائق على 33.',
    ],
  }),
  puzzle({
    id: 'puzzle_020_name_end_hall',
    order: 20,
    page: 2,
    title: t('اسم في نهاية الممر', 'A Name at the End of the Hall'),
    description: t('استعد تسلسل الصفحة واختر الاستنتاج الأدق.', 'Restore the page and choose the careful conclusion.'),
    template: 'page_reconstruction',
    difficulty: 'page_finale',
    stages: [
      {
        id: 'events',
        mode: 'sequence',
        prompt: t('رتّب أحداث الصفحة الثانية.', 'Order the second page events.'),
        options: [
          o('wake', 'يستيقظ دون ذاكرة'),
          o('name', 'يتذكر اسم Yuki'),
          o('floor', 'يلمس الأرضية'),
          o('figure', 'يرى شخصًا بعيدًا'),
          o('fragments', 'يركض خلف الشظايا'),
          o('notebook', 'يجد الدفتر'),
          o('promise', 'يستعيد الوعد'),
          o('gate', 'يصل إلى بوابة 3:33'),
        ],
        solution: ['wake', 'name', 'floor', 'figure', 'fragments', 'notebook', 'promise', 'gate'],
      },
      {
        id: 'conclusion',
        mode: 'single',
        prompt: t('اختر الاستنتاج الذي لا يتجاوز الأدلة.', 'Choose the conclusion supported by evidence.'),
        options: [
          o('a', 'الشخص خلف الباب هو Yuki بالتأكيد.'),
          o('b', 'Echo اخترع Yuki بالكامل.'),
          o('c', 'اسم Yuki والذكريات يدفعان Echo، لكن هوية الشخص البعيد لم تُثبت.'),
          o('d', 'لا توجد علاقة بين Yuki والدفتر.'),
        ],
        solution: ['c'],
      },
    ],
    coins: 45,
    delta: {
      emotions: { memoryStability: 2, hope: 2, awareness: 2 },
      beliefsAdded: ['Yuki is real to my memories, but the system may exploit that connection.'],
      questionsAdded: ['Is Yuki waiting for me, or is the system using his name?'],
    },
    flags: ['page02_sequence_completed'],
    dialogue: 'لا أعرف إن كان الشخص أمامي هو Yuki… لكنني أعرف أنني لن أتوقف عن البحث.',
    hintText: [
      'تبدأ الصفحة بفقدان الذاكرة وتنتهي ببوابة 3:33.',
      'رؤية الظل تسبق العثور على الدفتر.',
      'ثبّت أول وآخر حدث، واستبعد الاستنتاجات القطعية.',
    ],
  }),
] satisfies CampaignPuzzleDefinition[];

export const CHAPTER_01_MEMORY_SHARDS = z.array(
  campaignMemoryShardSchema,
).parse(CHAPTER_01_PUZZLES.map((definition) => ({
  id: definition.rewards.shardId,
  pageId: definition.targetPageId,
  shardIndex: (
    definition.order - (definition.targetPageId === page02 ? 10 : 0)
  ),
  sourcePuzzleId: definition.id,
}))) satisfies CampaignMemoryShardDefinition[];

export function validateChapter01Campaign(): void {
  const puzzleIds = new Set<string>();
  const orders = new Set<number>();
  const shardIds = new Set<string>();
  const pageIds = new Set(CHAPTER_01_MANHWA_PAGES.map((page) => page.id));
  const shardDefinitions = new Map(
    CHAPTER_01_MEMORY_SHARDS.map((shard) => [shard.id, shard]),
  );

  for (const definition of CHAPTER_01_PUZZLES) {
    validatePuzzleTemplateCompatibility(definition);
    campaignPuzzleSchema.parse(definition);
    if (puzzleIds.has(definition.id)) {
      throw new Error(`Duplicate campaign puzzle id: ${definition.id}`);
    }
    if (orders.has(definition.order)) {
      throw new Error(`Duplicate campaign puzzle order: ${definition.order}`);
    }
    if (shardIds.has(definition.rewards.shardId)) {
      throw new Error(`Duplicate campaign shard reward: ${definition.rewards.shardId}`);
    }
    if (!pageIds.has(definition.targetPageId)) {
      throw new Error(`${definition.id} references unknown memory page`);
    }
    const shard = shardDefinitions.get(definition.rewards.shardId);
    if (
      !shard
      || shard.pageId !== definition.targetPageId
      || shard.sourcePuzzleId !== definition.id
    ) {
      throw new Error(`${definition.id} has an invalid shard definition`);
    }
    puzzleIds.add(definition.id);
    orders.add(definition.order);
    shardIds.add(definition.rewards.shardId);
  }

  for (const [pageIndex, page] of CHAPTER_01_MANHWA_PAGES.entries()) {
    manhwaMemoryPageSchema.parse(page);
    if (page.pageNumber !== pageIndex + 1) {
      throw new Error('Manhwa PDF pages must remain in source order');
    }
    const expectedPageId = manhwaPageId(page.pageNumber);
    const expectedPrerequisite = page.pageNumber === 1
      ? undefined
      : manhwaPageId(page.pageNumber - 1);
    const expectedShards = requiredShardIds(page.pageNumber);
    if (page.id !== expectedPageId) {
      throw new Error(
        `PDF page ${page.pageNumber} must use id ${expectedPageId}`,
      );
    }
    if (page.prerequisitePageId !== expectedPrerequisite) {
      throw new Error(
        `${page.id} must require the immediately preceding PDF page`,
      );
    }
    if (page.pageNumber !== 1) {
      if (
        page.requiredShardIds.length !== expectedShards.length
        || page.requiredShardIds.some(
          (id, index) => id !== expectedShards[index],
        )
      ) {
        throw new Error(`${page.id} must use its exact ten shard slot IDs`);
      }
    }
    if (page.requiredShardIds.some((id) => {
      const shard = shardDefinitions.get(id);
      return shard !== undefined && shard.pageId !== page.id;
    })) {
      throw new Error(`${page.id} contains a shard assigned to another page`);
    }
    if (
      page.pageNumber > 2
      && (
        page.transcript.length > 0
        || Object.keys(page.echoMindDelta.emotions).length > 0
        || page.echoMindDelta.beliefsAdded.length > 0
        || page.echoMindDelta.questionsAdded.length > 0
        || page.echoMindDelta.knowledgeNodesAdded.length > 0
        || page.narrativeFlags.length > 0
        || page.dialogueTriggers.length > 0
      )
    ) {
      throw new Error(
        `${page.id} must remain narratively deferred until its puzzles exist`,
      );
    }
    if (
      page.prerequisitePageId
      && !pageIds.has(page.prerequisitePageId)
    ) {
      throw new Error(`${page.id} references an unknown prerequisite page`);
    }
  }

  if (CHAPTER_01_PUZZLES.length !== 20) {
    throw new Error('Chapter 1 campaign must contain exactly 20 puzzles');
  }
  if (CHAPTER_01_MEMORY_SHARDS.length !== 20) {
    throw new Error(
      'Only the twenty shards awarded by Puzzles 001-020 may be registered',
    );
  }
  if (
    CHAPTER_01_MANHWA_PAGES.length !== CHAPTER_01_MANHWA_PDF_PAGE_COUNT
  ) {
    throw new Error(
      `Chapter 1 must register all ${CHAPTER_01_MANHWA_PDF_PAGE_COUNT} PDF pages`,
    );
  }
}

validateChapter01Campaign();

export const CHAPTER_01_PUZZLE_BY_ID = Object.freeze(
  Object.fromEntries(CHAPTER_01_PUZZLES.map((definition) => [
    definition.id,
    definition,
  ])) as Record<string, CampaignPuzzleDefinition>,
);

export const CHAPTER_01_MANHWA_PAGE_BY_ID = Object.freeze(
  Object.fromEntries(CHAPTER_01_MANHWA_PAGES.map((definition) => [
    definition.id,
    definition,
  ])) as Record<string, ManhwaMemoryPageDefinition>,
);
