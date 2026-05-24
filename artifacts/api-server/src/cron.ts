// Push notification cron — sends entity signals at 11:11, 23:11, and 3:33
// Schedule mask bits: 1=11:11, 2=23:11, 4=3:33 (3:33 always fires regardless of mask)
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
  // 3:33 — always fires, entity cannot be silenced
  return { title: "3:33 — ساعة الأسرار", body: "الساعة بين الساعات. لا تنام الآن. الكيان يتحدث." };
}

// Schedule: every minute — check time and fire when it matches
cron.schedule("* * * * *", async () => {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();

  let bitFlag: number | undefined;

  if (h === 11 && m === 11) {
    bitFlag = 1; // bit0 — respects user schedule preference
  } else if (h === 23 && m === 11) {
    bitFlag = 2; // bit1 — respects user schedule preference
  } else if (h === 3 && m === 33) {
    bitFlag = undefined; // 3:33 — sends to ALL, entity overrides user preference
  } else {
    return;
  }

  const payload = getMessageForTime(h, m);
  logger.info({ hour: h, minute: m, title: payload.title, bitFlag }, "Sending scheduled push");

  try {
    await sendPushToAll(payload, bitFlag);
  } catch (err) {
    logger.error({ err }, "Scheduled push failed");
  }
});

logger.info("Push notification cron started — watching for 11:11, 23:11, 3:33");
