# Implementation Plan: Employees Page and Crew Scheduling

Create a central Employees management page and a detailed weekly scheduling popup for individual staff members.

## User Review Required

> [!IMPORTANT]
> **Data Structure Inference**
> Based on `IMG_4368.jpg`, employees have a weekly schedule with "On/Off" toggles and Start/End times. I will implement a mock state for this to allow UI demonstration.

## Proposed Changes

### [Component] UI Elements [NEW]

#### [NEW] [EmployeeCard.tsx](file:///home/cpbjr/WhitePineTech/Projects/TurfSheet/turfsheet-app/src/components/employees/EmployeeCard.tsx)
A reusable card for the employee directory, following the standardized card aesthetic.

#### [NEW] [ScheduleForm.tsx](file:///home/cpbjr/WhitePineTech/Projects/TurfSheet/turfsheet-app/src/components/employees/ScheduleForm.tsx)
The detailed scheduling form shown in `IMG_4368.jpg` for managing a staff member's week.

### [Component] Pages [NEW]

#### [NEW] [EmployeesPage.tsx](file:///home/cpbjr/WhitePineTech/Projects/TurfSheet/turfsheet-app/src/pages/EmployeesPage.tsx)
The main employee directory/library page.

### [Component] Routing Update

#### [MODIFY] [App.tsx](file:///home/cpbjr/WhitePineTech/Projects/TurfSheet/turfsheet-app/src/App.tsx)
Add `/staff` route (mapping to the "Staff" sidebar icon).

#### [MODIFY] [Sidebar.tsx](file:///home/cpbjr/WhitePineTech/Projects/TurfSheet/turfsheet-app/src/components/layout/Sidebar.tsx)
Ensure the "Staff" link (users icon) points to `/staff`.

## Verification Plan

### Automated Tests
- Navigate to `/staff` and verify the employee grid loads.
- Open the schedule modal for a mock employee and verify the "On/Off" toggles and time inputs are functional.

### Manual Verification
- Verify the layout matches the "Soft" aesthetic and is responsive across different screen sizes.
