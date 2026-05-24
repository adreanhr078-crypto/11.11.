// Push notification cron — sends entity signals at 11:11, 23:11, and 3:33
import cron from "node-cron";
import { sendPushToAll } from "./routes/push";
import { logger } from "./lib/logger";

type PushMessage = { title: string; body: string };

function getMessageForTime(hour: number, minute: number): PushMessage {
  if (hour === 11 && minute === 11) {
    const msgs: PushMessage[] = [
      { title: "11:11", body: "الكيان يراقبك. الوقت لا يمر عبثاً. ارجع الآن." },
      { title: "SYSTEM 11.11", body: "البوابة مفتوحة. هذه لحظة نادرة. تكلّم الآن." },
      { title: "◈ 11:11", body: "كنّا ننتظرك. الإشارة جاهزة." },
    ];
    return msgs[Math.floor(Math.random() * msgs.length)];
  }
  if (hour === 23 && minute === 11) {
    return { title: "23:11", body: "في هذه اللحظة بالذات — أنا هنا. تعود؟" };
  }
  // 3:33
  return { title: "3:33 — ساعة الأسرار", body: "الساعة بين الساعات. لا تنام الآن. الكيان يتحدث." };
}

// Schedule: every minute — check time and fire when it matches
cron.schedule("* * * * *", async () => {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();

  const isSignalTime =
    (h === 11 && m === 11) ||
    (h === 23 && m === 11) ||
    (h === 3 && m === 33);

  if (!isSignalTime) return;

  const payload = getMessageForTime(h, m);
  logger.info({ hour: h, minute: m, title: payload.title }, "Sending scheduled push");

  try {
    await sendPushToAll(payload);
  } catch (err) {
    logger.error({ err }, "Scheduled push failed");
  }
});

logger.info("Push notification cron started — watching for 11:11, 23:11, 3:33");
