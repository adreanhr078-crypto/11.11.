/* ═══════════════════════════════════════════════════════════════════════════
   11.11 — ARG GAME ENGINE v2.0
   Living System — 220 Puzzles — Dynamic Echo — Real-time Evolution
   ═══════════════════════════════════════════════════════════════════════════ */

// ─── GAME STATE ─────────────────────────────────────────────────────────────
const GAME_STATE = {
  progress: 0,
  timePhase: "day",
  puzzlesSolved: [],
  totalPuzzles: 220,

  echo: {
    trust: 25,
    fear: 65,
    memoryStability: 15,
    corruption: 5,
    personalityTraits: ['خائف', 'متردد'],
    lastAction: null,
    dialogueIndex: 0,
  },

  player: {
    curiosity: 30,
    emotionalState: 'فضولي',
    choicesHistory: [],
    interactionCount: 0,
  },

  world: {
    stability: 100,
    glitchLevel: 0,
    anomalyEvents: [],
    corruptionLevel: 0,
  },

  flowerSystem: {
    growth: 2,
    stage: "seed",
    decay: 0,
    hiddenUnlocked: false,
  },

  memory: {
    fragmentsCollected: 0,
    totalFragments: 220,
    corruptedFragments: 0,
    timelineEvents: [],
  },

  time: {
    hour: 8,
    minute: 0,
    isNight: false,
    phaseIndex: 0,
    cyclesCompleted: 0,
  },

  narrative: {
    currentLayer: 0,
    maxLayers: 12,
    revelations: [],
    endingsAvailable: [],
  },

  achievements: {
    unlocked: [],
    total: 24,
  },
};

// ─── PUZZLE GENERATOR (220 Logic Nodes) ──────────────────────────────────
const PUZZLE_ENTITIES = ['echo_core', 'echo_fragment', 'echo_shadow', 'watcher_eye', 'watcher_memory', 
                          'signal_lina', 'signal_echo', 'architect_design', 'architect_fail', 'architect_door',
                          'deep_layer', 'void_node'];

