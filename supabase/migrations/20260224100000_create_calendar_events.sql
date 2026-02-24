-- Migration: Create calendar events table
-- Date: 2026-02-24
-- Rollback: DROP TABLE IF EXISTS turfsheet.calendar_events CASCADE;

CREATE TABLE IF NOT EXISTS turfsheet.calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    end_date DATE,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'tournament', 'championship', 'event', 'maintenance', 'holiday', 'other'
    )),
    all_day BOOLEAN NOT NULL DEFAULT true,
    start_time TIME,
    end_time TIME,
    color TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_calendar_events_date ON turfsheet.calendar_events(event_date);
CREATE INDEX idx_calendar_events_type ON turfsheet.calendar_events(event_type);

ALTER TABLE turfsheet.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to calendar_events" ON turfsheet.calendar_events
    FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON turfsheet.calendar_events TO anon, authenticated;
