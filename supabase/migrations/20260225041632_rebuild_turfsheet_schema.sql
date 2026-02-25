-- Migration: Rebuild turfsheet schema with all tables
-- Date: 2026-02-25
-- Purpose: Move staff/jobs from public to turfsheet, create all missing tables
-- Context: Migration history was repaired as "applied" but tables were never created
--          in the turfsheet schema. Only staff and jobs exist (in public).
-- Rollback: DROP SCHEMA turfsheet CASCADE; (nuclear - loses all data)

-- ============================================================
-- STEP 1: Ensure turfsheet schema exists (created by prior migration)
-- ============================================================
CREATE SCHEMA IF NOT EXISTS turfsheet;
GRANT USAGE, CREATE ON SCHEMA turfsheet TO anon, authenticated;

-- ============================================================
-- STEP 2: Create enum type and utility function
-- ============================================================
DO $$ BEGIN
  CREATE TYPE turfsheet.staff_role AS ENUM (
    'Superintendant',
    'Assistant Superintendant',
    'Mechanic',
    'Senior Staff Member',
    'Staff Member',
    'Temporary Staff Member'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION turfsheet.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- STEP 3: Move staff from public to turfsheet (preserving data)
-- ============================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'staff') THEN
    ALTER TABLE public.staff SET SCHEMA turfsheet;
  END IF;
END $$;

ALTER TABLE turfsheet.staff ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Enable read access for all users" ON turfsheet.staff FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Enable insert access for all users" ON turfsheet.staff FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Enable update access for all users" ON turfsheet.staff FOR UPDATE USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Enable delete access for all users" ON turfsheet.staff FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.staff TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE turfsheet.staff_id_seq TO anon, authenticated;

-- ============================================================
-- STEP 4: Move jobs from public to turfsheet (preserving data)
-- ============================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'jobs') THEN
    ALTER TABLE public.jobs SET SCHEMA turfsheet;
  END IF;
END $$;

ALTER TABLE turfsheet.jobs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Enable read access for all users" ON turfsheet.jobs FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Enable insert access for all users" ON turfsheet.jobs FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Enable update access for all users" ON turfsheet.jobs FOR UPDATE USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Enable delete access for all users" ON turfsheet.jobs FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.jobs TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE turfsheet.jobs_id_seq TO anon, authenticated;

