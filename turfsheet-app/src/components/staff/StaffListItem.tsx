import { Calendar, MoreHorizontal } from 'lucide-react';

interface StaffListItemProps {
    role: string;
    name: string;
    telephone: string;
    telegramId: string;
    onManageSchedule: () => void;
    notes?: string;
}

export default function StaffListItem({ role, name, telephone, telegramId, onManageSchedule, notes }: StaffListItemProps) {
    return (
        <div className="grid grid-cols-[1fr_2fr_1.5fr_1.5fr_1fr_2fr_auto] items-center gap-4 px-6 py-4 bg-panel-white border border-border-color hover:border-turf-green transition-all duration-200 group">
            {/* Role */}
            <div className="text-[0.65rem] font-heading font-black text-text-primary uppercase tracking-widest">
                {role}
            </div>

            {/* Name */}
            <div className="text-sm font-sans font-bold text-text-primary">
                {name}
            </div>

            {/* Telephone */}
            <div className="text-xs font-sans text-text-secondary">
                {telephone}
            </div>

            {/* Telegram ID */}
            <div className="text-xs font-sans text-turf-green font-medium">
                {telegramId}
            </div>

            {/* Schedule Action */}
            <div>
                <button
                    onClick={onManageSchedule}
                    className="flex items-center gap-2 text-[0.6rem] font-heading font-black uppercase tracking-widest text-text-secondary hover:text-turf-green transition-colors"
                    title="Manage Schedule"
                >
                    <Calendar className="w-3.5 h-3.5" />
                    Schedule
                </button>
            </div>

            {/* Notes */}
            <div className="text-[0.65rem] font-sans text-text-muted truncate italic" title={notes}>
                {notes || 'No notes...'}
            </div>

            {/* More Actions */}
            <button className="p-1 hover:bg-dashboard-bg rounded-sm text-text-muted transition-colors">
                <MoreHorizontal className="w-4 h-4" />
            </button>
        </div>
    );
}
