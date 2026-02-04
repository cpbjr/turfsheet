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
