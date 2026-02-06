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
