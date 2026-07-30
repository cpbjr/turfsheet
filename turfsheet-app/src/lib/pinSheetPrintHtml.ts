/**
 * Self-contained pin handout HTML for window.print() / headless PDF.
 * Avoids app shell overflow:hidden clipping blank pages.
 */
import {
  collectAvoidLines,
  formatPlayDate,
  svgForHole,
  todayISO,
} from '@/lib/courseGeometry';
import type { AvoidState, GreenIndex, Pin, PinMap, PinSetStatus } from '@/types/courseMap';

/** Minimal print CSS (no Tailwind dependency in the print window). */
export const PIN_SHEET_PRINT_CSS = `
@page { size: letter portrait; margin: 0.4in; }
* { box-sizing: border-box; }
html, body {
  margin: 0;
  padding: 0;
  background: #fff;
  color: #111;
  font-family: Inter, system-ui, -apple-system, sans-serif;
}
body { padding: 0; }
.no-print { display: none !important; }
.print-sheet { max-width: none; margin: 0; padding: 0; }
.ps-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 2px solid #2e7d32;
  padding-bottom: 8px;
  margin-bottom: 12px;
}
.ps-header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.01em; }
.ps-sub { margin: 2px 0 0; font-size: 11px; color: #555; }
.ps-meta { text-align: right; font-size: 11px; line-height: 1.5; color: #333; }
.ps-qr { display: flex; align-items: center; gap: 8px; }
.ps-qr-cap { font-size: 9px; color: #555; max-width: 130px; }
.ps-qr-cap .tiny { font-size: 7px; word-break: break-all; color: #777; }
.ps-avoid-block {
  border: 1.5px solid #c62828;
  background: #fff5f5;
  padding: 8px 12px;
  margin-bottom: 12px;
}
.ps-avoid-block h2 {
  margin: 0 0 4px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: #c62828;
}
.ps-avoid-block ul { margin: 0; padding-left: 18px; font-size: 11px; line-height: 1.5; }
.ps-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
  margin-bottom: 14px;
}
.ps-cell { border: 1px solid #cfd8cf; padding: 4px; background: #fff; break-inside: avoid; }
.ps-cell.empty { background: #fafafa; border-style: dashed; }
.ps-cell.has-avoid { border-color: #c62828; }
.ps-cell-head {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  font-weight: 800;
  margin-bottom: 2px;
}
.ps-cell-head .depth { color: #666; font-weight: 600; }
.ps-svg-wrap svg { display: block; width: 100%; height: auto; }
.ps-nums {
  display: grid;
  grid-template-columns: auto 1fr auto 1fr;
  gap: 2px 4px;
  font-size: 10px;
  margin-top: 3px;
  align-items: baseline;
}
.ps-nums .k { color: #777; }
.ps-nums .v { font-weight: 800; }
.ps-avoid-mini {
  margin-top: 3px;
  font-size: 8px;
  font-weight: 700;
  color: #c62828;
  line-height: 1.3;
}
.ps-table-wrap h2 { font-size: 12px; font-weight: 800; margin: 0 0 4px; }
.ps-table { width: 100%; border-collapse: collapse; font-size: 10px; }
.ps-table th, .ps-table td { border: 1px solid #d5d5d5; padding: 2px 5px; text-align: left; }
.ps-table th { background: #eef5ea; font-weight: 800; }
.ps-table td.hole { font-weight: 800; width: 34px; }
.ps-table td.avoid-col { color: #c62828; font-weight: 600; }
.ps-foot { margin-top: 10px; font-size: 8.5px; line-height: 1.5; color: #666; }
.ps-grid, .ps-table-wrap, .ps-avoid-block { break-inside: avoid; }
`.trim();

export interface PinSheetPrintInput {
  label: string;
  playDate: string;
  status: PinSetStatus | string;
  startHole: number;
  pins: PinMap | Record<string, Pin>;
  avoid: AvoidState;
  greenIndex: GreenIndex;
  tokenUrl?: string;
  /** When true, inject window.onload → print (browser handout). */
  autoPrint?: boolean;
}

