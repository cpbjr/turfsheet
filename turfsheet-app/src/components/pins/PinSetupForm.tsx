/**
 * Setup host: meta fields + Table | Map mode toggle. Both modes share session.pins.
 */

import { useState } from 'react';
import PinEntryTable from '@/components/pins/PinEntryTable';
import PinMapMode from '@/components/pins/PinMapMode';
import type { CourseMapHandle } from '@/components/maps/CourseMap';
import { AVOID_KINDS } from '@/lib/courseGeometry';
import type { GreenIndex, Pin, PinSession, PinSetStatus } from '@/types/courseMap';

type SetupMode = 'table' | 'map';

interface PinSetupFormProps {
  session: PinSession;
  greenIndex: GreenIndex;
  currentHole: number | null;
  holeNote: string;
  courseNote: string;
  saveMsg: string;
  mapRef?: React.RefObject<CourseMapHandle | null>;
  onMetaChange: (patch: Partial<Pick<PinSession, 'label' | 'playDate' | 'status' | 'startHole'>>) => void;
  onJumpToHole: (hole: number) => void;
  onSetPin: (hole: number, pin: Pin | null) => void;
  onMapClick: (lat: number, lng: number) => void;
  onGeoLoaded?: (index: GreenIndex, version: string) => void;
  onBack: () => void;
  onNext: () => void;
  onClearPin: () => void;
  onHoleNoteChange: (n: string) => void;
  onCourseNoteChange: (n: string) => void;
  onToggleAvoid: (scope: 'hole' | 'course', kind: string) => void;
  onSave: () => void;
  onDeliver: () => void;
  onCancel: () => void;
  onError?: (msg: string) => void;
}

const fieldClass =
  'w-full border border-border-color bg-panel-white px-2 py-1.5 text-sm font-sans text-text-primary';
const labelClass =
  'block text-[11px] font-heading font-black uppercase tracking-wide text-text-secondary mb-1';
const btnClass =
  'px-3 py-1.5 text-xs font-heading font-black uppercase tracking-wide border border-border-color bg-panel-white text-text-secondary hover:text-text-primary transition-colors';
const btnPrimary =
  'px-3 py-1.5 text-xs font-heading font-black uppercase tracking-wide border border-turf-green bg-turf-green text-white hover:bg-turf-green-dark transition-colors';

const STATUSES: PinSetStatus[] = ['draft', 'scheduled', 'active', 'archived'];

