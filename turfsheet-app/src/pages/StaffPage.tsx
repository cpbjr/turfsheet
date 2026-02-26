import { useState, useEffect } from 'react';
import { Search, Plus, Filter, List as ListIcon, LayoutGrid } from 'lucide-react';
import StaffListItem from '../components/staff/StaffListItem';
import Modal from '../components/ui/Modal';
import ScheduleForm from '../components/staff/ScheduleForm';
import StaffForm from '../components/staff/StaffForm';
import { supabase } from '../lib/supabase';
import type { Staff } from '../types';

export default function StaffPage() {
    const [selectedStaff, setSelectedStaff] = useState<any>(null);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
    const [isEditStaffModalOpen, setIsEditStaffModalOpen] = useState(false);
    const [staffToEdit, setStaffToEdit] = useState<any>(null);
    const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStaff = async () => {
            try {
                setLoading(true);
                setError(null);
                const { data, error: fetchError } = await supabase
                    .from('staff')
                    .select('*')
                    .order('sort_order', { ascending: true })
                    .order('name', { ascending: true });

                if (fetchError) throw fetchError;
                setStaffMembers(data || []);
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to fetch staff';
                setError(message);
                console.error('Error fetching staff:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStaff();
    }, []);

    const handleManageSchedule = (staff: any) => {
        setSelectedStaff(staff);
        setIsScheduleModalOpen(true);
    };

    const handleEditStaff = (staff: any) => {
        setStaffToEdit(staff);
        setIsEditStaffModalOpen(true);
    };

    const handleUpdateStaff = async (formData: any) => {
        try {
            setError(null);
            const { data, error: updateError } = await supabase
                .from('staff')
                .update(formData)
                .eq('id', staffToEdit.id)
                .select();

            if (updateError) throw updateError;

            setStaffMembers(staffMembers.map((s) => (s.id === staffToEdit.id ? data![0] : s)));
            setIsEditStaffModalOpen(false);
            setStaffToEdit(null);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update staff member';
            setError(message);
            console.error('Error updating staff member:', err);
        }
    };

    const handleSaveSchedule = async (scheduleData: any) => {
        try {
            setError(null);

            // Convert UI format to database format
            const dbSchedule = {
                staff_id: selectedStaff.id,
                monday_on: scheduleData[0].isOn,
                monday_start: formatTime24Hour(scheduleData[0].startTime),
                monday_end: formatTime24Hour(scheduleData[0].endTime),
                tuesday_on: scheduleData[1].isOn,
                tuesday_start: formatTime24Hour(scheduleData[1].startTime),
                tuesday_end: formatTime24Hour(scheduleData[1].endTime),
                wednesday_on: scheduleData[2].isOn,
                wednesday_start: formatTime24Hour(scheduleData[2].startTime),
                wednesday_end: formatTime24Hour(scheduleData[2].endTime),
                thursday_on: scheduleData[3].isOn,
                thursday_start: formatTime24Hour(scheduleData[3].startTime),
                thursday_end: formatTime24Hour(scheduleData[3].endTime),
                friday_on: scheduleData[4].isOn,
                friday_start: formatTime24Hour(scheduleData[4].startTime),
                friday_end: formatTime24Hour(scheduleData[4].endTime),
                saturday_on: scheduleData[5].isOn,
                saturday_start: formatTime24Hour(scheduleData[5].startTime),
                saturday_end: formatTime24Hour(scheduleData[5].endTime),
                sunday_on: scheduleData[6].isOn,
                sunday_start: formatTime24Hour(scheduleData[6].startTime),
                sunday_end: formatTime24Hour(scheduleData[6].endTime),
            };

            const { error: upsertError } = await supabase
                .from('staff_schedules')
                .upsert(dbSchedule, { onConflict: 'staff_id' });

            if (upsertError) throw upsertError;

            console.log('Schedule saved successfully for:', selectedStaff?.name);
            setIsScheduleModalOpen(false);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to save schedule';
            setError(message);
            console.error('Error saving schedule:', err);
        }
    };

    // Convert 12h time (HH:MM AM/PM) to 24h format (HH:MM:SS)
    const formatTime24Hour = (time12: string): string => {
        const match = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (!match) return '07:30:00';

        let hours = parseInt(match[1]);
        const minutes = match[2];
        const period = match[3].toUpperCase();

        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;

        return `${String(hours).padStart(2, '0')}:${minutes}:00`;
    };

    const handleSaveStaff = async (formData: any) => {
        try {
            setError(null);
            console.log('Inserting staff member:', formData);
            const { data, error: insertError } = await supabase
                .from('staff')
                .insert([formData])
                .select();

            if (insertError) throw insertError;

            console.log('Staff member created successfully:', data);
            setStaffMembers([...staffMembers, ...(data || [])]);
            setIsAddStaffModalOpen(false);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to create staff member';
            setError(message);
            console.error('Error creating staff member:', err);
        }
    };

    const inputClasses = "bg-panel-white border border-border-color px-4 py-2 text-sm focus:border-turf-green outline-none transition-colors font-sans";

    return (
        <div className="space-y-8 h-full flex flex-col">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border-color">
                <div>
                    <h2 className="text-2xl font-heading font-black uppercase tracking-tight text-text-primary">
                        Staff Library
                    </h2>
                    <p className="text-text-secondary text-sm font-sans">
                        Manage your crew members, roles, contact information, and weekly schedules.
                    </p>
                </div>
                <button onClick={() => setIsAddStaffModalOpen(true)} className="bg-turf-green text-white px-8 py-4 shadow-sm flex items-center gap-3 font-heading font-black hover:bg-turf-green-dark hover:-translate-y-1 transition-all duration-300 text-[0.75rem] uppercase tracking-[0.2em]">
                    <Plus className="w-5 h-5" />
                    Add Staff Member
                </button>
            </div>

            {/* Control Bar */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-panel-white p-4 border border-border-color shadow-sm">
                <div className="relative flex-1 w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                        type="text"
                        placeholder="Search staff..."
                        className={`${inputClasses} pl-10 w-full`}
                    />
                </div>

                <div className="flex items-center gap-4 w-full lg:w-auto">
                    <div className="flex items-center gap-2 px-3 py-2 border border-border-color text-text-secondary text-xs font-heading font-black uppercase tracking-widest cursor-pointer hover:bg-dashboard-bg">
                        <Filter className="w-4 h-4" />
                        Role
                    </div>
                    <div className="ml-auto lg:ml-4 flex border border-border-color">
                        <button className="p-2 hover:bg-dashboard-bg text-text-muted transition-colors">
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button className="p-2 bg-dashboard-bg border-l border-border-color text-turf-green">
                            <ListIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* List Header */}
            <div className="grid grid-cols-[1fr_2fr_1.5fr_1.5fr_1fr_2fr_auto] items-center gap-4 px-6 py-3 bg-turf-green border-x border-t border-turf-green/20 shadow-sm">
                <span className="text-[0.6rem] font-heading font-black text-white uppercase tracking-[0.2em]">Role</span>
                <span className="text-[0.6rem] font-heading font-black text-white uppercase tracking-[0.2em]">Name</span>
                <span className="text-[0.6rem] font-heading font-black text-white uppercase tracking-[0.2em]">Telephone</span>
                <span className="text-[0.6rem] font-heading font-black text-white uppercase tracking-[0.2em]">Telegram ID</span>
                <span className="text-[0.6rem] font-heading font-black text-white uppercase tracking-[0.2em]">Schedule</span>
                <span className="text-[0.6rem] font-heading font-black text-white uppercase tracking-[0.2em]">Notes</span>
                <div className="w-6"></div>
            </div>

            {/* Staff List Area */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {loading && (
                    <div className="flex items-center justify-center h-64">
                        <p className="text-text-secondary">Loading staff...</p>
                    </div>
                )}
                {error && (
                    <div className="flex items-center justify-center h-64">
                        <p className="text-red-500">Error: {error}</p>
                    </div>
                )}
                {!loading && !error && staffMembers.length > 0 ? (
                    <div className="flex flex-col border-b border-border-color">
                        {staffMembers.map((staff) => (
                            <StaffListItem
                                key={staff.id}
                                role={staff.role}
                                name={staff.name}
                                telephone={staff.telephone}
                                telegramId={staff.telegram_id}
                                notes={staff.notes}
                                onManageSchedule={() => handleManageSchedule(staff)}
                                onEdit={() => handleEditStaff(staff)}
                            />
                        ))}
                    </div>
                ) : !loading && !error && (
                    <div className="h-64 flex flex-col items-center justify-center bg-panel-white border border-border-color border-dashed rounded-sm">
                        <p className="text-text-secondary font-sans text-sm">No staff members in your library yet.</p>
                    </div>
                )}
            </div>

            {/* Schedule Modal */}
            <Modal
                isOpen={isScheduleModalOpen}
                onClose={() => setIsScheduleModalOpen(false)}
                title="Manage Weekly Schedule"
            >
                {selectedStaff && (
                    <ScheduleForm
                        staff={selectedStaff}
                        onSave={handleSaveSchedule}
                    />
                )}
            </Modal>

            {/* Add Staff Modal */}
            <Modal
                isOpen={isAddStaffModalOpen}
                onClose={() => setIsAddStaffModalOpen(false)}
                title="Add Staff Member"
            >
                <StaffForm
                    onSubmit={handleSaveStaff}
                    onCancel={() => setIsAddStaffModalOpen(false)}
                />
            </Modal>

            {/* Edit Staff Modal */}
            <Modal
                isOpen={isEditStaffModalOpen}
                onClose={() => { setIsEditStaffModalOpen(false); setStaffToEdit(null); }}
                title="Edit Staff Member"
            >
                {staffToEdit && (
                    <StaffForm
                        initialData={staffToEdit}
                        onSubmit={handleUpdateStaff}
                        onCancel={() => { setIsEditStaffModalOpen(false); setStaffToEdit(null); }}
                    />
                )}
            </Modal>
        </div>
    );
}