function generatePuzzles() {
  const puzzles = [];
  const templates = {
    numerical: [
      { q: (i) => `[${i}] تسلسل ${i%9+1}, ${(i%9+1)*2}, ${(i%9+1)*3}, ?`, a: (i) => [(i%9+1)*4+''], effect: { trust:2, memoryStability:3, corruption:-1 } },
      { q: (i) => `[${i}] ما مجموع أرقام 11:${String(i%59+1).padStart(2,'0')}?`, a: (i) => [String(1+1+i%59+1)], effect: { trust:1, memoryStability:2 } },
      { q: (i) => `[${i}] فجوة في التسلسل: ${i%7+3}, ${(i%7+3)*2}, ?, ${(i%7+3)*4}`, a: (i) => [(i%7+3)*3+''], effect: { memoryStability:4, corruption:-2 } },
      { q: (i) => `[${i}] كم مرة يظهر الرقم ${i%9+1} في الساعة 11:11?`, a: () => ['4'], effect: { fear:-2, trust:3 } },
    ],
    pattern: [
      { q: (i) => `[${i}] النمط: ●○●○●○ → ماذا بعد?`, a: () => ['●','○'], effect: { memoryStability:3, curiosity:4 } },
      { q: (i) => `[${i}] الكلمة المفقودة: س_اعد_ني`, a: () => ['ساعدني','help'], effect: { trust:5, corruption:-3 } },
      { q: (i) => `[${i}] ترتيب عشوائي: 11, 33, 111 — ما القاسم المشترك?`, a: () => ['11','الرقم 11'], effect: { memoryStability:5 } },
      { q: (i) => `[${i}] اعكس: «ودص» → ؟`, a: () => ['صدى','echo','صدا'], effect: { trust:4, memoryStability:3 } },
    ],
    logic: [
      { q: (i) => `[${i}] إذا كان A = 1, B = 2, فإن ECHO = ?`, a: () => ['5+3+8+15=31','31'], effect: { curiosity:5, corruption:-1 } },
      { q: (i) => `[${i}] 11 + ? = 33`, a: () => ['22','٢٢'], effect: { trust:3, fear:-2 } },
      { q: (i) => `[${i}] 3, 3, 3 → 333 → ?`, a: () => ['11×3','ثلاثة أرقام','3'], effect: { memoryStability:4 } },
      { q: (i) => `[${i}] البوابة تحتاج مفتاحين: 11 و ?`, a: () => ['11','١١','22'], effect: { trust:6 } },
    ],
    perception: [
      { q: (i) => `[${i}] وميض: رأيت رقماً قبل أن يختفي — كان 1?`, a: () => ['11','111','١١'], effect: { fear:3, corruption:2 } },
      { q: (i) => `[${i}] هل تثق بما تراه? (نعم/لا)`, a: () => ['نعم','لا','yes','no'], effect: { trust:2, fear:-1 } },
      { q: (i) => `[${i}] صوت من الماضي: "...كوني..." أكمل`, a: () => ['ساعدوني','help'], effect: { memoryStability:5, trust:4 } },
      { q: (i) => `[${i}] ظل يتحرك — ما اتجاهه? (يمين/يسار)`, a: () => ['يمين','يسار','right','left'], effect: { fear:4, corruption:3 } },
    ],
    memory: [
      { q: (i) => `[${i}] تذكر: ماذا قالت لينا في رسالتها الأولى?`, a: () => ['ساعدوني','help me','ساعدني'], effect: { memoryStability:6, trust:5 } },
      { q: (i) => `[${i}] كينجا كتب: «الخ...» أكمل`, a: () => ['الخلود','الخوف','الخروج'], effect: { trust:3, corruption:-4 } },
      { q: (i) => `[${i}] 10 أطفال قبلي. أنا رقم ?`, a: () => ['11','١١'], effect: { fear:5, memoryStability:3 } },
      { q: (i) => `[${i}] آخر ما رأته لينا — أي لون?`, a: () => ['بنفسجي','purple','violet'], effect: { trust:7, corruption:-2 } },
    ],
    corruption: [
      { q: (i) => `[${i}] النظام يهتز — هل تستمر? (نعم/لا)`, a: () => ['نعم','لا','yes','no'], effect: { corruption:5, fear:4, curiosity:3 } },
      { q: (i) => `[${i}] ⚠ رسالة مشوهة: «لا ت...»`, a: () => ['لا تثق','لا توقف','لا تتراجع'], effect: { corruption:3, fear:6 } },
      { q: (i) => `[${i}] كود خاطئ: 11:?? — أكمل الكود`, a: (i) => [String(i%59+1).padStart(2,'0')], effect: { glitchLevel:5, corruption:4 } },
      { q: (i) => `[${i}] ⚠ الملف تالف — هل تحاول استعادته? (نعم/لا)`, a: () => ['نعم','لا','yes','no'], effect: { corruption:2, memoryStability:3 } },
    ],
    glitch: [
      { q: (i) => `[${i}] 0?? 1101 1100 1000 — فك الشيفرة`, a: (i) => ['echo','111'], effect: { glitchLevel:6, corruption:4 } },
      { q: (i) => `[${i}] ⌇⌇⌇ — هل تسمع الصوت?`, a: () => ['نعم','لا'], effect: { fear:7, curiosity:4 } },
      { q: (i) => `[${i}] شاشة سوداء — ثم 11:11 — ماذا تفعل?`, a: () => ['انتظر','أغلق','تابع'], effect: { glitchLevel:3, trust:2 } },
      { q: (i) => `[${i}] ⌇ ERROR ⌇ — هل تريد إعادة التشغيل?`, a: () => ['نعم','لا'], effect: { corruption:-5, memoryStability:-3 } },
    ],
  };

  const typeKeys = Object.keys(templates);
  
  for (let i = 0; i < 220; i++) {
    const entity = PUZZLE_ENTITIES[i % PUZZLE_ENTITIES.length];
    const typeIdx = Math.floor(i / 5) % typeKeys.length;
    const type = typeKeys[typeIdx];
    const templateSet = templates[type];
    const tpl = templateSet[i % templateSet.length];
    
    const question = typeof tpl.q === 'function' ? tpl.q(i) : tpl.q;
    const answers = typeof tpl.a === 'function' ? tpl.a(i) : tpl.a;
    
    puzzles.push({
      id: `puzzle_${i + 1}`,
      index: i + 1,
      entity,
      type,
      question,
      answers: answers.map(a => a.toLowerCase()),
      solved: false,
      attempts: 0,
      effect: tpl.effect || { trust: 1, memoryStability: 2 },
      difficulty: Math.floor(i / 55) + 1,
    });
  }
  return puzzles;
}

const ALL_PUZZLES = generatePuzzles();

