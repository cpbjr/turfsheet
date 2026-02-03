import { Plus } from 'lucide-react';

export function TaskBoard() {
  return (
    <div className="flex-1 p-6">
      <section>
        <h3 className="text-sm uppercase text-gray-500 mb-4 border-b pb-2">
          First Jobs
        </h3>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <p className="text-gray-500 mb-4">No jobs scheduled for this day</p>
          <button className="bg-turf-green text-white px-6 py-2 rounded-lg flex items-center gap-2 mx-auto hover:bg-turf-green-dark transition-colors">
            <Plus className="w-4 h-4" />
            Add Job
          </button>
        </div>
      </section>
    </div>
  );
}
