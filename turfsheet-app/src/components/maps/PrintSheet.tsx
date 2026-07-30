import {
  collectAvoidLines,
  formatPlayDate,
  svgForHole,
  todayISO,
} from '@/lib/courseGeometry';
import type { GreenIndex, PinSession } from '@/types/courseMap';
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
        </div>
        <div className="print-toolbar-actions">
          {!readOnly && (
            <>
              <button type="button" onClick={onBackToMap} className={toolbarBtn}>
                Back to map
              </button>
              <button type="button" onClick={onPublicLink} className={toolbarBtn}>
                Public link / QR
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => window.print()}
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
              Hole location sheet · {label} · {session.status || 'draft'}
            </p>
          </div>
          <div className="ps-meta">
            <strong>{formatPlayDate(playDate)}</strong>
            <br />
            play date · start hole {session.startHole}
            <br />
            {setCount} of 18 pins set
          </div>
          {tokenUrl && (
            <div className="ps-qr">
              <img
                alt="Handout QR"
                width={96}
                height={96}
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
                  // Diagram is generated locally from course geometry, no external input.
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

        <div className="ps-table-wrap">
          <h2>Summary (yards from front / nearest side edge)</h2>
          <table className="ps-table">
            <thead>
              <tr>
                <th>Hole</th>
                <th>Depth</th>
                <th>On</th>
                <th>L/R</th>
                <th>Avoid</th>
              </tr>
            </thead>
            <tbody>
              {HOLES.map((h) => {
                const pin = session.pins[h];
                const holeAvoid = (session.avoid.holes[String(h)] || [])
                  .map((a) => a.kind)
                  .join(', ');
                return (
                  <tr key={h}>
                    <td className="hole">{h}</td>
                    <td>{pin ? pin.depthLabel : '—'}</td>
                    <td>{pin ? pin.onLabel : '—'}</td>
                    <td>{pin ? pin.lrLabel : '—'}</td>
                    <td className="avoid-col">{holeAvoid}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="ps-foot">
          <strong>On</strong> = yards from front edge of green along approach.{' '}
          <strong>L/R</strong> = yards from pin to nearest left/right green edge at that depth
          (true collar from map polygon; C = near centerline).{' '}
          <strong>Depth</strong> = front-to-back green depth from course map geometry.{' '}
          <strong>DO NOT CUT / AVOID</strong> = pin-cut guidance for crew. Front edge is derived
          from each hole's approach path. Ops estimate — not a survey stake sheet. Generated from
          BanBury course map (White Pine Agency).
        </p>
      </div>
    </div>
  );
}
