import React, { useState, useEffect } from 'react';
import type { ChemicalProduct, ChemicalProductType, RateUnit, SignalWord } from '../../types';

interface ProductFormProps {
    onSubmit: (data: Omit<ChemicalProduct, 'id' | 'created_at' | 'updated_at'>) => void;
    onCancel: () => void;
    initialData?: ChemicalProduct;
    existingNames?: string[];
}

const PRODUCT_TYPES: { value: ChemicalProductType; label: string }[] = [
    { value: 'HERBICIDE', label: 'Herbicide' },
    { value: 'FUNGICIDE', label: 'Fungicide' },
    { value: 'INSECTICIDE', label: 'Insecticide' },
    { value: 'FERTILIZER', label: 'Fertilizer' },
    { value: 'PGR', label: 'Plant Growth Regulator' },
    { value: 'ALGAECIDE', label: 'Algaecide' },
    { value: 'IRON_SUPPLEMENT', label: 'Iron Supplement' },
    { value: 'SURFACTANT', label: 'Surfactant' },
    { value: 'OTHER', label: 'Other' },
];

const RATE_UNITS: { value: RateUnit; label: string }[] = [
    { value: 'oz/1000sqft', label: 'oz / 1,000 sq ft' },
    { value: 'lbs/1000sqft', label: 'lbs / 1,000 sq ft' },
    { value: 'oz/acre', label: 'oz / acre' },
    { value: 'lbs/acre', label: 'lbs / acre' },
];

