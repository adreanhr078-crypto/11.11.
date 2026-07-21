# خطة تحسين نظام 11.11 — المرحلة الثالثة

## السياق
تم فحص المشروع بالكامل. هناك مشاكل حرجة في قابلية التشغيل، ودقة نظام الألغاز، وتجربة المستخدم، وأداء المكونات.

## القرارات المُفصّلة مسبقاً
- **نطاق التعديل:** يقتصر على الملفات الموجودة داخل `artifacts/eleven-eleven/src/` فقط.
- **أولويات التنفيذ:** 1) إصلاح الأخطاء الحرجة 2) تحسين تجربة المستخدم 3) تحسين الأداء 4) تنظيف الكود.
- **لا حذف ميزات:** جميع الميزات الموجودة ستبقى، فقط إصلاح وتوصيل.
- **اللغة:** الواجهة تبقى عربي/إنجليزي مع RTL/LTR.

## المهام

### 🔴 حرج — إصلاح قبل أي شيء آخر

1. **إصلاح EchoChat**
   - ربط `EchoChat.tsx` بـ `localAiChat.ts` بدلاً من `echoLivingConsciousness.ts`.
   - استخدام `generateLocalResponse` مع الـ context المناسب.
   - التأكد من عرض الردود بشكل صحيح.

2. **إظهار نظام النهايات**
   - إضافة `EndingPanel` و `EndingResultScreen` و `FinalChoiceSystem` إلى `App.tsx`.
   - ربط `ExpandedEndingSystem` مع حالة النهايات في `gameStore`.
   - إصلاح الحقول المفقودة (`nameAr`, `storyAr`) في `ExpandedEnding`.

3. **إصلاح التحقق من الإجابات**
   - تقليل `containsMatch` إلى 3 أحرف على الأقل بدلاً من 2.
   - إزالة `partialMatch` أو تقييده بشكل أكبر.
   - تحسين `SYNONYM_MAP` ليشمل الأرقام والكلمات الإنجليزية الشائعة.

4. **إصلاح applyTransformation**
   - استدعاء `applyTransformation` من `echoTransformationSystem` داخل `solve` action بدلاً من المنطق المخصص.
   - ربط `transformationEvents` بتاريخ التحولات.

### 🟠 مهم — تحسين تجربة المستخدم

5. **إصلاح AchievementToast**
   - تصيير `AchievementToast` في `App.tsx`.
   - ربطه بفتح الإنجازات في `gameStore`.

6. **إصلاح GameSidebar**
   - إضافة `flowers` إلى `NAV_ITEMS`.
   - التأكد من أن جميع الأقسام الممكنة في `App.tsx` موجودة في الشريط.

7. **إصلاح useNarrativeEvents**
   - ربط `useStoryProgress` بـ `gameStore` بدلاً من `worldState`.
   - جعل `deriveNarrativeUI` ينتج `currentChapter` فعلي بناءً على `currentAct`.
   - إصلاح `activeMoment` و `pendingEvents`.

8. **إصلاح useTheme**
   - حل التعارض مع `toggleLanguage` في `App.tsx`.
   - استخدام ref لتجنب stale closure.

### 🟡 متوسط — تحسين الأداء والكود

9. **تحسين AnimationSystem**
   - دمج الـ intervals في واحد فقط.
   - تطبيق `panelBreath` على عناصر فعلية أو حذفه.

10. **تحسين VideoMemorySystem**
    - جلب المشاهد مرة واحدة في `useEffect` بدلاً من كل render.
    - إضافة cleanup لمنع تسرب الذاكرة.

11. **تنظيف dead code**
    - حذف `translate` غير المستخدم من `App.tsx`.
    - حذف `getEchoDialogueByStage` غير المستخدم من `gameStore.ts`.
    - حذف `useToast` إذا لم يُستخدم.
    - حذف `LevelGate` و `LangSelect` أو دمجهما في التطبيق.

12. **توحيد أنظمة الصعوبة**
    - جعل `difficulty` في `puzzleGenerator` يتحكم فعلياً في ترتيب الأسئلة داخل الفصل.
    - ترتيب الأسئلة من السهل إلى الصعب داخل كل فصل.

### 🟢 منخفض — تحسينات إضافية

13. **زيادة تنوع الألغاز**
    - إضافة 30+ سؤال لكل قالب موجود.
    - إضافة أنواع ألغاز جديدة (`logic` و `pattern` بشكل أوسع).

14. **تحسين CSS**
    - نقل الأنماط المضمنة (inline styles) إلى ملفات CSS.
    - إضافة classes مفقودة للمكونات.

15. **Memory shards**
    - ربط `allMemoryShards` بمحتوى فعلي.
    - توليد شظيات ذاكرة بناءً على الألغاز المحلولة.

16. **Flower decay**
    - إضافة آلية لزيادة `decay` في الأوقات الصعبة (ليل، فساد عالي).
    - ربط `decay` بتأثيرات الألغاز.

## المخاطر
- ربط `EchoChat` بـ `localAiChat` قد يتطلب تعديل الـ context.
- إظهار النهايات قد يتطلب تعديل في منطق `checkEndingProgress`.
- زيادة تنوع الألغاز يزيد حجم `puzzleGenerator.ts`.

## التحقق
- `tsc --noEmit` بدون أخطاء.
- `vite build` ناجح.
- تشغيل التطبيق والتأكد من:
  - EchoChat يرد بشكل صحيح.
  - النهايات تظهر وتعمل.
  - الألغاز لا تتكرر.
  - الإجابات المرادفة تُقبل.

## حالة
جاهز للتنفيذ. جميع القرارات مُحسومة.
