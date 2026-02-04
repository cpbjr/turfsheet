import { UserMinus } from 'lucide-react';
import WeatherDisplay from '../WeatherDisplay';
import MiniCalendar from '../MiniCalendar';

export default function RightPanel() {
  return (
    <aside className="w-[340px] bg-white border-l border-border-color overflow-y-auto flex flex-col shrink-0">
      {/* Location Info & Weather */}
      <div className="p-10 space-y-8 border-b border-dashboard-bg bg-panel-white">
        <div className="flex flex-col">
          <h2 className="text-[1.3rem] font-heading font-black text-text-primary tracking-tighter leading-tight uppercase">Banbury Golf Course</h2>
          <p className="text-[0.8rem] font-sans font-bold text-text-secondary mt-2 uppercase tracking-widest opacity-60">Eagle, ID</p>
        </div>
        <WeatherDisplay />
      </div>

      {/* Monthly Calendar Section */}
      <div className="p-10 border-b border-dashboard-bg bg-panel-white">
        <MiniCalendar />
      </div>
      <div className="p-10 flex flex-col bg-white">
        <h4 className="text-[0.75rem] font-heading font-black mb-10 text-text-primary uppercase tracking-[0.3em] border-b border-border-color pb-5">
          Staff On Duty
        </h4>

        <div className="bg-panel-white border border-border-color p-8 text-center shadow-sm">
          <div className="w-12 h-12 bg-turf-green/5 flex items-center justify-center mb-6 border border-turf-green/10 mx-auto">
            <UserMinus className="w-6 h-6 text-turf-green/30 stroke-[1.2]" />
          </div>
          <p className="text-text-secondary mb-8 text-[0.75rem] font-sans font-bold uppercase tracking-[0.1em]">
            No staff assigned to today's rotation
          </p>
        </div>

        <button className="mt-8 bg-turf-green text-white px-6 py-5 font-heading font-black text-[0.85rem] uppercase tracking-[0.25em] hover:brightness-110 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 shadow-sm flex items-center justify-center">
          Add Staff
        </button>
      </div>

      {/* Action Buttons - Remaining */}
      <div className="flex flex-col space-y-4 p-10 border-t border-dashboard-bg bg-dashboard-bg/5 mt-auto">
        <button className="bg-turf-green text-white px-6 py-4 font-heading font-black text-[0.8rem] uppercase tracking-[0.2em] hover:brightness-110 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 shadow-sm flex items-center justify-center">
          Add A Job
        </button>
        <button className="bg-[#95A5A6] text-white px-6 py-4 font-heading font-black text-[0.8rem] uppercase tracking-[0.2em] hover:brightness-110 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 shadow-sm flex items-center justify-center">
          Equipment
        </button>
        <button className="bg-[#95A5A6] text-white px-6 py-4 font-heading font-black text-[0.8rem] uppercase tracking-[0.2em] hover:brightness-110 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 shadow-sm flex items-center justify-center">
          Display Mode
        </button>
        <button className="bg-[#EAB35E] text-white px-6 py-4 font-heading font-black text-[0.8rem] uppercase tracking-[0.2em] hover:brightness-110 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 shadow-sm flex items-center justify-center">
          Help
        </button>
      </div>
    </aside>
  );
}
