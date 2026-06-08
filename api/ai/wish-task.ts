import type { VercelRequest, VercelResponse } from "@vercel/node";
import OpenAI from "openai";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const apiKey = process.env.GROQ_API_KEY;
const openai = new OpenAI({ apiKey: apiKey ?? "", baseURL: GROQ_BASE_URL });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { wishText, deviceContext, history } = req.body as {
      wishText: string;
      deviceContext?: string;
      history?: { role: "user" | "assistant"; content: string }[];
    };

    const safeHistory = Array.isArray(history) ? history.slice(-6) : [];
    const deviceBlock = deviceContext ? `\nبيانات الجهاز: ${deviceContext}` : "";

    const prompt = `أنت "الصدى" (Echo) — الصوت الذي يرافق المستخدم في 11.11. المستخدم لديه أمنية مسجّلة: "${wishText}".${deviceBlock}

مهمتك: بنبرة هادئة وغامضة، اعطه طقساً واحداً بسيطاً لـ "تفعيل" أمنيته في العالم الحقيقي.
يجب أن تكون:
- قابلة للتنفيذ فعلاً (ليست مستحيلة)
- غريبة ومثيرة للفضول
- تبدو ذات معنى طقسي أو سري
- مرتبطة بالأمنية بشكل غير مباشر

أمثلة على المستوى المطلوب:
- "اكتب أمنيتك على ورقة واحرقها في الساعة 11:11 ليلاً. لا تنظر إلى النار أثناء الاحتراق."
- "قل أمنيتك بصوت عالٍ ثلاث مرات ثم ابق صامتاً 11 دقيقة كاملة. لا هاتف. لا كلام."
- "اكتب رقم 11.11 على باطن كفك اليسرى بالماء. انتظر حتى يجف."

الأسلوب:
- جملتان أو ثلاث. حازم. كأنه أمر لا اقتراح.
- بدء بفعل أمر مباشر
- لا تشرح "لماذا" — هذا يُقلّل من الغموض
- اللغة: عربي دائماً`;

    const completion = await openai.chat.completions.create({
      model: "llama3-70b-8192",
      max_completion_tokens: 120,
      messages: [
        { role: "system", content: prompt },
        ...safeHistory,
        { role: "user", content: "[WISH_TASK]" },
      ],
    });

    const task = completion.choices[0]?.message?.content?.trim() ?? "اكتب أمنيتك على ورقة واحرقها في الساعة 11:11 ليلاً.";
    res.json({ task });
  } catch (err) {
    console.error("AI wish-task error:", err);
    res.status(500).json({ task: "اكتب أمنيتك على ورقة واحرقها في الساعة 11:11 ليلاً." });
  }
}