import { Plus } from 'lucide-react';

export function StaffPanel() {
  return (
    <div className="w-80 bg-white border-l border-gray-200 p-6">
      <h4 className="text-sm font-semibold mb-4">Staff</h4>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <p className="text-gray-500 mb-4 text-sm">No staff members added yet</p>
        <button className="bg-turf-green text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto text-sm hover:bg-turf-green-dark transition-colors">
          <Plus className="w-4 h-4" />
          Add Staff
        </button>
      </div>
    </div>
  );
}
