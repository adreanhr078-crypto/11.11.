import { useState } from 'react';
import {
  Battery,
  BookOpenText,
  Cross,
  KeyRound,
  PackageOpen,
  X,
} from 'lucide-react';
import {
  AWAKENING_WARD_INVENTORY_CAPACITY,
  WARD_CLUE_CATALOG,
  WARD_ITEM_CATALOG,
} from '../domain/awakeningWardState';
import type {
  AwakeningWardSaveState,
  WardItemId,
} from '../domain/awakeningWardTypes';

function ItemIcon({ id }: { id: WardItemId }) {
  if (id === 'keycard_a07') return <KeyRound />;
  if (id === 'medical_patch') return <Cross />;
  return <Battery />;
}

interface InventoryPanelProps {
  state: AwakeningWardSaveState;
  initialTab?: 'inventory' | 'clues';
  onUseMedicalPatch: () => void;
  onClose: () => void;
}

export function InventoryPanel({
  state,
  initialTab = 'inventory',
  onUseMedicalPatch,
  onClose,
}: InventoryPanelProps) {
  const [tab, setTab] = useState(initialTab);
  const slots = Array.from({ length: AWAKENING_WARD_INVENTORY_CAPACITY });

  return (
    <div className="ward-puzzle-backdrop">
      <section
        className="ward-inventory-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ward-inventory-title"
      >
        <header>
          <span>FIELD STORAGE // 06 SLOTS</span>
          <h2 id="ward-inventory-title">
            {tab === 'inventory' ? 'الحقيبة' : 'سجل الأدلة'}
          </h2>
          <button
            type="button"
            className="ward-icon-button"
            onClick={onClose}
            aria-label="إغلاق"
            title="إغلاق"
          >
            <X />
          </button>
        </header>

        <div className="ward-segmented-control" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'inventory'}
            onClick={() => setTab('inventory')}
          >
            <PackageOpen />
            <span>الأدوات</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'clues'}
            onClick={() => setTab('clues')}
          >
            <BookOpenText />
            <span>الأدلة</span>
            <b>{state.collectedClues.length}</b>
          </button>
        </div>

        {tab === 'inventory' ? (
          <div className="ward-inventory-grid">
            {slots.map((_, index) => {
              const entry = state.inventory[index];
              if (!entry) {
                return (
                  <div className="ward-inventory-slot" data-empty key={index}>
                    <span>0{index + 1}</span>
                  </div>
                );
              }
              const item = WARD_ITEM_CATALOG[entry.id];
              return (
                <article className="ward-inventory-slot" key={entry.id}>
                  <span>0{index + 1}</span>
                  <ItemIcon id={entry.id} />
                  <strong>{item.name}</strong>
                  <small>{item.description}</small>
                  {entry.quantity > 1 && <b>×{entry.quantity}</b>}
                  {entry.id === 'medical_patch' && (
                    <button
                      type="button"
                      onClick={onUseMedicalPatch}
                      disabled={state.health >= 100}
                    >
                      استخدام
                    </button>
                  )}
                  {item.essential && <em>ESSENTIAL</em>}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="ward-clue-log">
            {state.collectedClues.length === 0 ? (
              <p>لا توجد إشارات محفوظة بعد.</p>
            ) : state.collectedClues.map((clueId, index) => (
              <article key={clueId}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <strong>{WARD_CLUE_CATALOG[clueId].title}</strong>
                  <p>{WARD_CLUE_CATALOG[clueId].body}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
