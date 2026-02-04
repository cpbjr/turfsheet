## OVERVIEW 
TurfSheet is a web application for managing golf courses and their staff. It is a work in progress and is not yet ready for production. Am attempting to build this page by page following the examples in the SiteExamples folder.

# Active Tasks

Last Updated: 2026-02-04

## Active Tasks

### 1. Fix Supabase API Key Configuration
**Status:** ✅ Completed (2026-02-04)
**Priority:** High (Blocks database functionality)

**Root Causes Found & Fixed:**
1. ✅ **Incorrect API Key** - Updated `.env.local` with correct `VITE_SUPABASE_ANON_KEY` (new key expires 2072)
2. ✅ **Schema Not Exposed** - Tables in custom `turfsheet` schema, but REST API only exposes `public` schema
   - Solution: Migrated all tables to `public.jobs` and `public.staff`
3. ✅ **Missing RLS Permissions** - Anonymous users lacked table SELECT permissions
   - Solution: Added RLS policies and granted `SELECT` permission to `anon` role

**Migrations Applied:**
- Schema migration (dropped turfsheet, moved tables to public)
- RLS enable policies
- Table-level grants for anon role
- All 8 migrations applied successfully to remote database

**Verification Results:**
- ✅ JobsPage loads without API errors
- ✅ StaffPage loads without API errors
- ✅ Data displays correctly in both pages
- ✅ No Supabase errors in browser console

---

### 2. Fix Font Awesome Integrity Hash Issue
**Status:** Pending
**Priority:** Medium (Dev warning, non-blocking)
**Description:** Font Awesome CSS has integrity hash mismatch.

**Error:**
```
None of the "sha512" hashes in the integrity attribute match the content of the subresource at
"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
```

**Next Steps:**
1. Update Font Awesome CDN integrity hash or remove SRI check
2. Verify latest Font Awesome version and hash
3. Test that icons display correctly

---

## Completed ✅

### Database Setup - Jobs & Staff Tables (Completed 2026-02-04)
- ✅ Created `turfsheet` schema in White Pine Projects database
- ✅ Created `jobs` table with fields: id, title, description, crew_needed, priority, section, created_at, updated_at
- ✅ Created `staff` table with fields: id, role, name, telephone, telegram_id, notes, created_at, updated_at
- ✅ Inserted initial data: "Tree Work" job (crew: 3), "Darryl" staff (Superintendent, 208-949-9264)
- ✅ Connected React frontend to Supabase database
- ✅ Updated JobsPage and StaffPage with Supabase integration
- ⚠️ **Issue Found:** API key configuration incorrect - needs fixing

---

## Archived/On Hold

See [planned.md](file:///home/cpbjr/WhitePineTech/Projects/TurfSheet/.agent/Tasks/planned.md) for upcoming work.

1. Create a site style guide. (Archived)
2. Create a site on whitepine-tech.com for TurfSheet. (On Hold)
3. Move implemented plans from Implemented/ to completed/ as of yesterday. (On Hold)
3.2 Equipment page (On Hold)
