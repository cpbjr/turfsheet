# TurfSheet PRD: Staff & Scheduling System

> Extracted from PRD.md lines 108-182. Source of truth: [PRD.md](../../PRD.md)

### 2. Staff & Scheduling System

**Purpose:** Handle complex mixed-workforce scheduling with multiple schedule types.

#### Schedule Types Supported

**A. Blue/Orange 19-Day Rotation (Full-Time Crews)**

This is a complementary rotation system ensuring continuous coverage:

- **Cycle Pattern:** 5 days on -> 3 days off -> 11 days on -> 3 days off (19 days total)
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
  - **Emoji badges** = Schedule type (Blue, Orange, M/W/F, Weekend)
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
