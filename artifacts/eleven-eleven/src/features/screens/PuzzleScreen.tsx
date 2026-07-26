import { HudPanel } from '../../ui/design-system';

export default function PuzzleScreen() {
  return (
    <div className="shell-screen shell-puzzle-screen">
      <header className="shell-screen-heading">
        <span className="shell-screen-code">04</span>
        <span>
          <small>PUZZLES</small>
          <h1>الألغاز</h1>
        </span>
      </header>

      <HudPanel
        className="shell-editor-empty shell-editor-empty--resource"
        tone="danger"
        eyebrow="PUZZLE ARCHIVE"
        title="بانتظار الإشارة التالية"
      >
        <p lang="en">No puzzles available yet.</p>
        <small>لا توجد ألغاز متاحة بعد.</small>
      </HudPanel>
    </div>
  );
}
