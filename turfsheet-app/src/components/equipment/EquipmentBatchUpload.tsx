import { useState } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import type { Equipment } from '../../types';

interface EquipmentBatchUploadProps {
    onUpload: (equipment: Partial<Equipment>[]) => Promise<void>;
    onCancel: () => void;
}

interface ParsedRow {
    row: number;
    data?: Partial<Equipment>;
    error?: string;
}

export default function EquipmentBatchUpload({ onUpload, onCancel }: EquipmentBatchUploadProps) {
    const [_file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadComplete, setUploadComplete] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            parseCSV(selectedFile);
        }
    };

    const parseCSV = async (file: File) => {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
            alert('CSV file must have a header row and at least one data row');
            return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const parsed: ParsedRow[] = [];

        // Expected columns: name, equipment_number, category, status, manufacturer, model, description, purchase_date, purchase_cost
        const requiredColumns = ['name', 'category'];
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));

        if (missingColumns.length > 0) {
            alert(`CSV is missing required columns: ${missingColumns.join(', ')}`);
            return;
        }

        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            const row: ParsedRow = { row: i + 1 };

            try {
                const equipment: Partial<Equipment> = {};

                headers.forEach((header, index) => {
                    const value = values[index]?.trim();
                    if (!value) return;

                    switch (header) {
                        case 'name':
                            equipment.name = value;
                            break;
                        case 'equipment_number':
                            equipment.equipment_number = value;
                            break;
                        case 'category':
                            if (!['Mowers', 'Carts', 'Tools', 'Other'].includes(value)) {
                                throw new Error(`Invalid category: ${value}. Must be Mowers, Carts, Tools, or Other`);
                            }
                            equipment.category = value as Equipment['category'];
                            break;
                        case 'status':
                            if (!['Active', 'Maintenance', 'Retired'].includes(value)) {
                                throw new Error(`Invalid status: ${value}. Must be Active, Maintenance, or Retired`);
                            }
                            equipment.status = value as Equipment['status'];
                            break;
                        case 'manufacturer':
                            equipment.manufacturer = value;
                            break;
                        case 'model':
                            equipment.model = value;
                            break;
                        case 'description':
                            equipment.description = value;
                            break;
                        case 'purchase_date':
                            equipment.purchase_date = value;
                            break;
                        case 'purchase_cost':
                            const cost = parseFloat(value);
                            if (!isNaN(cost)) {
                                equipment.purchase_cost = cost;
                            }
                            break;
                        case 'maintenance_notes':
                            equipment.maintenance_notes = value;
                            break;
                        case 'last_serviced_date':
                            equipment.last_serviced_date = value;
                            break;
                    }
                });

                // Validate required fields
                if (!equipment.name) {
                    throw new Error('Name is required');
                }
                if (!equipment.category) {
                    throw new Error('Category is required');
                }

                row.data = equipment;
            } catch (err) {
                row.error = err instanceof Error ? err.message : 'Unknown error';
            }

            parsed.push(row);
        }

        setParsedData(parsed);
    };

    // Simple CSV line parser (handles quoted fields with commas)
    const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);

        return result.map(v => v.trim().replace(/^"|"$/g, ''));
    };

    const handleUpload = async () => {
        const validRows = parsedData.filter(row => row.data && !row.error);
        if (validRows.length === 0) {
            alert('No valid equipment to upload');
            return;
        }

        setUploading(true);
        try {
            await onUpload(validRows.map(row => row.data!));
            setUploadComplete(true);
        } catch (err) {
            alert('Upload failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
        } finally {
            setUploading(false);
        }
    };

    const validCount = parsedData.filter(row => row.data && !row.error).length;
    const errorCount = parsedData.filter(row => row.error).length;

    return (
        <div className="space-y-6 font-sans">
            {!uploadComplete ? (
                <>
                    {/* Instructions */}
                    <div className="bg-dashboard-bg border border-border-color p-4 space-y-2 text-sm">
                        <h4 className="font-heading font-black text-xs uppercase tracking-wider text-text-primary">
                            CSV Format Instructions
                        </h4>
                        <p className="text-text-secondary text-xs">
                            Your CSV file must include these columns (in any order):
                        </p>
                        <ul className="text-xs text-text-secondary space-y-1 ml-4 list-disc">
                            <li><strong>name</strong> (required) - Equipment name</li>
                            <li><strong>category</strong> (required) - Mowers, Carts, Tools, or Other</li>
                            <li><strong>equipment_number</strong> - Equipment number/ID</li>
                            <li><strong>status</strong> - Active, Maintenance, or Retired (defaults to Active)</li>
                            <li><strong>manufacturer</strong> - Manufacturer name</li>
                            <li><strong>model</strong> - Model name/number</li>
                            <li><strong>description</strong> - Equipment description</li>
                            <li><strong>purchase_date</strong> - Date (YYYY-MM-DD)</li>
                            <li><strong>purchase_cost</strong> - Cost (number)</li>
                            <li><strong>maintenance_notes</strong> - Maintenance notes</li>
                            <li><strong>last_serviced_date</strong> - Date (YYYY-MM-DD)</li>
                        </ul>
                        <div className="pt-2">
                            <a
                                href="/equipment-template.csv"
                                download
                                className="text-turf-green font-bold text-xs hover:underline"
                            >
                                Download CSV Template
                            </a>
                        </div>
                    </div>

                    {/* File Upload */}
                    <div>
                        <label className="block mb-2">
                            <span className="text-xs font-heading font-black uppercase tracking-wider text-text-secondary">
                                Select CSV File
                            </span>
                        </label>
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="bg-panel-white border border-border-color px-4 py-2 text-sm focus:border-turf-green outline-none transition-colors w-full"
                        />
                    </div>

                    {/* Preview */}
                    {parsedData.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="font-heading font-black text-xs uppercase tracking-wider text-text-primary">
                                    Preview ({parsedData.length} rows)
                                </h4>
                                <div className="flex gap-4 text-xs">
                                    <div className="flex items-center gap-1 text-turf-green">
                                        <CheckCircle className="w-3 h-3" />
                                        <span>{validCount} valid</span>
                                    </div>
                                    {errorCount > 0 && (
                                        <div className="flex items-center gap-1 text-red-500">
                                            <AlertCircle className="w-3 h-3" />
                                            <span>{errorCount} errors</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="max-h-64 overflow-y-auto border border-border-color">
                                <table className="w-full text-xs">
                                    <thead className="bg-dashboard-bg sticky top-0">
                                        <tr>
                                            <th className="text-left p-2 font-heading font-black uppercase tracking-wider">Row</th>
                                            <th className="text-left p-2 font-heading font-black uppercase tracking-wider">Name</th>
                                            <th className="text-left p-2 font-heading font-black uppercase tracking-wider">Category</th>
                                            <th className="text-left p-2 font-heading font-black uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parsedData.map((row, index) => (
                                            <tr
                                                key={index}
                                                className={row.error ? 'bg-red-50' : 'bg-white'}
                                            >
                                                <td className="p-2 border-t border-border-color">
                                                    {row.error ? (
                                                        <div className="flex items-center gap-1 text-red-500">
                                                            <AlertCircle className="w-3 h-3" />
                                                            {row.row}
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1 text-turf-green">
                                                            <CheckCircle className="w-3 h-3" />
                                                            {row.row}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-2 border-t border-border-color">
                                                    {row.error ? (
                                                        <span className="text-red-500">{row.error}</span>
                                                    ) : (
                                                        row.data?.name
                                                    )}
                                                </td>
                                                <td className="p-2 border-t border-border-color">{row.data?.category}</td>
                                                <td className="p-2 border-t border-border-color">{row.data?.status || 'Active'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-4 border-t border-border-color">
                        <button
                            onClick={onCancel}
                            className="flex-1 bg-panel-white border border-border-color px-6 py-3 font-heading font-black text-xs uppercase tracking-wider text-text-primary hover:bg-dashboard-bg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpload}
                            disabled={validCount === 0 || uploading}
                            className="flex-1 bg-turf-green px-6 py-3 font-heading font-black text-xs uppercase tracking-wider text-white hover:bg-turf-green-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {uploading ? 'Uploading...' : `Upload ${validCount} Equipment`}
                        </button>
                    </div>
                </>
            ) : (
                <div className="text-center space-y-4 py-8">
                    <CheckCircle className="w-16 h-16 text-turf-green mx-auto" />
                    <h3 className="font-heading font-black text-lg uppercase tracking-wider text-text-primary">
                        Upload Complete!
                    </h3>
                    <p className="text-sm text-text-secondary">
                        Successfully uploaded {validCount} equipment items
                    </p>
                    <button
                        onClick={onCancel}
                        className="bg-turf-green px-6 py-3 font-heading font-black text-xs uppercase tracking-wider text-white hover:bg-turf-green-dark transition-colors"
                    >
                        Close
                    </button>
                </div>
            )}
        </div>
    );
}
