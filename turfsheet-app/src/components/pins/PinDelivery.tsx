import GreenPreview from '@/components/pins/GreenPreview';
import {
  collectAvoidLines,
  formatPinStats,
  formatPlayDate,
  holeOrder,
} from '@/lib/courseGeometry';
import { handoutUrl } from '@/lib/pinSets';
import type { GreenIndex, PinSession, PinSetStatus } from '@/types/courseMap';

interface PinDeliveryProps {
  session: PinSession;
  greenIndex: GreenIndex;
  onPrint: () => void;
  onEnableToken: () => void;
  onStatusChange: (status: PinSetStatus) => void;
  onSave: () => void;
  onBackToSetup: () => void;
  onBackToLibrary: () => void;
  saveMsg?: string;
}

const btnClass =
  'px-3 py-1.5 text-xs font-heading font-black uppercase tracking-wide border border-border-color bg-panel-white text-text-secondary hover:text-text-primary transition-colors';
const btnPrimary =
  'px-3 py-1.5 text-xs font-heading font-black uppercase tracking-wide border border-turf-green bg-turf-green text-white hover:bg-turf-green-dark transition-colors';

const STATUSES: PinSetStatus[] = ['draft', 'scheduled', 'active', 'archived'];

export default function PinDelivery({
  session,
  greenIndex,
  onPrint,
  onEnableToken,
  onStatusChange,
  onSave,
  onBackToSetup,
  onBackToLibrary,
  saveMsg,
}: PinDeliveryProps) {
  const order =
    session.order?.length === 18 ? session.order : holeOrder(session.startHole || 1);
  const setCount = Object.keys(session.pins).length;
  const avoidLines = collectAvoidLines(session.avoid);
  const token = session.publicToken;
  const url = token ? handoutUrl(token) : '';

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-3 border border-border-color bg-panel-white p-4">
        <div>
          <h3 className="text-lg font-heading font-black uppercase tracking-tight text-text-primary">
            {session.label || 'Daily pins'}
          </h3>
          <p className="text-sm font-sans text-text-secondary mt-0.5">
            {formatPlayDate(session.playDate)} · {setCount}/18 pins · start hole{' '}
            {session.startHole}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onBackToLibrary} className={btnClass}>
            Library
          </button>
          <button type="button" onClick={onBackToSetup} className={btnClass}>
            Edit setup
          </button>
          <button type="button" onClick={onSave} className={btnClass}>
            Save
          </button>
          <button type="button" onClick={onPrint} className={btnPrimary}>
            Print / PDF
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 border border-border-color bg-panel-white p-4">
        <label className="block">
          <span className="block text-[11px] font-heading font-black uppercase tracking-wide text-text-secondary mb-1">
            Status
          </span>
          <select
            value={session.status}
            onChange={(e) => onStatusChange(e.target.value as PinSetStatus)}
            className="border border-border-color bg-panel-white px-2 py-1.5 text-sm font-sans"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={onEnableToken} className={btnClass}>
          {token ? 'Copy handout link' : 'Enable handout link'}
        </button>
        {url && (
          <code className="text-[11px] font-sans text-text-muted break-all max-w-md">{url}</code>
        )}
        {saveMsg && <span className="text-xs font-sans text-text-secondary">{saveMsg}</span>}
      </div>

      {avoidLines.length > 0 && (
        <div className="border border-border-color bg-panel-white p-3">
          <div className="text-[11px] font-heading font-black uppercase tracking-wide text-text-primary mb-2">
            Avoid notes
          </div>
          <ul className="space-y-1 text-xs font-sans text-text-secondary">
            {avoidLines.map((line, i) => (
              <li key={i}>
                <strong className="text-text-primary">{line.scope}:</strong> {line.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {order.map((hole) => {
          const pin = session.pins[hole];
          return (
            <div
              key={hole}
              className="border border-border-color bg-panel-white p-2 space-y-1"
            >
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-heading font-black text-turf-green tabular-nums">
                  {hole}
                </span>
                <span className="text-[10px] font-sans text-text-muted truncate ml-1">
                  {pin?.ok ? formatPinStats(pin) : '—'}
                </span>
              </div>
              <GreenPreview hole={hole} greenIndex={greenIndex} pin={pin} size={120} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
