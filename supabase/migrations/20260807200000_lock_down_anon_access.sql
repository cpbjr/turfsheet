-- Migration: lock anon out of every turfsheet table (site authentication)
-- Date: 2026-08-07
-- Plan: .agent/Tasks/Implementation/2026-08-07-site-authentication.md
-- Rollback: supabase/rollback/20260807200000_lock_down_anon_access.down.sql
--
-- The anon key ships inside the client bundle every visitor downloads. Until this runs,
-- anyone can extract it and query PostgREST directly. The frontend gate is a screen door;
-- this is the lock.
--
-- DO NOT RUN until the frontend auth gate is deployed and verified in production, and the
-- three role accounts exist. Running this first blanks every page for everyone.
--
-- DO NOT APPLY WITH `supabase db push` -- migration history on this project is out of sync.
-- Apply via Supabase Studio SQL editor or the Management API.
--
-- Table list, policy names and grants were enumerated from the LIVE database on 2026-08-07,
-- not from migration files. 24 tables, 55 permissive policies replaced.
--
-- Deliberately preserved for anon:
--   * USAGE on schema turfsheet          -- required to reach the RPC below
--   * EXECUTE on turfsheet.banbury_pin_set_by_token(text)
--       SECURITY DEFINER, reads banbury_pin_sets with the owner's rights, so the
--       ?pinToken= clubhouse handout keeps working after the table is locked.
--   * service_role policies on banbury_pin_sets and the three memory_* tables.

BEGIN;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
-- banbury_pin_sets
DROP POLICY IF EXISTS "banbury_pin_sets_anon_all" ON turfsheet.banbury_pin_sets;
CREATE POLICY "banbury_pin_sets_authenticated_all" ON turfsheet.banbury_pin_sets
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON turfsheet.banbury_pin_sets FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.banbury_pin_sets TO authenticated;

-- calendar_events
DROP POLICY IF EXISTS "Allow all access to calendar_events" ON turfsheet.calendar_events;
CREATE POLICY "calendar_events_authenticated_all" ON turfsheet.calendar_events
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON turfsheet.calendar_events FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.calendar_events TO authenticated;

-- chemical_products
DROP POLICY IF EXISTS "Allow all access to chemical_products" ON turfsheet.chemical_products;
CREATE POLICY "chemical_products_authenticated_all" ON turfsheet.chemical_products
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON turfsheet.chemical_products FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.chemical_products TO authenticated;

-- course_features
DROP POLICY IF EXISTS "Read course_features" ON turfsheet.course_features;
DROP POLICY IF EXISTS "Write course_features authenticated" ON turfsheet.course_features;
CREATE POLICY "course_features_authenticated_all" ON turfsheet.course_features
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON turfsheet.course_features FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.course_features TO authenticated;

-- daily_assignments
DROP POLICY IF EXISTS "Allow all to delete daily_assignments" ON turfsheet.daily_assignments;
DROP POLICY IF EXISTS "Allow all to insert daily_assignments" ON turfsheet.daily_assignments;
DROP POLICY IF EXISTS "Allow all to select daily_assignments" ON turfsheet.daily_assignments;
DROP POLICY IF EXISTS "Allow all to update daily_assignments" ON turfsheet.daily_assignments;
CREATE POLICY "daily_assignments_authenticated_all" ON turfsheet.daily_assignments
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON turfsheet.daily_assignments FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.daily_assignments TO authenticated;

-- daily_board
DROP POLICY IF EXISTS "Allow all delete daily_board" ON turfsheet.daily_board;
DROP POLICY IF EXISTS "Allow all insert daily_board" ON turfsheet.daily_board;
DROP POLICY IF EXISTS "Allow all select daily_board" ON turfsheet.daily_board;
DROP POLICY IF EXISTS "Allow all update daily_board" ON turfsheet.daily_board;
CREATE POLICY "daily_board_authenticated_all" ON turfsheet.daily_board
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON turfsheet.daily_board FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.daily_board TO authenticated;

-- default_schedule
DROP POLICY IF EXISTS "Allow all users to update default schedule" ON turfsheet.default_schedule;
DROP POLICY IF EXISTS "Allow read access to default schedule" ON turfsheet.default_schedule;
CREATE POLICY "default_schedule_authenticated_all" ON turfsheet.default_schedule
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON turfsheet.default_schedule FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.default_schedule TO authenticated;

