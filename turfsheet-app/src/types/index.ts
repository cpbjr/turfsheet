// ============================================================
// Job Templates (primary jobs library)
// ============================================================

export interface Job {
  id: string;
  title: string;
  description?: string;
  crew_needed: number;
  priority?: 'Low' | 'Normal' | 'High' | 'Urgent';
  section?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Staff
// ============================================================

export interface Staff {
  id: string;
  role: string;
  name: string;
  telephone: string;
  telegram_id: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Daily Board (metadata for the day)
// ============================================================

export interface DailyBoard {
  id: string;
  board_date: string; // ISO date YYYY-MM-DD
  sunrise_time?: string; // HH:MM format
  announcements?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Daily Assignments (one primary job per staff per date)
// ============================================================

export interface DailyAssignment {
  id: string;
  staff_id: string;
  job_id: string;
  assignment_date: string; // ISO date YYYY-MM-DD
  notes?: string;
  completed_at?: string; // ISO timestamp, null = in progress
  created_at: string;
  updated_at: string;
}

export interface DailyAssignmentWithDetails extends DailyAssignment {
  job: Job;
}

// One row on the whiteboard: staff + their one primary job
export interface WhiteboardRow {
  staff: Staff;
  primaryJob?: DailyAssignmentWithDetails;
}

// ============================================================
// Second Job Board (free-text daily task list)
// ============================================================

export interface SecondJobBoardItem {
  id: string;
  board_date: string; // ISO date YYYY-MM-DD
  description: string; // Free text as the super writes it
  sort_order: number;
  priority?: string; // Single letter A-Z, null = not yet prioritized
  grabbed_by?: string; // staff_id who grabbed it, null = available
  grabbed_at?: string; // ISO timestamp, null = available
  carried_from?: string; // ISO date if carried over, null = new today
  created_at: string;
  updated_at: string;
}

// With joined staff details for display
export interface SecondJobBoardItemWithStaff extends SecondJobBoardItem {
  staff?: Staff; // The person who grabbed it (null if ungrabbed)
}

// ============================================================
// Staff Skills (capability tracking)
// ============================================================

export type SkillSource = 'hardcoded' | 'learned';

export interface StaffSkill {
  id: string;
  staff_id: string;
  skill_name: string;
  source: SkillSource;
  times_completed: number;
  last_completed_at?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Project Board (superintendent's project backlog)
// ============================================================

export interface ProjectSection {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export type ProjectStatus = 'active' | 'completed' | 'on_hold';

export interface Project {
  id: string;
  section_id: string;
  title: string;
  priority?: string; // Single letter A-Z (matches whiteboard)
  description?: string;
  status: ProjectStatus;
  estimated_start_date?: string;
  estimated_end_date?: string;
  estimated_hours?: number;
  estimated_cost?: number;
  actual_cost?: number;
  estimated_crew_size?: number;
  required_roles?: string;
  notes?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
