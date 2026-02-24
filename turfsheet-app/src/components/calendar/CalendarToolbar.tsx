import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { ToolbarProps } from 'react-big-calendar';

interface CalendarToolbarProps extends ToolbarProps {
  onAddEvent: () => void;
}

function CalendarToolbar({ label, onNavigate, onAddEvent }: CalendarToolbarProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      {/* Left: Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigate('PREV')}
          className="p-2 border border-border-color hover:bg-dashboard-bg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-text-secondary" />
        </button>
        <button
          onClick={() => onNavigate('NEXT')}
          className="p-2 border border-border-color hover:bg-dashboard-bg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-text-secondary" />
        </button>
        <h2 className="text-xl font-heading font-bold text-text-primary uppercase tracking-tight ml-2">
          {label}
        </h2>
      </div>

      {/* Right: Add Event button */}
      <button
        onClick={onAddEvent}
        className="flex items-center gap-2 bg-turf-green text-white px-5 py-2.5 font-heading font-black text-[0.7rem] uppercase tracking-[0.15em] hover:bg-turf-green-dark transition-colors shadow-sm"
      >
        <Plus className="w-4 h-4" />
        Add Event
      </button>
    </div>
  );
}

/**
 * Factory function that creates a toolbar component with the onAddEvent callback baked in.
 * This is needed because react-big-calendar's `components.toolbar` expects a component,
 * not a component with extra props.
 */
export function createCalendarToolbar(onAddEvent: () => void) {
  return function ToolbarWithAddEvent(props: ToolbarProps) {
    return <CalendarToolbar {...props} onAddEvent={onAddEvent} />;
  };
}

export default CalendarToolbar;
