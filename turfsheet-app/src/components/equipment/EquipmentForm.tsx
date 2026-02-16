import React, { useState } from 'react';

interface EquipmentFormProps {
    onSubmit: (data: any) => void;
    onCancel: () => void;
}

export default function EquipmentForm({ onSubmit, onCancel }: EquipmentFormProps) {
    const [formData, setFormData] = useState({
        name: '',
        equipment_number: '',
        category: 'Mowers',
        model: '',
        manufacturer: '',
        description: '',
        status: 'Active',
        purchase_date: '',
        purchase_cost: '',
        maintenance_notes: '',
        last_serviced_date: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Clean up empty strings to undefined for optional fields
        const cleanedData = {
            ...formData,
            equipment_number: formData.equipment_number || undefined,
            model: formData.model || undefined,
            manufacturer: formData.manufacturer || undefined,
            description: formData.description || undefined,
            purchase_date: formData.purchase_date || undefined,
            purchase_cost: formData.purchase_cost ? parseFloat(formData.purchase_cost) : undefined,
            maintenance_notes: formData.maintenance_notes || undefined,
            last_serviced_date: formData.last_serviced_date || undefined
        };
        onSubmit(cleanedData);
    };

    const inputClasses = "w-full bg-dashboard-bg border border-border-color px-4 py-3 text-sm focus:border-turf-green outline-none transition-colors font-sans";
    const labelClasses = "block text-[0.65rem] font-heading font-black text-text-secondary uppercase tracking-widest mb-2";

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>Equipment Name</label>
                    <input
                        required
                        type="text"
                        className={inputClasses}
                        placeholder="e.g. Toro Greensmaster 3100"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>
                <div>
                    <label className={labelClasses}>Equipment #</label>
                    <input
                        type="text"
                        className={inputClasses}
                        placeholder="e.g. #12"
                        value={formData.equipment_number}
                        onChange={(e) => setFormData({ ...formData, equipment_number: e.target.value })}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>Category</label>
                    <select
                        className={inputClasses}
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                        <option>Mowers</option>
                        <option>Carts</option>
                        <option>Tools</option>
                        <option>Other</option>
                    </select>
                </div>
                <div>
                    <label className={labelClasses}>Status</label>
                    <select
                        className={inputClasses}
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                        <option>Active</option>
                        <option>Maintenance</option>
                        <option>Retired</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>Manufacturer</label>
                    <input
                        type="text"
                        className={inputClasses}
                        placeholder="e.g. Toro, John Deere"
                        value={formData.manufacturer}
                        onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    />
                </div>
                <div>
                    <label className={labelClasses}>Model</label>
                    <input
                        type="text"
                        className={inputClasses}
                        placeholder="e.g. 3100"
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    />
                </div>
            </div>

            <div>
                <label className={labelClasses}>Description</label>
                <textarea
                    className={`${inputClasses} min-h-[100px] resize-none`}
                    placeholder="Additional details about this equipment..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>Purchase Date</label>
                    <input
                        type="date"
                        className={inputClasses}
                        value={formData.purchase_date}
                        onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                    />
                </div>
                <div>
                    <label className={labelClasses}>Purchase Cost ($)</label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        className={inputClasses}
                        placeholder="0.00"
                        value={formData.purchase_cost}
                        onChange={(e) => setFormData({ ...formData, purchase_cost: e.target.value })}
                    />
                </div>
            </div>

            <div>
                <label className={labelClasses}>Last Serviced Date</label>
                <input
                    type="date"
                    className={inputClasses}
                    value={formData.last_serviced_date}
                    onChange={(e) => setFormData({ ...formData, last_serviced_date: e.target.value })}
                />
            </div>

            <div>
                <label className={labelClasses}>Maintenance Notes</label>
                <textarea
                    className={`${inputClasses} min-h-[100px] resize-none`}
                    placeholder="Service history, known issues, etc."
                    value={formData.maintenance_notes}
                    onChange={(e) => setFormData({ ...formData, maintenance_notes: e.target.value })}
                />
            </div>

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
                    Add Equipment
                </button>
            </div>
        </form>
    );
}
