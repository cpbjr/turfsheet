# Implementation Plan: Projects Page

**Branch:** `feature/projects-page`
**Date:** 2026-02-11

## Context

Add a Projects page to TurfSheet for tracking planned maintenance projects (e.g., Bunker Renovation, Irrigation Upgrade) with time, cost, and staffing estimators. Alphabetical sorting with letter-group section headers.

---

## Steps

### Step 1: Database Migration
**Create:** `supabase/migrations/20260211_01_create_projects_table.sql`
- `turfsheet.projects` table with: title, description, status, priority, section, estimated_start_date, estimated_end_date, estimated_hours, estimated_cost, actual_cost, estimated_crew_size, required_roles, notes
- Indexes on title/status/priority
- RLS permissive policy + grants for anon/authenticated (including sequence)
- **Verify:** `npx supabase@latest db push`

### Step 2: TypeScript Types
**Modify:** `turfsheet-app/src/types/index.ts`
- Add `ProjectStatus` type and `Project` interface

### Step 3: Frontend Components
**Create:**
- `src/components/projects/ProjectCard.tsx` — Card with green header, status/priority badges, time/cost/staffing summary
- `src/components/projects/ProjectForm.tsx` — Modal form with sections: basic info, time estimates, cost, staffing, notes
- `src/pages/ProjectsPage.tsx` — List page with search, status filters, alphabetical letter-group headers, grid of ProjectCards

### Step 4: Routing & Navigation
**Modify:** `turfsheet-app/src/App.tsx` — Add `/projects` route
**Modify:** `turfsheet-app/src/components/layout/Sidebar.tsx` — Add FolderKanban icon nav item after Jobs

---

## Files

| Action | File |
|--------|------|
| CREATE | `supabase/migrations/20260211_01_create_projects_table.sql` |
| MODIFY | `turfsheet-app/src/types/index.ts` |
| CREATE | `turfsheet-app/src/components/projects/ProjectCard.tsx` |
| CREATE | `turfsheet-app/src/components/projects/ProjectForm.tsx` |
| CREATE | `turfsheet-app/src/pages/ProjectsPage.tsx` |
| MODIFY | `turfsheet-app/src/App.tsx` |
| MODIFY | `turfsheet-app/src/components/layout/Sidebar.tsx` |

---

## Verification
1. Migration applies cleanly (`npx supabase@latest db push`)
2. MCP query confirms table schema
3. `npm run dev` builds without errors
4. Navigate to `/projects` — empty state renders
5. "Add Project" form submits successfully
6. Cards appear with alphabetical grouping
7. Search and status filters work
8. Chrome console clean