-- ============================================================
-- STEP 5: Create daily_assignments
-- ============================================================
CREATE TABLE IF NOT EXISTS turfsheet.daily_assignments (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER NOT NULL REFERENCES turfsheet.staff(id) ON DELETE CASCADE,
  job_id INTEGER NOT NULL REFERENCES turfsheet.jobs(id) ON DELETE RESTRICT,
  assignment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT daily_assignments_staff_date_unique UNIQUE (staff_id, assignment_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_assignments_date ON turfsheet.daily_assignments(assignment_date);
CREATE INDEX IF NOT EXISTS idx_daily_assignments_staff_id ON turfsheet.daily_assignments(staff_id);
CREATE INDEX IF NOT EXISTS idx_daily_assignments_staff_date ON turfsheet.daily_assignments(staff_id, assignment_date);

ALTER TABLE turfsheet.daily_assignments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Allow all to select daily_assignments" ON turfsheet.daily_assignments FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow all to insert daily_assignments" ON turfsheet.daily_assignments FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow all to update daily_assignments" ON turfsheet.daily_assignments FOR UPDATE USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow all to delete daily_assignments" ON turfsheet.daily_assignments FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.daily_assignments TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE turfsheet.daily_assignments_id_seq TO anon, authenticated;

-- ============================================================
-- STEP 6: Create staff_skills
-- ============================================================
CREATE TABLE IF NOT EXISTS turfsheet.staff_skills (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER NOT NULL REFERENCES turfsheet.staff(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'learned' CHECK (source IN ('hardcoded', 'learned')),
  times_completed INTEGER NOT NULL DEFAULT 0,
  last_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT staff_skills_unique UNIQUE(staff_id, skill_name)
);

CREATE INDEX IF NOT EXISTS idx_staff_skills_staff_id ON turfsheet.staff_skills(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_skills_skill_name ON turfsheet.staff_skills(skill_name);

ALTER TABLE turfsheet.staff_skills ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Allow all select staff_skills" ON turfsheet.staff_skills FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow all insert staff_skills" ON turfsheet.staff_skills FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow all update staff_skills" ON turfsheet.staff_skills FOR UPDATE USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow all delete staff_skills" ON turfsheet.staff_skills FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.staff_skills TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE turfsheet.staff_skills_id_seq TO anon, authenticated;

-- ============================================================
-- STEP 7: Create daily_board
-- ============================================================
CREATE TABLE IF NOT EXISTS turfsheet.daily_board (
  id SERIAL PRIMARY KEY,
  board_date DATE NOT NULL UNIQUE,
  sunrise_time TIME,
  announcements TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_daily_board_date ON turfsheet.daily_board(board_date);

ALTER TABLE turfsheet.daily_board ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Allow all select daily_board" ON turfsheet.daily_board FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow all insert daily_board" ON turfsheet.daily_board FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow all update daily_board" ON turfsheet.daily_board FOR UPDATE USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow all delete daily_board" ON turfsheet.daily_board FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.daily_board TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE turfsheet.daily_board_id_seq TO anon, authenticated;

-- ============================================================
-- STEP 8: Create second_job_board
-- ============================================================
CREATE TABLE IF NOT EXISTS turfsheet.second_job_board (
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

CREATE INDEX IF NOT EXISTS idx_second_job_board_date ON turfsheet.second_job_board(board_date);
CREATE INDEX IF NOT EXISTS idx_second_job_board_date_grabbed ON turfsheet.second_job_board(board_date, grabbed_by);

ALTER TABLE turfsheet.second_job_board ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Allow all select second_job_board" ON turfsheet.second_job_board FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow all insert second_job_board" ON turfsheet.second_job_board FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow all update second_job_board" ON turfsheet.second_job_board FOR UPDATE USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow all delete second_job_board" ON turfsheet.second_job_board FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.second_job_board TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE turfsheet.second_job_board_id_seq TO anon, authenticated;

-- ============================================================
-- STEP 9: Create project_sections
-- ============================================================
CREATE TABLE IF NOT EXISTS turfsheet.project_sections (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE turfsheet.project_sections ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Allow all access to project_sections" ON turfsheet.project_sections FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.project_sections TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE turfsheet.project_sections_id_seq TO anon, authenticated;

INSERT INTO turfsheet.project_sections (name, sort_order) VALUES
  ('Projects', 1),
  ('Irrigation', 2)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- STEP 10: Create projects
-- ============================================================
CREATE TABLE IF NOT EXISTS turfsheet.projects (
  id SERIAL PRIMARY KEY,
  section_id INTEGER NOT NULL REFERENCES turfsheet.project_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  priority TEXT CHECK (priority IS NULL OR (length(priority) = 1 AND priority ~ '^[A-Z]$')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold')),
  estimated_start_date DATE,
  estimated_end_date DATE,
  estimated_hours NUMERIC(8,1),
  estimated_cost NUMERIC(12,2),
  actual_cost NUMERIC(12,2),
  estimated_crew_size INTEGER,
  required_roles TEXT,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_section ON turfsheet.projects(section_id);
CREATE INDEX IF NOT EXISTS idx_projects_priority ON turfsheet.projects(priority);
CREATE INDEX IF NOT EXISTS idx_projects_status ON turfsheet.projects(status);

ALTER TABLE turfsheet.projects ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Allow all access to projects" ON turfsheet.projects FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.projects TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE turfsheet.projects_id_seq TO anon, authenticated;

-- ============================================================
-- STEP 11: Create default_schedule
-- ============================================================
CREATE TABLE IF NOT EXISTS turfsheet.default_schedule (
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

ALTER TABLE turfsheet.default_schedule ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Allow read access to default schedule" ON turfsheet.default_schedule FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow all users to update default schedule" ON turfsheet.default_schedule FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

GRANT SELECT ON turfsheet.default_schedule TO anon, authenticated;
GRANT UPDATE ON turfsheet.default_schedule TO authenticated;

INSERT INTO turfsheet.default_schedule (id) VALUES (1) ON CONFLICT DO NOTHING;

-- ============================================================
-- STEP 12: Create staff_schedules
-- ============================================================
CREATE TABLE IF NOT EXISTS turfsheet.staff_schedules (
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
    CONSTRAINT staff_schedules_unique UNIQUE(staff_id)
);

ALTER TABLE turfsheet.staff_schedules ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Allow read access to staff schedules" ON turfsheet.staff_schedules FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow all users to insert staff schedules" ON turfsheet.staff_schedules FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow all users to update staff schedules" ON turfsheet.staff_schedules FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow all users to delete staff schedules" ON turfsheet.staff_schedules FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.staff_schedules TO anon, authenticated;
GRANT USAGE ON SEQUENCE turfsheet.staff_schedules_id_seq TO anon, authenticated;

-- ============================================================
-- STEP 13: Create equipment
-- ============================================================
CREATE TABLE IF NOT EXISTS turfsheet.equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    equipment_number TEXT,
    category TEXT NOT NULL CHECK (category IN ('Mowers', 'Carts', 'Tools', 'Other')),
    model TEXT,
    manufacturer TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Maintenance', 'Retired')),
    purchase_date DATE,
    purchase_cost NUMERIC(10, 2),
    maintenance_notes TEXT,
    last_serviced_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equipment_category ON turfsheet.equipment(category);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON turfsheet.equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_created_at ON turfsheet.equipment(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_equipment_number ON turfsheet.equipment(equipment_number);

CREATE TRIGGER update_equipment_updated_at
    BEFORE UPDATE ON turfsheet.equipment
    FOR EACH ROW
    EXECUTE FUNCTION turfsheet.update_updated_at_column();

ALTER TABLE turfsheet.equipment ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Enable read access for all users" ON turfsheet.equipment FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Enable insert for all users" ON turfsheet.equipment FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Enable update for all users" ON turfsheet.equipment FOR UPDATE USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Enable delete for all users" ON turfsheet.equipment FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

GRANT ALL ON turfsheet.equipment TO anon, authenticated;

-- ============================================================
-- STEP 14: Create calendar_events
-- ============================================================
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

CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON turfsheet.calendar_events(event_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON turfsheet.calendar_events(event_type);

ALTER TABLE turfsheet.calendar_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Allow all access to calendar_events" ON turfsheet.calendar_events FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

GRANT ALL ON turfsheet.calendar_events TO anon, authenticated;

-- ============================================================
-- STEP 15: Create pesticide_applications
-- ============================================================
CREATE TABLE IF NOT EXISTS turfsheet.pesticide_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_date DATE NOT NULL,
    product_name TEXT NOT NULL,
    epa_registration_number TEXT,
    active_ingredient TEXT,
    application_rate TEXT NOT NULL,
    rate_unit TEXT DEFAULT 'oz/1000sqft',
    total_amount_used TEXT,
    area_applied TEXT NOT NULL,
    area_size TEXT,
    target_pest TEXT,
    method TEXT CHECK (method IS NULL OR method IN (
        'spray', 'granular', 'injection', 'drench', 'other'
    )),
    operator_id INTEGER REFERENCES turfsheet.staff(id) ON DELETE SET NULL,
    wind_speed TEXT,
    temperature TEXT,
    weather_conditions TEXT,
    rei_hours INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pesticide_app_date ON turfsheet.pesticide_applications(application_date DESC);
CREATE INDEX IF NOT EXISTS idx_pesticide_app_product ON turfsheet.pesticide_applications(product_name);
CREATE INDEX IF NOT EXISTS idx_pesticide_app_operator ON turfsheet.pesticide_applications(operator_id);

ALTER TABLE turfsheet.pesticide_applications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Allow all access to pesticide_applications" ON turfsheet.pesticide_applications FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

GRANT ALL ON turfsheet.pesticide_applications TO anon, authenticated;

-- ============================================================
-- STEP 16: Create staff_time_off
-- ============================================================
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

CREATE INDEX IF NOT EXISTS idx_staff_time_off_staff ON turfsheet.staff_time_off(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_time_off_dates ON turfsheet.staff_time_off(start_date, end_date);

ALTER TABLE turfsheet.staff_time_off ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Allow all access to staff_time_off" ON turfsheet.staff_time_off FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

GRANT ALL ON turfsheet.staff_time_off TO anon, authenticated;

-- ============================================================
-- STEP 17: Grant service_role access to everything
-- ============================================================
GRANT USAGE ON SCHEMA turfsheet TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA turfsheet TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA turfsheet TO service_role;

-- Grant service_role on maintenance schema (if it exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'maintenance') THEN
    GRANT USAGE ON SCHEMA maintenance TO service_role;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA maintenance TO service_role;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA maintenance TO service_role;
  END IF;
END $$;

-- ============================================================
-- STEP 18: Set default privileges for future tables
-- ============================================================
ALTER DEFAULT PRIVILEGES IN SCHEMA turfsheet
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA turfsheet
  GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated, service_role;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'maintenance') THEN
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA maintenance GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA maintenance GRANT USAGE, SELECT ON SEQUENCES TO service_role';
  END IF;
END $$;

-- ============================================================
-- STEP 19: Reload PostgREST
-- ============================================================
NOTIFY pgrst, 'reload config';
