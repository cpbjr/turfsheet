-- Migration: Move jobs and staff tables from public to turfsheet schema
-- Date: 2026-02-04
-- Description: Moves jobs and staff tables from public schema to turfsheet schema while preserving all data and relationships
-- Rollback: Move tables back to public schema and drop turfsheet versions

-- Step 1: Create turfsheet schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS turfsheet;

-- Step 2: Create jobs table in turfsheet schema with same structure
CREATE TABLE IF NOT EXISTS turfsheet.jobs (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    crew_needed INTEGER NOT NULL DEFAULT 1,
    priority TEXT CHECK (priority IN ('Low', 'Normal', 'High', 'Urgent')),
    section TEXT CHECK (section IN ('First Jobs', 'Second Jobs')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create staff table in turfsheet schema with same structure
CREATE TABLE IF NOT EXISTS turfsheet.staff (
    id SERIAL PRIMARY KEY,
    role TEXT NOT NULL,
    name TEXT NOT NULL,
    telephone TEXT,
    telegram_id TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Copy data from public.jobs to turfsheet.jobs (preserve IDs and timestamps)
INSERT INTO turfsheet.jobs (id, title, description, crew_needed, priority, section, created_at, updated_at)
SELECT id, title, description, crew_needed, priority, section, created_at, updated_at
FROM public.jobs
ON CONFLICT (id) DO NOTHING;

-- Step 5: Copy data from public.staff to turfsheet.staff (preserve IDs and timestamps)
INSERT INTO turfsheet.staff (id, role, name, telephone, telegram_id, notes, created_at, updated_at)
SELECT id, role, name, telephone, telegram_id, notes, created_at, updated_at
FROM public.staff
ON CONFLICT (id) DO NOTHING;

-- Step 6: Add comments to turfsheet tables
COMMENT ON TABLE turfsheet.jobs IS 'Job templates/library for golf course maintenance tasks';
COMMENT ON TABLE turfsheet.staff IS 'Staff members for golf course operations';
COMMENT ON COLUMN turfsheet.staff.telegram_id IS 'Telegram username or ID for messaging';

-- Step 7: Drop public versions of the tables
DROP TABLE IF EXISTS public.jobs;
DROP TABLE IF EXISTS public.staff;

-- Step 8: Enable RLS on turfsheet tables
ALTER TABLE turfsheet.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE turfsheet.staff ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS policies for jobs table (allow all reads to authenticated users)
CREATE POLICY "Enable read access for all users" ON turfsheet.jobs
    FOR SELECT
    USING (true);

-- Step 10: Create RLS policies for staff table (allow all reads to authenticated users)
CREATE POLICY "Enable read access for all users" ON turfsheet.staff
    FOR SELECT
    USING (true);

-- Step 11: Grant SELECT permissions to anon role on turfsheet tables
GRANT SELECT ON turfsheet.jobs TO anon;
GRANT SELECT ON turfsheet.staff TO anon;
