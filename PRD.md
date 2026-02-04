# TurfSheet - Product Requirements Document

## Executive Summary

**Product Name:** TurfSheet
**Version:** 1.0
**Last Updated:** 2026-01-26
**Status:** Planning Phase

### Vision

TurfSheet is a comprehensive task management application designed specifically for golf course maintenance operations. The system enables superintendents and managers to assign daily tasks to grounds crew members based on their availability, complex rotation schedules, skills, and current conditions. Workers receive assignments on mobile devices while managers coordinate from a desktop dashboard.

### Developer's Plan 
Main components of the app are the following, each of which will have it's own separate page and will be accessible via the main left navigation bar. 
    1. Dashboard
    2. Jobs. Users can create their own custom jobs, or use pre-defined jobs. 
    3. Equipment. Users can create their own custom equipment, or use pre-defined equipment. Ability to integrate with manufacturer APIs for real-time data (future)
    4. Staff
    5. Irrigation
    6. Reports
        6.1 Irrigation Reports
        6.2 Job Reports
        6.3 Equipment Reports
        6.4 Staff Reports
    7. Inventory, primarily of chemicals. 
    8. Planning 
        8.1 Agronomic Planning
        8.2 Tournament Planning
        8.3 Other Planning
    9. Settings
    10. Help
** Note: This has been added subsequent to PRD production. ** 

### Key Differentiators

- **Golf-Specific Scheduling:** Blue/Orange 19-day rotation system proven at Banbury Golf Course
- **Mixed Workforce Support:** Single system handling full-time rotation crews, part-time workers, and weekend staff
- **Agronomic Intelligence:** Weather pattern matching, clipping yield tracking, irrigation logging
- **Equipment Management:** Path toward Toro myTurf integration for connected equipment
- **Cost-Effective:** 10-20% of typical whiteboard app pricing ($10-35/month vs $50-200/month)

### Success Metrics

- Replace physical whiteboards and paper logs
- Reduce task assignment time 
- Eliminate missed tasks or plans, due to poor record keeping. 
- Historical data capture for compliance and planning

---

## Table of Contents

