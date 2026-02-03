import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';

export function DateSelector() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

  const handleDateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    setCurrentDate(date);
    setShowCalendar(false);
  };

  return (
    <div className="flex items-center gap-3 bg-bg-main px-4 py-2 rounded-full relative">
      <span className="font-medium text-sm text-gray-700">
        {format(currentDate, 'EEE MMM d, yyyy')}
      </span>
      <button
        onClick={() => setShowCalendar(!showCalendar)}
        className="p-1 hover:bg-gray-200 rounded transition-colors"
        aria-label="Open calendar"
      >
        <Calendar className="w-4 h-4 text-gray-600" />
      </button>
      {showCalendar && (
        <input
          type="date"
          value={format(currentDate, 'yyyy-MM-dd')}
          onChange={handleDateSelect}
          autoFocus
          className="absolute left-4 top-full mt-2 p-2 rounded border border-gray-300 shadow-md z-10 bg-white"
        />
      )}
      <span className="ml-2 text-turf-green font-medium text-sm">
        Workday: 07:30 AM-2:30 PM
      </span>
    </div>
  );
}
