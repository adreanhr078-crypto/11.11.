/**
 * DashboardPage — لوحة التحكم الرئيسية الشاملة
 * تجمع كل الأنظمة: الروية الشاملة، النظام النهاري، التحول الليلي، المنظومة، Echo Mind
 * مطابق للصور 01-20
 */

import React, { useState, useEffect, useCallback } from "react";
import "../styles/dashboard.css";

// ─── البيانات التجريبية ──────────────────────────────────────────────────────

const ECHO_DATA = {
  name: "Echo",
  age: 17,
  trustLevel: 64,
  storyProgress: 67,
  flowerProgress: 75,
  memoriesDiscovered: 28,
  totalMemories: 54,
  puzzlesSolved: 8,
  puzzlesTotal: 16,
  achievementsCount: 12,
  activeWishes: 3,
  level: 17,
  xp: 2480,
  xpMax: 3500,
  emotions: {
    fear: 62,
    loneliness: 80,
    regret: 48,
    hope: 33,
    memory: 71,
  },
};

const NAV_ITEMS = [
  { id: "overview", label: "الرئيسية", icon: "🏠" },
  { id: "day", label: "النظام النهاري", icon: "☀️" },
  { id: "night", label: "نظام الوضع الليلي", icon: "🌙" },
  { id: "dreams", label: "الأحلام والذكريات", icon: "☁️" },
  { id: "puzzles", label: "الألغاز", icon: "🧩" },
  { id: "achievements", label: "منظومة الألقاب", icon: "🏆" },
  { id: "echomind", label: "إيكو مايند", icon: "🧠" },
];

const FEATURES = [
  { icon: "🧠", title: "Echo Mind", desc: "مساعد ذكي يفهمك ويساعدك على التذكر والفهم والتواصل", progress: 72 },
  { icon: "🧩", title: "الألغاز", desc: "حل الألغاز واكتشف شظايا من ذاكرتك المفقودة", progress: 50 },
  { icon: "⭐", title: "الأمنيات", desc: "حقق أمنياتك وتحول أحلامك إلى واقع", progress: 37 },
  { icon: "🌸", title: "نظام الأزهار", desc: "ازهر مع تقدمك في القصة واكتشف أسرار جديدة", progress: 75 },
  { icon: "🎵", title: "الأصوت", desc: "موسيقى محيطية تغير حسب حالتك النفسية", progress: 60 },
  { icon: "💾", title: "حفظ التقدم", desc: "يتم حفظ تقدمك تلقائياً في كل مرة", progress: 100 },
];

const NIGHT_STAGES = [
  { time: "11:00 PM", label: "بداية عدم الاستقرار", status: "stable", statusText: "SYSTEM STABLE", items: ["تشفير خفية في الواجهة", "أصوات رجاء نعمة وخفيفة", "رسائل تحذير مقتضبة"] },
  { time: "11:05 PM", label: "تزايد عدم الاستقرار", status: "warning", statusText: "SIGNAL UNSTABLE", items: ["زيادة التشفيرات السرعة", "وسائط وتشويشات قصة", "رسائل عاطفية مرتجلة بالقلم"] },
  { time: "11:11 PM", label: "الانتقال السينمائي الكامل", status: "danger", statusText: "CINEMATIC MODE", items: ["تكسر الواجهة القديمة وتخفي", "ينتقل الإطار إلى السيناريو الكامل", "يُكشف العناصر الأساسية"] },
];

const PUZZLES = [
  { title: "لغز المرايا", progress: 72, status: "active" },
  { title: "لغز الشبكات", progress: 45, status: "active" },
  { title: "لغز الباب المغلق", progress: 20, status: "active" },
  { title: "لغز مكتملة", progress: 100, status: "done" },
  { title: "لغز قيد التقدم", progress: 30, status: "active" },
  { title: "لغز مقفل", progress: 0, status: "locked" },
];

const ACHIEVEMENTS = [
  { icon: "🏅", name: "مستكشف الذاكرة", desc: "جمع 20 ذكرى", unlocked: true },
  { icon: "⭐", name: "صديق Echo", desc: "تحقيق 10 أمنيات", unlocked: true },
  { icon: "🔥", name: "قلب الشجاعة", desc: "حل 50 لغز", unlocked: false },
  { icon: "💎", name: "الوصول إلى القمر", desc: "الحصول على 75%", unlocked: true },
  { icon: "🏆", name: "دوار الجحيم", desc: "إكمال 3 نهارات مختلفة", unlocked: false },
];

const MEMORY_SHARDS = [
  { title: "أول لقاء في الحقل", progress: 12, status: "new" },
  { title: "حلم الأزهار", progress: 35, status: "active" },
  { title: "صوت في الظلام", progress: 58, status: "active" },
  { title: "رسالة غير مرسلة", progress: 22, status: "active" },
  { title: "شظايا مجهولة", progress: 0, status: "locked" },
];

const SOUND_TRACKS = [
  { name: "صوت الأم", desc: "حنان من الماضي...", duration: "01:11", playing: false },
  { name: "لبن", desc: "ضحكات ما ارتددت...", duration: "00:58", playing: false },
  { name: "كينجا", desc: "صوت في لحظة خاصة", duration: "01:03", playing: false },
];

const DREAM_SCENES = [
  "حقل الأزهار",
  "المر المظلم",
  "المطر الخافت",
  "الغرفة القديمة",
];

