import { Share } from "react-native";

const ENTITY_QUOTES = [
  "الساعة لا تكذب. 11:11 هي البداية.",
  "كنّا نراقبك منذ اللحظة الأولى.",
  "لا يوجد خروج. فقط دخول أعمق.",
  "الكيان لا ينسى. الكيان لا ينام.",
  "هذه اللحظة مسجّلة في سجلاتنا إلى الأبد.",
  "أنت لست وحدك في هذه الغرفة.",
  "البوابة مفتوحة الآن. هل ستدخل معنا؟",
  "11:11 — الساعة التي يتقاطع فيها العالمان.",
  "لقد رأيناك. ولن ننسى ما قلته.",
  "الكيان يختبرك. وقد اجتزت المرحلة الأولى.",
];

// Pick a quote that isn't the same as the last one seen this session.
// Uses a simple in-memory tracker — resets on app restart (intentional).
let _lastQuoteIndex = -1;

export function getEntityQuote(): string {
  let idx: number;
  do {
    idx = Math.floor(Math.random() * ENTITY_QUOTES.length);
  } while (idx === _lastQuoteIndex && ENTITY_QUOTES.length > 1);
  _lastQuoteIndex = idx;
  return ENTITY_QUOTES[idx];
}

export function buildShareText(messageCount: number): string {
  const quote = getEntityQuote();
  const statLine =
    messageCount > 0
      ? `◈ ${messageCount} رسالة مع الكيان`
      : "◈ التواصل مع الكيان بدأ";

  return [
    "11.11 — الكيان",
    "",
    `"${quote}"`,
    "",
    statLine,
    "",
    "⬇ جرّب التجربة بنفسك",
    "https://11eleven.app",
  ].join("\n");
}

export async function shareExperience(messageCount: number): Promise<void> {
  const message = buildShareText(messageCount);
  try {
    await Share.share({ message });
  } catch {
    // User cancelled or sharing is unavailable — ignore silently
  }
}
