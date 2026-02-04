-- Migration: Drop turfsheet schema if exists
-- Date: 2026-02-04
-- Description: Remove the turfsheet schema and consolidate tables to public schema
-- Rollback: CREATE SCHEMA IF NOT EXISTS turfsheet;

DROP SCHEMA IF EXISTS turfsheet CASCADE;