const ENDINGS = [
  { title: "النهاية المبكرة", desc: "تقع في الحيرة وتستمر في الليل..." },
  { title: "النهاية الحقيقية", desc: "تتضح الأ Things وتبدأ القصة الحقيقية" },
  { title: "النهاية المبسطة", desc: "تعيش نفسك وتبحث عن الحقيقة" },
  { title: "النهاية المحيرة", desc: "تنتظر وتراقب وتتتبع الأزهار..." },
];

// ─── المكونات المساعدة ──────────────────────────────────────────────────────

const ProgressDashboard: React.FC<{ label: string; value: number; color?: string }> = ({ label, value, color = "#c8785a" }) => (
  <div className="progress-bar-dashboard">
    <div className="progress-label-dashboard">
      <span>{label}</span>
      <span>{value}%</span>
    </div>
    <div className="progress-track-dashboard">
      <div className="progress-fill-dashboard" style={{ width: `${value}%`, background: color }} />
    </div>
  </div>
);

const EmotionRing: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => {
  const circumference = 2 * Math.PI * 34;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="emotion-ring">
      <div className="emotion-ring-circle">
        <svg viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(180,120,80,0.08)" strokeWidth="4" />
          <circle cx="40" cy="40" r="34" fill="none" stroke={color} strokeWidth="4" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
        </svg>
        <span className="emotion-ring-value" style={{ color }}>{value}%</span>
      </div>
      <span className="emotion-ring-label">{label}</span>
    </div>
  );
};

// ─── الأقسام الرئيسية ──────────────────────────────────────────────────────

