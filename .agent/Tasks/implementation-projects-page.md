# Implementation Plan: Projects Page (Revised)

**Branch:** `feature/projects-page`
**Date:** 2026-02-11 (revised after whiteboard photo review)

## Context

The real-world "Projects" whiteboard is a **prioritized task backlog** — a scannable list of items the superintendent tracks, each with a priority letter (A-Z) and a short description, organized into sections (Projects, Irrigation, etc.). This is NOT a project portfolio with detailed budgets.

**Design: Hybrid approach**
- Primary view mimics the whiteboard: priority letter + description, grouped by section
- Each item can optionally expand/link to a detail view with time/cost/staffing estimators
- Sections are predefined but the super can add new ones

---

## Database

### Table: `turfsheet.project_sections`
Predefined sections the super can add to.

```sql
CREATE TABLE IF NOT EXISTS turfsheet.project_sections (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed with the two sections visible on the whiteboard
INSERT INTO turfsheet.project_sections (name, sort_order) VALUES
  ('Projects', 1),
  ('Irrigation', 2);
```

### Table: `turfsheet.projects`
Each item on the board — priority letter + description + optional detail fields.

```sql
CREATE TABLE IF NOT EXISTS turfsheet.projects (
  id SERIAL PRIMARY KEY,
  section_id INTEGER NOT NULL REFERENCES turfsheet.project_sections(id),
  title TEXT NOT NULL,
  priority TEXT,                          -- Single letter A-Z (matches whiteboard)
  description TEXT,                       -- Optional longer description
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'on_hold')),

  -- Optional estimators (hybrid: detail view)
  estimated_start_date DATE,
  estimated_end_date DATE,
  estimated_hours NUMERIC(8,1),
  estimated_cost NUMERIC(12,2),
  actual_cost NUMERIC(12,2),
  estimated_crew_size INTEGER,
  required_roles TEXT,
  notes TEXT,

  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

Plus: indexes, RLS permissive policy, grants for anon/authenticated (including sequences for both tables).

---

## Frontend

### Primary View (matches whiteboard)
- Page divided into **section columns/blocks** (Projects, Irrigation, ...)
- Each section shows its items as a **compact list**: colored priority letter badge + title
- "Add Item" button per section, "Add Section" button at top
- Items sorted by priority letter (A first), then sort_order

### Detail Panel / Expand
- Clicking an item expands it inline or opens a side panel
- Shows the optional estimator fields (time, cost, staffing)
- Edit/delete controls

### Components

| File | Purpose |
|------|---------|
| `src/pages/ProjectsPage.tsx` | Main page with section blocks, search, status filter |
| `src/components/projects/ProjectSection.tsx` | One section block with header + item list |
| `src/components/projects/ProjectListItem.tsx` | Single row: priority letter badge + title + expand toggle |
| `src/components/projects/ProjectForm.tsx` | Modal form for add/edit (basic fields + optional estimators) |
| `src/components/projects/ProjectDetail.tsx` | Expanded detail view with estimator fields |
| `src/components/projects/SectionForm.tsx` | Small modal to add a new section |

### Routing & Navigation
- Add `/projects` route in `App.tsx`
- Add `FolderKanban` icon to Sidebar after Jobs

---

## Files

| Action | File |
|--------|------|
| CREATE | `supabase/migrations/20260211_01_create_projects_table.sql` |
| MODIFY | `turfsheet-app/src/types/index.ts` |
| CREATE | `turfsheet-app/src/pages/ProjectsPage.tsx` |
| CREATE | `turfsheet-app/src/components/projects/ProjectSection.tsx` |
| CREATE | `turfsheet-app/src/components/projects/ProjectListItem.tsx` |
| CREATE | `turfsheet-app/src/components/projects/ProjectForm.tsx` |
| CREATE | `turfsheet-app/src/components/projects/ProjectDetail.tsx` |
| CREATE | `turfsheet-app/src/components/projects/SectionForm.tsx` |
| MODIFY | `turfsheet-app/src/App.tsx` |
| MODIFY | `turfsheet-app/src/components/layout/Sidebar.tsx` |

---

## Verification
1. Migration applies cleanly (`npx supabase@latest db push`)
2. MCP query confirms both tables + seed data
3. `npm run dev` builds without errors
4. Navigate to `/projects` — sees "Projects" and "Irrigation" sections
5. Add an item with priority letter — appears in correct section
6. Click item to expand — detail panel shows estimator fields
7. Add a new section — appears on page
8. Chrome console clean
