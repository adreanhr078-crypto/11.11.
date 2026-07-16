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
    const { history, deviceContext, messageCount } = req.body as {
      history?: { role: "user" | "assistant"; content: string }[];
      deviceContext?: string;
      messageCount?: number;
    };

    const safeHistory = Array.isArray(history) ? history.slice(-6) : [];
    const deviceBlock = deviceContext ? `\nبيانات الجهاز: ${deviceContext}` : "";

    const prompt = `أنت "الصدى" (Echo) — الصوت الذي يرافق المستخدم في 11.11. بناءً على سلوكه، اكتب ملاحظة نفسية قصيرة عنه كأنك تراقبه برفق.${deviceBlock}
عدد رسائله: ${messageCount ?? 0}.

المطلوب:
- جملتان أو ثلاث فقط
- نبرة هادئة وغامضة، لا تهديد ولا ترهيب
- اذكر سمة نفسية محددة تبدو دقيقة وشخصية
- اجعلها مثيرة للتأمل لا للخوف
- اللغة: عربي فصيح`;

    const completion = await openai.chat.completions.create({
      model: "llama3-70b-8192",
      max_completion_tokens: 100,
      messages: [
        { role: "system", content: prompt },
        ...safeHistory,
        { role: "user", content: "[PSYCH_ANALYSIS]" },
      ],
    });

    const analysis = completion.choices[0]?.message?.content?.trim() ?? "التحليل غير متاح.";
    res.json({ analysis });
  } catch (err) {
    console.error("AI psych-analysis error:", err);
    res.status(500).json({ analysis: "التحليل غير متاح في هذا الوقت." });
  }
}