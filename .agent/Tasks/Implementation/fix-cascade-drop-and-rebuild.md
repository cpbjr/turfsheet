# Fix Root Cause: Cascade Drop + Database Rebuild

**Date:** 2026-02-25
**Branch:** `feature/maintenance-integration`
**Problem:** `20260204080000_create_turfsheet_schema.sql` contains `DROP SCHEMA turfsheet CASCADE` which destroys everything whenever orphan remote migrations cause a full replay. This has nuked the database twice this session.

**Current State:**
- turfsheet schema is destroyed (cascade drop replayed)
- Migrations through `20260225045013` are marked "applied" in remote tracking table but tables don't exist
- `20260225053426_remigrate_legacy_maintenance_data.sql` has never run
- Frontend code is already updated (uses `supabase` client with `maintenance_issues` table)

---

## Task 1: Fix the Dangerous First Migration

**File:** `supabase/migrations/20260204080000_create_turfsheet_schema.sql`

**Change:** Replace destructive `DROP SCHEMA CASCADE` with safe `CREATE IF NOT EXISTS`

```sql
-- Migration: Create turfsheet schema
-- Date: 2026-02-04
-- Description: Create the turfsheet schema for all TurfSheet tables
-- Rollback: DROP SCHEMA IF EXISTS turfsheet CASCADE;

CREATE SCHEMA IF NOT EXISTS turfsheet;
```

**Why:** This makes the migration idempotent — safe to replay any number of times without destroying data.

**Verify:** `cat supabase/migrations/20260204080000_create_turfsheet_schema.sql` — should show `CREATE SCHEMA IF NOT EXISTS`, no `DROP`.

---

## Task 2: Mark All Old Migrations as Applied (Again)

Since the database was destroyed and we've already marked them before, we need to verify/re-mark.

**Steps:**
1. Run `npx supabase@latest migration list` to see current state
2. For any migration NOT marked as applied (from `20260204080000` through `20260225045013`), mark it:

```bash
npx supabase@latest migration repair --status applied 20260204080000
npx supabase@latest migration repair --status applied 20260204080100
npx supabase@latest migration repair --status applied 20260204080200
npx supabase@latest migration repair --status applied 20260204080300
npx supabase@latest migration repair --status applied 20260204080400
npx supabase@latest migration repair --status applied 20260204151044
npx supabase@latest migration repair --status applied 20260204214907
npx supabase@latest migration repair --status applied 20260204215327
npx supabase@latest migration repair --status applied 20260204215328
npx supabase@latest migration repair --status applied 20260205_01
npx supabase@latest migration repair --status applied 20260206_01
npx supabase@latest migration repair --status applied 20260207_01
npx supabase@latest migration repair --status applied 20260208_01
npx supabase@latest migration repair --status applied 20260209_01
npx supabase@latest migration repair --status applied 20260211142728
npx supabase@latest migration repair --status applied 20260211142801
npx supabase@latest migration repair --status applied 20260211142821
npx supabase@latest migration repair --status applied 20260211163800
npx supabase@latest migration repair --status applied 20260211170000
npx supabase@latest migration repair --status applied 20260211170100
npx supabase@latest migration repair --status applied 20260211170200
npx supabase@latest migration repair --status applied 20260211170300
npx supabase@latest migration repair --status applied 20260211180000
npx supabase@latest migration repair --status applied 20260211180100
npx supabase@latest migration repair --status applied 20260213004141
npx supabase@latest migration repair --status applied 20260213020313
npx supabase@latest migration repair --status applied 20260214213817
npx supabase@latest migration repair --status applied 20260214214606
npx supabase@latest migration repair --status applied 20260215034951
npx supabase@latest migration repair --status applied 20260216000000
npx supabase@latest migration repair --status applied 20260216145434
npx supabase@latest migration repair --status applied 20260216150449
npx supabase@latest migration repair --status applied 20260216150604
npx supabase@latest migration repair --status applied 20260216150709
npx supabase@latest migration repair --status applied 20260216153226
npx supabase@latest migration repair --status applied 20260224000000
npx supabase@latest migration repair --status applied 20260224100000
npx supabase@latest migration repair --status applied 20260224100001
npx supabase@latest migration repair --status applied 20260224200000
npx supabase@latest migration repair --status applied 20260224233440
npx supabase@latest migration repair --status applied 20260224233903
npx supabase@latest migration repair --status applied 20260225000333
npx supabase@latest migration repair --status applied 20260225040700
npx supabase@latest migration repair --status applied 20260225041632
npx supabase@latest migration repair --status applied 20260225045013
```

3. Revert any orphan remote migrations that don't exist locally.

