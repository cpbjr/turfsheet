import { forwardRef } from 'react';
import type { PesticideApplication, Staff } from '../../types';

interface ApplicationPrintViewProps {
    applications: PesticideApplication[];
    staffMembers: Staff[];
    dateRange?: { start: string; end: string };
}

const ApplicationPrintView = forwardRef<HTMLDivElement, ApplicationPrintViewProps>(
    ({ applications, staffMembers, dateRange }, ref) => {
        const getOperatorName = (id?: string) =>
            staffMembers.find(s => s.id === id)?.name || 'Unknown';

        const formatDate = (dateStr: string) => {
            const date = new Date(dateStr + 'T00:00:00');
            return date.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
            });
        };

        const formatMethod = (method?: string) => {
            if (!method) return '--';
            return method.charAt(0).toUpperCase() + method.slice(1);
        };

        const today = new Date().toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });

        return (
            <div ref={ref} className="print-view hidden print:block">
                <style>{`
                    @media print {
                        .print-view { display: block !important; }
                        body > div:not(.print-view) { display: none !important; }
                        @page {
                            size: letter landscape;
                            margin: 0.5in;
                        }
                        .page-break { page-break-before: always; }
                    }
                    .print-view {
                        font-family: 'Arial', sans-serif;
                        color: #000;
                        font-size: 10pt;
                    }
                    .print-view table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    .print-view th, .print-view td {
                        border: 1px solid #999;
                        padding: 4px 8px;
                        text-align: left;
                        font-size: 9pt;
                    }
                    .print-view th {
                        background-color: #f0f0f0;
                        font-weight: bold;
                        font-size: 8pt;
                        text-transform: uppercase;
                    }
                    .print-view .header {
                        text-align: center;
                        margin-bottom: 16px;
                        border-bottom: 2px solid #333;
                        padding-bottom: 8px;
                    }
                    .print-view .header h1 {
                        font-size: 16pt;
                        font-weight: bold;
                        margin: 0;
                    }
                    .print-view .header p {
                        font-size: 10pt;
                        color: #555;
                        margin: 4px 0 0;
                    }
                    .print-view .footer {
                        margin-top: 24px;
                        font-size: 8pt;
                        color: #666;
                        text-align: center;
                        border-top: 1px solid #ccc;
                        padding-top: 8px;
                    }
                    .print-view .detail-section {
                        margin-bottom: 20px;
                        page-break-inside: avoid;
                    }
                    .print-view .detail-header {
                        background-color: #eee;
                        padding: 6px 12px;
                        font-weight: bold;
                        border: 1px solid #999;
                        border-bottom: none;
                        font-size: 11pt;
                    }
                    .print-view .detail-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr 1fr;
                        gap: 0;
                        border: 1px solid #999;
                    }
                    .print-view .detail-cell {
                        padding: 6px 12px;
                        border-right: 1px solid #ddd;
                        border-bottom: 1px solid #ddd;
                    }
                    .print-view .detail-cell label {
                        display: block;
                        font-size: 7pt;
                        text-transform: uppercase;
                        color: #666;
                        font-weight: bold;
                        margin-bottom: 2px;
                    }
                    .print-view .detail-cell span {
                        font-size: 10pt;
                    }
                    .print-view .signature-line {
                        margin-top: 40px;
                        display: flex;
                        gap: 48px;
                    }
                    .print-view .signature-line div {
                        flex: 1;
                        border-top: 1px solid #333;
                        padding-top: 4px;
                        font-size: 8pt;
                        color: #666;
                    }
                `}</style>

                <div className="header">
                    <h1>PESTICIDE / FERTILIZER APPLICATION LOG</h1>
                    <p>
                        {dateRange
                            ? `${formatDate(dateRange.start)} — ${formatDate(dateRange.end)}`
                            : `Generated ${today}`}
                        {' '} | {applications.length} Application{applications.length !== 1 ? 's' : ''}
                    </p>
                </div>

                {/* Summary Table */}
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Product</th>
                            <th>EPA Reg #</th>
                            <th>Active Ingredient</th>
                            <th>Rate</th>
                            <th>Total Used</th>
                            <th>Area</th>
                            <th>Area Size</th>
                            <th>Method</th>
                            <th>Operator</th>
                            <th>REI</th>
                            <th>Weather</th>
                            <th>Temp</th>
                            <th>Wind</th>
                        </tr>
                    </thead>
                    <tbody>
                        {applications.map((app) => (
                            <tr key={app.id}>
                                <td>{formatDate(app.application_date)}</td>
                                <td style={{ fontWeight: 'bold' }}>{app.product_name}</td>
                                <td>{app.epa_registration_number || '--'}</td>
                                <td>{app.active_ingredient || '--'}</td>
                                <td>{app.application_rate}</td>
                                <td>{app.total_amount_used || '--'}</td>
                                <td>{app.area_applied}</td>
                                <td>{app.area_size || '--'}</td>
                                <td>{formatMethod(app.method)}</td>
                                <td>{getOperatorName(app.operator_id)}</td>
                                <td>{app.rei_hours ? `${app.rei_hours}h` : '--'}</td>
                                <td>{app.weather_conditions || '--'}</td>
                                <td>{app.temperature || '--'}</td>
                                <td>{app.wind_speed || '--'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Signature Lines */}
                <div className="signature-line">
                    <div>Superintendent Signature</div>
                    <div>Date</div>
                    <div>Reviewed By</div>
                    <div>Date</div>
                </div>

                <div className="footer">
                    TurfSheet — Pesticide &amp; Fertilizer Application Record — Printed {today}
                </div>
            </div>
        );
    }
);

ApplicationPrintView.displayName = 'ApplicationPrintView';

export default ApplicationPrintView;
