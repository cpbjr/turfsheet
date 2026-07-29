import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, RefreshCw, Trash2, X } from 'lucide-react';
import { AVOID_KINDS, formatPinStats } from '@/lib/courseGeometry';
import { listPinSets } from '@/lib/pinSets';
import type { PinSession, PinSetStatus, PinSetSummary } from '@/types/courseMap';

const STATUSES: PinSetStatus[] = ['draft', 'scheduled', 'active', 'archived'];

interface PinPanelProps {
  onClose: () => void;
  active: boolean;
  session: PinSession;
  currentHole: number | null;
  draftAvailable: boolean;
  /** Bumped after each save so the saved-sets list refetches. */
  reloadListToken: number;

  onStart: () => void;
  onResume: () => void;
  onDiscardLocalDraft: () => void;
  onLoadSet: (id: string) => void;
  onDeleteSet: (id: string) => Promise<void> | void;

  onMetaChange: (patch: Partial<Pick<PinSession, 'label' | 'playDate' | 'status' | 'startHole'>>) => void;

  onBack: () => void;
  onSkip: () => void;
  onClearPin: () => void;
  onNext: () => void;
  onJumpToHole: (hole: number) => void;

  holeNote: string;
  courseNote: string;
  onHoleNoteChange: (note: string) => void;
  onCourseNoteChange: (note: string) => void;
  onToggleAvoid: (scope: 'hole' | 'course', kind: string) => void;

  onSave: () => void;
  onFinish: () => void;
  onEnableToken: () => void;
  onCancel: () => void;
  saveMsg: string;
}

const fieldClass =
  'w-full border border-border-color bg-panel-white px-2 py-1.5 text-sm font-sans text-text-primary';
const labelClass =
  'block text-[11px] font-heading font-black uppercase tracking-wide text-text-secondary mb-1';
const btnClass =
  'px-3 py-1.5 text-xs font-heading font-black uppercase tracking-wide border border-border-color bg-panel-white text-text-secondary hover:text-text-primary hover:border-text-muted transition-colors';
const btnPrimary =
  'px-3 py-1.5 text-xs font-heading font-black uppercase tracking-wide border border-turf-green bg-turf-green text-white hover:bg-turf-green-dark transition-colors';

