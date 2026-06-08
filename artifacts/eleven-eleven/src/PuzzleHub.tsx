// PuzzleHub — the PRIMARY screen of 11.11.
// Puzzle-driven progression: pick an entity → solve its puzzles in order →
// each solve reveals a fragment of the CORE_LORE story (see lore.ts).
// No time-locks. Four entities are story characters, not chat personalities.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ENTITIES,
  ENTITY_ORDER,
  checkAnswer,
  getEntityPuzzles,
  isEntityComplete,
  isEntityUnlocked,
  isPuzzleUnlocked,
  getPuzzleById,
  solvedCount,
  totalPuzzleCount,
  type EntityId,
  type Puzzle,
} from "./puzzles";
import { ACHIEVEMENTS, deriveAchievements, getAchievement } from "./achievements";

type Lang = "ar" | "en";

interface PuzzleHubProps {
  uid: string;
  lang: Lang;
  onClose: () => void;
  /** Fired when a new achievement unlocks (for the toast layer). */
  onAchievement: (achievementId: string) => void;
  /** Fired whenever the solved set changes (so App can react, e.g. story state). */
  onProgress?: (solved: string[]) => void;
}

const T = {
  title: { ar: "الألغاز", en: "Puzzles" },
  subtitle: { ar: "أعد بناء ذاكرة إيكو عبر الكيانات الأربعة", en: "Rebuild Echo's memory across the four entities" },
  progress: { ar: "تقدّم", en: "Progress" },
  locked: { ar: "مقفل", en: "Locked" },
  complete: { ar: "مكتمل", en: "Complete" },
  unlockHint: { ar: "أكمل الكيان السابق لفتح هذا", en: "Complete the previous entity to unlock" },
  back: { ar: "رجوع", en: "Back" },
  close: { ar: "إغلاق", en: "Close" },
  solved: { ar: "محلول", en: "Solved" },
  answerPlaceholder: { ar: "اكتب إجابتك...", en: "Type your answer..." },
  submit: { ar: "إرسال", en: "Submit" },
  wrong: { ar: "إجابة خاطئة. حاول مجدداً.", en: "Incorrect. Try again." },
  storyTitle: { ar: "◈ جزء من القصة", en: "◈ Story fragment" },
  continue: { ar: "متابعة", en: "Continue" },
  hint: { ar: "تلميح", en: "Hint" },
  achievements: { ar: "الإنجازات", en: "Achievements" },
  puzzleLocked: { ar: "احلل اللغز السابق أولاً", en: "Solve the previous puzzle first" },
};