export default function ProductForm({ onSubmit, onCancel, initialData, existingNames }: ProductFormProps) {
    const [formData, setFormData] = useState({
        name: '',
        type: 'HERBICIDE' as ChemicalProductType,
        manufacturer: '',
        epa_registration: '',
        active_ingredient: '',
        concentration_pct: '',
        analysis: '',
        rei_hours: '0',
        default_rate: '',
        rate_unit: 'oz/1000sqft' as RateUnit,
        carrier_volume_gal: '2',
        signal_word: '' as string,
        warnings: '',
        max_wind_mph: '',
        min_temp_f: '',
        max_temp_f: '',
        rain_delay_hours: '',
        notes: '',
        is_active: true,
    });

    const [nameError, setNameError] = useState('');

    const checkDuplicate = (name: string): boolean => {
        if (!existingNames) return false;
        const isDuplicate = existingNames.some(
            n => n.toLowerCase() === name.trim().toLowerCase() &&
            (!initialData || n.toLowerCase() !== initialData.name.toLowerCase())
        );
        if (isDuplicate) {
            setNameError('A product with this name already exists');
            return true;
        }
        setNameError('');
        return false;
    };

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                type: initialData.type,
                manufacturer: initialData.manufacturer || '',
                epa_registration: initialData.epa_registration || '',
                active_ingredient: initialData.active_ingredient || '',
                concentration_pct: initialData.concentration_pct?.toString() || '',
                analysis: initialData.analysis || '',
                rei_hours: initialData.rei_hours.toString(),
                default_rate: initialData.default_rate?.toString() || '',
                rate_unit: initialData.rate_unit,
                carrier_volume_gal: initialData.carrier_volume_gal.toString(),
                signal_word: initialData.signal_word || '',
                warnings: initialData.warnings || '',
                max_wind_mph: initialData.max_wind_mph?.toString() || '',
                min_temp_f: initialData.min_temp_f?.toString() || '',
                max_temp_f: initialData.max_temp_f?.toString() || '',
                rain_delay_hours: initialData.rain_delay_hours?.toString() || '',
                notes: initialData.notes || '',
                is_active: initialData.is_active,
            });
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (checkDuplicate(formData.name)) return;
        onSubmit({
            name: formData.name,
            type: formData.type,
            manufacturer: formData.manufacturer || undefined,
            epa_registration: formData.epa_registration || undefined,
            active_ingredient: formData.active_ingredient || undefined,
            concentration_pct: formData.concentration_pct ? parseFloat(formData.concentration_pct) : undefined,
            analysis: formData.analysis || undefined,
            rei_hours: parseInt(formData.rei_hours) || 0,
            default_rate: formData.default_rate ? parseFloat(formData.default_rate) : undefined,
            rate_unit: formData.rate_unit,
            carrier_volume_gal: parseFloat(formData.carrier_volume_gal) || 2,
            signal_word: (formData.signal_word as SignalWord) || undefined,
            warnings: formData.warnings || undefined,
            max_wind_mph: formData.max_wind_mph ? parseInt(formData.max_wind_mph) : undefined,
            min_temp_f: formData.min_temp_f ? parseInt(formData.min_temp_f) : undefined,
            max_temp_f: formData.max_temp_f ? parseInt(formData.max_temp_f) : undefined,
            rain_delay_hours: formData.rain_delay_hours ? parseInt(formData.rain_delay_hours) : undefined,
            notes: formData.notes || undefined,
            is_active: formData.is_active,
        });
    };

    const inputClasses = "w-full bg-dashboard-bg border border-border-color px-4 py-3 text-sm focus:border-turf-green outline-none transition-colors font-sans";
    const labelClasses = "block text-[0.65rem] font-heading font-black text-text-secondary uppercase tracking-widest mb-2";

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Row 1: Name | Type */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>Product Name *</label>
                    <input
                        required
                        type="text"
                        className={`${inputClasses}${nameError ? ' border-red-400' : ''}`}
                        placeholder="e.g. 2,4-D Amine"
                        value={formData.name}
                        onChange={(e) => { setFormData({ ...formData, name: e.target.value }); if (nameError) setNameError(''); }}
                        onBlur={(e) => checkDuplicate(e.target.value)}
                    />
                    {nameError && (
                        <p className="text-red-600 text-xs mt-1">{nameError}</p>
                    )}
                </div>
                <div>
                    <label className={labelClasses}>Product Type *</label>
                    <select
                        required
                        className={inputClasses}
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as ChemicalProductType })}
                    >
                        {PRODUCT_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Row 2: Manufacturer | EPA Registration */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>Manufacturer</label>
                    <input
                        type="text"
                        className={inputClasses}
                        placeholder="e.g. Alligare, Bayer"
                        value={formData.manufacturer}
                        onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    />
                </div>
                <div>
                    <label className={labelClasses}>EPA Registration #</label>
                    <input
                        type="text"
                        className={inputClasses}
                        placeholder="e.g. 81927-23"
                        value={formData.epa_registration}
                        onChange={(e) => setFormData({ ...formData, epa_registration: e.target.value })}
                    />
                </div>
            </div>

            {/* Row 3: Active Ingredient | Concentration */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>Active Ingredient</label>
                    <input
                        type="text"
                        className={inputClasses}
                        placeholder="e.g. 2,4-Dichlorophenoxyacetic acid"
                        value={formData.active_ingredient}
                        onChange={(e) => setFormData({ ...formData, active_ingredient: e.target.value })}
                    />
                </div>
                <div>
                    <label className={labelClasses}>Concentration %</label>
                    <input
                        type="number"
                        step="0.001"
                        min="0"
                        max="100"
                        className={inputClasses}
                        placeholder="e.g. 47.2"
                        value={formData.concentration_pct}
                        onChange={(e) => setFormData({ ...formData, concentration_pct: e.target.value })}
                    />
                </div>
            </div>

            {/* Row 4: Analysis | REI Hours */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>Fertilizer Analysis (N-P-K)</label>
                    <input
                        type="text"
                        className={inputClasses}
                        placeholder="e.g. 20-5-30"
                        value={formData.analysis}
                        onChange={(e) => setFormData({ ...formData, analysis: e.target.value })}
                    />
                </div>
                <div>
                    <label className={labelClasses}>REI (Re-Entry Interval Hours)</label>
                    <input
                        type="number"
                        min="0"
                        className={inputClasses}
                        placeholder="0"
                        value={formData.rei_hours}
                        onChange={(e) => setFormData({ ...formData, rei_hours: e.target.value })}
                    />
                </div>
            </div>

            {/* Row 5: Default Rate | Rate Unit */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>Label Rate (Default)</label>
                    <input
                        type="number"
                        step="0.0001"
                        min="0"
                        className={inputClasses}
                        placeholder="e.g. 1.5"
                        value={formData.default_rate}
                        onChange={(e) => setFormData({ ...formData, default_rate: e.target.value })}
                    />
                </div>
                <div>
                    <label className={labelClasses}>Rate Unit</label>
                    <select
                        className={inputClasses}
                        value={formData.rate_unit}
                        onChange={(e) => setFormData({ ...formData, rate_unit: e.target.value as RateUnit })}
                    >
                        {RATE_UNITS.map((u) => (
                            <option key={u.value} value={u.value}>{u.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Row 6: Carrier Volume | Signal Word */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>Carrier Water (gal / 1,000 sq ft)</label>
                    <input
                        type="number"
                        step="0.1"
                        min="0"
                        className={inputClasses}
                        placeholder="2.0"
                        value={formData.carrier_volume_gal}
                        onChange={(e) => setFormData({ ...formData, carrier_volume_gal: e.target.value })}
                    />
                </div>
                <div>
                    <label className={labelClasses}>Signal Word</label>
                    <select
                        className={inputClasses}
                        value={formData.signal_word}
                        onChange={(e) => setFormData({ ...formData, signal_word: e.target.value })}
                    >
                        <option value="">None</option>
                        <option value="CAUTION">CAUTION</option>
                        <option value="WARNING">WARNING</option>
                        <option value="DANGER">DANGER</option>
                    </select>
                </div>
            </div>

            {/* Row 7: Weather Restrictions */}
            <div className="grid grid-cols-4 gap-4">
                <div>
                    <label className={labelClasses}>Max Wind (mph)</label>
                    <input
                        type="number"
                        min="0"
                        className={inputClasses}
                        placeholder="e.g. 15"
                        value={formData.max_wind_mph}
                        onChange={(e) => setFormData({ ...formData, max_wind_mph: e.target.value })}
                    />
                </div>
                <div>
                    <label className={labelClasses}>Min Temp (F)</label>
                    <input
                        type="number"
                        className={inputClasses}
                        placeholder="e.g. 50"
                        value={formData.min_temp_f}
                        onChange={(e) => setFormData({ ...formData, min_temp_f: e.target.value })}
                    />
                </div>
                <div>
                    <label className={labelClasses}>Max Temp (F)</label>
                    <input
                        type="number"
                        className={inputClasses}
                        placeholder="e.g. 85"
                        value={formData.max_temp_f}
                        onChange={(e) => setFormData({ ...formData, max_temp_f: e.target.value })}
                    />
                </div>
                <div>
                    <label className={labelClasses}>Rain Delay (hrs)</label>
                    <input
                        type="number"
                        min="0"
                        className={inputClasses}
                        placeholder="e.g. 24"
                        value={formData.rain_delay_hours}
                        onChange={(e) => setFormData({ ...formData, rain_delay_hours: e.target.value })}
                    />
                </div>
            </div>

            {/* Warnings & Cautions */}
            <div>
                <label className={labelClasses}>Label Warnings & Cautions</label>
                <textarea
                    className={`${inputClasses} min-h-[100px] resize-none`}
                    placeholder="Key warnings from the product label (environmental hazards, PPE requirements, application restrictions...)"
                    value={formData.warnings}
                    onChange={(e) => setFormData({ ...formData, warnings: e.target.value })}
                />
            </div>

            {/* Notes */}
            <div>
                <label className={labelClasses}>Notes</label>
                <textarea
                    className={`${inputClasses} min-h-[80px] resize-none`}
                    placeholder="Application tips, mixing instructions, etc."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
            </div>

            {/* Active checkbox */}
            <div>
                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        className="w-4 h-4 accent-turf-green"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    <span className="text-sm font-sans text-text-primary">Active Product</span>
                </label>
            </div>

            {/* Buttons */}
            <div className="pt-4 flex gap-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 px-6 py-4 border border-border-color text-text-secondary font-heading font-black text-[0.7rem] uppercase tracking-[0.2em] hover:bg-dashboard-bg transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="flex-1 px-6 py-4 bg-turf-green text-white font-heading font-black text-[0.7rem] uppercase tracking-[0.2em] hover:bg-turf-green-dark transition-colors shadow-sm"
                >
                    {initialData ? 'Update Product' : 'Add Product'}
                </button>
            </div>
        </form>
    );
}
