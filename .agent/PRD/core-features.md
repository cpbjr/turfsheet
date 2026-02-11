# TurfSheet PRD: Task Management

> Extracted from PRD.md lines 69-106. Source of truth: [PRD.md](../../PRD.md)

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
