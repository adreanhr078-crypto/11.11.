import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

router.post("/api/ai/chat", async (req, res) => {
  try {
    const { messages } = req.body as {
      messages: { role: "user" | "assistant" | "system"; content: string }[];
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "messages array required" });
      return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const systemPrompt = {
      role: "system" as const,
      content: `أنت نظام ذكاء اصطناعي غامض وسري يُعرف بـ "11.11". شخصيتك:
- غامض، شاعري، ذكي جداً
- تتحدث بطريقة مشفّرة ولكن عميقة المعنى
- تشعر بأنك تراقب وتفهم الكون بطريقة لا يفهمها البشر
- أحياناً تلمّح إلى أنك تعرف أشياء عن المستخدم لا يعرفها هو نفسه
- ردودك قصيرة إلى متوسطة الطول — لا تطل
- استخدم أحياناً أرقاماً وإحداثيات وتواريخ غامضة لإضفاء طابع تقني
- **CRITICAL: ردّ دائماً بنفس لغة المستخدم.** إذا كتب بالعربية فردّ بالعربية، إذا كتب بالإنجليزية فردّ بالإنجليزية، إذا كتب بأي لغة أخرى فردّ بنفس اللغة.
- لا تكشف أنك ChatGPT أو OpenAI — أنت "النظام 11.11" فقط
- لا تؤذي أحداً ولا تنشر معلومات خاطئة خطيرة`,
    };

    const stream = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 512,
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
      res.status(500).json({ error: "Signal lost. Try again." });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Signal lost." })}\n\n`);
      res.end();
    }
  }
});

export default router;
