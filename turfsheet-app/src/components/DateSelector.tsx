import { useState } from 'react';
import { format, addDays, subDays } from 'date-fns';

export function DateSelector() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

  const handleDateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    setCurrentDate(date);
    setShowCalendar(false);
  };

  return (
    <div className="flex items-center gap-3 bg-dashboard-bg px-4 py-1.5 relative border border-border-color">
      <button
        onClick={() => setCurrentDate(prev => subDays(prev, 1))}
        className="text-gray-500 hover:text-gray-800 transition-colors"
      >
        <i className="fa-solid fa-chevron-left text-xs"></i>
      </button>

      <span className="font-heading font-bold text-sm text-text-primary flex items-center gap-2 tracking-tight">
        {format(currentDate, 'EEE MMM d, yyyy')}
        <button
          onClick={() => setShowCalendar(!showCalendar)}
          className="hover:text-turf-green transition-colors"
          aria-label="Open calendar"
        >
          <i className="fa-solid fa-calendar-days text-sm"></i>
        </button>
      </span>

      <button
        onClick={() => setCurrentDate(prev => addDays(prev, 1))}
        className="text-gray-400 hover:text-turf-green transition-colors"
      >
        <i className="fa-solid fa-chevron-right text-xs"></i>
      </button>

      {showCalendar && (
        <input
          type="date"
          value={format(currentDate, 'yyyy-MM-dd')}
          onChange={handleDateSelect}
          autoFocus
          className="absolute left-1/2 -translate-x-1/2 top-full mt-2 p-2 border border-gray-300 shadow-md z-10 bg-white font-sans"
        />
      )}
      <span className="ml-2 text-turf-green font-heading font-black text-xs whitespace-nowrap tracking-widest bg-turf-green/10 px-4 py-1 uppercase border-l border-turf-green/20">
        Workday: 05:30 AM-2:30 PM
      </span>
    </div>
  );
}
