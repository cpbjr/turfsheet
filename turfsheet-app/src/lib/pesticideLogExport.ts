import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatMethod } from './pesticideOptions';
import { flattenEventsToLogLines, resolveMethod } from './pesticideApplication';
import { sameId } from './utils';
import type {
    CourseSettings,
    PesticideApplicationWithProducts,
    PesticideLogLine,
    Staff,
} from '../types';

/**
 * IDAPA 02.03.03.101.01(c) requires the location of the property treated, by
 * address, general legal description, or latitude/longitude. This is a separate
 * element from (b), the property treated, which the per-application `area_applied`
 * column already satisfies.
 *
 * Returns an empty string when unset, so the caller omits the line entirely
 * rather than printing a label with nothing after it.
 */
export function formatCourseLocation(course?: CourseSettings | null): string {
    if (!course) return '';
    const street = [course.street_address, course.city, course.state, course.postal_code]
        .map((p) => (p ?? '').trim())
        .filter(Boolean)
        .join(', ');
    if (street) return street;
    if (course.legal_description?.trim()) return course.legal_description.trim();
    if (course.latitude != null && course.longitude != null) {
        return `${course.latitude}, ${course.longitude}`;
    }
    return '';
}

/** Footer citation. Kept in one place so both export paths cannot drift apart. */
export const COMPLIANCE_FOOTER =
    'Records maintained per IDAPA 02.03.03.101 (authority: Idaho Code § 22-3421) | Retain minimum 2 years';

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
    'Supervisor',
    'Rec. By',
    'WPS Contact',
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
 * IDAPA 02.03.03.101.01(o) requires the name of the grower or operator contacted
 * and the date and time of that contact. Records written before those fields
 * existed carry only the boolean, so fall back to it rather than printing a blank
 * that would read as "no exchange occurred".
 */
export function formatWpsContact(event: {
    worker_protection_exchange?: boolean;
    wps_contact_name?: string;
    wps_contact_date?: string;
    wps_contact_time?: string;
}): string {
    const { wps_contact_name, wps_contact_date, wps_contact_time } = event;
    if (wps_contact_name || wps_contact_date || wps_contact_time) {
        const when = [wps_contact_date, wps_contact_time].filter(Boolean).join(' ');
        return [wps_contact_name, when].filter(Boolean).join(' — ');
    }
    return event.worker_protection_exchange ? '✓ (no contact recorded)' : '✗';
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
        // 101.01(n): blank unless an apprentice was supervised.
        event.supervisor_name
            ? `${event.supervisor_name}${event.supervisor_license ? ` (${event.supervisor_license})` : ''}`
            : '--',
        staffName(staffMembers, event.recommended_by),
        // 101.01(o): the element is the contact's name plus date and time -- a tick
        // mark alone does not satisfy it.
        formatWpsContact(event),
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
    opts?: { dateFrom?: string; dateTo?: string; course?: CourseSettings | null }
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
        .site { text-align: center; font-size: 9pt; color: #333; margin-bottom: 2px; }
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
    ${
        opts?.course?.course_name
            ? `<div class="site">${escapeHtml(opts.course.course_name)}</div>`
            : ''
    }
    ${
        formatCourseLocation(opts?.course)
            ? `<div class="site">${escapeHtml(formatCourseLocation(opts?.course))}</div>`
            : ''
    }
    <div class="subtitle">${escapeHtml(subtitleForLog(events.length, logLines.length, opts?.dateFrom, opts?.dateTo, today))}</div>
    <div class="compliance">${escapeHtml(COMPLIANCE_FOOTER)}</div>
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
    opts?: { dateFrom?: string; dateTo?: string; course?: CourseSettings | null }
): void {
    const today = formatLongDate();
    const logLines = flattenForExport(events);
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 28;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('PESTICIDE & FERTILIZER APPLICATION LOG', pageWidth / 2, 36, { align: 'center' });

    // Header lines flow from a cursor: the site and location lines are conditional,
    // so fixed offsets would collide when they are absent.
    let cursorY = 36;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51);
    if (opts?.course?.course_name) {
        cursorY += 14;
        doc.text(opts.course.course_name, pageWidth / 2, cursorY, { align: 'center' });
    }
    const courseLocation = formatCourseLocation(opts?.course);
    if (courseLocation) {
        cursorY += 11;
        doc.text(courseLocation, pageWidth / 2, cursorY, { align: 'center' });
    }

    cursorY += 16;
    doc.setTextColor(85);
    doc.text(
        subtitleForLog(events.length, logLines.length, opts?.dateFrom, opts?.dateTo, today),
        pageWidth / 2,
        cursorY,
        { align: 'center' }
    );

    cursorY += 14;
    doc.setFontSize(7);
    doc.setTextColor(102);
    doc.setFont('helvetica', 'italic');
    doc.text(COMPLIANCE_FOOTER, pageWidth / 2, cursorY, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);

    const body = logLines.map((line) => logLineToRow(line, staffMembers));

    autoTable(doc, {
        startY: cursorY + 10,
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
