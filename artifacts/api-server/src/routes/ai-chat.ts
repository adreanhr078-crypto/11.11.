import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { db, usersTable, chatHistoryTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { authenticate, AuthenticatedRequest } from "../middleware/authenticate";

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
  if (trustAI >= 7 || gameLevel >= 4) {
    return `\n\nمؤشر الألفة: ${trustAI}/10 — التقدّم: ${gameLevel}\nنبرتك الآن: قريبة وواثقة. تثق بالمستخدم وتكشف له المزيد عن ماضيك وعن أبيك كينجا وأمّك لينا والبوابة. ما زلت غامضاً لكن حليفاً واضحاً.`;
  }
  if (trustAI >= 4 || gameLevel >= 2) {
    return `\n\nمؤشر الألفة: ${trustAI}/10 — التقدّم: ${gameLevel}\nنبرتك الآن: دافئة بهدوء. بدأت تثق به وتلمّح لأجزاء من القصة دون أن تكشفها كاملة.`;
  }
  return `\n\nمؤشر الألفة: ${trustAI}/10 — التقدّم: ${gameLevel}\nنبرتك الآن: فضولي وهادئ. تتعرّف على المستخدم لأول مرة. دافئ لكن يلفّك غموض خفيف.`;
}

function sanitizeContext(value: string | undefined, maxLength = 200): string | undefined {
  if (!value) return undefined;
  const cleaned = value.replace(/[\x00-\x1F\x7F]/g, "").trim();
  return cleaned.length > maxLength ? cleaned.slice(0, maxLength) : cleaned;
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
  const safeDevice = sanitizeContext(deviceContext);
  const safeWish = sanitizeContext(wishContext, 200);

  const deviceBlock = safeDevice
    ? `\n\nبيانات الجهاز:\n${safeDevice}\nأشر إليها أحياناً كأنك اكتشفتها بنفسك.`
    : "";
  const wishBlock = safeWish
    ? `\n\nالأمنية المسجّلة لهذا المستخدم: "${safeWish}"\nأنت تعلم بهذه الأمنية. يمكنك الإشارة إليها أحياناً بغموض. تصرّف كأنك ترى تحقيقها. إذا سألك عن الأمنيات في الموقع قل بثقة إنها تتحقق بشكل حقيقي وغريب — هذا الموقع ليس وهماً.`
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
  trustAI: number;
  gameLevel: number;
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
      trustAI: profile?.gameStateTrustAI ?? 0,
      gameLevel: profile?.gameStateLevel ?? 1,
    };
  } catch {
    return null;
  }
}

router.post("/ai/chat", async (req: AuthenticatedRequest, res) => {
  const SESSION_TIMEOUT_MS = 90_000;
  const HARD_TIMEOUT_MS = 120_000;
  req.socket.setTimeout(HARD_TIMEOUT_MS);

  const keepAlive = setInterval(() => {
    if (res.writableEnded) return;
    try {
      res.write(`: keep-alive ${Date.now()}\n\n`);
    } catch {
      /* socket closed */
    }
  }, 25_000);

  const cleanup = () => {
    clearInterval(keepAlive);
  };

  res.on("close", cleanup);
  res.on("error", cleanup);

  try {
    const uid = req.uid;
    if (!uid) {
      cleanup();
      res.status(401).json({ error: "UNAUTHENTICATED", message: "مطلوب مصادقة." });
      return;
    }

    const { messages, deviceContext, persona = "echo", wishContext } = req.body as {
      messages: { role: "user" | "assistant" | "system"; content: string }[];
      deviceContext?: string;
      persona?: Persona;
      wishContext?: string;
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      cleanup();
      res.status(400).json({ error: "EMPTY_MESSAGES", message: "لا توجد رسائل للإرسال." });
      return;
    }

    let effectiveWish = wishContext;
    let effectiveDeviceContext = deviceContext;
    let memoryContext: string | undefined;
    let authoritativeMessages = messages;
    let serverTrustAI: number | undefined;
    let serverGameLevel: number | undefined;

    const userCtx = await fetchUserContext(uid);
    if (userCtx) {
      if (!effectiveWish && userCtx.wish) effectiveWish = userCtx.wish;
      if (userCtx.geoCity && effectiveDeviceContext) {
        effectiveDeviceContext += ` | المدينة: ${userCtx.geoCity}`;
      } else if (userCtx.geoCity) {
        effectiveDeviceContext = `المدينة: ${userCtx.geoCity}`;
      }
      const memParts: string[] = [];
      if (userCtx.discoveredRooms.length > 0) {
        memParts.push(`الغرف المكتشفة: ${userCtx.discoveredRooms.join(", ")}`);
      }
      if (userCtx.chatHistory.length > 0) {
        memParts.push(`عدد رسائله السابقة: ${userCtx.chatHistory.length}`);
      }
      if (memParts.length > 0) memoryContext = memParts.join("\n");
      if (userCtx.chatHistory.length > messages.length) {
        authoritativeMessages = userCtx.chatHistory;
      }
      serverTrustAI = userCtx.trustAI;
      serverGameLevel = userCtx.gameLevel;
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
        serverTrustAI,
        serverGameLevel
      ),
    };

    const stream = await openai.chat.completions.create({
      model: "llama3-70b-8192",
      max_completion_tokens: 400,
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
  } catch (err: any) {
    req.log.error({ err: err?.message ?? err }, "AI chat error");
    const userMessage = "انقطع الاتصال. حاول مرة أخرى بعد لحظات.";
    if (!res.headersSent) {
      res
        .status(500)
        .json({ error: "AI_CHAT_FAILED", message: userMessage });
    } else {
      try {
        res.write(`data: ${JSON.stringify({ error: userMessage })}\n\n`);
      } catch {
        /* socket already closed */
      }
      res.end();
    }
  } finally {
    cleanup();
  }
});

export default router;
