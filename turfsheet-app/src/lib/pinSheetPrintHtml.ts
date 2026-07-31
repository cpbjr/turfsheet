/**
 * Self-contained pin handout HTML for window.print() / headless PDF.
 * Full-page hole diagrams only (no summary table).
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
@page { size: letter portrait; margin: 0.3in; }
* { box-sizing: border-box; }
html, body {
  margin: 0;
  padding: 0;
  background: #fff;
  color: #111;
  font-family: Inter, system-ui, -apple-system, sans-serif;
  height: 100%;
}
body { padding: 0; }
.no-print { display: none !important; }
.print-sheet {
  max-width: none;
  margin: 0;
  padding: 0;
  height: 10.4in; /* letter − margins */
  display: flex;
  flex-direction: column;
}
.ps-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 2px solid #2e7d32;
  padding-bottom: 6px;
  margin-bottom: 8px;
  flex-shrink: 0;
}
.ps-header h1 { margin: 0; font-size: 16px; font-weight: 800; letter-spacing: -0.01em; }
.ps-sub { margin: 0; font-size: 10px; color: #555; }
.ps-meta { text-align: right; font-size: 10px; line-height: 1.4; color: #333; }
.ps-qr { display: flex; align-items: center; gap: 6px; }
.ps-qr img { width: 56px; height: 56px; }
.ps-qr-cap { font-size: 8px; color: #555; max-width: 100px; }
.ps-qr-cap .tiny { font-size: 6px; word-break: break-all; color: #777; }
.ps-avoid-block {
  border: 1.5px solid #c62828;
  background: #fff5f5;
  padding: 6px 10px;
  margin-bottom: 8px;
  flex-shrink: 0;
}
.ps-avoid-block h2 {
  margin: 0 0 2px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: #c62828;
}
.ps-avoid-block ul { margin: 0; padding-left: 16px; font-size: 10px; line-height: 1.4; }
.ps-grid {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 8px;
  margin: 0;
}
.ps-cell {
  border: 1px solid #cfd8cf;
  padding: 4px 5px 5px;
  background: #fff;
  break-inside: avoid;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.ps-cell.empty { background: #fafafa; border-style: dashed; }
.ps-cell.has-avoid { border-color: #c62828; }
.ps-cell-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 11px;
  font-weight: 800;
  margin-bottom: 2px;
  flex-shrink: 0;
}
.ps-cell-head .depth { color: #666; font-weight: 600; font-size: 10px; }
.ps-svg-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: stretch;
  justify-content: center;
}
.ps-svg-wrap svg {
  display: block;
  width: 100%;
  height: 100%;
}
.ps-nums {
  display: grid;
  grid-template-columns: auto 1fr auto 1fr;
  gap: 1px 4px;
  font-size: 11px;
  margin-top: 3px;
  align-items: baseline;
  flex-shrink: 0;
}
.ps-nums .k { color: #777; font-size: 9px; }
.ps-nums .v { font-weight: 800; }
.ps-avoid-mini {
  margin-top: 2px;
  font-size: 8px;
  font-weight: 700;
  color: #c62828;
  line-height: 1.2;
  flex-shrink: 0;
}
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
          <img alt="Handout QR" width="56" height="56"
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
        <p class="ps-sub">${esc(label)} · ${esc(formatPlayDate(playDate))} · start ${Number(input.startHole) || 1} · ${setCount}/18</p>
      </div>
      <div class="ps-meta">
        <strong>${esc(String(input.status || 'draft'))}</strong>
      </div>
      ${qr}
    </header>
    ${avoidBlock}
    <div class="ps-grid">${cells}</div>
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
