import { useState } from 'react';
import { Search, Plus, Filter, List as ListIcon, LayoutGrid } from 'lucide-react';
import StaffListItem from '../components/staff/StaffListItem';
import Modal from '../components/ui/Modal';
import ScheduleForm from '../components/staff/ScheduleForm';

export default function StaffPage() {
    const [selectedStaff, setSelectedStaff] = useState<any>(null);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

    // Clean state - no staff members
    const [staffMembers, setStaffMembers] = useState<any[]>([]);

    const handleManageSchedule = (staff: any) => {
        setSelectedStaff(staff);
        setIsScheduleModalOpen(true);
    };

    const handleSaveSchedule = (data: any) => {
        console.log('Saved schedule for:', selectedStaff?.name, data);
        setIsScheduleModalOpen(false);
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
                <button className="bg-turf-green text-white px-8 py-4 shadow-sm flex items-center gap-3 font-heading font-black hover:bg-turf-green-dark hover:-translate-y-1 transition-all duration-300 text-[0.75rem] uppercase tracking-[0.2em]">
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
                {staffMembers.length > 0 ? (
                    <div className="flex flex-col border-b border-border-color">
                        {staffMembers.map((staff, idx) => (
                            <StaffListItem
                                key={staff.id || idx}
                                {...staff}
                                onManageSchedule={() => handleManageSchedule(staff)}
                            />
                        ))}
                    </div>
                ) : (
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
        </div>
    );
}
