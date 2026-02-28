import { useState, useEffect } from 'react';
import { UserMinus, Plus, Check, X, Pencil } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Staff, DailyBoard } from '../../types';
import ManageScheduleModal from './ManageScheduleModal';

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

function getTodayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function RightPanel() {
  const [workingStaff, setWorkingStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [announcement, setAnnouncement] = useState('');
  const [editingAnnouncement, setEditingAnnouncement] = useState(false);
  const [draftAnnouncement, setDraftAnnouncement] = useState('');
  const [dailyBoardId, setDailyBoardId] = useState<string | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  useEffect(() => {
    fetchWorkingStaff();
    fetchAnnouncement();
  }, []);

  const fetchAnnouncement = async () => {
    const today = getTodayISO();
    const { data, error } = await supabase
      .from('daily_board')
      .select('*')
      .eq('board_date', today)
      .maybeSingle();

    if (error) {
      console.warn('daily_board not available:', error.message);
      return;
    }

    if (data) {
      setAnnouncement((data as DailyBoard).announcements || '');
      setDailyBoardId((data as DailyBoard).id);
    }
  };

  const saveAnnouncement = async () => {
    const today = getTodayISO();
    const text = draftAnnouncement.trim();

    if (dailyBoardId) {
      const { error } = await supabase
        .from('daily_board')
        .update({ announcements: text || null, updated_at: new Date().toISOString() })
        .eq('id', dailyBoardId);
      if (error) { console.error('Error updating announcement:', error); return; }
    } else {
      const { data, error } = await supabase
        .from('daily_board')
        .insert({ board_date: today, announcements: text || null })
        .select()
        .single();
      if (error) { console.error('Error creating announcement:', error); return; }
      if (data) setDailyBoardId((data as DailyBoard).id);
    }

    setAnnouncement(text);
    setEditingAnnouncement(false);
  };

  const fetchWorkingStaff = async () => {
    setLoading(true);
    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const dayColumn = `${dayOfWeek}_on` as keyof StaffSchedule;

    const { data, error } = await supabase
      .from('staff_schedules')
      .select('*, staff:staff_id(id, name, role, sort_order)');

    if (error) {
      console.warn('Staff schedules table not available:', error.message);
      setWorkingStaff([]);
      setLoading(false);
      return;
    }

    if (data) {
      const working = (data as StaffSchedule[])
        .filter(schedule => schedule[dayColumn])
        .map(schedule => schedule.staff)
        .sort((a, b) => a.sort_order - b.sort_order);
      setWorkingStaff(working);
    }
    setLoading(false);
  };

  return (
    <aside className="w-[340px] bg-white border-l border-border-color overflow-y-auto flex flex-col shrink-0">
      {/* Announcements Section */}
      <div className="p-10 space-y-6 border-b border-dashboard-bg bg-panel-white">
        <div className="flex items-center justify-between border-b border-border-color pb-5">
          <h4 className="text-[0.75rem] font-heading font-black text-text-primary uppercase tracking-[0.3em]">
            Announcements
          </h4>
          {!editingAnnouncement && (
            <button
              onClick={() => {
                setDraftAnnouncement(announcement);
                setEditingAnnouncement(true);
              }}
              className="w-6 h-6 flex items-center justify-center bg-turf-green text-white hover:brightness-110 transition-all"
              title={announcement ? 'Edit announcement' : 'Add announcement'}
            >
              {announcement ? <Pencil size={12} /> : <Plus size={14} />}
            </button>
          )}
        </div>

        {editingAnnouncement ? (
          <div className="space-y-3">
            <textarea
              value={draftAnnouncement}
              onChange={(e) => setDraftAnnouncement(e.target.value)}
              placeholder="Type announcement..."
              className="w-full border border-border-color p-3 text-sm font-sans text-text-primary resize-none focus:outline-none focus:ring-1 focus:ring-turf-green"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditingAnnouncement(false)}
                className="px-3 py-1.5 text-xs font-heading font-bold uppercase tracking-wide text-text-secondary hover:text-text-primary transition-colors"
              >
                <X size={14} className="inline mr-1" />
                Cancel
              </button>
              <button
                onClick={saveAnnouncement}
                className="px-3 py-1.5 text-xs font-heading font-bold uppercase tracking-wide bg-turf-green text-white hover:brightness-110 transition-all"
              >
                <Check size={14} className="inline mr-1" />
                Save
              </button>
            </div>
          </div>
        ) : announcement ? (
          <div className="bg-panel-white border border-border-color p-6 shadow-sm">
            <p className="text-text-primary text-sm font-sans whitespace-pre-wrap">
              {announcement}
            </p>
          </div>
        ) : (
          <div className="bg-panel-white border border-border-color p-8 text-center shadow-sm">
            <p className="text-text-secondary text-[0.75rem] font-sans">
              No announcements at this time
            </p>
          </div>
        )}
      </div>

      {/* Working Today Section */}
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

        <button
          onClick={() => setIsScheduleModalOpen(true)}
          className="mt-8 bg-turf-green text-white px-6 py-5 font-heading font-black text-[0.85rem] uppercase tracking-[0.25em] hover:brightness-110 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 shadow-sm flex items-center justify-center"
        >
          Manage Schedule
        </button>
      </div>

      <ManageScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onUpdate={() => fetchWorkingStaff()}
      />
    </aside>
  );
}
