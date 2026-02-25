# TurfSheet Supabase Database Schema Report

**Project:** TurfSheet (Golf Course Maintenance Task Management)
**Supabase Project Ref:** scktzhwtkscabtpkvhne
**MCP Project Name:** turfsheet
**Generated:** 2026-02-24

## Database Structure Overview

TurfSheet uses **2 main schemas**:

### 1. **turfsheet** Schema (Primary)
Main application tables for golf course operations.

### 2. **maintenance** Schema (New - Integration)
Maintenance issue tracking integrated from BanburyMaintenance legacy system.

---

## TURFSHEET SCHEMA Tables

### Core Tables

#### `turfsheet.staff`
Staff members for golf course operations.

**Columns:**
- `id` (SERIAL PRIMARY KEY)
- `role` (TEXT NOT NULL) - Enum: 'Superintendant', 'Assistant Superintendant', 'Mechanic', 'Senior Staff Member', 'Staff Member', 'Temporary Staff Member'
- `name` (TEXT NOT NULL)
- `telephone` (TEXT)
- `telegram_id` (TEXT) - Links to Telegram for messaging
- `notes` (TEXT)
- `created_at` (TIMESTAMPTZ DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ DEFAULT NOW())

**RLS:** Enabled - Full access for anon & authenticated users
**Indexes:** id (PK)

---

#### `turfsheet.jobs`
Job templates/library for golf course maintenance tasks.

**Columns:**
- `id` (SERIAL PRIMARY KEY)
- `title` (TEXT NOT NULL)
- `description` (TEXT)
- `crew_needed` (INTEGER DEFAULT 1)
- `priority` (TEXT) - Enum: 'Low', 'Normal', 'High', 'Urgent'
- `section` (TEXT) - Enum: 'First Jobs', 'Second Jobs'
- `created_at` (TIMESTAMPTZ DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ DEFAULT NOW())

**RLS:** Enabled - Full access for anon & authenticated users
**Indexes:** id (PK)

---

#### `turfsheet.daily_assignments`
Daily task assignments to staff members.

**Columns:**
- `id` (SERIAL PRIMARY KEY)
- `staff_id` (INTEGER NOT NULL) → FK turfsheet.staff(id) ON DELETE CASCADE
- `job_id` (INTEGER NOT NULL) → FK turfsheet.jobs(id) ON DELETE RESTRICT
- `assignment_date` (DATE NOT NULL DEFAULT CURRENT_DATE)
- `notes` (TEXT)
- `completed_at` (TIMESTAMPTZ)
- `created_at` (TIMESTAMPTZ DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ DEFAULT NOW())

**Constraints:**
- UNIQUE(staff_id, assignment_date) - One assignment per staff per day

**RLS:** Enabled - Full access for anon & authenticated users
**Indexes:**
- idx_daily_assignments_date
- idx_daily_assignments_staff_id
- idx_daily_assignments_staff_date

---

#### `turfsheet.staff_schedules`
Weekly/recurring schedules for staff availability.

**Columns:** (from migration file)
- `id` (SERIAL PRIMARY KEY)
- `staff_id` (INTEGER NOT NULL) → FK turfsheet.staff(id)
- `monday_start`, `monday_end` (TIME)
- `tuesday_start`, `tuesday_end` (TIME)
- ... (Wed, Thu, Fri, Sat, Sun similar)
- `created_at`, `updated_at` (TIMESTAMPTZ)

---

#### `turfsheet.staff_skills`
Skills/certifications/qualifications for staff members.

**Columns:** (from migration file)
- `id` (SERIAL PRIMARY KEY)
- `staff_id` (INTEGER NOT NULL) → FK turfsheet.staff(id)
- `skill_name` (TEXT NOT NULL)
- `proficiency_level` (TEXT) - likely 'Beginner', 'Intermediate', 'Advanced'
- `created_at` (TIMESTAMPTZ)

---

#### `turfsheet.staff_time_off`
Time off requests/vacation tracking.

**Columns:** (from migration file)
- `id` (SERIAL PRIMARY KEY)
- `staff_id` (INTEGER NOT NULL) → FK turfsheet.staff(id)
- `start_date` (DATE NOT NULL)
- `end_date` (DATE NOT NULL)
- `reason` (TEXT)
- `status` (TEXT) - 'Pending', 'Approved', 'Rejected'
- `created_at`, `updated_at` (TIMESTAMPTZ)

---

#### `turfsheet.projects`
Long-term projects (e.g., course renovations, seasonal projects).

