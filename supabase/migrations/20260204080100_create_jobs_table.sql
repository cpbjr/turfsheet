-- Migration: Create jobs table in public schema
-- Date: 2026-02-04
-- Description: Create jobs table in public schema for job templates/library
-- Rollback: DROP TABLE IF EXISTS public.jobs;

CREATE TABLE IF NOT EXISTS public.jobs (
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
