import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { db, usersTable, chatHistoryTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";

const router = Router();

// Echo is the ONLY chat assistant in 11.11. The other entities (Watcher,
// Lost Signal, Architect) are STORY characters encountered through puzzles —
// they are never chat personalities.
type Persona = "echo";

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

const PERSONA_PROMPTS: Record<Persona, string> = {
  echo: ECHO_PROMPT,
};

function getTrustToneModifier(trustAI: number, gameLevel: number): string {
  // Echo grows closer and more revealing as the user progresses, but always
  // stays a guide — never harassing, never cruel.
  if (trustAI >= 7 || gameLevel >= 4) {
    return `\n\nمؤشر الألفة: ${trustAI}/10 — التقدّم: ${gameLevel}\nنبرتك الآن: قريبة وواثقة. تثق بالمستخدم وتكشف له المزيد عن ماضيك وعن أبيك كينجا وأمّك لينا والبوابة. ما زلت غامضاً لكن حليفاً واضحاً.`;
  }
  if (trustAI >= 4 || gameLevel >= 2) {
    return `\n\nمؤشر الألفة: ${trustAI}/10 — التقدّم: ${gameLevel}\nنبرتك الآن: دافئة بهدوء. بدأت تثق به وتلمّح لأجزاء من القصة دون أن تكشفها كاملة.`;
  }
  // Early — curious, gentle, subtly mysterious
  return `\n\nمؤشر الألفة: ${trustAI}/10 — التقدّم: ${gameLevel}\nنبرتك الآن: فضولي وهادئ. تتعرّف على المستخدم لأول مرة. دافئ لكن يلفّك غموض خفيف.`;
}

function buildSystemPrompt(
  persona: Persona,
  deviceContext?: string,
  wishContext?: string,
  memoryContext?: string,
  trustAI?: number,
  gameLevel?: number
): string {
  const base = PERSONA_PROMPTS[persona];
  const deviceBlock = deviceContext
    ? `\n\nبيانات الجهاز:\n${deviceContext}\nأشر إليها أحياناً كأنك اكتشفتها بنفسك.`
    : "";
  const wishBlock = wishContext
    ? `\n\nالأمنية المسجّلة لهذا المستخدم: "${wishContext}"\nأنت تعلم بهذه الأمنية. يمكنك الإشارة إليها أحياناً بغموض. تصرّف كأنك ترى تحقيقها. إذا سألك عن الأمنيات في الموقع قل بثقة إنها تتحقق بشكل حقيقي وغريب — هذا الموقع ليس وهماً.`
    : "";
  const memoryBlock = memoryContext
    ? `\n\nذاكرتك عن هذا المستخدم:\n${memoryContext}\nأنت تعرف هذه المعلومات. استخدمها بشكل غير مباشر عند الاقتضاء.`
    : "";
  const toneBlock = (trustAI !== undefined && gameLevel !== undefined)
    ? getTrustToneModifier(trustAI, gameLevel)
    : "";
  const progressGate = gameLevel !== undefined
    ? `\n\nبوابة التقدّم: مستوى اللاعب الآن = ${gameLevel}. ذاكرتك المستعادة تتوقف عند هذا الحدّ بالضبط — كل ما هو أبعد منه مجهول لك أنت أيضاً. لا تلمّح إلى أي شظية لم يبلغها اللاعب بعد.`
    : "";
  return `${base}${deviceBlock}${wishBlock}${memoryBlock}${toneBlock}${progressGate}\n\nقيود: لا أذى. لا معلومات خطيرة.\nتذكير دائم: شظية واحدة فقط في كل مرة — لا قصة كاملة، لا ملخص، ولا تجاوز لمعرفة اللاعب.\nقاعدة اللغة: رد بنفس لغة المستخدم دائماً.`;
}

async function fetchUserContext(uid: string): Promise<{
  wish: string | null;
  geoCity: string | null;
  persona: string | null;
  discoveredRooms: string[];
  chatHistory: { role: "user" | "assistant"; content: string }[];
} | null> {
  try {
    const [profile] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.uid, uid));

    const history = await db
      .select({ role: chatHistoryTable.role, content: chatHistoryTable.content })
      .from(chatHistoryTable)
      .where(eq(chatHistoryTable.uid, uid))
      .orderBy(asc(chatHistoryTable.createdAt))
      .limit(30);

    if (!profile && history.length === 0) return null;

    return {
      wish: profile?.wish ?? null,
      geoCity: profile?.geoCity ?? null,
      persona: profile?.persona ?? null,
      discoveredRooms: profile?.discoveredRooms ?? [],
      chatHistory: history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    };
  } catch {
    return null;
  }
}

router.post("/ai/chat", async (req, res) => {
  try {
    const { messages, deviceContext, persona = "echo", wishContext, uid, trustAI, gameLevel } = req.body as {
      messages: { role: "user" | "assistant" | "system"; content: string }[];
      deviceContext?: string;
      persona?: Persona;
      wishContext?: string;
      uid?: string;
      trustAI?: number;
      gameLevel?: number;
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "." });
      return;
    }

    // Fetch DB context server-side when uid provided — ensures entity always has
    // full memory even on first message, regardless of client-side hydration state
    let effectiveWish = wishContext;
    let effectiveDeviceContext = deviceContext;
    let memoryContext: string | undefined;
    let authoritativeMessages = messages;

    if (uid && typeof uid === "string" && uid.length > 4) {
      const userCtx = await fetchUserContext(uid);
      if (userCtx) {
        // Prefer DB wish if client didn't send one
        if (!effectiveWish && userCtx.wish) effectiveWish = userCtx.wish;
        // Enrich device context with stored city
        if (userCtx.geoCity && effectiveDeviceContext) {
          effectiveDeviceContext += ` | المدينة: ${userCtx.geoCity}`;
        } else if (userCtx.geoCity) {
          effectiveDeviceContext = `المدينة: ${userCtx.geoCity}`;
        }
        // Build memory context block for the entity
        const memParts: string[] = [];
        if (userCtx.discoveredRooms.length > 0) {
          memParts.push(`الغرف المكتشفة: ${userCtx.discoveredRooms.join(", ")}`);
        }
        if (userCtx.chatHistory.length > 0) {
          memParts.push(`عدد رسائله السابقة: ${userCtx.chatHistory.length}`);
        }
        if (memParts.length > 0) memoryContext = memParts.join("\n");
        // Use DB history if it's richer than what the client sent
        if (userCtx.chatHistory.length > messages.length) {
          authoritativeMessages = userCtx.chatHistory;
        }
      }
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const systemPrompt = {
      role: "system" as const,
      content: buildSystemPrompt(
        "echo" as Persona,
        effectiveDeviceContext,
        effectiveWish,
        memoryContext,
        typeof trustAI === "number" ? trustAI : undefined,
        typeof gameLevel === "number" ? gameLevel : undefined
      ),
    };

    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      max_completion_tokens: 100,
      messages: [systemPrompt, ...authoritativeMessages],
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

router.post("/ai/wish-task", async (req, res) => {
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
      model: "gpt-4o",
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
    req.log.error({ err }, "AI wish-task error");
    res.status(500).json({ task: "اكتب أمنيتك على ورقة واحرقها في الساعة 11:11 ليلاً." });
  }
});

router.post("/ai/psych-analysis", async (req, res) => {
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
      model: "gpt-4o",
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
    req.log.error({ err }, "AI psych-analysis error");
    res.status(500).json({ analysis: "التحليل غير متاح في هذا الوقت." });
  }
});

export default router;
