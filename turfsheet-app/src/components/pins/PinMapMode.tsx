/**
 * Setup Map mode: CourseMap pinMode + compact mobile bottom sheet (≤ ~40% height).
 */

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import CourseMap from '@/components/maps/CourseMap';
import type { CourseMapHandle } from '@/components/maps/CourseMap';
import { DEFAULT_SHOW, formatPinStats, placePinFromYards } from '@/lib/courseGeometry';
import type { GreenIndex, PinSession } from '@/types/courseMap';

interface PinMapModeProps {
  session: PinSession;
  greenIndex: GreenIndex;
  currentHole: number | null;
  onMapClick: (lat: number, lng: number) => void;
  onGeoLoaded?: (index: GreenIndex, version: string) => void;
  onJumpToHole: (hole: number) => void;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  onClearPin: () => void;
  onSetPin: (hole: number, pin: import('@/types/courseMap').Pin | null) => void;
  onError?: (msg: string) => void;
  mapRef?: React.RefObject<CourseMapHandle | null>;
}

const btnClass =
  'px-3 py-1.5 text-xs font-heading font-black uppercase tracking-wide border border-border-color bg-panel-white text-text-secondary hover:text-text-primary transition-colors';
const btnPrimary =
  'px-3 py-1.5 text-xs font-heading font-black uppercase tracking-wide border border-turf-green bg-turf-green text-white hover:bg-turf-green-dark transition-colors';
const fieldClass =
  'w-full border border-border-color bg-panel-white px-2 py-1 text-sm font-sans text-text-primary tabular-nums';

