import {
  collectAvoidLines,
  formatPlayDate,
  svgForHole,
  todayISO,
} from '@/lib/courseGeometry';
import { openPinSheetPrintWindow } from '@/lib/pinSheetPrintHtml';
import type { GreenIndex, PinSession } from '@/types/courseMap';
import { useState } from 'react';
import './printSheet.css';

interface PrintSheetProps {
  session: PinSession;
  greenIndex: GreenIndex;
  tokenUrl: string;
  /** Read-only handout arrives via ?pinToken= and has nothing to go back to. */
  readOnly: boolean;
  onBackToMap: () => void;
  onPublicLink: () => void;
}

const HOLES = Array.from({ length: 18 }, (_, i) => i + 1);

const toolbarBtn =
  'px-3 py-1.5 text-xs font-heading font-black uppercase tracking-wide border border-border-color bg-panel-white text-text-secondary hover:text-text-primary transition-colors';

export default function PrintSheet({
  session,
  greenIndex,
  tokenUrl,
  readOnly,
  onBackToMap,
  onPublicLink,
}: PrintSheetProps) {
  const label = session.label || 'Daily pins';
  const playDate = session.playDate || todayISO();
  const setCount = Object.keys(session.pins).length;
  const avoidLines = collectAvoidLines(session.avoid);
  const [printMsg, setPrintMsg] = useState<string | null>(null);

  const handlePrint = () => {
    const result = openPinSheetPrintWindow({
      label,
      playDate,
      status: session.status || 'draft',
      startHole: session.startHole || 1,
      pins: session.pins,
      avoid: session.avoid,
      greenIndex,
      tokenUrl: tokenUrl || '',
      autoPrint: true,
    });
    if (!result.ok) {
      setPrintMsg(result.reason);
      // Fallback: still try in-page print if pop-up blocked
      try {
        window.print();
      } catch {
        /* ignore */
      }
    } else {
      setPrintMsg(null);
    }
  };

  return (
    <div className="print-root">
      <div className="print-toolbar no-print">
        <div>
          <strong className="text-sm font-heading font-black uppercase tracking-tight text-text-primary">
            Clubhouse handout
          </strong>
          <span className="text-xs font-sans text-text-secondary ml-2">
            · {setCount}/18 · {playDate} · {label}
          </span>
          {printMsg && (
            <div className="text-xs font-sans text-accent-orange mt-1 max-w-xl">{printMsg}</div>
          )}
        </div>
        <div className="print-toolbar-actions">
          {!readOnly && (
            <>
              <button type="button" onClick={onBackToMap} className={toolbarBtn}>
                Back
              </button>
              <button type="button" onClick={onPublicLink} className={toolbarBtn}>
                Public link / QR
              </button>
            </>
          )}
          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 text-xs font-heading font-black uppercase tracking-wide border border-turf-green bg-turf-green text-white hover:bg-turf-green-dark transition-colors"
          >
            Print / PDF
          </button>
        </div>
      </div>

      <div className="print-sheet">
        <header className="ps-header">
          <div>
            <h1>BanBury Golf Course</h1>
            <p className="ps-sub">
              {label} · {formatPlayDate(playDate)} · start {session.startHole} · {setCount}/18
            </p>
          </div>
          <div className="ps-meta">
            <strong>{session.status || 'draft'}</strong>
          </div>
          {tokenUrl && (
            <div className="ps-qr">
              <img
                alt="Handout QR"
                width={56}
                height={56}
                src={`https://api.qrserver.com/v1/create-qr-code/?size=96x96&data=${encodeURIComponent(
                  tokenUrl
                )}`}
              />
              <div className="ps-qr-cap">
                Scan for handout
                <br />
                <span className="tiny">{tokenUrl}</span>
              </div>
            </div>
          )}
        </header>

        {avoidLines.length > 0 && (
          <div className="ps-avoid-block">
            <h2>DO NOT CUT / AVOID</h2>
            <ul>
              {avoidLines.map((l, i) => (
                <li key={`${l.scope}-${i}`}>
                  <strong>{l.scope}:</strong> {l.text}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="ps-grid">
          {HOLES.map((h) => {
            const pin = session.pins[h];
            const holeAvoid = (session.avoid.holes[String(h)] || []).map((a) => a.kind).join(', ');
            return (
              <div
                key={h}
                className={`ps-cell${pin ? '' : ' empty'}${holeAvoid ? ' has-avoid' : ''}`}
              >
                <div className="ps-cell-head">
                  <span>#{h}</span>
                  <span className="depth">{pin ? `D ${pin.depthLabel}` : '—'}</span>
                </div>
                <div
                  className="ps-svg-wrap"
                  dangerouslySetInnerHTML={{ __html: svgForHole(greenIndex, h, pin) }}
                />
                <div className="ps-nums">
                  <span className="k">On</span>
                  <span className="v">{pin ? pin.onLabel : '—'}</span>
                  <span className="k">L/R</span>
                  <span className="v">{pin ? pin.lrLabel : '—'}</span>
                </div>
                {holeAvoid && <div className="ps-avoid-mini">AVOID: {holeAvoid}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
