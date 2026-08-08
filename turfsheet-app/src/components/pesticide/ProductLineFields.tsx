import { AlertTriangle, Trash2 } from 'lucide-react';
import SelectWithOther from '../ui/SelectWithOther';
import { METHOD_OPTIONS } from '../../lib/pesticideOptions';
import type { ChemicalProduct, ProductLineDraft } from '../../types';

interface ProductLineFieldsProps {
    line: ProductLineDraft;
    index: number;
    products: ChemicalProduct[];
    canRemove: boolean;
    weatherAlerts: { severity: 'danger' | 'warning'; message: string }[];
    onChange: (patch: Partial<ProductLineDraft>) => void;
    onProductSelect: (productId: string) => void;
    onRemove: () => void;
    selectedProductId: string;
    inputClasses: string;
    labelClasses: string;
}

const SIGNAL_COLORS: Record<string, string> = {
    CAUTION: 'bg-yellow-50 border-yellow-400 text-yellow-800',
    WARNING: 'bg-orange-50 border-orange-400 text-orange-800',
    DANGER: 'bg-red-50 border-red-400 text-red-800',
};

export default function ProductLineFields({
    line,
    index,
    products,
    canRemove,
    weatherAlerts,
    onChange,
    onProductSelect,
    onRemove,
    selectedProductId,
    inputClasses,
    labelClasses,
}: ProductLineFieldsProps) {
    const selectedProduct = selectedProductId
        ? products.find((p) => String(p.id) === selectedProductId)
        : null;

    return (
        <div className="border border-border-color bg-panel-white p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
                <h4 className="text-[0.65rem] font-heading font-black uppercase tracking-widest text-text-secondary">
                    Product {index + 1}
                </h4>
                {canRemove && (
                    <button
                        type="button"
                        onClick={onRemove}
                        className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800 font-heading font-black uppercase tracking-wider"
                    >
                        <Trash2 size={14} />
                        Remove
                    </button>
                )}
            </div>

            {products.length > 0 && (
                <div className="bg-turf-green-light border border-turf-green/30 p-3">
                    <label className={labelClasses}>Select from Product Library</label>
                    <select
                        className={inputClasses}
                        value={selectedProductId}
                        onChange={(e) => onProductSelect(e.target.value)}
                    >
                        <option value="">-- Type manually or select a product --</option>
                        {products.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name} {p.signal_word ? `[${p.signal_word}]` : ''}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {selectedProduct && (selectedProduct.warnings || selectedProduct.signal_word) && (
                <div
                    className={`border-l-4 p-3 text-xs ${
                        SIGNAL_COLORS[selectedProduct.signal_word || 'CAUTION']
                    }`}
                >
                    <p className="font-heading font-black uppercase tracking-wider text-[0.6rem] mb-1">
                        {selectedProduct.signal_word || 'CAUTION'} — {selectedProduct.name}
                    </p>
                    {selectedProduct.warnings && (
                        <p className="font-sans leading-relaxed">{selectedProduct.warnings}</p>
                    )}
                </div>
            )}

            {weatherAlerts.length > 0 && (
                <div className="space-y-2">
                    {weatherAlerts.map((alert, i) => (
                        <div
                            key={i}
                            className={`flex items-center gap-3 px-4 py-3 text-sm ${
                                alert.severity === 'danger'
                                    ? 'bg-red-50 border border-red-200 text-red-700'
                                    : 'bg-amber-50 border border-amber-200 text-amber-700'
                            }`}
                        >
                            <AlertTriangle size={16} className="flex-shrink-0" />
                            <span>{alert.message}</span>
                        </div>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>Product Name *</label>
                    <input
                        required
                        type="text"
                        className={inputClasses}
                        placeholder="e.g. Primo Maxx"
                        value={line.product_name}
                        onChange={(e) => onChange({ product_name: e.target.value })}
                    />
                </div>
                <div>
                    <label className={labelClasses}>EPA Registration #</label>
                    <input
                        type="text"
                        className={inputClasses}
                        placeholder="e.g. 100-1164"
                        value={line.epa_registration_number}
                        onChange={(e) => onChange({ epa_registration_number: e.target.value })}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>EPA Lot Number</label>
                    <input
                        type="text"
                        className={inputClasses}
                        placeholder="From product container"
                        value={line.epa_lot_number}
                        onChange={(e) => onChange({ epa_lot_number: e.target.value })}
                    />
                </div>
                <div>
                    <label className={labelClasses}>Manufacturer</label>
                    <input
                        type="text"
                        className={inputClasses}
                        placeholder="e.g. Syngenta"
                        value={line.manufacturer}
                        onChange={(e) => onChange({ manufacturer: e.target.value })}
                    />
                </div>
            </div>

            <div>
                <label className={labelClasses}>Active Ingredient</label>
                <input
                    type="text"
                    className={inputClasses}
                    placeholder="e.g. Trinexapac-ethyl"
                    value={line.active_ingredient}
                    onChange={(e) => onChange({ active_ingredient: e.target.value })}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>Application Rate *</label>
                    <input
                        required
                        type="text"
                        className={inputClasses}
                        placeholder="e.g. 2 oz/1000 sq ft"
                        value={line.application_rate}
                        onChange={(e) => onChange({ application_rate: e.target.value })}
                    />
                </div>
                <div>
                    <label className={labelClasses}>Total Amount Used</label>
                    <input
                        type="text"
                        className={inputClasses}
                        placeholder="e.g. 32 oz"
                        value={line.total_amount_used}
                        onChange={(e) => onChange({ total_amount_used: e.target.value })}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>Amount per Tank</label>
                    <input
                        type="text"
                        className={inputClasses}
                        placeholder="e.g., 32 oz"
                        value={line.amount_per_tank}
                        onChange={(e) => onChange({ amount_per_tank: e.target.value })}
                    />
                </div>
                <div>
                    <label className={labelClasses}>REI (Hours)</label>
                    <input
                        type="number"
                        min="0"
                        className={inputClasses}
                        placeholder="Hours"
                        value={line.rei_hours}
                        onChange={(e) => onChange({ rei_hours: e.target.value })}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>Target Pest / Purpose</label>
                    <input
                        type="text"
                        className={inputClasses}
                        placeholder="e.g. Dollar spot, broadleaf weeds"
                        value={line.target_pest}
                        onChange={(e) => onChange({ target_pest: e.target.value })}
                    />
                </div>
                <SelectWithOther
                    label="Method override (optional)"
                    options={METHOD_OPTIONS}
                    value={line.method}
                    onChange={(v) => onChange({ method: v })}
                    placeholder="Inherit event method..."
                    otherPlaceholder="Describe the method..."
                    inputClasses={inputClasses}
                    labelClasses={labelClasses}
                />
            </div>
        </div>
    );
}
