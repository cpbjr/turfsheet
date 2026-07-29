import { Crosshair, Flag } from 'lucide-react';
import type { ShowState } from '@/lib/courseGeometry';
import type { LayerKey } from '@/types/courseMap';

const LAYERS: { key: LayerKey; label: string }[] = [
  { key: 'green', label: 'greens' },
  { key: 'fairway', label: 'fairways' },
  { key: 'bunker', label: 'bunkers' },
  { key: 'tee', label: 'tees' },
  { key: 'water', label: 'water' },
  { key: 'hole', label: 'hole paths' },
  { key: 'irrigation', label: 'irrigation' },
  { key: 'other', label: 'other' },
];

const HOLE_OPTIONS = [
  { value: 'all', label: 'all' },
  { value: 'front', label: 'front 9' },
  { value: 'back', label: 'back 9' },
  ...Array.from({ length: 18 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) })),
];

interface LayerControlsProps {
  show: ShowState;
  onToggleLayer: (key: LayerKey, value: boolean) => void;
  holeFilter: string;
  onHoleFilterChange: (value: string) => void;
  /** The hole filter is driven by the pin session while one is running. */
  holeFilterDisabled: boolean;
  onRecenter: () => void;
  pinPanelOpen: boolean;
  onTogglePinPanel: () => void;
}

export default function LayerControls({
  show,
  onToggleLayer,
  holeFilter,
  onHoleFilterChange,
  holeFilterDisabled,
  onRecenter,
  pinPanelOpen,
  onTogglePinPanel,
}: LayerControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {LAYERS.map(({ key, label }) => (
        <label
          key={key}
          className="flex items-center gap-1.5 text-xs font-sans text-text-secondary cursor-pointer select-none"
        >
          <input
            type="checkbox"
            checked={show[key]}
            onChange={(e) => onToggleLayer(key, e.target.checked)}
            className="accent-turf-green w-3.5 h-3.5"
          />
          {label}
        </label>
      ))}

      <label className="flex items-center gap-1.5 text-xs font-sans text-text-secondary">
        holes
        <select
          value={holeFilter}
          onChange={(e) => onHoleFilterChange(e.target.value)}
          disabled={holeFilterDisabled}
          aria-label="Hole filter"
          className="border border-border-color bg-panel-white px-2 py-1 text-xs font-sans text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {HOLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={onRecenter}
        className="flex items-center gap-1.5 border border-border-color bg-panel-white px-3 py-1.5 text-xs font-heading font-black uppercase tracking-wide text-text-secondary hover:text-text-primary hover:border-text-muted transition-colors"
      >
        <Crosshair className="w-3.5 h-3.5" />
        Recenter
      </button>

      <button
        type="button"
        onClick={onTogglePinPanel}
        aria-pressed={pinPanelOpen}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-heading font-black uppercase tracking-wide border transition-colors ${
          pinPanelOpen
            ? 'bg-turf-green text-white border-turf-green'
            : 'bg-panel-white text-turf-green border-turf-green hover:bg-turf-green/10'
        }`}
      >
        <Flag className="w-3.5 h-3.5" />
        Pin Sheet
      </button>
    </div>
  );
}
