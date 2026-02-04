-- Migration: Verify and migrate tables to public schema
-- Date: 2026-02-04
-- Description: Ensure jobs and staff tables are in public schema and drop turfsheet schema if it exists
-- Rollback: Manual - requires recreating turfsheet schema

-- Check if turfsheet schema exists and drop it (moving tables to public first if needed)
DO $$
BEGIN
  -- Move tables from turfsheet schema to public schema if they exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'turfsheet') THEN
    -- Move jobs table if it exists in turfsheet schema
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'turfsheet' AND table_name = 'jobs') THEN
      ALTER TABLE turfsheet.jobs SET SCHEMA public;
    END IF;

    -- Move staff table if it exists in turfsheet schema
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'turfsheet' AND table_name = 'staff') THEN
      ALTER TABLE turfsheet.staff SET SCHEMA public;
    END IF;

    -- Drop the turfsheet schema
    DROP SCHEMA IF EXISTS turfsheet CASCADE;
  END IF;

  -- Ensure tables exist in public schema if they don't
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'jobs') THEN
    CREATE TABLE public.jobs (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      crew_needed INTEGER NOT NULL DEFAULT 1,
      priority TEXT CHECK (priority IN ('Low', 'Normal', 'High', 'Urgent')),
      section TEXT CHECK (section IN ('First Jobs', 'Second Jobs')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    COMMENT ON TABLE public.jobs IS 'Job templates/library for golf course maintenance tasks';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'staff') THEN
    CREATE TABLE public.staff (
      id SERIAL PRIMARY KEY,
      role TEXT NOT NULL,
      name TEXT NOT NULL,
      telephone TEXT,
      telegram_id TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    COMMENT ON TABLE public.staff IS 'Staff members for golf course operations';
    COMMENT ON COLUMN public.staff.telegram_id IS 'Telegram username or ID for messaging';
  END IF;

  -- Insert initial data if tables are empty
  IF (SELECT COUNT(*) FROM public.jobs) = 0 THEN
    INSERT INTO public.jobs (title, crew_needed) VALUES ('Tree Work', 3);
  END IF;

  IF (SELECT COUNT(*) FROM public.staff) = 0 THEN
    INSERT INTO public.staff (role, name, telephone) VALUES ('Superintendent', 'Darryl', '208-949-9264');
  END IF;
END $$;
