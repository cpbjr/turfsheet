-- Migration: Create maintenance schema with issues and reporters tables
-- Date: 2026-02-24
-- Description: Database foundation for BanburyMaintenance integration into TurfSheet.
--   Old Tom Morris will write maintenance issues here via OpenClaw function-calling.
-- Rollback: DROP SCHEMA IF EXISTS maintenance CASCADE;

-- =============================================================================
-- Schema
-- =============================================================================
CREATE SCHEMA IF NOT EXISTS maintenance;

-- Grant schema usage
GRANT USAGE ON SCHEMA maintenance TO anon, authenticated, service_role;

-- Default privileges for future tables in this schema
ALTER DEFAULT PRIVILEGES IN SCHEMA maintenance
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA maintenance
  GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated;

-- =============================================================================
-- Table: maintenance.reporters
-- Telegram users who report issues. Referenced by issues table.
-- =============================================================================
CREATE TABLE maintenance.reporters (
  telegram_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'Staff',
  is_active BOOLEAN DEFAULT true,
  message_count INTEGER DEFAULT 0,
  last_message_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE maintenance.reporters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon select reporters"
  ON maintenance.reporters FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert reporters"
  ON maintenance.reporters FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update reporters"
  ON maintenance.reporters FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete reporters"
  ON maintenance.reporters FOR DELETE TO anon USING (true);

CREATE POLICY "Allow authenticated select reporters"
  ON maintenance.reporters FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert reporters"
  ON maintenance.reporters FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update reporters"
  ON maintenance.reporters FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete reporters"
  ON maintenance.reporters FOR DELETE TO authenticated USING (true);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON maintenance.reporters TO anon, authenticated;

COMMENT ON TABLE maintenance.reporters IS 'Telegram users who report maintenance issues via Old Tom';
COMMENT ON COLUMN maintenance.reporters.telegram_id IS 'Telegram user ID — primary key';
COMMENT ON COLUMN maintenance.reporters.message_count IS 'Running count of messages sent through Tom';

-- =============================================================================
-- Table: maintenance.issues
-- Core maintenance issue tracking. Tom creates these from staff reports.
-- =============================================================================
CREATE TABLE maintenance.issues (
  id SERIAL PRIMARY KEY,
  issue_number SERIAL,
  description TEXT NOT NULL,
  location_area TEXT,
  location_detail TEXT,
  location_position TEXT,
  status TEXT NOT NULL DEFAULT 'Open'
    CHECK (status IN ('Open', 'In Progress', 'Completed')),
  priority TEXT NOT NULL DEFAULT 'Medium'
    CHECK (priority IN ('Low', 'Medium', 'High')),
  reporter_name TEXT,
  reporter_telegram_id TEXT REFERENCES maintenance.reporters(telegram_id),
  photo_url TEXT,
  notes TEXT,
  assigned_to TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Indexes for common queries
CREATE INDEX idx_issues_status ON maintenance.issues(status);
CREATE INDEX idx_issues_priority ON maintenance.issues(priority);
CREATE INDEX idx_issues_created_at ON maintenance.issues(created_at DESC);
CREATE INDEX idx_issues_issue_number ON maintenance.issues(issue_number);
CREATE INDEX idx_issues_reporter ON maintenance.issues(reporter_telegram_id);

-- RLS
ALTER TABLE maintenance.issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon select issues"
  ON maintenance.issues FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert issues"
  ON maintenance.issues FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update issues"
  ON maintenance.issues FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete issues"
  ON maintenance.issues FOR DELETE TO anon USING (true);

CREATE POLICY "Allow authenticated select issues"
  ON maintenance.issues FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert issues"
  ON maintenance.issues FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update issues"
  ON maintenance.issues FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete issues"
  ON maintenance.issues FOR DELETE TO authenticated USING (true);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON maintenance.issues TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE maintenance.issues_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE maintenance.issues_issue_number_seq TO anon, authenticated;

COMMENT ON TABLE maintenance.issues IS 'Maintenance issues reported by field staff via Old Tom Morris';
COMMENT ON COLUMN maintenance.issues.issue_number IS 'Human-friendly issue reference number (#24)';
COMMENT ON COLUMN maintenance.issues.location_area IS 'High-level area: Hole 1-18, Clubhouse, Practice Area, etc.';
COMMENT ON COLUMN maintenance.issues.location_detail IS 'Specific feature: Green, Fairway, Bunker, Tee Box, etc.';
COMMENT ON COLUMN maintenance.issues.location_position IS 'Optional position qualifier: Front, Back, Left, Right, Center';
COMMENT ON COLUMN maintenance.issues.photo_url IS 'URL to photo in maintenance-photos storage bucket';
COMMENT ON COLUMN maintenance.issues.assigned_to IS 'Staff member name assigned to resolve the issue';

-- =============================================================================
-- Storage bucket: maintenance-photos
-- Public bucket for issue photos uploaded by Tom from Telegram
-- =============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('maintenance-photos', 'maintenance-photos', true, 20971520)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: allow public read, authenticated/anon upload
CREATE POLICY "Allow public read maintenance-photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'maintenance-photos');

CREATE POLICY "Allow anon upload maintenance-photos"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'maintenance-photos');

CREATE POLICY "Allow authenticated upload maintenance-photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'maintenance-photos');

CREATE POLICY "Allow service_role manage maintenance-photos"
  ON storage.objects FOR ALL TO service_role
  USING (bucket_id = 'maintenance-photos')
  WITH CHECK (bucket_id = 'maintenance-photos');
