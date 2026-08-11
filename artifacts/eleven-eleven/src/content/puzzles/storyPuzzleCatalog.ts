import type {
  StoryPuzzleDefinition,
  StoryPuzzleOption,
  StoryPuzzleText,
} from '../../domain/story-puzzles/storyPuzzleContracts';

const text = (ar: string, en: string): StoryPuzzleText => ({ ar, en });

const options = (...items: Array<[string, string, string, string?]>): readonly StoryPuzzleOption[] => (
  items.map(([id, ar, en, symbol]) => ({
    id,
    label: text(ar, en),
    ...(symbol ? { symbol } : {}),
  }))
);

const systemOptions = options(
  ['signal', 'الإشارة', 'Signal', '⌁'],
  ['memory', 'الذاكرة', 'Memory', '◇'],
  ['access', 'الوصول', 'Access', '⌘'],
  ['echo', 'Echo', 'Echo', '◉'],
);

/**
 * Public presentation metadata only. Correct solutions and balance values live
 * in the Pages Function so the client never authorizes a reward.
 */
export const STORY_PUZZLES: readonly StoryPuzzleDefinition[] = Object.freeze([
  {
    id: 'story_puzzle_01_signal_calibration', order: 1, chapterId: 'chapter_1', classification: 'main',
    title: text('معايرة الإشارة', 'Signal Calibration'),
    objective: text('وازن القناة حتى تصبح الإشارة مستقرة.', 'Stabilize the channel signal.'),
    mechanic: 'signal', difficulty: 'intro',
    source: { pageId: 'manhwa_ch01_page_02', globalPageNumber: 4 }, prerequisitePuzzleIds: [],
    hints: [text('راقب المؤشر البصري، لا تحتاج إلى الصوت.', 'Use the visual meter; audio is not required.'), text('الإشارة تستقر عند نقطة التماثل.', 'The signal stabilizes at its symmetry point.'), text('استخدم القناة 11 مع التردد المعروض.', 'Use channel 11 with the displayed frequency.')],
    completionMessage: text('تم تثبيت الإشارة.', 'Signal stabilized.'), options: systemOptions,
  },
  {
    id: 'story_puzzle_02_system_sequence', order: 2, chapterId: 'chapter_1', classification: 'main',
    title: text('تسلسل النظام', 'System Sequence'),
    objective: text('أعد ترتيب رموز النظام وفق أثر الذاكرة.', 'Restore the system symbols in memory order.'),
    mechanic: 'sequence', difficulty: 'intro',
    source: { pageId: 'manhwa_ch01_page_03', globalPageNumber: 5 }, prerequisitePuzzleIds: ['story_puzzle_01_signal_calibration'],
    hints: [text('ابدأ بالرمز الذي يفتح القناة.', 'Start with the symbol that opens the channel.'), text('المسار ينتقل من إشارة إلى ذاكرة.', 'The route moves from signal to memory.'), text('رتّب: إشارة، وصول، ذاكرة، Echo.', 'Order: signal, access, memory, Echo.')],
    completionMessage: text('تم التحقق من التسلسل.', 'Sequence verified.'), options: systemOptions,
  },
  {
    id: 'story_puzzle_03_torn_memory', order: 3, chapterId: 'chapter_1', classification: 'secret',
    title: text('ذاكرة ممزقة', 'Torn Memory'),
    objective: text('أعد وصل أجزاء السجل المتشظي.', 'Reconstruct the fragmented record.'),
    mechanic: 'image-reconstruction', difficulty: 'standard',
    source: { pageId: 'manhwa_ch01_page_07', globalPageNumber: 9 }, prerequisitePuzzleIds: ['story_puzzle_02_system_sequence'], anomalyHostPuzzleId: 'story_puzzle_02_system_sequence',
    hints: [text('طابق الحواف والخطوط قبل التفاصيل.', 'Match edges and lines before details.'), text('ابدأ بالقطع التي تحمل إطار السجل.', 'Begin with pieces containing the record frame.'), text('القطعة ذات الوهج السماوي تقع في أعلى اليمين.', 'The cyan-glow piece belongs at the upper right.')],
    completionMessage: text('تمت استعادة الذاكرة المتشظية.', 'Fragmented memory recovered.'),
    image: { src: '/manhwa/final/page-009.webp', alt: text('سجل مانهوا معتمد للفصل الأول.', 'Approved Chapter 1 Manhwa record.'), rows: 3, columns: 3, allowRotation: true },
  },
  {
    id: 'story_puzzle_04_circuit_restore', order: 4, chapterId: 'chapter_2', classification: 'main',
    title: text('استعادة الدائرة', 'Circuit Restore'), objective: text('أوصل الطاقة والبيانات والذاكرة إلى أطرافها الصحيحة.', 'Connect power, data, and memory to compatible terminals.'),
    mechanic: 'wiring', difficulty: 'standard', source: { pageId: 'manhwa_ch02_page_03', globalPageNumber: 14 }, prerequisitePuzzleIds: ['story_puzzle_02_system_sequence'],
    hints: [text('كل طرف يحمل رمزًا بالإضافة إلى لونه.', 'Each terminal has a symbol as well as a color.'), text('لا تمرر الذاكرة عبر طرف الطاقة.', 'Do not route memory through the power terminal.'), text('صِل: الطاقة إلى ⌁، البيانات إلى ⌘، الذاكرة إلى ◇.', 'Connect power to ⌁, data to ⌘, memory to ◇.')],
    completionMessage: text('تمت استعادة الدائرة.', 'Circuit restored.'), options: options(['power', 'الطاقة', 'Power', '⌁'], ['data', 'البيانات', 'Data', '⌘'], ['memory', 'الذاكرة', 'Memory', '◇']),
  },
  {
    id: 'story_puzzle_05_color_protocol', order: 5, chapterId: 'chapter_2', classification: 'secret',
    title: text('بروتوكول الألوان', 'Color Protocol'), objective: text('طابق القنوات بواسطة الرمز والشكل، وليس اللون وحده.', 'Match channels using symbol and shape, not color alone.'),
    mechanic: 'color-routing', difficulty: 'standard', source: { pageId: 'manhwa_ch02_page_05', globalPageNumber: 16 }, prerequisitePuzzleIds: ['story_puzzle_04_circuit_restore'], anomalyHostPuzzleId: 'story_puzzle_04_circuit_restore',
    hints: [text('اللون وحده ليس دليلًا كافيًا.', 'Color alone is not enough.'), text('ابحث عن الرمز المتكرر على الطرفين.', 'Find the repeated symbol on both ends.'), text('طابق: △ مع △، □ مع □، ○ مع ○.', 'Match: △ to △, □ to □, ○ to ○.')],
    completionMessage: text('تمت مزامنة بروتوكول الألوان.', 'Color protocol synchronized.'), options: options(['triangle', 'مثلث', 'Triangle', '△'], ['square', 'مربع', 'Square', '□'], ['circle', 'دائرة', 'Circle', '○']),
  },
  {
    id: 'story_puzzle_06_cipher_decoder', order: 6, chapterId: 'chapter_2', classification: 'main',
    title: text('فك الشفرة', 'Cipher Decoder'), objective: text('فك رسالة النظام عبر مفتاح الرموز المتاح.', 'Decode the system message using its visible symbol key.'),
    mechanic: 'cipher', difficulty: 'standard', source: { pageId: 'manhwa_ch02_page_06', globalPageNumber: 17 }, prerequisitePuzzleIds: ['story_puzzle_04_circuit_restore'],
    hints: [text('اقرأ المفتاح من اليسار إلى اليمين.', 'Read the key from left to right.'), text('الرمز ◇ يمثل الحرف الثالث في المفتاح.', '◇ represents the third key position.'), text('أدخل التسلسل 3-1-1.', 'Enter sequence 3-1-1.')],
    completionMessage: text('تم فك تشفير الرسالة.', 'Message decoded.'), options: options(['one', '1', '1'], ['two', '2', '2'], ['three', '3', '3'], ['four', '4', '4']),
  },
  {
    id: 'story_puzzle_07_evidence_protocol', order: 7, chapterId: 'chapter_2', classification: 'main',
    title: text('بروتوكول الأدلة', 'Evidence Protocol'), objective: text('ثبت الاستنتاج الذي تدعمه السجلات المتاحة.', 'Choose the conclusion supported by the available records.'),
    mechanic: 'evidence', difficulty: 'standard', source: { pageId: 'manhwa_ch02_page_10', globalPageNumber: 21 }, prerequisitePuzzleIds: ['story_puzzle_06_cipher_decoder'],
    hints: [text('لا تبحث عن أكثر سجل درامي؛ ابحث عن المتوافق.', 'Choose consistency, not the most dramatic log.'), text('قارن الطابع الزمني مع معرّف الكاميرا.', 'Compare the timestamp with the camera identifier.'), text('السجل CAM-07 هو الدليل المتوافق.', 'CAM-07 is the consistent record.')],
    completionMessage: text('تم اعتماد الدليل.', 'Evidence accepted.'), options: options(['cam07', 'CAM-07', 'CAM-07'], ['cam03', 'CAM-03', 'CAM-03'], ['cam11', 'CAM-11', 'CAM-11']),
  },
  {
    id: 'story_puzzle_08_pattern_breach', order: 8, chapterId: 'chapter_2', classification: 'secret',
    title: text('خرق النمط', 'Pattern Breach'), objective: text('اعثر على الشذوذ الوحيد في النمط البصري.', 'Locate the single visual anomaly in the pattern.'),
    mechanic: 'pattern-scan', difficulty: 'standard', source: { pageId: 'manhwa_ch02_page_14', globalPageNumber: 25 }, prerequisitePuzzleIds: ['story_puzzle_07_evidence_protocol'], anomalyHostPuzzleId: 'story_puzzle_07_evidence_protocol',
    hints: [text('الشذوذ ليس لونًا فقط؛ اتجاهه مختلف.', 'The anomaly differs by direction, not only color.'), text('افحص الصف السفلي قبل أي صف آخر.', 'Inspect the bottom row first.'), text('اختر العقدة D3.', 'Select node D3.')],
    completionMessage: text('تم رصد الشذوذ.', 'Anomaly detected.'), options: options(['a1', 'A1', 'A1'], ['b2', 'B2', 'B2'], ['d3', 'D3', 'D3']),
  },
  {
    id: 'story_puzzle_09_timeline_recovery', order: 9, chapterId: 'chapter_3', classification: 'main',
    title: text('استعادة الخط الزمني', 'Timeline Recovery'), objective: text('رتب السجلات كي يستعيد النظام تسلسلها.', 'Reorder the logs to restore their sequence.'),
    mechanic: 'timeline', difficulty: 'standard', source: { pageId: 'manhwa_ch03_page_02', globalPageNumber: 30 }, prerequisitePuzzleIds: ['story_puzzle_07_evidence_protocol'],
    hints: [text('ابدأ من الطابع الزمني الأقل.', 'Begin with the earliest timestamp.'), text('السجل المعطوب لا يسبق سجل الاستيقاظ.', 'The corrupted log cannot precede the awakening record.'), text('رتّب: 12:00، 12:01، 12:03، 12:04.', 'Order: 12:00, 12:01, 12:03, 12:04.')],
    completionMessage: text('تمت استعادة الخط الزمني.', 'Timeline recovered.'), options: options(['1200', '12:00', '12:00'], ['1201', '12:01', '12:01'], ['1203', '12:03', '12:03'], ['1204', '12:04', '12:04']),
  },
  {
    id: 'story_puzzle_10_memory_grid', order: 10, chapterId: 'chapter_3', classification: 'main',
    title: text('شبكة الذاكرة', 'Memory Grid'), objective: text('أعد النمط الذي ظهر قبل تشويش الشبكة.', 'Repeat the pattern shown before grid corruption.'),
    mechanic: 'memory-grid', difficulty: 'advanced', source: { pageId: 'manhwa_ch03_page_07', globalPageNumber: 35 }, prerequisitePuzzleIds: ['story_puzzle_09_timeline_recovery'],
    hints: [text('الترتيب مهم، وليس عدد العقد فقط.', 'Order matters, not only the selected nodes.'), text('النمط يكوّن قطريًا ثم يعود إلى الوسط.', 'The pattern moves diagonally, then returns to center.'), text('المسار: A1، B2، C3، B2.', 'Path: A1, B2, C3, B2.')],
    completionMessage: text('استعادت الشبكة نمط الذاكرة.', 'Memory grid restored.'), options: options(['a1', 'A1', 'A1'], ['a3', 'A3', 'A3'], ['b2', 'B2', 'B2'], ['c1', 'C1', 'C1'], ['c3', 'C3', 'C3']),
  },
  {
    id: 'story_puzzle_11_data_route_zero', order: 11, chapterId: 'chapter_3', classification: 'secret',
    title: text('مسار البيانات صفر', 'Data Route Zero'), objective: text('أوصل الحزمة عبر الشبكة دون عبور العقدة المعطوبة.', 'Route the packet without crossing the corrupted node.'),
    mechanic: 'data-route', difficulty: 'advanced', source: { pageId: 'manhwa_ch03_page_07', globalPageNumber: 35 }, prerequisitePuzzleIds: ['story_puzzle_10_memory_grid'], anomalyHostPuzzleId: 'story_puzzle_10_memory_grid',
    hints: [text('العقدة ذات الوميض الأحمر ليست صالحة.', 'The red-pulsing node is unavailable.'), text('المسار القصير ليس دائمًا آمنًا.', 'The shortest route is not always safe.'), text('اختر المسار A → C → D → F.', 'Choose path A → C → D → F.')],
    completionMessage: text('تم تأمين مسار البيانات.', 'Data route secured.'), options: options(['a', 'A', 'A'], ['b', 'B', 'B'], ['c', 'C', 'C'], ['d', 'D', 'D'], ['e', 'E', 'E'], ['f', 'F', 'F']),
  },
  {
    id: 'story_puzzle_12_mirror_code', order: 12, chapterId: 'chapter_3', classification: 'main',
    title: text('شفرة المرآة', 'Mirror Code'), objective: text('اعكس القاعدة ثم أعد بناء رمز الدخول.', 'Apply the mirror rule to reconstruct the access code.'),
    mechanic: 'mirror-code', difficulty: 'advanced', source: { pageId: 'manhwa_ch03_page_12', globalPageNumber: 40 }, prerequisitePuzzleIds: ['story_puzzle_10_memory_grid'],
    hints: [text('اقلب الترتيب قبل قراءة القيم.', 'Reverse the order before reading values.'), text('القيمة الوسطى لا تتغير.', 'The middle value does not change.'), text('اختر 4-1-4.', 'Choose 4-1-4.')],
    completionMessage: text('تمت معايرة شفرة المرآة.', 'Mirror code calibrated.'), options: options(['one', '1', '1'], ['two', '2', '2'], ['three', '3', '3'], ['four', '4', '4']),
  },
  {
    id: 'story_puzzle_13_visual_forensics', order: 13, chapterId: 'chapter_3', classification: 'main',
    title: text('التحليل البصري', 'Visual Forensics'), objective: text('افحص السجل البصري وحدد المواضع غير المتوافقة.', 'Scan the visual record and identify inconsistent regions.'),
    mechanic: 'visual-forensics', difficulty: 'advanced', source: { pageId: 'manhwa_ch03_page_17', globalPageNumber: 45 }, prerequisitePuzzleIds: ['story_puzzle_12_mirror_code'],
    hints: [text('استخدم التكبير قبل تثبيت أي نتيجة.', 'Use zoom before locking a finding.'), text('ابحث عن موضعين لا يطابقان إيقاع الواجهة.', 'Look for two regions that break the interface rhythm.'), text('المواضع الصحيحة: X2 و Z1.', 'Correct regions: X2 and Z1.')],
    completionMessage: text('تمت مطابقة الأدلة البصرية.', 'Visual evidence matched.'), options: options(['x2', 'X2', 'X2'], ['y3', 'Y3', 'Y3'], ['z1', 'Z1', 'Z1'], ['z3', 'Z3', 'Z3']),
    image: { src: '/manhwa/final/page-045.webp', alt: text('سجل بصري معتمد للفصل الثالث.', 'Approved Chapter 3 visual record.'), rows: 1, columns: 1, allowRotation: false },
  },
  {
    id: 'story_puzzle_14_system_matrix', order: 14, chapterId: 'chapter_3', classification: 'secret',
    title: text('مصفوفة النظام', 'System Matrix'), objective: text('دوّر العقد حتى تكتمل المصفوفة.', 'Rotate nodes until the matrix is connected.'),
    mechanic: 'matrix', difficulty: 'advanced', source: { pageId: 'manhwa_ch03_page_22', globalPageNumber: 50 }, prerequisitePuzzleIds: ['story_puzzle_13_visual_forensics'], anomalyHostPuzzleId: 'story_puzzle_13_visual_forensics',
    hints: [text('كل عقدة تحتاج إلى اتجاهين متوافقين.', 'Each node needs two compatible directions.'), text('ثبّت الزوايا قبل المركز.', 'Lock the corners before the center.'), text('التدوير الصحيح من اليسار لليمين: 1، 2، 0، 3.', 'Correct rotations left-to-right: 1, 2, 0, 3.')],
    completionMessage: text('اكتملت مصفوفة النظام.', 'System matrix connected.'), options: options(['tile1', 'عقدة 1', 'Node 1'], ['tile2', 'عقدة 2', 'Node 2'], ['tile3', 'عقدة 3', 'Node 3'], ['tile4', 'عقدة 4', 'Node 4']),
  },
  {
    id: 'story_puzzle_15_system_breach', order: 15, chapterId: 'chapter_3', classification: 'main',
    title: text('اختراق النظام', 'System Breach'), objective: text('أكمل قنوات الاختراق الثلاث دون فقدان حالة التقدم.', 'Complete the three breach channels without losing progress.'),
    mechanic: 'breach-protocol', difficulty: 'final', source: { pageId: 'manhwa_ch03_page_26', globalPageNumber: 54 }, prerequisitePuzzleIds: ['story_puzzle_13_visual_forensics'],
    hints: [text('أكمل كل قناة قبل الانتقال للتالية.', 'Complete each channel before continuing.'), text('المرحلة الثانية تستخدم ناتج الإشارة الأولى.', 'Stage two uses the first signal output.'), text('التسلسل: 11، ◇، ACCESS.', 'Sequence: 11, ◇, ACCESS.')],
    completionMessage: text('تم تجاوز حاجز النظام.', 'System barrier breached.'),
    stages: [
      { id: 'align', mechanic: 'signal', objective: text('ثبّت تردد الاختراق.', 'Align breach frequency.') },
      { id: 'decode', mechanic: 'cipher', objective: text('فك مخرج القناة.', 'Decode channel output.'), options: systemOptions },
      { id: 'lock', mechanic: 'wiring', objective: text('ثبّت عقدة الوصول.', 'Lock the access node.'), options: systemOptions },
    ],
  },
  {
    id: 'story_puzzle_16_memory_reconstruction', order: 16, chapterId: 'chapter_4', classification: 'main',
    title: text('محاذاة طبقات الذاكرة', 'Memory Layer Alignment'), objective: text('اضبط أطوار الطبقات الأربع حتى يتطابق السجل البصري.', 'Align four memory layers until the visual record locks.'),
    mechanic: 'layer-alignment', difficulty: 'final', source: { pageId: 'manhwa_ch04_page_02', globalPageNumber: 56, requiredCanonEventId: 'manhwa_chapter_04_black_coronation' }, prerequisitePuzzleIds: ['story_puzzle_15_system_breach'],
    hints: [text('راقب خط الفصل بين كل طبقتين بدل الصورة كاملة.', 'Watch the seam between adjacent layers, not the whole image.'), text('الطبقة الثانية ثابتة؛ اضبط ما حولها.', 'Layer two is already stable; align the others around it.'), text('الأطوار من الأعلى للأسفل: 1، 0، 3، 2.', 'Phases top-to-bottom: 1, 0, 3, 2.')],
    completionMessage: text('تمت محاذاة طبقات الذاكرة.', 'Memory layers aligned.'),
    image: { src: '/manhwa/final/page-056.webp', alt: text('صفحة مانهوا معتمدة للفصل الرابع.', 'Approved Chapter 4 Manhwa page.'), rows: 4, columns: 1, allowRotation: false },
  },
  {
    id: 'story_puzzle_17_contradictory_records', order: 17, chapterId: 'chapter_4', classification: 'main',
    title: text('السجلات المتناقضة', 'Contradictory Records'), objective: text('اعزل السجل الذي لا يمكن أن يتوافق مع البقية.', 'Isolate the record that cannot coexist with the others.'),
    mechanic: 'contradiction', difficulty: 'final', source: { pageId: 'manhwa_ch04_page_04', globalPageNumber: 58, requiredCanonEventId: 'manhwa_chapter_04_lina_protocol' }, prerequisitePuzzleIds: ['story_puzzle_16_memory_reconstruction'],
    hints: [text('سجل واحد يكسر قاعدة الزمن.', 'One record violates the time rule.'), text('قارن معرف البروتوكول مع ترتيبه.', 'Compare the protocol identifier with its order.'), text('السجل غير الممكن هو R-03.', 'The impossible record is R-03.')],
    completionMessage: text('تم عزل السجل المتناقض.', 'Contradictory record isolated.'), options: options(['r01', 'R-01', 'R-01'], ['r02', 'R-02', 'R-02'], ['r03', 'R-03', 'R-03']),
  },
  {
    id: 'story_puzzle_18_emergency_reroute', order: 18, chapterId: 'chapter_4', classification: 'secret',
    title: text('موازنة الحمل الطارئة', 'Emergency Load Balance'), objective: text('اجعل المجموع 100%، والطاقة أعلى بـ10% من قناتين متساويتين.', 'Reach 100% with power 10% above two equal channels.'),
    mechanic: 'load-balancing', difficulty: 'final', source: { pageId: 'manhwa_ch04_page_06', globalPageNumber: 60, requiredCanonEventId: 'manhwa_chapter_04_lina_protocol' }, prerequisitePuzzleIds: ['story_puzzle_17_contradictory_records'], anomalyHostPuzzleId: 'story_puzzle_17_contradictory_records',
    hints: [text('يجب أن يساوي مجموع القنوات 100%.', 'The three channels must total 100%.'), text('الطاقة تحمل النسبة الأعلى، والبيانات تساوي التبريد.', 'Power is highest; data equals cooling.'), text('التوزيع الآمن: طاقة 40، بيانات 30، تبريد 30.', 'Safe allocation: power 40, data 30, cooling 30.')],
    completionMessage: text('استقر الحمل الطارئ.', 'Emergency load stabilized.'),
  },
  {
    id: 'story_puzzle_19_final_deduction', order: 19, chapterId: 'chapter_4', classification: 'main',
    title: text('الاستنتاج الأخير', 'Final Deduction'), objective: text('اربط الأدلة التي تحققت منها سابقًا دون تغيير الـCanon.', 'Synthesize verified evidence without changing Canon.'),
    mechanic: 'deduction', difficulty: 'final', source: { pageId: 'manhwa_ch04_page_08', globalPageNumber: 62, requiredCanonEventId: 'manhwa_chapter_04_black_echo_protocol' }, prerequisitePuzzleIds: ['story_puzzle_17_contradictory_records'],
    hints: [text('الجواب يجمع إشارة وسجلًا وزمنًا.', 'The answer combines a signal, record, and time.'), text('اختر ثلاثة أدلة متوافقة، لا سجلًا منفردًا.', 'Choose three consistent pieces of evidence.'), text('ثبّت: 11:11، CAM-07، R-01.', 'Lock: 11:11, CAM-07, R-01.')],
    completionMessage: text('تم تثبيت الاستنتاج.', 'Final deduction verified.'), options: options(['1111', '11:11', '11:11'], ['cam07', 'CAM-07', 'CAM-07'], ['r01', 'R-01', 'R-01'], ['r03', 'R-03', 'R-03']),
  },
  {
    id: 'story_puzzle_20_core_sequence', order: 20, chapterId: 'chapter_4', classification: 'main',
    title: text('تسلسل نواة 11.11', '11.11 Core Sequence'), objective: text('أكمل تسلسل النواة متعدد المراحل. لا يغيّر هذا أي نهاية أو تحول.', 'Complete the multi-stage core sequence. It does not alter any ending or transformation.'),
    mechanic: 'multi-stage', difficulty: 'final', source: { pageId: 'manhwa_ch04_page_15', globalPageNumber: 69, requiredCanonEventId: 'manhwa_chapter_04_black_echo_protocol' }, prerequisitePuzzleIds: ['story_puzzle_19_final_deduction'],
    hints: [text('لا تحتاج إلى كل الأسرار لإكمال المسار الرئيسي.', 'The main path does not require every secret.'), text('كل مرحلة تعيد استخدام دليل موثق سابقًا.', 'Each stage reuses an earlier verified clue.'), text('المراحل: SYNC، ROUTE، 11-11، CORE.', 'Stages: SYNC, ROUTE, 11-11, CORE.')],
    completionMessage: text('تمت مزامنة نواة 11.11.', '11.11 core synchronized.'),
    stages: [
      { id: 'sync', mechanic: 'signal', objective: text('زامن الإشارة النهائية.', 'Synchronize the final signal.') },
      { id: 'route', mechanic: 'data-route', objective: text('ثبت مسار البيانات.', 'Lock the data route.'), options: systemOptions },
      { id: 'cipher', mechanic: 'cipher', objective: text('فك تسلسل النواة.', 'Decode the core sequence.'), options: systemOptions },
      { id: 'core', mechanic: 'sequence', objective: text('أوصل النواة.', 'Connect the core.'), options: systemOptions },
    ],
  },
]);

export const STORY_PUZZLE_BY_ID = Object.freeze(Object.fromEntries(
  STORY_PUZZLES.map((puzzle) => [puzzle.id, puzzle]),
) as Record<string, StoryPuzzleDefinition>);

export const STORY_PUZZLE_MEMORY_SHARD_IDS = Object.freeze(
  STORY_PUZZLES.map((puzzle) => `story_puzzle_shard_${String(puzzle.order).padStart(2, '0')}`),
);

export const STORY_PUZZLE_COUNTS = Object.freeze({
  total: STORY_PUZZLES.length,
  main: STORY_PUZZLES.filter((puzzle) => puzzle.classification === 'main').length,
  secret: STORY_PUZZLES.filter((puzzle) => puzzle.classification === 'secret').length,
});
