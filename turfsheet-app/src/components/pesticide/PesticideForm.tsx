import React, { useState } from 'react';
import type { Staff } from '../../types';

interface PesticideFormProps {
    onSubmit: (data: any) => void;
    onCancel: () => void;
    staffMembers: Staff[];
}

export default function PesticideForm({ onSubmit, onCancel, staffMembers }: PesticideFormProps) {
    const today = new Date().toISOString().split('T')[0];

    const [formData, setFormData] = useState({
        application_date: today,
        operator_id: '',
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
        notes: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const cleanedData = {
            ...formData,
            operator_id: formData.operator_id || undefined,
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
            notes: formData.notes || undefined
        };
        onSubmit(cleanedData);
    };

    const inputClasses = "w-full bg-dashboard-bg border border-border-color px-4 py-3 text-sm focus:border-turf-green outline-none transition-colors font-sans";
    const labelClasses = "block text-[0.65rem] font-heading font-black text-text-secondary uppercase tracking-widest mb-2";

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Row 1: Date | Operator */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>Application Date</label>
                    <input
                        required
                        type="date"
                        className={inputClasses}
                        value={formData.application_date}
                        onChange={(e) => setFormData({ ...formData, application_date: e.target.value })}
                    />
                </div>
                <div>
                    <label className={labelClasses}>Operator</label>
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

            {/* Row 2: Product | EPA # */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>Product Name</label>
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

            {/* Row 3: Active Ingredient | Target Pest */}
            <div className="grid grid-cols-2 gap-4">
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
                <div>
                    <label className={labelClasses}>Target Pest</label>
                    <input
                        type="text"
                        className={inputClasses}
                        placeholder="e.g. Dollar spot, crabgrass"
                        value={formData.target_pest}
                        onChange={(e) => setFormData({ ...formData, target_pest: e.target.value })}
                    />
                </div>
            </div>

            {/* Row 4: Application Rate | Total Amount */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>Application Rate</label>
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

            {/* Row 5: Area Applied | Area Size */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>Area Applied</label>
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
                    <label className={labelClasses}>Area Size</label>
                    <input
                        type="text"
                        className={inputClasses}
                        placeholder="e.g. 45,000 sq ft"
                        value={formData.area_size}
                        onChange={(e) => setFormData({ ...formData, area_size: e.target.value })}
                    />
                </div>
            </div>

            {/* Row 6: Method | REI Hours */}
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

            {/* Row 7: Weather | Temperature | Wind Speed */}
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className={labelClasses}>Weather Conditions</label>
                    <input
                        type="text"
                        className={inputClasses}
                        placeholder="e.g. Sunny, clear"
                        value={formData.weather_conditions}
                        onChange={(e) => setFormData({ ...formData, weather_conditions: e.target.value })}
                    />
                </div>
                <div>
                    <label className={labelClasses}>Temperature</label>
                    <input
                        type="text"
                        className={inputClasses}
                        placeholder="e.g. 72F"
                        value={formData.temperature}
                        onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                    />
                </div>
                <div>
                    <label className={labelClasses}>Wind Speed</label>
                    <input
                        type="text"
                        className={inputClasses}
                        placeholder="e.g. 5 mph"
                        value={formData.wind_speed}
                        onChange={(e) => setFormData({ ...formData, wind_speed: e.target.value })}
                    />
                </div>
            </div>

            {/* Row 8: Notes */}
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
