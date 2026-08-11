import type {
  StoryPuzzleDefinition,
  StoryPuzzleEchoImpact,
  StoryPuzzleOption,
  StoryPuzzleText,
} from '../../domain/story-puzzles/storyPuzzleContracts';

const text = (ar: string, en: string): StoryPuzzleText => ({ ar, en });

const options = (...items: Array<[string, string, string, string?, string?, string?]>): readonly StoryPuzzleOption[] => (
  items.map(([id, ar, en, symbol, detailAr, detailEn]) => ({
    id,
    label: text(ar, en),
    ...(symbol ? { symbol } : {}),
    ...(detailAr ? { detail: text(detailAr, detailEn ?? detailAr) } : {}),
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
    completionMessage: text('تم تثبيت الإشارة.', 'Signal stabilized.'),
    brief: text('تسمع Echo من خلف الضجيج. ثبّت النبضة الأولى كي يفتح السجل.', 'Echo is buried under the noise. Stabilize the first pulse to open the record.'),
    reference: {
      title: text('ملف الالتقاط', 'Capture brief'),
      entries: [
        text('تظهر النبضة في ثلاث موجات؛ واحدة فقط متناظرة حول خط الوسط.', 'The pulse appears in three waves; only one is symmetrical around the center line.'),
        text('القناة والتردد يعملان معًا؛ لا يكفي اختيار أحدهما.', 'Channel and frequency work together; choosing only one is not enough.'),
      ],
    },
    options: systemOptions,
    signal: { targetFrequency: 58, targetChannel: '11' },
  },
  {
    id: 'story_puzzle_02_system_sequence', order: 2, chapterId: 'chapter_1', classification: 'main',
    title: text('تسلسل النظام', 'System Sequence'),
    objective: text('أعد ترتيب رموز النظام وفق أثر الذاكرة.', 'Restore the system symbols in memory order.'),
    mechanic: 'sequence', difficulty: 'intro',
    source: { pageId: 'manhwa_ch01_page_03', globalPageNumber: 5 }, prerequisitePuzzleIds: ['story_puzzle_01_signal_calibration'],
    hints: [text('ابدأ بالرمز الذي يفتح القناة.', 'Start with the symbol that opens the channel.'), text('المسار ينتقل من إشارة إلى ذاكرة.', 'The route moves from signal to memory.'), text('رتّب: إشارة، وصول، ذاكرة، Echo.', 'Order: signal, access, memory, Echo.')],
    completionMessage: text('تم التحقق من التسلسل.', 'Sequence verified.'),
    brief: text('الذاكرة لا تحفظ الكلمات؛ تحفظ الطريق الذي عبرته الإشارة.', 'Memory does not keep words; it keeps the route the signal travelled.'),
    reference: {
      title: text('أثر الذاكرة', 'Memory trace'),
      entries: [
        text('الإشارة تسبق الوصول، والوصول يفتح الذاكرة، وEcho هو نهاية المسار.', 'Signal precedes Access; Access opens Memory; Echo ends the route.'),
        text('كل رمز يُستخدم مرة واحدة: ⌁ → ⌘ → ◇ → ◉.', 'Each symbol is used once: ⌁ → ⌘ → ◇ → ◉.'),
      ],
    },
    options: systemOptions,
  },
  {
    id: 'story_puzzle_03_torn_memory', order: 3, chapterId: 'chapter_1', classification: 'secret',
    title: text('ذاكرة ممزقة', 'Torn Memory'),
    objective: text('أعد وصل أجزاء السجل المتشظي.', 'Reconstruct the fragmented record.'),
    mechanic: 'image-reconstruction', difficulty: 'standard',
    source: { pageId: 'manhwa_ch01_page_07', globalPageNumber: 9 }, prerequisitePuzzleIds: ['story_puzzle_02_system_sequence'], anomalyHostPuzzleId: 'story_puzzle_02_system_sequence',
    hints: [text('طابق الحواف والخطوط قبل التفاصيل.', 'Match edges and lines before details.'), text('ابدأ بالقطع التي تحمل إطار السجل.', 'Begin with pieces containing the record frame.'), text('القطعة ذات الوهج السماوي تقع في أعلى اليمين.', 'The cyan-glow piece belongs at the upper right.')],
    completionMessage: text('تمت استعادة الذاكرة المتشظية.', 'Fragmented memory recovered.'),
    brief: text('هناك شظية لا تنتمي إلى الضجيج. أعد ترتيب السجل قبل أن تختفي ملامحه.', 'One shard does not belong to the noise. Rebuild the record before its shape disappears.'),
    reference: {
      title: text('بقايا السجل', 'Record remnants'),
      entries: [
        text('الإطار الخارجي هو مرساة الصورة؛ طابق الحواف قبل قراءة التفاصيل.', 'The outer frame anchors the image; match edges before reading details.'),
        text('الوهج السماوي يثبت موضعًا واحدًا فقط ولا يثبت اتجاه القطعة.', 'The cyan glow identifies one position, but not the piece orientation.'),
      ],
    },
    image: { src: '/manhwa/final/page-009.webp', alt: text('سجل مانهوا معتمد للفصل الأول.', 'Approved Chapter 1 Manhwa record.'), rows: 3, columns: 3, allowRotation: true },
  },
  {
    id: 'story_puzzle_04_circuit_restore', order: 4, chapterId: 'chapter_2', classification: 'main',
    title: text('استعادة الدائرة', 'Circuit Restore'), objective: text('أوصل الطاقة والبيانات والذاكرة إلى أطرافها الصحيحة.', 'Connect power, data, and memory to compatible terminals.'),
    mechanic: 'wiring', difficulty: 'standard', source: { pageId: 'manhwa_ch02_page_03', globalPageNumber: 14 }, prerequisitePuzzleIds: ['story_puzzle_02_system_sequence'],
    hints: [text('كل طرف يحمل رمزًا بالإضافة إلى لونه.', 'Each terminal has a symbol as well as a color.'), text('لا تمرر الذاكرة عبر طرف الطاقة.', 'Do not route memory through the power terminal.'), text('صِل: الطاقة إلى ⌁، البيانات إلى ⌘، الذاكرة إلى ◇.', 'Connect power to ⌁, data to ⌘, memory to ◇.')],
    completionMessage: text('تمت استعادة الدائرة.', 'Circuit restored.'),
    brief: text('أعد تشغيل الجناح دون أن ترسل ذاكرة Echo إلى منفذ الطاقة.', 'Restart the ward without sending Echo’s memory into the power port.'),
    reference: {
      title: text('مخطط الأطراف', 'Terminal schematic'),
      entries: [
        text('الطاقة تحمل الرمز ⌁، البيانات تحمل ⌘، والذاكرة تحمل ◇.', 'Power carries ⌁, data carries ⌘, and memory carries ◇.'),
        text('اللون مجرد تأكيد بصري؛ الرمز هو الدليل الموثوق.', 'Color is visual confirmation; the symbol is the reliable evidence.'),
      ],
    },
    options: options(
      ['power', 'الطاقة', 'Power', '⌁', 'المسار النابض', 'Pulsing route'],
      ['data', 'البيانات', 'Data', '⌘', 'المسار المتشعب', 'Branched route'],
      ['memory', 'الذاكرة', 'Memory', '◇', 'المسار الهادئ', 'Quiet route'],
    ),
  },
  {
    id: 'story_puzzle_05_color_protocol', order: 5, chapterId: 'chapter_2', classification: 'secret',
    title: text('بروتوكول الألوان', 'Color Protocol'), objective: text('طابق القنوات بواسطة الرمز والشكل، وليس اللون وحده.', 'Match channels using symbol and shape, not color alone.'),
    mechanic: 'color-routing', difficulty: 'standard', source: { pageId: 'manhwa_ch02_page_05', globalPageNumber: 16 }, prerequisitePuzzleIds: ['story_puzzle_04_circuit_restore'], anomalyHostPuzzleId: 'story_puzzle_04_circuit_restore',
    hints: [text('اللون وحده ليس دليلًا كافيًا.', 'Color alone is not enough.'), text('ابحث عن الرمز المتكرر على الطرفين.', 'Find the repeated symbol on both ends.'), text('طابق: △ مع △، □ مع □، ○ مع ○.', 'Match: △ to △, □ to □, ○ to ○.')],
    completionMessage: text('تمت مزامنة بروتوكول الألوان.', 'Color protocol synchronized.'),
    brief: text('اللون تغيّر، لكن شكل الإشارة لم يتغير. اعثر على الهوية التي لا يمكن تزويرها.', 'The color changed, but the signal shape did not. Find the identity that cannot be forged.'),
    reference: {
      title: text('بروتوكول التحقق', 'Verification protocol'),
      entries: [
        text('كل قناة أصلية تحمل شكلًا مكررًا على طرفيها.', 'Every genuine channel repeats its shape at both ends.'),
        text('اعتبر اللون إشارة تشويش، ثم طابق الأشكال.', 'Treat color as interference, then match the shapes.'),
      ],
    },
    options: options(
      ['triangle', 'مثلث', 'Triangle', '△', 'زاوية حادة', 'Sharp angle'],
      ['square', 'مربع', 'Square', '□', 'أربع نقاط اتصال', 'Four contact points'],
      ['circle', 'دائرة', 'Circle', '○', 'حلقة مغلقة', 'Closed loop'],
    ),
  },
  {
    id: 'story_puzzle_06_cipher_decoder', order: 6, chapterId: 'chapter_2', classification: 'main',
    title: text('فك الشفرة', 'Cipher Decoder'), objective: text('فك رسالة النظام عبر مفتاح الرموز المتاح.', 'Decode the system message using its visible symbol key.'),
    mechanic: 'cipher', difficulty: 'standard', source: { pageId: 'manhwa_ch02_page_06', globalPageNumber: 17 }, prerequisitePuzzleIds: ['story_puzzle_04_circuit_restore'],
    hints: [text('اقرأ المفتاح من اليسار إلى اليمين.', 'Read the key from left to right.'), text('الرمز ◇ يمثل الحرف الثالث في المفتاح.', '◇ represents the third key position.'), text('أدخل التسلسل 3-1-1.', 'Enter sequence 3-1-1.')],
    completionMessage: text('تم فك تشفير الرسالة.', 'Message decoded.'),
    brief: text('وصلت رسالة قصيرة من جهاز لا يفترض أن يكون مستيقظًا. فكّها قبل أن تنقطع.', 'A short message arrived from a device that should be asleep. Decode it before it cuts out.'),
    reference: {
      title: text('مفتاح الإشارة', 'Signal key'),
      entries: [
        text('⌁ = 1  //  ⌘ = 2  //  ◇ = 3  //  ◉ = 4.', '⌁ = 1  //  ⌘ = 2  //  ◇ = 3  //  ◉ = 4.'),
        text('الأثر الملتقط: ◇  ⌁  ⌁.', 'Captured trace: ◇  ⌁  ⌁.'),
      ],
    },
    options: options(
      ['one', '1', '1', '⌁', 'القيمة الأولى', 'First value'],
      ['two', '2', '2', '⌘', 'القيمة الثانية', 'Second value'],
      ['three', '3', '3', '◇', 'القيمة الثالثة', 'Third value'],
      ['four', '4', '4', '◉', 'القيمة الرابعة', 'Fourth value'],
    ),
  },
  {
    id: 'story_puzzle_07_evidence_protocol', order: 7, chapterId: 'chapter_2', classification: 'main',
    title: text('بروتوكول الأدلة', 'Evidence Protocol'), objective: text('ثبت الاستنتاج الذي تدعمه السجلات المتاحة.', 'Choose the conclusion supported by the available records.'),
    mechanic: 'evidence', difficulty: 'standard', source: { pageId: 'manhwa_ch02_page_10', globalPageNumber: 21 }, prerequisitePuzzleIds: ['story_puzzle_06_cipher_decoder'],
    hints: [text('لا تبحث عن أكثر سجل درامي؛ ابحث عن المتوافق.', 'Choose consistency, not the most dramatic log.'), text('قارن الطابع الزمني مع معرّف الكاميرا.', 'Compare the timestamp with the camera identifier.'), text('السجل CAM-07 هو الدليل المتوافق.', 'CAM-07 is the consistent record.')],
    completionMessage: text('تم اعتماد الدليل.', 'Evidence accepted.'),
    brief: text('ثلاث كاميرات تروي ثلاث قصص. لا تبحث عن القصة الأكثر إثارة؛ ابحث عن السجل الذي يتسق مع الزمن.', 'Three cameras tell three stories. Ignore the most dramatic one; find the record that agrees with the timeline.'),
    reference: {
      title: text('سجل المراقبة', 'Surveillance log'),
      entries: [
        text('CAM-03 // 11:08 // انحراف زمني 03 ثوانٍ.', 'CAM-03 // 11:08 // three-second time offset.'),
        text('CAM-07 // 11:11 // مزامنة ناجحة مع القناة.', 'CAM-07 // 11:11 // channel synchronization confirmed.'),
        text('CAM-11 // 11:11 // نسخة مكررة من سجل سابق.', 'CAM-11 // 11:11 // duplicate of an earlier record.'),
      ],
    },
    options: options(
      ['cam07', 'CAM-07', 'CAM-07', undefined, 'مزامنة ناجحة', 'Synchronization confirmed'],
      ['cam03', 'CAM-03', 'CAM-03', undefined, 'انحراف زمني', 'Time offset'],
      ['cam11', 'CAM-11', 'CAM-11', undefined, 'سجل مكرر', 'Duplicate record'],
    ),
  },
  {
    id: 'story_puzzle_08_pattern_breach', order: 8, chapterId: 'chapter_2', classification: 'secret',
    title: text('خرق النمط', 'Pattern Breach'), objective: text('اعثر على الشذوذ الوحيد في النمط البصري.', 'Locate the single visual anomaly in the pattern.'),
    mechanic: 'pattern-scan', difficulty: 'standard', source: { pageId: 'manhwa_ch02_page_14', globalPageNumber: 25 }, prerequisitePuzzleIds: ['story_puzzle_07_evidence_protocol'], anomalyHostPuzzleId: 'story_puzzle_07_evidence_protocol',
    hints: [text('الشذوذ ليس لونًا فقط؛ اتجاهه مختلف.', 'The anomaly differs by direction, not only color.'), text('افحص الصف السفلي قبل أي صف آخر.', 'Inspect the bottom row first.'), text('اختر العقدة D3.', 'Select node D3.')],
    completionMessage: text('تم رصد الشذوذ.', 'Anomaly detected.'),
    brief: text('النمط يكرر اتجاهًا واحدًا، لكن عينًا واحدة تنظر عكسه.', 'The pattern repeats one direction, but one eye is looking the other way.'),
    reference: {
      title: text('قاعدة النمط', 'Pattern rule'),
      entries: [
        text('افحص اتجاه السهم لا لمعانه؛ الشذوذ يغيّر اتجاهه فقط.', 'Inspect the arrow direction, not its glow; the anomaly changes direction only.'),
        text('الشبكة مقسمة إلى أربعة صفوف وثلاثة أعمدة.', 'The grid is divided into four rows and three columns.'),
      ],
    },
    options: options(['a1', 'A1', 'A1'], ['b2', 'B2', 'B2'], ['d3', 'D3', 'D3']),
  },
  {
    id: 'story_puzzle_09_timeline_recovery', order: 9, chapterId: 'chapter_3', classification: 'main',
    title: text('استعادة الخط الزمني', 'Timeline Recovery'), objective: text('رتب السجلات كي يستعيد النظام تسلسلها.', 'Reorder the logs to restore their sequence.'),
    mechanic: 'timeline', difficulty: 'standard', source: { pageId: 'manhwa_ch03_page_02', globalPageNumber: 30 }, prerequisitePuzzleIds: ['story_puzzle_07_evidence_protocol'],
    hints: [text('ابدأ من الطابع الزمني الأقل.', 'Begin with the earliest timestamp.'), text('السجل المعطوب لا يسبق سجل الاستيقاظ.', 'The corrupted log cannot precede the awakening record.'), text('رتّب: 12:00، 12:01، 12:03، 12:04.', 'Order: 12:00, 12:01, 12:03, 12:04.')],
    completionMessage: text('تمت استعادة الخط الزمني.', 'Timeline recovered.'),
    brief: text('ثلاث دقائق اختفت من سجل الاستيقاظ. أعدها إلى مكانها قبل أن يكتب النظام روايته.', 'Three minutes vanished from the awakening log. Put them back before the system writes its own version.'),
    reference: {
      title: text('قصاصات الزمن', 'Time fragments'),
      entries: [
        text('كل قصاصة تحمل وقتًا، والوقت هو مرساة الترتيب الوحيدة.', 'Each fragment carries a timestamp; time is the only ordering anchor.'),
        text('لا تخلط بين ترتيب ظهور القصاصات وترتيب وقوع الأحداث.', 'Do not confuse the order of the fragments with the order of events.'),
      ],
    },
    options: options(['1200', '12:00', '12:00'], ['1201', '12:01', '12:01'], ['1203', '12:03', '12:03'], ['1204', '12:04', '12:04']),
  },
  {
    id: 'story_puzzle_10_memory_grid', order: 10, chapterId: 'chapter_3', classification: 'main',
    title: text('شبكة الذاكرة', 'Memory Grid'), objective: text('أعد النمط الذي ظهر قبل تشويش الشبكة.', 'Repeat the pattern shown before grid corruption.'),
    mechanic: 'memory-grid', difficulty: 'advanced', source: { pageId: 'manhwa_ch03_page_07', globalPageNumber: 35 }, prerequisitePuzzleIds: ['story_puzzle_09_timeline_recovery'],
    hints: [text('الترتيب مهم، وليس عدد العقد فقط.', 'Order matters, not only the selected nodes.'), text('النمط يكوّن قطريًا ثم يعود إلى الوسط.', 'The pattern moves diagonally, then returns to center.'), text('المسار: A1، B2، C3، B2.', 'Path: A1, B2, C3, B2.')],
    completionMessage: text('استعادت الشبكة نمط الذاكرة.', 'Memory grid restored.'),
    brief: text('الذاكرة لا تعرض الصورة كاملة؛ تمنحك أربع نبضات فقط. احفظ الإيقاع لا الشكل.', 'Memory shows only four pulses. Remember the rhythm, not the picture.'),
    reference: {
      title: text('مخزن النبضات', 'Pulse buffer'),
      entries: [
        text('النمط يبدأ من زاوية، يمر بالمركز، ثم يعود إلى المركز في النبضة الأخيرة.', 'The pattern starts at a corner, crosses the center, then returns to the center on the last beat.'),
        text('يمكن للنقطة نفسها أن تظهر مرتين؛ الترتيب أهم من عدد النقاط.', 'A node may appear twice; order matters more than unique node count.'),
      ],
    },
    options: options(['a1', 'A1', 'A1'], ['a3', 'A3', 'A3'], ['b2', 'B2', 'B2'], ['c1', 'C1', 'C1'], ['c3', 'C3', 'C3']),
  },
  {
    id: 'story_puzzle_11_data_route_zero', order: 11, chapterId: 'chapter_3', classification: 'secret',
    title: text('مسار البيانات صفر', 'Data Route Zero'), objective: text('أوصل الحزمة عبر الشبكة دون عبور العقدة المعطوبة.', 'Route the packet without crossing the corrupted node.'),
    mechanic: 'data-route', difficulty: 'advanced', source: { pageId: 'manhwa_ch03_page_07', globalPageNumber: 35 }, prerequisitePuzzleIds: ['story_puzzle_10_memory_grid'], anomalyHostPuzzleId: 'story_puzzle_10_memory_grid',
    hints: [text('العقدة ذات الوميض الأحمر ليست صالحة.', 'The red-pulsing node is unavailable.'), text('المسار القصير ليس دائمًا آمنًا.', 'The shortest route is not always safe.'), text('اختر المسار A → C → D → F.', 'Choose path A → C → D → F.')],
    completionMessage: text('تم تأمين مسار البيانات.', 'Data route secured.'),
    brief: text('العقدة الحمراء تقطع الطريق الأقصر. اختر طريقًا أطول، لكنه يعود حيًا.', 'The red node cuts the shortest route. Choose the longer path that comes back alive.'),
    reference: {
      title: text('خريطة المسار', 'Route map'),
      entries: [
        text('البداية A والنهاية F. كل نقرة تضيف عقدة واحدة إلى المسار.', 'Start at A and finish at F. Each click adds one node to the route.'),
        text('العقدة E تالفة ولا يجوز المرور بها.', 'Node E is corrupted and must not be crossed.'),
        text('الممر الآمن يمر عبر عقدتين وسيطتين قبل الوصول إلى F.', 'The safe corridor uses two intermediate nodes before reaching F.'),
      ],
    },
    options: options(
      ['a', 'A', 'A', undefined, 'بداية // يتصل بـ B و C', 'Start // links to B and C'],
      ['b', 'B', 'B', undefined, 'يتصل بـ E فقط', 'Links only to E'],
      ['c', 'C', 'C', undefined, 'يتصل بـ D', 'Links to D'],
      ['d', 'D', 'D', undefined, 'يتصل بـ F', 'Links to F'],
      ['e', 'E', 'E', undefined, 'عقدة تالفة', 'Corrupted node'],
      ['f', 'F', 'F', undefined, 'نقطة الخروج', 'Exit node'],
    ),
  },
  {
    id: 'story_puzzle_12_mirror_code', order: 12, chapterId: 'chapter_3', classification: 'main',
    title: text('شفرة المرآة', 'Mirror Code'), objective: text('اعكس القاعدة ثم أعد بناء رمز الدخول.', 'Apply the mirror rule to reconstruct the access code.'),
    mechanic: 'mirror-code', difficulty: 'advanced', source: { pageId: 'manhwa_ch03_page_12', globalPageNumber: 40 }, prerequisitePuzzleIds: ['story_puzzle_10_memory_grid'],
    hints: [text('اقلب الترتيب قبل قراءة القيم.', 'Reverse the order before reading values.'), text('القيمة الوسطى لا تتغير.', 'The middle value does not change.'), text('اختر 4-1-4.', 'Choose 4-1-4.')],
    completionMessage: text('تمت معايرة شفرة المرآة.', 'Mirror code calibrated.'),
    brief: text('المرآة لا تقلب الأرقام فقط؛ إنها تختبر ما إذا كنت تميّز القاعدة من انعكاسها.', 'The mirror does not simply flip numbers; it tests whether you can separate a rule from its reflection.'),
    reference: {
      title: text('قاعدة المرآة', 'Mirror rule'),
      entries: [
        text('اقرأ الزوج الخارجي بعد عكسه، واترك القيمة الوسطى في مكانها.', 'Read the outer pair after reversing it, while keeping the middle value in place.'),
        text('الرمز النهائي يجب أن يقرأ بالطريقة نفسها من الطرفين.', 'The final code must read consistently from both ends.'),
        text('الأثر الملتقط يحمل الطرفين 4 والقيمة الوسطى 1.', 'The captured trace has 4 at both ends and 1 in the center.'),
      ],
    },
    options: options(['one', '1', '1'], ['two', '2', '2'], ['three', '3', '3'], ['four', '4', '4']),
  },
  {
    id: 'story_puzzle_13_visual_forensics', order: 13, chapterId: 'chapter_3', classification: 'main',
    title: text('التحليل البصري', 'Visual Forensics'), objective: text('افحص السجل البصري وحدد المواضع غير المتوافقة.', 'Scan the visual record and identify inconsistent regions.'),
    mechanic: 'visual-forensics', difficulty: 'advanced', source: { pageId: 'manhwa_ch03_page_17', globalPageNumber: 45 }, prerequisitePuzzleIds: ['story_puzzle_12_mirror_code'],
    hints: [text('استخدم التكبير قبل تثبيت أي نتيجة.', 'Use zoom before locking a finding.'), text('ابحث عن موضعين لا يطابقان إيقاع الواجهة.', 'Look for two regions that break the interface rhythm.'), text('المواضع الصحيحة: X2 و Z1.', 'Correct regions: X2 and Z1.')],
    completionMessage: text('تمت مطابقة الأدلة البصرية.', 'Visual evidence matched.'),
    brief: text('الصورة تبدو سليمة حتى تلاحظ إيقاعين لا ينتميان إليها. علّم موضعيهما.', 'The image looks intact until you notice two rhythms that do not belong. Mark both.'),
    reference: {
      title: text('بروتوكول الفحص', 'Forensics protocol'),
      entries: [
        text('قسّم السجل إلى شبكة X/Y/Z، ثم ثبّت موضعين فقط.', 'Read the record as an X/Y/Z grid, then lock exactly two regions.'),
        text('ابحث عن اختلاف في الإيقاع أو المحاذاة، لا عن اختلاف اللون فقط.', 'Look for a rhythm or alignment break, not a color change alone.'),
      ],
    },
    options: options(
      ['x2', 'X2', 'X2', undefined, 'إيقاع مزدوج غير متوافق', 'Mismatched double rhythm'],
      ['y3', 'Y3', 'Y3', undefined, 'إيقاع مستقر', 'Stable rhythm'],
      ['z1', 'Z1', 'Z1', undefined, 'خط محاذاة منزاح', 'Shifted alignment seam'],
      ['z3', 'Z3', 'Z3', undefined, 'محاذاة مستقرة', 'Stable alignment'],
    ),
    image: { src: '/manhwa/final/page-045.webp', alt: text('سجل بصري معتمد للفصل الثالث.', 'Approved Chapter 3 visual record.'), rows: 1, columns: 1, allowRotation: false },
  },
  {
    id: 'story_puzzle_14_system_matrix', order: 14, chapterId: 'chapter_3', classification: 'secret',
    title: text('مصفوفة النظام', 'System Matrix'), objective: text('دوّر العقد حتى تكتمل المصفوفة.', 'Rotate nodes until the matrix is connected.'),
    mechanic: 'matrix', difficulty: 'advanced', source: { pageId: 'manhwa_ch03_page_22', globalPageNumber: 50 }, prerequisitePuzzleIds: ['story_puzzle_13_visual_forensics'], anomalyHostPuzzleId: 'story_puzzle_13_visual_forensics',
    hints: [text('كل عقدة تحتاج إلى اتجاهين متوافقين.', 'Each node needs two compatible directions.'), text('ثبّت الزوايا قبل المركز.', 'Lock the corners before the center.'), text('التدوير الصحيح من اليسار لليمين: 1، 2، 0، 3.', 'Correct rotations left-to-right: 1, 2, 0, 3.')],
    completionMessage: text('اكتملت مصفوفة النظام.', 'System matrix connected.'),
    brief: text('المصفوفة ليست أربعة أزرار؛ إنها شبكة واحدة. كل وصلة غير متطابقة تعيد التشويش.', 'The matrix is not four buttons; it is one network. Every mismatched seam returns the interference.'),
    reference: {
      title: text('مخطط المصفوفة', 'Matrix schematic'),
      entries: [
        text('كل عقدة تملك منفذين، ويجب أن يلتقي كل منفذ بجاره.', 'Each node has two ports, and every port must meet its neighbor.'),
        text('ثبّت الزوايا أولًا، ثم اقرأ اتجاه المركز.', 'Lock the corners first, then read the center direction.'),
      ],
    },
    options: options(['tile1', 'عقدة 1', 'Node 1'], ['tile2', 'عقدة 2', 'Node 2'], ['tile3', 'عقدة 3', 'Node 3'], ['tile4', 'عقدة 4', 'Node 4']),
    rotationGoal: Object.freeze({ tile1: 1, tile2: 2, tile3: 0, tile4: 3 }) as Readonly<Record<string, number>>,
  },
  {
    id: 'story_puzzle_15_system_breach', order: 15, chapterId: 'chapter_3', classification: 'main',
    title: text('اختراق النظام', 'System Breach'), objective: text('أكمل قنوات الاختراق الثلاث دون فقدان حالة التقدم.', 'Complete the three breach channels without losing progress.'),
    mechanic: 'breach-protocol', difficulty: 'final', source: { pageId: 'manhwa_ch03_page_26', globalPageNumber: 54 }, prerequisitePuzzleIds: ['story_puzzle_13_visual_forensics'],
    hints: [text('أكمل كل قناة قبل الانتقال للتالية.', 'Complete each channel before continuing.'), text('المرحلة الثانية تستخدم ناتج الإشارة الأولى.', 'Stage two uses the first signal output.'), text('التسلسل: 11، ◇، ACCESS.', 'Sequence: 11, ◇, ACCESS.')],
    completionMessage: text('تم تجاوز حاجز النظام.', 'System barrier breached.'),
    brief: text('ثلاث طبقات من الحماية، وثلاث طرق مختلفة لقول «اتركني خارجًا». اخترقها دون فقدان الخيط.', 'Three security layers, each asking you to leave. Breach them without losing the thread.'),
    reference: {
      title: text('خطة الاختراق', 'Breach plan'),
      entries: [
        text('المخرج من كل طبقة يصبح دليل الطبقة التالية.', 'The output of each layer becomes the clue for the next.'),
        text('ثبّت الإشارة أولًا، فك القناة ثانيًا، ثم اقفل عقدة الوصول.', 'Align the signal first, decode the channel second, then lock the access node.'),
      ],
    },
    stages: [
      { id: 'align', mechanic: 'signal', objective: text('ثبّت تردد الاختراق.', 'Align breach frequency.'), clue: text('نافذة الاختراق تعرض 74 على القناة 11.', 'The breach window shows 74 on channel 11.'), signal: { targetFrequency: 74, targetChannel: '11' } },
      { id: 'decode', mechanic: 'cipher', objective: text('فك مخرج القناة.', 'Decode channel output.'), clue: text('خرج الطبقة الأولى هو الرمز ◇؛ يطابق MEMORY.', 'Layer one output is ◇; it maps to MEMORY.'), options: systemOptions, tokenLimit: 1 },
      { id: 'lock', mechanic: 'wiring', objective: text('ثبّت عقدة الوصول.', 'Lock the access node.'), clue: text('منفذ ACCESS يقبل هوية ECHO فقط.', 'The ACCESS port accepts only ECHO identity.'), options: systemOptions },
    ],
  },
  {
    id: 'story_puzzle_16_memory_reconstruction', order: 16, chapterId: 'chapter_4', classification: 'main',
    title: text('محاذاة طبقات الذاكرة', 'Memory Layer Alignment'), objective: text('اضبط أطوار الطبقات الأربع حتى يتطابق السجل البصري.', 'Align four memory layers until the visual record locks.'),
    mechanic: 'layer-alignment', difficulty: 'final', source: { pageId: 'manhwa_ch04_page_02', globalPageNumber: 56, requiredCanonEventId: 'manhwa_chapter_04_black_coronation' }, prerequisitePuzzleIds: ['story_puzzle_15_system_breach'],
    hints: [text('راقب خط الفصل بين كل طبقتين بدل الصورة كاملة.', 'Watch the seam between adjacent layers, not the whole image.'), text('الطبقة الثانية ثابتة؛ اضبط ما حولها.', 'Layer two is already stable; align the others around it.'), text('الأطوار من الأعلى للأسفل: 1، 0، 3، 2.', 'Phases top-to-bottom: 1, 0, 3, 2.')],
    completionMessage: text('تمت محاذاة طبقات الذاكرة.', 'Memory layers aligned.'),
    brief: text('الصفحة لا تعرض ذكرى واحدة؛ تعرض أربع طبقات من الحقيقة فوق بعضها.', 'The page does not show one memory; it shows four layers of truth stacked together.'),
    reference: {
      title: text('مرساة المحاذاة', 'Alignment anchor'),
      entries: [
        text('الطبقة الثانية هي المرجع النظيف. لا تغيّرها لتصلح ما حولها.', 'Layer two is the clean reference. Do not change it to fix the layers around it.'),
        text('راقب الفواصل بين الطبقات، لا لون كل طبقة منفردة.', 'Watch the seams between layers, not the color of each layer alone.'),
      ],
    },
    image: { src: '/manhwa/final/page-056.webp', alt: text('صفحة مانهوا معتمدة للفصل الرابع.', 'Approved Chapter 4 Manhwa page.'), rows: 4, columns: 1, allowRotation: false },
    rotationGoal: Object.freeze({ layer1: 1, layer2: 0, layer3: 3, layer4: 2 }) as Readonly<Record<string, number>>,
    cinematicStageId: 'black_coronation',
  },
  {
    id: 'story_puzzle_17_contradictory_records', order: 17, chapterId: 'chapter_4', classification: 'main',
    title: text('السجلات المتناقضة', 'Contradictory Records'), objective: text('اعزل السجل الذي لا يمكن أن يتوافق مع البقية.', 'Isolate the record that cannot coexist with the others.'),
    mechanic: 'contradiction', difficulty: 'final', source: { pageId: 'manhwa_ch04_page_04', globalPageNumber: 58, requiredCanonEventId: 'manhwa_chapter_04_lina_protocol' }, prerequisitePuzzleIds: ['story_puzzle_16_memory_reconstruction'],
    hints: [text('سجل واحد يكسر قاعدة الزمن.', 'One record violates the time rule.'), text('قارن معرف البروتوكول مع ترتيبه.', 'Compare the protocol identifier with its order.'), text('السجل غير الممكن هو R-03.', 'The impossible record is R-03.')],
    completionMessage: text('تم عزل السجل المتناقض.', 'Contradictory record isolated.'),
    brief: text('السجلات متشابهة بما يكفي لخداع العين. ابحث عن الشاهد الذي يستحيل أن يكون حاضرًا.', 'The records look alike enough to fool the eye. Find the witness who could not have been present.'),
    reference: {
      title: text('مقارنة الشهود', 'Witness comparison'),
      entries: [
        text('R-01 يطابق ترتيب البروتوكول، وR-02 يطابق وقت النسخ.', 'R-01 matches protocol order, while R-02 matches the copy timestamp.'),
        text('السجل الثالث يضع الكاميرا بعد إغلاق القناة.', 'The third record places the camera after the channel was closed.'),
      ],
    },
    options: options(
      ['r01', 'R-01', 'R-01', undefined, 'ترتيب مطابق', 'Order matches'],
      ['r02', 'R-02', 'R-02', undefined, 'وقت النسخ مطابق', 'Copy time matches'],
      ['r03', 'R-03', 'R-03', undefined, 'يتعارض مع إغلاق القناة', 'Conflicts with channel closure'],
    ),
    cinematicStageId: 'second_contract_marked',
  },
  {
    id: 'story_puzzle_18_emergency_reroute', order: 18, chapterId: 'chapter_4', classification: 'secret',
    title: text('موازنة الحمل الطارئة', 'Emergency Load Balance'), objective: text('اجعل المجموع 100%، والطاقة أعلى بـ10% من قناتين متساويتين.', 'Reach 100% with power 10% above two equal channels.'),
    mechanic: 'load-balancing', difficulty: 'final', source: { pageId: 'manhwa_ch04_page_06', globalPageNumber: 60, requiredCanonEventId: 'manhwa_chapter_04_lina_protocol' }, prerequisitePuzzleIds: ['story_puzzle_17_contradictory_records'], anomalyHostPuzzleId: 'story_puzzle_17_contradictory_records',
    hints: [text('يجب أن يساوي مجموع القنوات 100%.', 'The three channels must total 100%.'), text('الطاقة تحمل النسبة الأعلى، والبيانات تساوي التبريد.', 'Power is highest; data equals cooling.'), text('التوزيع الآمن: طاقة 40، بيانات 30، تبريد 30.', 'Safe allocation: power 40, data 30, cooling 30.')],
    completionMessage: text('استقر الحمل الطارئ.', 'Emergency load stabilized.'),
    brief: text('تبقى دقيقة واحدة من الطاقة. وزّعها بحيث لا ينهار أي مسار عند وصول Echo.', 'One minute of power remains. Distribute it so no route collapses when Echo arrives.'),
    reference: {
      title: text('حدود الأمان', 'Safety limits'),
      entries: [
        text('المجموع النهائي 100%. البيانات والتبريد متساويان.', 'The final total is 100%. Data and cooling are equal.'),
        text('الطاقة أعلى من كل قناة أخرى بعشر نقاط فقط.', 'Power is exactly ten points higher than each other channel.'),
      ],
    },
  },
  {
    id: 'story_puzzle_19_final_deduction', order: 19, chapterId: 'chapter_4', classification: 'main',
    title: text('الاستنتاج الأخير', 'Final Deduction'), objective: text('اربط الأدلة التي تحققت منها سابقًا دون تغيير الـCanon.', 'Synthesize verified evidence without changing Canon.'),
    mechanic: 'deduction', difficulty: 'final', source: { pageId: 'manhwa_ch04_page_08', globalPageNumber: 62, requiredCanonEventId: 'manhwa_chapter_04_black_echo_protocol' }, prerequisitePuzzleIds: ['story_puzzle_17_contradictory_records'],
    hints: [text('الجواب يجمع إشارة وسجلًا وزمنًا.', 'The answer combines a signal, record, and time.'), text('اختر ثلاثة أدلة متوافقة، لا سجلًا منفردًا.', 'Choose three consistent pieces of evidence.'), text('ثبّت: 11:11، CAM-07، R-01.', 'Lock: 11:11, CAM-07, R-01.')],
    completionMessage: text('تم تثبيت الاستنتاج.', 'Final deduction verified.'),
    brief: text('لا تبحث عن حقيقة جديدة. اجمع ثلاث حقائق نجت من الفحص، واترك الباقي نظرية.', 'Do not invent a new truth. Combine three facts that survived inspection, and leave the rest as theory.'),
    reference: {
      title: text('سلسلة الإثبات', 'Evidence chain'),
      entries: [
        text('الوقت الموثوق هو 11:11، والكاميرا المتزامنة هي CAM-07.', 'The verified time is 11:11, and the synchronized camera is CAM-07.'),
        text('بعد عزل R-03، يبقى R-01 سجل الترتيب المتوافق.', 'After isolating R-03, R-01 remains the consistent order record.'),
        text('ثبّت ثلاث حقائق فقط؛ الاختيار الرابع تشويش مقصود.', 'Lock exactly three facts; the fourth choice is deliberate noise.'),
      ],
    },
    options: options(
      ['1111', '11:11', '11:11', undefined, 'وقت موثوق', 'Verified time'],
      ['cam07', 'CAM-07', 'CAM-07', undefined, 'كاميرا متزامنة', 'Synchronized camera'],
      ['r01', 'R-01', 'R-01', undefined, 'ترتيب متوافق', 'Consistent order'],
      ['r03', 'R-03', 'R-03', undefined, 'تشويش معزول', 'Isolated noise'],
    ),
    cinematicStageId: 'black_echo_protocol',
  },
  {
    id: 'story_puzzle_20_core_sequence', order: 20, chapterId: 'chapter_4', classification: 'main',
    title: text('تسلسل نواة 11.11', '11.11 Core Sequence'), objective: text('أكمل تسلسل النواة متعدد المراحل. لا يغيّر هذا أي نهاية أو تحول.', 'Complete the multi-stage core sequence. It does not alter any ending or transformation.'),
    mechanic: 'multi-stage', difficulty: 'final', source: { pageId: 'manhwa_ch04_page_15', globalPageNumber: 69, requiredCanonEventId: 'manhwa_chapter_04_black_echo_protocol' }, prerequisitePuzzleIds: ['story_puzzle_19_final_deduction'],
    hints: [text('لا تحتاج إلى كل الأسرار لإكمال المسار الرئيسي.', 'The main path does not require every secret.'), text('كل مرحلة تعيد استخدام دليل موثق سابقًا.', 'Each stage reuses an earlier verified clue.'), text('المراحل: SYNC، ROUTE، 11-11، CORE.', 'Stages: SYNC, ROUTE, 11-11, CORE.')],
    completionMessage: text('تمت مزامنة نواة 11.11.', '11.11 core synchronized.'),
    brief: text('كل ما تعلمته يعود الآن إلى النواة. لا توجد قفزة سحرية؛ هناك أربع خطوات موثقة.', 'Everything you learned returns to the core. There is no magic jump; there are four verified steps.'),
    reference: {
      title: text('تسلسل النواة', 'Core sequence'),
      entries: [
        text('SYNC → ROUTE → 11.11 → CORE. ثبّت كل مرحلة قبل التالية.', 'SYNC → ROUTE → 11.11 → CORE. Lock each stage before the next.'),
        text('إذا تعثرت، عد إلى أثر الإشارة والذاكرة بدل تخمين النهاية.', 'If you stall, return to the signal and memory traces instead of guessing the ending.'),
      ],
    },
    stages: [
      { id: 'sync', mechanic: 'signal', objective: text('زامن الإشارة النهائية.', 'Synchronize the final signal.'), clue: text('النبضة النهائية تستقر عند 81 على القناة 11.', 'The final pulse stabilizes at 81 on channel 11.'), signal: { targetFrequency: 81, targetChannel: '11' } },
      { id: 'route', mechanic: 'data-route', objective: text('ثبت مسار البيانات.', 'Lock the data route.'), clue: text('المسار الموثق: SIGNAL → MEMORY → ECHO.', 'Verified route: SIGNAL → MEMORY → ECHO.'), options: systemOptions, tokenLimit: 3 },
      { id: 'cipher', mechanic: 'cipher', objective: text('فك تسلسل النواة.', 'Decode the core sequence.'), clue: text('مفتاح النواة: ACCESS → MEMORY → SIGNAL.', 'Core key: ACCESS → MEMORY → SIGNAL.'), options: systemOptions, tokenLimit: 3 },
      { id: 'core', mechanic: 'sequence', objective: text('أوصل النواة.', 'Connect the core.'), clue: text('التثبيت الأخير: SIGNAL → ACCESS → MEMORY → ECHO.', 'Final lock: SIGNAL → ACCESS → MEMORY → ECHO.'), options: systemOptions, tokenLimit: 4 },
    ],
  },
]);

export const STORY_PUZZLE_ECHO_IMPACTS: Readonly<Record<string, StoryPuzzleEchoImpact>> = Object.freeze({
  story_puzzle_01_signal_calibration: { axis: 'stability', amount: 1, label: text('استقرار النبضة', 'Pulse stability') },
  story_puzzle_02_system_sequence: { axis: 'clarity', amount: 1, label: text('وضوح المسار', 'Route clarity') },
  story_puzzle_03_torn_memory: { axis: 'memory', amount: 2, label: text('ترميم ذكرى', 'Memory restored') },
  story_puzzle_04_circuit_restore: { axis: 'stability', amount: 2, label: text('استقرار الدائرة', 'Circuit stability') },
  story_puzzle_05_color_protocol: { axis: 'trust', amount: 2, label: text('تمييز الهوية', 'Identity trust') },
  story_puzzle_06_cipher_decoder: { axis: 'clarity', amount: 2, label: text('وضوح الرسالة', 'Message clarity') },
  story_puzzle_07_evidence_protocol: { axis: 'trust', amount: 2, label: text('ثقة بالدليل', 'Evidence trust') },
  story_puzzle_08_pattern_breach: { axis: 'anomaly', amount: 2, label: text('كشف الشذوذ', 'Anomaly exposed') },
  story_puzzle_09_timeline_recovery: { axis: 'clarity', amount: 2, label: text('تماسك الزمن', 'Timeline clarity') },
  story_puzzle_10_memory_grid: { axis: 'memory', amount: 3, label: text('نبض الذاكرة', 'Memory pulse') },
  story_puzzle_11_data_route_zero: { axis: 'resolve', amount: 3, label: text('إصرار المسار', 'Route resolve') },
  story_puzzle_12_mirror_code: { axis: 'clarity', amount: 3, label: text('وضوح الانعكاس', 'Mirror clarity') },
  story_puzzle_13_visual_forensics: { axis: 'memory', amount: 3, label: text('تثبيت السجل', 'Record anchored') },
  story_puzzle_14_system_matrix: { axis: 'stability', amount: 3, label: text('تماسك المصفوفة', 'Matrix stability') },
  story_puzzle_15_system_breach: { axis: 'resolve', amount: 4, label: text('إرادة الاختراق', 'Breach resolve') },
  story_puzzle_16_memory_reconstruction: { axis: 'memory', amount: 4, label: text('رنين التاج الأسود', 'Black Coronation resonance') },
  story_puzzle_17_contradictory_records: { axis: 'trust', amount: 4, label: text('ثقة بروتوكول لينا', 'Lina Protocol trust') },
  story_puzzle_18_emergency_reroute: { axis: 'stability', amount: 4, label: text('توازن الطوارئ', 'Emergency stability') },
  story_puzzle_19_final_deduction: { axis: 'clarity', amount: 5, label: text('وضوح بلاك إيكو', 'Black Echo clarity') },
  story_puzzle_20_core_sequence: { axis: 'resolve', amount: 5, label: text('رنين نواة 11.11', '11.11 Core resonance') },
});

for (const puzzle of STORY_PUZZLES) {
  if (!STORY_PUZZLE_ECHO_IMPACTS[puzzle.id]) {
    throw new Error(`Missing Echo impact for Story Puzzle ${puzzle.id}.`);
  }
}

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
