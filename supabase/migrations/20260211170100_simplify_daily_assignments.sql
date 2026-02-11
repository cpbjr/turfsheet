-- Migration: Simplify daily_assignments — one primary job per staff per day
-- Date: 2026-02-11
-- Rollback: ALTER TABLE turfsheet.daily_assignments ADD COLUMN job_order INTEGER;

-- Step 1: Drop the existing unique constraint that includes job_order
ALTER TABLE turfsheet.daily_assignments
  DROP CONSTRAINT IF EXISTS daily_assignments_staff_id_assignment_date_job_order_key;

-- Step 2: Remove any job_order = 2 rows (dev data only)
DELETE FROM turfsheet.daily_assignments WHERE job_order = 2;

-- Step 3: Drop the job_order column
ALTER TABLE turfsheet.daily_assignments DROP COLUMN IF EXISTS job_order;

-- Step 4: Add new unique constraint — one job per staff per date
ALTER TABLE turfsheet.daily_assignments
  ADD CONSTRAINT daily_assignments_staff_date_unique UNIQUE (staff_id, assignment_date);

-- Step 5: Drop the priority column from daily_assignments (priority letters belong on second jobs only)
ALTER TABLE turfsheet.daily_assignments DROP COLUMN IF EXISTS priority;
