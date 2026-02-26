import React, { useState } from 'react';
import type { DayOfWeek, Job } from '../../types';

const DAYS_OF_WEEK: { key: DayOfWeek; label: string }[] = [
    { key: 'monday',    label: 'Mon' },
    { key: 'tuesday',   label: 'Tue' },
    { key: 'wednesday', label: 'Wed' },
    { key: 'thursday',  label: 'Thu' },
    { key: 'friday',    label: 'Fri' },
    { key: 'saturday',  label: 'Sat' },
    { key: 'sunday',    label: 'Sun' },
];

interface JobFormProps {
    onSubmit: (data: any) => void;
    onCancel: () => void;
    initialData?: Job;
}

export default function JobForm({ onSubmit, onCancel, initialData }: JobFormProps) {
    const [formData, setFormData] = useState<{
        title: string;
        description: string;
        crew_needed: number;
        priority: string;
        section: 'First Jobs' | 'Second Jobs';
        is_scheduled: boolean;
        scheduled_days: DayOfWeek[];
    }>({
        title: initialData?.title ?? '',
        description: initialData?.description ?? '',
        crew_needed: initialData?.crew_needed ?? 1,
        priority: initialData?.priority ?? 'Normal',
        section: initialData?.section ?? 'First Jobs',
        is_scheduled: initialData?.is_scheduled ?? false,
        scheduled_days: (initialData?.scheduled_days ?? []) as DayOfWeek[],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const toggleDay = (day: DayOfWeek) => {
        const days = formData.scheduled_days;
        setFormData({
            ...formData,
            scheduled_days: days.includes(day)
                ? days.filter((d) => d !== day)
                : [...days, day],
        });
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
                        value={formData.crew_needed}
                        onChange={(e) => setFormData({ ...formData, crew_needed: parseInt(e.target.value) })}
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
                    {(['First Jobs', 'Second Jobs'] as const).map((s) => (
                        <label key={s} className="flex-1 flex items-center justify-center border border-border-color p-3 bg-dashboard-bg cursor-pointer hover:border-turf-green transition-colors">
                            <input
                                type="radio"
                                className="hidden"
                                name="section"
                                value={s}
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

            <div>
                <label className={labelClasses}>Scheduling</label>
                <label className="flex items-center gap-3 cursor-pointer">
                    <div
                        onClick={() => setFormData({
                            ...formData,
                            is_scheduled: !formData.is_scheduled,
                            scheduled_days: !formData.is_scheduled ? formData.scheduled_days : [],
                        })}
                        className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 cursor-pointer ${formData.is_scheduled ? 'bg-turf-green' : 'bg-border-color'}`}
                    >
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${formData.is_scheduled ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                    <span className="text-[0.75rem] font-sans text-text-secondary">
                        Auto-schedule this job on selected days
                    </span>
                </label>

                {formData.is_scheduled && (
                    <div className="mt-4 flex gap-2 flex-wrap">
                        {DAYS_OF_WEEK.map(({ key, label }) => {
                            const active = formData.scheduled_days.includes(key);
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => toggleDay(key)}
                                    className={`px-3 py-2 text-[0.65rem] font-heading font-black uppercase tracking-widest border transition-colors
                                        ${active
                                            ? 'bg-turf-green text-white border-turf-green'
                                            : 'bg-dashboard-bg text-text-secondary border-border-color hover:border-turf-green'
                                        }`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                )}
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
                    {initialData ? 'Save Changes' : 'Create Job'}
                </button>
            </div>
        </form>
    );
}
