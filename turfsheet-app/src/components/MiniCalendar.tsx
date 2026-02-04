import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay
} from 'date-fns';

export default function MiniCalendar() {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
        <div className="bg-panel-white border border-border-color p-8 shadow-sm">
            {/* Month/Year Header */}
            <h4 className="text-[0.75rem] font-heading font-black mb-8 text-text-primary uppercase tracking-[0.3em] border-b border-border-color pb-5 flex justify-between items-center">
                <span>{format(today, 'MMMM yyyy')}</span>
            </h4>

            {/* Days of Week */}
            <div className="grid grid-cols-7 gap-2 mb-4">
                {weekDays.map((day, idx) => (
                    <div key={`${day}-${idx}`} className="text-[0.6rem] font-heading font-black text-text-muted text-center uppercase tracking-widest">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-y-3 gap-x-2">
                {days.map((day, idx) => {
                    const isToday = isSameDay(day, today);
                    const currentMonth = isSameMonth(day, monthStart);

                    return (
                        <div
                            key={idx}
                            className={`
                h-8 flex items-center justify-center text-[0.75rem] font-sans transition-all
                ${!currentMonth ? 'text-text-muted' : 'text-text-primary'}
                ${isToday ? 'bg-turf-green text-white font-black shadow-md' : 'rounded-sm hover:bg-dashboard-bg/10'}
              `}
                        >
                            {format(day, 'd')}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
