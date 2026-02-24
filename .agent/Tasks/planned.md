# Planned Tasks

## Task 1 - Settings Page
- [ ] Create Settings page/route
- [ ] Add "Workday Hours" configuration section
  - Default start time (currently hardcoded to 7:30 AM)
  - Default end time (currently hardcoded to 2:30 PM)
- [ ] Link default workday hours to default_schedule table
- [ ] Add "Update Default Schedule" feature to bulk-update the global default
- [ ] Add sidebar navigation item for Settings (gear icon)

**Note:** Default schedule system is implemented (database, types, UI). Settings page will allow users to modify the global default workday hours instead of hardcoding 7:30a-2:30p.

## Task 2 - Staff & Scheduling System
- [x] ~~Implement Staff list management~~ (DONE - StaffPage exists)
- [x] ~~Create schedule view for individuals~~ (DONE - ScheduleForm with Copy from Default)
- [ ] Define rotation logic (Blue/Orange 19-day cycle)
- [ ] Implement rotation schedule UI

## Task 3 - Communication Hub
- [ ] Implement team messaging
- [ ] Add task-specific comments

## Task 4 - Equipment Management
- [ ] Integration with Toro myTurf (Phase 2+)

## Task 5 - DB Refinement
- [ ] Jobs will need to be refined so fields match which type of jobs. Mowing jobs will need specialized fields: direction, HOC, cleanup, etc.

## Task 6 - Staff Time-Off Management
- [ ] Create TimeOffForm component (staff dropdown, date range, reason, notes)
- [ ] Add "Request Time Off" button to Calendar page
- [ ] Display time-off entries on calendar as gray events
- [ ] Add time-off management UI (approve/deny if needed)
- **Note:** Database table `turfsheet.staff_time_off` already exists (created 2026-02-24). UI implementation deferred.

## Task 7 - Irrigation Management
- [ ] Design irrigation logging features (zones, probe readings, watering cycles)
- [ ] Create database tables for irrigation data
- [ ] Build irrigation page UI (replace current placeholder)
- **Note:** Placeholder page exists at `/irrigation`. Full implementation planned for future phase.
