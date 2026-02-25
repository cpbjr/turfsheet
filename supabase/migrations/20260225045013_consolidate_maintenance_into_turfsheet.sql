-- Migration: Create maintenance tables in turfsheet schema
-- Date: 2026-02-25
-- Purpose: Maintenance issues and reporters live in turfsheet schema (single schema for everything)
--          Tom/OpenClaw only needs one schema
-- Rollback: DROP TABLE IF EXISTS turfsheet.maintenance_issues CASCADE;
--           DROP TABLE IF EXISTS turfsheet.maintenance_reporters CASCADE;

-- Step 1: Create maintenance_reporters table
CREATE TABLE IF NOT EXISTS turfsheet.maintenance_reporters (
  telegram_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'Staff',
  is_active BOOLEAN DEFAULT true,
  message_count INTEGER DEFAULT 0,
  last_message_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create maintenance_issues table
CREATE TABLE IF NOT EXISTS turfsheet.maintenance_issues (
  id SERIAL PRIMARY KEY,
  issue_number SERIAL,
  description TEXT NOT NULL,
  location_area TEXT,
  location_detail TEXT,
  location_position TEXT,
  status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Completed')),
  priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
  reporter_name TEXT,
  reporter_telegram_id TEXT REFERENCES turfsheet.maintenance_reporters(telegram_id),
  photo_url TEXT,
  notes TEXT,
  assigned_to TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Step 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_issues_status ON turfsheet.maintenance_issues(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_issues_priority ON turfsheet.maintenance_issues(priority);
CREATE INDEX IF NOT EXISTS idx_maintenance_issues_created_at ON turfsheet.maintenance_issues(created_at);

-- Step 4: Enable RLS
ALTER TABLE turfsheet.maintenance_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE turfsheet.maintenance_reporters ENABLE ROW LEVEL SECURITY;

-- Step 5: Create permissive RLS policies
DO $$ BEGIN
  CREATE POLICY "Allow full access to maintenance_issues" ON turfsheet.maintenance_issues FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Allow full access to maintenance_reporters" ON turfsheet.maintenance_reporters FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Step 6: Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.maintenance_issues TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.maintenance_reporters TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA turfsheet TO anon, authenticated, service_role;

-- Step 7: Drop maintenance schema if it exists (no longer needed)
DROP SCHEMA IF EXISTS maintenance CASCADE;

-- Step 8: PostgREST only needs turfsheet now
ALTER ROLE authenticator SET pgrst.db_schemas = 'turfsheet';

-- Step 9: Reload PostgREST
NOTIFY pgrst, 'reload config';
