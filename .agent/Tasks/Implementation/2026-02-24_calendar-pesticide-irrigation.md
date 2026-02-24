# Calendar, Pesticide Reporting & Irrigation Pages

**Date:** 2026-02-24
**Branch:** `feature/calendar-pesticide-irrigation`
**Status:** Implementation Complete

## Overview

Added three new features to TurfSheet:
1. **Calendar Page** — Full month-view calendar using react-big-calendar with color-coded events, US holidays, and event creation
2. **Pesticide Reporting Page** — Regulatory compliance form for recording chemical applications
3. **Irrigation Page** — Professional placeholder for future implementation

## Key Decisions

- Calendar library: `react-big-calendar` with `date-fns` localizer
- First day of week: Sunday (default for US locale)
- Staff time-off: DB table created, UI deferred to planned.md
- Messages nav item removed from sidebar
- Sidebar icons: FlaskConical (Pesticide), Droplets (Irrigation)
- Staff table uses `SERIAL` (integer) IDs — all new FK columns use `INTEGER` type

## Files Created

### Database Migrations
- `supabase/migrations/20260224000000_create_pesticide_applications.sql`
- `supabase/migrations/20260224100000_create_calendar_events.sql`
- `supabase/migrations/20260224100001_create_staff_time_off.sql`

### Frontend Components
- `turfsheet-app/src/pages/IrrigationPage.tsx`
- `turfsheet-app/src/pages/PesticidePage.tsx`
- `turfsheet-app/src/components/pesticide/PesticideForm.tsx`
- `turfsheet-app/src/components/pesticide/PesticideListItem.tsx`
- `turfsheet-app/src/pages/CalendarPage.tsx` (full rewrite)
- `turfsheet-app/src/components/calendar/EventForm.tsx`
- `turfsheet-app/src/components/calendar/CalendarToolbar.tsx`
- `turfsheet-app/src/styles/calendar-overrides.css`
- `turfsheet-app/src/data/us-holidays.ts`

### Files Modified
- `turfsheet-app/src/components/layout/Sidebar.tsx` — Added FlaskConical + Droplets, removed MessageSquare
- `turfsheet-app/src/App.tsx` — Added PesticidePage + IrrigationPage routes
- `turfsheet-app/src/types/index.ts` — Added CalendarEvent, StaffTimeOff, PesticideApplication types

## Verification

- TypeScript: `tsc --noEmit` passes
- Vite build: passes (732KB JS bundle)
- All 3 migrations pushed successfully
- All 3 pages load with zero console errors
- Dev server tested on port 5179