export default function PinSetupForm(props: PinSetupFormProps) {
  const {
    session,
    greenIndex,
    currentHole,
    holeNote,
    courseNote,
    saveMsg,
    mapRef,
    onMetaChange,
    onJumpToHole,
    onSetPin,
    onMapClick,
    onGeoLoaded,
    onBack,
    onNext,
    onClearPin,
    onHoleNoteChange,
    onCourseNoteChange,
    onToggleAvoid,
    onSave,
    onDeliver,
    onCancel,
    onError,
  } = props;

  const [mode, setMode] = useState<SetupMode>('table');

  const holeAvoidKinds = (
    currentHole != null ? session.avoid.holes[String(currentHole)] || [] : []
  ).map((x) => x.kind);
  const courseAvoidKinds = (session.avoid.course || []).map((x) => x.kind);

  const avoidChips = (kinds: string[], scope: 'hole' | 'course') => (
    <div className="flex flex-wrap gap-1">
      {AVOID_KINDS.map((kind) => {
        const on = kinds.includes(kind);
        return (
          <button
            key={kind}
            type="button"
            onClick={() => onToggleAvoid(scope, kind)}
            className={`px-2 py-1 text-[11px] font-sans border transition-colors ${
              on
                ? 'bg-accent-orange text-white border-accent-orange'
                : 'bg-panel-white text-text-secondary border-border-color hover:border-text-muted'
            }`}
          >
            {kind}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-3">
      {/* Meta header */}
      <div className="border border-border-color bg-panel-white p-3 space-y-3 shrink-0">
        {/* Hidden on phones in Map mode: this block is shrink-0 and ~280px tall, which floors
            the map at its min-h-[240px] and leaves the green unable to fill the frame. Switch
            to Table to edit these. Desktop has the height, so it keeps them. */}
        <div
          className={`grid-cols-2 md:grid-cols-4 gap-2 ${
            mode === 'map' ? 'hidden md:grid' : 'grid'
          }`}
        >
          <label className="block">
            <span className={labelClass}>Play date</span>
            <input
              type="date"
              value={session.playDate}
              onChange={(e) => onMetaChange({ playDate: e.target.value })}
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Status</span>
            <select
              value={session.status}
              onChange={(e) => onMetaChange({ status: e.target.value as PinSetStatus })}
              className={fieldClass}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>Start hole</span>
            <select
              value={String(session.startHole)}
              onChange={(e) => onMetaChange({ startHole: Number(e.target.value) })}
              className={fieldClass}
            >
              {Array.from({ length: 18 }, (_, i) => i + 1).map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>
          <label className="block col-span-2 md:col-span-1">
            <span className={labelClass}>Label</span>
            <input
              type="text"
              maxLength={80}
              value={session.label}
              onChange={(e) => onMetaChange({ label: e.target.value })}
              placeholder="Daily · Championship · …"
              className={fieldClass}
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex border border-border-color">
            <button
              type="button"
              onClick={() => setMode('table')}
              className={`px-3 py-1.5 text-xs font-heading font-black uppercase tracking-wide ${
                mode === 'table'
                  ? 'bg-turf-green text-white'
                  : 'bg-panel-white text-text-secondary hover:text-text-primary'
              }`}
            >
              Table
            </button>
            <button
              type="button"
              onClick={() => setMode('map')}
              className={`px-3 py-1.5 text-xs font-heading font-black uppercase tracking-wide border-l border-border-color ${
                mode === 'map'
                  ? 'bg-turf-green text-white'
                  : 'bg-panel-white text-text-secondary hover:text-text-primary'
              }`}
            >
              Map
            </button>
          </div>
          <button type="button" onClick={onSave} className={btnPrimary}>
            Save
          </button>
          <button type="button" onClick={onDeliver} className={btnClass}>
            Review & deliver
          </button>
          <button type="button" onClick={onCancel} className="text-xs font-sans text-red-600 underline ml-auto">
            Cancel / library
          </button>
          {saveMsg && (
            <span className="text-xs font-sans text-text-secondary w-full md:w-auto">{saveMsg}</span>
          )}
        </div>
      </div>

      {/* Mode body */}
      {mode === 'table' ? (
        <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
          {/* overflow-hidden (not auto): only the table column scrolls; preview floats */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <PinEntryTable
              key={`${session.id}:${session.playDate}:${session.label}`}
              session={session}
              greenIndex={greenIndex}
              currentHole={currentHole}
              onJumpToHole={onJumpToHole}
              onSetPin={onSetPin}
            />
          </div>
          <div className="border border-border-color bg-panel-white p-3 space-y-2 shrink-0">
            <div className="text-[11px] font-heading font-black uppercase tracking-wide text-text-primary">
              Avoid — hole {currentHole ?? '—'}
            </div>
            {avoidChips(holeAvoidKinds, 'hole')}
            <input
              type="text"
              maxLength={120}
              value={holeNote}
              onChange={(e) => onHoleNoteChange(e.target.value)}
              placeholder="Hole note"
              className={fieldClass}
            />
            <div className="text-[11px] font-heading font-black uppercase tracking-wide text-text-primary pt-1">
              Course-wide avoid
            </div>
            {avoidChips(courseAvoidKinds, 'course')}
            <input
              type="text"
              maxLength={160}
              value={courseNote}
              onChange={(e) => onCourseNoteChange(e.target.value)}
              placeholder="Course note"
              className={fieldClass}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col">
          <PinMapMode
            session={session}
            greenIndex={greenIndex}
            currentHole={currentHole}
            onMapClick={onMapClick}
            onGeoLoaded={onGeoLoaded}
            onJumpToHole={onJumpToHole}
            onBack={onBack}
            onNext={onNext}
            onClearPin={onClearPin}
            onSetPin={onSetPin}
            onError={onError}
            mapRef={mapRef}
          />
        </div>
      )}
    </div>
  );
}
