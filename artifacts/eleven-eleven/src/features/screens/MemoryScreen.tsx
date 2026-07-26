import { GlassPanel } from '../../ui/design-system';

export default function MemoryScreen() {
  return (
    <div className="shell-screen shell-memory-screen">
      <header className="shell-screen-heading">
        <span className="shell-screen-code">03</span>
        <span>
          <small>MEMORIES</small>
          <h1>الذكريات</h1>
        </span>
      </header>

      <GlassPanel
        className="shell-editor-empty shell-editor-empty--resource"
        tone="memory"
        eyebrow="MEMORY ARCHIVE"
        title="الأرشيف صامت"
      >
        <p lang="en">No memory fragments collected yet.</p>
        <small>لم يتم جمع أي شظايا ذاكرة بعد.</small>
      </GlassPanel>
    </div>
  );
}
