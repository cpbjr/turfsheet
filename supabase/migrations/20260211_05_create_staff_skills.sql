-- Migration: Create staff_skills table for tracking capabilities
-- Date: 2026-02-11
-- Rollback: DROP TABLE IF EXISTS turfsheet.staff_skills;

CREATE TABLE turfsheet.staff_skills (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER NOT NULL REFERENCES turfsheet.staff(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'learned' CHECK (source IN ('hardcoded', 'learned')),
  times_completed INTEGER NOT NULL DEFAULT 0,
  last_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(staff_id, skill_name)
);

-- Indexes
CREATE INDEX idx_staff_skills_staff_id ON turfsheet.staff_skills(staff_id);
CREATE INDEX idx_staff_skills_skill_name ON turfsheet.staff_skills(skill_name);

-- Enable RLS
ALTER TABLE turfsheet.staff_skills ENABLE ROW LEVEL SECURITY;

-- RLS policies (anon + authenticated, permissive)
CREATE POLICY "Allow anon select staff_skills"
  ON turfsheet.staff_skills FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert staff_skills"
  ON turfsheet.staff_skills FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update staff_skills"
  ON turfsheet.staff_skills FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete staff_skills"
  ON turfsheet.staff_skills FOR DELETE TO anon USING (true);

CREATE POLICY "Allow authenticated select staff_skills"
  ON turfsheet.staff_skills FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert staff_skills"
  ON turfsheet.staff_skills FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update staff_skills"
  ON turfsheet.staff_skills FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete staff_skills"
  ON turfsheet.staff_skills FOR DELETE TO authenticated USING (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.staff_skills TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE turfsheet.staff_skills_id_seq TO anon, authenticated;

COMMENT ON TABLE turfsheet.staff_skills IS 'Staff capabilities — hardcoded by super or learned from completed assignments';
COMMENT ON COLUMN turfsheet.staff_skills.skill_name IS 'Normalized skill/job name (e.g., "Irrigation", "Mow Greens", "Bunker Work")';
COMMENT ON COLUMN turfsheet.staff_skills.source IS 'hardcoded = super set it, learned = system inferred from completed work';
COMMENT ON COLUMN turfsheet.staff_skills.times_completed IS 'How many times this staff member has completed this type of work';
COMMENT ON COLUMN turfsheet.staff_skills.last_completed_at IS 'When they last did this type of work';
