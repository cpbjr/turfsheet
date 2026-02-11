-- Migration: Create daily_board table for daily metadata
-- Date: 2026-02-11
-- Rollback: DROP TABLE IF EXISTS turfsheet.daily_board;

-- Drop if exists (handles re-run after partial push)
DROP TABLE IF EXISTS turfsheet.daily_board CASCADE;

CREATE TABLE turfsheet.daily_board (
  id SERIAL PRIMARY KEY,
  board_date DATE NOT NULL UNIQUE,
  sunrise_time TIME,
  announcements TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for date lookups
CREATE INDEX idx_daily_board_date ON turfsheet.daily_board(board_date);

-- Enable RLS
ALTER TABLE turfsheet.daily_board ENABLE ROW LEVEL SECURITY;

-- RLS policies (anon + authenticated, permissive)
CREATE POLICY "Allow anon select daily_board"
  ON turfsheet.daily_board FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert daily_board"
  ON turfsheet.daily_board FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update daily_board"
  ON turfsheet.daily_board FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete daily_board"
  ON turfsheet.daily_board FOR DELETE TO anon USING (true);

CREATE POLICY "Allow authenticated select daily_board"
  ON turfsheet.daily_board FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert daily_board"
  ON turfsheet.daily_board FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update daily_board"
  ON turfsheet.daily_board FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete daily_board"
  ON turfsheet.daily_board FOR DELETE TO authenticated USING (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.daily_board TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE turfsheet.daily_board_id_seq TO anon, authenticated;

COMMENT ON TABLE turfsheet.daily_board IS 'Daily board metadata — sunrise time, announcements, one row per date';
COMMENT ON COLUMN turfsheet.daily_board.sunrise_time IS 'Auto-generated sunrise time for the course location';
COMMENT ON COLUMN turfsheet.daily_board.announcements IS 'Super announcements for the day (e.g., B-9 START)';
