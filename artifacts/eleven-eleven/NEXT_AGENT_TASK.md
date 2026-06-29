# Task for Next Agent

## الحالة الحالية للمشروع

تم إنشاء 11.11 Project Doctor بنجاح، والآن المشروع في المرحلة التالية:

### ما تم إنجازه

1. ✅ إنشاء نظام Project Doctor في `tools/project-doctor/index.ts`
2. ✅ إضافة scripts لـ package.json:
   - npm run doctor
   - npm run doctor:counts
   - npm run doctor:white-screen
   - npm run doctor:storage
   - npm run doctor:files
   - npm run doctor:build
   - npm run agent:preflight
   - npm run agent:postflight
3. ✅ إنشاء AGENT_RULES.md مع القواعد الإلزامية

### المشاكل الحالية

1. **Memory Shards:** أصبحت 835 (كانت تحتاج تعديل)
2. **TypeScript:** كان PASS بعد إصلاح tsconfig
3. **الشاشة البيضاء:** توجد مشكلة شاشة بيضاء عند المستخدم
4. **النهايات:** حالياً تظهر 4 قديمة، والمطلوب لاحقاً 5

### التعليمات

#### الأولوية الحالية:
1. **أولاً:** إصلاح الشاشة البيضاء
2. **ثانياً:** فحص Edge cases بعد إصلاح الشاشة البيضاء
3. **لاحقاً:** إضافة النهاية الخامسة

#### ممنوع حالياً:
- ❌ البدء بـ Achievements
- ❌ البدء بـ Cinematics
- ❌ تعديل منطق اللعبة
- ❌ تعديل الألغاز
- ❌ تعديل Memory Shards

### خطوات العمل المطلوبة

```bash
# 1. تثبيت الاعتمادات
npm install

# 2. فحص قبل أي تعديل
npm run agent:preflight

# 3. تنفيذ التعديل المطلوب فقط (إصلاح الشاشة البيضاء)

# 4. فحص بعد التعديل
npm run agent:postflight

# 5. التأكد من:
#    - TypeScript PASS
#    - Build PASS
#    - doctor counts PASS
#    - لا توجد شاشة بيضاء
```

### ملاحظة مهمة

لا تبدأ Achievements أو Cinematics قبل إصلاح الشاشة البيضاء وتأكيد أن Build و TypeScript يعملان بشكل صحيح.

### آخر تحديث
2026-06-27 - إنشاء نظام Project Doctor