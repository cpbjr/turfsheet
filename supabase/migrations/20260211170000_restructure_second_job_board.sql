-- Migration: Restructure second_job_board for free-text + grab semantics
-- Date: 2026-02-11
-- Rollback: This is destructive — see rollback notes below
-- Note: Drops second_job_assignments table (no longer needed)

-- Step 1: Drop the second_job_assignments table (grab is now on board item itself)
DROP TABLE IF EXISTS turfsheet.second_job_assignments;

-- Step 2: Drop the old second_job_board table and recreate
-- (Existing data is dev/test only, safe to drop)
DROP TABLE IF EXISTS turfsheet.second_job_board;

-- Step 3: Create restructured second_job_board
CREATE TABLE turfsheet.second_job_board (
  id SERIAL PRIMARY KEY,
  board_date DATE NOT NULL,
  description TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  priority CHAR(1) CHECK (priority IS NULL OR priority ~ '^[A-Z]$'),
  grabbed_by INTEGER REFERENCES turfsheet.staff(id) ON DELETE SET NULL,
  grabbed_at TIMESTAMPTZ,
  carried_from DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_second_job_board_date ON turfsheet.second_job_board(board_date);
CREATE INDEX idx_second_job_board_date_grabbed ON turfsheet.second_job_board(board_date, grabbed_by);

-- Enable RLS
ALTER TABLE turfsheet.second_job_board ENABLE ROW LEVEL SECURITY;

-- RLS policies (anon + authenticated, permissive)
CREATE POLICY "Allow anon select second_job_board"
  ON turfsheet.second_job_board FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert second_job_board"
  ON turfsheet.second_job_board FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update second_job_board"
  ON turfsheet.second_job_board FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete second_job_board"
  ON turfsheet.second_job_board FOR DELETE TO anon USING (true);

CREATE POLICY "Allow authenticated select second_job_board"
  ON turfsheet.second_job_board FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert second_job_board"
  ON turfsheet.second_job_board FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update second_job_board"
  ON turfsheet.second_job_board FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete second_job_board"
  ON turfsheet.second_job_board FOR DELETE TO authenticated USING (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.second_job_board TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE turfsheet.second_job_board_id_seq TO anon, authenticated;

COMMENT ON TABLE turfsheet.second_job_board IS 'Daily second jobs list — free-text tasks the super writes each morning';
COMMENT ON COLUMN turfsheet.second_job_board.description IS 'Free-text task description as the super would write it (e.g., "Blow decks + mats", "Fence post (12)")';
COMMENT ON COLUMN turfsheet.second_job_board.sort_order IS 'Display order on the board (top to bottom as written)';
COMMENT ON COLUMN turfsheet.second_job_board.priority IS 'Single letter A-Z assigned later by super. A = emergency. NULL = not yet prioritized.';
COMMENT ON COLUMN turfsheet.second_job_board.grabbed_by IS 'Staff who grabbed/was assigned this task. NULL = still available.';
COMMENT ON COLUMN turfsheet.second_job_board.grabbed_at IS 'When the task was grabbed. NULL = still available.';
COMMENT ON COLUMN turfsheet.second_job_board.carried_from IS 'If this item was carried over, the original board_date. NULL = new today.';
