import { useState } from 'react';

interface DaySchedule {
    day: string;
    date: string;
    isOn: boolean;
    startTime: string;
    endTime: string;
}

const DAYS = [
    { day: 'Mon', date: 'Feb 3, 2026' },
    { day: 'Tue', date: 'Feb 4, 2026' },
    { day: 'Wed', date: 'Feb 5, 2026' },
    { day: 'Thu', date: 'Feb 6, 2026' },
    { day: 'Fri', date: 'Feb 7, 2026' },
    { day: 'Sat', date: 'Feb 8, 2026' },
    { day: 'Sun', date: 'Feb 9, 2026' },
];

export default function ScheduleForm({ staff, onSave }: { staff: any, onSave: (data: any) => void }) {
    const [schedule, setSchedule] = useState<DaySchedule[]>(
        DAYS.map(d => ({
            ...d,
            isOn: true,
            startTime: d.day === 'Sat' || d.day === 'Sun' ? '05:00 AM' : '05:30 AM',
            endTime: d.day === 'Sat' || d.day === 'Sun' ? '09:30 AM' : '02:30 PM'
        }))
    );

    const toggleDay = (idx: number) => {
        const newSchedule = [...schedule];
        newSchedule[idx].isOn = !newSchedule[idx].isOn;
        setSchedule(newSchedule);
    };

    const updateTime = (idx: number, field: 'startTime' | 'endTime', value: string) => {
        const newSchedule = [...schedule];
        newSchedule[idx][field] = value;
        setSchedule(newSchedule);
    };

    return (
        <div className="space-y-8">
            {/* Header Info */}
            <div className="flex flex-col gap-1 border-b border-border-color pb-6">
                <h3 className="text-xl font-heading font-black text-text-primary uppercase tracking-tight">
                    {staff.name}
                </h3>
                <p className="text-sm font-sans font-bold text-text-secondary opacity-60">
                    Select a date to view that week's schedule
                </p>
                <div className="mt-4">
                    <input
                        type="date"
                        defaultValue="2026-02-03"
                        className="w-full bg-dashboard-bg border border-border-color px-4 py-3 text-sm font-sans outline-none focus:border-turf-green"
                    />
                </div>
            </div>

            {/* Week Grid */}
            <div className="space-y-4">
                {schedule.map((day, idx) => (
                    <div key={day.day} className="flex items-center gap-6 py-2 border-b border-dashboard-bg last:border-0">
                        {/* Day/Date Label */}
                        <div className="w-32 shrink-0">
                            <p className="text-[0.65rem] font-heading font-black text-text-primary uppercase tracking-widest leading-none">
                                {day.day} {day.date}
                            </p>
                        </div>

                        {/* Switch - On/Off */}
                        <div className="flex bg-dashboard-bg border border-border-color p-1 rounded-sm">
                            <button
                                onClick={() => toggleDay(idx)}
                                className={`px-4 py-1.5 text-[0.6rem] font-heading font-black uppercase tracking-widest transition-all ${!day.isOn ? 'bg-white text-text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
                            >
                                Off
                            </button>
                            <button
                                onClick={() => toggleDay(idx)}
                                className={`px-4 py-1.5 text-[0.6rem] font-heading font-black uppercase tracking-widest transition-all ${day.isOn ? 'bg-turf-green text-white shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
                            >
                                On
                            </button>
                        </div>

                        {/* Start Time */}
                        <div className={`flex-1 transition-opacity ${day.isOn ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                            <label className="block text-[0.55rem] font-heading font-black text-text-muted uppercase tracking-[0.2em] mb-1">Start Time</label>
                            <input
                                type="text"
                                value={day.startTime}
                                onChange={(e) => updateTime(idx, 'startTime', e.target.value)}
                                className="w-full bg-dashboard-bg border border-border-color px-3 py-2 text-xs font-sans font-bold text-center outline-none focus:border-turf-green"
                            />
                        </div>

                        {/* End Time */}
                        <div className={`flex-1 transition-opacity ${day.isOn ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                            <label className="block text-[0.55rem] font-heading font-black text-text-muted uppercase tracking-[0.2em] mb-1">End Time</label>
                            <input
                                type="text"
                                value={day.endTime}
                                onChange={(e) => updateTime(idx, 'endTime', e.target.value)}
                                className="w-full bg-dashboard-bg border border-border-color px-3 py-2 text-xs font-sans font-bold text-center outline-none focus:border-turf-green"
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-border-color flex gap-4">
                <button
                    onClick={() => onSave(schedule)}
                    className="flex-1 bg-turf-green text-white py-4 font-heading font-black text-[0.8rem] uppercase tracking-[0.25em] hover:brightness-110 transition-all shadow-md"
                >
                    Save Schedule
                </button>
            </div>
        </div>
    );
}
