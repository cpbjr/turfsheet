# Implementation Plan: Monitoring Page — Green Readings

Date: 2026-03-05

## Task Overview
Add a new "Monitoring" section to TurfSheet for tracking moisture levels and firmness readings on greens (holes 1–18).

## User Requirements
- **Navigation:** New "Monitoring" nav item in the sidebar
- **Scope:** Greens only (holes 1–18) — moisture + firmness
- **Fields per reading:** Hole number, moisture level, firmness, date, time, staff member, notes
- **Display:** Log table + simple trend charts (line charts per metric over time)

## Database: New Table

Table: `turfsheet.green_readings`

```sql
CREATE TABLE turfsheet.green_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reading_date DATE NOT NULL,
  reading_time TIME,
  hole_number INTEGER NOT NULL CHECK (hole_number BETWEEN 1 AND 18),
  moisture NUMERIC(5,2),           -- e.g. 22.50 (%)
  firmness NUMERIC(6,1),           -- e.g. 85.0 (Clegg value or similar)
  staff_id INTEGER REFERENCES turfsheet.staff(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## Files to Create
1. `/home/user/turfsheet/supabase/migrations/20260305000000_create_green_readings.sql`
2. `/home/user/turfsheet/turfsheet-app/src/pages/MonitoringPage.tsx`
3. `/home/user/turfsheet/turfsheet-app/src/components/monitoring/ReadingForm.tsx`

## Files to Modify
1. `src/types/index.ts` — add `GreenReading` interface
2. `src/components/layout/Sidebar.tsx` — add Monitoring nav item
3. `src/App.tsx` — add `/monitoring` route

## Step-by-Step

1. Create Supabase migration SQL file
2. Add TypeScript types
3. Add sidebar nav entry
4. Add route to App.tsx
5. Build ReadingForm component (create/edit)
6. Build MonitoringPage with:
   - Header + "Log Reading" button
   - Filter bar (date range, hole number)
   - Readings table (sortable)
   - Trend charts (moisture over time, firmness over time)

## Dependencies
- `recharts` — check if already installed; if not, use a simple SVG chart or add it
- Supabase migration must be pushed before page works in production

## Testing Plan
- Log a reading, verify it appears in table
- Edit a reading, verify update
- Delete a reading
- Filter by hole number
- Charts render with multiple data points