**Columns:** (from migration file)
- `id` (SERIAL PRIMARY KEY)
- `title` (TEXT NOT NULL)
- `description` (TEXT)
- `status` (TEXT) - 'Planning', 'Active', 'Completed'
- `start_date` (DATE)
- `end_date` (DATE)
- `created_at`, `updated_at` (TIMESTAMPTZ)

---

#### `turfsheet.project_sections`
Breakdown of projects into sections/phases.

**Columns:** (from migration file)
- `id` (SERIAL PRIMARY KEY)
- `project_id` (INTEGER NOT NULL) → FK turfsheet.projects(id)
- `section_name` (TEXT NOT NULL)
- `description` (TEXT)
- `status` (TEXT) - 'Pending', 'In Progress', 'Completed'
- `created_at`, `updated_at` (TIMESTAMPTZ)

---

#### `turfsheet.calendar_events`
Calendar events (scheduled maintenance, staff events, etc.).

**Columns:** (from migration file)
- `id` (SERIAL PRIMARY KEY)
- `title` (TEXT NOT NULL)
- `description` (TEXT)
- `event_type` (TEXT) - 'maintenance', 'meeting', 'event', 'holiday'
- `start_time` (TIMESTAMPTZ NOT NULL)
- `end_time` (TIMESTAMPTZ)
- `location` (TEXT)
- `created_at`, `updated_at` (TIMESTAMPTZ)

---

#### `turfsheet.pesticide_applications`
Chemical/pesticide application tracking for agronomic compliance.

**Columns:** (from migration file)
- `id` (SERIAL PRIMARY KEY)
- `pesticide_name` (TEXT NOT NULL)
- `application_date` (DATE NOT NULL)
- `area_treated` (TEXT) - e.g., "Greens", "Fairways", "Roughs"
- `staff_applied_by` (TEXT)
- `weather_conditions` (TEXT)
- `notes` (TEXT)
- `created_at` (TIMESTAMPTZ)

---

#### `turfsheet.equipment`
Golf course maintenance equipment inventory.

**Columns:** (from migration file)
- `id` (SERIAL PRIMARY KEY)
- `equipment_name` (TEXT NOT NULL)
- `equipment_type` (TEXT) - 'Mower', 'Spreader', 'Sprayer', etc.
- `serial_number` (TEXT)
- `purchase_date` (DATE)
- `last_service_date` (DATE)
- `status` (TEXT) - 'Active', 'Maintenance', 'Retired'
- `notes` (TEXT)
- `created_at`, `updated_at` (TIMESTAMPTZ)

---

#### `turfsheet.daily_board` & `turfsheet.second_job_board`
Task board interfaces (visual job assignment tracking).

**Columns:** (from migration file)
- `id` (SERIAL PRIMARY KEY)
- Similar to daily_assignments but used for UI board presentation
- `position` (INTEGER) - for drag-and-drop ordering
- `status` (TEXT) - 'Unassigned', 'Assigned', 'In Progress', 'Completed'

---

#### `turfsheet.default_schedule`
Default weekly schedule template for new staff.

**Columns:** (from migration file)
- `id` (SERIAL PRIMARY KEY)
- `day_of_week` (TEXT) - 'Monday', 'Tuesday', etc.
- `start_time` (TIME)
- `end_time` (TIME)

---

## MAINTENANCE SCHEMA Tables

### Overview
Maintenance issue tracking integrated from BanburyMaintenance legacy system. Old Tom Morris (AI) writes issues here via OpenClaw function-calling interface.

---

#### `maintenance.reporters`
Telegram users who report maintenance issues.

**Columns:**
- `telegram_id` (TEXT PRIMARY KEY) - Telegram user ID
- `name` (TEXT NOT NULL) - Staff member's name
- `role` (TEXT DEFAULT 'Staff') - 'Staff', 'Supervisor', 'Admin'
- `is_active` (BOOLEAN DEFAULT true) - Whether user is still active
- `message_count` (INTEGER DEFAULT 0) - Running count of messages sent through Tom
- `last_message_date` (TIMESTAMPTZ) - Last activity timestamp
- `created_at` (TIMESTAMPTZ DEFAULT now())
- `updated_at` (TIMESTAMPTZ DEFAULT now())

**RLS:** Enabled - Full access for anon & authenticated users
**Indexes:** telegram_id (PK)

---

#### `maintenance.issues`
Maintenance issues reported by field staff via Old Tom Morris.

