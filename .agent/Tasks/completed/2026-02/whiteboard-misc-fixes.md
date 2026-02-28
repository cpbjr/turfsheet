# Whiteboard Misc Fixes + Announcements ✅

**Completed**: 2026-02-27

## What Was Done
Fixed multiple UX issues on the whiteboard page and added the missing announcements CRUD feature to the right panel. Staff who are off or not scheduled are now properly hidden or marked on the whiteboard.

## Key Changes
- **Announcements CRUD** — RightPanel now fetches/creates/edits announcements from `daily_board` table with inline editing UI
- **Manage Schedule modal** — New ManageScheduleModal with toggle switches to mark staff as off (inserts/removes `staff_time_off` records)
- **Off staff display** — Staff marked off show red "OFF" badge spanning both job columns; unscheduled staff are hidden entirely
- **Cross-component refresh** — ManageScheduleModal dispatches `schedule-changed` custom DOM event; whiteboard listens via useRef to avoid stale closures
- **UTC date bug fix** — `toISOString()` was producing UTC dates (wrong after 6 PM Mountain); switched to local date formatting
- **Second job priority** — Changed from cycling button to free-text input (superintendent types any letter)
- **Header alignment** — Both panel headers now use explicit `h-10` for consistent height
- **3-column layout** — Whiteboard grid changed to `120px_1fr_1fr` with dedicated "Second Jobs" column showing grabbed jobs per staff
- **Sidebar reorder** — New icons and order per user preference (Equipment with tractor icon, Chemicals, Irrigation, Maintenance)
- **Coming Soon pages** — Maps, Docs, Learning placeholder pages

## Notes
- The UTC date bug was the root cause of multiple "not working" reports — `new Date().toISOString().split('T')[0]` returns tomorrow after 6 PM MT
- ManageScheduleModal lives under `layout/` since it's opened from RightPanel (sibling to whiteboard)
