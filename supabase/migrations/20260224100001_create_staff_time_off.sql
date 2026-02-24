-- Migration: Create staff time off table (DB only, UI deferred)
-- Date: 2026-02-24
-- Rollback: DROP TABLE IF EXISTS turfsheet.staff_time_off CASCADE;

CREATE TABLE IF NOT EXISTS turfsheet.staff_time_off (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id INTEGER NOT NULL REFERENCES turfsheet.staff(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT CHECK (reason IS NULL OR reason IN ('vacation', 'sick', 'personal', 'other')),
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'denied')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_staff_time_off_staff ON turfsheet.staff_time_off(staff_id);
CREATE INDEX idx_staff_time_off_dates ON turfsheet.staff_time_off(start_date, end_date);

ALTER TABLE turfsheet.staff_time_off ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to staff_time_off" ON turfsheet.staff_time_off
    FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON turfsheet.staff_time_off TO anon, authenticated;
