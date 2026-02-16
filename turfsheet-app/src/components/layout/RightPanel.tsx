import { useState, useEffect } from 'react';
import { UserMinus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Staff } from '../../types';

interface StaffSchedule {
  id: string;
  staff_id: string;
  sunday_on: boolean;
  monday_on: boolean;
  tuesday_on: boolean;
  wednesday_on: boolean;
  thursday_on: boolean;
  friday_on: boolean;
  saturday_on: boolean;
  staff: Staff;
}

export default function RightPanel() {
  const [workingStaff, setWorkingStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkingStaff();
  }, []);

  const fetchWorkingStaff = async () => {
    setLoading(true);
    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const dayColumn = `${dayOfWeek}_on` as keyof StaffSchedule;

    const { data, error } = await supabase
      .from('staff_schedules')
      .select('*, staff:staff_id(id, name, role, rank)');

    if (error) {
      // Table may not exist yet - just show empty state
      console.warn('Staff schedules table not available:', error.message);
      setWorkingStaff([]);
      setLoading(false);
      return;
    }

    if (data) {
      const working = (data as StaffSchedule[])
        .filter(schedule => schedule[dayColumn])
        .map(schedule => schedule.staff)
        .sort((a, b) => a.rank - b.rank);
      setWorkingStaff(working);
    }
    setLoading(false);
  };

  return (
    <aside className="w-[340px] bg-white border-l border-border-color overflow-y-auto flex flex-col shrink-0">
      {/* Announcements Section */}
      <div className="p-10 space-y-6 border-b border-dashboard-bg bg-panel-white">
        <h4 className="text-[0.75rem] font-heading font-black text-text-primary uppercase tracking-[0.3em] border-b border-border-color pb-5">
          Announcements
        </h4>
        <div className="bg-panel-white border border-border-color p-8 text-center shadow-sm">
          <p className="text-text-secondary text-[0.75rem] font-sans">
            No announcements at this time
          </p>
        </div>
      </div>
      <div className="p-10 flex flex-col bg-white">
        <h4 className="text-[0.75rem] font-heading font-black mb-10 text-text-primary uppercase tracking-[0.3em] border-b border-border-color pb-5">
          Working Today
        </h4>

        {loading ? (
          <div className="bg-panel-white border border-border-color p-8 text-center shadow-sm">
            <p className="text-text-secondary text-[0.75rem] font-sans">Loading...</p>
          </div>
        ) : workingStaff.length > 0 ? (
          <div className="bg-panel-white border border-border-color p-4 shadow-sm space-y-2">
            {workingStaff.map((staff) => (
              <div key={staff.id} className="flex flex-col py-2 border-b border-border-color last:border-b-0">
                <span className="font-heading font-bold text-text-primary text-sm">
                  {staff.name}
                </span>
                <span className="text-[0.7rem] text-text-secondary font-sans uppercase tracking-wide">
                  {staff.role}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-panel-white border border-border-color p-8 text-center shadow-sm">
            <div className="w-12 h-12 bg-turf-green/5 flex items-center justify-center mb-6 border border-turf-green/10 mx-auto">
              <UserMinus className="w-6 h-6 text-turf-green/30 stroke-[1.2]" />
            </div>
            <p className="text-text-secondary mb-8 text-[0.75rem] font-sans font-bold uppercase tracking-[0.1em]">
              No staff scheduled for today
            </p>
          </div>
        )}

        <button className="mt-8 bg-turf-green text-white px-6 py-5 font-heading font-black text-[0.85rem] uppercase tracking-[0.25em] hover:brightness-110 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 shadow-sm flex items-center justify-center">
          Manage Schedule
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