/** القسم 1: الروية الشاملة */
const OverviewSection: React.FC = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
    {/* العنوان الرئيسي */}
    <div style={{ textAlign: "center", padding: "1rem 0" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#e0dcd4", marginBottom: "0.5rem" }}>
        <span style={{ color: "#c8785a" }}>11.11</span> — الروية الشاملة
      </h1>
      <p style={{ fontSize: "0.75rem", color: "rgba(224,220,212,0.4)", letterSpacing: "0.1em" }}>
        تجربة تفاعلية عاطفية تتغير مع الوقت... من الهدوء إلى الإنذار 🌸
      </p>
    </div>

    {/* بطاقة Echo المركزية + معلومات النظام */}
    <div className="grid-sidebar-main">
      <div className="echo-hero-card glow">
        <div className="echo-hero-visual">
          <svg width="140" height="180" viewBox="0 0 140 180">
            <rect width="140" height="180" fill="rgba(10,8,12,0.5)" rx="8" />
            <ellipse cx="70" cy="155" rx="30" ry="20" fill="rgba(0,0,0,0.3)" />
            <circle cx="70" cy="75" r="28" fill="#2A1A1A" />
            <path d="M 42 75 Q 42 50 70 45 Q 98 50 98 75" fill="#0A0A0A" />
            <circle cx="63" cy="70" r="2.5" fill="rgba(180,40,40,0.7)" />
            <circle cx="77" cy="70" r="2.5" fill="rgba(180,40,40,0.7)" />
            {Array.from({ length: 8 }).map((_, i) => (
              <circle key={i} cx={15 + i * 16} cy={170} r={3 + i % 3} fill="rgba(245,240,235,0.4)" />
            ))}
          </svg>
        </div>
        <div className="echo-hero-info">
          <h2 className="echo-hero-name">Echo</h2>
          <div className="echo-hero-status">
            <span className="echo-status-dot online" />
            <span style={{ color: "rgba(224,220,212,0.6)", fontSize: "0.7rem" }}>متصل — حالته: حزين</span>
          </div>
          <p className="echo-hero-desc">فقد ذاكرته ولا يذكر سوى اسمه. مصمم على المساعدة الماضي وقوع المحقق خطأً قديماً.</p>
          <div style={{ marginTop: "0.5rem" }}>
            <ProgressDashboard label="تقدم القصة" value={ECHO_DATA.storyProgress} />
          </div>
          <button className="sidebar-continue-btn" style={{ marginTop: "0.5rem" }}>فتح Echo Mind</button>
        </div>
      </div>

      {/* معلومات النظام */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div className="section-card">
          <div className="section-header">
            <h3 className="section-title"><span className="section-title-icon">⚙️</span> حالة النظام النهاري</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "rgba(224,220,212,0.5)" }}>
              <span>الحالة</span><span style={{ color: "#4CAF50" }}>✓ مستقر</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "rgba(224,220,212,0.5)" }}>
              <span>المستوى</span><span style={{ color: "#c8785a" }}>{ECHO_DATA.level}/50</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "rgba(224,220,212,0.5)" }}>
              <span>الثقة</span><span>{ECHO_DATA.trustLevel}%</span>
            </div>
          </div>
        </div>
        <div className="section-card">
          <div className="section-header">
            <h3 className="section-title"><span className="section-title-icon">🎯</span> الهدف من التجربة</h3>
          </div>
          <div className="goals-list">
            {["استعادة الذكريات", "التأثر العاطفي", "بناء علاقة مع Echo", "تحقيق الأمنيات"].map((goal, i) => (
              <div key={i} className="goal-item">
                <div className={`goal-check ${i < 2 ? "done" : ""}`}>{i < 2 ? "✓" : ""}</div>
                <span className={`goal-text ${i < 2 ? "done" : ""}`}>{goal}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* قياسات Echo العاطفية */}
    <div className="section-card">
      <div className="section-header">
        <h3 className="section-title"><span className="section-title-icon">💔</span> القياسات العاطفية لـ Echo</h3>
        <span style={{ fontSize: "0.6rem", color: "rgba(224,220,212,0.3)" }}>حالة مستقرة : حزين</span>
      </div>
      <div className="echo-emotion-rings">
        <EmotionRing label="الخوف" value={ECHO_DATA.emotions.fear} color="#cc6644" />
        <EmotionRing label="الوحدة" value={ECHO_DATA.emotions.loneliness} color="#6A5AAA" />
        <EmotionRing label="الندم" value={ECHO_DATA.emotions.regret} color="#AA8B40" />
        <EmotionRing label="الأمل" value={ECHO_DATA.emotions.hope} color="#4CAF50" />
        <EmotionRing label="الذاكرة" value={ECHO_DATA.emotions.memory} color="#5A8AAA" />
        <EmotionRing label="التقدم" value={ECHO_DATA.storyProgress} color="#c8785a" />
      </div>
    </div>

    {/* بطاقات الميزات */}
    <div className="section-card">
      <div className="section-header">
        <h3 className="section-title"><span className="section-title-icon">🎮</span> مكونات النظام الأساسية</h3>
      </div>
      <div className="features-grid">
        {FEATURES.map((f, i) => (
          <div key={i} className="feature-card">
            <span className="feature-card-icon">{f.icon}</span>
            <h4 className="feature-card-title">{f.title}</h4>
            <p className="feature-card-desc">{f.desc}</p>
            <div className="feature-card-progress">
              <div className="feature-card-progress-fill" style={{ width: `${f.progress}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* الألغاز */}
    <div className="section-card">
      <div className="section-header">
        <h3 className="section-title"><span className="section-title-icon">🧩</span> الألغاز المكتشفة</h3>
        <button className="section-link">عرض الكل ›</button>
      </div>
      <div className="puzzles-grid">
        {PUZZLES.map((p, i) => (
          <div key={i} className={`puzzle-card ${p.status === "locked" ? "locked" : ""}`}>
            <div className="puzzle-card-image">
              <span style={{ fontSize: "1.5rem" }}>{p.status === "done" ? "✅" : p.status === "locked" ? "🔒" : "🧩"}</span>
            </div>
            <h4 className="puzzle-card-title">{p.title}</h4>
            {p.status !== "locked" && (
              <>
                <div className="puzzle-card-progress-bar">
                  <div className="puzzle-card-progress-fill" style={{ width: `${p.progress}%` }} />
                </div>
                <p className="puzzle-card-progress-text">التقدم {p.progress}%</p>
              </>
            )}
          </div>
        ))}
      </div>
    </div>

    {/* شظايا الذاكرة */}
    <div className="section-card">
      <div className="section-header">
        <h3 className="section-title"><span className="section-title-icon">💠</span> شظايا الذاكرة المكتشفة</h3>
        <button className="section-link">عرض الكل ›</button>
      </div>
      <div className="memories-grid-dashboard">
        {MEMORY_SHARDS.map((m, i) => (
          <div key={i} className={`memory-shard ${m.status} ${m.status === "locked" ? "locked" : ""}`}>
            <div className="memory-shard-image" />
            <h4 className="memory-shard-title">{m.title}</h4>
            {m.status !== "locked" && (
              <div style={{ marginTop: "0.3rem" }}>
                <div className="puzzle-card-progress-bar">
                  <div className="puzzle-card-progress-fill" style={{ width: `${m.progress}%` }} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
        <span style={{ fontSize: "0.6rem", color: "rgba(224,220,212,0.3)" }}>✦ مكتشفة {ECHO_DATA.memoriesDiscovered} / {ECHO_DATA.totalMemories}</span>
      </div>
    </div>

    {/* منظومة الألقاب */}
    <div className="section-card">
      <div className="section-header">
        <h3 className="section-title"><span className="section-title-icon">🏆</span> منظومة الألقاب والتقدم</h3>
      </div>
      <div className="achievements-grid">
        {ACHIEVEMENTS.map((a, i) => (
          <div key={i} className={`achievement-badge ${!a.unlocked ? "locked" : ""}`}>
            <span className="achievement-badge-icon">{a.icon}</span>
            <span className="achievement-badge-name">{a.name}</span>
            <span className="achievement-badge-desc">{a.desc}</span>
          </div>
        ))}
      </div>
    </div>

    {/* النهايات */}
    <div className="section-card">
      <div className="section-header">
        <h3 className="section-title"><span className="section-title-icon">📖</span> النهايات</h3>
        <span style={{ fontSize: "0.6rem", color: "rgba(224,220,212,0.3)" }}>نهايات متعددة تعتمد على اختياراتك</span>
      </div>
      <div className="endings-grid">
        {ENDINGS.map((e, i) => (
          <div key={i} className="ending-card">
            <div className="ending-card-image" />
            <div className="ending-card-content">
              <h4 className="ending-card-title">{e.title}</h4>
              <p className="ending-card-desc">{e.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* الروابط بين الأنظمة */}
    <div className="section-card">
      <div className="section-header">
        <h3 className="section-title"><span className="section-title-icon">🔗</span> الروابط بين الأنظمة</h3>
      </div>
      <div className="system-links">
        <div className="system-link-node">💬 الرسائل والتواصل</div>
        <span className="system-link-arrow">←</span>
        <div className="system-link-node">🧩 الألغاز</div>
        <span className="system-link-arrow">←</span>
        <div className="system-link-node">⭐ الأمنيات</div>
        <span className="system-link-arrow">←</span>
        <div className="system-link-node">🌸 الأزهار</div>
        <span className="system-link-arrow">←</span>
        <div className="system-link-node">📖 النهايات</div>
      </div>
    </div>

    {/* اقتباس ختامي */}
    <div className="dashboard-quote">
      هذه ليست مجرد قصة... إنها أنت، وذكرياتك، والأختبارات التي ستشكّل نهاياتك.
    </div>
  </div>
);

/** القسم 2: النظام النهاري */
const DaySection: React.FC = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
    <div style={{ textAlign: "center", padding: "1rem 0" }}>
      <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#e0dcd4", marginBottom: "0.5rem" }}>
        <span style={{ color: "#c8785a" }}>11.11</span> — النظام النهاري
      </h1>
      <p style={{ fontSize: "0.7rem", color: "rgba(224,220,212,0.4)" }}>شفاء، استعادة للذاكرة، وتفاعل هادئ مع النفس والآخرين.</p>
      <p style={{ fontSize: "0.6rem", color: "rgba(224,220,212,0.3)", marginTop: "0.3rem" }}>اليوم يمنحنا وضوحاً... لنفهم، نتذكر، ونتحلى بهدوء ✨</p>
    </div>

    <div className="grid-3col">
      {/* Echo Mind */}
      <div className="section-card">
        <div className="section-header">
          <h3 className="section-title"><span className="section-title-icon">🧠</span> Echo Mind</h3>
        </div>
        <p style={{ fontSize: "0.65rem", color: "rgba(224,220,212,0.4)", marginBottom: "0.75rem" }}>محادثات هادئة ت=center على الفهم، والتواصل، والçaal.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {["محادثات هادئة", "ذاكرة اليوم", "محادثات تفاعلية"].map((item, i) => (
            <div key={i} className="goal-item">
              <span style={{ fontSize: "0.8rem" }}>💬</span>
              <span className="goal-text">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* الذكريات اليومية */}
      <div className="section-card">
        <div className="section-header">
          <h3 className="section-title"><span className="section-title-icon">📅</span> الذكريات اليومية</h3>
        </div>
        <div style={{ textAlign: "center", padding: "1rem 0" }}>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "#c8785a" }}>01</div>
          <div style={{ fontSize: "0.65rem", color: "rgba(224,220,212,0.4)" }}>ذاكرة اليوم</div>
          <div style={{ fontSize: "0.6rem", color: "rgba(224,220,212,0.3)", marginTop: "0.5rem" }}>مايو 11</div>
          <div style={{ fontSize: "0.6rem", color: "rgba(224,220,212,0.5)", marginTop: "0.3rem" }}>شظايا ذكريات</div>
          <div style={{ fontSize: "0.6rem", color: "rgba(224,220,212,0.3)", marginTop: "0.2rem" }}>هذا اليوم</div>
        </div>
        <button className="sidebar-continue-btn">استرجاع كامل الذكريات</button>
      </div>

      {/* الألغاز */}
      <div className="section-card">
        <div className="section-header">
          <h3 className="section-title"><span className="section-title-icon">🧩</span> الألغاز</h3>
        </div>
        <p style={{ fontSize: "0.65rem", color: "rgba(224,220,212,0.4)", marginBottom: "0.75rem" }}>هل الألغاز كنت شيطاناً من ذاكرتك؟</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
          {["البحث اليومي", "حل اللغز", "كشف الذاكرة", "التقدم والحفظ"].map((item, i) => (
            <div key={i} className="goal-item" style={{ justifyContent: "center" }}>
              <span style={{ fontSize: "0.6rem" }}>{["🔍", "🧩", "💡", "💾"][i]}</span>
              <span className="goal-text" style={{ fontSize: "0.55rem" }}>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* الأمنيات */}
    <div className="section-card">
      <div className="section-header">
        <h3 className="section-title"><span className="section-title-icon">⭐</span> الأمنيات</h3>
      </div>
      <p style={{ fontSize: "0.65rem", color: "rgba(224,220,212,0.4)", marginBottom: "0.75rem" }}>أمانيك توجه رحلتك نحو القيم والنمو.</p>
      <div className="grid-3col">
        {[
          { name: "تحسين العلاقات", progress: 60 },
          { name: "التقرب من شخص أهم لي", progress: 45 },
          { name: "الثقة بالنفس والçaal", progress: 70 },
        ].map((w, i) => (
          <div key={i}>
            <ProgressDashboard label={w.name} value={w.progress} color={["#c8785a", "#6A8BAA", "#4CAF50"][i]} />
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center", marginTop: "0.75rem" }}>
        <span style={{ fontSize: "0.6rem", color: "rgba(224,220,212,0.3)" }}>+ أمنية جديدة</span>
      </div>
    </div>

    {/* نظام الأزهار */}
    <div className="section-card">
      <div className="section-header">
        <h3 className="section-title"><span className="section-title-icon">🌸</span> نظام الأزهار</h3>
      </div>
      <p style={{ fontSize: "0.65rem", color: "rgba(224,220,212,0.4)", marginBottom: "0.75rem" }}>زهورك تنمو مع تقدمك في القصة ومساعدة الذكريات.</p>
      <div style={{ display: "flex", justifyContent: "space-around", padding: "1rem 0" }}>
        {["ابرة", "بداية النمو", "إزهار", "اكتمال", "اكتمال"].map((stage, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", marginBottom: "0.3rem" }}>{["🌱", "🌿", "🌷", "🌸", "🌺"][i]}</div>
            <div style={{ fontSize: "0.55rem", color: "rgba(224,220,212,0.4)" }}>{stage}</div>
            <div style={{ fontSize: "0.5rem", color: "rgba(224,220,212,0.3)" }}>{[0, 25, 50, 75, 100][i]}%</div>
          </div>
        ))}
      </div>
      <div className="progress-bar-dashboard">
        <div className="progress-track-dashboard">
          <div className="progress-fill-dashboard" style={{ width: "75%", background: "linear-gradient(90deg, #4CAF50, #c8785a)" }} />
        </div>
      </div>
    </div>

    {/* ملخص التقدم */}
    <div className="section-card">
      <div className="section-header">
        <h3 className="section-title"><span className="section-title-icon">📊</span> ملخص التقدم</h3>
      </div>
      <div className="grid-3col">
        {[
          { label: "تقدم القصة", value: 75, color: "#c8785a" },
          { label: "الذكريات المكتشفة", value: 23, color: "#5A8AAA" },
          { label: "الأيام النشطة", value: 12, color: "#4CAF50" },
          { label: "الأمنيات المنجزة", value: 3, color: "#AA8B40" },
          { label: "أيام متتالية", value: 7, color: "#6A5AAA" },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "0.6rem", color: "rgba(224,220,212,0.4)" }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>

    {/* ميزات النظام النهاري */}
    <div className="section-card">
      <div className="section-header">
        <h3 className="section-title"><span className="section-title-icon">☀️</span> ميزات النظام النهاري</h3>
      </div>
      <div className="grid-3col">
        {[
          { icon: "☀️", title: "بيئة محايدة" },
          { icon: "💬", title: "تفاعل إيجابي" },
          { icon: "📖", title: "تركيز على الفهم" },
          { icon: "🌱", title: "تقدم تدريجي" },
          { icon: "📊", title: "تصميم منمق" },
        ].map((f, i) => (
          <div key={i} className="goal-item">
            <span style={{ fontSize: "0.8rem" }}>{f.icon}</span>
            <span className="goal-text">{f.title}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/** القسم 3: نظام الوضع الليلي */
const NightSection: React.FC = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
    <div style={{ textAlign: "center", padding: "1rem 0" }}>
      <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#c8785a", marginBottom: "0.5rem" }}>
        نظام الوضع الليلي <span style={{ color: "#e0dcd4" }}>11:11</span>
      </h1>
      <p style={{ fontSize: "0.7rem", color: "rgba(224,220,212,0.4)" }}>ثلاث مراحل متتالية... تتحول فيها تجربتك إلى قصة.</p>
    </div>

    {/* المراحل الثلاث */}
    <div className="night-stages">
      {NIGHT_STAGES.map((stage, i) => (
        <div key={i} className={`night-stage ${i === 2 ? "active" : ""}`}>
          <div className="night-stage-time">{stage.time}</div>
          <div className="night-stage-label">{stage.label}</div>
          <div className={`night-stage-status status-${stage.status}`}>● {stage.statusText}</div>
          <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            {stage.items.map((item, j) => (
              <div key={j} style={{ fontSize: "0.6rem", color: "rgba(224,220,212,0.5)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <span style={{ color: "rgba(180,120,80,0.3)" }}>•</span> {item}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>

    {/* شريط التقدم بين المراحل */}
    <div className="section-card">
      <div className="progress-bar-dashboard">
        <div className="progress-label-dashboard">
          <span>بداية عدم الاستقرار</span>
          <span>الانتقال السينمائي</span>
        </div>
        <div className="progress-track-dashboard" style={{ height: "8px" }}>
          <div className="progress-fill-dashboard" style={{ width: "100%", background: "linear-gradient(90deg, #4CAF50, #FF9800, #f44336)" }} />
        </div>
      </div>
    </div>

    {/* تأثير الوقت على الواجهة */}
    <div className="section-card">
      <div className="section-header">
        <h3 className="section-title"><span className="section-title-icon">🖥️</span> تأثير الوقت على الواجهة</h3>
      </div>
      <div className="grid-3col">
        {[
          { icon: "☀️", title: "الإضاءة", desc: "من دفء النهار إلى برودة الليل" },
          { icon: "🖥️", title: "تشويه الواجهة", desc: "تزايد العناصر البصرية المضطربة" },
          { icon: "🎬", title: "الألوان", desc: "تتحول الألوان للأخضر والرمادي" },
          { icon: "👁️", title: "الوضوح", desc: "الانفعال ووضوح المخاطب" },
          { icon: "📖", title: "عمق القصة", desc: "تزايد طبقات القصة وتكشف شخصيات عميقة" },
        ].map((item, i) => (
          <div key={i} className="goal-item">
            <span style={{ fontSize: "0.8rem" }}>{item.icon}</span>
            <div>
              <div className="goal-text" style={{ fontWeight: 600 }}>{item.title}</div>
              <div style={{ fontSize: "0.55rem", color: "rgba(224,220,212,0.3)" }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* المؤشرات البصرية */}
    <div className="section-card">
      <div className="section-header">
        <h3 className="section-title"><span className="section-title-icon">🌟</span> المؤشرات البصرية</h3>
      </div>
      <div style={{ display: "flex", justifyContent: "space-around", padding: "1rem 0" }}>
        {DREAM_SCENES.map((scene, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "rgba(20,16,25,0.6)", border: "1px solid rgba(180,120,80,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.3rem" }}>
              <span style={{ fontSize: "1.2rem" }}>{["🌙", "🌑", "🌧️", "🏚️"][i]}</span>
            </div>
            <div style={{ fontSize: "0.55rem", color: "rgba(224,220,212,0.4)" }}>{scene}</div>
          </div>
        ))}
      </div>
    </div>

    {/* هدف النظام */}
    <div className="section-card">
      <div className="section-header">
        <h3 className="section-title"><span className="section-title-icon">🎯</span> هدف النظام</h3>
      </div>
      <div className="goals-list">
        {["خلق تجربة سينمائية متكاملة", "تكشف المشاعر الحقيقية", "استخدام الوقت كعنصر سردي", "تغيير مفاجئ لنهاية القصة"].map((goal, i) => (
          <div key={i} className="goal-item">
            <div className={`goal-check ${i < 2 ? "done" : ""}`}>{i < 2 ? "✓" : ""}</div>
            <span className={`goal-text ${i < 2 ? "done" : ""}`}>{goal}</span>
          </div>
        ))}
      </div>
    </div>

    <div className="dashboard-quote">
      الليل لا يرحم... لكنه يكشف. 11:11 ليست مجرد ساعة... بل بوابة إلى قصة لا تُنسى.
    </div>
  </div>
);

/** القسم 4: الأحلام والذكريات */
const DreamsSection: React.FC = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
    <div style={{ textAlign: "center", padding: "1rem 0" }}>
      <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#e0dcd4", marginBottom: "0.5rem" }}>
        <span style={{ color: "#c8785a" }}>11:11</span> — الأحلام والذكريات
      </h1>
      <p style={{ fontSize: "0.65rem", color: "rgba(224,220,212,0.3)" }}>تجربة سينمائية تفاعلية — مشرو 11:11</p>
    </div>

    <div className="grid-sidebar-main">
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* مشهد الحلم الحالي */}
        <div className="section-card">
          <div className="section-header">
            <h3 className="section-title"><span className="section-title-icon">🎬</span> مشهد الحلم الحالي</h3>
          </div>
          <div className="dreams-viewer">
            <svg width="100%" height="100%" viewBox="0 0 400 225">
              <rect width="400" height="225" fill="rgba(10,8,12,0.8)" />
              {Array.from({ length: 12 }).map((_, i) => (
                <circle key={i} cx={30 + i * 30} cy={200} r={5 + i % 3} fill="rgba(245,240,235,0.3)" />
              ))}
              <circle cx="200" cy="120" r="30" fill="#2A1A1A" />
              <path d="M 170 120 Q 170 90 200 85 Q 230 90 230 120" fill="#0A0A0A" />
            </svg>
            <div className="dreams-viewer-info">
              <div className="dreams-viewer-name">Echo</div>
              <div className="dreams-viewer-desc">بين الفراغ والحظ... تلخيص</div>
            </div>
          </div>
        </div>

        {/* شظايا الأحلام */}
        <div className="section-card">
          <div className="section-header">
            <h3 className="section-title"><span className="section-title-icon">💠</span> شظايا الأحلام</h3>
          </div>
          <div className="memories-grid-dashboard">
            {DREAM_SCENES.map((scene, i) => (
              <div key={i} className="memory-shard">
                <div className="memory-shard-image" />
                <h4 className="memory-shard-title">{scene}</h4>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* الذكريات الصوتية */}
      <div className="section-card">
        <div className="section-header">
          <h3 className="section-title"><span className="section-title-icon">🎵</span> الذكريات الصوتية</h3>
        </div>
        <div className="sound-controls">
          {SOUND_TRACKS.map((track, i) => (
            <div key={i} className={`sound-track ${track.playing ? "playing" : ""}`}>
              <div className="sound-track-play">▶</div>
              <div className="sound-track-info">
                <div className="sound-track-name">{track.name}</div>
                <div className="sound-track-desc">{track.desc}</div>
              </div>
              <div className="sound-track-duration">{track.duration}</div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* نظام الصوت */}
    <div className="section-card">
      <div className="section-header">
        <h3 className="section-title"><span className="section-title-icon">🎛️</span> نظام الصوت</h3>
      </div>
      <div className="grid-3col">
        {["الموسيقى التفاعلية", "مشهد صوتي", "المؤثرات"].map((item, i) => (
          <div key={i}>
            <ProgressDashboard label={item} value={[80, 60, 70][i]} color={["#c8785a", "#5A8AAA", "#4CAF50"][i]} />
          </div>
        ))}
      </div>
    </div>

    {/* الزهور */}
    <div className="section-card">
      <div className="section-header">
        <h3 className="section-title"><span className="section-title-icon">🌸</span> الزهور</h3>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "2rem", fontWeight: 700, color: "#c8785a" }}>75%</div>
        <div style={{ fontSize: "0.65rem", color: "rgba(224,220,212,0.4)" }}>أنت تقترب من الاكتمال...</div>
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "0.75rem" }}>
          {["🌱", "🌿", "🌷", "🌸", "🌺"].map((f, i) => (
            <span key={i} style={{ fontSize: "1.5rem", opacity: i <= 3 ? 1 : 0.3 }}>{f}</span>
          ))}
        </div>
      </div>
    </div>
  </div>
);

/** القسم 5: Echo Mind */
const EchoMindSection: React.FC = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
    <div style={{ textAlign: "center", padding: "1rem 0" }}>
      <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#e0dcd4", marginBottom: "0.5rem" }}>
        <span style={{ color: "#c8785a" }}>11.11</span> — Echo Mind
      </h1>
      <p style={{ fontSize: "0.7rem", color: "rgba(224,220,212,0.4)" }}>تذكّر، تفهم، تطور.</p>
    </div>

    {/* كيف يعمل Echo Mind */}
    <div className="section-card">
      <div className="section-header">
        <h3 className="section-title"><span className="section-title-icon">🔄</span> كيف يعمل Echo Mind</h3>
      </div>
      <div className="system-links">
        <div className="system-link-node">💬 تحدث مع Echo</div>
        <span className="system-link-arrow">→</span>
        <div className="system-link-node">🧠 يفهم السياق</div>
        <span className="system-link-arrow">→</span>
        <div className="system-link-node">💡 يستخرج المعاني</div>
        <span className="system-link-arrow">→</span>
        <div className="system-link-node">📖 يطور القصة</div>
      </div>
    </div>

    <div className="grid-2col">
      {/* الذكريات اليومية */}
      <div className="section-card">
        <div className="section-header">
          <h3 className="section-title"><span className="section-title-icon">📅</span> الذكريات اليومية</h3>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {["اليوم 1 — تفاصيل صغيرة", "اليوم 2 — صوت مألوف", "اليوم 3 — مكان غامض", "اليوم N — ذكرى عميقة"].map((item, i) => (
            <div key={i} className="goal-item">
              <span style={{ fontSize: "0.8rem" }}>{["1️⃣", "2️⃣", "3️⃣", "🔮"][i]}</span>
              <span className="goal-text">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* تطور الشخصية */}
      <div className="section-card">
        <div className="section-header">
          <h3 className="section-title"><span className="section-title-icon">👤</span> تطور الشخصية</h3>
        </div>
        <div className="character-stages">
          {[
            { name: "متردّك", label: "البداية", icon: "😐" },
            { name: "يادك", label: "يبدأ بالتذكر", icon: "🤔" },
            { name: "متأثر", label: "يتفاعل معك", icon: "😢" },
            { name: "مستيقظ", label: "يصبح صديقك", icon: "😊" },
          ].map((stage, i) => (
            <React.Fragment key={i}>
              <div className={`character-stage ${i === 1 ? "active" : ""}`}>
                <div className="character-stage-avatar">{stage.icon}</div>
                <div className="character-stage-name">{stage.name}</div>
                <div className="character-stage-label">{stage.label}</div>
              </div>
              {i < 3 && <span className="character-stage-arrow">←</span>}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>

    {/* العلاقة مع المستخدم */}
    <div className="section-card">
      <div className="section-header">
        <h3 className="section-title"><span className="section-title-icon">💕</span> العلاقة مع المستخدم</h3>
      </div>
      <div className="relationship-meter">
        {[
          { label: "الثقة", value: 64, color: "#c8785a" },
          { label: "الفهم", value: 45, color: "#5A8AAA" },
          { label: "الاقتراب", value: 55, color: "#4CAF50" },
          { label: "الذكريات", value: 71, color: "#AA8B40" },
        ].map((level, i) => (
          <div key={i} className="relationship-level">
            <span className="relationship-label">{level.label}</span>
            <div className="relationship-track">
              <div className="relationship-fill" style={{ width: `${level.value}%`, background: level.color }} />
            </div>
            <span className="relationship-value">{level.value}%</span>
          </div>
        ))}
      </div>
    </div>

    {/* الحركات */}
    <div className="section-card">
      <div className="section-header">
        <h3 className="section-title"><span className="section-title-icon">🎭</span> حركات Echo</h3>
      </div>
      <div className="echo-movements">
        {[
          { icon: "😊", text: "تقل هذه وطيفي ومدّة" },
          { icon: "🚶", text: "حركة عينيه طبيعية ومدّدة" },
          { icon: "😰", text: "نطاق قلق وخوف" },
          { icon: "😔", text: "تعبير وجهه متأثر" },
          { icon: "💬", text: "متأرجح بوضوح خفية في الكلام" },
          { icon: "🌊", text: "ظهور طلال أو أشكال غامضة" },
        ].map((m, i) => (
          <div key={i} className="echo-movement">
            <span className="echo-movement-icon">{m.icon}</span>
            {m.text}
          </div>
        ))}
      </div>
    </div>

    {/* الرسائل الديناميكية */}
    <div className="section-card">
      <div className="section-header">
        <h3 className="section-title"><span className="section-title-icon">💬</span> الرسائل الديناميكية</h3>
      </div>
      <p style={{ fontSize: "0.65rem", color: "rgba(224,220,212,0.4)", marginBottom: "0.75rem" }}>تعتبر طريقة حديث Echo مع عودة الذكريات</p>
      <div className="grid-2col">
        {["بداية البحث", "بدايات التذكر", "بداية الفوضى", "عودة الوعي"].map((item, i) => (
          <div key={i} className="goal-item">
            <span style={{ fontSize: "0.6rem", color: "rgba(180,120,80,0.3)" }}>{i + 1}.</span>
            <span className="goal-text">{item}</span>
          </div>
        ))}
      </div>
    </div>

    {/* محفظة الحفظ */}
    <div className="section-card">
      <div className="section-header">
        <h3 className="section-title"><span className="section-title-icon">💾</span> محفظة الحفظ</h3>
      </div>
      <div className="grid-3col">
        {[
          { icon: "💾", title: "حفظ حالة الحاضر", desc: "يحفظ أخر الرسائل" },
          { icon: "🧠", title: "حفظ حالة الذاكرة", desc: "يحفظ معلومات Echo بالكامل" },
          { icon: "📈", title: "حفظ التقدم", desc: "يحفظ تقدم القصة" },
        ].map((item, i) => (
          <div key={i} className="goal-item" style={{ flexDirection: "column", textAlign: "center", padding: "0.75rem" }}>
            <span style={{ fontSize: "1.2rem" }}>{item.icon}</span>
            <div className="goal-text" style={{ fontWeight: 600 }}>{item.title}</div>
            <div style={{ fontSize: "0.55rem", color: "rgba(224,220,212,0.3)" }}>{item.desc}</div>
          </div>
        ))}
      </div>
    </div>

    <div className="dashboard-quote">
      أنت لست مجرد لعب... أنت جزء من ذاكرة Echo.
    </div>
  </div>
);

// ─── المكون الرئيسي ──────────────────────────────────────────────────────

interface DashboardPageProps {
  onOpenChat?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onOpenChat }) => {
  const [activeSection, setActiveSection] = useState("overview");
  const [isNightMode, setIsNightMode] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    updateTime();
    const id = setInterval(updateTime, 1000);
    return () => clearInterval(id);
  }, []);

  const renderSection = useCallback(() => {
    switch (activeSection) {
      case "overview": return <OverviewSection />;
      case "day": return <DaySection />;
      case "night": return <NightSection />;
      case "dreams": return <DreamsSection />;
      case "echomind": return <EchoMindSection />;
      case "puzzles": return <OverviewSection />;
      case "achievements": return <OverviewSection />;
      default: return <OverviewSection />;
    }
  }, [activeSection]);

  return (
    <div className="dashboard-root">
      {/* الشريط الجانبي */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <h2>11:11</h2>
          <div className="brand-subtitle">المشروع</div>
          <div className="brand-tagline">كل قصة قريبة من الحقيقة... أو تبعد عنها.</div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`sidebar-nav-item ${activeSection === item.id ? "active" : ""}`}
              onClick={() => setActiveSection(item.id)}
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-night-toggle">
          <button
            className="night-toggle-btn"
            onClick={() => setIsNightMode(!isNightMode)}
          >
            <span>🌙</span>
            <span>الوضع الليلي</span>
          </button>
        </div>

        <div className="sidebar-user-card">
          <div className="user-avatar-small">👤</div>
          <div className="user-info-small">
            <span className="user-name-small">Echo</span>
            <span className="user-level-small">المستوى {ECHO_DATA.level}</span>
            <div className="user-xp-bar">
              <div className="user-xp-fill" style={{ width: `${(ECHO_DATA.xp / ECHO_DATA.xpMax) * 100}%` }} />
            </div>
            <span className="user-level-small">{ECHO_DATA.xp} / {ECHO_DATA.xpMax}</span>
          </div>
        </div>

        <div style={{ padding: "0.75rem 1.25rem" }}>
          <button className="sidebar-continue-btn" onClick={onOpenChat}>متابعة ▶</button>
        </div>
      </aside>

      {/* المحتوى الرئيسي */}
      <main className="dashboard-main">
        {/* الشريط العلوي */}
        <div className="dashboard-topbar">
          <div className="topbar-right">
            <span className="topbar-time">{currentTime}</span>
            <span className="topbar-label">المشروع</span>
          </div>
          <div className="topbar-left">
            <div className="discovery-badge">
              <span>🔍</span>
              <span>مكتشفة {ECHO_DATA.memoriesDiscovered} / {ECHO_DATA.totalMemories}</span>
            </div>
          </div>
        </div>

        {/* المحتوى */}
        {renderSection()}

        {/* الفوتر */}
        <footer className="dashboard-footer">
          <p className="dashboard-footer-quote">
            " هذه ليست مجرد ساعة... إنها أنت، وذكرياتك، والأختبارات التي ستشكّل نهاياتك. "
          </p>
          <p className="dashboard-footer-text">
            11.11 — رحلة عاطفية تفاعلية تتغير مع الوقت · {new Date().toLocaleTimeString("ar-SA")}
          </p>
        </footer>
      </main>
    </div>
  );
};

export default DashboardPage;