export default function PinMapMode({
  session,
  greenIndex,
  currentHole,
  onMapClick,
  onGeoLoaded,
  onJumpToHole,
  onBack,
  onNext,
  onSkip,
  onClearPin,
  onSetPin,
  onError,
  mapRef: externalMapRef,
}: PinMapModeProps) {
  const localMapRef = useRef<CourseMapHandle | null>(null);
  const mapRef = externalMapRef ?? localMapRef;
  const [sheetOpen, setSheetOpen] = useState(true);
  const [editOn, setEditOn] = useState('');
  const [editSide, setEditSide] = useState<'L' | 'C' | 'R'>('C');
  const [editLr, setEditLr] = useState('');
  const [editErr, setEditErr] = useState('');

  const pin = currentHole != null ? session.pins[currentHole] : null;

  // Sync edit fields when hole/pin changes
  useEffect(() => {
    if (pin?.ok) {
      setEditOn(pin.onYd != null ? String(pin.onYd) : '');
      setEditSide(pin.lrSide || 'C');
      setEditLr(pin.lrSide === 'C' || pin.lrYd == null ? '' : String(pin.lrYd));
    } else {
      setEditOn('');
      setEditSide('C');
      setEditLr('');
    }
    setEditErr('');
  }, [currentHole, pin?.onYd, pin?.lrSide, pin?.lrYd, pin?.ok]);

  const applyYardsNudge = () => {
    if (currentHole == null) return;
    const onYd = Number(editOn);
    if (!Number.isFinite(onYd) || !Number.isInteger(onYd) || onYd < 0) {
      setEditErr('Depth must be a whole number ≥ 0');
      return;
    }
    let lrYd: number | undefined;
    if (editSide !== 'C') {
      lrYd = Number(editLr);
      if (!Number.isFinite(lrYd) || !Number.isInteger(lrYd) || lrYd < 0) {
        setEditErr('Yards must be a whole number ≥ 0');
        return;
      }
    }
    const result = placePinFromYards(greenIndex, currentHole, {
      onYd,
      side: editSide,
      lrYd,
    });
    if (!result.ok) {
      setEditErr(result.reason);
      return;
    }
    setEditErr('');
    onSetPin(currentHole, result.pin);
  };

  return (
    <div className="relative flex-1 min-h-0 flex flex-col">
      <div className="relative flex-1 min-h-[240px] md:min-h-0">
        <CourseMap
          ref={mapRef}
          show={{ ...DEFAULT_SHOW, irrigation: false }}
          holeFilter={currentHole != null ? String(currentHole) : 'all'}
          pins={session.pins}
          pinMode
          onMapClick={onMapClick}
          onGeoLoaded={onGeoLoaded}
          onError={onError}
        />
      </div>

      {/* Bottom sheet ≤ ~40% on phone; side rail on md+ */}
      <div
        className={
          `border-border-color bg-dashboard-bg shadow-lg flex flex-col shrink-0 ` +
          `border-t max-h-[40vh] md:max-h-none md:border-t-0 md:border-l ` +
          `md:absolute md:top-0 md:right-0 md:bottom-0 md:w-72 md:max-w-[40%]`
        }
      >
        <div className="flex items-center justify-between px-3 py-2 border-b border-border-color bg-panel-white shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl font-heading font-black text-turf-green tabular-nums">
              {currentHole ?? '—'}
            </span>
            <div className="min-w-0">
              <div className="text-[11px] font-heading font-black uppercase tracking-wide text-text-primary truncate">
                Hole {currentHole ?? '—'} · {session.index + 1}/18
              </div>
              <div className="text-[11px] font-sans text-text-secondary truncate">
                {pin?.ok
                  ? formatPinStats(pin)
                  : 'Tap the green to drop the pin'}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="md:hidden text-turf-green border border-turf-green/40 px-2 py-0.5 text-[10px] font-heading font-black uppercase"
            onClick={() => setSheetOpen((v) => !v)}
          >
            {sheetOpen ? (
              <>
                Map <ChevronDown className="w-3 h-3 inline" />
              </>
            ) : (
              <>
                Details <ChevronUp className="w-3 h-3 inline" />
              </>
            )}
          </button>
        </div>

        <div
          className={`p-3 space-y-3 overflow-y-auto min-h-0 ${
            sheetOpen ? '' : 'hidden md:block'
          }`}
        >
          <div className="grid grid-cols-4 gap-1">
            <button type="button" onClick={onBack} className={btnClass}>
              Back
            </button>
            <button type="button" onClick={onSkip} className={btnClass}>
              Skip
            </button>
            <button type="button" onClick={onClearPin} className={btnClass}>
              Clear
            </button>
            <button type="button" onClick={onNext} className={btnPrimary}>
              Next
            </button>
          </div>

          <div className="grid grid-cols-9 gap-1">
            {Array.from({ length: 18 }, (_, i) => i + 1).map((h) => {
              const isSet = !!session.pins[h];
              const isCurrent = currentHole === h;
              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => onJumpToHole(h)}
                  className={`py-1 text-[11px] font-heading font-black tabular-nums border ${
                    isCurrent
                      ? 'border-turf-green ring-1 ring-turf-green text-turf-green bg-turf-green/10'
                      : isSet
                        ? 'bg-turf-green text-white border-turf-green'
                        : 'bg-panel-white text-text-secondary border-border-color'
                  }`}
                >
                  {h}
                </button>
              );
            })}
          </div>

          <div className="border border-border-color bg-panel-white p-2 space-y-2">
            <div className="text-[10px] font-heading font-black uppercase tracking-wide text-text-muted">
              Nudge by yards
            </div>
            <div className="grid grid-cols-3 gap-1">
              <label className="block">
                <span className="text-[10px] text-text-muted">Depth</span>
                <input
                  className={fieldClass}
                  value={editOn}
                  onChange={(e) => setEditOn(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-[10px] text-text-muted">Side</span>
                <select
                  className={fieldClass}
                  value={editSide}
                  onChange={(e) => setEditSide(e.target.value as 'L' | 'C' | 'R')}
                >
                  <option value="L">L</option>
                  <option value="C">C</option>
                  <option value="R">R</option>
                </select>
              </label>
              <label className="block">
                <span className="text-[10px] text-text-muted">Yards</span>
                <input
                  className={fieldClass}
                  disabled={editSide === 'C'}
                  value={editSide === 'C' ? '' : editLr}
                  onChange={(e) => setEditLr(e.target.value)}
                />
              </label>
            </div>
            <button type="button" onClick={applyYardsNudge} className={`${btnClass} w-full`}>
              Apply yards
            </button>
            {editErr && <div className="text-[11px] text-red-600 font-sans">{editErr}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
