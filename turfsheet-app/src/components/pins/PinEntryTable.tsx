/**
 * Darryl-style 18-row yards table: Hole | GD | Depth | L/C/R | Yards | readout.
 */

import { useMemo, useState } from 'react';
import GreenPreview from '@/components/pins/GreenPreview';
import { formatPinStats, placePinFromYards } from '@/lib/courseGeometry';
import type { GreenIndex, Pin, PinMap, PinSession } from '@/types/courseMap';

type Side = 'L' | 'C' | 'R';

interface RowDraft {
  onYd: string;
  side: Side;
  lrYd: string;
  error?: string;
  warnings?: string[];
}

interface PinEntryTableProps {
  session: PinSession;
  greenIndex: GreenIndex;
  currentHole: number | null;
  onJumpToHole: (hole: number) => void;
  onSetPin: (hole: number, pin: Pin | null) => void;
}

const fieldClass =
  'w-full border border-border-color bg-panel-white px-1.5 py-1 text-sm font-sans text-text-primary tabular-nums';
const sideBtn =
  'px-2 py-1 text-[11px] font-heading font-black border transition-colors min-w-[1.75rem]';

function draftFromPin(pin: Pin | undefined): RowDraft {
  if (!pin || !pin.ok) {
    return { onYd: '', side: 'C', lrYd: '' };
  }
  return {
    onYd: pin.onYd != null ? String(pin.onYd) : '',
    side: pin.lrSide || 'C',
    lrYd: pin.lrSide === 'C' || pin.lrYd == null ? '' : String(pin.lrYd),
  };
}

