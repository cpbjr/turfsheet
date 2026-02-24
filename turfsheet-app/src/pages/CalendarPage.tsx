import { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/calendar-overrides.css';
import Modal from '../components/ui/Modal';
import EventForm from '../components/calendar/EventForm';
import { createCalendarToolbar } from '../components/calendar/CalendarToolbar';
import { getUSHolidays } from '../data/us-holidays';
import { supabase } from '../lib/supabase';
import type { CalendarEvent, CalendarEventType } from '../types';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

interface BigCalendarEvent {
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: CalendarEvent;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dbEvents, setDbEvents] = useState<CalendarEvent[]>([]);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Fetch events from Supabase for the visible month range
  const fetchEvents = useCallback(async (date: Date) => {
    const rangeStart = startOfMonth(subMonths(date, 1));
    const rangeEnd = endOfMonth(addMonths(date, 1));

    const startStr = format(rangeStart, 'yyyy-MM-dd');
    const endStr = format(rangeEnd, 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .gte('event_date', startStr)
      .lte('event_date', endStr)
      .order('event_date', { ascending: true });

    if (error) {
      console.error('Failed to fetch calendar events:', error);
      return;
    }

    setDbEvents(data || []);
  }, []);

  useEffect(() => {
    fetchEvents(currentDate);
  }, [currentDate, fetchEvents]);

  // Merge DB events with US holidays
  const allEvents = useMemo(() => {
    const year = currentDate.getFullYear();
    const holidays = getUSHolidays(year);
    // Also include adjacent year holidays if near year boundary
    const month = currentDate.getMonth();
    const extraHolidays = month === 0
      ? getUSHolidays(year - 1)
      : month === 11
        ? getUSHolidays(year + 1)
        : [];
    return [...dbEvents, ...holidays, ...extraHolidays];
  }, [dbEvents, currentDate]);

  // Convert to react-big-calendar format
  const calendarEvents: BigCalendarEvent[] = useMemo(() => {
    return allEvents.map((event) => {
      let startDate: Date;
      let endDate: Date;

      if (event.all_day || !event.start_time) {
        startDate = new Date(event.event_date + 'T00:00:00');
        endDate = event.end_date
          ? new Date(event.end_date + 'T23:59:59')
          : new Date(event.event_date + 'T23:59:59');
      } else {
        startDate = new Date(event.event_date + 'T' + event.start_time + ':00');
        const endDateStr = event.end_date || event.event_date;
        const endTimeStr = event.end_time || event.start_time;
        endDate = new Date(endDateStr + 'T' + endTimeStr + ':00');
      }

      return {
        title: event.title,
        start: startDate,
        end: endDate,
        allDay: event.all_day,
        resource: event,
      };
    });
  }, [allEvents]);

  // Color coding
  const eventPropGetter = useCallback((event: BigCalendarEvent) => {
    const eventType = event.resource?.event_type as CalendarEventType;
    const colorMap: Record<CalendarEventType, string> = {
      tournament: '#3B82F6',
      championship: '#8B5CF6',
      event: '#F59E0B',
      maintenance: '#EF4444',
      holiday: '#73A657',
      other: '#6B7280',
    };
    const bg = colorMap[eventType] || '#6B7280';
    return {
      style: {
        backgroundColor: bg,
        border: 'none',
        color: '#fff',
        fontSize: '0.75rem',
      },
    };
  }, []);

  // Click on a day slot
  const handleSelectSlot = useCallback(({ start }: { start: Date }) => {
    setSelectedDate(start);
    setIsAddEventModalOpen(true);
  }, []);

  // Add event to Supabase
  const handleAddEvent = useCallback(async (formData: any) => {
    const { error } = await supabase
      .from('calendar_events')
      .insert([formData]);

    if (error) {
      console.error('Failed to add event:', error);
      return;
    }

    setIsAddEventModalOpen(false);
    setSelectedDate(undefined);
    fetchEvents(currentDate);
  }, [currentDate, fetchEvents]);

  // Custom toolbar with Add Event button wired in
  const CustomToolbar = useMemo(
    () => createCalendarToolbar(() => setIsAddEventModalOpen(true)),
    []
  );

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex-1 overflow-hidden bg-white border border-border-color shadow-sm p-4">
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          defaultView="month"
          views={['month']}
          date={currentDate}
          onNavigate={setCurrentDate}
          eventPropGetter={eventPropGetter}
          components={{ toolbar: CustomToolbar }}
          onSelectSlot={handleSelectSlot}
          selectable
          style={{ height: '100%' }}
        />
      </div>

      <Modal
        isOpen={isAddEventModalOpen}
        onClose={() => setIsAddEventModalOpen(false)}
        title="Add Calendar Event"
      >
        <EventForm
          onSubmit={handleAddEvent}
          onCancel={() => setIsAddEventModalOpen(false)}
          initialDate={selectedDate}
        />
      </Modal>
    </div>
  );
}