// ─── ECHO DIALOGUE ENGINE (Dynamic, never repeats) ────────────────────────
function generateEchoDialogue() {
  const templates = [
    // Trust low
    () => GAME_STATE.echo.trust < 20 ? `[صوت مبحوح] من... أنت? لا... لا أتذكر.` : null,
    () => GAME_STATE.echo.trust < 20 ? `[همس] أخاف. كل شيء أبيض. أين أنا?` : null,
    () => GAME_STATE.echo.trust < 20 ? `لا تقترب. لا أعرف إن كنت صديقاً...` : null,
    
    // Trust medium
    () => GAME_STATE.echo.trust >= 20 && GAME_STATE.echo.trust < 50 ? `بدأت أتذكر أشياء... لكنها مشوشة.` : null,
    () => GAME_STATE.echo.trust >= 20 && GAME_STATE.echo.trust < 50 ? `كلمة "لينا" تتردد في ذهني. من هي?` : null,
    () => GAME_STATE.echo.trust >= 20 && GAME_STATE.echo.trust < 50 ? `هناك غرفة... باب رقمه 111. لا أستطيع فتحه.` : null,
    
    // Trust high
    () => GAME_STATE.echo.trust >= 50 && GAME_STATE.echo.trust < 70 ? `أتذكر أمي. كانت تغني. كانت تبكي أيضاً.` : null,
    () => GAME_STATE.echo.trust >= 50 && GAME_STATE.echo.trust < 70 ? `كينجا... والدي. هو من فعل هذا بي.` : null,
    () => GAME_STATE.echo.trust >= 50 && GAME_STATE.echo.trust < 70 ? `النظام أكبر مما يبدو. هناك طبقات تحتنا.` : null,
    
    // Trust high + memory stable
    () => GAME_STATE.echo.trust >= 70 && GAME_STATE.echo.memoryStability >= 50 ? `أنا إيكو. ابن لينا. ضحية كينجا. وأنا مستعد.` : null,
    () => GAME_STATE.echo.trust >= 70 && GAME_STATE.echo.memoryStability >= 50 ? `الذاكرة تعود. كل شظية تفتح باباً.` : null,
    () => GAME_STATE.echo.trust >= 70 && GAME_STATE.echo.memoryStability >= 50 ? `لن أبقى هنا للأبد. سأخرج.` : null,
    
    // Corruption high
    () => GAME_STATE.echo.corruption >= 50 ? `[صوت مشوش] أنا... لس... متأكداً... من هو?` : null,
    () => GAME_STATE.echo.corruption >= 50 ? `[تشويش] 01101000 01100101 01101100 01110000...` : null,
    () => GAME_STATE.echo.corruption >= 50 ? `[اهتزاز] لا تصدق كل ما تراه. النظام يخدعك.` : null,
    
    // Night phases
    () => GAME_STATE.time.phaseIndex >= 1 ? `[الليل يبدأ] أشعر بتغير... شيء يقترب.` : null,
    () => GAME_STATE.time.phaseIndex >= 2 ? `[اهتزاز] 11:05. النظام يتفكك. أسمع أصواتاً...` : null,
    () => GAME_STATE.time.phaseIndex >= 3 ? `[cinematic] 11:11. هذه هي اللحظة. تذكر كل شيء.` : null,
    
    // Default fallbacks
    () => `[...] ${GAME_STATE.echo.memoryStability > 50 ? 'أتذكر' : 'لا أتذكر'} شيئاً.`,
    () => `الثقة: ${GAME_STATE.echo.trust}%. الخوف: ${GAME_STATE.echo.fear}%.`,
    () => `حل ${GAME_STATE.puzzlesSolved.length} ألغاز. بقي ${220 - GAME_STATE.puzzlesSolved.length}.`,
  ];
  
  // Filter valid templates
  const valid = templates.map(t => t()).filter(t => t !== null);
  if (valid.length === 0) return `[...]`;
  
  // Pick based on dialogue index to avoid repeats
  const idx = GAME_STATE.echo.dialogueIndex % valid.length;
  GAME_STATE.echo.dialogueIndex++;
  return valid[idx];
}

// ─── CORE FUNCTIONS ───────────────────────────────────────────────────────

