## INSTRUCTIONS
1. Once work has been completed on a task, move its corresponding implementation plan from Implementation/ to completed/ along with any associated code and a description of the work done.

# Active Tasks

Last Updated: 2026-02-24

## Active Tasks

### BanburyMaintenance Integration — Phase 1: Database Foundation
**Priority:** High
**Status:** In Progress
**Date Added:** 2026-02-24

**Goal:** Maintenance issue tables exist in TurfSheet's Supabase, ready for Tom to write to.

**Completed:**
- [x] Migration SQL: `maintenance` schema, `issues` table, `reporters` table, indexes, RLS policies
- [x] Storage bucket: `maintenance-photos` (public, 20MB limit)
- [x] TypeScript types: `MaintenanceIssue`, `MaintenanceReporter`, `IssueStatus`, `IssuePriority`
- [x] Supabase client: `maintenanceSupabase` in `lib/supabase.ts`

**Remaining (manual steps):**
- [ ] Run migration: `npx supabase@latest db push`
- [ ] Expose `maintenance` schema in Supabase Dashboard → Settings → API → Exposed Schemas
- [ ] Migrate ~50 existing issues from legacy project (`klyzdnocgrvassppripi`)

**Key Files:**
- `supabase/migrations/20260224200000_create_maintenance_schema.sql`
- `turfsheet-app/src/types/index.ts` (new types added at bottom)
- `turfsheet-app/src/lib/supabase.ts` (new `maintenanceSupabase` client)

**Implementation Plan:** `.agent/Tasks/Implementation/implementation-maintenance-integration.md`

---

### Fix: Dashboard Announcements — No way to add/edit announcements
**Priority:** High (core dashboard feature gap)
**Status:** Not started
**Date Added:** 2026-02-24

**Problem:** The `daily_board` table and `announcements` column exist in the database, and the `DailyBoard` TypeScript type is defined, but the RightPanel only shows a hardcoded "No announcements at this time" message. There is no UI to create, edit, or delete announcements.

**Scope:**
- Add an editable announcements section to the dashboard (RightPanel or dedicated modal)
- Fetch announcements from `turfsheet.daily_board` for the current date
- Allow adding/editing announcement text
- Auto-create a `daily_board` row for today if one doesn't exist
- Display saved announcements instead of the static placeholder

**Key Files:**
- `src/components/layout/RightPanel.tsx` — current placeholder display
- `src/types/index.ts` — `DailyBoard` interface (already defined)
- DB table: `turfsheet.daily_board` (migration exists, RLS policies set)


---

## Recently Completed ✅

See `completed/2026-02/` for completed tasks including:
- ✅ Demo Day Fixes — UI improvements, working staff filtering, header weather widget (2026-02-16)
- ✅ Equipment Page Fixes — Card expansion, batch CSV upload, status color fix (2026-02-16)
- ✅ Demo Preparation Work — Equipment page, Settings enhancements, job section filtering (2026-02-16)
- ✅ Projects Page — Inline-editable project board with sections and detail modal (2026-02-11)
- ✅ Fix Font Awesome Integrity Hash Issue — Updated to v6.7.2 with correct SHA-512 hash (2026-02-14)
- ✅ Whiteboard Frontend Realignment — All 7 components updated for new schema (2026-02-11)
- ✅ Whiteboard Backend Realignment — Schema restructured for real workflow (2026-02-11)
- ✅ Whiteboard Dashboard Redesign — Two-panel layout (2026-02-11)
- ✅ Fix Staff & Jobs Creation — Sequence permissions (2026-02-11)
- ✅ Make Site Actionable: Add Staff & Jobs (2026-02-05)
- ✅ Staff Whiteboard Dashboard (2026-02-05)
- ✅ Fix Supabase API Key Configuration (2026-02-04)
- ✅ Database Setup - Jobs & Staff Tables (2026-02-04)

---

## Archived/On Hold

See [planned.md](file:///home/cpbjr/WhitePineTech/Projects/TurfSheet/.agent/Tasks/planned.md) for upcoming work.

1. Create a site style guide. (Completed)
2. Create a site on whitepine-tech.com for TurfSheet. (Completed)
3. Move implemented plans from Implemented/ to completed/ as of yesterday. (On Hold)
3.2 Equipment page (On Hold)