**Verify:** `npx supabase@latest migration list` — all local migrations show "applied", no orphans.

---

## Task 3: Create a New Comprehensive Rebuild Migration

**Why not just push the existing rebuild?** Because `20260225041632_rebuild_turfsheet_schema.sql` is already marked as "applied" in the tracking table. Supabase won't run it again.

**File:** Create `supabase/migrations/20260225060000_rebuild_after_cascade_fix.sql`

**Content:** A new migration that:
1. Creates `turfsheet` schema if not exists
2. Creates ALL tables that should exist (from the rebuild migration's definitions)
3. Uses `CREATE TABLE IF NOT EXISTS` for every table (idempotent)
4. Sets up all RLS policies, grants, indexes
5. Copies maintenance data from `maintenance_log.issues` if source exists and target is empty
6. Sets PostgREST to expose only `turfsheet`
7. Drops stale `maintenance` schema if it exists

**Tables to create (all with IF NOT EXISTS):**
- `staff` (with enum type `staff_role`)
- `job_templates`
- `daily_assignments`
- `staff_skills`
- `daily_board`
- `second_job_board`
- `project_sections`
- `projects`
- `default_schedule`
- `staff_schedules`
- `equipment`
- `calendar_events`
- `pesticide_applications`
- `staff_time_off`
- `maintenance_reporters`
- `maintenance_issues`

**Source:** Copy table definitions from `20260225041632_rebuild_turfsheet_schema.sql` and `20260225045013_consolidate_maintenance_into_turfsheet.sql`, but make everything `IF NOT EXISTS`.

**Include data migration block from `20260225053426_remigrate_legacy_maintenance_data.sql`.**

**Verify after push:**
```bash
cd ~/Documents/AI_Automation/Tools/mcp-servers
npx tsx run.ts supabase:sql '{"project":"turfsheet","sql":"SELECT table_name FROM information_schema.tables WHERE table_schema = '\''turfsheet'\'' ORDER BY table_name"}'
```
Should show all 16 tables.

---

## Task 4: Mark the Data Migration as Applied

Since the new rebuild migration (Task 3) includes the data migration logic, mark `20260225053426` as applied so it doesn't try to run separately:

```bash
npx supabase@latest migration repair --status applied 20260225053426
```

**Verify:** `npx supabase@latest migration list` — all migrations show "applied".

---

## Task 5: Verify Database and Frontend

1. **Check all tables exist:**
```bash
cd ~/Documents/AI_Automation/Tools/mcp-servers
npx tsx run.ts supabase:sql '{"project":"turfsheet","sql":"SELECT table_name FROM information_schema.tables WHERE table_schema = '\''turfsheet'\'' ORDER BY table_name"}'
```

2. **Check maintenance data migrated:**
```bash
npx tsx run.ts supabase:sql '{"project":"turfsheet","sql":"SELECT count(*) FROM turfsheet.maintenance_issues"}'
```
Should show ~57 rows (if `maintenance_log.issues` source exists).

3. **Check staff data:**
```bash
npx tsx run.ts supabase:sql '{"project":"turfsheet","sql":"SELECT count(*) FROM turfsheet.staff"}'
```

4. **Check frontend loads:**
```bash
npx tsx run.ts chrome:console '{"url":"http://localhost:5179"}'
```
Run dev server first if needed: `cd turfsheet-app && npm run dev`

---

## Task 6: Clean Up Stale Files

1. **Delete non-timestamped migration files** that shouldn't be in the migrations folder:
   - `supabase/migrations/add_staff.sql`
   - `supabase/migrations/EQUIPMENT_MIGRATION_TO_RUN.sql`
   - `supabase/migrations/RUN_IN_SUPABASE_SQL_EDITOR.sql`

   These cause confusion and may interfere with `supabase db push`.

2. **Update MCP config** — `~/Documents/AI_Automation/Tools/mcp-servers/config.json` has `"schema": "maintenance"` for turfsheet entry. Change to `"schema": "turfsheet"`.

---

## Task 7: Commit Changes

Commit all changes on `feature/maintenance-integration` branch:
- Fixed first migration (root cause)
- New rebuild migration
- Frontend updates (already done)
- Cleaned up stale files
- Updated MCP config

---

## Risk Notes

- **Shared Supabase instance:** TurfSheet and BanburyMaintenance share `klyzdnocgrvassppripi`. Orphan remote migrations from other projects may still appear. The root cause fix (Task 1) means replays are now SAFE — `CREATE SCHEMA IF NOT EXISTS` won't destroy anything.
- **CLAUDE.md discrepancy:** Project ref should be `klyzdnocgrvassppripi` not `scktzhwtkscabtpkvhne`. Consider updating after this is stable.
