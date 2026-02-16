# TurfSheet Implementation Plan Summary

## Overview

Based on GreenKeeper WhiteBoard screenshots and the TurfSheet PRD, this document outlines the implementation approach for building a golf course maintenance task management system.

---

## Reference Site Analysis (GreenKeeper WhiteBoard)

### Key UI Patterns Observed

#### 1. Main Dashboard Layout (IMG_4367)
**Left Sidebar Navigation:**
- Home icon
- Calendar
- Staff/Crew management
- Course zones/areas
- Reports/Analytics
- Equipment
- Financial ($)
- Chemistry/Applications (flask icon)
- Flag/Pin placement
- Undo/History
- Graduation cap (Training/Certifications)
- Credit card icon
- Settings (gear)
- Logout
- User profile

**Main Content Area:**
- Date selector with arrows (Wed Feb 5, 2025)
- Workday time display (05:30 AM-2:30 PM)
- Task board with categories:
  - **First Jobs** - High priority morning tasks
  - **Second Jobs** - Afternoon/secondary tasks
  - **Third Jobs** - Additional/as-needed tasks
  - **Additional Jobs** - One-off assignments

**Task Cards (Green):**
- Title (e.g., "Mow Greens", "Mow Fairways")
- Mow Direction with visual indicator
- Clean Up direction (Clockwise, Counter-Clockwise)
- HOC (Height of Cut) measurement
- Crew Needed count
- "Assign Crew" button
- Close (X) button
- Visual mowing pattern icons

**Right Sidebar:**
- Help button (orange)
- "Display Mode" toggle
- "Add A Job" button
- "Add & Manage Equipment" button
- "Add Staff" button
- **Staff Schedule Panel:**
  - Shows current week date range
  - Staff list with individual schedules
  - "Enter Weekly Schedule Here" links for each person
  - On/Off toggles for availability

#### 2. Schedule Management Modal (IMG_4368)
**Weekly Schedule Interface:**
- Staff member name at top (Bill Kreuser)
- Date picker to select week
- Weekly calendar view:
  - Each day shows On/Off toggle
  - Start Time field (05:30 AM)
  - End Time field (02:30 PM)
  - Consistent across weekdays
  - Different times for weekends
- Save button at bottom

**Key Features:**
- Visual toggle switches (green = On)
- Time pickers for each day
- Flexible scheduling per person
- Easy week navigation

#### 3. Job Selection Dialog (IMG_4369, IMG_4370)
**Add Job Interface:**
- Dropdown to "Choose a Job"
- Pre-populated job library:
  - Mow Greens
  - Spray Greens
  - Roll Greens
  - Fertilize Greens
  - Topdress Greens
  - Aerate Greens
  - Hand Water Greens
  - Check Soil Moisture Levels of Greens
- "Add New Job Type" link
- "Assign Crew" button (orange)

**Job Details Form (IMG_4370):**
- Job Type selector (Mow Greens)
- "Add New Job Type" link
- Notes field (multi-line text)
- Date picker (02/05/2025)
- Job Order dropdown (First Job, Second Job, etc.)
- **Mow Direction** dropdown:
  - Left to Right (8-2)
  - Side to Side (3-9)
  - 50:50 Split (Tuxedo)
- **Clean Up** dropdown:
  - No Cleanup
  - Clockwise
  - Counter-Clockwise
  - Pull Clean
  - Push Clean
- **Visual Mowing Pattern Reference:**
  - Shows 8 different mowing patterns with diagrams
  - Patterns: Standard, Contour, Push, Double Cut (2 variations), Circle Cut, No Cleanup
  - **Text overlay: "Over 80 Mowing Patterns"**
- HOC field (0.125)
- Groomers field
- Save button (green)

