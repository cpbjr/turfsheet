-- Migration: Create staff table in public schema
-- Date: 2026-02-04
-- Description: Create staff table in public schema for staff members
-- Rollback: DROP TABLE IF EXISTS public.staff;

CREATE TABLE IF NOT EXISTS public.staff (
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
