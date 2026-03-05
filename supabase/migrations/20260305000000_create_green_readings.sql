-- Migration: Create green_readings table for moisture and firmness monitoring
-- Date: 2026-03-05
-- Rollback: DROP TABLE turfsheet.green_readings;

CREATE TABLE turfsheet.green_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reading_date DATE NOT NULL,
  reading_time TIME,
  hole_number INTEGER NOT NULL CHECK (hole_number BETWEEN 1 AND 18),
  moisture NUMERIC(5,2),    -- Volumetric water content (%)
  firmness NUMERIC(6,1),    -- Clegg value or equivalent
  staff_id INTEGER REFERENCES turfsheet.staff(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for common queries: by date and by hole
CREATE INDEX idx_green_readings_date ON turfsheet.green_readings (reading_date DESC);
CREATE INDEX idx_green_readings_hole ON turfsheet.green_readings (hole_number);

-- RLS
ALTER TABLE turfsheet.green_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for anon" ON turfsheet.green_readings
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated" ON turfsheet.green_readings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Grant access
GRANT ALL ON turfsheet.green_readings TO anon, authenticated, service_role;
