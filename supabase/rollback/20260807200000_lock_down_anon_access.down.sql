-- ROLLBACK for 20260807200000_lock_down_anon_access.sql
-- Date: 2026-08-07
--
-- Restores the pre-lockdown state: permissive policies and anon table grants exactly as
-- they were on the live database on 2026-08-07.
--
-- This file lives OUTSIDE supabase/migrations/ on purpose. It must never be picked up by a
-- migration run -- applying it re-opens the whole database to anyone with the bundled key.
-- Run it by hand in the Supabase Studio SQL editor only if the lockdown has to be undone.

BEGIN;

-- banbury_pin_sets
DROP POLICY IF EXISTS "banbury_pin_sets_authenticated_all" ON turfsheet.banbury_pin_sets;
CREATE POLICY "banbury_pin_sets_anon_all" ON turfsheet.banbury_pin_sets
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.banbury_pin_sets TO anon;

-- calendar_events
DROP POLICY IF EXISTS "calendar_events_authenticated_all" ON turfsheet.calendar_events;
CREATE POLICY "Allow all access to calendar_events" ON turfsheet.calendar_events
    FOR ALL TO public
    USING (true)
    WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.calendar_events TO anon;

-- chemical_products
DROP POLICY IF EXISTS "chemical_products_authenticated_all" ON turfsheet.chemical_products;
CREATE POLICY "Allow all access to chemical_products" ON turfsheet.chemical_products
    FOR ALL TO public
    USING (true)
    WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.chemical_products TO anon;

-- course_features
DROP POLICY IF EXISTS "course_features_authenticated_all" ON turfsheet.course_features;
CREATE POLICY "Read course_features" ON turfsheet.course_features
    FOR SELECT TO anon, authenticated
    USING (true);
CREATE POLICY "Write course_features authenticated" ON turfsheet.course_features
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.course_features TO anon;

-- daily_assignments
DROP POLICY IF EXISTS "daily_assignments_authenticated_all" ON turfsheet.daily_assignments;
CREATE POLICY "Allow all to delete daily_assignments" ON turfsheet.daily_assignments
    FOR DELETE TO public
    USING (true);
CREATE POLICY "Allow all to insert daily_assignments" ON turfsheet.daily_assignments
    FOR INSERT TO public
    WITH CHECK (true);
CREATE POLICY "Allow all to select daily_assignments" ON turfsheet.daily_assignments
    FOR SELECT TO public
    USING (true);
CREATE POLICY "Allow all to update daily_assignments" ON turfsheet.daily_assignments
    FOR UPDATE TO public
    USING (true)
    WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.daily_assignments TO anon;

-- daily_board
DROP POLICY IF EXISTS "daily_board_authenticated_all" ON turfsheet.daily_board;
CREATE POLICY "Allow all delete daily_board" ON turfsheet.daily_board
    FOR DELETE TO public
    USING (true);
CREATE POLICY "Allow all insert daily_board" ON turfsheet.daily_board
    FOR INSERT TO public
    WITH CHECK (true);
CREATE POLICY "Allow all select daily_board" ON turfsheet.daily_board
    FOR SELECT TO public
    USING (true);
CREATE POLICY "Allow all update daily_board" ON turfsheet.daily_board
    FOR UPDATE TO public
    USING (true)
    WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.daily_board TO anon;

-- default_schedule
DROP POLICY IF EXISTS "default_schedule_authenticated_all" ON turfsheet.default_schedule;
CREATE POLICY "Allow all users to update default schedule" ON turfsheet.default_schedule
    FOR UPDATE TO public
    USING (true);
CREATE POLICY "Allow read access to default schedule" ON turfsheet.default_schedule
    FOR SELECT TO public
    USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.default_schedule TO anon;

-- equipment
DROP POLICY IF EXISTS "equipment_authenticated_all" ON turfsheet.equipment;
CREATE POLICY "Enable delete for all users" ON turfsheet.equipment
    FOR DELETE TO public
    USING (true);
CREATE POLICY "Enable insert for all users" ON turfsheet.equipment
    FOR INSERT TO public
    WITH CHECK (true);
CREATE POLICY "Enable read access for all users" ON turfsheet.equipment
    FOR SELECT TO public
    USING (true);
