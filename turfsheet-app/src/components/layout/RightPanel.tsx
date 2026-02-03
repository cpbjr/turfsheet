import WeatherDisplay from '../WeatherDisplay';
import { Plus } from 'lucide-react';

export default function RightPanel() {
  return (
    <aside className="w-side-panel bg-white border-l border-border-color overflow-y-auto flex flex-col">
      {/* Location Info */}
      <div className="p-5 border-b border-bg-main">
        <h2 className="text-sm font-bold text-gray-900 mb-1">Banbury Golf Course</h2>
        <p className="text-xs text-gray-600">Eagle, ID</p>
      </div>

      {/* Weather Display */}
      <div className="p-5 border-b border-bg-main">
        <WeatherDisplay />
      </div>

      {/* Staff Section - EMPTY STATE */}
      <div className="flex-1 p-5 overflow-y-auto flex flex-col">
        <h4 className="text-xs font-semibold text-text-secondary mb-4">Staff</h4>
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
