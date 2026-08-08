import type { ToolbarProps } from 'react-big-calendar';
import CalendarToolbar from './CalendarToolbar';

/**
 * Factory function that creates a toolbar component with the onAddEvent callback baked in.
 * This is needed because react-big-calendar's `components.toolbar` expects a component,
 * not a component with extra props.
 *
 * Kept out of CalendarToolbar.tsx so that file exports only its component — mixing component
 * and non-component exports in one module defeats Fast Refresh.
 */
export function createCalendarToolbar(onAddEvent: () => void) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function ToolbarWithAddEvent(props: ToolbarProps<any, object>) {
    return <CalendarToolbar {...props} onAddEvent={onAddEvent} />;
  };
}