CREATE POLICY "Enable update for all users" ON turfsheet.equipment
    FOR UPDATE TO public
    USING (true)
    WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.equipment TO anon;

-- jobs
DROP POLICY IF EXISTS "jobs_authenticated_all" ON turfsheet.jobs;
CREATE POLICY "Allow anonymous read on jobs" ON turfsheet.jobs
    FOR SELECT TO public
    USING (true);
CREATE POLICY "Enable delete access for all users" ON turfsheet.jobs
    FOR DELETE TO public
    USING (true);
CREATE POLICY "Enable insert access for all users" ON turfsheet.jobs
    FOR INSERT TO public
    WITH CHECK (true);
CREATE POLICY "Enable read access for all users" ON turfsheet.jobs
    FOR SELECT TO public
    USING (true);
CREATE POLICY "Enable update access for all users" ON turfsheet.jobs
    FOR UPDATE TO public
    USING (true)
    WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.jobs TO anon;

-- maintenance_issues
DROP POLICY IF EXISTS "maintenance_issues_authenticated_all" ON turfsheet.maintenance_issues;
CREATE POLICY "Allow full access to maintenance_issues" ON turfsheet.maintenance_issues
    FOR ALL TO public
    USING (true)
    WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.maintenance_issues TO anon;

-- maintenance_reporters
DROP POLICY IF EXISTS "maintenance_reporters_authenticated_all" ON turfsheet.maintenance_reporters;
CREATE POLICY "Allow full access to maintenance_reporters" ON turfsheet.maintenance_reporters
    FOR ALL TO public
    USING (true)
    WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.maintenance_reporters TO anon;

-- memory_chunks
DROP POLICY IF EXISTS "memory_chunks_authenticated_all" ON turfsheet.memory_chunks;
CREATE POLICY "memory_chunks_select" ON turfsheet.memory_chunks
    FOR SELECT TO public
    USING (((access_level = 'all'::text) OR (current_setting('app.caller_role'::text, true) = ANY (ARRAY['Superintendant'::text, 'Assistant Superintendant'::text, 'admin'::text]))));
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.memory_chunks TO anon;

-- memory_documents
DROP POLICY IF EXISTS "memory_documents_authenticated_all" ON turfsheet.memory_documents;
CREATE POLICY "memory_docs_select" ON turfsheet.memory_documents
    FOR SELECT TO public
    USING (((access_level = 'all'::text) OR (current_setting('app.caller_role'::text, true) = ANY (ARRAY['Superintendant'::text, 'Assistant Superintendant'::text, 'admin'::text]))));
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.memory_documents TO anon;

-- memory_events
DROP POLICY IF EXISTS "memory_events_authenticated_all" ON turfsheet.memory_events;
CREATE POLICY "memory_events_admin_select" ON turfsheet.memory_events
    FOR SELECT TO public
    USING ((current_setting('app.caller_role'::text, true) = ANY (ARRAY['Superintendant'::text, 'Assistant Superintendant'::text, 'admin'::text])));
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.memory_events TO anon;

-- pesticide_applications
DROP POLICY IF EXISTS "pesticide_applications_authenticated_all" ON turfsheet.pesticide_applications;
CREATE POLICY "Allow all access to pesticide_applications" ON turfsheet.pesticide_applications
    FOR ALL TO public
    USING (true)
    WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.pesticide_applications TO anon;

-- project_sections
DROP POLICY IF EXISTS "project_sections_authenticated_all" ON turfsheet.project_sections;
CREATE POLICY "Allow all access to project_sections" ON turfsheet.project_sections
    FOR ALL TO public
    USING (true)
    WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.project_sections TO anon;

-- projects
DROP POLICY IF EXISTS "projects_authenticated_all" ON turfsheet.projects;
CREATE POLICY "Allow all access to projects" ON turfsheet.projects
    FOR ALL TO public
    USING (true)
    WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.projects TO anon;

-- scheduled_job_queue
DROP POLICY IF EXISTS "scheduled_job_queue_authenticated_all" ON turfsheet.scheduled_job_queue;
CREATE POLICY "Allow all delete scheduled_job_queue" ON turfsheet.scheduled_job_queue
    FOR DELETE TO public
    USING (true);
