import React, { useState } from 'react';

interface JobFormProps {
    onSubmit: (data: any) => void;
    onCancel: () => void;
}

export default function JobForm({ onSubmit, onCancel }: JobFormProps) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        crewNeeded: 1,
        priority: 'Normal',
        section: 'First Jobs'
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
                <label className={labelClasses}>Job Title</label>
                <input
                    required
                    type="text"
                    className={inputClasses}
                    placeholder="e.g. Mow Greens"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
            </div>

            <div>
                <label className={labelClasses}>Description / Instructions</label>
                <textarea
                    className={`${inputClasses} min-h-[100px] resize-none`}
                    placeholder="Enter specific directions, clean up patterns, etc."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>Crew Needed</label>
                    <input
                        type="number"
                        min="1"
                        className={inputClasses}
                        value={formData.crewNeeded}
                        onChange={(e) => setFormData({ ...formData, crewNeeded: parseInt(e.target.value) })}
                    />
                </div>
                <div>
                    <label className={labelClasses}>Priority</label>
                    <select
                        className={inputClasses}
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    >
                        <option>Low</option>
                        <option>Normal</option>
                        <option>High</option>
                        <option>Urgent</option>
                    </select>
                </div>
            </div>

            <div>
                <label className={labelClasses}>Dashboard Section</label>
                <div className="flex gap-4">
                    {['First Jobs', 'Second Jobs'].map((s) => (
                        <label key={s} className="flex-1 flex items-center justify-center border border-border-color p-3 bg-dashboard-bg cursor-pointer hover:border-turf-green transition-colors">
                            <input
                                type="radio"
                                className="hidden"
                                name="section"
                                checked={formData.section === s}
                                onChange={() => setFormData({ ...formData, section: s })}
                            />
                            <span className={`text-[0.65rem] font-heading font-black uppercase tracking-widest ${formData.section === s ? 'text-turf-green' : 'text-text-secondary'}`}>
                                {s}
                            </span>
                        </label>
                    ))}
                </div>
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
                    Create Job
                </button>
            </div>
        </form>
    );
}
