import { useEffect, useState } from 'react';
import { Copy, RefreshCw, Trash2 } from 'lucide-react';
import { draftHasPins, listPinSets, loadDraft } from '@/lib/pinSets';
import type { DraftPayload } from '@/lib/pinSets';
import type { PinSetStatus, PinSetSummary } from '@/types/courseMap';

interface PinLibraryListProps {
  reloadToken: number;
  onNew: () => void;
  onOpen: (id: string) => void;
  onDuplicate: (id: string) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
  onResumeDraft: () => void;
  onDiscardDraft: () => void;
}

const btnClass =
  'px-3 py-1.5 text-xs font-heading font-black uppercase tracking-wide border border-border-color bg-panel-white text-text-secondary hover:text-text-primary hover:border-text-muted transition-colors';
const btnPrimary =
  'px-3 py-1.5 text-xs font-heading font-black uppercase tracking-wide border border-turf-green bg-turf-green text-white hover:bg-turf-green-dark transition-colors';

const statusColor: Record<PinSetStatus, string> = {
  draft: 'text-text-muted',
  scheduled: 'text-turf-green',
  active: 'text-accent-orange',
  archived: 'text-text-muted',
};

export default function PinLibraryList({
  reloadToken,
  onNew,
  onOpen,
  onDuplicate,
  onDelete,
  onResumeDraft,
  onDiscardDraft,
}: PinLibraryListProps) {
  const [sets, setSets] = useState<PinSetSummary[]>([]);
  const [listMsg, setListMsg] = useState('Loading…');
  const [listReload, setListReload] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftPayload | null>(() => loadDraft());

  useEffect(() => {
    setDraft(loadDraft());
  }, [reloadToken]);

  useEffect(() => {
    let cancelled = false;
    setListMsg('Loading…');
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
  }, [listReload, reloadToken]);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = sets.filter((r) => r.play_date >= today && r.status !== 'archived');
  const past = sets.filter((r) => r.play_date < today || r.status === 'archived');
  const hasDraft = draftHasPins(draft);

  const handleDelete = async (id: string, label: string) => {
    if (!window.confirm(`Delete “${label || 'this pin set'}”? This cannot be undone.`)) return;
    setBusyId(id);
    try {
      await onDelete(id);
      setSets((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleDuplicate = async (id: string) => {
    setBusyId(id);
    try {
      await onDuplicate(id);
      setListReload((n) => n + 1);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  };

  const renderSection = (title: string, rows: PinSetSummary[]) =>
    rows.length > 0 && (
      <div key={title}>
        <div className="text-[11px] font-heading font-black uppercase tracking-wide text-text-muted mt-4 mb-1.5">
          {title}
        </div>
        <div className="space-y-1">
          {rows.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-1 border border-border-color bg-panel-white"
            >
              <button
                type="button"
                onClick={() => onOpen(r.id)}
                className="flex-1 min-w-0 flex flex-wrap items-center gap-x-3 gap-y-0.5 px-3 py-2 text-left hover:bg-turf-green/5 transition-colors"
              >
                <span className="text-sm font-sans text-text-primary tabular-nums shrink-0">
                  {r.play_date}
                </span>
                <span className="flex-1 text-sm font-sans text-text-secondary truncate min-w-[6rem]">
                  {r.label || '(no label)'}
                </span>
                <span
                  className={`text-[10px] font-heading font-black uppercase tracking-wide shrink-0 ${statusColor[r.status]}`}
                >
                  {r.status}
                </span>
                <span className="text-[10px] font-sans text-text-muted shrink-0">
                  start {r.start_hole}
                </span>
                {r.public_token && (
                  <span className="text-[10px] font-heading font-black uppercase text-turf-green shrink-0">
                    link
                  </span>
                )}
              </button>
              <button
                type="button"
                title="Duplicate"
                disabled={busyId === r.id}
                onClick={() => void handleDuplicate(r.id)}
                className="shrink-0 px-2 py-2 text-text-secondary hover:text-turf-green hover:bg-turf-green/5 disabled:opacity-40 border-l border-border-color"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title="Delete"
                disabled={busyId === r.id}
                onClick={() => void handleDelete(r.id, r.label || r.play_date)}
                className="shrink-0 px-2 py-2 text-red-600 hover:bg-red-50 disabled:opacity-40 border-l border-border-color"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={onNew} className={btnPrimary}>
          New pin sheet
        </button>
        <button
          type="button"
          onClick={() => {
            setListMsg('Loading…');
            setListReload((n) => n + 1);
          }}
          className={btnClass}
          title="Refresh list"
        >
          <RefreshCw className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
          Refresh
        </button>
      </div>

      {hasDraft && (
        <div className="border border-accent-orange/50 bg-accent-orange/5 px-4 py-3 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-heading font-black uppercase tracking-wide text-accent-orange">
              Local draft on this device
            </div>
            <div className="text-xs font-sans text-text-secondary mt-0.5">
              {draft?.label || 'Untitled'} · {draft?.playDate} ·{' '}
              {Object.keys(draft?.pins || {}).length}/18 pins
            </div>
          </div>
          <button type="button" onClick={onResumeDraft} className={btnPrimary}>
            Resume draft
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Discard the local in-progress draft on this device?')) {
                onDiscardDraft();
                setDraft(null);
              }
            }}
            className="px-3 py-1.5 text-xs font-heading font-black uppercase tracking-wide border border-red-300 bg-panel-white text-red-600 hover:bg-red-50"
          >
            Discard
          </button>
        </div>
      )}

      {listMsg && <div className="text-sm font-sans text-text-muted">{listMsg}</div>}
      {renderSection('Upcoming / current', upcoming)}
      {renderSection('Past / archived', past)}
    </div>
  );
}
