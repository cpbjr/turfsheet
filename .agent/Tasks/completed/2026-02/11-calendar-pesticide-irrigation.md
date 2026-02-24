# Calendar, Pesticide Reporting & Irrigation Pages

**Date Completed:** 2026-02-24
**Branch:** `feature/calendar-pesticide-irrigation` (merged to main)
**Commit:** `160b0e8`

## What Was Accomplished

### 1. Calendar Page (full rewrite)
- Replaced stub with react-big-calendar (date-fns localizer, Sunday first day)
- Color-coded events by type: tournament (blue), championship (purple), event (amber), maintenance (red), holiday (turf green), other (gray)
- US holidays auto-populated (10 major holidays with floating date calculation)
- Custom toolbar with prev/next month navigation and "Add Event" button
- EventForm modal for creating events with all-day or timed event support
- CSS overrides for Turf Green theme integration

### 2. Pesticide Reporting Page (new)
- Full CRUD page following EquipmentPage pattern
- Entry form: date, operator (staff dropdown), product name, EPA registration number, active ingredient, target pest, application rate, total amount, area applied, method, REI hours, weather conditions, notes
- List view with search filtering by product name or area
- Sidebar icon: FlaskConical (lucide-react)

### 3. Irrigation Page (new placeholder)
- Professional "Planned Implementation / Coming Soon" card
- Sidebar icon: Droplets (lucide-react)

### 4. Additional Fixes
- Removed Messages (MessageSquare) from sidebar
- Removed History icon from sidebar
- Fixed Modal component: added `max-h-[90vh]`, `flex flex-col`, and `overflow-y-auto` so tall content (like schedule form) is scrollable
- Fixed calendar event mapping to support timed events (not just all-day)

## Database Migrations

- `20260224000000_create_pesticide_applications.sql` — pesticide_applications table with INTEGER FK to staff
- `20260224100000_create_calendar_events.sql` — calendar_events table with event_type constraint
- `20260224100001_create_staff_time_off.sql` — staff_time_off table (DB only, UI deferred)

## Files Created

- `turfsheet-app/src/pages/IrrigationPage.tsx`
- `turfsheet-app/src/pages/PesticidePage.tsx`
- `turfsheet-app/src/components/pesticide/PesticideForm.tsx`
- `turfsheet-app/src/components/pesticide/PesticideListItem.tsx`
- `turfsheet-app/src/components/calendar/EventForm.tsx`
- `turfsheet-app/src/components/calendar/CalendarToolbar.tsx`
- `turfsheet-app/src/styles/calendar-overrides.css`
- `turfsheet-app/src/data/us-holidays.ts`
- `supabase/migrations/20260224000000_create_pesticide_applications.sql`
- `supabase/migrations/20260224100000_create_calendar_events.sql`
- `supabase/migrations/20260224100001_create_staff_time_off.sql`

## Files Modified

- `turfsheet-app/src/components/layout/Sidebar.tsx` — Added FlaskConical + Droplets, removed MessageSquare + History
- `turfsheet-app/src/App.tsx` — Added PesticidePage + IrrigationPage routes
- `turfsheet-app/src/types/index.ts` — Added CalendarEvent, StaffTimeOff, PesticideApplication types
- `turfsheet-app/src/pages/CalendarPage.tsx` — Full rewrite with react-big-calendar
- `turfsheet-app/src/components/ui/Modal.tsx` — Scrollable with max-height

## Deferred to Planned

- Task 6: Staff Time-Off Management (DB table created, UI deferred)
- Task 7: Irrigation Management (placeholder page created, full implementation deferred)
