// Job types
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

// Staff types
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

// Daily Assignment types
export type JobOrder = 1 | 2;
export type Priority = string; // Single letter A-Z (validated in DB)

export interface DailyAssignment {
  id: string;
  staff_id: string;
  job_id: string;
  assignment_date: string; // ISO date (YYYY-MM-DD)
  job_order: JobOrder;
  priority?: Priority; // Single uppercase letter A-Z
  notes?: string;
  created_at: string;
  updated_at: string;
}

// For display with joined job details
export interface DailyAssignmentWithDetails extends DailyAssignment {
  job: Job;
}

// Whiteboard row (one per staff member)
export interface WhiteboardRow {
  staff: Staff;
  job1?: DailyAssignmentWithDetails;
  job2?: DailyAssignmentWithDetails;
}

// Second Job Board types
export type BoardItemStatus = 'pending' | 'assigned';

export interface SecondJobBoard {
  id: string;
  job_id: string;
  board_date: string; // ISO date (YYYY-MM-DD)
  rank: number;
  status: BoardItemStatus;
  created_at: string;
  updated_at: string;
}

// With joined job details
export interface SecondJobBoardWithDetails extends SecondJobBoard {
  job: Job;
}

// Second Job Assignment (links board items to staff)
export interface SecondJobAssignment {
  id: string;
  board_item_id: string;
  staff_id: string;
  created_at: string;
}

// With joined staff details
export interface SecondJobAssignmentWithStaff extends SecondJobAssignment {
  staff: Staff;
}

// Full board item with job + assignments
export interface SecondJobBoardFull extends SecondJobBoardWithDetails {
  assignments: SecondJobAssignmentWithStaff[];
}
