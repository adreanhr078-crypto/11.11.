# خطة إصلاح الأخطاء الأمنية والثغرات — 11.11

## السياق
تم فحص المشروع ووجدت 13 مشكلة: 3 حرجة (مصادقة API مفقودة، CORS مفتوح، عدم وجود Rate Limiting)، 3 متوسطة (حقن prompt، تحكم العميل في معاملات الذكاء الاصطناعي، نقطة نهاية مفقودة)، 1 خطأ TypeScript، و6 منخفضة.

## القرارات المُفصّلة مسبقاً
- **نطاق التعديل:** يقتصر على الملفات الموجودة داخل `artifacts/api-server/src/` و `artifacts/eleven-eleven/src/` فقط.
- **أولويات التنفيذ:** 1) إصلاح الثغرات الحرجة 2) إصلاح الأخطاء المتوسطة 3) إصلاح خطأ TypeScript 4) تحسينات منخفضة.
- **لا حذف ميزات:** جميع الميزات الموجودة ستبقى، فقط إصلاح وتأمين.
- **اللغة:** الواجهة تبقى عربي/إنجليزي مع RTL/LTR.

## المهام

### 🔴 حرج — إصلاح فوري

1. **إضافة مصادقة Firebase على API**
   - إنشاء middleware `authenticate.ts` يتحقق من Firebase ID token في `Authorization: Bearer <token>` header.
   - تطبيقMiddleware على جميع نقاط النهاية في `artifacts/api-server/src/routes/*` ما عدا `/healthz`.
   - استخدام `admin.auth().verifyIdToken()` للتحقق من صحة التوكن.

2. **تقييد CORS**
   - في `artifacts/api-server/src/app.ts`: استبدال `cors()` بإعدادات محددة تسمح بالنطاقات المسموحة فقط (مثلاً `https://eleven-eleven.app`, `http://localhost:3000`).
   - في `api/ai/chat.ts`, `wish-task.ts`, `psych-analysis.ts`: استبدال `Access-Control-Allow-Origin: *` بنفس النطاقات المسموحة.

3. **إضافة Rate Limiting**
   - تثبيت `express-rate-limit`.
   - تطبيق rate limit على `/api/ai/*` (مثلاً 20 طلب/دقيقة لكل UID).
   - تطبيق rate limit عام على باقي النقاط (مثلاً 100 طلب/دقيقة لكل IP).

### 🟠 مهم — إصلاح الأخطاء المتوسطة

4. **تحقق خادمي لمعاملات الذكاء الاصطناعي**
   - في `artifacts/api-server/src/routes/ai-chat.ts`: إزالة `trustAI` و `gameLevel` من `req.body`.
   - حساب `trustAI` و `gameLevel` من قاعدة البيانات بناءً على `uid` بدلاً من الاعتماد على العميل.

5. **Sanitize حقن Prompt**
   - في `artifacts/api-server/src/routes/ai-chat.ts`: إزالة أو sanitize `deviceContext` و `wishContext` قبل إدراجها في الـ system prompt.
   - تطبيق حد أقصى لطول النص (مثلاً 200 حرف) لمنع تجاوز حدود الـ prompt.

6. **إضافة نقطة نهاية `/api/arg/sync`**
   - في `artifacts/api-server/src/routes/arg.ts`: إضافة `POST /arg/sync` تستقبل `uid`, `solvedPuzzles`, `unlockedAchievements`, `gameState` وتقوم بمزامنتها مع قاعدة البيانات.
   - استخدام upsert مع union for arrays لمنع فقدان التقدم.

### 🟡 متوسط — إصلاح خطأ TypeScript

7. **إصلاح الواجهة المكررة**
   - في `artifacts/eleven-eleven/src/stores/gameStore.ts:418-431`: دمج الواجهتين في واحدة تحتوي على جميع الحقول (`id`, `name`, `description`, `requirements`, `unlockCondition`).

### 🟢 منخفض — تحسينات أمنية

8. **تحسين أمان بصمة المتصفح (fingerprint)**
   - في `artifacts/api-server/src/routes/user-profile.ts`: إضافة تحقق من تفرد البصمة (مقارنة مع مستخدمين آخرين) لمنع انتحال الهوية.

9. **نقل مفاتيح Firebase إلى متغيرات بيئة**
   - في `artifacts/eleven-eleven/lib/firebase/config.ts`: استبدال القيم الثابتة بـ `process.env.NEXT_PUBLIC_FIREBASE_*`.

10. **تسجيل دخول آمن في `authStore.ts`**
    - في `artifacts/eleven-eleven/stores/authStore.ts:176`: نقل استدعاء `initializeAuth()` إلى `useEffect` في `App.tsx` بدلاً من الاستدعاء الفوري عند الاستيراد.

## المخاطر
- إضافة مصادقة قد تتطلب تحديثات في جميع نقاط النهاية المستدعية من العميل.
- تقييد CORS قد يمنع الوصول من أجهزة معينة إذا لم تُضاف نطاقاتها.
- Rate Limiting قد يؤثر على المستخدمين النشطين إذا كانت الحدود منخفضة جداً.

## التحقق
- `tsc --noEmit` بدون أخطاء.
- `vite build` ناجح.
- اختبار نقاط النهاية بدون token يُرجع 401.
- اختبار CORS من نطاق غير مسموح يُرفض.
- اختبار Rate Limiting يُرجع 429 بعد تجاوز الحد.

## حالة
جاهز للتنفيذ. جميع القرارات مُحسومة.
