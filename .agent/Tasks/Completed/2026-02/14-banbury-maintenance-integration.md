# BanburyMaintenance Integration — Phase 1: Database Foundation ✅

**Completed**: 2026-02-25

## What Was Done
Integrated BanburyMaintenance tracking into TurfSheet's database by consolidating all tables into a single `turfsheet` schema, fixing a critical CASCADE DROP bug that destroyed the database twice, and adding a MaintenancePage to the frontend.

## Key Changes
- Fixed root cause: first migration changed from `DROP SCHEMA CASCADE` to `CREATE SCHEMA IF NOT EXISTS` (idempotent)
- Created comprehensive rebuild migration (20260225060000) recreating all 16 tables with IF NOT EXISTS
- Added `maintenance_issues` and `maintenance_reporters` tables for BanburyMaintenance integration
- Consolidated from separate `maintenance` schema into unified `turfsheet` schema
- Added MaintenancePage frontend component with issue list/detail view
- Renamed `rank` column to `sort_order` (PostgreSQL reserved word conflict)
- Made whiteboard resilient to empty jobs table
- Updated PostgREST to expose only `turfsheet` schema
- Cleaned up 3 stale non-timestamped migration files

## Notes
- `maintenance_log.issues` source table didn't exist on this instance, so maintenance_issues is empty (ready for Tom/OpenClaw to write to)
- Database is shared with BanburyMaintenance project — orphan remote migrations from other projects may still appear but are now safe due to idempotent first migration
- Lesson learned: `rank` is a PostgreSQL reserved word — always use `sort_order` for ordering columns