#### 4. Equipment Management (IMG_4372)
**Equipment Fleet Panel:**
- Accordion/collapsible list:
  - ▼ Toro Flex 21 #1
  - ▼ Toro Flex 21 #2
  - ▼ Toro Flex 21 #3
  - ▼ Toro Flex 21 #4
  - ▼ J. Deere Fairway Mower #1
  - ▼ J. Deere Fairway Mower #2
  - ▼ J. Deere Fairway Mower #3
  - ▼ J. Deere Fairway Mower #4
  - ▼ Jac TriPlex #1
  - ▼ Jac Triplex #2
  - ▼ Tee Triplex
  - ▼ Salsco Roller 1
- "Add New Equipment" button at top

**Visual Overlay Text:**
"Manage Course Equipment Fleet"

**Assigned Equipment Display:**
- Jobs show crew assignments with equipment
- Example: "Doug Soldat - Toro Flex 21 #1 - Start Putting Green, 1, Leapfrog"

#### 5. Crew Assignment Modal (IMG_4373)
**Assignment Interface:**
- Title: "Assign Crew"
- "Staff Required" field (numeric input: 2)
- **Position 1:**
  - Staff selector (Bill Kreuser)
  - "Hire Equipment & Notes" link
  - Equipment dropdown
  - Notes field
- **Position 2:**
  - Staff selector
  - Same equipment/notes options
- Cancel button (red)
- Save button (green)

**Visual Overlay Text:**
"Quickly Assign Staff to Jobs, Equipment, and Routes"

#### 6. Marketing/Landing Page Elements

**IMG_4374 - Hero Section:**
- Headline: "Connect your Team with your Agronomic Program"
- Subheadline: "GreenKeeper WhiteBoard"
- Beautiful golf course aerial photo
- Green striped fairway with sand bunker

**IMG_4375, IMG_4376 - Feature List:**
- **MANAGE STAFF SCHEDULES**
  - Use interactive tools to assign jobs based on staff availability and skill level
  - Receive feedback about each employee's training, rotation, and schedule that might affect their ability to perform a specific job
  - An easy-to-use management portal makes it simple to adjust jobs from your mobile device or computer

- **CUSTOMIZE JOB TEMPLATES**
  - Select from dozens of job templates or customize your own unique jobs or tasks
  - Jobs can be split or grouped across employees or management zones
  - Employees can also be assigned to multiple jobs across the same time span throughout the day

- **ALIGN LABOR WITH AGRONOMIC PLAN**
  - Assign staff to spray and link the application to your sprayer records
  - Link cultivation jobs to the cultivation view in Program Builder's interactive calendar

- **CONNECT TO GREENKEEPER APP**
  - Add unlimited users and assign different access levels to GreenKeeper App
  - Enable select employees to enter data into Performance Tracker

- **ASSIGN EQUIPMENT TO JOBS**
  - Add your equipment and assign it to specific employees or jobs

- **GENERATE CUSTOM REPORTS**
  - Generate reports of labor by employee, job, or amount of time at the course

**IMG_4377 - Multiple Views:**
- Desktop/tablet view showing full task board
- Mobile-responsive design
- Text: "MULTIPLE VIEWS"
- Description: "GreenKeeper WhiteBoard has both an employee facing view that projects onto a screen in your maintenance facility and also offers an easy-to-use manager portal that is desktop and mobile friendly to adjust jobs"
- "GET STARTED" button (green)

---

## Key Features to Implement

### Phase 1: Core Whiteboard (MVP)

#### 1.1 Dashboard Layout
**Implementation:**
- Left sidebar navigation (collapsible on mobile)
- Main content area with date selector
- Task board with drag-and-drop zones:
  - First Jobs (morning priority)
  - Second Jobs (afternoon)
  - Additional Jobs (as-needed)
- Right sidebar with quick actions and staff schedule

**Tech Stack:**
- React + Vite + TypeScript
- TailwindCSS for styling
- shadcn/ui for components
- react-beautiful-dnd for drag-and-drop

