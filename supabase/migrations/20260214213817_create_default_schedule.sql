-- Migration: Create default schedule system for staff
-- Date: 2026-02-14
-- Description: Creates a single global default work schedule (M-F 7:30a-2:30p)
--              that can be copied to individual staff schedules
-- Rollback: DROP TABLE IF EXISTS turfsheet.staff_schedules; DROP TABLE IF EXISTS turfsheet.default_schedule;

-- Global default schedule (single row, one per organization)
CREATE TABLE turfsheet.default_schedule (
    id SERIAL PRIMARY KEY,
    monday_on BOOLEAN DEFAULT true,
    monday_start TIME DEFAULT '07:30:00',
    monday_end TIME DEFAULT '14:30:00',
    tuesday_on BOOLEAN DEFAULT true,
    tuesday_start TIME DEFAULT '07:30:00',
    tuesday_end TIME DEFAULT '14:30:00',
    wednesday_on BOOLEAN DEFAULT true,
    wednesday_start TIME DEFAULT '07:30:00',
    wednesday_end TIME DEFAULT '14:30:00',
    thursday_on BOOLEAN DEFAULT true,
    thursday_start TIME DEFAULT '07:30:00',
    thursday_end TIME DEFAULT '14:30:00',
    friday_on BOOLEAN DEFAULT true,
    friday_start TIME DEFAULT '07:30:00',
    friday_end TIME DEFAULT '14:30:00',
    saturday_on BOOLEAN DEFAULT false,
    saturday_start TIME DEFAULT '07:30:00',
    saturday_end TIME DEFAULT '14:30:00',
    sunday_on BOOLEAN DEFAULT false,
    sunday_start TIME DEFAULT '07:30:00',
    sunday_end TIME DEFAULT '14:30:00',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff-specific schedules (one per staff member)
CREATE TABLE turfsheet.staff_schedules (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER NOT NULL REFERENCES turfsheet.staff(id) ON DELETE CASCADE,
    monday_on BOOLEAN DEFAULT true,
    monday_start TIME DEFAULT '07:30:00',
    monday_end TIME DEFAULT '14:30:00',
    tuesday_on BOOLEAN DEFAULT true,
    tuesday_start TIME DEFAULT '07:30:00',
    tuesday_end TIME DEFAULT '14:30:00',
    wednesday_on BOOLEAN DEFAULT true,
    wednesday_start TIME DEFAULT '07:30:00',
    wednesday_end TIME DEFAULT '14:30:00',
    thursday_on BOOLEAN DEFAULT true,
    thursday_start TIME DEFAULT '07:30:00',
    thursday_end TIME DEFAULT '14:30:00',
    friday_on BOOLEAN DEFAULT true,
    friday_start TIME DEFAULT '07:30:00',
    friday_end TIME DEFAULT '14:30:00',
    saturday_on BOOLEAN DEFAULT false,
    saturday_start TIME DEFAULT '07:30:00',
    saturday_end TIME DEFAULT '14:30:00',
    sunday_on BOOLEAN DEFAULT false,
    sunday_start TIME DEFAULT '07:30:00',
    sunday_end TIME DEFAULT '14:30:00',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(staff_id)
);

-- Insert the global default (M-F 7:30a-2:30p, weekends off)
INSERT INTO turfsheet.default_schedule (id) VALUES (1);

-- Enable RLS
ALTER TABLE turfsheet.default_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE turfsheet.staff_schedules ENABLE ROW LEVEL SECURITY;

-- Policies for default_schedule (read-only for all, update for authenticated)
CREATE POLICY "Allow read access to default schedule"
    ON turfsheet.default_schedule
    FOR SELECT
    USING (true);

CREATE POLICY "Allow authenticated users to update default schedule"
    ON turfsheet.default_schedule
    FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Policies for staff_schedules (full access for authenticated)
CREATE POLICY "Allow read access to staff schedules"
    ON turfsheet.staff_schedules
    FOR SELECT
    USING (true);

CREATE POLICY "Allow authenticated users to insert staff schedules"
    ON turfsheet.staff_schedules
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update staff schedules"
    ON turfsheet.staff_schedules
    FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete staff schedules"
    ON turfsheet.staff_schedules
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- Grant access to anon and authenticated users
GRANT SELECT ON turfsheet.default_schedule TO anon, authenticated;
GRANT UPDATE ON turfsheet.default_schedule TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.staff_schedules TO anon, authenticated;
GRANT USAGE ON SEQUENCE turfsheet.staff_schedules_id_seq TO anon, authenticated;