function esc(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function pinForHole(pins: PinSheetPrintInput['pins'], h: number): Pin | undefined {
  const p = (pins as PinMap)[h] ?? (pins as Record<string, Pin>)[String(h)];
  return p || undefined;
}

/** Full HTML document ready for print window or Playwright page.setContent. */
export function buildPinSheetPrintHtml(input: PinSheetPrintInput): string {
  const label = input.label || 'Daily pins';
  const playDate = input.playDate || todayISO();
  const pins = input.pins || {};
  const setCount = Object.keys(pins).length;
  const avoid = input.avoid || { course: [], holes: {} };
  const avoidLines = collectAvoidLines(avoid);
  const HOLES = Array.from({ length: 18 }, (_, i) => i + 1);

  const cells = HOLES.map((h) => {
    const pin = pinForHole(pins, h);
    const holeAvoid = (avoid.holes[String(h)] || []).map((a) => a.kind).join(', ');
    const cls = `ps-cell${pin ? '' : ' empty'}${holeAvoid ? ' has-avoid' : ''}`;
    return `<div class="${cls}">
      <div class="ps-cell-head"><span>#${h}</span><span class="depth">${pin ? `D ${esc(pin.depthLabel)}` : '—'}</span></div>
      <div class="ps-svg-wrap">${svgForHole(input.greenIndex, h, pin)}</div>
      <div class="ps-nums">
        <span class="k">On</span><span class="v">${pin ? esc(pin.onLabel) : '—'}</span>
        <span class="k">L/R</span><span class="v">${pin ? esc(pin.lrLabel) : '—'}</span>
      </div>
      ${holeAvoid ? `<div class="ps-avoid-mini">AVOID: ${esc(holeAvoid)}</div>` : ''}
    </div>`;
  }).join('\n');

  const rows = HOLES.map((h) => {
    const pin = pinForHole(pins, h);
    const holeAvoid = (avoid.holes[String(h)] || []).map((a) => a.kind).join(', ');
    return `<tr>
      <td class="hole">${h}</td>
      <td>${pin ? esc(pin.depthLabel) : '—'}</td>
      <td>${pin ? esc(pin.onLabel) : '—'}</td>
      <td>${pin ? esc(pin.lrLabel) : '—'}</td>
      <td class="avoid-col">${esc(holeAvoid)}</td>
    </tr>`;
  }).join('\n');

  const avoidBlock =
    avoidLines.length > 0
      ? `<div class="ps-avoid-block"><h2>DO NOT CUT / AVOID</h2><ul>${avoidLines
          .map((l) => `<li><strong>${esc(l.scope)}:</strong> ${esc(l.text)}</li>`)
          .join('')}</ul></div>`
      : '';

  const tokenUrl = input.tokenUrl || '';
  const qr =
    tokenUrl
      ? `<div class="ps-qr">
          <img alt="Handout QR" width="96" height="96"
            src="https://api.qrserver.com/v1/create-qr-code/?size=96x96&data=${encodeURIComponent(tokenUrl)}" />
          <div class="ps-qr-cap">Scan for handout<br /><span class="tiny">${esc(tokenUrl)}</span></div>
        </div>`
      : '';

  const autoPrint = input.autoPrint
    ? `<script>window.onload=function(){setTimeout(function(){window.print();},250);};</script>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>${esc(label)} · BanBury pin sheet</title>
<style>${PIN_SHEET_PRINT_CSS}</style>
${autoPrint}
</head>
<body>
  <div class="print-sheet">
    <header class="ps-header">
      <div>
        <h1>BanBury Golf Course</h1>
        <p class="ps-sub">Hole location sheet · ${esc(label)} · ${esc(String(input.status || 'draft'))}</p>
      </div>
      <div class="ps-meta">
        <strong>${esc(formatPlayDate(playDate))}</strong><br/>
        play date · start hole ${Number(input.startHole) || 1}<br/>
        ${setCount} of 18 pins set
      </div>
      ${qr}
    </header>
    ${avoidBlock}
    <div class="ps-grid">${cells}</div>
    <div class="ps-table-wrap">
      <h2>Summary (yards from front / nearest side edge)</h2>
      <table class="ps-table">
        <thead><tr><th>Hole</th><th>Depth</th><th>On</th><th>L/R</th><th>Avoid</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <p class="ps-foot">
      <strong>On</strong> = yards from front edge of green along approach.
      <strong>L/R</strong> = yards from pin to nearest left/right green edge at that depth
      (true collar from map polygon; C = near centerline).
      <strong>Depth</strong> = front-to-back green depth from course map geometry.
      <strong>DO NOT CUT / AVOID</strong> = pin-cut guidance for crew. Front edge is derived
      from each hole's approach path. Ops estimate — not a survey stake sheet. Generated from
      BanBury course map (White Pine Agency).
    </p>
  </div>
</body>
</html>`;
}

/** Open a dedicated print window (preferred over in-app window.print). */
export function openPinSheetPrintWindow(input: PinSheetPrintInput): { ok: true } | { ok: false; reason: string } {
  const html = buildPinSheetPrintHtml({ ...input, autoPrint: true });
  const w = window.open('', '_blank');
  if (!w) {
    return { ok: false, reason: 'Pop-up blocked — allow pop-ups for this site, then try Print / PDF again.' };
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  return { ok: true };
}
