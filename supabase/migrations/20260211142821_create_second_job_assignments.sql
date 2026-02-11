-- Migration: Create second_job_assignments table
-- Date: 2026-02-11
-- Rollback: DROP TABLE turfsheet.second_job_assignments;

CREATE TABLE turfsheet.second_job_assignments (
  id SERIAL PRIMARY KEY,
  board_item_id INTEGER NOT NULL REFERENCES turfsheet.second_job_board(id) ON DELETE CASCADE,
  staff_id INTEGER NOT NULL REFERENCES turfsheet.staff(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(board_item_id, staff_id)
);

-- Enable RLS
ALTER TABLE turfsheet.second_job_assignments ENABLE ROW LEVEL SECURITY;

-- Policies (anon access — app uses anon key)
CREATE POLICY "Allow anon select second_job_assignments"
  ON turfsheet.second_job_assignments FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert second_job_assignments"
  ON turfsheet.second_job_assignments FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update second_job_assignments"
  ON turfsheet.second_job_assignments FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete second_job_assignments"
  ON turfsheet.second_job_assignments FOR DELETE TO anon USING (true);

-- Authenticated policies
CREATE POLICY "Allow authenticated select second_job_assignments"
  ON turfsheet.second_job_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert second_job_assignments"
  ON turfsheet.second_job_assignments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update second_job_assignments"
  ON turfsheet.second_job_assignments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete second_job_assignments"
  ON turfsheet.second_job_assignments FOR DELETE TO authenticated USING (true);

-- Grant table + sequence permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.second_job_assignments TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE turfsheet.second_job_assignments_id_seq TO anon, authenticated;
