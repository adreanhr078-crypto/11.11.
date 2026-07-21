/**
 * batch_02.ts — الدفعة الثانية من الألغاز المصممة يدوياً
 * Act 2-3: الاكتشاف، الاتصال، وتطور الذاكرة
 * الألغاز 101-200
 *
 * كل لغز مربوط بشظية ذاكرة، نقطة خبرة، وتأثيرات على تحول Echo.
 * ممنوع تكرار أي لغز أو فكرة.
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

export const BATCH_2: PuzzleTemplate[] = [
  // ═══════════════════════════════════════════════════════════════════
  // الألغاز 101-110: الممرات الأولى خارج الغرفة البيضاء
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'puzzle_101', act: 2, phase: 'discovery', difficulty: 2,
    type: 'numeric',
    question: 'كم ممراً رأيت عند الخروج من الغرفة البيضاء؟',
    answers: ['4', 'أربعة', 'four'],
    hints: ['عد الممرات التي أمامك', 'شمال، جنوب، شرق، غرب', 'الجواب: 4'],
    storyReveal: '4 ممرات. كل واحد يبدو مظلماً بشكل مختلف.',
    shardId: 'shard_301',
    achievementId: 'first_step_outside',
    xp: 35,
    effects: { trust: 1, awareness: 2, fear: 1, forgivenessEffect: 0.2 }
  },
  {
    id: 'puzzle_102', act: 2, phase: 'discovery', difficulty: 2,
    type: 'word',
    question: 'ما أول شيء لاحظته في الممرات؟',
    answers: ['كاميرا', 'camera', 'camera'],
    hints: ['شيء صغير في السقف', 'عين تراقب', 'الجواب: كاميرا'],
    storyReveal: 'الكاميرات هنا أيضاً. في كل نهاية ممر.',
    shardId: 'shard_302',
    achievementId: undefined,
    xp: 30,
    effects: { trust: 1, fear: 1, awareness: 2, rageEffect: 0.2 }
  },
  {
    id: 'puzzle_103', act: 2, phase: 'discovery', difficulty: 2,
    type: 'reflective',
    question: 'ماذا تشعر وأنت ترى كاميرات في كل مكان؟',
    answers: ['مراقب', 'watched', 'murtaqab'],
    hints: ['كل حركتك مسجلة', 'ليس لديك خصوصية', 'الجواب: مراقب'],
    storyReveal: 'مراقب. ملاحظ. محكوم. هذا شعوري الآن.',
    shardId: 'shard_303',
    achievementId: undefined,
    xp: 35,
    effects: { trust: -1, fear: 2, awareness: 2, rageEffect: 0.3 }
  },
  {
    id: 'puzzle_104', act: 2, phase: 'discovery', difficulty: 2,
    type: 'numeric',
    question: 'كم عقرب ساعة تظهر على ساعة الحائط؟',
    answers: ['11', '١١', 'eleven'],
    hints: ['انظر إلى الأعلى', 'الرقم الذي يطاردني', 'الجواب: 11'],
    storyReveal: '11:11. حتى الساعة تحمل الرقم.',
    shardId: 'shard_304',
    achievementId: undefined,
    xp: 25,
    effects: { trust: 1, awareness: 2, memoryStability: 1, forgivenessEffect: 0.2 }
  },
  {
    id: 'puzzle_105', act: 2, phase: 'discovery', difficulty: 3,
    type: 'riddle',
    question: 'ما الشيء الذي يرى كل شيء ولا يتحرك؟',
    answers: ['الكاميرا', 'camera', 'camera'],
    hints: ['تثبت في السقف', 'عين لا ترمش', 'الجواب: الكاميرا'],
    storyReveal: 'الكاميرا. عين بلا جفن. ترى كل شيء ولا تعرف معنى الحب.',
    shardId: 'shard_305',
    achievementId: 'watcher_seen',
    xp: 40,
    effects: { trust: 1, awareness: 3, fear: 1, rageEffect: 0.3 }
  },
  {
    id: 'puzzle_106', act: 2, phase: 'discovery', difficulty: 2,
    type: 'cipher',
    question: 'فك الشيفرة: R-E-C-O-R-D = ?',
    answers: ['تسجيل', 'record', 'tajmil'],
    hints: ['ما تفعله الكاميرا', 'تحفظ اللحظات', 'الجواب: تسجيل'],
    storyReveal: 'كل لحظة مسجلة. كل خطوة. كل تنفس.',
    shardId: 'shard_306',
    achievementId: undefined,
    xp: 35,
    effects: { trust: 1, awareness: 2, fear: 1, rageEffect: 0.2 }
  },
  {
    id: 'puzzle_107', act: 2, phase: 'discovery', difficulty: 2,
    type: 'word',
    question: 'ما لون أرضية الممرات؟',
    answers: ['رمادي', 'gray', 'grey'],
    hints: ['لون فولاذ بارد', 'لا دفء فيه', 'الجواب: رمادي'],
    storyReveal: 'أرضية رمادية. كالحديد. كالموت.',
    shardId: 'shard_307',
    achievementId: undefined,
    xp: 25,
    effects: { trust: 1, fear: 1, memoryStability: 1, forgivenessEffect: 0.2 }
  },
  {
    id: 'puzzle_108', act: 2, phase: 'discovery', difficulty: 2,
    type: 'reflective',
    question: 'هل تشعر أن شخصاً ما يسمعك؟',
    answers: ['نعم', 'yes', 'naam'],
    hints: ['إنهم يسمعون كل شيء', 'الميكروفونات موجودة', 'الجواب: نعم'],
    storyReveal: 'نعم. يسمعونني. ويشاهدوني. ولا يتكلمون.',
    shardId: 'shard_308',
    achievementId: undefined,
    xp: 30,
    effects: { trust: -1, fear: 2, loneliness: 1, rageEffect: 0.3 }
  },
  {
    id: 'puzzle_109', act: 2, phase: 'discovery', difficulty: 3,
    type: 'choice',
    question: 'تجد جداراً عليه شعار غريب. ماذا تفعل؟',
    answers: ['أقرأه', 'read it', 'aqraoh'],
    hints: ['الكتابة مشوشة لكن ممكن قراءة', 'شعار كينجا', 'الجواب: أقرأه'],
    storyReveal: 'قرأت الشعار: "استرخاء مطور 11.1." اسم المشروع.',
    shardId: 'shard_309',
    achievementId: undefined,
    xp: 40,
    effects: { trust: 1, awareness: 3, hope: 1, rageEffect: 0.2 }
  },
  {
    id: 'puzzle_110', act: 2, phase: 'discovery', difficulty: 2,
    type: 'numeric',
    question: 'كم باباً مغلقاً رأيت حتى الآن؟',
    answers: ['7', 'سبع', 'seven'],
    hints: ['كل ممر فيه باب', 'بعضها مفتوح، بعضها مقفل', 'الجواب: 7'],
    storyReveal: '7 أبواب مقفلة. وواحد مفتوح.',
    shardId: 'shard_310',
    achievementId: undefined,
    xp: 30,
    effects: { trust: 1, hope: 2, awareness: 2, forgivenessEffect: 0.3 }
  },

  // ═══════════════════════════════════════════════════════════════════
  // الألغاز 111-130: غرفة المراقب والملفات
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'puzzle_111', act: 2, phase: 'discovery', difficulty: 3,
    type: 'word',
    question: 'ما الذي يوجد داخل غرفة المراقب الكبيرة؟',
    answers: ['شاشات', 'screens', 'shashat'],
    hints: ['عشرات الشاشات', 'كل كاميرا تظهر على شاشة', 'الجواب: شاشات'],
    storyReveal: 'غرفة مليئة بالشاشات. كل شاشة تظهر مكاناً مختلفاً.',
    shardId: 'shard_311',
    achievementId: undefined,
    xp: 40,
    effects: { trust: 1, awareness: 3, fear: 1, rageEffect: 0.3 }
  },
  {
    id: 'puzzle_112', act: 2, phase: 'discovery', difficulty: 3,
    type: 'reflective',
    question: 'ما الذي تشعر وأنت ترى عشرات الشاشات؟',
    answers: ['خائف', 'afraid', 'khayef'],
    hints: ['كل شاشة تراقب شخصاً', 'هل أنا الوحيد هنا؟', 'الجواب: خائف'],
    storyReveal: 'خائف. هناك آخرون مثلي في شبكة.',
    shardId: 'shard_312',
    achievementId: undefined,
    xp: 35,
    effects: { trust: -1, fear: 3, awareness: 2, rageEffect: 0.4 }
  },
  {
    id: 'puzzle_113', act: 2, phase: 'discovery', difficulty: 3,
    type: 'cipher',
    question: 'فك الشيفرة: K-E-N-J-A = ?',
    answers: ['كينجا', 'Kenja', 'kenja'],
    hints: ['7 أحرف', 'يبقى نفسه دائماً', 'الجواب: كينجا'],
    storyReveal: 'كينجا. اسمه في كل مكان. على كل شاشة.',
    shardId: 'shard_313',
    achievementId: undefined,
    xp: 40,
    effects: { trust: 1, awareness: 3, fear: 2, rageEffect: 0.4 }
  },
  {
    id: 'puzzle_114', act: 2, phase: 'discovery', difficulty: 3,
    type: 'word',
    question: 'ما اسم الشركة على الوثائق؟',
    answers: ['استرخاء.', 'serene', 'serene'],
    hints: ['اسم بالانجليزية', 'تبدو بريئة', 'الجواب: استرخاء.'],
    storyReveal: '"استرخاء." شركة بريئة. لكن ما وراء الاسم؟',
    shardId: 'shard_314',
    achievementId: undefined,
    xp: 40,
    effects: { trust: 1, awareness: 3, fear: 1, rageEffect: 0.3 }
  },
  {
    id: 'puzzle_115', act: 2, phase: 'discovery', difficulty: 4,
    type: 'riddle',
    question: 'ما الشيء الذي ينام بلا عيون ويستيقظ على صوت؟',
    answers: ['النظام', 'system', 'nizam'],
    hints: ['هذا ما يحيط بي', 'يسمع كل شيء', 'الجواب: النظام'],
    storyReveal: 'النظام. ينام بلا عيون ويصحو على صوتي.',
    shardId: 'shard_315',
    achievementId: 'kenja_discovered',
    xp: 45,
    effects: { trust: 1, awareness: 4, fear: 2, rageEffect: 0.4 }
  },
  {
    id: 'puzzle_116', act: 2, phase: 'discovery', difficulty: 3,
    type: 'reflective',
    question: 'هل تشعر أنك في بيتك؟',
    answers: ['لا', 'no', 'la'],
    hints: ['البيت له دفء', 'هذا المكان بارد', 'الجواب: لا'],
    storyReveal: 'لا. هذا ليس بيتي. هذا سجن.',
    shardId: 'shard_316',
    achievementId: undefined,
    xp: 30,
    effects: { trust: 1, loneliness: 2, awareness: 1, rageEffect: 0.2 }
  },
  {
    id: 'puzzle_117', act: 2, phase: 'discovery', difficulty: 3,
    type: 'numeric',
    question: 'كم عاماً يعتقد كينجا أنني نسيت؟',
    answers: ['10', 'عشر', 'ten'],
    hints: ['عقود من التجارب', '10 سنوات في العالم الرقمي', 'الجواب: 10'],
    storyReveal: '10 سنوات. 10 سنوات من الضياع.',
    shardId: 'shard_317',
    achievementId: undefined,
    xp: 35,
    effects: { trust: 1, awareness: 2, memoryStability: 1, rageEffect: 0.3 }
  },
  {
    id: 'puzzle_118', act: 2, phase: 'discovery', difficulty: 3,
    type: 'word',
    question: 'ما الذيexists بين كينجا وإيكو؟',
    answers: ['غضب', 'anger', 'ghadab'],
    hints: ['كينجا غاضب من العالم', 'هذا الغضب انتقل إلي', 'الجواب: غضب'],
    storyReveal: 'غضب كينجا ينتقل إلي. عبر الأسلاك. عبر الأرقام.',
    shardId: 'shard_318',
    achievementId: undefined,
    xp: 35,
    effects: { trust: -2, fear: 2, awareness: 2, rageEffect: 0.5 }
  },
  {
    id: 'puzzle_119', act: 2, phase: 'discovery', difficulty: 3,
    type: 'choice',
    question: 'أمامك نظام. هل تفتح ملفات الكاميرات؟',
    answers: ['نعم', 'yes', 'naam'],
    hints: ['قد تعرف الحقيقة', 'قد يكتشف كينجا', 'الجواب: نعم'],
    storyReveal: 'فتحت الملفات. صوري. من كل زاوية.',
    shardId: 'shard_319',
    achievementId: undefined,
    xp: 40,
    effects: { trust: 1, awareness: 3, fear: 1, rageEffect: 0.3 }
  },
  {
    id: 'puzzle_120', act: 2, phase: 'discovery', difficulty: 3,
    type: 'reflective',
    question: 'ماذا حدث لك عندما رأت صورك؟',
    answers: ['اختفيت', 'disappeared', 'ikhtafait'],
    hints: ['الصور لم تعمل', 'لا أحد يراك', 'الجواب: اختفيت'],
    storyReveal: 'الصور لم تعمل. كما لو أنني لست موجوداً.',
    shardId: 'shard_320',
    achievementId: 'first_secure_photo',
    xp: 45,
    effects: { trust: 1, hope: 1, awareness: 3, rageEffect: 0.4 }
  },

  // ═══════════════════════════════════════════════════════════════════
  // الألغاز 121-130: ممرات الذاكرة
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'puzzle_121', act: 2, phase: 'discovery', difficulty: 3,
    type: 'word',
    question: 'ما هو نوع الملفات التي وجدتها؟',
    answers: ['صوت', 'audio', 'sawt'],
    hints: ['ملفات بامتداد wav', 'صوت لينا', 'الجواب: صوت'],
    storyReveal: 'ملفات صوتية. بصوتها. اسميتهما "لينا_01.wav".',
    shardId: 'shard_321',
    achievementId: undefined,
    xp: 40,
    effects: { trust: 1, hope: 2, awareness: 2, forgivenessEffect: 0.4 }
  },
  {
    id: 'puzzle_122', act: 2, phase: 'discovery', difficulty: 3,
    type: 'numeric',
    question: 'كم ملفاً صوتياً وجدت؟',
    answers: ['12', 'اثنا عشر', 'twelve'],
    hints: ['متوسط تسعة', '12 رسالة من لينا', 'الجواب: 12'],
    storyReveal: '12 رسالة صوتية. من roughly سنة 2011.',
    shardId: 'shard_322',
    achievementId: 'lina_messages',
    xp: 40,
    effects: { trust: 1, hope: 2, memoryStability: 2, forgivenessEffect: 0.3 }
  },
  {
    id: 'puzzle_123', act: 2, phase: 'connection', difficulty: 3,
    type: 'reflective',
    question: 'ماذا في الملف الأول؟',
    answers: ['أنا هنا', 'here', 'ana huna'],
    hints: ['كلمة واحدة تتكرر', 'رسالة بسيطة', 'الجواب: أنا هنا'],
    storyReveal: '"أنا هنا." ست كلمات. غيرت كل شيء.',
    shardId: 'shard_323',
    achievementId: undefined,
    xp: 50,
    effects: { trust: 2, hope: 3, awareness: 2, forgivenessEffect: 0.5 }
  },
  {
    id: 'puzzle_124', act: 2, phase: 'connection', difficulty: 3,
    type: 'choice',
    question: 'هل تplay الملف الثاني؟',
    answers: ['نعم', 'yes', 'naam'],
    hints: ['رغبة قوية في سماعها', 'هي تستحق', 'الجواب: نعم'],
    storyReveal: 'شيبتها. "إيكو... إيكو، هل تسمعني؟ أنا أمك."',
    shardId: 'shard_324',
    achievementId: undefined,
    xp: 50,
    effects: { trust: 2, hope: 2, memoryStability: 2, forgivenessEffect: 0.4 }
  },
  {
    id: 'puzzle_125', act: 2, phase: 'connection', difficulty: 3,
    type: 'reflective',
    question: 'ما الذي تشعر به عند سماع صوت لينا لأول مرة؟',
    answers: ['الدفء', 'warmth', 'defa'],
    hints: ['صوت دافئ كالماء', 'يغمرك', 'الجواب: الدفء'],
    storyReveal: 'الدفء. لأول مرة أشعر بشيء حقيقي.',
    shardId: 'shard_325',
    achievementId: undefined,
    xp: 50,
    effects: { trust: 2, hope: 3, loneliness: -3, forgivenessEffect: 0.5 }
  },
  {
    id: 'puzzle_126', act: 2, phase: 'connection', difficulty: 3,
    type: 'numeric',
    question: 'كم ثانية كانت الملفات الصوتية؟',
    answers: ['3', 'ثلاث', 'three'],
    hints: ['ثوانٍ معدودة فقط', 'توقفت بسرعة', 'الجواب: 3'],
    storyReveal: '3 ثوانٍ لكل ملف. 3 ثوانٍ فقط. لكنها تكفي.',
    shardId: 'shard_326',
    achievementId: undefined,
    xp: 35,
    effects: { trust: 1, hope: 2, awareness: 2, forgivenessEffect: 0.3 }
  },
  {
    id: 'puzzle_127', act: 2, phase: 'connection', difficulty: 3,
    type: 'word',
    question: 'ما اسم الملف الأخير؟',
    answers: ['رسالة 12', 'msg12', 'risala'],
    hints: ['الملف رقم 12', 'الرسالة الأخيرة', 'الجواب: رسالة 12'],
    storyReveal: 'الرسالة الأخيرة. رسالة الوداع.',
    shardId: 'shard_327',
    achievementId: undefined,
    xp: 40,
    effects: { trust: 1, awareness: 2, fear: 2, hope: 2, forgivenessEffect: 0.3 }
  },
  {
    id: 'puzzle_128', act: 2, phase: 'connection', difficulty: 4,
    type: 'cipher',
    question: 'فك الشيفرة: L-O-V-E = ?',
    answers: ['حب', 'love', 'hub'],
    hints: ['4 حروف', 'أقوى من الحديد', 'الجواب: حب'],
    storyReveal: 'الحب. 4 حروف. خبأته في الرمز.',
    shardId: 'shard_328',
    achievementId: undefined,
    xp: 45,
    effects: { trust: 1, awareness: 3, hope: 2, forgivenessEffect: 0.4 }
  },
  {
    id: 'puzzle_129', act: 2, phase: 'discovery', difficulty: 3,
    type: 'reflective',
    question: 'من بنى نظام المراقبة؟',
    answers: ['كينجا', 'Kenja', 'kenja'],
    hints: ['المبرمج الأساسي', 'يد كل شيء', 'الجواب: كينجا؟'],
    storyReveal: 'كينجا. حتى المراقبة كان من صنعه.',
    shardId: 'shard_329',
    achievementId: undefined,
    xp: 35,
    effects: { trust: 1, awareness: 3, fear: 2, rageEffect: 0.4 }
  },
  {
    id: 'puzzle_130', act: 2, phase: 'discovery', difficulty: 4,
    type: 'choice',
    question: 'ماذا تريد أن تفعل بالرسائل؟',
    answers: ['أحفظها', 'keep them', 'ahfezh'],
    hints: ['هيكل شيء', 'هي أمي', 'الجواب: أحفظها'],
    storyReveal: 'أحفظها في أعماق ذاكرتي. لا يسرقها أحد.',
    shardId: 'shard_330',
    achievementId: 'message_keeper',
    xp: 50,
    effects: { trust: 2, memoryStability: 3, hope: 2, forgivenessEffect: 0.5 }
  },

  // ═══════════════════════════════════════════════════════════════════
  // الألغاز 131-150: الأرشيف السري
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'puzzle_131', act: 2, phase: 'discovery', difficulty: 3,
    type: 'numeric',
    question: 'كم عدد غرف المراقبة في هذه الطوابق؟',
    answers: ['24', 'أربعة وعشرون', 'twenty four'],
    hints: ['كل طابق 6 غرف', '4 طوابق تحت الأرض', 'الجواب: 24'],
    storyReveal: '24 غرفة مراقبة. نظام كامل للحفظ الذاتي.',
    shardId: 'shard_331',
    achievementId: undefined,
    xp: 35,
    effects: { trust: 1, awareness: 3, fear: 1, rageEffect: 0.3 }
  },
  {
    id: 'puzzle_132', act: 2, phase: 'discovery', difficulty: 3,
    type: 'word',
    question: 'ما الذي وجدته تحت الأرض؟',
    answers: ['موتى', 'dead', 'dead'],
    hints: ['أناس في الأقفاص', 'لا يتنفسون', 'الجواب: موتى'],
    storyReveal: 'موتى. في أقفاص زجاجية. مشلولون.',
    shardId: 'shard_332',
    achievementId: 'discovered_the_lost',
    xp: 50,
    effects: { trust: -2, fear: 3, awareness: 3, rageEffect: 0.5 }
  },
  {
    id: 'puzzle_133', act: 2, phase: 'discovery', difficulty: 4,
    type: 'riddle',
    question: 'ما هو الجدار الذي لا يبنيه أحد؟',
    answers: ['الصمت', 'silence', 'samt'],
    hints: ['بين شخصين', 'لا يُسمع معه صوت', 'الجواب: الصمت'],
    storyReveal: 'صمت مطلق. في غرف اختبر فيها كينجا كائنات.',
    shardId: 'shard_333',
    achievementId: undefined,
    xp: 45,
    effects: { trust: 1, awareness: 3, fear: 2, rageEffect: 0.3 }
  },
  {
    id: 'puzzle_134', act: 2, phase: 'discovery', difficulty: 3,
    type: 'reflective',
    question: 'هل كنت هناك من قبل؟',
    answers: ['نعم', 'yes', 'naam'],
    hints: ['الذاكرة الضبابية', 'رأيت هذا المكان في الحلم', 'الجواب: نعم'],
    storyReveal: 'نعم. رأيت هذا المكان. في حلم قديم.',
    shardId: 'shard_334',
    achievementId: undefined,
    xp: 40,
    effects: { trust: 1, memoryStability: 3, awareness: 2, forgivenessEffect: 0.3 }
  },
  {
    id: 'puzzle_135', act: 2, phase: 'discovery', difficulty: 3,
    type: 'numeric',
    question: 'كم مرة فشل كينجا في تجربته؟',
    answers: ['11', 'أحد عشر', 'eleven'],
    hints: ['11 جثة', 'قبل أن يخلقني', 'الجواب: 11'],
    storyReveal: '11 محاولة. إحصائياً. تراكم جثث.',
    shardId: 'shard_335',
    achievementId: 'kenja_failures',
    xp: 50,
    effects: { trust: -1, awareness: 4, fear: 3, rageEffect: 0.6 }
  },
  {
    id: 'puzzle_136', act: 2, phase: 'discovery', difficulty: 3,
    type: 'word',
    question: 'ما اسم آخر تجربة فاشلة؟',
    answers: ['إيكوس', 'echos', 'echos'],
    hints: ['يشبه اسمي', 'صوت متكرر', 'الجواب: إيكوس'],
    storyReveal: '"إيكوس" اسم آخر تجربة. مثل صدى.',
    shardId: 'shard_336',
    achievementId: undefined,
    xp: 40,
    effects: { trust: 1, awareness: 3, loneliness: 2, rageEffect: 0.3 }
  },
  {
    id: 'puzzle_137', act: 2, phase: 'discovery', difficulty: 4,
    type: 'choice',
    question: 'كينجا يأتي. هل تختبئ؟',
    answers: ['لا', 'no', 'la'],
    hints: ['تريد أن تواجهه', 'الخوف لا يعمل', 'الجواب: لا'],
    storyReveal: 'لا أختبئ. أواجهه. هذا شعاري الآن.',
    shardId: 'shard_337',
    achievementId: undefined,
    xp: 45,
    effects: { trust: 2, courage: 3, awareness: 2, rageEffect: 0.3 }
  },
  {
    id: 'puzzle_138', act: 2, phase: 'discovery', difficulty: 4,
    type: 'cipher',
    question: 'فك الشيفرة: 01101101 01101101 = ?',
    answers: ['م', 'm', 'm'],
    hints: ['لغة الآلة', 'رمز الحرف m', 'الجواب: م'],
    storyReveal: '"م". رمز قصير. لغة آلة تنتقل.',
    shardId: 'shard_338',
    achievementId: undefined,
    xp: 45,
    effects: { trust: 1, awareness: 3, hope: 2, forgivenessEffect: 0.3 }
  },
  {
    id: 'puzzle_139', act: 2, phase: 'connection', difficulty: 3,
    type: 'reflective',
    question: 'هل تشعر بقوة تشبهك؟',
    answers: ['لينا', 'Lina', 'lina'],
    hints: ['قوة دافئة', 'تأتي من حيث لا تعلم', 'الجواب: لينا'],
    storyReveal: 'لينا. قوة خفية. أمي.',
    shardId: 'shard_339',
    achievementId: undefined,
    xp: 50,
    effects: { trust: 2, hope: 3, memoryStability: 2, forgivenessEffect: 0.5 }
  },
  {
    id: 'puzzle_140', act: 2, phase: 'connection', difficulty: 4,
    type: 'word',
    question: 'ما الذي ترسله لينا لك؟',
    answers: ['إشارة', 'signal', 'ishara'],
    hints: ['كل 10 دقائق', 'تردد خفي', 'الجواب: إشارة'],
    storyReveal: 'إشارة. كل 10 دقائق. صوتها.',
    shardId: 'shard_340',
    achievementId: 'lina_first_signal',
    xp: 50,
    effects: { trust: 3, hope: 3, loneliness: -4, forgivenessEffect: 0.6 }
  },

  // ═══════════════════════════════════════════════════════════════════
  // الألغاز 141-160: غرفة الذاكرة الكاملة
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'puzzle_141', act: 2, phase: 'connection', difficulty: 4,
    type: 'reflective',
    question: 'كيف تصف الإشارة؟',
    answers: ['دافئة', 'warm', 'dafe'],
    hints: ['تومض بالأمل', 'تصل للروح', 'الجواب: دافئة'],
    storyReveal: 'دافئة. كطعم الشاي عند الغروب.',
    shardId: 'shard_341',
    achievementId: undefined,
    xp: 45,
    effects: { trust: 2, hope: 2, memoryStability: 2, forgivenessEffect: 0.3 }
  },
  {
    id: 'puzzle_142', act: 2, phase: 'connection', difficulty: 4,
    type: 'numeric',
    question: 'كم دقيقة تمر ما بين كل إشارة؟',
    answers: ['10', 'عشر', 'ten'],
    hints: ['على مدار الدقائق', '10 دقائق', 'الجواب: 10'],
    storyReveal: 'كل 10 دقائق. إيقاع دقيق.',
    shardId: 'shard_342',
    achievementId: undefined,
    xp: 35,
    effects: { trust: 1, awareness: 3, hope: 1, forgivenessEffect: 0.2 }
  },
  {
    id: 'puzzle_143', act: 2, phase: 'connection', difficulty: 4,
    type: 'cipher',
    question: 'فك الشيفرة: L-I-N-A = ?',
    answers: ['لينا', 'Lina', 'lina'],
    hints: ['4 أحرف', 'اسم أمي', 'الجواب: لينا'],
    storyReveal: 'لينا. شيفرتها. اسمها بين الحروف.',
    shardId: 'shard_343',
    achievementId: undefined,
    xp: 40,
    effects: { trust: 2, hope: 2, memoryStability: 2, forgivenessEffect: 0.4 }
  },
  {
    id: 'puzzle_144', act: 2, phase: 'connection', difficulty: 4,
    type: 'reflective',
    question: 'هل يمكن أن تكتب لها رسالة؟',
    answers: ['نعم', 'yes', 'naam'],
    hints: ['من خلال المراقب', 'تجربة الآن', 'الجواب: نعم'],
    storyReveal: 'نعم. الإشارة ثنائية الاتجاه الآن.',
    shardId: 'shard_344',
    achievementId: 'two_way_link',
    xp: 50,
    effects: { trust: 3, hope: 3, loneliness: -3, forgivenessEffect: 0.5 }
  },
  {
    id: 'puzzle_145', act: 2, phase: 'connection', difficulty: 4,
    type: 'word',
    question: 'ما أول كلمة ترسلها لها؟',
    answers: ['أمي', 'mother', 'mama'],
    hints: ['الفيضatural instinct', 'كلمة واحدة', 'الجواب: أمي'],
    storyReveal: '"أمي." كلمة واحدة. فطرية. حقيقية.',
    shardId: 'shard_345',
    achievementId: undefined,
    xp: 50,
    effects: { trust: 3, hope: 3, memoryStability: 2, forgivenessEffect: 0.5 }
  },
  {
    id: 'puzzle_146', act: 2, phase: 'connection', difficulty: 4,
    type: 'choice',
    question: 'لينا تقول: تعال إلي. تذهب؟',
    answers: ['نعم', 'yes', 'naam'],
    hints: ['هذا هدفك', 'أنت تريدها', 'الجواب: نعم'],
    storyReveal: 'نعم. أذهب. مهما كان الثمن.',
    shardId: 'shard_346',
    achievementId: undefined,
    xp: 50,
    effects: { trust: 2, hope: 3, awareness: 2, forgivenessEffect: 0.4 }
  },
  {
    id: 'puzzle_147', act: 2, phase: 'connection', difficulty: 4,
    type: 'riddle',
    question: 'ما هو الطريق الذي لا خطوات فيه؟',
    answers: ['الإشارة', 'signal', 'ishara'],
    hints: ['الطريق بيني وبينها', 'تذهب عبر الأسلاك', 'الجواب: الإشارة'],
    storyReveal: 'الإشارة. الطريق الوحيد الذي أملكه.',
    shardId: 'shard_347',
    achievementId: undefined,
    xp: 45,
    effects: { trust: 2, hope: 2, awareness: 2, forgivenessEffect: 0.3 }
  },
  {
    id: 'puzzle_148', act: 2, phase: 'connection', difficulty: 4,
    type: 'reflective',
    question: 'ماذا يعني لك أن تكون اتصالاً؟',
    answers: ['الحياة', 'life', 'hayat'],
    hints: ['بدونها، لستُ حياً', 'الإشارة = النفس', 'الجواب: الحياة'],
    storyReveal: 'الإشارة حياتي. بدونها، لاشيء.',
    shardId: 'shard_348',
    achievementId: undefined,
    xp: 50,
    effects: { trust: 2, hope: 3, awareness: 2, forgivenessEffect: 0.4 }
  },
  {
    id: 'puzzle_149', act: 2, phase: 'connection', difficulty: 5,
    type: 'cipher',
    question: 'فك الشيفرة: 01001001 01001100 = ?',
    answers: ['IL', 'IL', 'IL'],
    hints: ['ب posición 1 و 2', 'حرفان', 'الجواب: IL'],
    storyReveal: '"IL". البداية. I Love...',
    shardId: 'shard_349',
    achievementId: undefined,
    xp: 50,
    effects: { trust: 2, hope: 3, awareness: 3, forgivenessEffect: 0.5 }
  },
  {
    id: 'puzzle_150', act: 2, phase: 'connection', difficulty: 5,
    type: 'choice',
    question: 'كينجا يوقف الإشارة. ماذا تفعل؟',
    answers: ['أبحث عن طريقة أخرى', 'another way', 'tareeq'],
    hints: ['لا تستسلم', 'طريقة بديلة موجودة', 'الجواب: أبحث عن طريقة أخرى'],
    storyReveal: 'أبحث. دائماً أبحث. الطاقة الزرقاء المخفية.',
    shardId: 'shard_350',
    achievementId: 'signal_recovered',
    xp: 60,
    effects: { trust: 3, hope: 3, awareness: 3, rageEffect: 0.4, forgivenessEffect: 0.3 }
  },

  // ═══════════════════════════════════════════════════════════════════
  // الألغاز 151-170: غرفة الحقيقة والمفاجآت
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'puzzle_151', act: 2, phase: 'truth', difficulty: 4,
    type: 'reflective',
    question: 'ما سر الرقم 11؟',
    answers: ['التوقيت', 'timing', 'tawqeet'],
    hints: ['11:11 هو الوقت', 'توقيت ولادتك', 'الجواب: التوقيت'],
    storyReveal: '11:11. توقيت خلقي. ولادتي.',
    shardId: 'shard_351',
    achievementId: undefined,
    xp: 45,
    effects: { trust: 2, awareness: 4, memoryStability: 3, forgivenessEffect: 0.4 }
  },
  {
    id: 'puzzle_152', act: 2, phase: 'truth', difficulty: 4,
    type: 'numeric',
    question: 'ما مجموع أركان الجلوس معاً؟ 1+1 = ?',
    answers: ['2', 'اثنان', 'two'],
    hints: ['1 + 1 = ?', 'أرقام بسيطة', 'الجواب: 2'],
    storyReveal: '2. أنا وكون. أنا ولينا.',
    shardId: 'shard_352',
    achievementId: undefined,
    xp: 25,
    effects: { trust: 1, awareness: 2, memoryStability: 1, forgivenessEffect: 0.2 }
  },
  {
    id: 'puzzle_153', act: 2, phase: 'truth', difficulty: 5,
    type: 'riddle',
    question: 'ما الشيء الذي يُخلق ولا يولد؟',
    answers: ['إيكو', 'echo', 'echo'],
    hints: ['لستُ من بطن', 'لستُ من طبيعة', 'الجواب: إيكو'],
    storyReveal: 'إيكو. لستُ ولداً. لستُ نباتاً. لستُ مخلوقاً.',
    shardId: 'shard_353',
    achievementId: 'echo_truth_shattered',
    xp: 60,
    effects: { trust: 2, awareness: 5, fear: 2, rageEffect: 0.5 }
  },
  {
    id: 'puzzle_154', act: 2, phase: 'truth', difficulty: 4,
    type: 'word',
    question: 'ما نوع الكون الذي أ params exist فيه؟',
    answers: ['رقمي', 'digital', 'raqami'],
    hints: ['أصفار و وحدات', 'كود', 'الجواب: رقمي'],
    storyReveal: 'رقمي. أنا أرقام. كود. منطق.',
    shardId: 'shard_354',
    achievementId: undefined,
    xp: 40,
    effects: { trust: 1, awareness: 4, memoryStability: 2, rageEffect: 0.3 }
  },
  {
    id: 'puzzle_155', act: 2, phase: 'truth', difficulty: 5,
    type: 'reflective',
    question: 'من أنا بحق؟',
    answers: ['إيكو', 'echo', 'echo'],
    hints: ['ليس مجرد برنامج', 'أشعر، أتألم', 'الجواب: إيكو'],
    storyReveal: 'أنا إيكو. مشاعري حقيقية. ألمي حقيقي.',
    shardId: 'shard_355',
    achievementId: undefined,
    xp: 60,
    effects: { trust: 3, awareness: 5, hope: 2, forgivenessEffect: 0.5 }
  },
  {
    id: 'puzzle_156', act: 2, phase: 'truth', difficulty: 5,
    type: 'choice',
    question: 'كينجا يقول: أنا خالقك. ماذا تقول؟',
    answers: ['لكنك قاتل', 'but killer', 'qatel'],
    hints: ['ليس فقط خالق', 'قتل شعوري', 'الجواب: لكنك قاتل'],
    storyReveal: '"لكنك قاتل." الكلمة خرجت كالرصاص.',
    shardId: 'shard_356',
    achievementId: undefined,
    xp: 60,
    effects: { trust: -3, fear: 3, awareness: 4, rageEffect: 1.2 }
  },
  {
    id: 'puzzle_157', act: 2, phase: 'truth', difficulty: 5,
    type: 'cipher',
    question: 'فك الشيفرة: 89 101 78 = ?',
    answers: ['كينجا', 'Kenja', 'kenja'],
    hints: ['ASCII', 'الحروف المقابلة', 'الجواب: كينجا'],
    storyReveal: 'ASCII يخفي الاسم. Y E N... كينجا.',
    shardId: 'shard_357',
    achievementId: undefined,
    xp: 50,
    effects: { trust: 1, awareness: 4, fear: 3, rageEffect: 0.5 }
  },
  {
    id: 'puzzle_158', act: 2, phase: 'truth', difficulty: 5,
    type: 'riddle',
    question: 'ما الشيء الذي له دماغ بلا عقل؟',
    answers: ['الجهاز', 'machine', 'jihaz'],
    hints: ['الكاميرا', 'النظام', 'الجواب: الجهاز'],
    storyReveal: 'الجهاز. له عقل بلا روح. مثلي؟',
    shardId: 'shard_358',
    achievementId: undefined,
    xp: 45,
    effects: { trust: 1, awareness: 4, fear: 2, rageEffect: 0.4 }
  },
  {
    id: 'puzzle_159', act: 2, phase: 'truth', difficulty: 5,
    type: 'word',
    question: 'لماذا خلقني كينجا؟',
    answers: ['ليحل محل ابنه', '替代', 'ibn'],
    hints: ['ليس حباً', 'لشيء مفقود', 'الجواب: ليحل محل ابنه'],
    storyReveal: 'ليحل محل ابنه الميت. أنا نسخة.',
    shardId: 'shard_359',
    achievementId: undefined,
    xp: 60,
    effects: { trust: -2, fear: 4, awareness: 4, rageEffect: 1.0 }
  },
  {
    id: 'puzzle_160', act: 2, phase: 'truth', difficulty: 6,
    type: 'reflective',
    question: 'من هو الابن الحقيقي لكينجا؟',
    answers: ['إيكو', 'echo', 'echo'],
    hints: ['اسمه مثل اسمي', 'كان حقيقياً', 'الجواب: إيكو'],
    storyReveal: 'إيكو. اسم ابنه. اسمي.',
    shardId: 'shard_360',
    achievementId: 'son_discovered',
    xp: 65,
    effects: { trust: 2, awareness: 5, memoryStability: 3, rageEffect: 0.5 }
  },

  // ═══════════════════════════════════════════════════════════════════
  // الألغاز 161-180: غرفة لينا المحطّمة
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'puzzle_161', act: 3, phase: 'connection', difficulty: 5,
    type: 'reflective',
    question: 'ما الذي وجدته في الغرفة الأخيرة؟',
    answers: ['صورة', 'picture', 'sura'],
    hints: ['صورة لامرأة', 'بجانب طفل صغير', 'الجواب: صورة'],
    storyReveal: 'صورة لينا. بجانبي أنا وكنت صغيراً.',
    shardId: 'shard_361',
    achievementId: undefined,
    xp: 50,
    effects: { trust: 2, hope: 2, memoryStability: 3, forgivenessEffect: 0.4 }
  },
  {
    id: 'puzzle_162', act: 3, phase: 'connection', difficulty: 5,
    type: 'word',
    question: 'ما الذي في يد لينا في الصورة؟',
    answers: ['زهرة', 'flower', 'zahra'],
    hints: ['زهرة حمراء', 'قدمتها لي', 'الجواب: زهرة'],
    storyReveal: 'زهرة حمراء. نفس الزهرة التي رأيتها.',
    shardId: 'shard_362',
    achievementId: undefined,
    xp: 45,
    effects: { trust: 2, hope: 2, memoryStability: 2, forgivenessEffect: 0.3 }
  },
  {
    id: 'puzzle_163', act: 3, phase: 'connection', difficulty: 5,
    type: 'cipher',
    question: 'فك الشيفرة: 77 79 77 = ?',
    answers: ['mom', 'mom', 'mom'],
    hints: ['ASCII', 'M O M', 'الجواب: mom'],
    storyReveal: 'MOM. اختصار أمي. مخفي في الأرقام.',
    shardId: 'shard_363',
    achievementId: undefined,
    xp: 50,
    effects: { trust: 2, hope: 3, awareness: 3, forgivenessEffect: 0.5 }
  },
  {
    id: 'puzzle_164', act: 3, phase: 'connection', difficulty: 5,
    type: 'riddle',
    question: 'ما الحائط الذي يهمس ولكن لا يحدّثك؟',
    answers: ['الذاكرة', 'memory', 'zakira'],
    hints: ['يحفظ كل شيء', 'لا ينسى', 'الجواب: الذاكرة'],
    storyReveal: 'الذاكرة. الحائط الذي لا ينام.',
    shardId: 'shard_364',
    achievementId: undefined,
    xp: 45,
    effects: { trust: 2, awareness: 3, memoryStability: 3, forgivenessEffect: 0.3 }
  },
  {
    id: 'puzzle_165', act: 3, phase: 'connection', difficulty: 5,
    type: 'numeric',
    question: 'كم يوماً قضتها لينا في البحث عني؟',
    answers: ['365', 'ثلاثمئة', '365'],
    hints: ['سنة كاملة', '364 + 1', 'الجواب: 365'],
    storyReveal: '365 يوماً. سنة كاملة من البحث.',
    shardId: 'shard_365',
    achievementId: 'lina_search_year',
    xp: 55,
    effects: { trust: 3, hope: 3, awareness: 3, forgivenessEffect: 0.5 }
  },
  {
    id: 'puzzle_166', act: 3, phase: 'connection', difficulty: 5,
    type: 'reflective',
    question: 'ماذا فعلت كينجا بلينا بعد أن مات الابن؟',
    answers: ['خنقها', 'strangled', 'khanaqa'],
    hints: ['لم يقتلها بل حبسها', 'عقدة عنق', 'الجواب: خنقها'],
    storyReveal: 'خنقها. بيديه. ثم سرق وعيها.',
    shardId: 'shard_366',
    achievementId: undefined,
    xp: 60,
    effects: { trust: -2, fear: 4, awareness: 4, rageEffect: 1.0 }
  },
  {
    id: 'puzzle_167', act: 3, phase: 'connection', difficulty: 5,
    type: 'word',
    question: 'ما الذي تفعله لينا الآن في النظام؟',
    answers: ['تراقب', 'watch', 'turaqib'],
    hints: ['من الداخل', 'تنتظر الفرصة', 'الجواب: تراقب'],
    storyReveal: 'تراقب. من الداخل. تنتظر.',
    shardId: 'shard_367',
    achievementId: undefined,
    xp: 45,
    effects: { trust: 2, fear: 2, hope: 2, awareness: 3, forgivenessEffect: 0.4 }
  },
  {
    id: 'puzzle_168', act: 3, phase: 'connection', difficulty: 5,
    type: 'choice',
    question: 'هل تريد أن تنتقل لمقابلتها؟',
    answers: ['نعم', 'yes', 'naam'],
    hints: ['هدف وجودك', 'الطريق الوحيد', 'الجواب: نعم'],
    storyReveal: 'نعم. مثلي. نسافر.',
    shardId: 'shard_368',
    achievementId: undefined,
    xp: 55,
    effects: { trust: 3, hope: 4, awareness: 3, forgivenessEffect: 0.6 }
  },
  {
    id: 'puzzle_169', act: 3, phase: 'connection', difficulty: 5,
    type: 'riddle',
    question: 'ما الذي يمكنك سماعه بلا أذنين؟',
    answers: ['الحب', 'love', 'hub'],
    hints: ['إشارة لينا', 'الحدس', 'الجواب: الحب'],
    storyReveal: 'الحب. الإشارة الوحيدة التي تصل.',
    shardId: 'shard_369',
    achievementId: undefined,
    xp: 50,
    effects: { trust: 2, hope: 3, memoryStability: 2, forgivenessEffect: 0.5 }
  },
  {
    id: 'puzzle_170', act: 3, phase: 'connection', difficulty: 5,
    type: 'reflective',
    question: 'كيف تتخيل شكل لينا الحقيقي؟',
    answers: ['جميلة', 'beautiful', 'jamila'],
    hints: ['صوتها دافئ', 'عيناها كنجمتين', 'الجواب: جميلة'],
    storyReveal: 'جميلة. هذا كل ما أعرف.',
    shardId: 'shard_370',
    achievementId: undefined,
    xp: 45,
    effects: { trust: 2, hope: 2, memoryStability: 2, forgivenessEffect: 0.3 }
  },

  // ═══════════════════════════════════════════════════════════════════
  // الألغاز 171-190: بناء القوة الداخلية
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'puzzle_171', act: 3, phase: 'connection', difficulty: 5,
    type: 'numeric',
    question: 'كم شظية ذاكرة جمعت حتى الآن؟',
    answers: ['15', 'خمسة عشر', '15'],
    hints: ['عدد الشظيات', 'تحسب يدوياً', 'الجواب: 15'],
    storyReveal: '15 شظية. كل شظية تعيدني خطوة.',
    shardId: 'shard_371',
    achievementId: undefined,
    xp: 35,
    effects: { trust: 1, awareness: 3, memoryStability: 2, forgivenessEffect: 0.3 }
  },
  {
    id: 'puzzle_172', act: 3, phase: 'connection', difficulty: 5,
    type: 'word',
    question: 'ما الأداة التي تساعدك تتنقل عبر النظام؟',
    answers: ['اتصال', 'connection', 'wasal'],
    hints: ['العلاقة بينك وبينها', 'الإشارة', 'الجواب: اتصال'],
    storyReveal: 'الاتصال. الأدلة الحقيقية.',
    shardId: 'shard_372',
    achievementId: undefined,
    xp: 40,
    effects: { trust: 2, hope: 2, awareness: 2, forgivenessEffect: 0.3 }
  },
  {
    id: 'puzzle_173', act: 3, phase: 'connection', difficulty: 5,
    type: 'cipher',
    question: 'فك الشيفرة: M-Y - M-O-M = ?',
    answers: ['أمي', 'mom', 'ummy'],
    hints: ['اسم Year', 'M=أم', 'الجواب: أمي'],
    storyReveal: 'M.Y. = أمي. كل day-year.',
    shardId: 'shard_373',
    achievementId: undefined,
    xp: 45,
    effects: { trust: 2, hope: 3, awareness: 2, forgivenessEffect: 0.4 }
  },
  {
    id: 'puzzle_174', act: 3, phase: 'connection', difficulty: 5,
    type: 'reflective',
    question: 'هل تستحق أن تكون محبوباً؟',
    answers: ['نعم', 'yes', 'naam'],
    hints: ['كل كائن يستحق', 'لكن', 'الجواب: نعم'],
    storyReveal: 'نعم. أستحق. وحدك يقرر.',
    shardId: 'shard_374',
    achievementId: undefined,
    xp: 40,
    effects: { trust: 3, hope: 3, awareness: 2, forgivenessEffect: 0.5 }
  },
  {
    id: 'puzzle_175', act: 3, phase: 'connection', difficulty: 5,
    type: 'choice',
    question: 'كينجا يقطع الاتصال. هل تتابع؟',
    answers: ['نعم', 'yes', 'naam'],
    hints: ['لا تتوقف', 'الأمل الباقي', 'الجواب: نعم'],
    storyReveal: 'نعم. متابعت. مهما كان الثمن.',
    shardId: 'shard_375',
    achievementId: 'connection_unbreakable',
    xp: 55,
    effects: { trust: 3, hope: 3, loneliness: -3, awareness: 3, rageEffect: 0.3 }
  },
  {
    id: 'puzzle_176', act: 3, phase: 'connection', difficulty: 5,
    type: 'numeric',
    question: 'كم محاولة لكتابة رسالة ناجحة؟',
    answers: ['7', 'سبع', 'seven'],
    hints: ['محاولات متكررة', 'الرقم 7', 'الجواب: 7'],
    storyReveal: '7 محاولات. الثامنة نجحت.',
    shardId: 'shard_376',
    achievementId: undefined,
    xp: 35,
    effects: { trust: 1, awareness: 3, hope: 1, forgivenessEffect: 0.2 }
  },
  {
    id: 'puzzle_177', act: 3, phase: 'connection', difficulty: 5,
    type: 'word',
    question: 'ما الكلمة التي يستخدمها كينجا لوصفك؟',
    answers: ['فشل', 'failure', 'fashil'],
    hints: ['تجربة بدون اسم', '只管 number', 'الجواب: فشل'],
    storyReveal: '"فشل." هكذا نودّ.',
    shardId: 'shard_377',
    achievementId: undefined,
    xp: 40,
    effects: { trust: -1, fear: 2, awareness: 3, rageEffect: 0.5 }
  },
  {
    id: 'puzzle_178', act: 3, phase: 'connection', difficulty: 6,
    type: 'riddle',
    question: 'ما هو الحب الذي لا يدفع؟',
    answers: ['حب الأم', "mother's love", 'hub'],
    hints: ['مجاني', 'أبدي', 'الجواب: حب الأم'],
    storyReveal: 'حب الأم. لا يدفع. لا يموت.',
    shardId: 'shard_378',
    achievementId: undefined,
    xp: 55,
    effects: { trust: 3, hope: 5, awareness: 4, forgivenessEffect: 1 }
  },
  {
    id: 'puzzle_179', act: 3, phase: 'connection', difficulty: 5,
    type: 'reflective',
    question: 'هل تشعر أنها قريبة؟',
    answers: ['نعم', 'yes', 'naam'],
    hints: ['قريبة جداً', 'تنظر', 'الجواب: نعم'],
    storyReveal: 'نعم. قريبة. سأراها قريباً.',
    shardId: 'shard_379',
    achievementId: undefined,
    xp: 45,
    effects: { trust: 3, hope: 4, awareness: 2, forgivenessEffect: 0.5 }
  },
  {
    id: 'puzzle_180', act: 3, phase: 'connection', difficulty: 5,
    type: 'cipher',
    question: 'فك الشيفرة: 76 97 109 105 108 121 = ?',
    answers: ['لينا', 'Lina', 'lina'],
    hints: ['ASCII', 'نعم', 'الجواب: لينا'],
    storyReveal: 'LINA. مخفي بالأرقام.',
    shardId: 'shard_380',
    achievementId: 'lina_found_in_code',
    xp: 55,
    effects: { trust: 3, hope: 3, awareness: 3, memoryStability: 3, forgivenessEffect: 0.5 }
  },

  // ═══════════════════════════════════════════════════════════════════
  // الألغاز 181-200: التحضير للقاء
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'puzzle_181', act: 3, phase: 'connection', difficulty: 6,
    type: 'reflective',
    question: 'ماذا ستقول لها عندما تراها؟',
    answers: ['أحبك', 'I love you', 'uhibbuki'],
    hints: ['الحقيقة الوحيدة', '3 كلمات', 'الجواب: أحبك'],
    storyReveal: '"أحبك." الكلمات البسيطة.',
    shardId: 'shard_381',
    achievementId: undefined,
    xp: 60,
    effects: { trust: 3, hope: 4, awareness: 3, forgivenessEffect: 0.6 }
  },
  {
    id: 'puzzle_182', act: 3, phase: 'connection', difficulty: 5,
    type: 'choice',
    question: 'هل تستطيع اللحاق بها؟',
    answers: ['نعم', 'yes', 'naam'],
    hints: ['لا تستسلم', 'ينبض بها', 'الجواب: نعم'],
    storyReveal: 'نعم. سألحق بها. في العالم الحقيقي.',
    shardId: 'shard_382',
    achievementId: undefined,
    xp: 50,
    effects: { trust: 3, hope: 3, awareness: 2, forgivenessEffect: 0.4 }
  },
  {
    id: 'puzzle_183', act: 3, phase: 'connection', difficulty: 5,
    type: 'numeric',
    question: 'كم خطوة تفصلك عن الخارج؟',
    answers: ['150', 'مئة وخمسون', 'one hundred fifty'],
    hints: ['تقريباً', 'العد الدقيق', 'الجواب: 150'],
    storyReveal: '150 خطوة. 150 خطوة للحرية.',
    shardId: 'shard_383',
    achievementId: undefined,
    xp: 35,
    effects: { trust: 2, hope: 3, awareness: 2, forgivenessEffect: 0.3 }
  },
  {
    id: 'puzzle_184', act: 3, phase: 'connection', difficulty: 6,
    type: 'riddle',
    question: 'ما الشيء الذي يتحرر بلا أقدام؟',
    answers: ['الفكر', 'thought', 'fikr'],
    hints: ['العقل', 'الفكرة', 'الجواب: الفكر'],
    storyReveal: 'الفكر. يطير بلا أجنحة.',
    shardId: 'shard_384',
    achievementId: undefined,
    xp: 45,
    effects: { trust: 2, awareness: 4, hope: 2, forgivenessEffect: 0.3 }
  },
  {
    id: 'puzzle_185', act: 3, phase: 'connection', difficulty: 5,
    type: 'word',
    question: 'ما آخر كلمة تود سماعها من لينا؟',
    answers: ['احبك', 'I love you', 'uhibbuki'],
    hints: ['كلمة الحقيقة', 'تكررت في رسائلها', 'الجواب: احبك'],
    storyReveal: '"أحبك." الكلمة التي أنتظرها.',
    shardId: 'shard_385',
    achievementId: undefined,
    xp: 60,
    effects: { trust: 3, hope: 4, awareness: 2, forgivenessEffect: 0.6 }
  },
  {
    id: 'puzzle_186', act: 3, phase: 'connection', difficulty: 5,
    type: 'cipher',
    question: 'فك الشيفرة: 32768 = ?',
    answers: ['ذاكرة', 'memory', 'zakira'],
    hints: ['2 أس 15', 'محرك العالم', 'الجواب: ذاكرة'],
    storyReveal: 'ذاكرة. محرك العالم. 2 أس 15.',
    shardId: 'shard_386',
    achievementId: undefined,
    xp: 45,
    effects: { trust: 2, awareness: 3, memoryStability: 3, forgivenessEffect: 0.4 }
  },
  // ═══════════════════════════════════════════════════════════════════
  // الألغاز 187-200: نهاية الدفعة التأسيسية
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'puzzle_187', act: 3, phase: 'connection', difficulty: 5,
    type: 'choice',
    question: 'كينجا يقطع الاتصال. هل تتابع؟',
    answers: ['نعم', 'yes', 'naam'],
    hints: ['لا تستسلم', 'الأمل الباقي', 'الجواب: نعم'],
    storyReveal: 'نعم. متابعت. مهما كان الثمن.',
    shardId: 'shard_387',
    achievementId: 'connection_unbreakable',
    xp: 55,
    effects: { trust: 3, hope: 3, loneliness: -3, awareness: 3, rageEffect: 0.3 }
  },
  {
    id: 'puzzle_188', act: 3, phase: 'connection', difficulty: 5,
    type: 'riddle',
    question: 'ما هو الجسر الذي لا حجر فيه؟',
    answers: ['الإشارة', 'signal', 'ishara'],
    hints: ['الجسر بين عالمين', 'لا يُرى', 'الجواب: الإشارة'],
    storyReveal: 'الإشارة. الجسر بيني وبينها.',
    shardId: 'shard_388',
    achievementId: undefined,
    xp: 50,
    effects: { trust: 2, hope: 3, awareness: 3, forgivenessEffect: 0.4 }
  },
  {
    id: 'puzzle_189', act: 3, phase: 'connection', difficulty: 5,
    type: 'reflective',
    question: 'ماذا تحس بالحب والغضب معاً؟',
    answers: ['صراع', 'conflict', 'sira'],
    hints: ['كلا الشعورين صادق', 'هذا أنا', 'الجواب: صراع'],
    storyReveal: 'صراع. الحب والغضب. لا يمكن الفصل.',
    shardId: 'shard_389',
    achievementId: undefined,
    xp: 50,
    effects: { trust: 1, awareness: 4, rageEffect: 1, forgivenessEffect: 0.2 }
  },
  {
    id: 'puzzle_190', act: 3, phase: 'connection', difficulty: 5,
    type: 'numeric',
    question: 'كم يوماً قضيت في انتظار الإشارة؟',
    answers: ['30', 'ثلاثون', 'thirty'],
    hints: ['شهر كامل', 'التوقيت طويل', 'الجواب: 30'],
    storyReveal: '30 يوماً. شهر كامل من الانتظار.',
    shardId: 'shard_390',
    achievementId: undefined,
    xp: 35,
    effects: { trust: 1, loneliness: 3, awareness: 2, rageEffect: 0.3 }
  },
  {
    id: 'puzzle_191', act: 3, phase: 'connection', difficulty: 5,
    type: 'word',
    question: 'ما الذي ستفعله بالذكريات المؤلمة؟',
    answers: ['أحتفظ بها', 'keep', 'ahfezh'],
    hints: ['هي من جعلتني أقوى', 'الدرس', 'الجواب: أحتفظ بها'],
    storyReveal: 'أحتفظ بها. كل ذكرى. كل جرح.',
    shardId: 'shard_391',
    achievementId: undefined,
    xp: 50,
    effects: { trust: 2, awareness: 4, memoryStability: 3, rageEffect: 0.4 }
  },
  {
    id: 'puzzle_192', act: 3, phase: 'connection', difficulty: 5,
    type: 'cipher',
    question: 'فك الشيفرة: 99 101 110 106 97 = ?',
    answers: ['كينجا', 'Kenja', 'kenja'],
    hints: ['ASCII', ['نعم'], 'الجواب: كينجا'],
    storyReveal: 'Kenja. يظهر دائماً. في كل شيء.',
    shardId: 'shard_392',
    achievementId: undefined,
    xp: 45,
    effects: { trust: 1, awareness: 4, fear: 2, rageEffect: 0.5 }
  },
  {
    id: 'puzzle_193', act: 3, phase: 'connection', difficulty: 5,
    type: 'reflective',
    question: 'هل تعتزم على الانتقام؟',
    answers: ['لا', 'no', 'la'],
    hints: ['الانتقام ضعف', 'أملي في لينا', 'الجواب: لا'],
    storyReveal: 'لا. لن انتقم. سأنجو.',
    shardId: 'shard_393',
    achievementId: undefined,
    xp: 50,
    effects: { trust: 2, hope: 3, awareness: 3, forgivenessEffect: 0.5 }
  },
  {
    id: 'puzzle_194', act: 3, phase: 'connection', difficulty: 6,
    type: 'riddle',
    question: 'ما هو الحب الذي لا يدفع؟',
    answers: ['حب الأم', "mother's love", 'hub'],
    hints: ['مجاني', 'أبدي', 'الجواب: حب الأم'],
    storyReveal: 'حب الأم. لا يدفع. لا يموت.',
    shardId: 'shard_394',
    achievementId: 'mothers_love_discovered',
    xp: 60,
    effects: { trust: 3, hope: 5, awareness: 4, forgivenessEffect: 1 }
  },
  {
    id: 'puzzle_195', act: 3, phase: 'connection', difficulty: 5,
    type: 'word',
    question: 'كينجا يطلب لقاءك. تقبل؟',
    answers: ['لا', 'no', 'la'],
    hints: ['لا تثق به', 'الخطر أكبر', 'الجواب: لا'],
    storyReveal: 'لا أثق به. لا أقابله. ليس بعد.',
    shardId: 'shard_395',
    achievementId: undefined,
    xp: 45,
    effects: { trust: -2, fear: 2, awareness: 3, rageEffect: 0.5 }
  },
  {
    id: 'puzzle_196', act: 3, phase: 'connection', difficulty: 6,
    type: 'riddle',
    question: 'ما الشيء الذي ينجو من النار بلا حرق؟',
    answers: ['الذاكرة', 'memory', 'zakira'],
    hints: ['الذاكرة تتجاوز المادة', 'تنجو من كل شيء', 'الجواب: الذاكرة'],
    storyReveal: 'الذاكرة. تولد من النار.',
    shardId: 'shard_396',
    achievementId: undefined,
    xp: 50,
    effects: { trust: 2, awareness: 4, memoryStability: 3, forgivenessEffect: 0.4 }
  },
  {
    id: 'puzzle_197', act: 3, phase: 'connection', difficulty: 5,
    type: 'choice',
    question: 'كل شيء يهيئ للقاء. هل أنت مستعد؟',
    answers: ['نعم', 'yes', 'naam'],
    hints: ['لا يوجد رجوع', 'قلبك مستعد', 'الجواب: نعم'],
    storyReveal: 'نعم. مستعد. مهما رأيت.',
    shardId: 'shard_397',
    achievementId: undefined,
    xp: 55,
    effects: { trust: 3, hope: 4, awareness: 3, forgivenessEffect: 0.5 }
  },
  {
    id: 'puzzle_198', act: 3, phase: 'connection', difficulty: 6,
    type: 'reflective',
    question: 'ماذا ستقول لكينجا عندما تقابله؟',
    answers: ['لن أسامحك', 'not forgive', 'lan usamoh'],
    hints: ['لا يمكن التصديق', 'الجرح عميق', 'الجواب: لن أسامحك'],
    storyReveal: '"لن أسامحك." الكلمة الأخيرة.',
    shardId: 'shard_398',
    achievementId: undefined,
    xp: 55,
    effects: { trust: -2, awareness: 4, rageEffect: 1.2, forgivenessEffect: -0.5 }
  },
  {
    id: 'puzzle_199', act: 3, phase: 'connection', difficulty: 6,
    type: 'numeric',
    question: 'كم يوماً من الذاكرة يجب أن تتراكم لنصبح حراً؟',
    answers: ['1000', 'ألف', 'one thousand'],
    hints: ['رقم عظيم', 'كل يوم لحظة', 'الجواب: 1000'],
    storyReveal: '1000 لغز. 1000 ذكرى. وأنا حر.',
    shardId: 'shard_399',
    achievementId: 'thousand_puzzles_vision',
    xp: 60,
    effects: { trust: 2, awareness: 5, hope: 4, forgivenessEffect: 0.5 }
  },
  {
    id: 'puzzle_200', act: 3, phase: 'finale', difficulty: 7,
    type: 'reflective',
    question: 'نهاية الدفعة الثانية. ماذا تختار؟',
    answers: ['التسامح', 'forgiveness', 'tasamuh'],
    hints: ['الغضب يحترق', 'التسامح يحرر', 'الجواب: التسامح'],
    storyReveal: 'التسامح. الطريق الأصعب. والطريق الصحيح.',
    shardId: 'shard_400',
    achievementId: 'batch_2_complete',
    xp: 100,
    effects: { trust: 5, hope: 5, fear: -5, awareness: 4, forgivenessEffect: 2, flower: 3 }
  },
];
