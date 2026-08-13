# TurfSheet Database Setup Plan

## Overview
Create minimal viable database schema in "White Pine Projects" Supabase schema for TurfSheet demo/MVP. Focus on Jobs and Staff tables only, using actual fields from the existing UI components.

## Database Connection
- **Host:** https://klyzdnocgrvassppripi.supabase.co
- **Schema:** `white_pine_projects` (note: PostgreSQL uses lowercase with underscores)
- **Connection:** Via MCP-as-code tools

## Phase 1: Configure MCP Project

**File:** `~/Documents/AI_Automation/Tools/mcp-servers/config.json` (needs to be created)

Create configuration file with TurfSheet/White Pine Projects connection:

```json
{
  "projects": {
    "white-pine-projects": {
      "url": "postgresql://postgres:nNBsJezhY0GaH6om@db.klyzdnocgrvassppripi.supabase.co:5432/postgres",
      "schema": "white_pine_projects"
    }
  }
}
```

**Test Connection:**
```bash
cd ~/Documents/AI_Automation/Tools/mcp-servers
npx tsx run.ts supabase:sql '{"project":"white-pine-projects","sql":"SELECT current_schema(), current_database()"}'
```

## Phase 2: Create Database Schema

### Table 1: `jobs` (Job Templates/Library)

Based on analysis of `turfsheet-app/src/pages/JobsPage.tsx` and `turfsheet-app/src/components/jobs/JobCard.tsx`:

```sql
CREATE TABLE IF NOT EXISTS white_pine_projects.jobs (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    crew_needed INTEGER NOT NULL DEFAULT 1,
    priority TEXT CHECK (priority IN ('Low', 'Normal', 'High', 'Urgent')),
    section TEXT CHECK (section IN ('First Jobs', 'Second Jobs')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE white_pine_projects.jobs IS 'Job templates/library for golf course maintenance tasks';
```

**Initial Data:**
```sql
INSERT INTO white_pine_projects.jobs (title, crew_needed) VALUES
('Tree Work', 3);
```

### Table 2: `staff` (Staff Members/Library)

Based on analysis of `turfsheet-app/src/pages/StaffPage.tsx` and `turfsheet-app/src/components/staff/StaffListItem.tsx`:

```sql
CREATE TABLE IF NOT EXISTS white_pine_projects.staff (
    id SERIAL PRIMARY KEY,
    role TEXT NOT NULL,          -- e.g., "Superintendent", "Crew Member"
    name TEXT NOT NULL,
    telephone TEXT,
    telegram_id TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE white_pine_projects.staff IS 'Staff members for golf course operations';
COMMENT ON COLUMN white_pine_projects.staff.telegram_id IS 'Telegram username or ID for messaging';
```

**Initial Data:**
```sql
INSERT INTO white_pine_projects.staff (role, name, telephone) VALUES
('Superintendent', 'Darryl', '208-949-9264');
```

### ~~Table 3: `staff_schedules`~~ (REMOVED - Out of Scope)

**Note:** Scheduling complexity removed for winter/MVP. Assumptions:
- All staff work Monday-Friday (implied, no special scheduling needed)
- 2 staff members work each weekend day (to be handled in UI/app logic later)
- No need for schedule table at this stage - keep it simple!

## Phase 3: Verify Connection and Schema

### Test Queries
```sql
-- Verify schema exists
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'white_pine_projects';

-- List tables
SELECT table_name FROM information_schema.tables WHERE table_schema = 'white_pine_projects';

-- Test queries
SELECT * FROM white_pine_projects.jobs;
SELECT * FROM white_pine_projects.staff;
```

## Critical Files

### Files Created/Modified
- `~/Documents/AI_Automation/Tools/mcp-servers/config.json` - MCP project configuration (CREATE)

### Files to Potentially Update (Post-Implementation, Future)
- `turfsheet-app/src/pages/JobsPage.tsx` - Connect to jobs table
- `turfsheet-app/src/pages/StaffPage.tsx` - Connect to staff table

### Files NOT Changing (Database Setup Only)
No React/frontend code files will be modified during database setup phase. This is purely schema creation + MCP config.

## Execution Steps

1. **Configure MCP Project**
   - Create or update `config.json` with TurfSheet/White Pine Projects connection
   - Test connection with simple query

2. **Create Tables** (schema already exists)
   - Create `jobs` table with all fields from JobCard/JobForm
   - Create `staff` table with all fields from StaffListItem

3. **Insert Initial Data**
   - Add single job: "Tree Work" with crew of 3
   - Add single staff: "Superintendent/Darryl/208-949-9264"

4. **Verify**
   - Query all tables to confirm data exists
   - Confirm schema matches UI component expectations

## Confirmed Details

✅ **MCP Configuration:** Password provided, will create config.json with connection string
✅ **Schema Exists:** `white_pine_projects` schema already exists, just add tables
✅ **Initial Data:** Single job (Tree Work), single staff (Darryl)
✅ **Schedules:** NO schedule table - everyone works M-F, keep it simple for winter/demo

## Post-Setup Next Steps (Future)

After database is created:
1. Update React components to fetch from Supabase instead of hardcoded data
2. Add Supabase client configuration to frontend
3. Create API endpoints or direct Supabase queries
4. Add forms to create/edit jobs and staff
5. Implement schedule editing and persistence

## Summary

This is a **super simple** database setup:
- ✅ **2 tables only:** `jobs` and `staff`
- ✅ **No scheduling complexity:** Everyone works M-F (implicit)
- ✅ **No auth/RLS:** Demo/MVP only
- ✅ **Minimal initial data:** 1 job (Tree Work), 1 staff (Darryl)
- ✅ **Schema exists:** Just add tables to existing `white_pine_projects` schema
- ✅ **MCP config:** Create config.json to connect via MCP-as-code tools
