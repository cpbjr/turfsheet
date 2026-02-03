import { Plus } from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';

export default function RightPanel() {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 }); // Sunday
  const dateRangeString = `${format(weekStart, 'EEE MMM d, yyyy')} - ${format(weekEnd, 'EEE MMM d, yyyy')}`;
  return (
    <aside className="w-side-panel bg-white border-l border-border-color overflow-y-auto flex flex-col">
      {/* Location Info */}
      <div className="p-5 border-b border-bg-main">
        <h2 className="text-sm font-bold text-gray-900 mb-1">Banbury Golf Course</h2>
        <p className="text-xs text-gray-600">Eagle, ID</p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 p-5 border-b border-bg-main">
        <button className="bg-btn-orange text-white px-2.5 py-2.5 rounded font-semibold text-[0.85rem] hover:opacity-90 transition-opacity">
          Help
        </button>
        <button className="bg-accent-grey text-white px-2.5 py-2.5 rounded font-semibold text-[0.85rem] hover:opacity-90 transition-opacity">
          Display Mode
        </button>
        <button className="bg-turf-green text-white px-2.5 py-2.5 rounded font-semibold text-[0.85rem] hover:opacity-90 transition-opacity">
          Add A Job
        </button>
        <button className="bg-accent-grey text-white px-2.5 py-2.5 rounded font-semibold text-[0.85rem] hover:opacity-90 transition-opacity">
          Add & Manage Equipment
        </button>
        <button className="bg-turf-green text-white px-2.5 py-2.5 rounded font-semibold text-[0.85rem] hover:opacity-90 transition-opacity">
          Add Staff
        </button>
      </div>

      {/* Staff Section - EMPTY STATE */}
      <div className="flex-1 p-5 overflow-y-auto flex flex-col">
        <h4 className="text-[0.85rem] font-semibold mb-3 text-text-primary">
          Staff ({dateRangeString})
        </h4>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center flex-1 flex flex-col items-center justify-center">
          <p className="text-gray-500 mb-4 text-sm">No employees added yet</p>
          <button className="bg-turf-green text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto text-sm hover:bg-turf-green-dark transition-colors">
            <Plus className="w-4 h-4" />
            Add Employee
          </button>
        </div>
      </div>
    </aside>
  );
}
