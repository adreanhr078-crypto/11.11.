/* ═══════════════════════════════════════════════════════════════════════════
   11.11 — بيانات التطبيق
   ═══════════════════════════════════════════════════════════════════════════ */

const DATA = {
  echo: {
    name: "Echo",
    age: 17,
    level: 17,
    xp: 2480,
    xpMax: 3500,
    trustLevel: 64,
    storyProgress: 67,
    flowerProgress: 75,
    mood: "حزين",
    memoriesDiscovered: 28,
    totalMemories: 54,
    puzzlesSolved: 8,
    puzzlesTotal: 16,
    achievementsCount: 12,
    activeWishes: 3,
    emotions: {
      fear: 62,
      loneliness: 80,
      regret: 48,
      hope: 33,
      memory: 71,
    },
  },

  navItems: [
    { id: "dashboard", label: "الرئيسية", icon: "🏠" },
    { id: "echo-mind", label: "Echo Mind", icon: "🧠" },
    { id: "day", label: "النظام الصباحي", icon: "☀️" },
    { id: "memories", label: "الذكريات والأحلام", icon: "💠" },
    { id: "puzzles", label: "الألغاز", icon: "🧩" },
    { id: "wishes", label: "الأمنيات", icon: "⭐" },
    { id: "flowers", label: "نظام الأزهار", icon: "🌸" },
    { id: "achievements", label: "الإنجازات", icon: "🏆" },
    { id: "night", label: "التحول الليلي", icon: "🌙" },
    { id: "overview", label: "الروية الشاملة", icon: "👁️" },
  ],

  features: [
    { icon: "🧠", title: "Echo Mind", desc: "مساعد ذكي يفهمك ويساعدك على التذكر والفهم والتواصل", progress: 72 },
    { icon: "🧩", title: "الألغاز", desc: "حل الألغاز واكتشف شظايا من ذاكرتك المفقودة", progress: 50 },
    { icon: "⭐", title: "الأمنيات", desc: "حقق أمنياتك وتحول أحلامك إلى واقع", progress: 37 },
    { icon: "🌸", title: "نظام الأزهار", desc: "ازهر مع تقدمك في القصة واكتشف أسرار جديدة", progress: 75 },
    { icon: "🎵", title: "الأصوات", desc: "موسيقى محيطية تغير حسب حالتك النفسية", progress: 60 },
    { icon: "💾", title: "حفظ التقدم", desc: "يتم حفظ تقدمك تلقائياً في كل مرة", progress: 100 },
  ],

  nightStages: [
    { time: "11:00 PM", label: "بداية عدم الاستقرار", status: "stable", statusText: "SYSTEM STABLE", 
      items: ["تمويجات خفيفة في الواجهة", "أصوات تأثيرات ناعمة وخفيفة", "رسالة تحذير مفقودة"] },
    { time: "11:05 PM", label: "تزايد عدم الاستقرار", status: "warning", statusText: "SIGNAL UNSTABLE",
      items: ["زيادة التقلبات البصرية", "ومضات وتشويشات قصيرة", "رسائل عاطفية مرتبطة بالذاكرة"] },
    { time: "11:11 PM", label: "الانتقال السينمائي الكامل", status: "danger", statusText: "CINEMATIC MODE",
      items: ["تفكك الهوامش الفنية", "تحويل الشخصيات إلى سينمائي كامل", "يُكشف العناصر الأساسية"] },
  ],

  puzzles: [
    { title: "لغز المرايا", progress: 72, status: "active" },
    { title: "لغز الشبكات", progress: 45, status: "active" },
    { title: "لغز الباب المغلق", progress: 20, status: "active" },
    { title: "لغز مكتمل", progress: 100, status: "done" },
    { title: "لغز قيد التقدم", progress: 30, status: "active" },
    { title: "لغز مقفل", progress: 0, status: "locked" },
  ],

  achievements: [
    { icon: "🏅", name: "مستكشف الذاكرة", desc: "جمع 20 ذكرى", unlocked: true },
    { icon: "⭐", name: "صديق Echo", desc: "تحقيق 10 أمنيات", unlocked: true },
    { icon: "🔥", name: "قلب الشجاعة", desc: "حل 50 لغز", unlocked: false },
    { icon: "💎", name: "الوصول إلى القمر", desc: "الحصول على 75%", unlocked: true },
    { icon: "🏆", name: "رائد المعاوية", desc: "إكمال 3 نهايات مختلفة", unlocked: false },
  ],

  memoryShards: [
    { title: "غرفة قديمة", progress: 12, status: "new" },
    { title: "صوت من الماضي", progress: 35, status: "active" },
    { title: "لقاء تحت المطر", progress: 58, status: "active" },
    { title: "رسالة غير مرسلة", progress: 22, status: "active" },
    { title: "شظايا مجهولة", progress: 0, status: "locked" },
  ],

  soundTracks: [
    { name: "صوت الأم", desc: "حنان من الماضي...", duration: "01:11" },
    { name: "لحظة هادئة", desc: "ضحكات ما ارتددت...", duration: "00:58" },
    { name: "كينجا", desc: "صوت في لحظة خاصة", duration: "01:03" },
  ],

  dreamScenes: [
    { name: "حقل الأزهار", icon: "🌙" },
    { name: "الممر المظلم", icon: "🌑" },
    { name: "المطر الخافت", icon: "🌧️" },
    { name: "الغرفة القديمة", icon: "🏚️" },
  ],

  dailyWishes: [
    { text: "أتمنى أن أتعلم حب نفسي بشكل صحيح", date: "2025-05-01", progress: 60 },
    { text: "أتمنى أن أسافر إلى مكان هادئ", date: "2025-05-10", progress: 45 },
    { text: "أريد أن أتذكر صديقتي", date: "2025-05-08", progress: 66 },
    { text: "أريد قضاء يوم هادئ مع لينا", date: "2025-05-12", progress: 33 },
  ],

  flowerStages: [
    { name: "إبراد", icon: "🌱", pct: 0 },
    { name: "بداية النمو", icon: "🌿", pct: 25 },
    { name: "ازدهار", icon: "🌷", pct: 50 },
    { name: "اكتمال", icon: "🌸", pct: 75 },
    { name: "تحول جذري", icon: "🌺", pct: 100 },
  ],

  endings: [
    { title: "النهاية الحزينة", desc: "فقدان الأمل — يبقى ذكرى." },
    { title: "النهاية الحقيقية", desc: "قتل الأمل — تكتشف القصة عن الحقيقة." },
    { title: "النهاية المظلمة", desc: "تواجه نفسك — تكتشف عن الحقيقة." },
    { title: "النهاية المحيرة", desc: "تكتشف أسراره — ويستمر في الأزهار." },
  ],

  characterStages: [
    { name: "مرتعب", label: "البداية", icon: "😐" },
    { name: "باحث", label: "يبدأ بالتذكر", icon: "🤔" },
    { name: "متذكر", label: "يتفاعل معك", icon: "😢" },
    { name: "مستيقظ", label: "يصبح صديقك", icon: "😊" },
  ],

  echoMovements: [
    { icon: "😊", text: "تقلب عينيه بطيء ومديد" },
    { icon: "🚶", text: "حركة جسده طبيعية ومديدة" },
    { icon: "😰", text: "نطاق قلق وخوف" },
    { icon: "😔", text: "تعبير وجهه متأثر" },
    { icon: "💬", text: "متأرجح بوضوح خفيفة في الكلام" },
    { icon: "🌊", text: "ظهور ظلال أو أشكال غامضة" },
  ],

  relationshipLevels: [
    { label: "غافل", value: 0 },
    { label: "حذر", value: 25 },
    { label: "مرتب", value: 50 },
    { label: "قريب", value: 75 },
    { label: "متواصل", value: 100 },
  ],

  echoMessages: [
    { stage: "بداية الصباح", text: "من... لا أذكر شيئاً." },
    { stage: "بداية البحث", text: "هذه الكلمة... تبدو مألوفة. لكن لا أستطيع تذكرها بوضوح." },
    { stage: "بداية التذكر", text: "أتذكر الآن... كل اليوم تعلو المعنون وتتكرر الوحدة." },
    { stage: "عودة الوعي", text: "أتذكر... أتمنى الصحو... أنا مريت كتابت... والإهداء عدت." },
  ],

  systemGoals: [
    { text: "استعادة الذكريات", done: true },
    { text: "التأثير العاطفي", done: true },
    { text: "بناء علاقة مع Echo", done: false },
    { text: "تحقيق الأمنيات", done: false },
  ],

  dayFeatures: [
    { icon: "☀️", title: "بيئة مريحة وآمنة" },
    { icon: "💬", title: "تفاعل هادئ وعميق" },
    { icon: "📖", title: "تركيز على الفهم والنمو" },
    { icon: "🌱", title: "تقدم تدريجي مستدام" },
    { icon: "📊", title: "تصميم مشمس ومريح" },
  ],

  daySteps: [
    { num: 1, text: "تفاعل هادئ مع Echo" },
    { num: 2, text: "حل لغز يومي واكتشف شظايا" },
    { num: 3, text: "تنفيذ أمنياتك الصغيرة" },
    { num: 4, text: "نمو الأزهار وتفهم الشفاء" },
    { num: 5, text: "استمرار عميق وفهم أعماقك" },
  ],

  dayStats: [
    { label: "تقدم الشفاء", value: "75%", color: "#c8785a" },
    { label: "الذكريات المحجوبة", value: "23", color: "#5A8AAA" },
    { label: "الألغاز المُنجزة", value: "12", color: "#4CAF50" },
    { label: "الأمنيات النشطة", value: "3", color: "#AA8B40" },
    { label: "أيام متتالية", value: "7", color: "#6A5AAA" },
  ],
};