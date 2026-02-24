import type { CalendarEvent } from '../types';

/**
 * Returns the Nth occurrence of a given weekday in a month.
 * weekday: 0=Sunday, 1=Monday, ... 6=Saturday
 */
function nthWeekday(year: number, month: number, weekday: number, n: number): Date {
  const first = new Date(year, month, 1);
  const firstDay = first.getDay();
  let day = 1 + ((weekday - firstDay + 7) % 7) + (n - 1) * 7;
  return new Date(year, month, day);
}

/**
 * Returns the last occurrence of a given weekday in a month.
 */
function lastWeekday(year: number, month: number, weekday: number): Date {
  const lastDay = new Date(year, month + 1, 0);
  const diff = (lastDay.getDay() - weekday + 7) % 7;
  return new Date(year, month, lastDay.getDate() - diff);
}

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function makeHoliday(name: string, date: Date, year: number): CalendarEvent {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
  return {
    id: `holiday-${slug}-${year}`,
    title: name,
    event_date: toISODate(date),
    event_type: 'holiday',
    all_day: true,
    created_at: '',
    updated_at: '',
  };
}

/**
 * Returns an array of CalendarEvent objects for major US holidays in the given year.
 */
export function getUSHolidays(year: number): CalendarEvent[] {
  return [
    // New Year's Day - January 1
    makeHoliday("New Year's Day", new Date(year, 0, 1), year),

    // MLK Day - 3rd Monday of January
    makeHoliday('Martin Luther King Jr. Day', nthWeekday(year, 0, 1, 3), year),

    // Presidents' Day - 3rd Monday of February
    makeHoliday("Presidents' Day", nthWeekday(year, 1, 1, 3), year),

    // Memorial Day - Last Monday of May
    makeHoliday('Memorial Day', lastWeekday(year, 4, 1), year),

    // Independence Day - July 4
    makeHoliday('Independence Day', new Date(year, 6, 4), year),

    // Labor Day - 1st Monday of September
    makeHoliday('Labor Day', nthWeekday(year, 8, 1, 1), year),

    // Columbus Day - 2nd Monday of October
    makeHoliday('Columbus Day', nthWeekday(year, 9, 1, 2), year),

    // Veterans Day - November 11
    makeHoliday('Veterans Day', new Date(year, 10, 11), year),

    // Thanksgiving - 4th Thursday of November
    makeHoliday('Thanksgiving', nthWeekday(year, 10, 4, 4), year),

    // Christmas - December 25
    makeHoliday('Christmas Day', new Date(year, 11, 25), year),
  ];
}
