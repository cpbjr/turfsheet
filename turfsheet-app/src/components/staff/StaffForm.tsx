import React, { useState } from 'react';

interface StaffFormProps {
    onSubmit: (data: any) => void;
    onCancel: () => void;
}

export default function StaffForm({ onSubmit, onCancel }: StaffFormProps) {
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        telephone: '',
        telegram_id: '',
        notes: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const inputClasses = "w-full bg-dashboard-bg border border-border-color px-4 py-3 text-sm focus:border-turf-green outline-none transition-colors font-sans";
    const labelClasses = "block text-[0.65rem] font-heading font-black text-text-secondary uppercase tracking-widest mb-2";

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className={labelClasses}>Name *</label>
                <input
                    required
                    type="text"
                    className={inputClasses}
                    placeholder="e.g. John Smith"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
            </div>

            <div>
                <label className={labelClasses}>Role *</label>
                <input
                    required
                    type="text"
                    className={inputClasses}
                    placeholder="e.g. Foreman, Worker, Specialist"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>Telephone</label>
                    <input
                        type="text"
                        className={inputClasses}
                        placeholder="e.g. +1 (555) 123-4567"
                        value={formData.telephone}
                        onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    />
                </div>
                <div>
                    <label className={labelClasses}>Telegram ID</label>
                    <input
                        type="text"
                        className={inputClasses}
                        placeholder="e.g. @username"
                        value={formData.telegram_id}
                        onChange={(e) => setFormData({ ...formData, telegram_id: e.target.value })}
                    />
                </div>
            </div>

            <div>
                <label className={labelClasses}>Notes</label>
                <textarea
                    className={`${inputClasses} min-h-[100px] resize-none`}
                    placeholder="Add any additional notes or information..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                    Create Staff Member
                </button>
            </div>
        </form>
    );
}
