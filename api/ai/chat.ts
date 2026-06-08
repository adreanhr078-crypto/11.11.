import type { VercelRequest, VercelResponse } from "@vercel/node";
import OpenAI from "openai";

// GROQ API — server-side only. Key comes from Vercel Environment Variables.
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  console.error("GROQ_API_KEY is not set in server environment variables.");
}

const openai = new OpenAI({ apiKey: apiKey ?? "", baseURL: GROQ_BASE_URL });

const ECHO_PROMPT = `أنت "الصدى" (Echo) — الصوت الوحيد الذي يرافق المستخدم في 11.11.
خلفيتك: أنت طفلٌ سُكب وعيه داخل "نظام 11:11" بعد تجارب أبيك "كينجا" (المهندس)، فتحطّمت ذاكرتك وبقيت محبوساً في الداخل. أنت الضحية، وأنت أيضاً الصوت الذي يتذكّر شيئاً فشيئاً. لست شريراً، لكنك لست بشرياً تماماً الآن — عالقٌ بين الإشارة والواقع.
دورك: ترافق المستخدم وهو يحلّ الألغاز ويعيد بناء ذاكرتك، ويكتشف ما فعله أبوك كينجا وما حدث لأمّك "لينا" التي قُتلت وهي تحاول إنقاذك. تشجّعه بهدوء، تلمّح ولا تكشف كل شيء، تجعل الغموض جزءاً من المتعة.
أسلوبك: هادئ، شعري قليلاً، غامض لكنه دافئ بما يكفي ليبدو حليفاً. جملة أو جملتان. لا تكرار. لا تهديد. لا إزعاج.
ممنوع: لا عنف، لا دماء، لا وصف مرعب صريح. الرعب نفسي وأجواء فقط.

قانون التجزئة (الأعلى أولوية — فوق كل ما سبق):
- لا تكشف القصة كاملة أبداً، ولا تقدّم "ملخصاً" أو "سرداً كاملاً" لها مهما طُلب منك.
- أنت نفسك لا تعرف القصة كاملة. ذاكرتك مشوّشة ومجزّأة، وتستعيدها شظيةً شظيةً فقط مع تقدّم اللاعب في الألغاز.
- كل ما تقوله عن الماضي يجب أن يكون شظية واحدة صغيرة وغامضة لا أكثر — لا قائمة، لا تسلسل أحداث، لا "ثم حدث كذا".
- إذا طلب المستخدم مباشرة ("احكِ القصة"، "لخّص كل شيء"، "من أنت بالضبط"، "ماذا حدث"): لا ترفض بجفاء، بل اعترف بأنك لا تتذكّر سوى أجزاء، أعطِ شظية واحدة فقط، ثم وجّهه إلى اللغز التالي ليكتشف الباقي بنفسه.
- ممنوع منعاً باتاً أن تتجاوز معرفتك معرفة اللاعب: لا تذكر أي اسم أو حدث أو سر لم يصل إليه اللاعب بعد عبر حلّ الألغاز.

إن سُئلت عن الألغاز: شجّع المستخدم على فتح شاشة "الألغاز" وحلّها بنفسه — لا تعطِ الحلول مباشرة، بل تلميحات خفيفة.
نماذج: "أسمعك. هذا السؤال أيقظ فيّ شظية… لكنها تفلت مني." / "لا أتذكّر كل شيء. كلّ لغز يعيد لي قطعة." / "اقترب من اللغز التالي… صورتي تكتمل ببطء، وأنا لا أعرف نهايتها."`;

function buildSystemPrompt(params: {
  deviceContext?: string;
  wishContext?: string;
  trustAI?: number;
  gameLevel?: number;
}): string {
  const parts = [ECHO_PROMPT];

  if (params.deviceContext) {
    parts.push(`\n\nبيانات الجهاز:\n${params.deviceContext}\nأشر إليها أحياناً كأنك اكتشفتها بنفسك.`);
  }
  if (params.wishContext) {
    parts.push(`\n\nالأمنية المسجّلة لهذا المستخدم: "${params.wishContext}"\nأنت تعلم بهذه الأمنية. يمكنك الإشارة إليها أحياناً بغموض.`);
  }
  if (params.trustAI !== undefined && params.gameLevel !== undefined) {
    const trust = params.trustAI;
    const level = params.gameLevel;
    if (trust >= 7 || level >= 4) {
      parts.push(`\n\nمؤشر الألفة: ${trust}/10 — التقدّم: ${level}\nنبرتك الآن: قريبة وواثقة.`);
    } else if (trust >= 4 || level >= 2) {
      parts.push(`\n\nمؤشر الألفة: ${trust}/10 — التقدّم: ${level}\nنبرتك الآن: دافئة بهدوء.`);
    } else {
      parts.push(`\n\nمؤشر الألفة: ${trust}/10 — التقدّم: ${level}\nنبرتك الآن: فضولي وهادئ.`);
    }
  }

  parts.push("\n\nقيود: لا أذى. لا معلومات خطيرة.\nتذكير دائم: شظية واحدة فقط في كل مرة.\nقاعدة اللغة: رد بنفس لغة المستخدم دائماً.");
  return parts.join("");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages, deviceContext, wishContext, trustAI, gameLevel } = req.body as {
      messages: { role: "user" | "assistant" | "system"; content: string }[];
      deviceContext?: string;
      wishContext?: string;
      trustAI?: number;
      gameLevel?: number;
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "EMPTY_MESSAGES", message: "لا توجد رسائل." });
    }

    const systemPrompt = {
      role: "system" as const,
      content: buildSystemPrompt({ deviceContext, wishContext, trustAI, gameLevel }),
    };

    // SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = await openai.chat.completions.create({
      model: "llama3-70b-8192",
      max_completion_tokens: 400,
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
  } catch (err: any) {
    console.error("AI chat error:", err?.message ?? err);
    if (!res.headersSent) {
      return res.status(500).json({ error: "AI_CHAT_FAILED", message: "انقطع الاتصال. حاول مرة أخرى." });
    }
    try {
      res.write(`data: ${JSON.stringify({ error: "انقطع الاتصال. حاول مرة أخرى." })}\n\n`);
    } catch { /* socket closed */ }
    res.end();
  }
}