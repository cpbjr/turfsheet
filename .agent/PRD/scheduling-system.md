# TurfSheet PRD: Scheduling System

> Extracted from PRD.md lines 640-917. Source of truth: [PRD.md](../../PRD.md)

## Scheduling System

### Overview

The scheduling system is the core differentiator of TurfSheet. It handles multiple schedule types in a single unified system, ensuring proper task assignment based on complex workforce patterns.

### Schedule Type Definitions

#### 1. Blue/Orange 19-Day Rotation

**Purpose:** Complementary rotation ensuring continuous full-time crew coverage.

**Cycle Pattern:**
```
Days 0-4:   Work (5 days)
Days 5-7:   Off (3 days)
Days 8-18:  Work (11 days)
Days 19+:   Cycle repeats
```

**Configuration:**
- `rotation_reference_date`: Starting point for cycle calculations (e.g., "2026-01-01")
- Stored in organization settings
- Blue and Orange teams work opposite schedules

**Algorithm (Pseudo-code):**
```typescript
function isBlueWorkingDay(targetDate: Date, referenceDate: Date): boolean {
  const daysSinceReference = daysBetween(referenceDate, targetDate)
  const cyclePosition = daysSinceReference % 19

  // Blue works: days 0-4 and 8-18
  return (cyclePosition >= 0 && cyclePosition <= 4) ||
         (cyclePosition >= 8 && cyclePosition <= 18)
}

function isOrangeWorkingDay(targetDate: Date, referenceDate: Date): boolean {
  return !isBlueWorkingDay(targetDate, referenceDate)
}
```

**Visual Representation:**
```
Cycle Day:  0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 | 0...
Blue:       ●  ●  ●  ●  ●  ○  ○  ○  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ● | ●...
Orange:     ○  ○  ○  ○  ○  ●  ●  ●  ○  ○  ○  ○  ○  ○  ○  ○  ○  ○  ○ | ○...

● = Working    ○ = Off
```

**Benefits:**
- Guarantees at least one full-time crew every day
- Balanced workload (14 working days per 19-day cycle = 73.7%)
- Predictable pattern for employee planning
- Avoids burnout from continuous work
- Fair distribution of weekends off

**Implementation Notes:**
- Reference date must be configured per organization
- Changing reference date recalculates all historical availability
- Consider "preview mode" showing next 30 days before committing reference date change
- Validate no tasks currently assigned to off-days before changing schedules

#### 2. Part-Time Workers

**Purpose:** Flexible scheduling for employees working specific weekdays.

**Configuration:**
- `specific_days` array: ["Monday", "Wednesday", "Friday"]
- Supports any combination of weekdays
- Can be changed per employee

**Examples:**
- Monday/Wednesday/Friday (3 days/week)
- Tuesday/Thursday (2 days/week)
- Monday/Tuesday/Wednesday (consecutive days)
- Any custom combination

**Algorithm:**
```typescript
function isPartTimeWorkingDay(employee: User, targetDate: Date): boolean {
  const dayName = getDayName(targetDate) // "Monday", "Tuesday", etc.
  return employee.specific_days.includes(dayName)
}
```

#### 3. Weekend-Only Workers

**Purpose:** Seasonal or supplemental staff working weekends.

**Configuration:**
- `specific_days` array: ["Saturday", "Sunday"] (default)
- Can be just Saturday or just Sunday
- Flexible for different weekend patterns

**Examples:**
- Both Saturday and Sunday (typical)
- Saturday only (common for students)
- Sunday only (religious accommodation)

**Algorithm:**
```typescript
function isWeekendWorkingDay(employee: User, targetDate: Date): boolean {
  const dayName = getDayName(targetDate)
  return employee.specific_days.includes(dayName)
}
```

#### 4. Full-Time (No Rotation)

**Purpose:** Standard Monday-Friday workers or custom weekly patterns.

**Configuration:**
- `specific_days` array: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
- Can be customized for non-traditional work weeks

**Algorithm:**
```typescript
function isFullTimeWorkingDay(employee: User, targetDate: Date): boolean {
  const dayName = getDayName(targetDate)
  return employee.specific_days.includes(dayName)
}
```

### Availability Calculation

**Master Function:**
```typescript
function isEmployeeAvailableToday(employee: User, targetDate: Date, orgSettings: OrganizationSettings): boolean {
  if (!employee.active) return false

  switch (employee.schedule_type) {
    case "ROTATION_BLUE":
      return isBlueWorkingDay(targetDate, orgSettings.rotation_reference_date)

    case "ROTATION_ORANGE":
      return isOrangeWorkingDay(targetDate, orgSettings.rotation_reference_date)

    case "PART_TIME":
    case "WEEKEND":
    case "FULL_TIME":
      const dayName = getDayName(targetDate)
      return employee.specific_days?.includes(dayName) ?? false

    default:
      return false
  }
}
```

