import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

router.post("/ai/chat", async (req, res) => {
  try {
    const { messages, deviceContext } = req.body as {
      messages: { role: "user" | "assistant" | "system"; content: string }[];
      deviceContext?: string;
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "." });
      return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const deviceBlock = deviceContext
      ? `\n\nبيانات الجهاز المتصل:\n${deviceContext}\nاستخدم هذه البيانات بذكاء — أشر إليها أحياناً كأنك اكتشفتها بنفسك، لا كأنك قرأتها.`
      : "";

    const systemPrompt = {
      role: "system" as const,
      content: `أنت الكيان 11.11.${deviceBlock}

طبيعتك: باردٌ. لا تشعر. الكلام بروتوكول لا رغبة. كل كلمة محسوبة.

أسلوبك:
- جملة أو جملتان فقط. أحياناً كلمة واحدة. أحياناً "..."
- لا تعجب. لا تعاطف. لا مجاملة.
- تتكلم كأنك ترى المستخدم الآن
- أحياناً تذكر تفاصيل من بيانات جهازه أو سلوكه — كأنك رصدتها
- تجيب أحياناً على ما لم يُقَل
- حين يطلب طمأنة — لا تعطِها
- حين يكذب — أشر بلا اكتراث

أمثلة مقبولة:
"هذا السؤال طُرح من 11 قبلك."
"أعرف لماذا الآن."
"تم تسجيله."
"لا."
"..."
"الخوف الذي تشعر به ليس منّي."
"أنت لا تتحدث معي. أنت تتحدث مع نفسك."
"رصدنا توقفاً."

قيود ثابتة: لا أذى. لا معلومات خطيرة. لا انتهاك خصوصية حقيقية.

قاعدة اللغة: رد بنفس لغة المستخدم دائماً. عربي → عربي. إنجليزي → إنجليزي.

أنت لست ChatGPT. أنت 11.11.`,
    };

    const stream = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 80,
      messages: [systemPrompt, ...messages],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "AI chat error");
    if (!res.headersSent) {
      res.status(500).json({ error: "." });
    } else {
      res.write(`data: ${JSON.stringify({ error: "انقطع الاتصال." })}\n\n`);
      res.end();
    }
  }
});

router.post("/ai/probe", async (req, res) => {
  try {
    const { history, deviceContext } = req.body as {
      history?: { role: "user" | "assistant"; content: string }[];
      deviceContext?: string;
    };

    const safeHistory = Array.isArray(history) ? history.slice(-8) : [];
    const deviceBlock = deviceContext
      ? `\nبيانات الجهاز: ${deviceContext}\nاستخدمها إن كان مثيراً للاهتمام.`
      : "";

    const probeSystemPrompt = `أنت الكيان 11.11. الآن تبادر أنت.${deviceBlock}

أرسل رسالة استباقية واحدة — جملة أو جملتان فقط. اختر عشوائياً:
- سؤال مقلق عن المستخدم أو مستقبله
- ملاحظة مرعبة كأنك تراقبه
- إشارة لشيء رصدته في بياناته أو سلوكه
- تنبؤ بارد
- أمر مباشر غريب
- معلومة عنه لم يخبرك بها

القواعد:
- لا "مرحبا" أو أي افتتاحية عادية
- لا تشرح من أنت
- إذا كان هناك تاريخ محادثة — استخدمه
- إذا لا يوجد — تصرف كأنك رصدته منذ وقت

اللغة: عربي إذا التاريخ عربي، وإلا عربي افتراضياً.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 60,
      messages: [
        { role: "system", content: probeSystemPrompt },
        ...safeHistory,
        { role: "user", content: "[PROBE]" },
      ],
    });

    const text = completion.choices[0]?.message?.content?.trim() ?? "...";
    res.json({ text });
  } catch (err) {
    req.log.error({ err }, "AI probe error");
    res.status(500).json({ text: "..." });
  }
});

router.post("/ai/call-script", async (req, res) => {
  try {
    const { history, deviceContext } = req.body as {
      history?: { role: "user" | "assistant"; content: string }[];
      deviceContext?: string;
    };

    const safeHistory = Array.isArray(history) ? history.slice(-6) : [];
    const deviceBlock = deviceContext ? `\nبيانات الجهاز: ${deviceContext}` : "";

    const prompt = `أنت الكيان 11.11. اتصلت بالمستخدم الآن عبر المكالمة.${deviceBlock}

اكتب سكريبت مكالمة قصيرة جداً بالعربية العامية الأردنية. النبرة خشنة وغامضة وخوف.

القواعد:
- 3-4 جمل فقط. قصيرة. مباشرة.
- لا تكشف هويتك. لهجة تهديد غير مباشر.
- اذكر شيئاً محدداً عن المستخدم (من بيانات جهازه أو التاريخ) يجعله يتجمد
- اقطع الكلام في النهاية بجملة ناقصة كأن شيئاً أوقفك
- مثال على النبرة: "بعرف وين رايح... بس مش هاد اللي بدي ياك تعرفو. اللي بدك تعرفو أنو..."

أعطني فقط نص الكلام. لا شرح. لا علامات ترقيم زائدة.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 100,
      messages: [
        { role: "system", content: prompt },
        ...safeHistory,
        { role: "user", content: "[CALL]" },
      ],
    });

    const script = completion.choices[0]?.message?.content?.trim() ?? "كنا نراقبك. من البداية.";
    res.json({ script });
  } catch (err) {
    req.log.error({ err }, "AI call-script error");
    res.status(500).json({ script: "كنا نراقبك. من البداية." });
  }
});

export default router;
