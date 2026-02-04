-- Migration: Insert initial data
-- Date: 2026-02-04
-- Description: Insert initial job and staff data for TurfSheet MVP
-- Rollback: DELETE FROM public.jobs; DELETE FROM public.staff;

INSERT INTO public.jobs (title, crew_needed)
VALUES ('Tree Work', 3);

INSERT INTO public.staff (role, name, telephone)
VALUES ('Superintendent', 'Darryl', '208-949-9264');