export function PuzzleHub({ uid, lang, onClose, onAchievement, onProgress }: PuzzleHubProps) {
  const [solved, setSolved] = useState<string[]>([]);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [view, setView] = useState<"entities" | "entity" | "achievements">("entities");
  const [activeEntity, setActiveEntity] = useState<EntityId | null>(null);
  const [activePuzzle, setActivePuzzle] = useState<string | null>(null);
  const solvedRef = useRef<string[]>([]);
  const achRef = useRef<string[]>([]);

  solvedRef.current = solved;
  achRef.current = achievements;

  // Initial load from server
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/arg?uid=${encodeURIComponent(uid)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { solvedPuzzles?: string[]; unlockedAchievements?: string[] } | null) => {
        if (cancelled || !data) return;
        setSolved(data.solvedPuzzles ?? []);
        setAchievements(data.unlockedAchievements ?? []);
      })
      .catch(() => { /* offline — start empty */ });
    return () => { cancelled = true; };
  }, [uid]);

  const persistAchievement = useCallback((achievementId: string) => {
    if (achRef.current.includes(achievementId)) return;
    achRef.current = [...achRef.current, achievementId];
    setAchievements(achRef.current);
    onAchievement(achievementId);
    fetch("/api/arg/achievement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, achievementId }),
    }).catch(() => { /* ignore */ });
  }, [uid, onAchievement]);

  const markSolved = useCallback((puzzle: Puzzle) => {
    if (solvedRef.current.includes(puzzle.id)) return;
    const next = [...solvedRef.current, puzzle.id];
    solvedRef.current = next;
    setSolved(next);
    onProgress?.(next);

    // Persist solve
    fetch("/api/arg/solve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, puzzleId: puzzle.id }),
    }).catch(() => { /* ignore */ });

    // Puzzle-specific achievement
    if (puzzle.achievement) persistAchievement(puzzle.achievement);
    // Derived achievements (entity completion, story milestones, etc.)
    deriveAchievements(next).forEach(persistAchievement);
  }, [uid, persistAchievement, onProgress]);

  const total = totalPuzzleCount();
  const done = solvedCount(solved);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <motion.div className="absolute inset-0 bg-black/97 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md max-h-[88vh] overflow-y-auto bg-[#040404] border border-primary/20 p-6 font-mono shadow-[0_0_60px_rgba(180,0,0,0.12)]"
      >
        {/* corner marks */}
        <div className="absolute top-0 left-0 w-4 h-4 border-l border-t border-primary/40" />
        <div className="absolute top-0 right-0 w-4 h-4 border-r border-t border-primary/40" />

        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center justify-between">
            <p className="text-[7px] tracking-[0.5em] text-primary/30 uppercase">11.11 // PUZZLE PROTOCOL</p>
            <button
              onClick={onClose}
              className="text-[8px] tracking-[0.3em] text-muted-foreground/30 hover:text-primary/60 uppercase"
            >
              {T.close[lang]} ✕
            </button>
          </div>
          <h2 className="text-lg text-primary/90 tracking-[0.3em] mt-2">{T.title[lang]}</h2>
          <p className="text-[9px] text-muted-foreground/45 tracking-wider mt-1 leading-relaxed">{T.subtitle[lang]}</p>

          {/* progress bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-[8px] text-muted-foreground/40 tracking-widest mb-1">
              <span>{T.progress[lang]}</span>
              <span className="text-primary/60">{done}/{total}</span>
            </div>
            <div className="w-full h-1 bg-primary/10">
              <div
                className="h-full bg-primary/60 transition-all duration-700"
                style={{ width: `${total ? (done / total) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {view === "entities" && (
            <EntityList
              key="entities"
              lang={lang}
              solved={solved}
              onSelect={(e) => { setActiveEntity(e); setView("entity"); }}
              onShowAchievements={() => setView("achievements")}
              achievementCount={achievements.length}
            />
          )}

          {view === "entity" && activeEntity && (
            <EntityPuzzles
              key="entity"
              entity={activeEntity}
              lang={lang}
              solved={solved}
              activePuzzle={activePuzzle}
              onOpenPuzzle={setActivePuzzle}
              onClosePuzzle={() => setActivePuzzle(null)}
              onSolve={markSolved}
              onBack={() => { setView("entities"); setActivePuzzle(null); }}
            />
          )}

          {view === "achievements" && (
            <AchievementsView
              key="achievements"
              lang={lang}
              unlocked={achievements}
              onBack={() => setView("entities")}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// ─── ENTITY LIST ────────────────────────────────────────────────────────────────
function EntityList({
  lang, solved, onSelect, onShowAchievements, achievementCount,
}: {
  lang: Lang;
  solved: string[];
  onSelect: (e: EntityId) => void;
  onShowAchievements: () => void;
  achievementCount: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      className="flex flex-col gap-2.5"
    >
      {ENTITY_ORDER.map((id) => {
        const meta = ENTITIES[id];
        const unlocked = isEntityUnlocked(id, solved);
        const complete = isEntityComplete(id, solved);
        const puzzles = getEntityPuzzles(id);
        const entDone = puzzles.filter((p) => solved.includes(p.id)).length;

        return (
          <button
            key={id}
            disabled={!unlocked}
            onClick={() => unlocked && onSelect(id)}
            className={`text-start border p-3.5 transition-all ${
              unlocked
                ? "border-primary/20 hover:border-primary/45 bg-primary/3 hover:bg-primary/6"
                : "border-primary/8 bg-transparent opacity-50 cursor-not-allowed"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`text-xl ${unlocked ? meta.accent : "text-muted-foreground/30"}`}>
                  {unlocked ? meta.glyph : "🔒"}
                </span>
                <div className="min-w-0">
                  <p className={`text-sm tracking-[0.2em] ${unlocked ? "text-foreground/90" : "text-muted-foreground/40"}`}>
                    {meta.name[lang]}
                  </p>
                  <p className="text-[8px] text-muted-foreground/40 tracking-wider truncate">{meta.title[lang]}</p>
                </div>
              </div>
              <div className="text-end shrink-0">
                {!unlocked ? (
                  <p className="text-[7px] text-muted-foreground/40 tracking-widest uppercase">{T.locked[lang]}</p>
                ) : complete ? (
                  <p className="text-[8px] text-primary/60 tracking-widest uppercase">{T.complete[lang]}</p>
                ) : (
                  <p className="text-[9px] text-muted-foreground/50 tracking-widest font-mono">{entDone}/{puzzles.length}</p>
                )}
              </div>
            </div>
            {!unlocked && (
              <p className="text-[7px] text-muted-foreground/30 tracking-wider mt-2">{T.unlockHint[lang]}</p>
            )}
          </button>
        );
      })}

      <button
        onClick={onShowAchievements}
        className="mt-2 text-center border border-primary/12 hover:border-primary/30 py-2.5 text-[9px] tracking-[0.35em] text-muted-foreground/50 hover:text-primary/70 transition-all uppercase"
      >
        ✦ {T.achievements[lang]} ({achievementCount})
      </button>
    </motion.div>
  );
}

// ─── ENTITY PUZZLES ──────────────────────────────────────────────────────────────
function EntityPuzzles({
  entity, lang, solved, activePuzzle, onOpenPuzzle, onClosePuzzle, onSolve, onBack,
}: {
  entity: EntityId;
  lang: Lang;
  solved: string[];
  activePuzzle: string | null;
  onOpenPuzzle: (id: string) => void;
  onClosePuzzle: () => void;
  onSolve: (p: Puzzle) => void;
  onBack: () => void;
}) {
  const meta = ENTITIES[entity];
  const puzzles = useMemo(() => getEntityPuzzles(entity), [entity]);
  const current = activePuzzle ? getPuzzleById(activePuzzle) : undefined;

  if (current) {
    return (
      <PuzzleSolve
        key={current.id}
        puzzle={current}
        lang={lang}
        alreadySolved={solved.includes(current.id)}
        onSolve={onSolve}
        onBack={onClosePuzzle}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      className="flex flex-col gap-3"
    >
      <button onClick={onBack} className="text-[8px] tracking-[0.3em] text-muted-foreground/40 hover:text-primary/60 uppercase self-start">
        ‹ {T.back[lang]}
      </button>

      <div className="border border-primary/15 bg-primary/3 p-3.5">
        <div className="flex items-center gap-2">
          <span className={`text-lg ${meta.accent}`}>{meta.glyph}</span>
          <p className="text-sm text-foreground/90 tracking-[0.2em]">{meta.name[lang]}</p>
        </div>
        <p className="text-[9px] text-muted-foreground/55 tracking-wider leading-relaxed mt-2">{meta.intro[lang]}</p>
      </div>

      <div className="flex flex-col gap-2">
        {puzzles.map((p, i) => {
          const isSolved = solved.includes(p.id);
          const unlocked = isPuzzleUnlocked(p, solved);
          return (
            <button
              key={p.id}
              disabled={!unlocked}
              onClick={() => unlocked && onOpenPuzzle(p.id)}
              className={`text-start border p-3 transition-all flex items-center justify-between gap-3 ${
                unlocked
                  ? isSolved
                    ? "border-primary/30 bg-primary/6"
                    : "border-primary/15 hover:border-primary/40 bg-primary/2 hover:bg-primary/5"
                  : "border-primary/8 opacity-45 cursor-not-allowed"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`text-[10px] font-mono ${isSolved ? "text-primary/70" : "text-muted-foreground/40"}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className={`text-[11px] tracking-wide truncate ${isSolved ? "text-foreground/70" : unlocked ? "text-foreground/85" : "text-muted-foreground/40"}`}>
                  {unlocked ? p.title[lang] : "— — —"}
                </p>
              </div>
              <span className="text-[9px] shrink-0">
                {isSolved ? <span className="text-primary/70">✓ {T.solved[lang]}</span> : unlocked ? <span className="text-muted-foreground/40">›</span> : <span className="text-muted-foreground/30">🔒</span>}
              </span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── PUZZLE SOLVE ────────────────────────────────────────────────────────────────
function PuzzleSolve({
  puzzle, lang, alreadySolved, onSolve, onBack,
}: {
  puzzle: Puzzle;
  lang: Lang;
  alreadySolved: boolean;
  onSolve: (p: Puzzle) => void;
  onBack: () => void;
}) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [showStory, setShowStory] = useState(alreadySolved);
  const [showHint, setShowHint] = useState(false);

  const submit = () => {
    if (checkAnswer(puzzle, input)) {
      setError(false);
      if (!alreadySolved) onSolve(puzzle);
      setShowStory(true);
    } else {
      setError(true);
    }
  };

  if (showStory) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col gap-5 text-center py-2"
      >
        <p className="text-[9px] tracking-[0.4em] text-primary/50 uppercase">{T.storyTitle[lang]}</p>
        <div className="border border-primary/20 bg-primary/4 px-4 py-5">
          <p className="text-[13px] text-foreground/85 leading-loose tracking-wide" dir={lang === "ar" ? "rtl" : "ltr"}>
            {puzzle.storyReveal[lang]}
          </p>
        </div>
        {puzzle.achievement && (
          <p className="text-[9px] text-primary/55 tracking-wider">
            ✦ {getAchievement(puzzle.achievement)?.name[lang]}
          </p>
        )}
        <button
          onClick={onBack}
          className="w-full border border-primary/25 bg-primary/6 hover:bg-primary/14 text-primary/80 text-[10px] tracking-[0.35em] py-3 transition-all uppercase"
        >
          {T.continue[lang]}
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      className="flex flex-col gap-4"
    >
      <button onClick={onBack} className="text-[8px] tracking-[0.3em] text-muted-foreground/40 hover:text-primary/60 uppercase self-start">
        ‹ {T.back[lang]}
      </button>

      <p className="text-sm text-foreground/90 tracking-[0.15em]">{puzzle.title[lang]}</p>

      <div className="border border-primary/15 bg-primary/3 px-4 py-4">
        <p className="text-[12px] text-foreground/80 leading-loose tracking-wide" dir={lang === "ar" ? "rtl" : "ltr"}>
          {puzzle.prompt[lang]}
        </p>
      </div>

      {puzzle.hint && (
        <div>
          {showHint ? (
            <p className="text-[9px] text-muted-foreground/50 tracking-wider" dir={lang === "ar" ? "rtl" : "ltr"}>
              ◇ {puzzle.hint[lang]}
            </p>
          ) : (
            <button onClick={() => setShowHint(true)} className="text-[8px] tracking-[0.3em] text-muted-foreground/35 hover:text-primary/55 uppercase">
              ◇ {T.hint[lang]}
            </button>
          )}
        </div>
      )}

      <input
        type="text"
        value={input}
        autoFocus
        onChange={(e) => { setInput(e.target.value); setError(false); }}
        onKeyDown={(e) => e.key === "Enter" && input.trim() && submit()}
        placeholder={T.answerPlaceholder[lang]}
        className="w-full bg-transparent border border-primary/20 focus:border-primary/50 focus:outline-none text-foreground/85 text-sm px-4 py-3 placeholder:text-muted-foreground/30 tracking-wider rounded-none"
        dir={lang === "ar" ? "rtl" : "ltr"}
      />

      {error && (
        <p className="text-[9px] tracking-wider text-primary/70 text-center" dir={lang === "ar" ? "rtl" : "ltr"}>{T.wrong[lang]}</p>
      )}

      <button
        onClick={submit}
        disabled={!input.trim()}
        className="w-full border border-primary/30 bg-primary/8 hover:bg-primary/15 text-primary text-[10px] tracking-[0.35em] py-3 disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase"
      >
        {T.submit[lang]}
      </button>
    </motion.div>
  );
}

// ─── ACHIEVEMENTS VIEW ──────────────────────────────────────────────────────────
function AchievementsView({
  lang, unlocked, onBack,
}: {
  lang: Lang;
  unlocked: string[];
  onBack: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      className="flex flex-col gap-3"
    >
      <button onClick={onBack} className="text-[8px] tracking-[0.3em] text-muted-foreground/40 hover:text-primary/60 uppercase self-start">
        ‹ {T.back[lang]}
      </button>
      <p className="text-sm text-foreground/90 tracking-[0.2em]">✦ {T.achievements[lang]}</p>
      <div className="flex flex-col gap-2">
        {ACHIEVEMENTS.map((a) => {
          const has = unlocked.includes(a.id);
          return (
            <div
              key={a.id}
              className={`border p-3 flex items-center gap-3 ${has ? "border-primary/25 bg-primary/4" : "border-primary/8 opacity-45"}`}
            >
              <span className={`text-lg ${has ? "text-primary/80" : "text-muted-foreground/30"}`}>{has ? a.glyph : "🔒"}</span>
              <div className="min-w-0">
                <p className={`text-[11px] tracking-wide ${has ? "text-foreground/85" : "text-muted-foreground/40"}`}>
                  {has ? a.name[lang] : "— — —"}
                </p>
                <p className="text-[8px] text-muted-foreground/45 tracking-wider truncate">{has ? a.desc[lang] : ""}</p>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