-- equipment
DROP POLICY IF EXISTS "Enable delete for all users" ON turfsheet.equipment;
DROP POLICY IF EXISTS "Enable insert for all users" ON turfsheet.equipment;
DROP POLICY IF EXISTS "Enable read access for all users" ON turfsheet.equipment;
DROP POLICY IF EXISTS "Enable update for all users" ON turfsheet.equipment;
CREATE POLICY "equipment_authenticated_all" ON turfsheet.equipment
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON turfsheet.equipment FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.equipment TO authenticated;

-- jobs
DROP POLICY IF EXISTS "Allow anonymous read on jobs" ON turfsheet.jobs;
DROP POLICY IF EXISTS "Enable delete access for all users" ON turfsheet.jobs;
DROP POLICY IF EXISTS "Enable insert access for all users" ON turfsheet.jobs;
DROP POLICY IF EXISTS "Enable read access for all users" ON turfsheet.jobs;
DROP POLICY IF EXISTS "Enable update access for all users" ON turfsheet.jobs;
CREATE POLICY "jobs_authenticated_all" ON turfsheet.jobs
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON turfsheet.jobs FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.jobs TO authenticated;

-- maintenance_issues
DROP POLICY IF EXISTS "Allow full access to maintenance_issues" ON turfsheet.maintenance_issues;
CREATE POLICY "maintenance_issues_authenticated_all" ON turfsheet.maintenance_issues
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON turfsheet.maintenance_issues FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.maintenance_issues TO authenticated;

-- maintenance_reporters
DROP POLICY IF EXISTS "Allow full access to maintenance_reporters" ON turfsheet.maintenance_reporters;
CREATE POLICY "maintenance_reporters_authenticated_all" ON turfsheet.maintenance_reporters
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON turfsheet.maintenance_reporters FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.maintenance_reporters TO authenticated;

-- memory_chunks
DROP POLICY IF EXISTS "memory_chunks_select" ON turfsheet.memory_chunks;
CREATE POLICY "memory_chunks_authenticated_all" ON turfsheet.memory_chunks
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON turfsheet.memory_chunks FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.memory_chunks TO authenticated;

-- memory_documents
DROP POLICY IF EXISTS "memory_docs_select" ON turfsheet.memory_documents;
CREATE POLICY "memory_documents_authenticated_all" ON turfsheet.memory_documents
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON turfsheet.memory_documents FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.memory_documents TO authenticated;

-- memory_events
DROP POLICY IF EXISTS "memory_events_admin_select" ON turfsheet.memory_events;
CREATE POLICY "memory_events_authenticated_all" ON turfsheet.memory_events
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON turfsheet.memory_events FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.memory_events TO authenticated;

-- pesticide_applications
DROP POLICY IF EXISTS "Allow all access to pesticide_applications" ON turfsheet.pesticide_applications;
CREATE POLICY "pesticide_applications_authenticated_all" ON turfsheet.pesticide_applications
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON turfsheet.pesticide_applications FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.pesticide_applications TO authenticated;

-- project_sections
DROP POLICY IF EXISTS "Allow all access to project_sections" ON turfsheet.project_sections;
CREATE POLICY "project_sections_authenticated_all" ON turfsheet.project_sections
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON turfsheet.project_sections FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.project_sections TO authenticated;

-- projects
DROP POLICY IF EXISTS "Allow all access to projects" ON turfsheet.projects;
CREATE POLICY "projects_authenticated_all" ON turfsheet.projects
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON turfsheet.projects FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.projects TO authenticated;

-- scheduled_job_queue
DROP POLICY IF EXISTS "Allow all delete scheduled_job_queue" ON turfsheet.scheduled_job_queue;
DROP POLICY IF EXISTS "Allow all insert scheduled_job_queue" ON turfsheet.scheduled_job_queue;
DROP POLICY IF EXISTS "Allow all select scheduled_job_queue" ON turfsheet.scheduled_job_queue;
DROP POLICY IF EXISTS "Allow all update scheduled_job_queue" ON turfsheet.scheduled_job_queue;
CREATE POLICY "scheduled_job_queue_authenticated_all" ON turfsheet.scheduled_job_queue
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON turfsheet.scheduled_job_queue FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.scheduled_job_queue TO authenticated;