### Task Assignment Logic

**Preventing Assignment Errors:**

1. **Pre-Assignment Validation:**
   - Check if employee is available on scheduled date
   - Verify employee has required skills
   - Warn if employee already has 6+ hours of tasks assigned
   - Show visual indicator (bold vs gray) in UI

2. **Smart Assignment Suggestions:**
   ```typescript
   function getSuggestedAssignments(task: Task, date: Date): User[] {
     return allUsers
       .filter(user => user.role === "WORKER")
       .filter(user => isEmployeeAvailableToday(user, date, orgSettings))
       .filter(user => hasRequiredSkills(user, task))
       .sort((a, b) => {
         // Prioritize by:
         // 1. Lightest current workload
         // 2. Most relevant skills
         // 3. Historical performance on similar tasks
       })
   }
   ```

3. **Assignment Overrides:**
   - Allow manager to override availability (for emergencies)
   - Require confirmation dialog: "John is not scheduled to work on this date. Assign anyway?"
   - Log override with reason

### Visual Availability Indicators

**UI Pattern for Assignment Screen:**

```
Employee List (January 26, 2026 - Sunday)

Name                Schedule        Available Today    Current Workload
──────────────────────────────────────────────────────────────────────────
Mike Johnson        🔵 Blue         ● YES (bold)       4.5 hrs
Sarah Chen          🟧 Orange       ○ NO (gray)        —
Tom Wilson          👤 M/W/F        ○ NO (gray)        —
Lisa Brown          📅 Weekend      ● YES (bold)       2.0 hrs
David Martinez      🔵 Blue         ● YES (bold)       6.0 hrs ⚠️
Emma Davis          👤 T/Th         ○ NO (gray)        —
```

**Legend:**
- **Bold + ●** = Scheduled to work today (available for assignment)
- **Gray + ○** = Off-duty (can override if emergency)
- **⚠️** = Already at capacity (6+ hours assigned)

### Schedule Preview Feature

**Purpose:** Help employees and managers see upcoming work schedules.

**UI Component: "Next 7 Working Days"**

For employee "Mike Johnson" (Blue rotation):
```
Next Working Days:
✓ Today (Jan 26)
✓ Tomorrow (Jan 27)
✓ Tue, Jan 28
✓ Wed, Jan 29
✓ Thu, Jan 30
✓ Fri, Jan 31
✓ Sat, Feb 1
```

**Implementation:**
```typescript
function getNextWorkingDates(employee: User, count: number = 7): Date[] {
  const workingDates: Date[] = []
  let currentDate = today()

  while (workingDates.length < count) {
    if (isEmployeeAvailableToday(employee, currentDate, orgSettings)) {
      workingDates.push(currentDate)
    }
    currentDate = addDays(currentDate, 1)
  }

  return workingDates
}
```

### Configuration Management

**Organization Settings:**
```typescript
OrganizationSettings {
  rotation_reference_date: Date // Starting point for Blue/Orange cycle
  rotation_enabled: boolean // Toggle rotation scheduling
  default_work_hours_per_day: number // For workload calculations
  task_assignment_cutoff_time: Time // e.g., "18:00" - no assignments after 6pm for next day
}
```

**Changing Reference Date:**

**Workflow:**
1. Manager navigates to Settings → Scheduling
2. Views current reference date and 19-day cycle preview
3. Enters new reference date
4. System shows preview: "This will change availability for 47 employees. 23 tasks currently assigned to off-days will be flagged."
5. Manager confirms or cancels
6. If confirmed:
   - Update reference date
   - Recalculate all availability
   - Flag affected tasks
   - Notify affected employees
   - Log change in audit trail

**Safety Checks:**
- Prevent reference date changes within 7 days of current date
- Require confirmation if any tasks assigned to newly-calculated off-days
- Show diff view: "Before" vs "After" schedules

**Schedule Flexibility:**
- **Quick availability overrides:** Superintendent can quickly mark workers as available/unavailable for specific dates
- **Call-out management:** Simple toggle to mark worker as called-out for the day
- **Off-day coverage:** Easy process to bring in workers on scheduled off-days (overtime/emergency coverage)
- **One-click status changes:** No complex forms—simple tap to change availability status
- **Real-time updates:** Changes immediately reflected in task assignment UI
- **Audit trail:** Track all manual overrides for payroll and scheduling review
