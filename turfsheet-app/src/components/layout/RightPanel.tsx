import WeatherDisplay from '../WeatherDisplay';

export default function RightPanel() {
  const staffMembers = [
    { id: 1, name: 'Doug Soldat', schedule: 'Enter Weekly Schedule Here' },
    { id: 2, name: 'John User', schedule: 'Enter Weekly Schedule Here' },
    { id: 3, name: 'Tony Smith', schedule: 'Enter Weekly Schedule Here' },
    { id: 4, name: 'Peter Jackson', schedule: 'Enter Weekly Schedule Here' },
  ];

  const buttons = [
    { id: 1, label: 'Help', color: 'bg-accent-orange' },
    { id: 2, label: 'Display Mode', color: 'bg-accent-grey' },
    { id: 3, label: 'Add A Job', color: 'bg-turf-green' },
    { id: 4, label: 'Add & Manage Equipment', color: 'bg-accent-grey' },
    { id: 5, label: 'Add Staff', color: 'bg-turf-green' },
  ];

  return (
    <aside className="w-side-panel bg-white border-l border-border-color overflow-y-auto flex flex-col">
      {/* Weather Display */}
      <div className="p-5 border-b border-bg-main">
        <WeatherDisplay />
      </div>

      {/* Button Panel */}
      <div className="flex flex-col gap-2 p-5 border-b border-bg-main">
        {buttons.map((btn) => (
          <button
            key={btn.id}
            className={`${btn.color} text-white py-2.5 px-3 rounded text-sm font-semibold transition-opacity hover:opacity-90`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Staff Section */}
      <div className="flex-1 p-5 overflow-y-auto">
        <h4 className="text-xs font-semibold text-text-secondary mb-3">
          Staff (Mon Feb 3, 2025 - Sun Feb 9, 2025)
        </h4>
        <div className="space-y-0.5">
          {staffMembers.map((staff) => (
            <div key={staff.id} className="border-b border-bg-main pb-2.5">
              <div className="font-semibold text-xs text-gray-800 mb-1">
                {staff.name}
              </div>
              <button className="text-turf-green text-xs cursor-pointer hover:text-turf-green-dark transition">
                {staff.schedule}
              </button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
