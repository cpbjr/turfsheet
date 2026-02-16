-- Migration: Create equipment table for inventory management
-- Date: 2026-02-16
-- Rollback: DROP TABLE IF EXISTS public.equipment CASCADE;

-- ============================================================
-- Equipment Table (inventory and asset tracking)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Mowers', 'Carts', 'Tools', 'Other')),
    model TEXT,
    manufacturer TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Maintenance', 'Retired')),
    purchase_date DATE,
    purchase_cost NUMERIC(10, 2),
    maintenance_notes TEXT,
    last_serviced_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_equipment_category ON public.equipment(category);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON public.equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_created_at ON public.equipment(created_at DESC);

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER update_equipment_updated_at
    BEFORE UPDATE ON public.equipment
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies (authenticated users can read/write)
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Equipment are viewable by authenticated users"
    ON public.equipment FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Equipment are creatable by authenticated users"
    ON public.equipment FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Equipment are updatable by authenticated users"
    ON public.equipment FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Equipment are deletable by authenticated users"
    ON public.equipment FOR DELETE
    TO authenticated
    USING (true);

COMMENT ON TABLE public.equipment IS 'Equipment inventory and asset tracking';