CREATE POLICY "Allow all insert scheduled_job_queue" ON turfsheet.scheduled_job_queue
    FOR INSERT TO public
    WITH CHECK (true);
CREATE POLICY "Allow all select scheduled_job_queue" ON turfsheet.scheduled_job_queue
    FOR SELECT TO public
    USING (true);
CREATE POLICY "Allow all update scheduled_job_queue" ON turfsheet.scheduled_job_queue
    FOR UPDATE TO public
    USING (true)
    WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.scheduled_job_queue TO anon;

-- second_job_board
DROP POLICY IF EXISTS "second_job_board_authenticated_all" ON turfsheet.second_job_board;
CREATE POLICY "Allow all delete second_job_board" ON turfsheet.second_job_board
    FOR DELETE TO public
    USING (true);
CREATE POLICY "Allow all insert second_job_board" ON turfsheet.second_job_board
    FOR INSERT TO public
    WITH CHECK (true);
CREATE POLICY "Allow all select second_job_board" ON turfsheet.second_job_board
    FOR SELECT TO public
    USING (true);
CREATE POLICY "Allow all update second_job_board" ON turfsheet.second_job_board
    FOR UPDATE TO public
    USING (true)
    WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.second_job_board TO anon;

-- spray_mix_templates
DROP POLICY IF EXISTS "spray_mix_templates_authenticated_all" ON turfsheet.spray_mix_templates;
CREATE POLICY "Allow all access to spray_mix_templates" ON turfsheet.spray_mix_templates
    FOR ALL TO public
    USING (true)
    WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.spray_mix_templates TO anon;

-- staff
DROP POLICY IF EXISTS "staff_authenticated_all" ON turfsheet.staff;
CREATE POLICY "Allow anonymous read on staff" ON turfsheet.staff
    FOR SELECT TO public
    USING (true);
CREATE POLICY "Enable delete access for all users" ON turfsheet.staff
    FOR DELETE TO public
    USING (true);
CREATE POLICY "Enable insert access for all users" ON turfsheet.staff
    FOR INSERT TO public
    WITH CHECK (true);
CREATE POLICY "Enable read access for all users" ON turfsheet.staff
    FOR SELECT TO public
    USING (true);
CREATE POLICY "Enable update access for all users" ON turfsheet.staff
    FOR UPDATE TO public
    USING (true)
    WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.staff TO anon;

-- staff_schedules
DROP POLICY IF EXISTS "staff_schedules_authenticated_all" ON turfsheet.staff_schedules;
CREATE POLICY "Allow all users to delete staff schedules" ON turfsheet.staff_schedules
    FOR DELETE TO public
    USING (true);
CREATE POLICY "Allow all users to insert staff schedules" ON turfsheet.staff_schedules
    FOR INSERT TO public
    WITH CHECK (true);
CREATE POLICY "Allow all users to update staff schedules" ON turfsheet.staff_schedules
    FOR UPDATE TO public
    USING (true);
CREATE POLICY "Allow read access to staff schedules" ON turfsheet.staff_schedules
    FOR SELECT TO public
    USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.staff_schedules TO anon;

-- staff_skills
DROP POLICY IF EXISTS "staff_skills_authenticated_all" ON turfsheet.staff_skills;
CREATE POLICY "Allow all delete staff_skills" ON turfsheet.staff_skills
    FOR DELETE TO public
    USING (true);
CREATE POLICY "Allow all insert staff_skills" ON turfsheet.staff_skills
    FOR INSERT TO public
    WITH CHECK (true);
CREATE POLICY "Allow all select staff_skills" ON turfsheet.staff_skills
    FOR SELECT TO public
    USING (true);
CREATE POLICY "Allow all update staff_skills" ON turfsheet.staff_skills
    FOR UPDATE TO public
    USING (true)
    WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.staff_skills TO anon;

-- staff_time_off
DROP POLICY IF EXISTS "staff_time_off_authenticated_all" ON turfsheet.staff_time_off;
CREATE POLICY "Allow all access to staff_time_off" ON turfsheet.staff_time_off
    FOR ALL TO public
    USING (true)
    WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.staff_time_off TO anon;

GRANT EXECUTE ON FUNCTION turfsheet.match_memory_chunks(
    turfsheet.vector, integer, double precision, text, text, text, text
) TO anon;

COMMIT;
