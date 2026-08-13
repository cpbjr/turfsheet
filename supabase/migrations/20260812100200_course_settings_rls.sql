-- Migration: RLS and grants for course_settings
-- Date: 2026-08-12
-- Purpose: The 2026-08-08 lockdown made every table authenticated-only and
--          revoked all anon grants. A new table without matching policies is
--          unreadable by the app. This matches the established pattern.
-- Ref: Completed/2026-08/1-site-authentication.md
-- Rollback:
--   DROP POLICY IF EXISTS course_settings_authenticated_all ON turfsheet.course_settings;
--   ALTER TABLE turfsheet.course_settings DISABLE ROW LEVEL SECURITY;

ALTER TABLE turfsheet.course_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY course_settings_authenticated_all
    ON turfsheet.course_settings
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON turfsheet.course_settings TO authenticated;

-- No anon grant. The course address is not part of the public pin-sheet handout
-- path, which reaches its data through a SECURITY DEFINER RPC rather than table
-- grants. Adding anon here would reopen a hole the lockdown closed.
REVOKE ALL ON turfsheet.course_settings FROM anon;
