import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatMethod } from './pesticideOptions';
import { flattenEventsToLogLines, resolveMethod } from './pesticideApplication';
import { sameId } from './utils';
import type { PesticideApplicationWithProducts, PesticideLogLine, Staff } from '../types';

export const PESTICIDE_LOG_COLUMNS = [
    'Date',
    'Time',
    'Product',
    'EPA Reg #',
    'Active Ingr.',
    'Manufacturer',
    'EPA Lot #',
    'Rate',
    'Total Used',
    'Amt/Tank',
    'Area',
    'Size',
    'Target',
    'Method',
    'Equipment',
    'Applicator',
    'License #',
    'Rec. By',
    'WPS',
    'REI',
    'Temp',
    'Wind',
    'Wind Dir',
    'Conditions',
] as const;

export function formatExportDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatLongDate(d = new Date()): string {
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function staffName(staffMembers: Staff[], id?: string | number): string {
    return staffMembers.find((s) => sameId(s.id, id))?.name || '--';
}

/**
 * One regulator-log row: event context + a single product line.
 * Column order is byte-identical to the pre-event-model export.
 */
export function logLineToRow(line: PesticideLogLine, staffMembers: Staff[]): string[] {
    const { event, product } = line;
    return [
        formatExportDate(event.application_date),
        event.application_time || '--',
        product?.product_name || '--',
        product?.epa_registration_number || '--',
        product?.active_ingredient || '--',
        product?.manufacturer || '--',
        product?.epa_lot_number || '--',
        product?.application_rate ?? '--',
        product?.total_amount_used || '--',
        product?.amount_per_tank || '--',
        event.area_applied || '--',
        event.area_size || '--',
        product?.target_pest || '--',
        formatMethod(resolveMethod(event, product)),
        event.equipment_used || '--',
        staffName(staffMembers, event.operator_id),
        event.applicator_license || '--',
        staffName(staffMembers, event.recommended_by),
        event.worker_protection_exchange ? '✓' : '✗',
        product?.rei_hours != null ? `${product.rei_hours}h` : '--',
        event.temperature != null ? String(event.temperature) : '--',
        event.wind_speed != null ? String(event.wind_speed) : '--',
        event.wind_direction || '--',
        event.weather_conditions || '--',
    ];
}

export function escapeHtml(value: unknown): string {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function buildPesticideLogFilename(dateFrom?: string, dateTo?: string): string {
    const iso = (s: string) => s.replace(/[^\d-]/g, '');
    if (dateFrom && dateTo) {
        return `Banbury-Pesticide-Log_${iso(dateFrom)}_to_${iso(dateTo)}.pdf`;
    }
    if (dateFrom) {
        return `Banbury-Pesticide-Log_from_${iso(dateFrom)}.pdf`;
    }
    if (dateTo) {
        return `Banbury-Pesticide-Log_to_${iso(dateTo)}.pdf`;
    }
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `Banbury-Pesticide-Log_${y}-${m}-${d}.pdf`;
}

export function subtitleForLog(
    applicationCount: number,
    lineCount: number,
    dateFrom?: string,
    dateTo?: string,
    generatedLabel?: string
): string {
    const today = generatedLabel ?? formatLongDate();
    const range =
        dateFrom || dateTo
            ? ` | Showing: ${dateFrom || 'All'} to ${dateTo || 'Present'}`
            : '';
    const apps = `${applicationCount} Application${applicationCount !== 1 ? 's' : ''}`;
    const lines =
        lineCount !== applicationCount
            ? ` (${lineCount} product line${lineCount !== 1 ? 's' : ''})`
            : '';
    return `Generated ${today} | ${apps}${lines}${range}`;
}

function flattenForExport(events: PesticideApplicationWithProducts[]): PesticideLogLine[] {
    return flattenEventsToLogLines(events);
}

/** Full HTML document for print window (landscape letter). */
export function buildPesticideLogPrintHtml(
    events: PesticideApplicationWithProducts[],
    staffMembers: Staff[],
    opts?: { dateFrom?: string; dateTo?: string }
): string {
    const today = formatLongDate();
    const logLines = flattenForExport(events);
    const rows = logLines
        .map((line) => {
            const cells = logLineToRow(line, staffMembers)
                .map((c, i) =>
                    i === 2
                        ? `<td style="font-weight:bold">${escapeHtml(c)}</td>`
                        : `<td>${escapeHtml(c)}</td>`
                )
                .join('');
            return `<tr>${cells}</tr>`;
        })
        .join('');

    const headers = PESTICIDE_LOG_COLUMNS.map((h) => `<th>${h}</th>`).join('');

    return `<!DOCTYPE html>
<html>
<head>
    <title>Pesticide Application Log</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 8pt; margin: 0.4in; color: #000; }
        h1 { font-size: 14pt; text-align: center; margin: 0 0 4px; }
        .subtitle { text-align: center; font-size: 9pt; color: #555; margin-bottom: 8px; border-bottom: 2px solid #333; padding-bottom: 8px; }
        .compliance { font-size: 7pt; color: #666; text-align: center; font-style: italic; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f0f0f0; font-size: 6.5pt; text-transform: uppercase; font-weight: bold; border: 1px solid #999; padding: 3px 4px; text-align: left; }
        td { border: 1px solid #ccc; padding: 3px 4px; font-size: 7.5pt; }
        tr:nth-child(even) { background: #fafafa; }
        .sig { margin-top: 32px; display: flex; gap: 40px; }
        .sig div { flex: 1; border-top: 1px solid #333; padding-top: 3px; font-size: 7pt; color: #666; }
        .footer { margin-top: 16px; text-align: center; font-size: 7pt; color: #999; border-top: 1px solid #ddd; padding-top: 6px; }
        @page { size: letter landscape; margin: 0.4in; }
    </style>
</head>
<body>
    <h1>PESTICIDE &amp; FERTILIZER APPLICATION LOG</h1>
    <div class="subtitle">${escapeHtml(subtitleForLog(events.length, logLines.length, opts?.dateFrom, opts?.dateTo, today))}</div>
    <div class="compliance">
        Records maintained per Idaho Statutes Title 22, Ch. 34 &amp; IDAPA 02.03.03 | Retain for minimum 2 years
    </div>
    <table>
        <thead><tr>${headers}</tr></thead>
        <tbody>${rows}</tbody>
    </table>
    <div class="sig">
        <div>Superintendent Signature</div>
        <div>Date</div>
        <div>Reviewed By</div>
        <div>Date</div>
    </div>
    <div class="footer">TurfSheet &mdash; Pesticide &amp; Fertilizer Application Record &mdash; Printed ${escapeHtml(today)}</div>
    <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;
}

/** Build and trigger browser download of landscape PDF. */
export function downloadPesticideLogPdf(
    events: PesticideApplicationWithProducts[],
    staffMembers: Staff[],
    opts?: { dateFrom?: string; dateTo?: string }
): void {
    const today = formatLongDate();
    const logLines = flattenForExport(events);
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 28;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('PESTICIDE & FERTILIZER APPLICATION LOG', pageWidth / 2, 36, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(85);
    doc.text(
        subtitleForLog(events.length, logLines.length, opts?.dateFrom, opts?.dateTo, today),
        pageWidth / 2,
        52,
        { align: 'center' }
    );

    doc.setFontSize(7);
    doc.setTextColor(102);
    doc.setFont('helvetica', 'italic');
    doc.text(
        'Records maintained per Idaho Statutes Title 22, Ch. 34 & IDAPA 02.03.03 | Retain for minimum 2 years',
        pageWidth / 2,
        66,
        { align: 'center' }
    );
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);

    const body = logLines.map((line) => logLineToRow(line, staffMembers));

    autoTable(doc, {
        startY: 76,
        head: [PESTICIDE_LOG_COLUMNS as unknown as string[]],
        body,
        theme: 'grid',
        styles: {
            fontSize: 6.5,
            cellPadding: 2,
            overflow: 'linebreak',
            valign: 'top',
            lineColor: [200, 200, 200],
            lineWidth: 0.4,
        },
        headStyles: {
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            fontSize: 5.5,
            halign: 'left',
        },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        margin: { left: margin, right: margin, bottom: 48 },
        didDrawPage: () => {
            const pageH = doc.internal.pageSize.getHeight();
            const y = pageH - 36;
            doc.setDrawColor(51);
            doc.setLineWidth(0.6);
            const sigW = (pageWidth - margin * 2 - 36) / 4;
            const labels = ['Superintendent Signature', 'Date', 'Reviewed By', 'Date'];
            labels.forEach((label, i) => {
                const x = margin + i * (sigW + 12);
                doc.line(x, y, x + sigW, y);
                doc.setFontSize(7);
                doc.setTextColor(102);
                doc.text(label, x, y + 10);
            });
            doc.setFontSize(7);
            doc.setTextColor(153);
            doc.text(
                `TurfSheet — Pesticide & Fertilizer Application Record — Printed ${today}`,
                pageWidth / 2,
                pageH - 12,
                { align: 'center' }
            );
        },
    });

    doc.save(buildPesticideLogFilename(opts?.dateFrom, opts?.dateTo));
}
