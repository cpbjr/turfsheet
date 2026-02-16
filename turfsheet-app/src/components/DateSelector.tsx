import { format } from 'date-fns';
import { useSettings } from '../contexts/SettingsContext';

export function DateSelector() {
  const { settings } = useSettings();
  const today = new Date();

  const formatTime12Hour = (time24: string): string => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <div className="flex items-center gap-3 bg-dashboard-bg px-4 py-1.5 border border-border-color">
      <span className="font-heading font-bold text-sm text-text-primary tracking-tight">
        {format(today, 'EEE MMM d, yyyy')}
      </span>
      <span className="ml-2 text-turf-green font-heading font-black text-xs whitespace-nowrap tracking-widest bg-turf-green/10 px-4 py-1 uppercase border-l border-turf-green/20">
        Workday: {formatTime12Hour(settings.workdayStartTime)}-{formatTime12Hour(settings.workdayEndTime)}
      </span>
    </div>
  );
}
