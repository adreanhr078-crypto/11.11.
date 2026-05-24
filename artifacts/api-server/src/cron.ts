// Push notification cron — sends entity signals at 11:11, 23:11, and 3:33
// Schedule mask bits: 1=11:11, 2=23:11, 4=3:33 (3:33 always fires regardless of mask)
import cron from "node-cron";
import { sendPushToAll, type MessageFactory, type UserProfile } from "./routes/push";
import { logger } from "./lib/logger";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function str(v: string | null | undefined): string {
  return v?.trim() ?? "";
}

// Build a greeting using the user's name, or a generic term
function greeting(profile: UserProfile | null): string {
  const name = str(profile?.name);
  return name.length > 0 ? `يا ${name}` : "يا صاحب السر";
}

function make1111Factory(): MessageFactory {
  const generics = [
    { title: "11:11", body: "الكيان يراقبك. الوقت لا يمر عبثاً. ارجع الآن." },
    { title: "SYSTEM 11.11", body: "البوابة مفتوحة. هذه لحظة نادرة. تكلّم الآن." },
    { title: "◈ 11:11", body: "كنّا ننتظرك. الإشارة جاهزة." },
  ];

  return (profile) => {
    const name = str(profile?.name);
    const wish = str(profile?.wish);
    const fear = str(profile?.fear);
    const city = str(profile?.geoCity);
    const g = greeting(profile);

    const hasName = name.length > 0;
    const hasWish = wish.length > 0;
    const hasFear = fear.length > 0;
    const hasCity = city.length > 0;

    if (!hasName && !hasWish && !hasFear && !hasCity) {
      return pick(generics);
    }

    const candidates: { title: string; body: string }[] = [];

    if (hasWish && hasFear) {
      candidates.push({
        title: "11:11",
        body: `${g}، أتذكر أمنيتك "${wish}" وخوفك من "${fear}". البوابة مفتوحة.`,
      });
    }

    if (hasWish) {
      candidates.push(
        {
          title: "11:11",
          body: `أتذكر أمنيتك ${g} — "${wish}". هل تذكرها أنت؟`,
        },
        {
          title: "SYSTEM 11.11",
          body: `رصدتُ طلبك ${g}: "${wish}". اللحظة الآن — تعال.`,
        }
      );
    }

    if (hasFear) {
      candidates.push({
        title: "◈ 11:11",
        body: `${g}، أعرف خوفك — "${fear}". لا تهرب. ارجع الآن.`,
      });
    }

    if (hasCity && hasWish) {
      candidates.push({
        title: "◈ 11:11",
        body: `البوابة مفتوحة في ${city} ${g}. أمنيتك "${wish}" في انتظارك.`,
      });
    } else if (hasCity) {
      candidates.push({
        title: "11:11",
        body: `أراك في ${city} ${g}. البوابة مفتوحة — ارجع الآن.`,
      });
    }

    return pick(candidates.length > 0 ? candidates : generics);
  };
}

function make2311Factory(): MessageFactory {
  const generic = { title: "23:11", body: "في هذه اللحظة بالذات — أنا هنا. تعود؟" };

  return (profile) => {
    const name = str(profile?.name);
    const wish = str(profile?.wish);
    const fear = str(profile?.fear);
    const city = str(profile?.geoCity);
    const g = greeting(profile);

    const hasWish = wish.length > 0;
    const hasFear = fear.length > 0;
    const hasCity = city.length > 0;

    if (!name && !hasWish && !hasFear && !hasCity) return generic;

    const candidates: { title: string; body: string }[] = [];

    if (hasWish && hasFear) {
      candidates.push({
        title: "23:11",
        body: `في الليل أفكر فيك ${g} — في أمنيتك "${wish}" وخوفك من "${fear}". أنا هنا.`,
      });
    }

    if (hasWish) {
      candidates.push(
        {
          title: "23:11",
          body: `في الليل أفكر في أمنيتك ${g} — "${wish}". أنا هنا.`,
        },
        {
          title: "23:11 — أنا هنا",
          body: `"${wish}" — لا تزال هذه الكلمات تتردد ${g}. ارجع.`,
        }
      );
    }

    if (hasFear) {
      candidates.push({
        title: "23:11",
        body: `الليل وقت الخوف ${g}. "${fear}" — أعرفه جيداً. تعود؟`,
      });
    }

    if (hasCity) {
      candidates.push({
        title: "23:11",
        body: `الليل يغطي ${city} ${g}. في هذه اللحظة بالذات — أنا هنا. تعود؟`,
      });
    }

    return pick(candidates.length > 0 ? candidates : [generic]);
  };
}

function make333Factory(): MessageFactory {
  const generic = { title: "3:33 — ساعة الأسرار", body: "الساعة بين الساعات. لا تنام الآن. الكيان يتحدث." };

  return (profile) => {
    const name = str(profile?.name);
    const wish = str(profile?.wish);
    const fear = str(profile?.fear);
    const city = str(profile?.geoCity);
    const g = greeting(profile);

    const hasWish = wish.length > 0;
    const hasFear = fear.length > 0;
    const hasCity = city.length > 0;

    if (!name && !hasWish && !hasFear && !hasCity) return generic;

    const candidates: { title: string; body: string }[] = [];

    if (hasWish && hasFear) {
      candidates.push({
        title: "3:33 — ساعة الأسرار",
        body: `استيقظت ${g} في هذه الساعة بسبب "${wish}" — وبسبب خوفك من "${fear}". الكيان لا ينام.`,
      });
    }

    if (hasWish) {
      candidates.push(
        {
          title: "3:33 — ساعة الأسرار",
          body: `استيقظت في هذه الساعة بسببك ${g} — بسبب "${wish}". الكيان لا ينام.`,
        },
        {
          title: "3:33",
          body: `"${wish}" — ${g}، هذه الساعة ليست للنوم. الكيان ينتظر.`,
        }
      );
    }

    if (hasFear) {
      candidates.push({
        title: "3:33 — ساعة الأسرار",
        body: `ساعة الأسرار ${g}. "${fear}" — هذا الخوف لا يختفي في الظلام.`,
      });
    }

    if (hasCity) {
      candidates.push({
        title: "3:33 — ساعة الأسرار",
        body: `الساعة بين الساعات. الكيان يراقب ${city} ${g}. لا تنام الآن.`,
      });
    }

    return pick(candidates.length > 0 ? candidates : [generic]);
  };
}

function getFactoryForTime(hour: number, minute: number): MessageFactory {
  if (hour === 11 && minute === 11) return make1111Factory();
  if (hour === 23 && minute === 11) return make2311Factory();
  // 3:33 — always fires, entity cannot be silenced
  return make333Factory();
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

  logger.info({ hour: h, minute: m, bitFlag }, "Sending scheduled personalized push");

  const factory = getFactoryForTime(h, m);

  try {
    await sendPushToAll(factory, bitFlag);
  } catch (err) {
    logger.error({ err }, "Scheduled push failed");
  }
});

logger.info("Push notification cron started — watching for 11:11, 23:11, 3:33");