-- second_job_board
DROP POLICY IF EXISTS "Allow all delete second_job_board" ON turfsheet.second_job_board;
DROP POLICY IF EXISTS "Allow all insert second_job_board" ON turfsheet.second_job_board;
DROP POLICY IF EXISTS "Allow all select second_job_board" ON turfsheet.second_job_board;
DROP POLICY IF EXISTS "Allow all update second_job_board" ON turfsheet.second_job_board;
CREATE POLICY "second_job_board_authenticated_all" ON turfsheet.second_job_board
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON turfsheet.second_job_board FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.second_job_board TO authenticated;

-- spray_mix_templates
DROP POLICY IF EXISTS "Allow all access to spray_mix_templates" ON turfsheet.spray_mix_templates;
CREATE POLICY "spray_mix_templates_authenticated_all" ON turfsheet.spray_mix_templates
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON turfsheet.spray_mix_templates FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.spray_mix_templates TO authenticated;

-- staff
DROP POLICY IF EXISTS "Allow anonymous read on staff" ON turfsheet.staff;
DROP POLICY IF EXISTS "Enable delete access for all users" ON turfsheet.staff;
DROP POLICY IF EXISTS "Enable insert access for all users" ON turfsheet.staff;
DROP POLICY IF EXISTS "Enable read access for all users" ON turfsheet.staff;
DROP POLICY IF EXISTS "Enable update access for all users" ON turfsheet.staff;
CREATE POLICY "staff_authenticated_all" ON turfsheet.staff
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON turfsheet.staff FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.staff TO authenticated;

-- staff_schedules
DROP POLICY IF EXISTS "Allow all users to delete staff schedules" ON turfsheet.staff_schedules;
DROP POLICY IF EXISTS "Allow all users to insert staff schedules" ON turfsheet.staff_schedules;
DROP POLICY IF EXISTS "Allow all users to update staff schedules" ON turfsheet.staff_schedules;
DROP POLICY IF EXISTS "Allow read access to staff schedules" ON turfsheet.staff_schedules;
CREATE POLICY "staff_schedules_authenticated_all" ON turfsheet.staff_schedules
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON turfsheet.staff_schedules FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.staff_schedules TO authenticated;

-- staff_skills
DROP POLICY IF EXISTS "Allow all delete staff_skills" ON turfsheet.staff_skills;
DROP POLICY IF EXISTS "Allow all insert staff_skills" ON turfsheet.staff_skills;
DROP POLICY IF EXISTS "Allow all select staff_skills" ON turfsheet.staff_skills;
DROP POLICY IF EXISTS "Allow all update staff_skills" ON turfsheet.staff_skills;
CREATE POLICY "staff_skills_authenticated_all" ON turfsheet.staff_skills
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON turfsheet.staff_skills FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.staff_skills TO authenticated;

-- staff_time_off
DROP POLICY IF EXISTS "Allow all access to staff_time_off" ON turfsheet.staff_time_off;
CREATE POLICY "staff_time_off_authenticated_all" ON turfsheet.staff_time_off
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON turfsheet.staff_time_off FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.staff_time_off TO authenticated;

-- ---------------------------------------------------------------------------
-- Functions
-- ---------------------------------------------------------------------------
-- match_memory_chunks is SECURITY DEFINER and currently EXECUTEable by anon, which lets
-- anyone with the bundled key vector-search the memory corpus regardless of table grants.
-- Nothing in turfsheet-app calls it; service_role retains EXECUTE.
REVOKE EXECUTE ON FUNCTION turfsheet.match_memory_chunks(
    turfsheet.vector, integer, double precision, text, text, text, text
) FROM anon;

-- banbury_pin_set_by_token keeps its anon EXECUTE grant. This is the one deliberate
-- exception and is asserted here so a future reader does not "clean it up".
DO $$
BEGIN
    IF NOT has_function_privilege('anon', 'turfsheet.banbury_pin_set_by_token(text)', 'EXECUTE') THEN
        RAISE EXCEPTION 'anon lost EXECUTE on banbury_pin_set_by_token - pin handouts would break';
    END IF;
END $$;

COMMIT;
