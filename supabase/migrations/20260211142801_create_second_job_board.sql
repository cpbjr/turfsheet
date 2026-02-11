-- Migration: Create second_job_board table
-- Date: 2026-02-11
-- Rollback: DROP TABLE turfsheet.second_job_board;

CREATE TABLE turfsheet.second_job_board (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES turfsheet.jobs(id) ON DELETE CASCADE,
  board_date DATE NOT NULL DEFAULT CURRENT_DATE,
  rank INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(job_id, board_date)
);

-- Enable RLS
ALTER TABLE turfsheet.second_job_board ENABLE ROW LEVEL SECURITY;

-- Policies (anon access — app uses anon key)
CREATE POLICY "Allow anon select second_job_board"
  ON turfsheet.second_job_board FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert second_job_board"
  ON turfsheet.second_job_board FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update second_job_board"
  ON turfsheet.second_job_board FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete second_job_board"
  ON turfsheet.second_job_board FOR DELETE TO anon USING (true);

-- Authenticated policies
CREATE POLICY "Allow authenticated select second_job_board"
  ON turfsheet.second_job_board FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert second_job_board"
  ON turfsheet.second_job_board FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update second_job_board"
  ON turfsheet.second_job_board FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete second_job_board"
  ON turfsheet.second_job_board FOR DELETE TO authenticated USING (true);

-- Grant table + sequence permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.second_job_board TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE turfsheet.second_job_board_id_seq TO anon, authenticated;