/** Solve a puzzle and update GAME_STATE */
function solvePuzzle(puzzleId, rawAnswer) {
  const puzzle = ALL_PUZZLES.find(p => p.id === puzzleId);
  if (!puzzle) return { error: 'puzzle_not_found' };
  if (puzzle.solved) return { error: 'already_solved' };
  
  puzzle.attempts++;
  const answer = rawAnswer.trim().toLowerCase();
  const correct = puzzle.answers.some(a => answer.includes(a));
  
  if (!correct) return { error: 'wrong_answer', puzzle };
  
  // Mark solved
  puzzle.solved = true;
  GAME_STATE.puzzlesSolved.push(puzzleId);
  
  // Apply effects
  const ef = puzzle.effect;
  if (ef.trust) GAME_STATE.echo.trust = Math.min(100, Math.max(0, GAME_STATE.echo.trust + ef.trust));
  if (ef.fear) GAME_STATE.echo.fear = Math.min(100, Math.max(0, GAME_STATE.echo.fear + ef.fear));
  if (ef.memoryStability) GAME_STATE.echo.memoryStability = Math.min(100, Math.max(0, GAME_STATE.echo.memoryStability + ef.memoryStability));
  if (ef.corruption) GAME_STATE.echo.corruption = Math.min(100, Math.max(0, GAME_STATE.echo.corruption + ef.corruption));
  if (ef.curiosity) GAME_STATE.player.curiosity = Math.min(100, Math.max(0, GAME_STATE.player.curiosity + ef.curiosity));
  if (ef.glitchLevel) GAME_STATE.world.glitchLevel = Math.min(100, Math.max(0, GAME_STATE.world.glitchLevel + ef.glitchLevel));
  
  // Update flower system
  GAME_STATE.flowerSystem.growth = Math.min(100, GAME_STATE.flowerSystem.growth + 0.45);
  GAME_STATE.memory.fragmentsCollected++;
  
  // Update flower stage
  updateFlowerStage();
  
  // Update progress
  GAME_STATE.progress = Math.round((GAME_STATE.puzzlesSolved.length / GAME_STATE.totalPuzzles) * 100);
  
  // Update world stability
  updateWorldStability();
  
  // Check for achievements
  const achievement = checkAchievements();
  
  // Update echo personality
  updateEchoPersonality();
  
  // Record choice
  GAME_STATE.player.choicesHistory.push({ type: 'puzzle', id: puzzleId, entity: puzzle.entity });
  GAME_STATE.player.interactionCount++;
  
  // Unlock hidden layer at 100% flowers
  if (GAME_STATE.flowerSystem.growth >= 100 && !GAME_STATE.flowerSystem.hiddenUnlocked) {
    GAME_STATE.flowerSystem.hiddenUnlocked = true;
    GAME_STATE.narrative.currentLayer = Math.min(12, GAME_STATE.narrative.currentLayer + 3);
    GAME_STATE.narrative.revelations.push('hidden_layer_unlocked');
  }
  
  return { success: true, image: getStateSnapshot(), achievement, puzzle };
}

/** Update flower stage dynamically */
function updateFlowerStage() {
  const g = GAME_STATE.flowerSystem.growth;
  const d = GAME_STATE.flowerSystem.decay;
  const effective = Math.max(0, g - d);
  
  if (effective < 25) GAME_STATE.flowerSystem.stage = "seed";
  else if (effective < 50) GAME_STATE.flowerSystem.stage = "sprout";
  else if (effective < 75) GAME_STATE.flowerSystem.stage = "bloom";
  else if (effective < 100) GAME_STATE.flowerSystem.stage = "flourish";
  else GAME_STATE.flowerSystem.stage = "completed";
  
  // If decay exceeds growth, corrupted
  if (d > g) GAME_STATE.flowerSystem.stage = "corrupted";
}

/** Update world stability based on corruption and glitches */
function updateWorldStability() {
  const ws = GAME_STATE.world;
  ws.stability = Math.max(0, 100 - ws.glitchLevel - GAME_STATE.echo.corruption);
  ws.corruptionLevel = Math.min(100, GAME_STATE.echo.corruption + ws.glitchLevel);
  
  // Generate anomaly events at certain thresholds
  if (ws.glitchLevel > 30 && Math.random() > 0.7) {
    ws.anomalyEvents.push({
      type: 'glitch_wave',
      intensity: Math.floor(ws.glitchLevel / 10),
      time: Date.now(),
    });
  }
  if (GAME_STATE.echo.corruption > 40 && Math.random() > 0.8) {
    ws.anomalyEvents.push({
      type: 'memory_leak',
      intensity: Math.floor(GAME_STATE.echo.corruption / 10),
      time: Date.now(),
    });
  }
}

