import React, { useState } from 'react';
import type { Staff, ChemicalProduct } from '../../types';

interface PesticideFormProps {
    onSubmit: (data: any) => void;
    onCancel: () => void;
    staffMembers: Staff[];
    products?: ChemicalProduct[];
}

export default function PesticideForm({ onSubmit, onCancel, staffMembers, products = [] }: PesticideFormProps) {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().slice(0, 5);

    const [formData, setFormData] = useState({
        application_date: today,
        application_time: now,
        operator_id: '',
        applicator_license: '',
        product_name: '',
        epa_registration_number: '',
        active_ingredient: '',
        target_pest: '',
        application_rate: '',
        total_amount_used: '',
        area_applied: '',
        area_size: '',
        method: '',
        rei_hours: '',
        weather_conditions: '',
        temperature: '',
        wind_speed: '',
        wind_direction: '',
        humidity: '',
        notes: ''
    });

    const [selectedProductId, setSelectedProductId] = useState<string>('');

    const handleProductSelect = (productId: string) => {
        setSelectedProductId(productId);
        if (!productId) return;

        const product = products.find(p => p.id === parseInt(productId));
        if (!product) return;

        setFormData(prev => ({
            ...prev,
            product_name: product.name,
            epa_registration_number: product.epa_registration || '',
            active_ingredient: product.active_ingredient || '',
            application_rate: product.default_rate
                ? `${product.default_rate} ${product.rate_unit.replace('sqft', ' sq ft')}`
                : '',
            rei_hours: product.rei_hours ? product.rei_hours.toString() : '',
            method: product.carrier_volume_gal === 0 ? 'granular' : (prev.method || 'spray'),
        }));
    };

    const selectedProduct = selectedProductId
        ? products.find(p => p.id === parseInt(selectedProductId))
        : null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const cleanedData = {
            ...formData,
            operator_id: formData.operator_id || undefined,
            applicator_license: formData.applicator_license || undefined,
            application_time: formData.application_time || undefined,
            epa_registration_number: formData.epa_registration_number || undefined,
            active_ingredient: formData.active_ingredient || undefined,
            target_pest: formData.target_pest || undefined,
            total_amount_used: formData.total_amount_used || undefined,
            area_size: formData.area_size || undefined,
            method: formData.method || undefined,
            rei_hours: formData.rei_hours ? parseInt(formData.rei_hours) : undefined,
            weather_conditions: formData.weather_conditions || undefined,
            temperature: formData.temperature || undefined,
            wind_speed: formData.wind_speed || undefined,
            wind_direction: formData.wind_direction || undefined,
            humidity: formData.humidity || undefined,
            notes: formData.notes || undefined
        };
        onSubmit(cleanedData);
    };

    const inputClasses = "w-full bg-dashboard-bg border border-border-color px-4 py-3 text-sm focus:border-turf-green outline-none transition-colors font-sans";
    const labelClasses = "block text-[0.65rem] font-heading font-black text-text-secondary uppercase tracking-widest mb-2";

    const SIGNAL_COLORS: Record<string, string> = {
        CAUTION: 'bg-yellow-50 border-yellow-400 text-yellow-800',
        WARNING: 'bg-orange-50 border-orange-400 text-orange-800',
        DANGER: 'bg-red-50 border-red-400 text-red-800',
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Library Selection */}
            {products.length > 0 && (
                <div className="bg-turf-green-light border border-turf-green/30 p-4">
                    <label className={labelClasses}>Select from Product Library</label>
                    <select
                        className={inputClasses}
                        value={selectedProductId}
                        onChange={(e) => handleProductSelect(e.target.value)}
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

            {/* Warnings for selected product */}
            {selectedProduct && (selectedProduct.warnings || selectedProduct.signal_word) && (
                <div className={`border-l-4 p-3 text-xs ${SIGNAL_COLORS[selectedProduct.signal_word || 'CAUTION']}`}>
                    <p className="font-heading font-black uppercase tracking-wider text-[0.6rem] mb-1">
                        {selectedProduct.signal_word || 'CAUTION'} — {selectedProduct.name}
                    </p>
                    {selectedProduct.warnings && (
                        <p className="font-sans leading-relaxed">{selectedProduct.warnings}</p>
                    )}
                </div>
            )}

            {/* Row 1: Date | Time | Operator */}
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className={labelClasses}>Application Date *</label>
                    <input
                        required
                        type="date"
                        className={inputClasses}
                        value={formData.application_date}
                        onChange={(e) => setFormData({ ...formData, application_date: e.target.value })}
                    />
                </div>
                <div>
                    <label className={labelClasses}>Application Time</label>
                    <input
                        type="time"
                        className={inputClasses}
                        value={formData.application_time}
                        onChange={(e) => setFormData({ ...formData, application_time: e.target.value })}
                    />
                </div>
                <div>
                    <label className={labelClasses}>Operator *</label>
                    <select
                        required
                        className={inputClasses}
                        value={formData.operator_id}
                        onChange={(e) => setFormData({ ...formData, operator_id: e.target.value })}
                    >
                        <option value="">Select operator...</option>
                        {staffMembers.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Applicator License (Idaho requirement) */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>Applicator License # (Idaho)</label>
                    <input
                        type="text"
                        className={inputClasses}
                        placeholder="e.g. ID-12345"
                        value={formData.applicator_license}
                        onChange={(e) => setFormData({ ...formData, applicator_license: e.target.value })}
                    />
                </div>
                <div>
                    <label className={labelClasses}>Target Pest / Purpose</label>
                    <input
                        type="text"
                        className={inputClasses}
                        placeholder="e.g. Dollar spot, broadleaf weeds"
                        value={formData.target_pest}
                        onChange={(e) => setFormData({ ...formData, target_pest: e.target.value })}
                    />
                </div>
            </div>

            {/* Product | EPA # */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>Product Name *</label>
                    <input
                        required
                        type="text"
                        className={inputClasses}
                        placeholder="e.g. Primo Maxx"
                        value={formData.product_name}
                        onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                    />
                </div>
                <div>
                    <label className={labelClasses}>EPA Registration #</label>
                    <input
                        type="text"
                        className={inputClasses}
                        placeholder="e.g. 100-1164"
                        value={formData.epa_registration_number}
                        onChange={(e) => setFormData({ ...formData, epa_registration_number: e.target.value })}
                    />
                </div>
            </div>

            {/* Active Ingredient */}
            <div>
                <label className={labelClasses}>Active Ingredient</label>
                <input
                    type="text"
                    className={inputClasses}
                    placeholder="e.g. Trinexapac-ethyl"
                    value={formData.active_ingredient}
                    onChange={(e) => setFormData({ ...formData, active_ingredient: e.target.value })}
                />
            </div>

            {/* Application Rate | Total Amount */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>Application Rate *</label>
                    <input
                        required
                        type="text"
                        className={inputClasses}
                        placeholder="e.g. 2 oz/1000 sq ft"
                        value={formData.application_rate}
                        onChange={(e) => setFormData({ ...formData, application_rate: e.target.value })}
                    />
                </div>
                <div>
                    <label className={labelClasses}>Total Amount Used</label>
                    <input
                        type="text"
                        className={inputClasses}
                        placeholder="e.g. 32 oz"
                        value={formData.total_amount_used}
                        onChange={(e) => setFormData({ ...formData, total_amount_used: e.target.value })}
                    />
                </div>
            </div>

            {/* Area Applied | Area Size */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>Area / Location Applied *</label>
                    <input
                        required
                        type="text"
                        className={inputClasses}
                        placeholder="e.g. Greens 1-9, Fairway 5"
                        value={formData.area_applied}
                        onChange={(e) => setFormData({ ...formData, area_applied: e.target.value })}
                    />
                </div>
                <div>
                    <label className={labelClasses}>Area Size (sq ft or acres)</label>
                    <input
                        type="text"
                        className={inputClasses}
                        placeholder="e.g. 45,000 sq ft"
                        value={formData.area_size}
                        onChange={(e) => setFormData({ ...formData, area_size: e.target.value })}
                    />
                </div>
            </div>

            {/* Method | REI Hours */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>Application Method</label>
                    <select
                        className={inputClasses}
                        value={formData.method}
                        onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                    >
                        <option value="">Select method...</option>
                        <option value="spray">Spray</option>
                        <option value="granular">Granular</option>
                        <option value="injection">Injection</option>
                        <option value="drench">Drench</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div>
                    <label className={labelClasses}>REI (Hours)</label>
                    <input
                        type="number"
                        min="0"
                        className={inputClasses}
                        placeholder="Hours"
                        value={formData.rei_hours}
                        onChange={(e) => setFormData({ ...formData, rei_hours: e.target.value })}
                    />
                </div>
            </div>

            {/* Weather Conditions - Idaho compliance */}
            <div className="border-t border-border-color pt-4">
                <p className="text-[0.6rem] font-heading font-black text-text-secondary uppercase tracking-widest mb-3">
                    Weather Conditions at Time of Application
                </p>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClasses}>Temperature (F)</label>
                        <input
                            type="text"
                            className={inputClasses}
                            placeholder="e.g. 72"
                            value={formData.temperature}
                            onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className={labelClasses}>Wind Speed (mph)</label>
                        <input
                            type="text"
                            className={inputClasses}
                            placeholder="e.g. 5"
                            value={formData.wind_speed}
                            onChange={(e) => setFormData({ ...formData, wind_speed: e.target.value })}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                        <label className={labelClasses}>Wind Direction</label>
                        <select
                            className={inputClasses}
                            value={formData.wind_direction}
                            onChange={(e) => setFormData({ ...formData, wind_direction: e.target.value })}
                        >
                            <option value="">Select...</option>
                            <option value="N">North</option>
                            <option value="NE">Northeast</option>
                            <option value="E">East</option>
                            <option value="SE">Southeast</option>
                            <option value="S">South</option>
                            <option value="SW">Southwest</option>
                            <option value="W">West</option>
                            <option value="NW">Northwest</option>
                            <option value="Calm">Calm</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelClasses}>Humidity %</label>
                        <input
                            type="text"
                            className={inputClasses}
                            placeholder="e.g. 45"
                            value={formData.humidity}
                            onChange={(e) => setFormData({ ...formData, humidity: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className={labelClasses}>Sky Conditions</label>
                        <select
                            className={inputClasses}
                            value={formData.weather_conditions}
                            onChange={(e) => setFormData({ ...formData, weather_conditions: e.target.value })}
                        >
                            <option value="">Select...</option>
                            <option value="Clear">Clear</option>
                            <option value="Partly Cloudy">Partly Cloudy</option>
                            <option value="Overcast">Overcast</option>
                            <option value="Light Rain">Light Rain</option>
                            <option value="Rain">Rain</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Notes */}
            <div>
                <label className={labelClasses}>Notes</label>
                <textarea
                    className={`${inputClasses} min-h-[100px] resize-none`}
                    placeholder="Additional notes about this application..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
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
                    Record Application
                </button>
            </div>
        </form>
    );
}
