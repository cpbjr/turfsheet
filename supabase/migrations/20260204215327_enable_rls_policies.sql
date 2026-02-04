-- Migration: Enable RLS and create policies for jobs and staff tables
-- Date: 2026-02-04
-- Description: Enable Row Level Security on public.jobs and public.staff tables and create policies allowing anonymous/public access
-- Rollback: Disable RLS on both tables using ALTER TABLE <table> DISABLE ROW LEVEL SECURITY

-- Check current RLS status and enable RLS on jobs table
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Check current RLS status and enable RLS on staff table
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to prevent conflicts)
DROP POLICY IF EXISTS "Allow anonymous read on jobs" ON public.jobs;
DROP POLICY IF EXISTS "Allow anonymous read on staff" ON public.staff;

-- Create policy for public read access to jobs table
CREATE POLICY "Allow anonymous read on jobs" ON public.jobs
  FOR SELECT
  USING (true);

-- Create policy for public read access to staff table
CREATE POLICY "Allow anonymous read on staff" ON public.staff
  FOR SELECT
  USING (true);
