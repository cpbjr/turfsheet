# Whiteboard "Same as Yesterday" MVP

**Date:** 2026-02-20
**Status:** In Progress

## Overview

Add a "Same as Yesterday" button to the whiteboard that copies all primary job assignments from the most recent previous board to the current date. This is the foundation for the scheduling system — making it fast for the superintendent to set up the daily board.

## What It Does

1. Finds the most recent previous date that has daily_assignments
2. Copies those staff → job mappings to the selected date
3. Skips any staff that already have assignments (non-destructive)
4. Refreshes the board

## Files to Modify

- `turfsheet-app/src/components/whiteboard/StaffWhiteboardView.tsx` — Add button + copy logic

## Implementation Steps

1. Add `Copy` icon import from lucide-react
2. Add `copying` state variable
3. Add `copySourceDate` state to track where we're copying from
4. Implement `handleCopyPreviousBoard()` function:
   - Query `daily_assignments` for most recent date before selected date
   - Fetch those assignments
   - Check which staff already have assignments today
   - Insert new assignments for unassigned staff
   - Refresh board
5. Add button to header bar, next to "Today" button
6. Show source date feedback after copy

## Edge Cases

- No previous board exists → show disabled/message
- All staff already assigned → no-op
- Staff from previous board no longer exists → skip (foreign key will reject)
- Job from previous board no longer exists → skip

## Testing

- Navigate to empty date → click button → assignments appear
- Navigate to partially filled date → click → only empty staff get filled
- Navigate to fully filled date → click → nothing changes
