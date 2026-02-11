# TurfSheet PRD: User Roles & Personas

> Extracted from PRD.md lines 546-637. Source of truth: [PRD.md](../../PRD.md)

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