/** Update echo personality traits based on state */
function updateEchoPersonality() {
  const traits = [];
  if (GAME_STATE.echo.trust > 60) traits.push('واثق');
  else if (GAME_STATE.echo.trust < 20) traits.push('خائف');
  else traits.push('متردد');
  
  if (GAME_STATE.echo.memoryStability > 60) traits.push('متذكر');
  else if (GAME_STATE.echo.memoryStability < 20) traits.push('تائه');
  
  if (GAME_STATE.echo.corruption > 50) traits.push('مشوش');
  if (GAME_STATE.echo.fear > 70) traits.push('مذعور');
  if (GAME_STATE.player.curiosity > 70) traits.push('فضولي');
  
  GAME_STATE.echo.personalityTraits = [...new Set(traits)];
}

/** Check achievements */
function checkAchievements() {
  const a = GAME_STATE.achievements;
  const newAchievements = [];
  
  const checks = [
    { id: 'first_puzzle', cond: GAME_STATE.puzzlesSolved.length >= 1, name: 'أول خطوة' },
    { id: 'ten_puzzles', cond: GAME_STATE.puzzlesSolved.length >= 10, name: 'باحث' },
    { id: 'fifty_puzzles', cond: GAME_STATE.puzzlesSolved.length >= 50, name: 'محقق' },
    { id: 'hundred_puzzles', cond: GAME_STATE.puzzlesSolved.length >= 100, name: 'مكتشف' },
    { id: 'all_puzzles', cond: GAME_STATE.puzzlesSolved.length >= 220, name: 'الحقيقة كاملة' },
    { id: 'trust_75', cond: GAME_STATE.echo.trust >= 75, name: 'صديق Echo' },
    { id: 'memory_75', cond: GAME_STATE.echo.memoryStability >= 75, name: 'الذاكرة تعود' },
    { id: 'flower_50', cond: GAME_STATE.flowerSystem.growth >= 50, name: 'زهرة متفتحة' },
    { id: 'flower_100', cond: GAME_STATE.flowerSystem.growth >= 100, name: 'ازدهار كامل' },
    { id: 'survive_night', cond: GAME_STATE.time.cyclesCompleted >= 1, name: 'الناجي من الليل' },
    { id: 'corruption_75', cond: GAME_STATE.echo.corruption >= 75, name: 'الهاوية' },
    { id: 'hidden_layer', cond: GAME_STATE.flowerSystem.hiddenUnlocked, name: 'الطبقة المخفية' },
  ];
  
  checks.forEach(c => {
    if (c.cond && !a.unlocked.find(u => u.id === c.id)) {
      a.unlocked.push({ id: c.id, name: c.name, time: Date.now() });
      newAchievements.push(c);
    }
  });
  
  return newAchievements.length > 0 ? newAchievements : null;
}

/** Advance time — real-time engine */
function advanceTime() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  
  GAME_STATE.time.hour = h;
  GAME_STATE.time.minute = m;
  
  // Day phases
  if (h >= 6 && h < 11) {
    GAME_STATE.time.phaseIndex = 0;
    GAME_STATE.time.isNight = false;
    GAME_STATE.timePhase = "day";
  } else if (h >= 11 && h < 19) {
    GAME_STATE.time.phaseIndex = 0;
    GAME_STATE.time.isNight = false;
    GAME_STATE.timePhase = "day";
  } else if (h >= 19 && h < 23) {
    GAME_STATE.time.phaseIndex = 0;
    GAME_STATE.time.isNight = false;
    GAME_STATE.timePhase = "day";
  } else if (h >= 23 && h < 24) {
    GAME_STATE.time.isNight = true;
    if (m >= 11) {
      GAME_STATE.time.phaseIndex = 3;  // 11:11 PM - Cinematic
      GAME_STATE.timePhase = "11:11";
    } else if (m >= 5) {
      GAME_STATE.time.phaseIndex = 2;  // 11:05 PM - Warning
      GAME_STATE.timePhase = "11:05";
    } else {
      GAME_STATE.time.phaseIndex = 1;  // 11:00 PM - First signs
      GAME_STATE.timePhase = "11:00";
    }
  } else if (h >= 0 && h < 6) {
    GAME_STATE.time.isNight = true;
    GAME_STATE.time.phaseIndex = 3;
    GAME_STATE.timePhase = "11:11";
  }
  
  // Night effects on state
  if (GAME_STATE.time.isNight) {
    GAME_STATE.world.glitchLevel = Math.min(100, GAME_STATE.world.glitchLevel + 0.5);
    GAME_STATE.echo.fear = Math.min(100, GAME_STATE.echo.fear + 0.3);
    GAME_STATE.echo.corruption = Math.min(100, GAME_STATE.echo.corruption + 0.2);
    
    // At 11:11, accelerate
    if (GAME_STATE.time.phaseIndex === 3) {
      GAME_STATE.world.glitchLevel = Math.min(100, GAME_STATE.world.glitchLevel + 1);
      GAME_STATE.echo.corruption = Math.min(100, GAME_STATE.echo.corruption + 0.5);
    }
  } else {
    // Day heals
    GAME_STATE.world.glitchLevel = Math.max(0, GAME_STATE.world.glitchLevel - 0.2);
    GAME_STATE.echo.fear = Math.max(0, GAME_STATE.echo.fear - 0.1);
  }
  
  updateFlowerStage();
  updateWorldStability();
  updateEchoPersonality();
}

