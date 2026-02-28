import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Staff } from '../../types';
import Modal from '../ui/Modal';

interface ManageScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

interface StaffAvailability {
  staff: Staff;
  isScheduled: boolean; // from weekly schedule
  isOff: boolean; // from staff_time_off
  timeOffId?: string;
}

function getTodayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function ManageScheduleModal({ isOpen, onClose, onUpdate }: ManageScheduleModalProps) {
  const [staffAvailability, setStaffAvailability] = useState<StaffAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAvailability();
    }
  }, [isOpen]);

  const fetchAvailability = async () => {
    setLoading(true);
    const today = getTodayISO();
    const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const dayColumn = `${dayOfWeek}_on`;

    // Fetch all staff
    const { data: staffData } = await supabase
      .from('staff')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    // Fetch schedules
    const { data: scheduleData } = await supabase
      .from('staff_schedules')
      .select('*');

    // Fetch time off for today
    const { data: timeOffData } = await supabase
      .from('staff_time_off')
      .select('*')
      .lte('start_date', today)
      .gte('end_date', today)
      .eq('status', 'approved');

    const scheduleMap = new Map(
      (scheduleData || []).map((s: any) => [String(s.staff_id), s])
    );
    const timeOffMap = new Map(
      (timeOffData || []).map((t: any) => [String(t.staff_id), t])
    );

    const availability = (staffData || []).map((staff: Staff) => {
      const schedule = scheduleMap.get(String(staff.id));
      const timeOff = timeOffMap.get(String(staff.id));
      return {
        staff,
        isScheduled: schedule ? (schedule as any)[dayColumn] === true : false,
        isOff: !!timeOff,
        timeOffId: timeOff?.id,
      };
    });

    setStaffAvailability(availability);
    setLoading(false);
  };

  const toggleAvailability = async (staffId: string, currentlyOff: boolean, timeOffId?: string) => {
    setSaving(staffId);
    const today = getTodayISO();

    if (currentlyOff && timeOffId) {
      // Remove time off entry — make them available
      await supabase
        .from('staff_time_off')
        .delete()
        .eq('id', timeOffId);
    } else {
      // Add time off entry — mark them off
      await supabase
        .from('staff_time_off')
        .insert({
          staff_id: staffId,
          start_date: today,
          end_date: today,
          reason: 'sick',
          status: 'approved',
        });
    }

    await fetchAvailability();
    setSaving(null);
    onUpdate();
    window.dispatchEvent(new Event('schedule-changed'));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Today's Schedule">
      {loading ? (
        <div className="text-center py-8">
          <p className="text-text-secondary text-sm font-sans">Loading staff...</p>
        </div>
      ) : (
        <div className="space-y-1">
          <p className="text-xs text-text-secondary font-sans mb-4">
            Toggle staff availability for today. Marking someone off will show "Off" on the whiteboard.
          </p>
          {staffAvailability.map(({ staff, isScheduled, isOff, timeOffId }) => {
            const isAvailable = isScheduled && !isOff;
            return (
              <div
                key={staff.id}
                className="flex items-center justify-between py-3 px-4 border-b border-border-color last:border-b-0"
              >
                <div className="flex flex-col">
                  <span className={`font-heading font-bold text-sm ${isOff ? 'text-red-500' : 'text-text-primary'}`}>
                    {staff.name}
                  </span>
                  <span className="text-[0.7rem] text-text-secondary font-sans uppercase tracking-wide">
                    {staff.role}
                    {!isScheduled && !isOff && ' — not scheduled'}
                    {isOff && ' — called off'}
                  </span>
                </div>
                <button
                  onClick={() => toggleAvailability(String(staff.id), isOff, timeOffId)}
                  disabled={saving === String(staff.id)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    isAvailable
                      ? 'bg-turf-green'
                      : isOff
                        ? 'bg-red-400'
                        : 'bg-gray-300'
                  } ${saving === String(staff.id) ? 'opacity-50' : ''}`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      isAvailable ? 'left-[26px]' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
