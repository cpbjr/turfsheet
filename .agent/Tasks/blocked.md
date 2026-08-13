# Blocked Tasks

## ⏸️ PAUSED: Blue/Orange Schedules + Memory System (2026-07-28)

**Status:** Paused indefinitely. May or may not be picked back up.

### ⚠️ Read this before running `git add .` or `npx supabase db push`

Six migration files for an unfinished **memory / pgvector system** are sitting **untracked** in
`supabase/migrations/`. They arrived with the `feature/blue-orange-schedules` work and follow
along onto any branch created from it:

```
20260321120000_add_unique_source_hash.sql
20260322010000_enable_pgvector.sql
20260322010100_create_memory_documents.sql
20260322010200_create_memory_chunks.sql
20260322010300_create_match_memory_chunks_rpc.sql
20260322010400_create_memory_events.sql
```

**None of them have ever been applied to any database.** They are drafts for paused work.

- **Do NOT `git add .`** — they will be swept into an unrelated commit and land on `main` at merge.
  Stage explicit paths instead.
- **Do NOT `npx supabase db push`** — unsafe on this project for a separate reason too; see
  `Completed/2026-07/1-chemicals-page-clean-up.md` for the full explanation of the migration
  history situation.
- The matching plan is `Implementation/implementation-blue-orange-schedules.md` (also untracked).

**If the work resumes:** review each migration against current schema before applying — they were
written 2026-03 and the schema has moved since.

**If the work is abandoned:** delete the six files and the implementation plan so they stop
shadowing every future branch.

---

## Task: Complete Supabase Schema Integration with turfsheet Schema

**Status:** ✅ RESOLVED (2026-02-04)
**Priority:** High
**Solution:** Schema configuration in Supabase client (matching BanburyMaintenance approach)

---

## Problem Summary (RESOLVED)

The TurfSheet application needs to query tables from the `turfsheet` custom schema. The initial approach used schema-qualified table names (`.from('turfsheet.jobs')`), which doesn't work with the Supabase JS SDK.

### Solution Implemented

The correct approach is to configure the schema once in the Supabase client, then use simple table names in queries. This is how BanburyMaintenance solved the same problem.

**Files Fixed:**
1. ✅ [src/lib/supabase.ts](turfsheet-app/src/lib/supabase.ts) - Added `db: { schema: 'turfsheet' }` to client config
2. ✅ [turfsheet-app/src/pages/JobsPage.tsx](turfsheet-app/src/pages/JobsPage.tsx) (line 18) - Changed `.from('turfsheet.jobs')` → `.from('jobs')`
3. ✅ [turfsheet-app/src/pages/StaffPage.tsx](turfsheet-app/src/pages/StaffPage.tsx) (line 22) - Changed `.from('turfsheet.staff')` → `.from('staff')`

### Verification

✅ **Jobs page loads successfully** - No database errors, data visible
✅ **Staff page loads successfully** - No database errors, data visible
✅ **Browser console clean** - Only harmless Font Awesome CDN warning
✅ **Matches BanburyMaintenance pattern** - Uses same schema configuration approach

---

## Solutions to Implement (Next Session)

### Option 1: Public Schema Views (Recommended - Simplest)
**Approach:** Create views in the public schema that reference turfsheet tables

```sql
-- Migration: Create public views for turfsheet tables
CREATE VIEW public.jobs AS SELECT * FROM turfsheet.jobs;
CREATE VIEW public.staff AS SELECT * FROM turfsheet.staff;

-- Enable RLS on views
ALTER VIEW public.jobs OWNER TO authenticated;
ALTER VIEW public.staff OWNER TO authenticated;
```

**Advantages:**
- Simplest implementation
- No SDK changes needed - revert `.from('turfsheet.jobs')` back to `.from('jobs')`
- Maintains data separation in turfsheet schema
- Standard SQL approach

**Files to Update:**
- Revert JobsPage.tsx line 18 back to `.from('jobs')`
- Revert StaffPage.tsx line 22 back to `.from('staff')`
- Create new migration to add public views

### Option 2: PostgreSQL Functions (More Complex)
**Approach:** Create stored procedures in turfsheet schema, call via `.rpc()`

```typescript
const { data } = await supabase.rpc('get_jobs');
const { data } = await supabase.rpc('get_staff');
```

**Advantages:**
- Adds query logic layer
- Better for complex filtering/processing

**Disadvantages:**
- Requires more code changes
- Less flexible than direct table access

### Option 3: Move Tables Back to Public Schema (Not Recommended)
**Approach:** Accept public schema as standard, abandon custom schema separation

**Disadvantages:**
- Defeats the purpose of data organization
- Not scalable for multi-tenant or complex schemas
- Goes against original design decision

---

## Recommendation

**Use Option 1 (Public Schema Views)** - it's the industry standard solution for this exact scenario and requires minimal code changes.

### Implementation Checklist for Next Session

1. Create migration: `20260205_create_turfsheet_public_views.sql`
   - `CREATE VIEW public.jobs AS SELECT * FROM turfsheet.jobs;`
   - `CREATE VIEW public.staff AS SELECT * FROM turfsheet.staff;`
   - Apply via `npx supabase@latest db push`

2. Revert frontend code:
   - JobsPage.tsx line 18: `.from('turfsheet.jobs')` → `.from('jobs')`
   - StaffPage.tsx line 22: `.from('turfsheet.staff')` → `.from('staff')`

3. Test:
   - Verify both pages load without errors
   - Verify data displays correctly
   - Check browser console for any errors

---

## Database Schema Status

**Current State:**
- ✅ `turfsheet` schema exists and is exposed to REST API
- ✅ Tables exist: `turfsheet.jobs`, `turfsheet.staff`
- ✅ Data intact: 1 job (Tree Work), 1 staff member (Darryl)
- ✅ RLS policies enabled and grants applied
- ❌ Public views NOT YET created (needed for JS SDK compatibility)

**Total Migrations Applied:** 12
- Schema creation and table moves
- RLS policies
- Grants for anon role
- Last migration: `20260204151044_move_jobs_staff_to_turfsheet.sql`