1. [Core Features](#core-features)
2. [User Roles & Personas](#user-roles--personas)
3. [Scheduling System](#scheduling-system)
4. [Data Models](#data-models)
5. [API Specification](#api-specification)
6. [System Architecture](#system-architecture)
7. [Development Phases](#development-phases)
8. [Security & Compliance](#security--compliance)
9. [Cost Analysis](#cost-analysis)
10. [Success Criteria](#success-criteria)

---

## Core Features

### 1. Task Management

**Purpose:** Digital whiteboard for daily task assignment and tracking.

#### Capabilities
- Create, assign, and track daily maintenance tasks
- Recurring task templates with golf-specific frequency patterns:
  - **Daily:** Greens, Bunkers, Irrigation, Probe Readings, Rough
  - **Alternating:** Fairways (Group 1/Group 2 rotation), Tee & Approaches
  - **Weekly:** Cart Paths, Clubhouse Grounds, Practice Range
  - **As-Needed:** Special projects, one-off assignments
- Golf-specific task types:
  - Mowing with direction tracking based on clock positions (6/12, 2/8, 10/4, 9/3)
  - Bunker maintenance with sand depth checks
  - Irrigation system checks with valve documentation
- Priority levels: Low | Normal | High | Urgent
- Time estimates for workload balancing
- Photo documentation for completed work
- Task comments and clarifying questions
- Course zone organization (greens, fairways, rough, bunkers, clubhouse areas)

#### Task Templates
```typescript
TaskTemplate {
  title: string
  description: text
  zone_id: UUID
  estimated_minutes: number
  required_skills: string[]
  frequency_category: "DAILY" | "ALTERNATING" | "WEEKLY" | "AS_NEEDED"
  alternating_group?: "GROUP_1" | "GROUP_2" // For Fairways rotation
  recurrence_rule: string // iCal RRULE format
  track_mow_direction: boolean
  track_equipment_used: boolean
}
```

### 2. Staff & Scheduling System

**Purpose:** Handle complex mixed-workforce scheduling with multiple schedule types.

#### Schedule Types Supported

**A. Blue/Orange 19-Day Rotation (Full-Time Crews)**

This is a complementary rotation system ensuring continuous coverage:

- **Cycle Pattern:** 5 days on → 3 days off → 11 days on → 3 days off (19 days total)
- **Blue Team:** Works days 0-4, off 5-7, works 8-18 (cycles repeat)
- **Orange Team:** Works exact opposite of Blue (when Blue is off, Orange works)
- **Configuration:** Rotation reference date (starting point for calculations)
- **Algorithm:** Modulo 19 arithmetic determines current cycle position

**Example Blue/Orange Calendar:**
```
Day:  0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 | 0  1  2...
Blue: W  W  W  W  W  O  O  O  W  W  W  W  W  W  W  W  W  W  W | W  W  W...
Org:  O  O  O  O  O  W  W  W  O  O  O  O  O  O  O  O  O  O  O | O  O  O...
```
*(W=Working, O=Off)*

**Benefits:**
- Guarantees at least one full-time crew available every day
- Balances workload over 19-day period
- Predictable pattern employees can plan around
- Proven at Banbury Golf Course

**B. Part-Time Workers**
- Select specific weekdays (e.g., Monday/Wednesday/Friday)
- Any combination of weekdays supported
- Stored as `specific_days` array

**C. Weekend-Only Workers**
- Work Saturday and/or Sunday
- Configurable (both days or just one)
- Flexible scheduling for seasonal staff

**D. Full-Time (No Rotation)**
- Works Monday-Friday or custom 5-day schedule
- No rotation pattern applied

#### Worker Availability Features
- Availability calendar with time-off requests
- Skill profiles (equipment certifications, training completed)
- Smart assignment suggestions based on:
  - Schedule type and working days
  - Required skills for task
  - Current workload
  - Historical task performance
- Visual availability indicators:
  - **Bold names** = Scheduled to work today
  - **Gray background** = Off-duty
  - **Emoji badges** = Schedule type (🔵 Blue, 🟧 Orange, 👤 M/W/F, 📅 Weekend)
- "Next 7 working days" preview for each employee

#### Data Model
```typescript
User {
  id: UUID
  organization_id: UUID
  email: string
  phone?: string
  name: string
  role: "MANAGER" | "WORKER"
  schedule_type: "ROTATION_BLUE" | "ROTATION_ORANGE" | "PART_TIME" | "WEEKEND" | "FULL_TIME"
  specific_days?: string[] // ["Monday", "Wednesday", "Friday"] for part-time/weekend
  skills: string[] // ["Greens Mower Certified", "Pesticide License", "Irrigation Tech"]
  avatar_url?: string
  push_token?: string
  active: boolean
}
```

### 3. Communication Hub

**Purpose:** Replace text messages and verbal communication with centralized team messaging.

#### Features
- Team announcements and broadcasts (manager → all workers)
- Task-specific comments and questions
- Direct messaging between manager and workers
- Push notifications for:
  - New task assignments
  - Assignment changes
  - Manager broadcasts
  - Task comments/replies
- Notification preferences (push/SMS/email)
- Read receipts for critical messages
- Team groups for targeted communication:
  - Create custom groups (e.g., "Irrigation Team", "Mowing Crew", "Weekend Staff")
  - Send group-specific messages
  - Auto-assign workers to groups based on skills or schedule type
  - Manager can broadcast to specific groups without messaging entire team

### 4. Reporting & History

**Purpose:** Track performance, maintain compliance records, prevent turf damage.

#### Daily Reports
- Completion summaries by worker
- Tasks completed vs assigned
- Average completion time per task type
- Photo documentation archive (Phase 2+, not MVP)

#### Mowing Direction History
- Track mowing direction per zone to prevent wear patterns
- Visual calendar showing direction changes with directional icons (clock position indicators)
- Alerts when same direction used too many consecutive days
- Recommendations for next mowing direction with visual indicators

#### Worker Productivity
- Tasks completed per worker per week/month
- Average task duration vs estimates
- Skill utilization tracking
- Attendance and availability history

#### Compliance & Audit Logs
- Historical task logs with timestamps
- Who assigned what to whom, when
- Completion notes and photos
- Export capability for audits and planning

### 5. Equipment Management

**Purpose:** Track equipment location, usage, and maintenance with path toward Toro myTurf integration.

#### Core Features
- Equipment inventory (type, model, serial number, hour meter)
- Checkout/check-in logging (who has what, when)
- Usage logging tied to tasks (which mower was used for which area)
- Basic maintenance tracking:
  - Oil changes
  - Blade sharpening
  - Repairs with cost tracking
  - Parts replacement
- Service alerts based on hour meter thresholds
- Issue reporting with photos ("left reel making noise")
- Equipment status: Available | In Use | Maintenance | Out of Service

#### Future: Toro myTurf Integration
Toro's myTurf platform provides GPS tracking, fault codes, and telematics for connected equipment. Architecture designed to support future API integration:
- Real-time equipment location on course map
- Automatic hour meter updates
- Diagnostic alerts and fault codes
- Usage efficiency reporting
- Automated service scheduling

#### Data Model
```typescript
Equipment {
  id: UUID
  organization_id: UUID
  name: string // "Greens Mower #2"
  type: "MOWER" | "UTILITY" | "SPRAYER" | "AERATOR" | "OTHER"
  make: string // "Toro"
  model: string
  serial_number: string
  year: number
  hour_meter: number
  status: "AVAILABLE" | "IN_USE" | "MAINTENANCE" | "OUT_OF_SERVICE"
  checked_out_to?: UUID
  checked_out_at?: timestamp
  next_service_hours: number
  toro_asset_id?: string // Future: myTurf integration
  photo_url?: string
  notes: text
}

EquipmentLog {
  id: UUID
  equipment_id: UUID
  user_id: UUID
  task_id?: UUID
  log_type: "CHECKOUT" | "CHECKIN" | "MAINTENANCE" | "ISSUE" | "FUEL"
  hour_meter_reading: number
  description: text
  photos: string[]
  created_at: timestamp
}
```

### 6. Irrigation Quick-Log

**Purpose:** Replace superintendent's paper log for daily hand watering, probing, and irrigation adjustments.

#### Features
- Morning probe readings by green:
  - Moisture level (numeric reading from probe device)
  - Firmness rating (numeric reading from measuring device)
  - Location notes ("front edge", "south slope")
- Hand watering log:
  - Which greens/areas watered
  - Duration in minutes
  - Time of day
  - Coverage notes
- Dry spot tracking:
  - Photo documentation
  - Location mapping
  - Historical dry spot areas
- Syringe cycle logging (quick cooling cycles on hot days):
  - Time of day
  - Duration
  - Greens treated
- System run logging:
  - Irrigation cycles executed
  - Duration per zone
  - Any issues or adjustments
- Historical view:
  - Watering patterns over time per green
  - Correlation with weather data
  - Identify problem areas ("Green 7 always needs extra on south slope")

#### Data Model
```typescript
IrrigationLog {
  id: UUID
  organization_id: UUID
  zone_id: UUID // Green or area
  recorded_by: UUID
  recorded_date: Date
  recorded_time: Time
  activity_type: "PROBE" | "HAND_WATER" | "SYRINGE" | "DRY_SPOT" | "SYSTEM_RUN"
  probe_reading?: number // Moisture meter reading
  duration_minutes?: number
  coverage_notes?: string // "south slope", "front edge"
  firmness_rating?: number // 1-10
  photos: string[]
  notes: text
}
```

### 7. Superintendent Dashboard

**Purpose:** Command center for agronomic data tracking and weather intelligence.

#### A. Grass Clippings Tracking

Track daily clipping yield as a key turf health indicator.

**Features:**
- Daily clipping yield recording by zone (greens, fairways, etc.)
- Weight measurements (clippings emptied from mower basket and weighed)
- Height of cut (HOC) recording
- Trend visualization:
  - Moving averages (7-day, 14-day, 30-day)
  - Year-over-year comparison
  - Growth rate calculations
- Correlation views:
  - Clippings vs weather (temperature, rainfall)
  - Clippings vs fertilizer applications
  - Clippings vs irrigation
- Alerts for unusual yield changes:
  - Growth spurts (potential disease or fertilizer response)
  - Stress indicators (declining yields)
  - Seasonal anomalies

**Data Model:**
```typescript
ClippingRecord {
  id: UUID
  organization_id: UUID
  zone_id: UUID
  recorded_date: Date
  recorded_by: UUID
  weight_grams: number
  height_of_cut_mm: number
  notes: text // Color, density, stress signs
}
```

#### B. Weather Intelligence

**Purpose:** Beyond simple forecasts—pattern recognition and historical analog matching to support agronomic decisions.

**Core Features:**

1. **Current Conditions & Forecast**
   - 7-14 day forecast with hourly detail
   - Spray window identification (wind speed, temperature, humidity)
   - Temperature trends and extremes
   - Precipitation timing and totals

2. **Historical Comparison**
   - Current season vs 30-year averages
   - GDD (Growing Degree Day) accumulation
   - Precipitation totals comparison
   - Temperature range deviations

3. **Analog Year Matching**
   - Identify past years with similar weather patterns
   - Correlation scores (0.0 - 1.0)
   - "2025 is tracking like 2015" insights
   - Pull forward what happened next in analog years

4. **Pattern Alerts**
   - Notifications when conditions deviate from historical norms
   - Disease pressure predictions based on temperature/humidity
   - Pest emergence timing (GDD thresholds)
   - Frost/freeze warnings

5. **GDD Tracking**
   - Cumulative growing degree days
   - Pest/disease model thresholds
   - Crabgrass germination predictions
   - Poa annua seedhead emergence

6. **Microclimate Notes**
   - Log local observations different from weather station
   - Site-specific conditions
   - Historical microclimate patterns

**Example Insight:**
> "January 2025 is running 4.2°F above the 30-year average with 62% of normal precipitation. The closest historical match is January 2015 (correlation: 0.87). In 2015, early warmth led to premature green-up followed by frost damage in late February. Consider delaying spring fertilization."

**Practical Insights Delivered:**

| Pattern Detected | Actionable Insight |
|------------------|-------------------|
| Early warm spell (like 2015) | "2015 saw late Feb frost after similar warmth. Delay spring fert, monitor soil temps." |
| Below-normal precip + high GDD | "Conditions favor dollar spot. In 2018, outbreaks started week 3 of this pattern." |
| Wet spring (like 2017) | "2017 had extended Pythium pressure through June. Plan preventive apps." |
| GDD ahead of schedule | "Crabgrass germination expected 10 days early. Adjust pre-emergent timing." |

**Technical Implementation:**

**Data Sources:**
- NOAA Climate Data Online (free historical data)
- Open-Meteo API (free forecasts, no API key required)
- Visual Crossing (backup, affordable historical data)
- On-site observations (manual entries)

**Analog Year Matching Algorithm:**
1. Collect daily data: temp high/low, precipitation, GDD accumulation
2. Normalize to season progress (Jan 1 - today vs same window in historical years)
3. Calculate similarity scores: Pearson correlation on temp trends, precip patterns, GDD curves
4. Weight recent data: Last 30 days weighted 2x vs earlier season
5. Rank and surface: Show top 3 analog years with correlation scores
6. Pull forward insights: Display what happened next in analog years

**Data Models:**
```typescript
WeatherReading {
  id: UUID
  organization_id: UUID
  reading_date: Date
  source: "API" | "MANUAL" | "ON_SITE_STATION"
  temp_high_f: number
  temp_low_f: number
  temp_avg_f: number
  precipitation_in: number
  humidity_avg: number
  wind_avg_mph: number
  gdd_base50: number // Growing degree days (base 50°F)
  soil_temp_4in_f?: number
  notes: text
}

HistoricalWeatherBaseline {
  id: UUID
  location_id: string // Weather station ID
  year: number // Or 0 for 30-year average
  month: number
  day_of_month?: number // Null for monthly summary
  temp_avg_f: number
  precip_avg_in: number
  gdd_cumulative: number
  season_notes: text // "Late frost Feb 28", "Early green-up"
}
```

**Implementation Notes:**
- Pre-load 30 years of historical data during onboarding
- Daily cron job fetches current conditions and updates comparisons
- Allow superintendents to annotate historical years ("2019: worst Poa triv year")
- Start simple (temp + precip correlation), add complexity based on feedback
- Consider regional turf networks where superintendents share analog insights

### 8. Chemical Application Management (Future - Phase 5)

**Purpose:** Comprehensive tracking for fertilizers, pesticides, and turf chemicals for regulatory compliance and agronomic planning.

#### Features
- Product inventory with EPA registration numbers and SDS links
- Application scheduling with weather-aware recommendations
- Detailed application records:
  - Product, rate, area, applicator
  - Weather conditions (wind, temp, humidity)
  - Equipment used
  - Re-entry interval (REI) tracking
- Pre-harvest interval tracking (if applicable)
- Spray log exports for state reporting requirements
- Applicator certification tracking with expiration alerts
- Historical application reports by zone/product/date range

#### Data Models
```typescript
ChemicalProduct {
  id: UUID
  organization_id: UUID
  name: string
  type: "FERTILIZER" | "HERBICIDE" | "FUNGICIDE" | "INSECTICIDE" | "PGR" | "OTHER"
  epa_registration: string
  active_ingredient: string
  rei_hours: number // Re-entry interval
  sds_url: string // Safety Data Sheet
  default_rate: number
  rate_unit: string // "oz/1000 sq ft", "lbs/acre"
  quantity_on_hand: number
  quantity_unit: string // "gallons", "lbs"
}

ApplicationRecord {
  id: UUID
  organization_id: UUID
  product_id: UUID
  zone_id: UUID
  applied_by: UUID // Certified applicator
  scheduled_date: Date
  applied_at: timestamp
  rate_applied: number
  area_treated_sqft: number
  total_product_used: number
  wind_speed_mph: number
  wind_direction: string
  temperature_f: number
  humidity_percent: number
  soil_moisture: "DRY" | "MOIST" | "WET"
  rei_expires_at: timestamp
  notes: text
  status: "SCHEDULED" | "COMPLETED" | "SKIPPED" | "CANCELLED"
}
```

---

## User Roles & Personas

### 1. Superintendent / Assistant Superintendent (Manager Role)

**Primary User - Desktop Dashboard**

**Goals:**
- Assign daily tasks efficiently without scheduling conflicts
- Track crew productivity and task completion
- Maintain compliance records (spray logs, maintenance history)
- Make data-driven agronomic decisions
- Plan ahead based on weather patterns

**Typical Day:**
- 5:30 AM: Review weather, check irrigation logs from morning crew
- 6:00 AM: Assign tasks for the day based on crew availability
- 7:00 AM: Brief crew, answer questions on tasks
- Throughout day: Monitor task completion, respond to issues
- 3:00 PM: Review completed work, check photos
- 4:00 PM: Record clipping yields, plan tomorrow's assignments

**Pain Points (Current State):**
- Physical whiteboard must be updated manually
- No historical record of who did what
- Paper logs get lost or damaged
- Can't see patterns in irrigation needs or clipping yields
- Difficult to track mowing direction to prevent wear
- No easy way to correlate weather with turf conditions

**Key Features Used:**
- Task assignment with availability checking
- Equipment checkout management
- Irrigation and clipping logging
- Weather intelligence and analog matching
- Reporting and analytics
- Team communication

### 2. Grounds Crew Worker (Worker Role)

**Secondary User - Mobile App**

**Goals:**
- Know exactly what tasks to do today
- Complete tasks efficiently
- Document work with photos
- Communicate issues or questions to superintendent
- Check out equipment easily

**Typical Day:**
- 6:00 AM: Check phone for today's assignments
- 6:15 AM: Check out greens mower
- 6:30 AM: Start mowing greens (mark direction in app)
- 11:00 AM: Complete morning tasks, upload photos
- 11:30 AM: Check afternoon assignment
- 3:00 PM: Return equipment, log hours
- 3:30 PM: Mark all tasks complete with notes

**Pain Points (Current State):**
- Unclear what tasks are assigned to them
- Forget which direction greens were mowed last time
- No way to show proof of completed work
- Can't communicate issues except in person or text
- Don't know if equipment is available before walking to shop

**Key Features Used:**
- Daily task list (mobile view)
- Task completion with photos
- Equipment checkout from mobile
- Task comments/questions
- Push notifications for new assignments
- **Self-service task selection:**
  - "Grab" available tasks from available task pool
  - Smart task recommendations based on worker's skill set
  - Priority focus on afternoon/secondary tasks (morning tasks typically completed without tracking)
  - Real-time view of unassigned tasks matching their capabilities 

### 3. Office Manager / Administrator (Future)

**Tertiary User - Desktop Dashboard**

**Goals:**
- Manage team member accounts
- Generate compliance reports
- Export data for payroll or accounting
- Monitor system usage

**Key Features Used:**
- User management
- Report generation and exports
- System configuration
- Data archival

---

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

---

## Data Models

### Core Tables

#### Organization
Represents a golf course or maintenance facility.

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  rotation_reference_date DATE, -- Starting point for Blue/Orange cycle
  rotation_enabled BOOLEAN DEFAULT false,
  default_work_hours_per_day INTEGER DEFAULT 8,
  task_assignment_cutoff_time TIME DEFAULT '18:00:00',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### User
Staff members including managers and workers.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('MANAGER', 'WORKER')),
  schedule_type TEXT NOT NULL CHECK (schedule_type IN
    ('ROTATION_BLUE', 'ROTATION_ORANGE', 'PART_TIME', 'WEEKEND', 'FULL_TIME')),
  specific_days TEXT[], -- ["Monday", "Wednesday", "Friday"] for part-time/weekend/full-time
  skills TEXT[] DEFAULT '{}', -- ["Greens Mower Certified", "Pesticide License"]
  avatar_url TEXT,
  push_token TEXT, -- For mobile notifications
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_schedule_type ON users(schedule_type);
```

#### Zone
Areas of the golf course for task organization.

```sql
CREATE TABLE zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL, -- "Front 9 Greens", "Fairways 10-18"
  type TEXT NOT NULL CHECK (type IN
    ('GREENS', 'FAIRWAYS', 'ROUGH', 'BUNKERS', 'TEES', 'PRACTICE', 'CLUBHOUSE', 'OTHER')),
  color TEXT DEFAULT '#3b82f6', -- Hex color for UI display
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_zones_organization ON zones(organization_id);
```

#### TaskTemplate
Reusable templates for recurring tasks.

```sql
CREATE TABLE task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  title TEXT NOT NULL,
  description TEXT,
  zone_id UUID REFERENCES zones(id),
  estimated_minutes INTEGER,
  required_skills TEXT[] DEFAULT '{}',
  frequency_category TEXT CHECK (frequency_category IN
    ('DAILY', 'ALTERNATING', 'WEEKLY', 'AS_NEEDED')),
  alternating_group TEXT CHECK (alternating_group IN ('GROUP_1', 'GROUP_2')), -- For Fairways
  recurrence_rule TEXT, -- iCal RRULE format
  track_mow_direction BOOLEAN DEFAULT false,
  track_equipment_used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_task_templates_organization ON task_templates(organization_id);
CREATE INDEX idx_task_templates_frequency ON task_templates(frequency_category);
```

#### Task
Individual task instances assigned to workers.

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES task_templates(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  title TEXT NOT NULL,
  description TEXT,
  zone_id UUID REFERENCES zones(id),
  assigned_to UUID REFERENCES users(id),
  assigned_by UUID REFERENCES users(id),
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  priority TEXT DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
  status TEXT DEFAULT 'PENDING' CHECK (status IN
    ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED')),
  mow_direction TEXT CHECK (mow_direction IN ('6_12', '2_8', '10_4', '9_3')), -- Clock positions
  equipment_used UUID REFERENCES equipment(id),
  completed_at TIMESTAMPTZ,
  completion_notes TEXT,
  completion_photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_organization ON tasks(organization_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_scheduled_date ON tasks(scheduled_date);
CREATE INDEX idx_tasks_status ON tasks(status);
```

#### Availability
Worker availability windows (time-off requests, schedule overrides, call-outs).

```sql
CREATE TABLE availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN DEFAULT true, -- false = time-off request/call-out
  override_type TEXT CHECK (override_type IN ('TIME_OFF', 'CALL_OUT', 'EXTRA_DAY', 'SCHEDULE_CHANGE')),
  reason TEXT, -- "Vacation", "Sick", "Emergency coverage", etc.
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_availability_user_date ON availability(user_id, date);
```

#### Message
Communication between team members and groups.

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  sender_id UUID NOT NULL REFERENCES users(id),
  recipient_id UUID REFERENCES users(id), -- NULL for broadcasts/groups
  group_id UUID REFERENCES groups(id), -- NULL for direct messages
  task_id UUID REFERENCES tasks(id), -- Optional task context
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('DIRECT', 'BROADCAST', 'GROUP', 'TASK_COMMENT')),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_messages_group ON messages(group_id);
CREATE INDEX idx_messages_task ON messages(task_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
```

#### Group
Team groups for targeted communication.

```sql
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL, -- "Irrigation Team", "Mowing Crew", etc.
  description TEXT,
  auto_assign_rule JSONB, -- Rules for automatic group membership
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id),
  user_id UUID NOT NULL REFERENCES users(id),
  added_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_members_user ON group_members(user_id);
```

#### Equipment
Inventory of mowers, utility vehicles, sprayers, and other equipment.

```sql
CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL, -- "Greens Mower #2"
  type TEXT NOT NULL CHECK (type IN
    ('MOWER', 'UTILITY', 'SPRAYER', 'AERATOR', 'OTHER')),
  make TEXT, -- "Toro"
  model TEXT,
  serial_number TEXT,
  year INTEGER,
  hour_meter NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'AVAILABLE' CHECK (status IN
    ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'OUT_OF_SERVICE')),
  checked_out_to UUID REFERENCES users(id),
  checked_out_at TIMESTAMPTZ,
  next_service_hours NUMERIC(10,2),
  toro_asset_id TEXT, -- Future: myTurf integration
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_equipment_organization ON equipment(organization_id);
CREATE INDEX idx_equipment_status ON equipment(status);
```

#### EquipmentLog
Usage history, checkouts, and maintenance records.

```sql
CREATE TABLE equipment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment(id),
  user_id UUID NOT NULL REFERENCES users(id),
  task_id UUID REFERENCES tasks(id),
  log_type TEXT NOT NULL CHECK (log_type IN
    ('CHECKOUT', 'CHECKIN', 'MAINTENANCE', 'ISSUE', 'FUEL')),
  hour_meter_reading NUMERIC(10,2),
  description TEXT,
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_equipment_logs_equipment ON equipment_logs(equipment_id);
CREATE INDEX idx_equipment_logs_created ON equipment_logs(created_at DESC);
```

#### IrrigationLog
Daily hand watering, probing, and irrigation activity records.

```sql
CREATE TABLE irrigation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  zone_id UUID NOT NULL REFERENCES zones(id),
  recorded_by UUID NOT NULL REFERENCES users(id),
  recorded_date DATE NOT NULL,
  recorded_time TIME NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN
    ('PROBE', 'HAND_WATER', 'SYRINGE', 'DRY_SPOT', 'SYSTEM_RUN')),
  probe_reading NUMERIC(5,2), -- Moisture meter reading
  duration_minutes INTEGER,
  coverage_notes TEXT, -- "south slope", "front edge"
  firmness_rating NUMERIC(5,2), -- Firmness meter reading
  photos TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_irrigation_logs_zone_date ON irrigation_logs(zone_id, recorded_date);
CREATE INDEX idx_irrigation_logs_organization ON irrigation_logs(organization_id);
```

#### ClippingRecord
Daily grass clipping yield measurements for tracking turf health.

```sql
CREATE TABLE clipping_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  zone_id UUID NOT NULL REFERENCES zones(id),
  recorded_date DATE NOT NULL,
  recorded_by UUID NOT NULL REFERENCES users(id),
  weight_grams NUMERIC(8,2),
  height_of_cut_mm NUMERIC(5,2),
  notes TEXT, -- Color, density, stress signs
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clipping_records_zone_date ON clipping_records(zone_id, recorded_date);
```

#### WeatherReading
Local weather observations and API data for historical tracking.

```sql
CREATE TABLE weather_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  reading_date DATE NOT NULL,
  source TEXT CHECK (source IN ('API', 'MANUAL', 'ON_SITE_STATION')),
  temp_high_f NUMERIC(5,2),
  temp_low_f NUMERIC(5,2),
  temp_avg_f NUMERIC(5,2),
  precipitation_in NUMERIC(5,3),
  humidity_avg INTEGER,
  wind_avg_mph NUMERIC(5,2),
  gdd_base50 NUMERIC(5,2), -- Growing degree days (base 50°F)
  soil_temp_4in_f NUMERIC(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_weather_readings_organization_date ON weather_readings(organization_id, reading_date);
```

#### HistoricalWeatherBaseline
Pre-loaded 30-year climate normals and notable historical seasons.

```sql
CREATE TABLE historical_weather_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id TEXT NOT NULL, -- Weather station or region ID
  year INTEGER NOT NULL, -- Or 0 for 30-year average
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 31), -- NULL for monthly summary
  temp_avg_f NUMERIC(5,2),
  precip_avg_in NUMERIC(5,3),
  gdd_cumulative NUMERIC(8,2),
  season_notes TEXT, -- "Late frost Feb 28", "Early green-up"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_historical_weather_location_year ON historical_weather_baselines(location_id, year, month);
```

### Future Tables (Phase 5+)

#### ChemicalProduct
Inventory of fertilizers, pesticides, and other turf chemicals.

**Future Enhancements (Phase 5+):**
- Auto-import safety data sheets via EPA registration lookup
- Application amount predictor based on historical usage patterns
- Inventory forecasting based on seasonal application trends

```sql
CREATE TABLE chemical_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN
    ('FERTILIZER', 'HERBICIDE', 'FUNGICIDE', 'INSECTICIDE', 'PGR', 'OTHER')),
  epa_registration TEXT,
  active_ingredient TEXT,
  rei_hours INTEGER, -- Re-entry interval
  sds_url TEXT, -- Safety Data Sheet
  default_rate NUMERIC(10,4),
  rate_unit TEXT, -- "oz/1000 sq ft", "lbs/acre"
  quantity_on_hand NUMERIC(10,2),
  quantity_unit TEXT, -- "gallons", "lbs"
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### ApplicationRecord
Log of chemical applications for compliance and planning.

```sql
CREATE TABLE application_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  product_id UUID NOT NULL REFERENCES chemical_products(id),
  zone_id UUID NOT NULL REFERENCES zones(id),
  applied_by UUID NOT NULL REFERENCES users(id),
  scheduled_date DATE,
  applied_at TIMESTAMPTZ,
  rate_applied NUMERIC(10,4),
  area_treated_sqft INTEGER,
  total_product_used NUMERIC(10,2),
  wind_speed_mph NUMERIC(4,1),
  wind_direction TEXT,
  temperature_f NUMERIC(5,2),
  humidity_percent INTEGER,
  soil_moisture TEXT CHECK (soil_moisture IN ('DRY', 'MOIST', 'WET')),
  rei_expires_at TIMESTAMPTZ,
  notes TEXT,
  status TEXT DEFAULT 'SCHEDULED' CHECK (status IN
    ('SCHEDULED', 'COMPLETED', 'SKIPPED', 'CANCELLED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## API Specification

### Authentication

#### POST /api/auth/login
Email/password login, returns JWT access and refresh tokens.

**Request:**
```json
{
  "email": "super@banburygolf.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "name": "John Smith",
    "email": "super@banburygolf.com",
    "role": "MANAGER",
    "organization_id": "uuid"
  },
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "expires_in": 900
}
```

#### POST /api/auth/refresh
Refresh access token using refresh token.

#### POST /api/auth/logout
Invalidate refresh token.

#### POST /api/auth/forgot-password
Send password reset email.

---

### Tasks

#### GET /api/tasks
List tasks with filtering.

**Query Parameters:**
- `date` - Filter by scheduled date (YYYY-MM-DD)
- `assigned_to` - Filter by worker UUID
- `status` - Filter by status (PENDING, IN_PROGRESS, COMPLETED, SKIPPED)
- `zone_id` - Filter by zone UUID
- `priority` - Filter by priority
- `page` - Pagination page number
- `limit` - Items per page (default 50)

**Response:**
```json
{
  "tasks": [
    {
      "id": "uuid",
      "title": "Mow Front 9 Greens",
      "description": "Double-cut greens 1-9",
      "zone": {
        "id": "uuid",
        "name": "Front 9 Greens",
        "type": "GREENS",
        "color": "#10b981"
      },
      "assigned_to": {
        "id": "uuid",
        "name": "Mike Johnson",
        "schedule_type": "ROTATION_BLUE"
      },
      "assigned_by": {
        "id": "uuid",
        "name": "John Smith"
      },
      "scheduled_date": "2026-01-26",
      "scheduled_time": "06:30:00",
      "priority": "HIGH",
      "status": "IN_PROGRESS",
      "estimated_minutes": 120,
      "track_mow_direction": true,
      "mow_direction": "N",
      "equipment_used": null,
      "completed_at": null,
      "completion_notes": null,
      "completion_photos": []
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 142,
    "total_pages": 3
  }
}
```

#### GET /api/tasks/:id
Get task details.

#### POST /api/tasks
Create task (manager only).

**Request:**
```json
{
  "title": "Mow Front 9 Greens",
  "description": "Double-cut greens 1-9",
  "zone_id": "uuid",
  "assigned_to": "uuid",
  "scheduled_date": "2026-01-26",
  "scheduled_time": "06:30:00",
  "priority": "HIGH",
  "estimated_minutes": 120,
  "track_mow_direction": true,
  "template_id": "uuid" // Optional
}
```

**Response:**
```json
{
  "task": { /* task object */ },
  "availability_warning": null // Or "Worker is not scheduled on this date"
}
```

#### PUT /api/tasks/:id
Update task.

#### DELETE /api/tasks/:id
Delete task (manager only).

#### POST /api/tasks/:id/complete
Mark task complete with notes and photos.

**Request:**
```json
{
  "mow_direction": "N",
  "equipment_used": "uuid",
  "completion_notes": "Greens looking great, slight dry spot on #7",
  "completion_photos": ["https://s3.../photo1.jpg", "https://s3.../photo2.jpg"]
}
```

#### POST /api/tasks/generate-from-templates
Create daily tasks from recurring templates.

**Request:**
```json
{
  "date": "2026-01-27", // Generate for this date
  "template_ids": ["uuid1", "uuid2"] // Optional, or all active templates
}
```

**Response:**
```json
{
  "created_tasks": 12,
  "tasks": [ /* array of created tasks */ ]
}
```

---

### Users & Availability

#### GET /api/users
List team members.

**Query Parameters:**
- `role` - Filter by MANAGER or WORKER
- `active` - Filter by active status (true/false)
- `schedule_type` - Filter by schedule type

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "name": "Mike Johnson",
      "email": "mike@banburygolf.com",
      "phone": "+1-555-0123",
      "role": "WORKER",
      "schedule_type": "ROTATION_BLUE",
      "specific_days": null,
      "skills": ["Greens Mower Certified", "Irrigation Tech"],
      "avatar_url": "https://s3.../avatar.jpg",
      "active": true
    }
  ]
}
```

#### GET /api/users/:id/availability
Get availability for specific user.

**Query Parameters:**
- `start_date` - Start of date range (YYYY-MM-DD)
- `end_date` - End of date range (YYYY-MM-DD)

**Response:**
```json
{
  "user_id": "uuid",
  "schedule_type": "ROTATION_BLUE",
  "availability": [
    {
      "date": "2026-01-26",
      "is_working_day": true,
      "reason": "Blue rotation - working day",
      "override": null
    },
    {
      "date": "2026-01-27",
      "is_working_day": false,
      "reason": "Blue rotation - off day",
      "override": {
        "id": "uuid",
        "is_available": true,
        "reason": "Covering for Orange crew",
        "approved_by": "uuid"
      }
    }
  ],
  "next_working_dates": [
    "2026-01-26",
    "2026-01-28",
    "2026-01-29"
  ]
}
```

#### PUT /api/users/:id/availability
Create availability override (time-off request or schedule exception).

**Request:**
```json
{
  "date": "2026-02-15",
  "is_available": false,
  "reason": "Doctor appointment",
  "start_time": "09:00:00",
  "end_time": "12:00:00"
}
```

#### GET /api/users/available
List available workers for specific date.

**Query Parameters:**
- `date` - Date to check (YYYY-MM-DD)
- `required_skills` - Comma-separated skills (optional)

**Response:**
```json
{
  "date": "2026-01-26",
  "available_workers": [
    {
      "id": "uuid",
      "name": "Mike Johnson",
      "schedule_type": "ROTATION_BLUE",
      "skills": ["Greens Mower Certified"],
      "current_workload_minutes": 270,
      "availability_status": "SCHEDULED"
    }
  ],
  "unavailable_workers": [
    {
      "id": "uuid",
      "name": "Sarah Chen",
      "schedule_type": "ROTATION_ORANGE",
      "reason": "Orange rotation - off day"
    }
  ]
}
```

---

### Messages

#### GET /api/messages
List messages with filtering.

**Query Parameters:**
- `type` - DIRECT, BROADCAST, TASK_COMMENT
- `task_id` - Filter by task
- `unread` - true/false
- `page` - Pagination

**Response:**
```json
{
  "messages": [
    {
      "id": "uuid",
      "sender": {
        "id": "uuid",
        "name": "John Smith",
        "avatar_url": "https://..."
      },
      "recipient": {
        "id": "uuid",
        "name": "Mike Johnson"
      },
      "task": null,
      "content": "Great work on the greens today!",
      "type": "DIRECT",
      "read_at": null,
      "created_at": "2026-01-26T15:30:00Z"
    }
  ]
}
```

#### POST /api/messages
Send message.

**Request:**
```json
{
  "recipient_id": "uuid", // Null for broadcast
  "task_id": "uuid", // Optional
  "content": "Great work on the greens today!",
  "type": "DIRECT"
}
```

#### POST /api/messages/broadcast
Send to all workers (manager only).

**Request:**
```json
{
  "content": "Course closed tomorrow for tournament prep. All hands on deck at 5:30 AM.",
  "priority": "HIGH"
}
```

#### PUT /api/messages/:id/read
Mark message as read.

---

### Templates & Zones

#### GET /api/templates
List task templates.

**Response:**
```json
{
  "templates": [
    {
      "id": "uuid",
      "title": "Mow Greens",
      "description": "Double-cut all greens",
      "zone": {
        "id": "uuid",
        "name": "All Greens",
        "type": "GREENS"
      },
      "estimated_minutes": 180,
      "required_skills": ["Greens Mower Certified"],
      "frequency_category": "DAILY",
      "alternating_group": null,
      "recurrence_rule": "FREQ=DAILY",
      "track_mow_direction": true,
      "track_equipment_used": true
    }
  ]
}
```

#### POST /api/templates
Create task template.

#### GET /api/zones
List course zones.

#### POST /api/zones
Create zone.

---

### Equipment

#### GET /api/equipment
List all equipment with status.

**Response:**
```json
{
  "equipment": [
    {
      "id": "uuid",
      "name": "Greens Mower #2",
      "type": "MOWER",
      "make": "Toro",
      "model": "Greensmaster 3250-D",
      "serial_number": "12345",
      "year": 2023,
      "hour_meter": 487.5,
      "status": "IN_USE",
      "checked_out_to": {
        "id": "uuid",
        "name": "Mike Johnson"
      },
      "checked_out_at": "2026-01-26T06:15:00Z",
      "next_service_hours": 500,
      "photo_url": "https://...",
      "notes": "Just serviced, running great"
    }
  ]
}
```

#### POST /api/equipment
Add equipment to inventory.

#### GET /api/equipment/:id
Get equipment details with recent logs.

**Response:**
```json
{
  "equipment": { /* equipment object */ },
  "recent_logs": [
    {
      "id": "uuid",
      "user": {
        "id": "uuid",
        "name": "Mike Johnson"
      },
      "log_type": "CHECKOUT",
      "hour_meter_reading": 487.5,
      "description": null,
      "created_at": "2026-01-26T06:15:00Z"
    }
  ],
  "service_due": false,
  "open_issues": []
}
```

#### POST /api/equipment/:id/checkout
Check out equipment to worker.

**Request:**
```json
{
  "user_id": "uuid",
  "hour_meter_reading": 487.5
}
```

#### POST /api/equipment/:id/checkin
Return equipment.

**Request:**
```json
{
  "hour_meter_reading": 492.3,
  "notes": "Ran well, no issues"
}
```

#### POST /api/equipment/:id/issue
Report problem with photos.

**Request:**
```json
{
  "description": "Left reel making grinding noise",
  "hour_meter_reading": 490.0,
  "photos": ["https://s3.../issue1.jpg"]
}
```

#### POST /api/equipment/:id/maintenance
Log maintenance performed.

**Request:**
```json
{
  "description": "Changed oil, sharpened blades",
  "hour_meter_reading": 492.3,
  "photos": []
}
```

#### GET /api/equipment/alerts
Equipment needing service or with open issues.

---

### Irrigation Quick-Log

#### GET /api/irrigation
List irrigation logs.

**Query Parameters:**
- `zone_id` - Filter by zone
- `start_date` - Start of date range
- `end_date` - End of date range
- `activity_type` - Filter by type

#### POST /api/irrigation
Log probe reading, hand watering, or syringe.

**Request:**
```json
{
  "zone_id": "uuid",
  "recorded_date": "2026-01-26",
  "recorded_time": "06:00:00",
  "activity_type": "PROBE",
  "probe_reading": 18.5,
  "firmness_rating": 7,
  "coverage_notes": "Front edge slightly dry",
  "photos": [],
  "notes": "Looks good overall"
}
```

#### GET /api/irrigation/today
Today's activity summary by green.

**Response:**
```json
{
  "date": "2026-01-26",
  "activities": [
    {
      "zone": {
        "id": "uuid",
        "name": "Green #1"
      },
      "probe_reading": 19.2,
      "firmness": 8,
      "hand_watered": false,
      "syringed": false,
      "notes": "Perfect"
    }
  ]
}
```

#### GET /api/irrigation/zone/:id/history
Historical patterns for specific green.

**Query Parameters:**
- `days` - Number of days to look back (default 30)

#### GET /api/irrigation/dry-spots
Active dry spot issues with photos.

---

### Clippings & Agronomic Data

#### GET /api/clippings
List clipping records.

**Query Parameters:**
- `zone_id` - Filter by zone
- `start_date` - Start of date range
- `end_date` - End of date range

#### POST /api/clippings
Record daily clipping measurement.

**Request:**
```json
{
  "zone_id": "uuid",
  "recorded_date": "2026-01-26",
  "volume_liters": 42.5,
  "measurement_method": "BASKET",
  "height_of_cut_mm": 3.2,
  "notes": "Healthy green color, good density"
}
```

#### GET /api/clippings/trends
Aggregated trends with moving averages.

**Query Parameters:**
- `zone_id` - Specific zone or all
- `days` - Lookback period (default 30)

**Response:**
```json
{
  "zone": {
    "id": "uuid",
    "name": "All Greens"
  },
  "period": "30 days",
  "data": [
    {
      "date": "2026-01-26",
      "volume_liters": 42.5,
      "moving_avg_7day": 38.2,
      "moving_avg_14day": 36.8
    }
  ],
  "summary": {
    "avg_volume": 37.5,
    "min_volume": 28.0,
    "max_volume": 48.5,
    "trend": "INCREASING"
  }
}
```

#### GET /api/clippings/correlations
Clippings vs weather/inputs analysis.

---

### Weather Intelligence

#### GET /api/weather/current
Current conditions and forecast.

**Response:**
```json
{
  "current": {
    "temperature_f": 72,
    "humidity": 65,
    "wind_speed_mph": 8,
    "conditions": "Partly Cloudy",
    "updated_at": "2026-01-26T14:30:00Z"
  },
  "forecast": [
    {
      "date": "2026-01-27",
      "temp_high_f": 75,
      "temp_low_f": 58,
      "precipitation_chance": 20,
      "wind_avg_mph": 10,
      "conditions": "Sunny"
    }
  ],
  "spray_windows": [
    {
      "date": "2026-01-27",
      "start_time": "06:00:00",
      "end_time": "10:00:00",
      "conditions": "Ideal: low wind, moderate temp"
    }
  ]
}
```

#### GET /api/weather/history
Historical readings for this course.

**Query Parameters:**
- `start_date` - Start of date range
- `end_date` - End of date range

#### POST /api/weather/reading
Log manual weather observation.

**Request:**
```json
{
  "reading_date": "2026-01-26",
  "source": "MANUAL",
  "temp_high_f": 74,
  "temp_low_f": 58,
  "precipitation_in": 0.0,
  "notes": "Microclimate: greens 15-18 noticeably warmer than weather station"
}
```

#### GET /api/weather/comparison
Current season vs 30-year normals.

**Response:**
```json
{
  "current_season": {
    "start_date": "2026-01-01",
    "end_date": "2026-01-26",
    "avg_temp_f": 52.3,
    "total_precip_in": 2.8,
    "gdd_accumulated": 145
  },
  "thirty_year_normal": {
    "avg_temp_f": 48.1,
    "total_precip_in": 4.5,
    "gdd_accumulated": 120
  },
  "deviations": {
    "temp_deviation_f": 4.2,
    "precip_percent": 62,
    "gdd_ahead_by": 25
  },
  "interpretation": "Season running significantly warmer and drier than average"
}
```

#### GET /api/weather/analogs
Find historical years matching current pattern.

**Response:**
```json
{
  "current_year": 2026,
  "analog_years": [
    {
      "year": 2015,
      "correlation": 0.87,
      "similarity_description": "Very similar temp and precip pattern",
      "what_happened_next": "Late Feb frost after early warmth caused damage to greens 7, 12, 15",
      "superintendent_notes": "Delayed spring fertilization by 3 weeks. Good decision."
    },
    {
      "year": 2009,
      "correlation": 0.79,
      "similarity_description": "Similar GDD accumulation, slightly wetter",
      "what_happened_next": "Early Poa annua seedheads, dollar spot pressure in March"
    }
  ],
  "actionable_insights": [
    "Consider delaying spring fertilization",
    "Monitor for early Poa annua activity",
    "Prepare for potential late-season frost"
  ]
}
```

#### GET /api/weather/gdd
Growing degree day accumulation and projections.

**Response:**
```json
{
  "current_gdd": 145,
  "thirty_year_avg_gdd": 120,
  "ahead_by": 25,
  "projections": [
    {
      "threshold": 200,
      "description": "Crabgrass germination",
      "estimated_date": "2026-02-10",
      "normal_date": "2026-02-20",
      "days_early": 10
    }
  ]
}
```

#### GET /api/weather/alerts
Pattern deviation alerts and insights.

---

## System Architecture

### Architecture Overview

The system follows a modern three-tier architecture optimized for cost-efficiency and maintainability. A single backend serves both the manager web dashboard and worker mobile apps through a unified REST API.

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                           │
│  ┌──────────────────┐      ┌──────────────────────────┐    │
│  │  Manager Web App │      │   Worker Mobile App      │    │
│  │  (React + Vite)  │      │   (React Native/Expo)    │    │
│  └────────┬─────────┘      └────────────┬─────────────┘    │
└───────────┼──────────────────────────────┼──────────────────┘
            │          HTTPS/WSS          │
            ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API LAYER                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Node.js + Express API                  │    │
│  │    Auth │ Tasks │ Users │ Messages │ Notifications  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  PostgreSQL  │  │    Redis     │  │  S3/Spaces   │       │
│  │  (Primary DB)│  │   (Cache)    │  │   (Images)   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Manager Dashboard** | React + Vite + TypeScript | Fast dev cycle, type safety, huge ecosystem |
| **Worker Mobile App** | React Native + Expo | Single codebase for iOS/Android, OTA updates |
| **Backend API** | Node.js + Express | JavaScript everywhere, easy hiring, low cost |
| **Database** | PostgreSQL | Robust, free, excellent for relational data |
| **Cache/Realtime** | Redis | Session storage, pub/sub for live updates |
| **File Storage** | DigitalOcean Spaces / S3 | Cheap, scalable image storage |
| **Push Notifications** | Expo Push + Firebase | Free tier covers small teams |
| **Hosting** | Railway / Render / DO App Platform | Simple deployment, affordable scaling |

### Infrastructure Considerations

#### Multi-Tenancy Options

**Option 1: Schema Isolation (Recommended for shared infrastructure)**
- Single PostgreSQL database with multiple schemas
- Each organization gets dedicated schema (e.g., `turfsheet_banbury`)
- Shared infrastructure reduces costs
- Proven pattern from Taskboard project
- Cross-schema foreign keys possible for shared resources

**Option 2: Database Per Organization**
- Separate database for each golf course
- Complete data isolation
- Higher costs but simpler security model
- Better for large enterprise clients

**Option 3: Row-Level Security (RLS)**
- Single schema with RLS policies
- Filter all queries by `organization_id`
- Lowest cost, highest complexity
- Risk of data leakage if misconfigured

**Recommendation:** Start with Option 1 (schema isolation) for cost efficiency with proven data isolation.

#### Deployment Strategy

**Development:**
- Local PostgreSQL + Redis via Docker Compose
- Vite dev server for frontend (hot reload)
- Expo Go for mobile testing
- ngrok for webhook testing

**Staging:**
- Railway/Render free tier
- Supabase free tier (PostgreSQL)
- Upstash free tier (Redis)
- Test with real golf course data

**Production:**
- Railway/Render paid tier ($5-20/month)
- Supabase Pro ($25/month) or self-hosted PostgreSQL
- Upstash paid tier or self-hosted Redis
- DigitalOcean Spaces ($5/month for storage)
- CloudFlare CDN (free tier)

### Performance Considerations

#### Database Optimization
- Indexes on all foreign keys
- Composite indexes for common queries (e.g., `organization_id + scheduled_date`)
- Partial indexes for status-based queries
- Materialized views for reporting dashboards
- Connection pooling (PgBouncer)

#### Caching Strategy
- Redis for session storage
- Cache frequently accessed data (organization settings, user profiles)
- Cache invalidation on updates
- Real-time pub/sub for multi-user updates

#### Image Optimization
- Resize on upload (max 2048px width)
- WebP conversion for web display
- Thumbnail generation (200px, 400px)
- CDN for static assets
- Lazy loading in mobile app

#### Real-Time Features
- WebSocket connections for live updates
- Redis pub/sub for multi-server scaling
- Optimistic UI updates (update UI before API response)
- Conflict resolution for simultaneous edits

### Security Architecture

#### Authentication & Authorization
- **JWT Tokens:** Short-lived access tokens (15 min), long-lived refresh tokens (7 days)
- **Role-Based Access Control (RBAC):** Manager vs Worker permissions
- **Organization Scoping:** All queries filtered by `organization_id`
- **Token Rotation:** Refresh token rotation on use
- **Device Tracking:** Track active sessions per user

#### Data Security
- **Encryption at Rest:** Database-level encryption
- **Encryption in Transit:** HTTPS only, HSTS headers
- **Password Hashing:** bcrypt with salt rounds ≥ 12
- **Input Validation:** Zod schemas on all API inputs
- **SQL Injection Prevention:** Parameterized queries only
- **XSS Prevention:** Content Security Policy headers
- **CSRF Protection:** SameSite cookies, CSRF tokens

#### Rate Limiting
- **Authentication Endpoints:** 5 attempts per 15 minutes
- **API Endpoints:** 100 requests per minute per user
- **File Uploads:** 10 uploads per minute
- **Redis-based:** Distributed rate limiting

#### Audit Logging
- Log all authentication attempts
- Log all data modifications (who, what, when)
- Log equipment checkouts and returns
- Log chemical applications
- Retention: 2 years minimum for compliance

---

## Development Phases

### Phase 1: MVP Foundation (4-6 weeks)

**Goal:** Replace physical whiteboard with digital task assignment.

**Deliverables:**
- ✅ User authentication (email/password login)
- ✅ Organization setup and configuration
- ✅ Basic task creation and assignment
- ✅ Worker mobile app with task list
- ✅ Task completion with status updates
- ✅ Manager dashboard with daily view
- ✅ Push notifications for new assignments
- ✅ Blue/Orange rotation scheduling
- ✅ Part-time/weekend worker support

**Technical Tasks:**
- Set up PostgreSQL database with core tables
- Implement JWT authentication
- Build Express API with core endpoints
- Create React dashboard with task management UI
- Build React Native mobile app with Expo
- Implement scheduling algorithm (19-day rotation)
- Set up push notification service
- Deploy to staging environment

**Success Criteria:**
- Superintendent can assign tasks to workers
- Workers receive notifications and complete tasks
- Availability checking prevents scheduling conflicts
- All schedule types work correctly (Blue/Orange/Part-Time/Weekend)

### Phase 2: Core Features (3-4 weeks)

**Goal:** Add golf-specific features and equipment management.

**Deliverables:**
- ✅ Recurring task templates
- ✅ Task frequency categories (daily/alternating/weekly/as-needed)
- ✅ Alternating task groups (Fairways 1/2)
- ✅ Availability management (time-off requests)
- ✅ Course zones and visual organization
- ✅ Mowing direction tracking
- ✅ Photo uploads for task completion
- ✅ Weekly calendar view
- ✅ Equipment inventory
- ✅ Equipment checkout/checkin
- ✅ Irrigation quick-log (probe readings, hand watering)

**Technical Tasks:**
- Build task template system with RRULE
- Implement photo upload to S3/Spaces
- Create zone management UI
- Add equipment tracking tables and API
- Build irrigation logging interface
- Implement calendar view component

**Success Criteria:**
- Templates generate daily tasks automatically
- Mowing direction tracked and displayed per zone
- Equipment checkout prevents double-booking
- Irrigation logs replace paper forms

### Phase 3: Communication & Reporting (2-3 weeks)

**Goal:** Team communication and basic analytics.

**Deliverables:**
- ✅ Direct messaging between manager and workers
- ✅ Team announcements/broadcasts
- ✅ Task comments and questions
- ✅ Daily completion reports
- ✅ Worker productivity metrics
- ✅ Mowing direction history view
- ✅ Skill-based assignment suggestions
- ✅ Export capabilities (PDF/CSV)

**Technical Tasks:**
- Build messaging system with real-time updates
- Implement notification preferences
- Create reporting dashboard
- Build analytics queries
- Add export functionality

**Success Criteria:**
- Workers can ask questions on tasks
- Manager can broadcast to entire team
- Reports show productivity trends
- Mowing direction alerts prevent wear patterns

### Phase 4: Superintendent Dashboard (3-4 weeks)

**Goal:** Agronomic data tracking and weather intelligence.

**Deliverables:**
- ✅ Grass clippings tracking
- ✅ Clipping yield trends and visualizations
- ✅ Weather API integration (Open-Meteo)
- ✅ Historical weather data import
- ✅ Weather comparison (current vs 30-year normals)
- ✅ Analog year matching
- ✅ GDD tracking and projections
- ✅ Pattern alerts and insights

**Technical Tasks:**
- Integrate Open-Meteo API
- Import NOAA historical climate data
- Implement analog matching algorithm
- Build trend visualization components
- Create alert system for pattern deviations
- Build correlation analysis tools

**Success Criteria:**
- Superintendent logs clipping yields daily
- Weather insights provide actionable recommendations
- Analog years match with >0.7 correlation
- GDD projections within 5 days of actual

### Phase 5: Chemical Application Management (4-5 weeks)

**Goal:** Regulatory compliance and spray record keeping.

**Deliverables:**
- ✅ Chemical product inventory
- ✅ EPA registration and SDS tracking
- ✅ Application scheduling
- ✅ Weather-aware spray window identification
- ✅ Detailed application records
- ✅ Re-entry interval (REI) tracking
- ✅ Spray log exports for state reporting
- ✅ Applicator certification tracking

**Technical Tasks:**
- Build chemical inventory system
- Implement spray record forms
- Add weather condition capture
- Create export templates for state compliance
- Build REI countdown timers
- Add certification expiration alerts

**Success Criteria:**
- All applications logged with required data
- REI violations prevented by system
- State-compliant spray logs exportable
- Certifications tracked with renewal alerts

### Phase 6: Equipment Enhancement (2-3 weeks)

**Goal:** Advanced equipment tracking and Toro myTurf preparation.

**Deliverables:**
- ✅ Maintenance schedule tracking
- ✅ Service alert system
- ✅ Equipment usage reports
- ✅ Issue tracking with photo documentation
- ✅ Parts inventory (basic)
- ✅ Toro myTurf API integration (architecture ready)

**Technical Tasks:**
- Build maintenance scheduling system
- Implement hour-meter-based service alerts
- Create equipment analytics
- Research Toro myTurf API requirements
- Design integration architecture

**Success Criteria:**
- Service reminders appear at configured hour thresholds
- Equipment issues tracked from report to resolution
- Usage reports show hours per task/zone
- Architecture ready for Toro API when available

### Phase 7: Advanced Features (Ongoing)

**Goal:** Tournament prep, compliance, multi-course support.

**Deliverables:**
- Tournament prep mode with checklists
- Pin placement planning
- Event-day communication hub
- Regulatory compliance dashboard
- Applicator license tracking
- Audit-ready report generation
- Multi-course support for management companies
- Course comparison analytics

**Technical Tasks:**
- Build tournament workflow system
- Create compliance reporting dashboard
- Implement multi-organization hierarchy
- Build cross-course analytics

**Success Criteria:**
- Tournament prep reduces coordinator time by 50%
- Compliance reports generated in <5 minutes
- Management companies manage 5+ courses in one system

---

## Security & Compliance

### Data Protection

#### Encryption
- **At Rest:** Database-level encryption (AES-256)
- **In Transit:** TLS 1.3 for all connections
- **Passwords:** bcrypt with salt rounds ≥ 12
- **API Keys:** Encrypted in database, rotated every 90 days

#### Backup Strategy
- **Frequency:** Daily automated backups
- **Retention:** 30 days rolling + monthly archives for 1 year
- **Testing:** Monthly restore tests
- **Disaster Recovery:** RTO 4 hours, RPO 24 hours

#### Access Control
- Multi-factor authentication (optional, recommended for managers)
- Session timeout after 30 minutes of inactivity
- Device authorization (new device requires email confirmation)
- IP whitelist option for manager accounts

### Compliance Considerations

#### Pesticide Application Records (State Requirements)

Most states require:
- Applicator name and certification number
- Date and time of application
- Product name and EPA registration number
- Application rate and total amount used
- Target pest/disease
- Weather conditions (temperature, wind speed)
- Re-entry interval

**TurfSheet Implementation:**
- All required fields in ApplicationRecord model
- PDF export template matching state forms
- Automatic retention for required period (typically 2-3 years)
- Audit trail for all modifications

#### Right to Work / Worker Certifications
- Track employee certifications with expiration dates
- Alert when certifications expire
- Prevent task assignment requiring expired certifications
- Document storage for certificate copies

#### Audit Trails
- All data modifications logged with timestamp and user
- Immutable audit log (append-only)
- Query capability for compliance officers
- Export for external audits

### Privacy & GDPR Considerations

**Data Collection:**
- Minimal data collection (only what's necessary)
- Clear privacy policy and terms of service
- Opt-in for SMS and push notifications
- Right to data deletion (account deletion removes all personal data)

**Data Retention:**
- Active user data: Retained indefinitely while account active
- Deleted account data: Purged after 90 days
- Compliance records: Retained per regulatory requirements (2-3 years)
- Backup data: Excluded from purge for recovery purposes

**Third-Party Data Sharing:**
- No data sold to third parties
- Weather data shared with NOAA (anonymous)
- Push notifications via Expo/Firebase (minimal PII)
- Analytics via self-hosted instance (no external tracking)

---

## Cost Analysis

### Monthly Operating Costs (5-20 workers)

| Service | Provider | Monthly Cost |
|---------|----------|--------------|
| Backend Hosting | Railway / Render | $5 - $20 |
| PostgreSQL Database | Railway / Supabase | $0 - $10 |
| Redis Cache | Upstash | $0 (free tier) |
| File Storage (10GB) | DigitalOcean Spaces / S3 | $5 |
| Push Notifications | Expo / Firebase | $0 (free tier) |
| Weather API | Open-Meteo | $0 (free) |
| Domain + SSL | Cloudflare | $1/month ($10/year) |
| **TOTAL** | | **$11 - $36/month** |

### Scaling Costs

**Medium Course (20-50 workers):**
- Backend: $20-40/month
- Database: $25-50/month
- Redis: $10/month
- Storage: $10-20/month
- **Total: $65-120/month**

**Large Course / Management Company (50+ workers):**
- Backend: $50-100/month
- Database: $100-200/month (dedicated instance)
- Redis: $20-40/month
- Storage: $30-50/month
- **Total: $200-390/month**

### Comparison to Competitors

| Product | Monthly Cost | Notes |
|---------|--------------|-------|
| **TurfSheet** | $11-36 | Small teams |
| Whiteboard Apps | $50-200 | Per organization |
| Golf Course Management Systems | $200-500 | Limited task features |
| Custom Development | $5,000-20,000 | One-time + maintenance |

**Value Proposition:** TurfSheet runs at 10-20% of typical whiteboard app pricing while providing golf-specific features competitors lack.

### Development Cost Estimate

**Phase 1 MVP (4-6 weeks):**
- Developer time: 160-240 hours @ $75/hr = $12,000-18,000
- Infrastructure setup: $500
- **Total: $12,500-18,500**

**Phases 2-4 (8-11 weeks):**
- Developer time: 320-440 hours @ $75/hr = $24,000-33,000
- **Total: $24,000-33,000**

**Full Product (Phases 1-6):**
- Developer time: 600-800 hours
- **Total: $45,000-60,000**

**Alternative: Phased Self-Development**
- Build MVP in-house over 3-6 months
- Hire part-time developer for $3,000-5,000/month
- Lower upfront cost, longer timeline

---

## Success Criteria

### MVP Launch (End of Phase 1)

**Adoption Metrics:**
- ✅ 100% of crew receives mobile app login
- ✅ 80% of crew completes at least one task via app
- ✅ Superintendent assigns 90% of tasks via dashboard (vs whiteboard)
- ✅ 50% of tasks marked complete on same day

**Technical Metrics:**
- ✅ Page load time <2 seconds
- ✅ Mobile app startup time <3 seconds
- ✅ API response time p95 <500ms
- ✅ Push notification delivery within 30 seconds
- ✅ Zero data loss incidents
- ✅ 99.5% uptime

**User Satisfaction:**
- ✅ Superintendent rates system 4/5 or higher
- ✅ 70% of workers prefer app over whiteboard
- ✅ Zero "showstopper" bugs preventing daily use

### 6-Month Success (End of Phase 4)

**Adoption Metrics:**
- ✅ 100% of tasks assigned via TurfSheet (whiteboard retired)
- ✅ 95% of tasks completed with status update
- ✅ 80% of completed tasks include photos
- ✅ Superintendent logs clippings 5+ days per week
- ✅ Irrigation quick-log used daily
- ✅ Equipment checkout system replaces paper log

**Operational Impact:**
- ✅ Task assignment time reduced by 75% (30 min → 7 min)
- ✅ Zero missed tasks due to scheduling conflicts
- ✅ Historical data enables trend analysis
- ✅ Weather insights used in at least 2 agronomic decisions

**Business Value:**
- ✅ System pays for itself via time savings ($36/month cost vs $100+ in superintendent time saved)
- ✅ Compliance records maintained for audits
- ✅ Mowing direction tracking prevents turf damage
- ✅ Equipment maintenance alerts prevent breakdowns

### 1-Year Success (Full Product)

**Adoption Metrics:**
- ✅ Multi-course deployment (if management company)
- ✅ Chemical application logs replace paper forms
- ✅ Tournament prep mode used for events
- ✅ New employees onboarded via system (not verbal)

**Operational Impact:**
- ✅ Analog weather matching influences 10+ agronomic decisions
- ✅ Equipment downtime reduced by 25% (proactive maintenance)
- ✅ Compliance audit completed in <30 minutes (vs 4+ hours)
- ✅ Mowing wear patterns eliminated

**Business Value:**
- ✅ Superintendent recommends TurfSheet to peers
- ✅ System critical to daily operations (cannot revert to whiteboard)
- ✅ ROI >500% (time savings + prevented damage)
- ✅ Feature requests drive roadmap (active user engagement)

---

## Appendix

### Glossary of Golf Course Terms

- **GDD (Growing Degree Days):** Cumulative measure of heat units used to predict plant development
- **HOC (Height of Cut):** Mowing height in millimeters
- **REI (Re-Entry Interval):** Time after pesticide application before area is safe to enter
- **Syringe:** Light irrigation to cool turf on hot days (not deep watering)
- **Poa annua:** Annual bluegrass, common weed in golf course turf
- **Dollar Spot:** Fungal disease affecting turf in warm, humid conditions
- **Pythium:** Fungal disease favored by wet conditions
- **PGR (Plant Growth Regulator):** Chemical that slows grass growth

### References

**Weather Data Sources:**
- NOAA Climate Data Online: https://www.ncdc.noaa.gov/cdo-web/
- Open-Meteo API: https://open-meteo.com/
- Visual Crossing Weather API: https://www.visualcrossing.com/

**Golf Course Management:**
- Golf Course Superintendents Association of America (GCSAA): https://www.gcsaa.org/
- USGA Green Section: https://www.usga.org/course-care.html

**Regulatory:**
- EPA Pesticide Registration: https://www.epa.gov/pesticide-registration
- State Pesticide Applicator Licensing (varies by state)

**Technology:**
- Toro myTurf: https://www.toro.com/myturf (equipment telematics)
- iCal RRULE Specification: https://icalendar.org/iCalendar-RFC-5545/3-8-5-3-recurrence-rule.html

### Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-26 | Initial PRD based on TurfSheet architecture and Taskboard implementation | Claude + User |
| 1.1 | 2026-01-26 | User feedback integration: Clock-based mowing directions (6/12, 2/8, 10/4, 9/3); Team groups for targeted messaging; Self-service task selection for workers; Schedule flexibility features (call-outs, off-day coverage); Device-based measurements (firmness, clippings weight); Directional icons for mowing history; Chemical product enhancements (SDS lookup, usage predictor) | Claude + User |

---

**Document Status:** Draft for Review
**Next Review Date:** 2026-02-02
**Owner:** Product Team
**Stakeholders:** Golf Course Superintendents, Development Team, Operations