**Columns:**
- `id` (SERIAL PRIMARY KEY) - Internal issue ID
- `issue_number` (SERIAL) - Human-friendly reference (#1, #46, etc.)
- `description` (TEXT NOT NULL) - Issue summary
- `location_area` (TEXT) - High-level area: "Hole 1-18", "Clubhouse", "Practice Area", etc.
- `location_detail` (TEXT) - Specific feature: "Green", "Fairway", "Bunker", "Tee Box", etc.
- `location_position` (TEXT) - Optional position: "Front", "Back", "Left", "Right", "Center"
- `status` (TEXT NOT NULL DEFAULT 'Open') - Enum: 'Open', 'In Progress', 'Completed'
- `priority` (TEXT NOT NULL DEFAULT 'Medium') - Enum: 'Low', 'Medium', 'High'
- `reporter_name` (TEXT) - Name of person reporting issue
- `reporter_telegram_id` (TEXT) → FK maintenance.reporters(telegram_id)
- `photo_url` (TEXT) - URL to photo in maintenance-photos storage bucket
- `notes` (TEXT) - Additional details/observations
- `assigned_to` (TEXT) - Staff member assigned to resolve
- `created_at` (TIMESTAMPTZ DEFAULT now()) - When reported
- `updated_at` (TIMESTAMPTZ DEFAULT now()) - Last change
- `completed_at` (TIMESTAMPTZ) - When issue was resolved (NULL if open)

**RLS:** Enabled - Full access for anon & authenticated users
**Indexes:**
- idx_issues_status
- idx_issues_priority
- idx_issues_created_at DESC
- idx_issues_issue_number
- idx_issues_reporter

---

## Storage Buckets

### `maintenance-photos`
Public bucket for issue photos uploaded by Tom from Telegram.

**Configuration:**
- `public` = true (anyone can read)
- `file_size_limit` = 20MB
- **Policies:**
  - Public read: Everyone can view
  - Anon/Authenticated upload: Can submit photos
  - Service role: Full management access

---

## Data Integration

### Migration Status
Latest migrations applied:
- ✅ 2026-02-24: `create_maintenance_schema.sql` - Created maintenance schema with reporters/issues
- ✅ 2026-02-24: `migrate_legacy_maintenance_data.sql` - Migrated ~50 historical issues from maintenance_log schema
- ✅ 2026-02-25: `rebuild_turfsheet_schema.sql` - Consolidated turfsheet tables

### Legacy Data Source
- **Source Database:** BanburyMaintenance Supabase project (maintenance_log schema)
- **Tables Migrated:**
  - `maintenance_log.authorized_users` → `maintenance.reporters`
  - `maintenance_log.maintenance_issues` → `maintenance.issues`
- **Data Quality:** ~6 issues with identified reporters, ~14 without reporter links, 0 photos attached

---

## Key Design Decisions

1. **Separate Schemas:** maintenance & turfsheet allow independent schema evolution while sharing database instance
2. **RLS for Anon Access:** All tables allow anon user queries (suitable for public Telegram bot)
3. **Issue Numbering:** Serial issue_number field for human-friendly reference (#24, not just id=124)
4. **Location Hierarchy:** area (hole) → detail (feature) → position (relative location)
5. **Photo Storage:** Supabase Storage bucket instead of database BLOB (better for large files)
6. **Telegram Integration:** reporter_telegram_id links maintenance issues to Telegram users for Tom interaction

---

## Access Control

**All tables** have RLS policies allowing:
- ✅ Anonymous users: SELECT, INSERT, UPDATE, DELETE
- ✅ Authenticated users: SELECT, INSERT, UPDATE, DELETE
- ✅ Service role: Full access for backend operations

**Rationale:** TurfSheet uses anonymous Supabase API access from frontend and Old Tom bot (no user authentication). RLS policies enforce data isolation via row-level filters if needed.

---

## Common Queries

### Get all open issues
```sql
SELECT * FROM maintenance.issues 
WHERE status = 'Open' 
ORDER BY created_at DESC;
```

### Get issues reported by a user
```sql
SELECT i.* FROM maintenance.issues i
LEFT JOIN maintenance.reporters r ON i.reporter_telegram_id = r.telegram_id
WHERE r.telegram_id = '<telegram_id>'
ORDER BY i.created_at DESC;
```

### Get staff schedules for today
```sql
SELECT * FROM turfsheet.daily_assignments
WHERE assignment_date = CURRENT_DATE
ORDER BY staff_id;
```

### Get pending time-off requests
```sql
SELECT * FROM turfsheet.staff_time_off
WHERE status = 'Pending'
ORDER BY start_date ASC;
```

---

## Notes

- No public schema tables in current use (staff/jobs moved to turfsheet)
- Storage bucket policies automatically created during migration
- All timestamps use TIMESTAMPTZ for timezone awareness
- ON DELETE CASCADE for dependent records (assignments with deleted staff)
- ON DELETE RESTRICT for job templates (prevent deletion if assigned)