export default function PinPanel(props: PinPanelProps) {
  const {
    onClose,
    active,
    session,
    currentHole,
    draftAvailable,
    reloadListToken,
    onStart,
    onResume,
    onDiscardLocalDraft,
    onLoadSet,
    onDeleteSet,
    onMetaChange,
    onBack,
    onSkip,
    onClearPin,
    onNext,
    onJumpToHole,
    holeNote,
    courseNote,
    onHoleNoteChange,
    onCourseNoteChange,
    onToggleAvoid,
    onSave,
    onFinish,
    onEnableToken,
    onCancel,
    saveMsg,
  } = props;

  const [sets, setSets] = useState<PinSetSummary[]>([]);
  const [listMsg, setListMsg] = useState('Loading saved sets…');
  const [listReload, setListReload] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  /** Mobile: collapsed sheet leaves most of the map free for pin taps. */
  const [mobileExpanded, setMobileExpanded] = useState(true);

  useEffect(() => {
    if (active) return;
    let cancelled = false;
    listPinSets()
      .then((rows) => {
        if (cancelled) return;
        setSets(rows);
        setListMsg(rows.length ? '' : 'No saved sets yet.');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setSets([]);
        setListMsg(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [active, listReload, reloadListToken]);

  // When starting a pin session on a phone, collapse so the green is tappable.
  useEffect(() => {
    if (active) setMobileExpanded(false);
    else setMobileExpanded(true);
  }, [active]);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = sets.filter((r) => r.play_date >= today && r.status !== 'archived');
  const past = sets.filter((r) => r.play_date < today || r.status === 'archived');

  const currentPin = currentHole != null ? session.pins[currentHole] : null;
  const holeAvoidKinds = (currentHole != null ? session.avoid.holes[String(currentHole)] || [] : []).map(
    (x) => x.kind
  );
  const courseAvoidKinds = (session.avoid.course || []).map((x) => x.kind);

  const handleDelete = async (id: string, label: string) => {
    const name = label || 'this pin set';
    if (!window.confirm(`Delete “${name}”? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await onDeleteSet(id);
      setSets((prev) => {
        const next = prev.filter((r) => r.id !== id);
        if (!next.length) setListMsg('No saved sets yet.');
        return next;
      });
    } catch (err) {
      window.alert(err instanceof Error ? err.message : String(err));
    } finally {
      setDeletingId(null);
    }
  };

  const renderSection = (title: string, rows: PinSetSummary[]) =>
    rows.length > 0 && (
      <div key={title}>
        <div className="text-[11px] font-heading font-black uppercase tracking-wide text-text-muted mt-3 mb-1">
          {title}
        </div>
        {rows.map((r) => (
          <div
            key={r.id}
            className="w-full flex items-center gap-1 border border-border-color bg-panel-white mb-1"
          >
            <button
              type="button"
              onClick={() => onLoadSet(r.id)}
              className="flex-1 min-w-0 flex items-center gap-2 px-2 py-1.5 text-left hover:bg-turf-green/5 transition-colors"
            >
              <span className="text-xs font-sans text-text-primary tabular-nums shrink-0">
                {r.play_date}
              </span>
              <span className="flex-1 text-xs font-sans text-text-secondary truncate">
                {r.label || '(no label)'}
              </span>
              <span className="text-[10px] font-heading font-black uppercase tracking-wide text-turf-green shrink-0">
                {r.status}
              </span>
            </button>
            <button
              type="button"
              title={`Delete ${r.label || r.play_date}`}
              disabled={deletingId === r.id}
              onClick={() => void handleDelete(r.id, r.label || r.play_date)}
              className="shrink-0 px-2 py-1.5 text-red-600 hover:bg-red-50 disabled:opacity-40 border-l border-border-color"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    );

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

  const navStrip = (
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
  );

  const holeGrid = (
    <div className="grid grid-cols-9 gap-1">
      {Array.from({ length: 18 }, (_, i) => i + 1).map((h) => {
        const isSet = !!session.pins[h];
        const isSkipped = !!session.skipped[h] && !isSet;
        const isCurrent = currentHole === h;
        const hasAvoid = (session.avoid.holes[String(h)] || []).length > 0;
        return (
          <button
            key={h}
            type="button"
            onClick={() => onJumpToHole(h)}
            title={isSet ? `Hole ${h}: ${formatPinStats(session.pins[h])}` : `Jump to hole ${h}`}
            className={`relative py-1 text-[11px] font-heading font-black tabular-nums border transition-colors ${
              isCurrent
                ? 'border-turf-green ring-1 ring-turf-green text-turf-green bg-turf-green/10'
                : isSet
                  ? 'bg-turf-green text-white border-turf-green'
                  : isSkipped
                    ? 'bg-panel-white text-text-muted border-dashed border-text-muted'
                    : 'bg-panel-white text-text-secondary border-border-color hover:border-text-muted'
            }`}
          >
            {h}
            {hasAvoid && <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-accent-orange" />}
          </button>
        );
      })}
    </div>
  );

  return (
    <aside
      aria-label="Pin sheet setup"
      className={
        // Mobile: bottom sheet so the map stays tappable above.
        // Desktop (md+): full-height right rail (previous layout).
        `absolute z-20 border-border-color bg-dashboard-bg shadow-lg flex flex-col ` +
        `left-0 right-0 bottom-0 border-t max-h-[min(48vh,420px)] ` +
        `md:left-auto md:top-0 md:bottom-0 md:right-0 md:h-full md:w-full md:max-w-sm md:max-h-none md:border-t-0 md:border-l ` +
        (active && !mobileExpanded
          ? 'max-h-none h-auto'
          : mobileExpanded
            ? ''
            : '')
      }
    >
      <div className="flex items-center justify-between border-b border-border-color bg-panel-white px-4 py-3 sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-sm font-heading font-black uppercase tracking-tight text-text-primary">
            Pin Sheet
          </h2>
          {active && (
            <button
              type="button"
              className="md:hidden inline-flex items-center gap-1 text-[10px] font-heading font-black uppercase tracking-wide text-turf-green border border-turf-green/40 px-2 py-0.5"
              onClick={() => setMobileExpanded((v) => !v)}
              title={mobileExpanded ? 'Collapse panel to free the map' : 'Expand panel'}
            >
              {mobileExpanded ? (
                <>
                  Map <ChevronDown className="w-3 h-3" />
                </>
              ) : (
                <>
                  Details <ChevronUp className="w-3 h-3" />
                </>
              )}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          title="Close"
          className="text-text-secondary hover:text-text-primary"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Compact mobile bar while placing pins — map fills the rest of the screen */}
      {active && !mobileExpanded && (
        <div className="md:hidden p-3 space-y-2 border-b border-border-color bg-panel-white">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-heading font-black text-turf-green tabular-nums leading-none">
              {currentHole ?? '—'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-heading font-black uppercase tracking-wide text-text-primary">
                Hole {currentHole ?? '—'} · {session.index + 1}/18
              </div>
              <div
                className={`text-[11px] font-sans truncate ${
                  currentPin ? 'text-text-primary' : 'text-text-muted'
                }`}
              >
                {currentPin
                  ? formatPinStats(currentPin)
                  : currentHole != null && session.skipped[currentHole]
                    ? 'Skipped'
                    : 'Tap the green to drop the pin'}
              </div>
            </div>
          </div>
          {navStrip}
          {holeGrid}
          {saveMsg && <div className="text-[11px] font-sans text-text-secondary">{saveMsg}</div>}
        </div>
      )}

      <div
        className={
          `p-4 space-y-4 overflow-y-auto flex-1 min-h-0 ` +
          (active && !mobileExpanded ? 'hidden md:block' : '')
        }
      >
        <p className="text-xs font-sans text-text-secondary">
          Compose pins on the map, mark avoid/no-cut, save for the day, hand the clubhouse a PDF.
        </p>

        {!active ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <label>
                <span className={labelClass}>Play date</span>
                <input
                  type="date"
                  value={session.playDate}
                  onChange={(e) => onMetaChange({ playDate: e.target.value })}
                  className={fieldClass}
                />
              </label>
              <label>
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
            </div>

            <label className="block">
              <span className={labelClass}>Starting hole</span>
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

            <label className="block">
              <span className={labelClass}>Sheet label</span>
              <input
                type="text"
                maxLength={80}
                value={session.label}
                onChange={(e) => onMetaChange({ label: e.target.value })}
                placeholder="Daily · Championship · Member-Guest"
                className={fieldClass}
              />
            </label>

            <button type="button" onClick={onStart} className={`${btnPrimary} w-full`}>
              Start pin set
            </button>
            {draftAvailable && (
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={onResume} className={btnClass}>
                  Resume draft
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Discard the local in-progress draft on this device?')) {
                      onDiscardLocalDraft();
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-heading font-black uppercase tracking-wide border border-red-300 bg-panel-white text-red-600 hover:bg-red-50 transition-colors"
                >
                  Discard draft
                </button>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-border-color">
              <strong className="text-xs font-heading font-black uppercase tracking-wide text-text-primary">
                Saved sets
              </strong>
              <button
                type="button"
                onClick={() => {
                  setListMsg('Loading saved sets…');
                  setListReload((n) => n + 1);
                }}
                title="Refresh"
                className="text-text-secondary hover:text-text-primary"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            {listMsg && <div className="text-xs font-sans text-text-muted">{listMsg}</div>}
            {renderSection('Upcoming / current', upcoming)}
            {renderSection('Past / archived', past)}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 border border-border-color bg-panel-white p-3">
              <div className="text-3xl font-heading font-black text-turf-green tabular-nums leading-none">
                {currentHole ?? '—'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-heading font-black uppercase tracking-wide text-text-primary">
                  {currentHole != null
                    ? `Hole ${currentHole} · step ${session.index + 1} of 18`
                    : '—'}
                </div>
                <div
                  className={`text-xs font-sans mt-0.5 ${
                    currentPin ? 'text-text-primary' : 'text-text-muted'
                  }`}
                >
                  {currentPin
                    ? formatPinStats(currentPin)
                    : currentHole != null && session.skipped[currentHole]
                      ? 'Skipped — tap to set or Next'
                      : 'Tap the green to drop the pin'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label>
                <span className={labelClass}>Play date</span>
                <input
                  type="date"
                  value={session.playDate}
                  onChange={(e) => onMetaChange({ playDate: e.target.value })}
                  className={fieldClass}
                />
              </label>
              <label>
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
            </div>

            <label className="block">
              <span className={labelClass}>Label</span>
              <input
                type="text"
                maxLength={80}
                value={session.label}
                onChange={(e) => onMetaChange({ label: e.target.value })}
                placeholder="Sheet label"
                className={fieldClass}
              />
            </label>

            {navStrip}
            {holeGrid}

            <div className="border border-border-color bg-panel-white p-3 space-y-3">
              <div className="text-[11px] font-heading font-black uppercase tracking-wide text-text-primary">
                Avoid / do not cut — hole {currentHole ?? '—'}
              </div>
              {avoidChips(holeAvoidKinds, 'hole')}
              <label className="block">
                <span className={labelClass}>Hole note</span>
                <input
                  type="text"
                  maxLength={120}
                  value={holeNote}
                  onChange={(e) => onHoleNoteChange(e.target.value)}
                  placeholder="Optional note for this hole"
                  className={fieldClass}
                />
              </label>

              <div className="text-[11px] font-heading font-black uppercase tracking-wide text-text-primary pt-2 border-t border-border-color">
                Course-wide avoid
              </div>
              {avoidChips(courseAvoidKinds, 'course')}
              <label className="block">
                <span className={labelClass}>Course note</span>
                <input
                  type="text"
                  maxLength={160}
                  value={courseNote}
                  onChange={(e) => onCourseNoteChange(e.target.value)}
                  placeholder="Optional course-wide note"
                  className={fieldClass}
                />
              </label>
            </div>

            <div className="space-y-2">
              <button type="button" onClick={onSave} className={`${btnPrimary} w-full`}>
                Save pin set
              </button>
              <button type="button" onClick={onFinish} className={`${btnClass} w-full`}>
                Finish → handout / PDF
              </button>
              {session.id && (
                <button type="button" onClick={onEnableToken} className={`${btnClass} w-full`}>
                  {session.publicToken
                    ? 'Copy public handout link'
                    : 'Enable public handout link'}
                </button>
              )}
              <button
                type="button"
                onClick={onCancel}
                className="w-full px-3 py-1.5 text-xs font-heading font-black uppercase tracking-wide border border-red-300 bg-panel-white text-red-600 hover:bg-red-50 transition-colors"
              >
                Cancel session
              </button>
              {saveMsg && <div className="text-xs font-sans text-text-secondary">{saveMsg}</div>}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
