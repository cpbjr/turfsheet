-- Migration: Rename rank to sort_order
-- Date: 2026-02-25
-- Purpose: "rank" is a PostgreSQL reserved word (ordered-set aggregate function).
--          Supabase REST API can't use it in ORDER BY without triggering:
--          "WITHIN GROUP is required for ordered-set aggregate rank"
-- Rollback: ALTER TABLE turfsheet.staff RENAME COLUMN sort_order TO rank;

ALTER TABLE turfsheet.staff RENAME COLUMN rank TO sort_order;