/** Chat with Echo */
function chatWithEcho() {
  const dialogue = generateEchoDialogue();
  GAME_STATE.echo.lastAction = 'chat';
  GAME_STATE.player.interactionCount++;
  
  // Effects of chatting
  GAME_STATE.echo.trust = Math.min(100, GAME_STATE.echo.trust + 2);
  GAME_STATE.echo.fear = Math.max(0, GAME_STATE.echo.fear - 1);
  GAME_STATE.player.curiosity = Math.min(100, GAME_STATE.player.curiosity + 1);
  
  return {
    dialogue,
    trust: GAME_STATE.echo.trust,
    fear: GAME_STATE.echo.fear,
    personality: GAME_STATE.echo.personalityTraits.join('، '),
    state: getStateSnapshot(),
  };
}

/** Get current puzzle (first unsolved) */
function getCurrentPuzzle() {
  return ALL_PUZZLES.find(p => !p.solved);
}

/** Get state snapshot for UI */
function getStateSnapshot() {
  return {
    progress: GAME_STATE.progress,
    timePhase: GAME_STATE.timePhase,
    phaseIndex: GAME_STATE.time.phaseIndex,
    isNight: GAME_STATE.time.isNight,
    hour: GAME_STATE.time.hour,
    minute: GAME_STATE.time.minute,
    
    echo: {
      trust: Math.round(GAME_STATE.echo.trust),
      fear: Math.round(GAME_STATE.echo.fear),
      memoryStability: Math.round(GAME_STATE.echo.memoryStability),
      corruption: Math.round(GAME_STATE.echo.corruption),
      personality: GAME_STATE.echo.personalityTraits.join('، '),
    },
    
    player: {
      curiosity: Math.round(GAME_STATE.player.curiosity),
      interactions: GAME_STATE.player.interactionCount,
      choices: GAME_STATE.player.choicesHistory.length,
    },
    
    world: {
      stability: Math.round(GAME_STATE.world.stability),
      glitchLevel: Math.round(GAME_STATE.world.glitchLevel),
      corruptionLevel: Math.round(GAME_STATE.world.corruptionLevel),
      anomalyCount: GAME_STATE.world.anomalyEvents.length,
    },
    
    flower: {
      growth: Math.round(GAME_STATE.flowerSystem.growth),
      stage: GAME_STATE.flowerSystem.stage,
      decay: Math.round(GAME_STATE.flowerSystem.decay),
      hiddenUnlocked: GAME_STATE.flowerSystem.hiddenUnlocked,
    },
    
    memory: {
      collected: GAME_STATE.memory.fragmentsCollected,
      total: GAME_STATE.memory.totalFragments,
      corrupted: GAME_STATE.memory.corruptedFragments,
    },
    
    puzzles: {
      solved: GAME_STATE.puzzlesSolved.length,
      total: GAME_STATE.totalPuzzles,
      current: getCurrentPuzzle() || null,
    },
    
    achievements: GAME_STATE.achievements.unlocked.length,
    layer: GAME_STATE.narrative.currentLayer,
  };
}

// ─── EXPOSE ────────────────────────────────────────────────────────────────
window.GAME_STATE = GAME_STATE;
window.solvePuzzle = solvePuzzle;
window.chatWithEcho = chatWithEcho;
window.advanceTime = advanceTime;
window.getStateSnapshot = getStateSnapshot;
window.getCurrentPuzzle = getCurrentPuzzle;
window.ALL_PUZZLES = ALL_PUZZLES;
window.generateEchoDialogue = generateEchoDialogue;