**Design Notes:**
- Green color scheme (#10b981 primary)
- Card-based task layout
- Visual mowing direction indicators
- Clear crew assignment display

#### 1.2 Task Management
**Features:**
- Create tasks from job templates
- Assign to specific crew members
- Set mowing direction (12 positions: 12/6, 1/7, 2/8, 3/9, 4/10, 5/11, etc.)
- Set cleanup pattern (Clockwise, Counter-Clockwise, Pull, Push, None)
- HOC (Height of Cut) tracking
- Notes field for special instructions

**Job Categories:**
- Greens (Mow, Spray, Roll, Fertilize, etc.)
- Fairways
- Tees & Approaches
- Bunkers
- Rough
- Practice Areas
- Clubhouse Grounds

**Visual Patterns:**
- Display 80+ mowing patterns with diagrams
- Icon-based direction indicators
- Pattern library modal

#### 1.3 Staff Scheduling
**Weekly Schedule Interface:**
- Individual schedules per staff member
- Day-by-day toggles (On/Off)
- Time range selectors (Start/End)
- Visual availability indicators
- Support for Blue/Orange 19-day rotation
- Part-time/Weekend worker schedules

**Integration with PRD:**
- Map to `User.schedule_type` and `specific_days`
- Calculate availability using rotation algorithm
- Override system for call-outs and exceptions

#### 1.4 Equipment Management
**Fleet Inventory:**
- Accordion list of all equipment
- Equipment categories (Mowers, Utility, Sprayers, etc.)
- Assignment to jobs and crew
- Visual indicators for checked-out equipment

**Checkout System:**
- Quick checkout from task assignment
- Equipment dropdown during crew assignment
- Prevent double-booking
- Return/check-in tracking

### Phase 2: Mobile App & Communication

#### 2.1 Worker Mobile App
**Key Screens:**
1. **Daily Task List:**
   - Cards showing assigned tasks
   - Visual mowing direction icons
   - Equipment assigned
   - Notes from manager
   - Status indicators (Pending, In Progress, Complete)

2. **Task Detail:**
   - Full job description
   - Mowing pattern diagram
   - Equipment details
   - Photo upload for completion
   - Comment/question feature

3. **Equipment Checkout:**
   - Available equipment list
   - Quick scan/select to checkout
   - Hour meter entry
   - Issue reporting

**Tech Stack:**
- React Native + Expo
- Same UI components as web (shared library)
- Push notifications (Expo Push)
- Camera integration for photos

#### 2.2 Real-Time Updates
**Features:**
- WebSocket connection for live task updates
- Manager assigns task → Worker sees notification
- Worker completes task → Manager sees update
- Broadcast messages to all crew

**Implementation:**
- Redis pub/sub for multi-server support
- Optimistic UI updates
- Offline queue for poor connectivity

### Phase 3: Agronomic Data & Reporting

#### 3.1 Irrigation Quick-Log
**Features:**
- Probe reading entry by green
- Moisture meter values
- Hand watering log (duration, location)
- Syringe cycles
- Dry spot tracking with photos
- Historical patterns by green

**UI Design:**
- Quick-entry form (optimized for mobile)
- Green selector with visual map
- Time stamps
- Photo documentation

#### 3.2 Clipping Yield Tracking
**Features:**
- Daily weight entry
- Trend visualization (line charts)
- Moving averages (7-day, 14-day)
- Correlation with weather
- Alerts for unusual patterns

#### 3.3 Mowing Direction History
**Features:**
- Visual calendar showing direction changes
- Per-zone tracking
- Alerts for consecutive same-direction mowing
- Recommendations for next direction
- Pattern wear prevention

**UI Design:**
- Calendar grid with direction arrows
- Color coding for zones
- Pattern analysis dashboard

### Phase 4: Weather Intelligence

#### 4.1 Current Conditions & Forecast
**Data Source:** Open-Meteo API (free)

**Display:**
- 7-14 day forecast
- Hourly detail
- Spray window identification
- Temperature/precipitation trends

#### 4.2 Historical Comparison
**Features:**
- Current vs 30-year normals
- GDD accumulation tracking
- Deviation alerts
- Pattern recognition

#### 4.3 Analog Year Matching
**Algorithm:**
- Load NOAA historical data (30 years)
- Calculate correlation scores
- Surface top 3 analog years
- Display "what happened next"
- Actionable insights

**Example Display:**
```
"2026 is tracking like 2015 (correlation: 0.87)

In 2015, early warmth led to frost damage in late Feb.
Consider delaying spring fertilization."
```

---

## Visual Design System

### Color Palette (from GreenKeeper)
- **Primary Green:** #10b981 (task cards, buttons)
- **Secondary Orange:** #f59e0b (help, warnings)
- **Gray Backgrounds:** #f3f4f6 (off-duty staff)
- **White:** #ffffff (cards, modals)
- **Dark Text:** #1f2937
- **Muted Text:** #6b7280

### Typography
- **Headers:** Inter or Roboto (bold)
- **Body:** Inter or Roboto (regular)
- **Monospace:** Roboto Mono (for HOC, measurements)

### Iconography
- Custom mowing pattern SVGs (80+ patterns)
- Equipment icons
- Weather icons
- Navigation icons (Font Awesome or Lucide)

### Component Library
- shadcn/ui base components
- Custom task cards
- Custom mowing pattern selector
- Custom calendar components
- Custom staff schedule grid

---

## Database Schema Mapping

### From PRD to GreenKeeper Patterns

**Organizations** → Course settings, rotation config
**Users** → Staff with schedules (weekly On/Off + times)
**Zones** → Course areas (Greens, Fairways, etc.)
**TaskTemplates** → Job library (Mow Greens, Spray Greens, etc.)
**Tasks** → Daily assigned jobs with crew, equipment, direction
**Equipment** → Fleet inventory with checkout status
**IrrigationLogs** → Probe readings, hand watering
**ClippingRecords** → Daily yield measurements
**WeatherReadings** → API data + manual observations

### Key Additions from GreenKeeper
1. **Job Order** field (First Jobs, Second Jobs, etc.)
2. **Weekly Schedule** pattern (vs just rotation)
3. **Mowing Pattern Library** (80+ visual patterns)
4. **Equipment Assignment** at task level
5. **Time Range** per day per worker
6. **Notes per position** in crew assignment

---

## Implementation Priorities

### Week 1-2: Foundation
- [ ] Set up React + Vite project
- [ ] Install TailwindCSS + shadcn/ui
- [ ] Create basic layout (sidebar, main content, right panel)
- [ ] Implement date selector
- [ ] Build task card component

### Week 3-4: Task Management
- [ ] Job template library
- [ ] "Add Job" modal with all fields
- [ ] Mowing direction selector (12 positions)
- [ ] Cleanup pattern selector
- [ ] HOC entry
- [ ] Notes field
- [ ] Save to database

### Week 5-6: Staff & Scheduling
- [ ] Staff list management
- [ ] Weekly schedule interface (On/Off toggles + times)
- [ ] Crew assignment modal
- [ ] Equipment dropdown integration
- [ ] Position-based assignment (Position 1, Position 2, etc.)
- [ ] Availability calculation

### Week 7-8: Equipment
- [ ] Equipment inventory table
- [ ] Accordion UI for equipment list
- [ ] Checkout/check-in system
- [ ] Equipment assignment in task creation
- [ ] Issue reporting

### Week 9-10: Mobile App (MVP)
- [ ] Set up React Native + Expo project
- [ ] Daily task list screen
- [ ] Task detail screen
- [ ] Photo upload
- [ ] Push notifications setup
- [ ] Task completion flow

### Week 11-12: Polish & Testing
- [ ] Drag-and-drop task reordering
- [ ] Real-time updates (WebSockets)
- [ ] Responsive design refinements
- [ ] User testing with golf course
- [ ] Bug fixes
- [ ] Deployment

---

## Technical Architecture

### Frontend (Manager Dashboard)
```
turfsheet-web/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── RightPanel.tsx
│   │   ├── tasks/
│   │   │   ├── TaskCard.tsx
│   │   │   ├── TaskBoard.tsx
│   │   │   ├── AddJobModal.tsx
│   │   │   ├── AssignCrewModal.tsx
│   │   │   └── MowingPatternSelector.tsx
│   │   ├── staff/
│   │   │   ├── StaffSchedule.tsx
│   │   │   ├── WeeklyScheduleModal.tsx
│   │   │   └── AvailabilityIndicator.tsx
│   │   ├── equipment/
│   │   │   ├── EquipmentList.tsx
│   │   │   ├── EquipmentAccordion.tsx
│   │   │   └── CheckoutForm.tsx
│   │   └── ui/ (shadcn components)
│   ├── lib/
│   │   ├── api.ts
│   │   ├── scheduling.ts (rotation algorithm)
│   │   └── utils.ts
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Reports.tsx
│   │   ├── Settings.tsx
│   │   └── Login.tsx
│   └── App.tsx
```

### Backend (Node.js + Express)
```
turfsheet-api/
├── src/
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── tasks.ts
│   │   ├── users.ts
│   │   ├── equipment.ts
│   │   ├── templates.ts
│   │   └── zones.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   └── validation.ts
│   ├── models/
│   │   ├── Task.ts
│   │   ├── User.ts
│   │   └── Equipment.ts
│   ├── services/
│   │   ├── scheduling.ts
│   │   ├── notifications.ts
│   │   └── weather.ts
│   └── server.ts
```

### Mobile App (React Native)
```
turfsheet-mobile/
├── src/
│   ├── screens/
│   │   ├── TaskList.tsx
│   │   ├── TaskDetail.tsx
│   │   ├── Equipment.tsx
│   │   └── Profile.tsx
│   ├── components/
│   │   ├── TaskCard.tsx
│   │   ├── MowingDirectionIcon.tsx
│   │   └── PhotoUpload.tsx
│   ├── navigation/
│   │   └── AppNavigator.tsx
│   └── App.tsx
```

---

## Key Differentiators from PRD

### 1. Job Categories vs Task Frequency
**GreenKeeper approach:**
- First Jobs / Second Jobs / Third Jobs / Additional Jobs
- Emphasizes **priority** and **timing** within the day
- More intuitive for daily scheduling

**PRD approach:**
- DAILY / ALTERNATING / WEEKLY / AS_NEEDED
- Emphasizes **recurrence pattern**
- Better for long-term planning

**Recommendation:** Implement BOTH
- Job Order: First/Second/Third (for daily view)
- Frequency Category: Daily/Alternating/Weekly (for template recurrence)

### 2. Weekly Schedules vs Rotation
**GreenKeeper:**
- Shows weekly schedule with On/Off toggles + time ranges
- Very visual and flexible

**TurfSheet PRD:**
- 19-day Blue/Orange rotation
- Calculated automatically

**Recommendation:** Hybrid approach
- Use rotation algorithm for Blue/Orange crews
- Display as weekly schedule in UI
- Allow manual overrides per day

### 3. Mowing Patterns Library
**GreenKeeper:**
- 80+ visual mowing patterns
- Diagrams showing pattern
- Named patterns (Contour, Push, Circle Cut, etc.)

**TurfSheet PRD:**
- Simple 8-direction compass (N, NE, E, SE, S, SW, W, NW)

**Recommendation:** Expand PRD
- Add pattern library with diagrams
- Map patterns to clock directions (12/6, 1/7, 2/8, etc.)
- Allow custom pattern creation

### 4. Equipment Assignment
**GreenKeeper:**
- Equipment assigned during crew assignment
- Shows equipment in task card
- Visual fleet management

**TurfSheet PRD:**
- Equipment checkout separate from task assignment
- Tracked in equipment_logs table

**Recommendation:** Both workflows
- Quick assign during task creation (GreenKeeper style)
- Also support standalone checkout (PRD style)
- Link checkout logs to tasks

---

## API Endpoints (Enhanced from PRD)

### Tasks
```
GET    /api/tasks?date=2026-01-26&job_order=FIRST
POST   /api/tasks (with job_order, mowing_pattern_id)
PUT    /api/tasks/:id/assign-crew (multi-position assignment)
```

### Staff
```
GET    /api/users/:id/weekly-schedule
PUT    /api/users/:id/weekly-schedule (update On/Off + times)
GET    /api/users/available?date=2026-01-26&time=06:00
```

### Equipment
```
GET    /api/equipment?status=AVAILABLE
POST   /api/equipment/:id/assign-to-task
```

### Templates
```
GET    /api/templates/job-library (categorized by zone type)
POST   /api/templates (include mowing_pattern_id)
```

### Mowing Patterns
```
GET    /api/mowing-patterns (80+ patterns with SVG diagrams)
POST   /api/mowing-patterns (custom pattern creation)
```

---

## UI/UX Recommendations

### 1. Task Card Design
- **Visual hierarchy:**
  - Title (large, bold)
  - Zone color stripe on left edge
  - Mowing direction icon (prominent)
  - Crew assignment (avatars)
  - Equipment (icon + name)
  - Notes (truncated, expandable)

### 2. Drag-and-Drop
- Reorder tasks within job categories
- Move tasks between First/Second/Third jobs
- Visual feedback during drag
- Auto-save on drop

### 3. Mowing Pattern Selector
- Modal with grid of pattern icons
- Search/filter by name
- Visual preview on hover
- Recently used patterns at top

### 4. Staff Schedule Interface
- Weekly grid view
- Toggle switches for On/Off (green = working)
- Time pickers inline
- Copy previous week button
- Highlight conflicts (double-booked)

### 5. Equipment Fleet
- Accordion with count badges (4 Toro Flex 21s)
- Status indicators (Available, In Use, Maintenance)
- Quick checkout button
- Filter by type/status

### 6. Mobile-First Features
- Swipe to complete tasks
- Quick photo capture
- Voice-to-text for notes
- Offline mode with sync

---

## Success Metrics (from GreenKeeper)

### Adoption
- 100% of daily tasks assigned via system (whiteboard retired)
- 95% of crew uses mobile app daily
- 80% of tasks include photo documentation

### Time Savings
- Task assignment: 30 min → 5 min (83% reduction)
- Equipment checkout: 15 min → 2 min (87% reduction)
- Schedule management: 45 min/week → 10 min/week (78% reduction)

### Data Quality
- 100% of mowing directions tracked
- 90%+ irrigation logs completed daily
- Historical data enables trend analysis

### User Satisfaction
- Superintendent rates 4.5/5 or higher
- 85%+ of crew prefer app over whiteboard
- Zero showstopper bugs preventing daily use

---

## Next Steps

1. **Review with stakeholders** - Validate GreenKeeper patterns vs PRD approach
2. **Design mockups** - Create high-fidelity designs based on GreenKeeper UI
3. **Database schema updates** - Add job_order, mowing_pattern_id, weekly_schedule fields
4. **Create mowing pattern library** - Design 80+ SVG pattern diagrams
5. **Set up development environment** - React + Vite + shadcn/ui + Expo
6. **Begin Phase 1 implementation** - Dashboard layout + task management

---

## Appendix: GreenKeeper Screenshot Analysis

| Screenshot | Key Insights |
|------------|--------------|
| IMG_4367 | Main dashboard layout, task board structure, staff panel |
| IMG_4368 | Weekly schedule modal with On/Off toggles and time ranges |
| IMG_4369 | Job selection dropdown, job library structure |
| IMG_4370 | Detailed job creation form with mowing patterns |
| IMG_4371 | Visual mowing pattern library (80+ patterns) |
| IMG_4372 | Equipment fleet accordion, equipment assignment |
| IMG_4373 | Crew assignment modal with multi-position support |
| IMG_4374 | Marketing hero, course photo, branding |
| IMG_4375-76 | Feature descriptions, use cases |
| IMG_4377 | Multiple views (desktop/mobile), responsive design |

---

**Document Version:** 1.0
**Date:** 2026-01-26
**Author:** Implementation Planning Team
**Status:** Ready for Review
