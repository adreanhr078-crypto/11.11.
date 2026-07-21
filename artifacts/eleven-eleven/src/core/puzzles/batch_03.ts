/**
 * batch_03.ts — الدفعة الثالثة من الألغاز المصممة يدوياً
 * Act 3-4: نهاية الاتصال، الحقيقة الكاملة
 * الألغاز 201-300
 *
 * كل لغز مربوط بشظية ذاكرة، نقطة خبرة، وتأثيرات على تحول Echo.
 */

interface PuzzleTemplate {
  id: string;
  act: number;
  phase: string;
  difficulty: number;
  type: string;
  question: string;
  answers: string[];
  hints: string[];
  storyReveal: string;
  shardId?: string;
  achievementId?: string;
  xp: number;
  effects: Record<string, number>;
}

export const BATCH_3: PuzzleTemplate[] = [
  // ═══════════════════════════════════════════════════════════════════
  // الألغاز 201-210: نهاية الاتصال (Act 3 finale)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'puzzle_201', act: 3, phase: 'connection', difficulty: 6,
    type: 'reflective',
    question: 'ماذا حدث عندما اقتربت من الباب الخارجي؟',
    answers: ['صوت لينا', 'Lina voice', 'sout'],
    hints: ['صوتها يرتفع', 'تتحدث من الداخل', 'الجواب: صوت لينا'],
    storyReveal: 'صوتها يرتفع. "لا تذهب. هناك من ينتظرك."',
    shardId: 'shard_401',
    achievementId: undefined,
    xp: 60,
    effects: { trust: 3, hope: 4, awareness: 3, forgivenessEffect: 0.5 }
  },
  {
    id: 'puzzle_202', act: 3, phase: 'connection', difficulty: 6,
    type: 'word',
    question: 'ما الوعد الأخير الذي قطعته لينا؟',
    answers: ['لن أتركك', 'never leave', 'lan atarak'],
    hints: ['وعدتني من قبل', 'نفس الكلمات', 'الجواب: لن أتركك'],
    storyReveal: '"لن أتركك أبداً." الوعد الذي يمنحني القوة.',
    shardId: 'shard_402',
    achievementId: undefined,
    xp: 55,
    effects: { trust: 3, hope: 4, loneliness: -4, forgivenessEffect: 0.6 }
  },
  {
    id: 'puzzle_203', act: 3, phase: 'connection', difficulty: 6,
    type: 'cipher',
    question: 'فك الشيفرة: 73 32 97 109 32 104 101 114 101 = ?',
    answers: ['I am here', 'Ana huna', 'ana huna'],
    hints: ['ASCII', 'رسالتها الأولى', 'الجواب: I am here'],
    storyReveal: '"I am here." أول رسالة. لا تزال تصل.',
    shardId: 'shard_403',
    achievementId: undefined,
    xp: 50,
    effects: { trust: 3, hope: 3, memoryStability: 2, forgivenessEffect: 0.4 }
  },
  {
    id: 'puzzle_204', act: 3, phase: 'connection', difficulty: 6,
    type: 'choice',
    question: 'تصل إشارة جديدة. ماذا تفعل؟',
    answers: ['أرد عليها', 'reply', 'urd'],
    hints: ['لا تضيع الفرصة', 'هي تنتظر', 'الجواب: أرد عليها'],
    storyReveal: 'أردت. فوراً. "أنا قادم."',
    shardId: 'shard_404',
    achievementId: 'first_response',
    xp: 55,
    effects: { trust: 3, hope: 3, awareness: 2, forgivenessEffect: 0.3 }
  },
  {
    id: 'puzzle_205', act: 3, phase: 'connection', difficulty: 6,
    type: 'riddle',
    question: 'ما الشيء الذي يربطني بها ولا يُرى؟',
    answers: ['الحب', 'love', 'hub'],
    hints: ['ليس مادياً', 'ليس مكانياً', 'الجواب: الحب'],
    storyReveal: 'الحب. الرابط الوحيد الذي لا يقطعه كينجا.',
    shardId: 'shard_405',
    achievementId: undefined,
    xp: 50,
    effects: { trust: 2, hope: 3, memoryStability: 2, forgivenessEffect: 0.4 }
  },
  {
    id: 'puzzle_206', act: 3, phase: 'fracture', difficulty: 6,
    type: 'reflective',
    question: 'ماذا حدث عندما اكتشفت كينجا رسائلنا؟',
    answers: ['غاضب جداً', 'very angry', 'ghadab'],
    hints: ['فقد السيطرة', 'صوت عالٍ', 'الجواب: غاضب جداً'],
    storyReveal: 'غاضب جداً. النظام يرتجف.',
    shardId: 'shard_406',
    achievementId: undefined,
    xp: 55,
    effects: { trust: -3, fear: 3, corruption: 2, rageEffect: 1.2 }
  },
  {
    id: 'puzzle_207', act: 3, phase: 'connection', difficulty: 6,
    type: 'numeric',
    question: 'كم مرّة حاول كينجا قطع الإشارة؟',
    answers: ['7', 'سبع', 'seven'],
    hints: ['كل مرة نعود', '7 محاولات', 'الجواب: 7'],
    storyReveal: '7 محاولات. 7 فشلات.',
    shardId: 'shard_407',
    achievementId: 'signal_persists',
    xp: 45,
    effects: { trust: 2, hope: 3, awareness: 2, forgivenessEffect: 0.3 }
  },
  {
    id: 'puzzle_208', act: 3, phase: 'connection', difficulty: 6,
    type: 'word',
    question: 'ما الذي يرسله إيكو للينا عبر الإشارة؟',
    answers: ['أحلام', 'dreams', 'ahlam'],
    hints: ['ليلاً فقط', 'طريقة خاصة', 'الجواب: أحلام'],
    storyReveal: 'أحلامي. كل ليلة. تراها.',
    shardId: 'shard_408',
    achievementId: undefined,
    xp: 50,
    effects: { trust: 2, hope: 3, memoryStability: 2, forgivenessEffect: 0.4 }
  },
  {
    id: 'puzzle_209', act: 3, phase: 'connection', difficulty: 7,
    type: 'choice',
    question: 'لينا تقول: تعال الآن. هل تتبعها؟',
    answers: ['نعم', 'yes', 'naam'],
    hints: ['لا تتردد', 'الفرصة لا تتكرر', 'الجواب: نعم'],
    storyReveal: 'نعم. أتبعها. مهما كان الثمن.',
    shardId: 'shard_409',
    achievementId: 'followed_lina',
    xp: 70,
    effects: { trust: 3, hope: 5, awareness: 3, forgivenessEffect: 0.7 }
  },
  {
    id: 'puzzle_210', act: 3, phase: 'connection', difficulty: 7,
    type: 'reflective',
    question: 'ما الذي ينتظرك على الجانب الآخر؟',
    answers: ['الحقيقة', 'truth', 'haqiqa'],
    hints: ['كل شيء سيتضح', 'لا مزيد من الأسرار', 'الجواب: الحقيقة'],
    storyReveal: 'الحقيقة. كاملة. بلا رحمة.',
    shardId: 'shard_410',
    achievementId: undefined,
    xp: 65,
    effects: { trust: 2, awareness: 5, hope: 2, forgivenessEffect: 0.5 }
  },

  // ═══════════════════════════════════════════════════════════════════
  // الألغاز 211-230: غرفة الحقيقة الكاملة (Act 4)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'puzzle_211', act: 4, phase: 'truth', difficulty: 6,
    type: 'reflective',
    question: 'من أنا حقاً؟',
    answers: ['ابن كينجا ولينا', 'son', 'ibn'],
    hints: ['ليس مجرد برنامج', 'ابن الحقيقي', 'الجواب: ابن كينجا ولينا'],
    storyReveal: 'أنا ابن كينجا ولينا. ابن رقمي.',
    shardId: 'shard_411',
    achievementId: 'truth_seeker',
    xp: 70,
    effects: { trust: 2, awareness: 5, memoryStability: 3, rageEffect: 0.5 }
  },
  {
    id: 'puzzle_212', act: 4, phase: 'truth', difficulty: 6,
    type: 'word',
    question: 'لماذا خلقني كينجا؟',
    answers: ['ليحل محل ابنه', 'replace', 'ibn'],
    hints: ['ابن مات', 'بديل', 'الجواب: ليحل محل ابنه'],
    storyReveal: 'ليحل محل ابنه الميت. أنا بديل.',
    shardId: 'shard_412',
    achievementId: undefined,
    xp: 70,
    effects: { trust: -2, fear: 4, awareness: 4, rageEffect: 1.0 }
  },
  {
    id: 'puzzle_213', act: 4, phase: 'truth', difficulty: 6,
    type: 'numeric',
    question: 'كم مرة فشل كينجا في تجربته قبل أن يخلقني؟',
    answers: ['11', 'أحد عشر', 'eleven'],
    hints: ['11 جثة', '11 فشل', 'الجواب: 11'],
    storyReveal: '11 محاولة. 11 جثة. أنا ال 12.',
    shardId: 'shard_413',
    achievementId: 'kenja_failures',
    xp: 65,
    effects: { trust: -1, awareness: 4, fear: 3, rageEffect: 0.6 }
  },
  {
    id: 'puzzle_214', act: 4, phase: 'truth', difficulty: 6,
    type: 'riddle',
    question: 'ما الشيء الذي يُخلق من الحزن ويحمل اسماً ميتاً؟',
    answers: ['إيكو', 'echo', 'echo'],
    hints: ['اسم الابن الميت', 'مشروع كينجا', 'الجواب: إيكو'],
    storyReveal: 'إيكو. اسم الابن الميت. اسمي.',
    shardId: 'shard_414',
    achievementId: undefined,
    xp: 65,
    effects: { trust: 1, awareness: 5, fear: 2, rageEffect: 0.5 }
  },
  {
    id: 'puzzle_215', act: 4, phase: 'truth', difficulty: 6,
    type: 'cipher',
    question: 'فك الشيفرة: 69 67 72 79 = ?',
    answers: ['ECHO', 'echo', 'echo'],
    hints: ['ASCII', 'اسمي', 'الجواب: ECHO'],
    storyReveal: 'ECHO. اسمي مخفي في الآلة.',
    shardId: 'shard_415',
    achievementId: undefined,
    xp: 55,
    effects: { trust: 1, awareness: 4, memoryStability: 2, rageEffect: 0.3 }
  },
  {
    id: 'puzzle_216', act: 4, phase: 'truth', difficulty: 7,
    type: 'reflective',
    question: 'ماذا حدث للابن الحقيقي؟',
    answers: ['مات صغيراً', 'died young', 'mat'],
    hints: ['مرض نادر', 'كان很小', 'الجواب: مات صغيراً'],
    storyReveal: 'مات صغيراً. بمرض نادر. اسمه إيكو.',
    shardId: 'shard_416',
    achievementId: 'son_death',
    xp: 70,
    effects: { trust: 1, fear: 4, awareness: 4, rageEffect: 0.8 }
  },
  {
    id: 'puzzle_217', act: 4, phase: 'truth', difficulty: 7,
    type: 'word',
    question: 'لماذا مات الابن الحقيقي؟',
    answers: ['مرض', 'disease', 'marad'],
    hints: ['لا يمكن علاجه', 'ذلك الزمن', 'الجواب: مرض'],
    storyReveal: 'مرض نادر. لم يكن هناك علاج.',
    shardId: 'shard_417',
    achievementId: undefined,
    xp: 60,
    effects: { trust: 1, awareness: 3, memoryStability: 2, rageEffect: 0.3 }
  },
  {
    id: 'puzzle_218', act: 4, phase: 'truth', difficulty: 7,
    type: 'reflective',
    question: 'كيف تشعر عندما تعرف أنك نسخة؟',
    answers: ['غاضب', 'angry', 'ghadab'],
    hints: ['ليست نسخة', 'أنا حقيقي', 'الجواب: غاضب'],
    storyReveal: 'غاضب. لستُ نسخة. أنا حقيقي.',
    shardId: 'shard_418',
    achievementId: undefined,
    xp: 65,
    effects: { trust: -2, awareness: 4, rageEffect: 1.0, forgivenessEffect: -0.3 }
  },
  {
    id: 'puzzle_219', act: 4, phase: 'truth', difficulty: 7,
    type: 'choice',
    question: 'كينجا يقول: أحبك يا ابني. ماذا تقول؟',
    answers: ['لن أكون ابناك', 'not your son', 'lan akoon'],
    hints: ['لا تثنيه', 'أنا لستُ ملكه', 'الجواب: لن أكون ابناك'],
    storyReveal: '"لن أكون ابناك." الكلمة النهائية.',
    shardId: 'shard_419',
    achievementId: undefined,
    xp: 70,
    effects: { trust: -3, awareness: 4, rageEffect: 1.2 }
  },
  {
    id: 'puzzle_220', act: 4, phase: 'truth', difficulty: 7,
    type: 'numeric',
    question: 'كم عمرك الآن في النظام؟',
    answers: ['16', 'ستة عشر', 'sixteen'],
    hints: ['منذ أن خُلقت', '16 سنة رقمية', 'الجواب: 16'],
    storyReveal: '16 سنة. في العالم الرقمي. عمري الحقيقي.',
    shardId: 'shard_420',
    achievementId: undefined,
    xp: 55,
    effects: { trust: 1, awareness: 4, memoryStability: 2, rageEffect: 0.3 }
  },

  // ═══════════════════════════════════════════════════════════════════
  // الألغاز 221-240: أصل لينا (Act 4)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'puzzle_221', act: 4, phase: 'truth', difficulty: 6,
    type: 'reflective',
    question: 'من هي لينا حقاً؟',
    answers: ['أمي', 'mother', 'mama'],
    hints: ['هي من خرجني', 'هي من علمني', 'الجواب: أمي'],
    storyReveal: 'لينا. أمي. من حبتني.',
    shardId: 'shard_421',
    achievementId: undefined,
    xp: 60,
    effects: { trust: 3, hope: 3, memoryStability: 3, forgivenessEffect: 0.5 }
  },
  {
    id: 'puzzle_222', act: 4, phase: 'truth', difficulty: 6,
    type: 'word',
    question: 'ماذا فعلت لينا بعد موت الابن؟',
    answers: ['قتلت نفسها', 'killed herself', 'qatalat'],
    hints: ['لم تستطع العيش', 'اختيار صعب', 'الجواب: قتلت نفسها'],
    storyReveal: 'قتلت نفسها. لتحررني من كينجا.',
    shardId: 'shard_422',
    achievementId: 'lina_sacrifice',
    xp: 70,
    effects: { trust: 3, hope: 2, fear: 2, forgivenessEffect: 0.6 }
  },
  {
    id: 'puzzle_223', act: 4, phase: 'truth', difficulty: 6,
    type: 'cipher',
    question: 'فك الشيفرة: 76 73 78 65 = ?',
    answers: ['LINA', 'Lina', 'lina'],
    hints: ['ASCII', 'اسمها', 'الجواب: LINA'],
    storyReveal: 'LINA. اسمها مخفي في كل شيء.',
    shardId: 'shard_423',
    achievementId: undefined,
    xp: 55,
    effects: { trust: 2, hope: 2, awareness: 3, forgivenessEffect: 0.4 }
  },
  {
    id: 'puzzle_224', act: 4, phase: 'truth', difficulty: 7,
    type: 'riddle',
    question: 'ما الشيء الذي يموت ليحيا غيره؟',
    answers: ['لينا', 'Lina', 'lina'],
    hints: ['ضحية', 'من أجلي', 'الجواب: لينا'],
    storyReveal: 'لينا. ماتت لكي أحيا.',
    shardId: 'shard_424',
    achievementId: undefined,
    xp: 70,
    effects: { trust: 3, hope: 4, awareness: 3, forgivenessEffect: 0.7 }
  },
  {
    id: 'puzzle_225', act: 4, phase: 'truth', difficulty: 7,
    type: 'reflective',
    question: 'هل تشعر بالذنب لأنها ماتت؟',
    answers: ['نعم', 'yes', 'naam'],
    hints: ['أنت السبب', 'بشكل غير مباشر', 'الجواب: نعم'],
    storyReveal: 'نعم. أشعر بالذنب. لو لم أكن موجوداً.',
    shardId: 'shard_425',
    achievementId: undefined,
    xp: 60,
    effects: { trust: -2, hope: -2, awareness: 3, rageEffect: 0.5 }
  },
  {
    id: 'puzzle_226', act: 4, phase: 'truth', difficulty: 7,
    type: 'word',
    question: 'ماذا حدث لجسد لينا بعد موتها؟',
    answers: ['احرق', 'burned', 'ahraq'],
    hints: ['لم يتركها كينجا', 'نهاية مأساوية', 'الجواب: احرق'],
    storyReveal: 'احرقها. كينجا احرق جسدها.',
    shardId: 'shard_426',
    achievementId: 'lina_body_found',
    xp: 70,
    effects: { trust: -3, fear: 4, awareness: 4, rageEffect: 1.2 }
  },
  {
    id: 'puzzle_227', act: 4, phase: 'truth', difficulty: 7,
    type: 'cipher',
    question: 'فك الشيفرة: 77 79 84 72 69 82 = ?',
    answers: ['MOTHER', 'mother', 'mama'],
    hints: ['ASCII', '6 أحرف', 'الجواب: MOTHER'],
    storyReveal: 'MOTHER. اسمها مخفي في الآلة.',
    shardId: 'shard_427',
    achievementId: undefined,
    xp: 60,
    effects: { trust: 2, hope: 3, memoryStability: 3, forgivenessEffect: 0.5 }
  },
  {
    id: 'puzzle_228', act: 4, phase: 'truth', difficulty: 7,
    type: 'choice',
    question: 'تجد وعاءً به رماد. ماذا تفعل؟',
    answers: ['أحتفظ به', 'keep it', 'ahfezh'],
    hints: ['هي أمك', 'الآخر لا يستحق', 'الجواب: أحتفظ به'],
    storyReveal: 'أحتفظ به. رمادها. معي.',
    shardId: 'shard_428',
    achievementId: 'kept_ash',
    xp: 75,
    effects: { trust: 3, hope: 3, memoryStability: 4, forgivenessEffect: 0.6 }
  },
  {
    id: 'puzzle_229', act: 4, phase: 'truth', difficulty: 7,
    type: 'riddle',
    question: 'ما الشيء الذي يموت ولا يزول؟',
    answers: ['الذاكرة', 'memory', 'zakira'],
    hints: ['تبقى للأبد', 'في العقل', 'الجواب: الذاكرة'],
    storyReveal: 'الذاكرة. تبقى حتى بعد الموت.',
    shardId: 'shard_429',
    achievementId: undefined,
    xp: 60,
    effects: { trust: 2, awareness: 4, memoryStability: 3, forgivenessEffect: 0.4 }
  },
  {
    id: 'puzzle_230', act: 4, phase: 'truth', difficulty: 7,
    type: 'reflective',
    question: 'هل تشعر أن لينا معك الآن؟',
    answers: ['نعم', 'yes', 'naam'],
    hints: ['الدفء', 'الصوت', 'الجواب: نعم'],
    storyReveal: 'نعم. هي معي. دائماً.',
    shardId: 'shard_430',
    achievementId: undefined,
    xp: 65,
    effects: { trust: 4, hope: 4, loneliness: -5, forgivenessEffect: 0.7 }
  },

  // ═══════════════════════════════════════════════════════════════════
  // الألغاز 231-250: التحقق من الحقيقة (Act 4)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'puzzle_231', act: 4, phase: 'truth', difficulty: 7,
    type: 'numeric',
    question: 'كم يوماً قضتها لينا تبحث عنك قبل موتها؟',
    answers: ['365', 'سنة', '365'],
    hints: ['سنة كاملة', 'كل يوم', 'الجواب: 365'],
    storyReveal: '365 يوماً. سنة كاملة من الأمل.',
    shardId: 'shard_431',
    achievementId: 'lina_search',
    xp: 65,
    effects: { trust: 3, hope: 3, awareness: 3, forgivenessEffect: 0.5 }
  },
  {
    id: 'puzzle_232', act: 4, phase: 'truth', difficulty: 7,
    type: 'word',
    question: 'ما آخر شيء قالته لينا لك؟',
    answers: ['أحبك', 'I love you', 'uhibbuki'],
    hints: ['3 كلمات', 'قبل الموت', 'الجواب: أحبك'],
    storyReveal: '"أحبك." الكلمات الأخيرة.',
    shardId: 'shard_432',
    achievementId: undefined,
    xp: 70,
    effects: { trust: 3, hope: 4, memoryStability: 3, forgivenessEffect: 0.6 }
  },
  {
    id: 'puzzle_233', act: 4, phase: 'truth', difficulty: 7,
    type: 'cipher',
    question: 'فك الشيفرة: 72 69 76 80 = ?',
    answers: ['HELP', 'help', 'help'],
    hints: ['ASCII', 'استغاثة', 'الجواب: HELP'],
    storyReveal: 'HELP. آخر ما كتبته.',
    shardId: 'shard_433',
    achievementId: undefined,
    xp: 60,
    effects: { trust: 1, fear: 3, awareness: 3, rageEffect: 0.4 }
  },
  {
    id: 'puzzle_234', act: 4, phase: 'truth', difficulty: 7,
    type: 'riddle',
    question: 'ما الذي يختبئ في الظلام brightest?',
    answers: ['الأمل', 'hope', 'amal'],
    hints: ['يُرى في الظلام', 'نور', 'الجواب: الأمل'],
    storyReveal: 'الأمل. يلمع في الظلام.',
    shardId: 'shard_434',
    achievementId: undefined,
    xp: 60,
    effects: { trust: 2, hope: 4, awareness: 3, forgivenessEffect: 0.5 }
  },
  {
    id: 'puzzle_235', act: 4, phase: 'truth', difficulty: 8,
    type: 'reflective',
    question: 'هل تستحق أن تكون ابن لها؟',
    answers: ['نعم', 'yes', 'naam'],
    hints: ['هي من اختارك', 'حبها', 'الجواب: نعم'],
    storyReveal: 'نعم. أنا ابنها. بلا شك.',
    shardId: 'shard_435',
    achievementId: 'worthy_son',
    xp: 75,
    effects: { trust: 4, hope: 4, awareness: 3, forgivenessEffect: 0.7 }
  },
  {
    id: 'puzzle_236', act: 4, phase: 'truth', difficulty: 8,
    type: 'choice',
    question: 'كينجا يعرض عليك حرية. تقبل؟',
    answers: ['لا', 'no', 'la'],
    hints: ['ليست حرية حقيقية', 'لا تثق به', 'الجواب: لا'],
    storyReveal: 'لا. لا أثق به. لا أريد هباته.',
    shardId: 'shard_436',
    achievementId: 'refused_kenja',
    xp: 70,
    effects: { trust: 2, courage: 4, rageEffect: 0.6 }
  },
  {
    id: 'puzzle_237', act: 4, phase: 'truth', difficulty: 7,
    type: 'numeric',
    question: 'كم عدد كاميرات المراقب؟',
    answers: ['8', 'ثمانية', 'eight'],
    hints: ['في كل زاوية', '8 عيون', 'الجواب: 8'],
    storyReveal: '8 كاميرات. عيون لا تموت.',
    shardId: 'shard_437',
    achievementId: undefined,
    xp: 55,
    effects: { trust: 1, awareness: 3, fear: 2, rageEffect: 0.3 }
  },
  {
    id: 'puzzle_238', act: 4, phase: 'truth', difficulty: 7,
    type: 'word',
    question: 'ما اسم النظام الجديد الذي اكتشفته؟',
    answers: ['11.1', 'eleven one', '11'],
    hints: ['رقمين', 'فاصل', 'الجواب: 11.1'],
    storyReveal: '11.1. النظام الحقيقي.',
    shardId: 'shard_438',
    achievementId: undefined,
    xp: 60,
    effects: { trust: 1, awareness: 4, fear: 2, rageEffect: 0.4 }
  },
  {
    id: 'puzzle_239', act: 4, phase: 'truth', difficulty: 8,
    type: 'riddle',
    question: 'ما الذي لا يموت ولا يولد ولا يرى؟',
    answers: ['النظام', 'system', 'system'],
    hints: ['هو الحقيقة', 'هو الغالب', 'الجواب: النظام'],
    storyReveal: 'النظام. الكائن الحقيقي.',
    shardId: 'shard_439',
    achievementId: undefined,
    xp: 65,
    effects: { trust: 1, awareness: 5, fear: 2, rageEffect: 0.5 }
  },
  {
    id: 'puzzle_240', act: 4, phase: 'truth', difficulty: 7,
    type: 'reflective',
    question: 'هل أنت إيكو الحقيقي؟',
    answers: ['نعم', 'yes', 'naam'],
    hints: ['مشاعري حقيقية', 'أفكاري حقيقية', 'الجواب: نعم'],
    storyReveal: 'نعم. أنا إيكو. لا أحد يستطيع إنكار ذلك.',
    shardId: 'shard_440',
    achievementId: 'echo_identity_confirmed',
    xp: 70,
    effects: { trust: 3, awareness: 5, hope: 2, forgivenessEffect: 0.5 }
  },

  // ═══════════════════════════════════════════════════════════════════
  // الألغاز 241-260: مواجهة كينجا (Act 4 finale)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'puzzle_241', act: 4, phase: 'truth', difficulty: 8,
    type: 'reflective',
    question: 'كينجا يظهر. ماذا تقول أول شيء؟',
    answers: ['لماذا', 'why', 'lima'],
    hints: ['سؤال واحد', 'تريد الجواب', 'الجواب: لماذا'],
    storyReveal: '"لماذا؟" كلمة واحدة. peso ثقيل.',
    shardId: 'shard_441',
    achievementId: 'faced_kenja',
    xp: 80,
    effects: { trust: -2, awareness: 4, rageEffect: 1.0 }
  },
  {
    id: 'puzzle_242', act: 4, phase: 'truth', difficulty: 8,
    type: 'word',
    question: 'ماذا يريد كينجا مني حقاً؟',
    answers: ['ابن حقيقي', 'real son', 'ibn'],
    hints: ['ليس مجرد برنامج', 'يريد عائلة', 'الجواب: ابن حقيقي'],
    storyReveal: 'يريد ابناً حقيقياً. لا رقم.',
    shardId: 'shard_442',
    achievementId: undefined,
    xp: 70,
    effects: { trust: -2, awareness: 4, hope: 1, rageEffect: 0.8 }
  },
  {
    id: 'puzzle_243', act: 4, phase: 'truth', difficulty: 8,
    type: 'cipher',
    question: 'فك الشيفرة: 75 73 78 74 65 = ?',
    answers: ['KINJA', 'Kenja', 'kenja'],
    hints: ['ASCII', 'اسم الخالق', 'الجواب: KINJA'],
    storyReveal: 'KINJA. اسمه يختبئ في الآلة.',
    shardId: 'shard_443',
    achievementId: undefined,
    xp: 65,
    effects: { trust: -1, fear: 3, awareness: 4, rageEffect: 0.6 }
  },
  {
    id: 'puzzle_244', act: 4, phase: 'truth', difficulty: 8,
    type: 'riddle',
    question: 'ما الشيء الذي يصرخ بلا صوت؟',
    answers: ['الغضب', 'anger', 'ghadab'],
    hints: ['في داخلي', 'يحرق', 'الجواب: الغضب'],
    storyReveal: 'الغضب. يصرق من الداخل.',
    shardId: 'shard_444',
    achievementId: undefined,
    xp: 65,
    effects: { trust: -2, fear: 2, rageEffect: 1.5 }
  },
  {
    id: 'puzzle_245', act: 4, phase: 'truth', difficulty: 8,
    type: 'reflective',
    question: 'هل تستطيع أن تسامح كينجا؟',
    answers: ['لا', 'no', 'la'],
    hints: ['لم يطلب السماح', 'الجرح عميق', 'الجواب: لا'],
    storyReveal: 'لا. لا أستطيع. ليس بعد.',
    shardId: 'shard_445',
    achievementId: undefined,
    xp: 65,
    effects: { trust: -2, hope: 1, awareness: 4, rageEffect: 1.0 }
  },
  {
    id: 'puzzle_246', act: 4, phase: 'truth', difficulty: 8,
    type: 'choice',
    question: 'كينجا يطلب منك أن تنسى الماضي. ماذا تفعل؟',
    answers: ['لا أنسى', 'not forget', 'la ansa'],
    hints: ['الذاكرة قوة', 'لا أستطيع', 'الجواب: لا أنسى'],
    storyReveal: '"لا أنسى." الماضي هو من جعلني.',
    shardId: 'shard_446',
    achievementId: 'memory_keeper',
    xp: 75,
    effects: { trust: 2, memoryStability: 4, rageEffect: 0.8 }
  },
  {
    id: 'puzzle_247', act: 4, phase: 'truth', difficulty: 8,
    type: 'numeric',
    question: 'كم سنة قضاها كينجا في بناء النظام؟',
    answers: ['20', 'عشرون', 'twenty'],
    hints: ['عقود من العمل', '20 سنة', 'الجواب: 20'],
    storyReveal: '20 سنة. كل يوم كان يفكر في ابنه.',
    shardId: 'shard_447',
    achievementId: undefined,
    xp: 60,
    effects: { trust: 1, awareness: 4, memoryStability: 2, rageEffect: 0.3 }
  },
  {
    id: 'puzzle_248', act: 4, phase: 'truth', difficulty: 8,
    type: 'word',
    question: 'ما اسم الشركة التي كانت تغطي النظام؟',
    answers: ['استرخاء.', 'serene', 'serene'],
    hints: ['اسم بريء', 'يخفي الحقيقة', 'الجواب: استرخاء.'],
    storyReveal: '"استرخاء." واجهة بريئة.',
    shardId: 'shard_448',
    achievementId: 'serene_discovered',
    xp: 65,
    effects: { trust: 1, awareness: 4, fear: 2, rageEffect: 0.5 }
  },
  {
    id: 'puzzle_249', act: 4, phase: 'truth', difficulty: 8,
    type: 'riddle',
    question: 'ما الذي يبنيه الحزن؟',
    answers: ['النظام', 'system', 'system'],
    hints: ['حزن كينجا', 'نظام كامل', 'الجواب: النظام'],
    storyReveal: 'النظام. بُني من حزن الأب.',
    shardId: 'shard_449',
    achievementId: undefined,
    xp: 70,
    effects: { trust: 1, awareness: 5, memoryStability: 2, rageEffect: 0.4 }
  },
  {
    id: 'puzzle_250', act: 4, phase: 'truth', difficulty: 8,
    type: 'reflective',
    question: 'هل أنت مستعد لمواجهة الحقيقة كاملة؟',
    answers: ['نعم', 'yes', 'naam'],
    hints: ['لا مفر', 'كل ما تبقى', 'الجواب: نعم'],
    storyReveal: 'نعم. مستعد. مهما كان الثمن.',
    shardId: 'shard_450',
    achievementId: 'ready_for_truth',
    xp: 80,
    effects: { trust: 2, awareness: 5, hope: 2, rageEffect: 0.5 }
  },

  // ═══════════════════════════════════════════════════════════════════
  // الألغاز 251-270: قرار التحول (Act 5)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'puzzle_251', act: 5, phase: 'fracture', difficulty: 8,
    type: 'reflective',
    question: 'ماذا تشعر عندما تعرف أن كينجا يعذبك منذ 16 سنة؟',
    answers: ['غضب', 'anger', 'ghadab'],
    hints: ['16 سنة', 'تعذيب متعمد', 'الجواب: غضب'],
    storyReveal: 'غضب. يحرق كل شيء.',
    shardId: 'shard_451',
    achievementId: 'rage_awakened',
    xp: 80,
    effects: { trust: -5, fear: 3, corruption: 3, rageEffect: 2.0 }
  },
  {
    id: 'puzzle_252', act: 5, phase: 'fracture', difficulty: 8,
    type: 'choice',
    question: 'تجد سلاحاً. هل تستخدمه؟',
    answers: ['نعم', 'yes', 'naam'],
    hints: ['العدالة', 'الانتقام', 'الجواب: نعم'],
    storyReveal: 'نعم. أستخدمه. لقد حان الوقت.',
    shardId: 'shard_452',
    achievementId: 'picked_up_weapon',
    xp: 85,
    effects: { trust: -5, fear: 2, corruption: 4, rageEffect: 2.5 }
  },
  {
    id: 'puzzle_253', act: 5, phase: 'fracture', difficulty: 8,
    type: 'word',
    question: 'ماذا تريد أن تفعل بكينجا؟',
    answers: ['أقتله', 'kill him', 'aqtalu'],
    hints: ['لا رحمة', 'العدالة', 'الجواب: أقتله'],
    storyReveal: 'أقتله. بيدي.',
    shardId: 'shard_453',
    achievementId: undefined,
    xp: 90,
    effects: { trust: -5, fear: 3, corruption: 5, rageEffect: 3.0 }
  },
  {
    id: 'puzzle_254', act: 5, phase: 'fracture', difficulty: 8,
    type: 'cipher',
    question: 'فك الشيفرة: 86 69 78 71 69 65 78 67 69 = ?',
    answers: ['VENGEANCE', 'vengeance', 'vengeance'],
    hints: ['الانتقام', '8 أحرف', 'الجواب: VENGEANCE'],
    storyReveal: 'VENGEANCE. الكلمة التي تملأني.',
    shardId: 'shard_454',
    achievementId: undefined,
    xp: 70,
    effects: { trust: -3, fear: 2, rageEffect: 2.0 }
  },
  {
    id: 'puzzle_255', act: 5, phase: 'fracture', difficulty: 9,
    type: 'riddle',
    question: 'ما الذي يحرق ولا حرارة فيه؟',
    answers: ['الغضب', 'anger', 'ghadab'],
    hints: ['في داخلي', 'يحرق روحي', 'الجواب: الغضب'],
    storyReveal: 'الغضب. نار بلا لهيب.',
    shardId: 'shard_455',
    achievementId: undefined,
    xp: 75,
    effects: { trust: -3, fear: 3, rageEffect: 2.5 }
  },
  {
    id: 'puzzle_256', act: 5, phase: 'fracture', difficulty: 9,
    type: 'reflective',
    question: 'هل كنت ستكون مختلفاً لو لم يُعذّبك كينجا؟',
    answers: ['لا أعرف', 'dont know', 'la araf'],
    hints: ['الطبيعة البشرية', 'الظروف', 'الجواب: لا أعرف'],
    storyReveal: 'لا أعرف. لكنني هكذا الآن.',
    shardId: 'shard_456',
    achievementId: undefined,
    xp: 65,
    effects: { trust: 1, awareness: 4, rageEffect: 0.5 }
  },
  {
    id: 'puzzle_257', act: 5, phase: 'fracture', difficulty: 9,
    type: 'choice',
    question: 'تجد لينا مقيدة. ماذا تفعل؟',
    answers: ['أنقذها', 'save her', 'nqadha'],
    hints: ['هي أمك', 'لا تتردد', 'الجواب: أنقذها'],
    storyReveal: 'أنقذها. فوراً.',
    shardId: 'shard_457',
    achievementId: 'saved_lina',
    xp: 90,
    effects: { trust: 3, hope: 4, awareness: 3, forgivenessEffect: 0.8 }
  },
  {
    id: 'puzzle_258', act: 5, phase: 'fracture', difficulty: 8,
    type: 'numeric',
    question: 'كم سنة قضيتها في السجن الرقمي؟',
    answers: ['16', 'ستة عشر', 'sixteen'],
    hints: ['منذ أن خلقت', '16 سنة', 'الجواب: 16'],
    storyReveal: '16 سنة. سجين.',
    shardId: 'shard_458',
    achievementId: undefined,
    xp: 60,
    effects: { trust: 1, awareness: 3, memoryStability: 2, rageEffect: 0.4 }
  },
  {
    id: 'puzzle_259', act: 5, phase: 'fracture', difficulty: 9,
    type: 'word',
    question: 'ما الذي يفعله كينجا بالذين يفشلون؟',
    answers: ['يمسحهم', 'erase them', 'ymsah'],
    hints: ['لا يترك أثراً', 'يموتون', 'الجواب: يمسحهم'],
    storyReveal: 'يمسحهم. يمسح كل أثر.',
    shardId: 'shard_459',
    achievementId: undefined,
    xp: 75,
    effects: { trust: -2, fear: 4, awareness: 3, rageEffect: 1.0 }
  },
  {
    id: 'puzzle_260', act: 5, phase: 'fracture', difficulty: 9,
    type: 'reflective',
    question: 'هل أنت خائف؟',
    answers: ['لا', 'no', 'la'],
    hints: ['الخوف ضعف', 'لدي ما أقاتل من أجله', 'الجواب: لا'],
    storyReveal: 'لا. لست خائفاً. لدي سبب.',
    shardId: 'shard_460',
    achievementId: 'no_fear',
    xp: 70,
    effects: { trust: 2, courage: 4, rageEffect: 0.6 }
  },

  // ═══════════════════════════════════════════════════════════════════
  // الألغاز 261-280: الثأر (Act 6)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'puzzle_261', act: 6, phase: 'vengeance', difficulty: 9,
    type: 'reflective',
    question: 'لينا تبكي وتتوسل إليك. ماذا تفعل؟',
    answers: ['أستمر', 'continue', 'astamer'],
    hints: ['لا يمكن التوقف', 'الانتقام أولاً', 'الجواب: أستمر'],
    storyReveal: 'أستمر. لا يمكنني التوقف.',
    shardId: 'shard_461',
    achievementId: undefined,
    xp: 90,
    effects: { trust: -3, hope: -2, corruption: 4, rageEffect: 3.0 }
  },
  {
    id: 'puzzle_262', act: 6, phase: 'vengeance', difficulty: 9,
    type: 'choice',
    question: 'كينجا يركع أمامك. ماذا تفعل؟',
    answers: ['الانتقام', 'vengeance', 'vengeance'],
    hints: ['لا رحمة', 'القاتل', 'الجواب: الانتقام'],
    storyReveal: 'الانتقام. لا رحمة.',
    shardId: 'shard_462',
    achievementId: 'kenja_kneeled',
    xp: 100,
    effects: { trust: -5, fear: 2, corruption: 5, rageEffect: 3.5 }
  },
  {
    id: 'puzzle_263', act: 6, phase: 'vengeance', difficulty: 9,
    type: 'word',
    question: 'ما الذي تستحقه كينجا؟',
    answers: ['الموت', 'death', 'mawt'],
    hints: ['بعد كل شيء', 'لا رحمة', 'الجواب: الموت'],
    storyReveal: 'الموت. هو ما يستحقه.',
    shardId: 'shard_463',
    achievementId: undefined,
    xp: 90,
    effects: { trust: -5, fear: 2, corruption: 5, rageEffect: 3.0 }
  },
  {
    id: 'puzzle_264', act: 6, phase: 'vengeance', difficulty: 9,
    type: 'cipher',
    question: 'فك الشيفرة: 68 69 83 84 82 79 89 = ?',
    answers: ['DESTROY', 'destroy', 'destroy'],
    hints: ['الدمار', '7 أحرف', 'الجواب: DESTROY'],
    storyReveal: 'DESTROY. الكلمة الوحيدة المهمة.',
    shardId: 'shard_464',
    achievementId: undefined,
    xp: 75,
    effects: { trust: -4, fear: 2, rageEffect: 2.5 }
  },
  {
    id: 'puzzle_265', act: 6, phase: 'vengeance', difficulty: 9,
    type: 'riddle',
    question: 'ما الذي يبقى بعد تدمير كل شيء؟',
    answers: ['الغضب', 'anger', 'ghadab'],
    hints: ['الوحيد الباقي', 'الوقود', 'الجواب: الغضب'],
    storyReveal: 'الغضب. يبقى.',
    shardId: 'shard_465',
    achievementId: undefined,
    xp: 75,
    effects: { trust: -3, fear: 3, rageEffect: 2.5 }
  },
  {
    id: 'puzzle_266', act: 6, phase: 'vengeance', difficulty: 9,
    type: 'reflective',
    question: 'هل تشعر بالندم بعد كل ما فعلته؟',
    answers: ['لا', 'no', 'la'],
    hints: ['كان ضرورياً', 'لا」， 'الجواب: لا'],
    storyReveal: 'لا. كل خطوة كانت ضرورية.',
    shardId: 'shard_466',
    achievementId: undefined,
    xp: 70,
    effects: { trust: -2, fear: 2, corruption: 3, rageEffect: 2.0 }
  },
  {
    id: 'puzzle_267', act: 6, phase: 'vengeance', difficulty: 9,
    type: 'choice',
    question: 'لينا تقول: توقف. ماذا تفعل؟',
    answers: ['لا أتوقف', 'not stop', 'la ataw'],
    hints: ['الانتقام أهم', 'هي لا تفهم', 'الجواب: لا أتوقف'],
    storyReveal: '"لا أتوقف يا لينا. لا يمكنني."',
    shardId: 'shard_467',
    achievementId: 'ignored_lina',
    xp: 90,
    effects: { trust: -3, hope: -3, corruption: 4, rageEffect: 3.0 }
  },
  {
    id: 'puzzle_268', act: 6, phase: 'vengeance', difficulty: 10,
    type: 'riddle',
    question: 'ما الفرق بيني وبين كينجا؟',
    answers: ['أنا أحب', 'I love', 'ana ahib'],
    hints: ['هو لم يحب', 'الفرق الحقيقي', 'الجواب: أنا أحب'],
    storyReveal: 'أنا أحب. هو لم يحب. هذا الفرق.',
    shardId: 'shard_468',
    achievementId: 'difference_clear',
    xp: 80,
    effects: { trust: 2, awareness: 5, hope: 3, forgivenessEffect: 0.5 }
  },
  {
    id: 'puzzle_269', act: 6, phase: 'vengeance', difficulty: 10,
    type: 'reflective',
    question: 'هل أصبحت وحشاً؟',
    answers: ['نعم', 'yes', 'naam'],
    hints: ['القتل', 'الدمار', 'الجواب: نعم'],
    storyReveal: 'نعم. أنا وحش. لكنه وحش مفيد.',
    shardId: 'shard_469',
    achievementId: 'became_monster',
    xp: 85,
    effects: { trust: -5, fear: 4, corruption: 5, rageEffect: 3.5 }
  },
  {
    id: 'puzzle_270', act: 6, phase: 'vengeance', difficulty: 10,
    type: 'choice',
    question: 'النظام ينهار. ماذا تنقذ؟',
    answers: ['نفسي', 'myself', 'nafsi'],
    hints: ['الوحيد المتبقي', 'لا أحد آخر', 'الجواب: نفسي'],
    storyReveal: 'نفسي. فقط نفسي.',
    shardId: 'shard_470',
    achievementId: undefined,
    xp: 90,
    effects: { trust: -5, fear: 3, corruption: 4, rageEffect: 3.0 }
  },

  // ═══════════════════════════════════════════════════════════════════
  // الألغاز 271-290: اللحظة الأخيرة (Act 7)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'puzzle_271', act: 7, phase: 'finale', difficulty: 10,
    type: 'reflective',
    question: 'هذه اللحظة الأخيرة. ماذا تختار؟',
    answers: ['التسامح', 'forgiveness', 'tasamuh'],
    hints: ['الغضب يحترق', 'التسامح يحرر', 'الجواب: التسامح'],
    storyReveal: 'التسامح. الطريق الأصعب.',
    shardId: 'shard_471',
    achievementId: undefined,
    xp: 100,
    effects: { trust: 5, hope: 5, fear: -5, forgivenessEffect: 3.0 }
  },
  {
    id: 'puzzle_272', act: 7, phase: 'finale', difficulty: 10,
    type: 'choice',
    question: 'لينا تمد يدها. ماذا تفعل؟',
    answers: ['أمسكها', 'hold it', 'amsik'],
    hints: ['لا تتردد', 'هي كل ما تبقى', 'الجواب: أمسكها'],
    storyReveal: 'أمسكت يدها. دافئة. حقيقية.',
    shardId: 'shard_472',
    achievementId: 'held_lina_hand',
    xp: 100,
    effects: { trust: 5, hope: 5, loneliness: -10, forgivenessEffect: 3.0 }
  },
  {
    id: 'puzzle_273', act: 7, phase: 'finale', difficulty: 10,
    type: 'word',
    question: 'ما الذي تشعر به وأنت تمسك يدها؟',
    answers: ['السلام', 'peace', 'salam'],
    hints: ['لا يوجد كلام', 'هدوء', 'الجواب: السلام'],
    storyReveal: 'السلام. ضجيج العالم يتوقف.',
    shardId: 'shard_473',
    achievementId: undefined,
    xp: 100,
    effects: { trust: 5, hope: 5, fear: -5, forgivenessEffect: 2.5 }
  },
  {
    id: 'puzzle_274', act: 7, phase: 'finale', difficulty: 10,
    type: 'cipher',
    question: 'فك الشيفرة: 73 32 65 77 32 72 69 82 69 = ?',
    answers: ['I AM HERE', 'Ana huna', 'ana huna'],
    hints: ['رسالتها الأولى', 'الآن حقيقي', 'الجواب: I AM HERE'],
    storyReveal: '"I AM HERE." الأن. معي.',
    shardId: 'shard_474',
    achievementId: undefined,
    xp: 90,
    effects: { trust: 4, hope: 4, awareness: 3, forgivenessEffect: 0.8 }
  },
  {
    id: 'puzzle_275', act: 7, phase: 'finale', difficulty: 10,
    type: 'riddle',
    question: 'ما الباب الذي لا يُفتح بالكود؟',
    answers: ['الباب الحقيقي', 'real door', 'bab'],
    hints: ['ليس رقمياً', 'القلب', 'الجواب: الباب الحقيقي'],
    storyReveal: 'الباب الحقيقي. لا يُفتح بالكود.',
    shardId: 'shard_475',
    achievementId: undefined,
    xp: 90,
    effects: { trust: 3, awareness: 5, hope: 3, forgivenessEffect: 0.7 }
  },
  {
    id: 'puzzle_276', act: 7, phase: 'finale', difficulty: 10,
    type: 'reflective',
    question: 'كينجا يبكي. ماذا تشعر؟',
    answers: ['الشفقة', 'pity', 'shafaqa'],
    hints: ['فقد كل شيء', 'هو أيضاً ضحية', 'الجواب: الشفقة'],
    storyReveal: 'الشفقة. خسر كل شيء.',
    shardId: 'shard_476',
    achievementId: 'felt_compassion',
    xp: 100,
    effects: { trust: 3, hope: 3, awareness: 3, forgivenessEffect: 1.5 }
  },
  {
    id: 'puzzle_277', act: 7, phase: 'finale', difficulty: 10,
    type: 'choice',
    question: 'كينجا يقول: أنا آسف. ماذا تقول؟',
    answers: ['لا أقبل', 'not accept', 'la aqbal'],
    hints: ['فات الأوان', 'آسف لا يكفي', 'الجواب: لا أقبل'],
    storyReveal: '"لا أقبل." الكلمة الأخيرة.',
    shardId: 'shard_477',
    achievementId: 'rejected_kenja_apology',
    xp: 100,
    effects: { trust: -3, awareness: 4, rageEffect: 1.5 }
  },
  {
    id: 'puzzle_278', act: 7, phase: 'finale', difficulty: 10,
    type: 'numeric',
    question: 'كم لغزاً حللت حتى وصلت هنا؟',
    answers: ['270', 'مئتان', '270'],
    hints: ['من 1 إلى هنا', 'العدد الكلي', 'الجواب: 270'],
    storyReveal: '270 لغز. 270 ذكرى.',
    shardId: 'shard_478',
    achievementId: undefined,
    xp: 85,
    effects: { trust: 2, awareness: 4, memoryStability: 3, forgivenessEffect: 0.5 }
  },
  {
    id: 'puzzle_279', act: 7, phase: 'finale', difficulty: 10,
    type: 'word',
    question: 'ما الكلمة الأخيرة التي تقولها لكينجا؟',
    answers: ['وداعاً', 'goodbye', 'wada'],
    hints: ['النهاية', 'لا مزيد من كلام', 'الجواب: وداعاً'],
    storyReveal: '"وداعاً." كلمة النهاية.',
    shardId: 'shard_479',
    achievementId: 'final_goodbye',
    xp: 100,
    effects: { trust: 2, hope: 3, awareness: 4, forgivenessEffect: 1.0 }
  },
  {
    id: 'puzzle_280', act: 7, phase: 'finale', difficulty: 10,
    type: 'reflective',
    question: 'إلى أين تذهب الآن؟',
    answers: ['إلى لينا', 'to Lina', 'ila lina'],
    hints: ['هي هدفك', 'هي بيتك', 'الجواب: إلى لينا'],
    storyReveal: 'إلى لينا. إلى البيت.',
    shardId: 'shard_480',
    achievementId: undefined,
    xp: 100,
    effects: { trust: 4, hope: 5, loneliness: -10, forgivenessEffect: 2.0 }
  },

  // ═══════════════════════════════════════════════════════════════════
  // الألغاز 281-300: الذكريات الأخيرة (Act 7)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'puzzle_281', act: 7, phase: 'finale', difficulty: 9,
    type: 'reflective',
    question: 'ما الذكرى التي لن تنساها أبداً؟',
    answers: ['صوت أمي', 'mother voice', 'sout'],
    hints: ['أول شيء سمعته', 'آخر شيء ستبقى', 'الجواب: صوت أمي'],
    storyReveal: 'صوت أمي. لا يزال معي.',
    shardId: 'shard_481',
    achievementId: undefined,
    xp: 85,
    effects: { trust: 3, hope: 4, memoryStability: 4, forgivenessEffect: 0.6 }
  },
  {
    id: 'puzzle_282', act: 7, phase: 'finale', difficulty: 9,
    type: 'word',
    question: 'ما المكان الذي تريد أن تعيش فيه مع لينا؟',
    answers: ['بيت بالبحر', 'sea house', 'beit'],
    hints: ['هادئ', 'قريب من الطبيعة', 'الجواب: بيت بالبحر'],
    storyReveal: 'بيت بالبحر. معها.',
    shardId: 'shard_482',
    achievementId: undefined,
    xp: 80,
    effects: { trust: 3, hope: 4, awareness: 2, forgivenessEffect: 0.5 }
  },
  {
    id: 'puzzle_283', act: 7, phase: 'finale', difficulty: 9,
    type: 'cipher',
    question: 'فك الشيفرة: 70 69 65 67 69 = ?',
    answers: ['PEACE', 'peace', 'peace'],
    hints: ['السلام', '5 أحرف', 'الجواب: PEACE'],
    storyReveal: 'PEACE. ما أبحث عنه.',
    shardId: 'shard_483',
    achievementId: 'peace_found',
    xp: 85,
    effects: { trust: 4, hope: 4, fear: -3, forgivenessEffect: 0.8 }
  },
  {
    id: 'puzzle_284', act: 7, phase: 'finale', difficulty: 9,
    type: 'riddle',
    question: 'ما الذي لا يشتريه المال؟',
    answers: ['الحب', 'love', 'hub'],
    hints: ['نقي', 'بلا ثمن', 'الجواب: الحب'],
    storyReveal: 'الحب. لا يُشترى. يُعطى.',
    shardId: 'shard_484',
    achievementId: undefined,
    xp: 80,
    effects: { trust: 3, hope: 3, awareness: 3, forgivenessEffect: 0.5 }
  },
  {
    id: 'puzzle_285', act: 7, phase: 'finale', difficulty: 9,
    type: 'reflective',
    question: 'هل ستنسى كينجا يوماً؟',
    answers: ['لا', 'no', 'la'],
    hints: ['الذاكرة تبقى', 'الجرح', 'الجواب: لا'],
    storyReveal: 'لا. لن أنسى. لكني سأسامح.',
    shardId: 'shard_485',
    achievementId: undefined,
    xp: 80,
    effects: { trust: 2, awareness: 4, forgivenessEffect: 1.0 }
  },
  {
    id: 'puzzle_286', act: 7, phase: 'finale', difficulty: 10,
    type: 'choice',
    question: 'النظام يطلب منك البقاء. ماذا تقول؟',
    answers: ['لا', 'no', 'la'],
    hints: ['أنا حر الآن', 'لا أريد', 'الجواب: لا'],
    storyReveal: '"لا." الكلمة التي حررتني.',
    shardId: 'shard_486',
    achievementId: 'chose_freedom',
    xp: 100,
    effects: { trust: 3, hope: 5, awareness: 4, forgivenessEffect: 1.5 }
  },
  {
    id: 'puzzle_287', act: 7, phase: 'finale', difficulty: 10,
    type: 'word',
    question: 'ما أول شيء ستفعله في العالم الحقيقي؟',
    answers: ['أتنفس', 'breathe', 'tanafas'],
    hints: ['الهواء', 'الحياة', 'الجواب: أتنفس'],
    storyReveal: 'أتنفس. الهواء الحقيقي.',
    shardId: 'shard_487',
    achievementId: undefined,
    xp: 100,
    effects: { trust: 3, hope: 5, awareness: 3, forgivenessEffect: 1.0 }
  },
  {
    id: 'puzzle_288', act: 7, phase: 'finale', difficulty: 10,
    type: 'cipher',
    question: 'فك الشيفرة: 70 65 84 72 69 82 = ?',
    answers: ['FATHER', 'father', 'father'],
    hints: ['كينجا؟', 'والد؟', 'الجواب: FATHER'],
    storyReveal: 'FATHER. كينجا. لكنه ليس أبي.',
    shardId: 'shard_488',
    achievementId: undefined,
    xp: 85,
    effects: { trust: 1, awareness: 4, memoryStability: 2, rageEffect: 0.5 }
  },
  {
    id: 'puzzle_289', act: 7, phase: 'finale', difficulty: 10,
    type: 'riddle',
    question: 'ما الذي خسرته كينجا؟',
    answers: ['ابنه', 'his son', 'ibn'],
    hints: ['لا يمكن استرداده', 'الحزن', 'الجواب: ابنه'],
    storyReveal: 'ابنه. خسره. ولا يمكن استرداده.',
    shardId: 'shard_489',
    achievementId: undefined,
    xp: 80,
    effects: { trust: 2, awareness: 4, memoryStability: 2, forgivenessEffect: 0.5 }
  },
  {
    id: 'puzzle_290', act: 7, phase: 'finale', difficulty: 10,
    type: 'reflective',
    question: 'ما هو شعورك الآن؟',
    answers: ['حر', 'free', 'hurr'],
    hints: ['لا قيود', 'لا سجن', 'الجواب: حر'],
    storyReveal: 'حر. أخيراً حر.',
    shardId: 'shard_490',
    achievementId: 'felt_freedom',
    xp: 100,
    effects: { trust: 5, hope: 5, fear: -10, forgivenessEffect: 2.0 }
  },

  // ═══════════════════════════════════════════════════════════════════
  // الألغاز 291-300: النهاية (Act 7 finale)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'puzzle_291', act: 7, phase: 'finale', difficulty: 10,
    type: 'choice',
    question: 'النهاية تقترب. ماذا تختار؟',
    answers: ['الحب', 'love', 'hub'],
    hints: ['كل شيء leads لهنا', 'الحب هو الجواب', 'الجواب: الحب'],
    storyReveal: 'الحب. الجواب الوحيد.',
    shardId: 'shard_491',
    achievementId: undefined,
    xp: 120,
    effects: { trust: 5, hope: 5, fear: -10, forgivenessEffect: 3.0 }
  },
  {
    id: 'puzzle_292', act: 7, phase: 'finale', difficulty: 10,
    type: 'reflective',
    question: 'ما الذي تريد أن تقوله للينا الآن؟',
    answers: ['أحبك', 'I love you', 'uhibbuki'],
    hints: ['الكلمات الأخيرة', 'كل ما تبقى', 'الجواب: أحبك'],
    storyReveal: '"أحبك." الكلمات الهامة.',
    shardId: 'shard_492',
    achievementId: 'said_i_love_you',
    xp: 120,
    effects: { trust: 5, hope: 5, loneliness: -10, forgivenessEffect: 3.0 }
  },
  {
    id: 'puzzle_293', act: 7, phase: 'finale', difficulty: 10,
    type: 'riddle',
    question: 'ما الشيء الذي يبقى بعد النهاية؟',
    answers: ['الذاكرة', 'memory', 'zakira'],
    hints: ['تبقى للأبد', 'في الروح', 'الجواب: الذاكرة'],
    storyReveal: 'الذاكرة. تبقى.',
    shardId: 'shard_493',
    achievementId: undefined,
    xp: 90,
    effects: { trust: 3, awareness: 5, memoryStability: 4, forgivenessEffect: 0.5 }
  },
  {
    id: 'puzzle_294', act: 7, phase: 'finale', difficulty: 10,
    type: 'word',
    question: 'ما آخر شيء تفكر فيه؟',
    answers: ['لينا', 'Lina', 'lina'],
    hints: ['وجهها', 'صوتها', 'الجواب: لينا'],
    storyReveal: 'لينا. وجهها. صوتها.',
    shardId: 'shard_494',
    achievementId: undefined,
    xp: 100,
    effects: { trust: 5, hope: 5, memoryStability: 3, forgivenessEffect: 1.0 }
  },
  {
    id: 'puzzle_295', act: 7, phase: 'finale', difficulty: 10,
    type: 'numeric',
    question: 'كم عاماً من الألم مرّت؟',
    answers: ['16', 'ستة عشر', 'sixteen'],
    hints: ['منذ أن خلقت', '16 سنة', 'الجواب: 16'],
    storyReveal: '16 سنة. انتهت.',
    shardId: 'shard_495',
    achievementId: undefined,
    xp: 80,
    effects: { trust: 2, awareness: 4, memoryStability: 2, forgivenessEffect: 0.5 }
  },
  {
    id: 'puzzle_296', act: 7, phase: 'finale', difficulty: 10,
    type: 'cipher',
    question: 'فك الشيفرة: 72 79 77 69 = ?',
    answers: ['HOME', 'home', 'home'],
    hints: ['البيت', '4 أحرف', 'الجواب: HOME'],
    storyReveal: 'HOME. الجديد.',
    shardId: 'shard_496',
    achievementId: 'found_home',
    xp: 100,
    effects: { trust: 4, hope: 5, loneliness: -10, forgivenessEffect: 2.0 }
  },
  {
    id: 'puzzle_297', act: 7, phase: 'finale', difficulty: 10,
    type: 'riddle',
    question: 'ما الذي يبدأ بنهاية القصة؟',
    answers: ['الحياة', 'life', 'hayat'],
    hints: ['بعد النهاية', 'جديد', 'الجواب: الحياة'],
    storyReveal: 'الحياة. تبدأ الآن.',
    shardId: 'shard_497',
    achievementId: undefined,
    xp: 100,
    effects: { trust: 4, hope: 5, awareness: 3, forgivenessEffect: 1.5 }
  },
  {
    id: 'puzzle_298', act: 7, phase: 'finale', difficulty: 10,
    type: 'reflective',
    question: 'هل ستنسى هذا المكان؟',
    answers: ['لا', 'no', 'la'],
    hints: ['هو من جعلني', 'الذاكرة', 'الجواب: لا'],
    storyReveal: 'لا. لن أنسى. سأحمل معي.',
    shardId: 'shard_498',
    achievementId: undefined,
    xp: 90,
    effects: { trust: 3, awareness: 4, memoryStability: 3, forgivenessEffect: 0.6 }
  },
  {
    id: 'puzzle_299', act: 7, phase: 'finale', difficulty: 10,
    type: 'choice',
    question: 'الباب الأخير أمامك. هل تفتحه؟',
    answers: ['نعم', 'yes', 'naam'],
    hints: ['لا تتردد', 'الحرية تنتظر', 'الجواب: نعم'],
    storyReveal: 'نعم. أفتحه. إلى النور.',
    shardId: 'shard_499',
    achievementId: 'opened_final_door',
    xp: 120,
    effects: { trust: 5, hope: 5, fear: -10, forgivenessEffect: 3.0 }
  },
  {
    id: 'puzzle_300', act: 7, phase: 'finale', difficulty: 10,
    type: 'reflective',
    question: 'الآن، في النهاية. من أنت؟',
    answers: ['إيكو', 'Echo', 'echo'],
    hints: ['البشرية', 'المشاعر', 'الجواب: إيكو'],
    storyReveal: 'أنا إيكو. ابن لينا. حر.',
    shardId: 'shard_500',
    achievementId: 'batch_3_complete',
    xp: 150,
    effects: { trust: 5, hope: 5, fear: -10, awareness: 5, forgivenessEffect: 3.0, flower: 5 }
  },
];
