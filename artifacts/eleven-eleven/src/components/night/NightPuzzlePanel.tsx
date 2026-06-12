/**
 * NightPuzzlePanel — لوحة الألغاز في النظام الليلي
 * تستند إلى الصور 01, 09, 11, 12
 * ألغاز داكنة مع مؤشرات تقدم وحالات (مكتمل/قيد التقدم/مقفل)
 */

import React from "react";

interface NightPuzzle {
  id: string;
  title: string;
  progress: number;
  status: "مكتمل" | "قيد التقدم" | "مقفل";
  difficulty: "بسيط" | "عادي" | "صعب";
}

const SAMPLE_PUZZLES: NightPuzzle[] = [
  { id: "p1", title: "لغز المرايا", progress: 72, status: "قيد التقدم", difficulty: "صعب" },
  { id: "p2", title: "لغز الظلال", progress: 45, status: "قيد التقدم", difficulty: "عادي" },
  { id: "p3", title: "لغز الباب المغلق", progress: 20, status: "قيد التقدم", difficulty: "صعب" },
  { id: "p4", title: "كسر المرآة", progress: 100, status: "مكتمل", difficulty: "بسيط" },
  { id: "p5", title: "رسالة غير مكتملة", progress: 65, status: "قيد التقدم", difficulty: "عادي" },
  { id: "p6", title: "الزهور الذابلة", progress: 100, status: "مكتمل", difficulty: "بسيط" },
  { id: "p7", title: "الصوت الثالث", progress: 100, status: "مكتمل", difficulty: "عادي" },
  { id: "p8", title: "الساعة المتوقفة", progress: 100, status: "مكتمل", difficulty: "عادي" },
  { id: "p9", title: "لغز مجهول", progress: 0, status: "مقفل", difficulty: "صعب" },
];

interface NightPuzzlePanelProps {
  puzzles?: NightPuzzle[];
  completedCount?: number;
  inProgressCount?: number;
  lockedCount?: number;
}

export const NightPuzzlePanel: React.FC<NightPuzzlePanelProps> = ({
  puzzles = SAMPLE_PUZZLES,
  completedCount = 5,
  inProgressCount = 3,
  lockedCount = 1,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "مكتمل": return "#6AAA8B";
      case "قيد التقدم": return "#D4A84B";
      case "مقفل": return "#6A6866";
      default: return "#6A6866";
    }
  };

  const activePuzzles = puzzles.filter(p => p.status !== "مكتمل" && p.status !== "مقفل").slice(0, 3);
  const completedPuzzles = puzzles.filter(p => p.status === "مكتمل");

  return (
    <div className="night-puzzles" dir="rtl">
      <div className="puzzles-header">
        <h3 className="puzzles-title">الألغاز</h3>
        <div className="puzzles-stats">
          <span className="puzzles-stat" style={{ color: "#6AAA8B" }}>{completedCount} مكتملة</span>
          <span className="puzzles-stat" style={{ color: "#D4A84B" }}>{inProgressCount} قيد التقدم</span>
          <span className="puzzles-stat" style={{ color: "#6A6866" }}>{lockedCount} مقفلة</span>
        </div>
      </div>

      {/* الألغاز النشطة */}
      <div className="puzzles-active">
        {activePuzzles.map((puzzle) => (
          <div key={puzzle.id} className="night-puzzle-card">
            <div className="puzzle-card-header">
              <h4 className="puzzle-card-title">{puzzle.title}</h4>
              <span className="puzzle-difficulty" style={{
                color: puzzle.difficulty === "صعب" ? "#CC4444" : puzzle.difficulty === "عادي" ? "#D4A84B" : "#6AAA8B"
              }}>
                {puzzle.difficulty}
              </span>
            </div>
            <div className="puzzle-card-progress">
              <div className="puzzle-progress-track">
                <div className="puzzle-progress-fill" style={{
                  width: `${puzzle.progress}%`,
                  background: `linear-gradient(90deg, #8B2A2A, ${getStatusColor(puzzle.status)})`
                }} />
              </div>
              <span className="puzzle-progress-value">{puzzle.progress}%</span>
            </div>
            <span className="puzzle-status" style={{ color: getStatusColor(puzzle.status) }}>
              {puzzle.status}
            </span>
          </div>
        ))}
      </div>

      {/* الألغاز المكتملة (مختصرة) */}
      <div className="puzzles-completed">
        <h4 className="completed-title">المكتملة</h4>
        <div className="completed-grid">
          {completedPuzzles.slice(0, 4).map((puzzle) => (
            <div key={puzzle.id} className="completed-chip">
              <span className="completed-check">✓</span>
              <span className="completed-name">{puzzle.title}</span>
            </div>
          ))}
          {completedPuzzles.length > 4 && (
            <span className="completed-more">+{completedPuzzles.length - 4}</span>
          )}
        </div>
      </div>

      <button className="puzzles-view-all">
        عرض كل الألغاز ←
      </button>
    </div>
  );
};