export default function PinEntryTable({
  session,
  greenIndex,
  currentHole,
  onJumpToHole,
  onSetPin,
}: PinEntryTableProps) {
  /**
   * Local edit buffers keyed by hole so partial typing doesn't thrash geometry.
   * The parent keys this component on the session identity, so opening a different saved set
   * or starting a new sheet remounts it and clears these — no reset effect needed.
   */
  const [drafts, setDrafts] = useState<Record<number, RowDraft>>({});

  const order = session.order.length === 18 ? session.order : Array.from({ length: 18 }, (_, i) => i + 1);

  const getDraft = (hole: number): RowDraft => {
    if (drafts[hole]) return drafts[hole];
    return draftFromPin(session.pins[hole]);
  };

  const applyDraft = (hole: number, next: RowDraft) => {
    setDrafts((d) => ({ ...d, [hole]: next }));

    const onRaw = next.onYd.trim();
    if (onRaw === '') {
      onSetPin(hole, null);
      return;
    }
    const onYd = Number(onRaw);
    if (!Number.isFinite(onYd) || !Number.isInteger(onYd) || onYd < 0) {
      setDrafts((d) => ({
        ...d,
        [hole]: { ...next, error: 'Depth must be a whole number ≥ 0', warnings: [] },
      }));
      return;
    }

    let lrYd: number | undefined;
    if (next.side !== 'C') {
      const lrRaw = next.lrYd.trim();
      if (lrRaw === '') {
        setDrafts((d) => ({
          ...d,
          [hole]: { ...next, error: 'Yards required for L/R', warnings: [] },
        }));
        return;
      }
      lrYd = Number(lrRaw);
      if (!Number.isFinite(lrYd) || !Number.isInteger(lrYd) || lrYd < 0) {
        setDrafts((d) => ({
          ...d,
          [hole]: { ...next, error: 'Yards must be a whole number ≥ 0', warnings: [] },
        }));
        return;
      }
    }

    const result = placePinFromYards(greenIndex, hole, {
      onYd,
      side: next.side,
      lrYd,
    });

    if (!result.ok) {
      setDrafts((d) => ({
        ...d,
        [hole]: { ...next, error: result.reason, warnings: [] },
      }));
      return;
    }

    setDrafts((d) => ({
      ...d,
      [hole]: { ...next, error: undefined, warnings: result.warnings },
    }));
    onSetPin(hole, result.pin);
  };

  const previewHole = currentHole ?? order[0] ?? 1;
  const previewPin = session.pins[previewHole] ?? null;

  const setCount = useMemo(
    () => Object.keys(session.pins as PinMap).filter((h) => session.pins[Number(h)]?.ok).length,
    [session.pins]
  );

  return (
    // Table scrolls on its own; green preview stays pinned (does not ride with rows).
    <div className="flex flex-col lg:flex-row gap-3 min-h-0 h-full">
      <div className="flex-1 min-w-0 min-h-0 overflow-auto border border-border-color bg-panel-white">
        <div className="sticky top-0 z-10 bg-panel-white border-b border-border-color px-3 py-2 flex items-center justify-between">
          <span className="text-[11px] font-heading font-black uppercase tracking-wide text-text-secondary">
            Yards entry · {setCount}/18 set
          </span>
          <span className="text-[11px] font-sans text-text-muted">
            Depth = on from front · L/R = nearest side edge
          </span>
        </div>
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-9 bg-dashboard-bg z-[5]">
            <tr className="text-[10px] font-heading font-black uppercase tracking-wide text-text-muted border-b border-border-color">
              <th className="px-2 py-1.5 w-12">Hole</th>
              <th className="px-2 py-1.5 w-12">GD</th>
              <th className="px-2 py-1.5 w-16">Depth</th>
              <th className="px-2 py-1.5 w-28">L / C / R</th>
              <th className="px-2 py-1.5 w-16">Yards</th>
              <th className="px-2 py-1.5">Readout</th>
            </tr>
          </thead>
          <tbody>
            {order.map((hole) => {
              const draft = getDraft(hole);
              const pin = session.pins[hole];
              const g = greenIndex[hole];
              const gd = g ? Math.round(g.depthYd) : '—';
              const isCurrent = currentHole === hole;
              return (
                <tr
                  key={hole}
                  id={`pin-row-${hole}`}
                  onClick={() => onJumpToHole(hole)}
                  className={`border-b border-border-color/60 cursor-pointer ${
                    isCurrent ? 'bg-turf-green/10 ring-1 ring-inset ring-turf-green/40' : 'hover:bg-panel-white'
                  }`}
                >
                  <td className="px-2 py-1.5 text-sm font-heading font-black tabular-nums text-turf-green">
                    {hole}
                  </td>
                  <td className="px-2 py-1.5 text-xs font-sans tabular-nums text-text-muted">{gd}</td>
                  <td className="px-2 py-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step={1}
                      value={draft.onYd}
                      placeholder="—"
                      className={fieldClass}
                      onChange={(e) => applyDraft(hole, { ...draft, onYd: e.target.value })}
                      onFocus={() => onJumpToHole(hole)}
                    />
                  </td>
                  <td className="px-2 py-1" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-0.5">
                      {(['L', 'C', 'R'] as Side[]).map((s) => (
                        <button
                          key={s}
                          type="button"
                          className={`${sideBtn} ${
                            draft.side === s
                              ? 'bg-turf-green text-white border-turf-green'
                              : 'bg-panel-white text-text-secondary border-border-color'
                          }`}
                          onClick={() => {
                            onJumpToHole(hole);
                            applyDraft(hole, {
                              ...draft,
                              side: s,
                              lrYd: s === 'C' ? '' : draft.lrYd,
                            });
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="px-2 py-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step={1}
                      disabled={draft.side === 'C'}
                      value={draft.side === 'C' ? '' : draft.lrYd}
                      placeholder={draft.side === 'C' ? '—' : '0'}
                      className={`${fieldClass} disabled:opacity-40`}
                      onChange={(e) => applyDraft(hole, { ...draft, lrYd: e.target.value })}
                      onFocus={() => onJumpToHole(hole)}
                    />
                  </td>
                  <td className="px-2 py-1.5 text-xs font-sans min-w-[8rem]">
                    {draft.error ? (
                      <span className="text-red-600">{draft.error}</span>
                    ) : pin?.ok ? (
                      <span className="text-text-primary">
                        {formatPinStats(pin)}
                        {draft.warnings && draft.warnings.length > 0 && (
                          <span className="block text-accent-orange text-[10px] mt-0.5">
                            {draft.warnings[0]}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Floated preview: outside the table scroller so it stays in view for all holes */}
      <aside
        className={
          'order-first lg:order-last w-full lg:w-56 shrink-0 self-start ' +
          'sticky top-0 z-20 ' +
          'border border-border-color bg-panel-white p-3 space-y-2 ' +
          'shadow-sm'
        }
        aria-label={`Hole ${previewHole} green preview`}
      >
        <div className="text-[11px] font-heading font-black uppercase tracking-wide text-text-secondary">
          Hole {previewHole} preview
        </div>
        <GreenPreview
          hole={previewHole}
          greenIndex={greenIndex}
          pin={previewPin}
          className="w-full"
          size={200}
        />
        <p className="text-[11px] font-sans text-text-muted">
          {previewPin?.ok ? formatPinStats(previewPin) : 'Enter depth + side to place'}
        </p>
      </aside>
    </div>
  );
}
