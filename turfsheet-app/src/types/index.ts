// ============================================================
// Job Templates (primary jobs library)
// ============================================================

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type MowDirection = '12-6' | '2-8' | '3-9' | '4-10';
export type MowPattern = 'Double Cut (Cross)' | 'Double Cut (Parallel)' | 'No Cleanup';
export type JobType = 'General' | 'Mowing';

export interface Job {
  id: string;
  title: string;
  description?: string;
  crew_needed: number;
  priority?: 'Low' | 'Normal' | 'High' | 'Urgent';
  section: 'First Jobs' | 'Second Jobs';
  is_scheduled: boolean;
  scheduled_days: DayOfWeek[];
  job_type: JobType;
  mow_direction?: MowDirection;
  hoc?: number;
  mow_pattern?: MowPattern;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Scheduled Job Queue (auto-populated daily inbox)
// ============================================================

export interface ScheduledJobQueue {
  id: string;
  job_id: string;
  queue_date: string; // ISO date YYYY-MM-DD
  dismissed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScheduledJobQueueWithJob extends ScheduledJobQueue {
  job: Job;
}

// ============================================================
// Staff
// ============================================================

export interface Staff {
  // TODO: the DB column is SERIAL, so this arrives as a number at runtime.
  // Correcting it cascades into DailyAssignment.staff_id and the whiteboard
  // components - a repo-wide id-type sweep is its own task. Compare with
  // sameId() from lib/utils until then.
  id: string;
  role: string;
  sort_order: number; // Hierarchical rank for display order (1=highest)
  name: string;
  telephone: string;
  telegram_id: string;
  /** Idaho applicator license; autofills the log per IDAPA 02.03.03.101.01(m). */
  applicator_license?: string;
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

// Schedules (default and staff-specific)
// ============================================================

export interface DaySchedule {
  isOn: boolean;
  startTime: string; // HH:MM format (e.g., "07:30")
  endTime: string;   // HH:MM format (e.g., "14:30")
}

export interface WeeklySchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

// Global default schedule (single row in database)
export interface DefaultSchedule extends WeeklySchedule {
  id: string;
  created_at: string;
  updated_at: string;
}

// Staff-specific schedule (one per staff member)
export interface StaffSchedule extends WeeklySchedule {
  id: string;
  staff_id: string;
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

// ============================================================
// Equipment (inventory management)
// ============================================================

export interface Equipment {
  id: string;
  name: string;
  equipment_number?: string;
  category: 'Mowers' | 'Carts' | 'Tools' | 'Other';
  model?: string;
  manufacturer?: string;
  description?: string;
  status: 'Active' | 'Maintenance' | 'Retired';
  purchase_date?: string;
  purchase_cost?: number;
  maintenance_notes?: string;
  last_serviced_date?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Chemical Products (product library for spray calculations)
// ============================================================

export type ChemicalProductType =
  | 'FERTILIZER'
  | 'HERBICIDE'
  | 'FUNGICIDE'
  | 'INSECTICIDE'
  | 'PGR'
  | 'ALGAECIDE'
  | 'IRON_SUPPLEMENT'
  | 'SURFACTANT'
  | 'OTHER';

export type RateUnit = 'oz/1000sqft' | 'lbs/1000sqft' | 'lbs/acre' | 'oz/acre' | 'ppm';

export type SignalWord = 'CAUTION' | 'WARNING' | 'DANGER';

export interface ChemicalProduct {
  id: number;
  name: string;
  type: ChemicalProductType;
  manufacturer?: string;
  epa_registration?: string;
  active_ingredient?: string;
  concentration_pct?: number;
  analysis?: string;
  rei_hours: number;
  default_rate?: number;
  rate_unit: RateUnit;
  carrier_volume_gal: number;
  signal_word?: SignalWord;
  warnings?: string;
  max_wind_mph?: number;
  min_temp_f?: number;
  max_temp_f?: number;
  rain_delay_hours?: number;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Pesticide Applications (regulatory compliance)
// ============================================================

export type KnownApplicationMethod =
  | 'spray'
  | 'granular'
  | 'broadcast_by_hand'
  | 'spot_treatment'
  | 'aquatic_treatment'
  | 'injection'
  | 'drench';

/** Free text is permitted via the form's "Other" escape hatch; known slugs still autocomplete. */
export type ApplicationMethod = KnownApplicationMethod | (string & {});

/**
 * One spray event. Shared ops/context fields live here exactly once — there is
 * no cascade to keep in sync, because there are no sibling rows to sync with.
 */
export interface PesticideApplicationEvent {
  id: string;
  application_date: string;
  application_time?: string;
  area_applied: string;
  area_size?: string;
  /** Event-level method; a product line may override it. */
  method?: ApplicationMethod;
  operator_id?: number;
  applicator_license?: string;
  recommended_by?: number;
  equipment_used?: string;
  temperature?: string;
  wind_speed?: string;
  wind_direction?: string;
  humidity?: string;
  weather_conditions?: string;
  worker_protection_exchange: boolean;
  worker_protection_requirements?: string;
  /** IDAPA 02.03.03.101.01(o): name of the grower or operator contacted. */
  wps_contact_name?: string;
  /** IDAPA 02.03.03.101.01(o): date of contact. */
  wps_contact_date?: string;
  /** IDAPA 02.03.03.101.01(o): time of contact. */
  wps_contact_time?: string;
  /** IDAPA 02.03.03.101.01(n): required only for Apprentice Category (CA) holders. */
  supervisor_name?: string;
  supervisor_license?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Single-row course identity and location.
 * `street_address` backs IDAPA 02.03.03.101.01(c) on the printed log; it is a
 * distinct requirement from the per-application `area_applied`, which is (b).
 */
export interface CourseSettings {
  id: number;
  course_name?: string;
  street_address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  legal_description?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

/** One product line within a spray event. */
export interface PesticideApplicationProduct {
  id: string;
  application_id: string;
  line_number: number;
  product_name: string;
  epa_registration_number?: string;
  active_ingredient?: string;
  manufacturer?: string;
  epa_lot_number?: string;
  application_rate: string;
  rate_unit?: string;
  total_amount_used?: string;
  amount_per_tank?: string;
  rei_hours?: number;
  /** Per-product: one tank mix can legitimately target several pests. */
  target_pest?: string;
  /** NULL inherits the event's method. */
  method?: ApplicationMethod;
  legacy_source_id?: string;
  created_at: string;
  updated_at: string;
}

/** An event with its product lines embedded — the shape every read returns. */
export interface PesticideApplicationWithProducts extends PesticideApplicationEvent {
  products: PesticideApplicationProduct[];
}

/** Write-side draft for the event half of the form (all inputs are strings). */
export interface EventDraft {
  application_date: string;
  application_time: string;
  area_applied: string;
  area_size: string;
  method: string;
  operator_id: string;
  applicator_license: string;
  recommended_by: string;
  equipment_used: string;
  temperature: string;
  wind_speed: string;
  wind_direction: string;
  humidity: string;
  weather_conditions: string;
  worker_protection_exchange: boolean;
  worker_protection_requirements: string;
  wps_contact_name: string;
  wps_contact_date: string;
  wps_contact_time: string;
  supervisor_name: string;
  supervisor_license: string;
  notes: string;
}

/** Write-side draft for one product line. */
export interface ProductLineDraft {
  /** Client-only React key, minted with crypto.randomUUID(). Never the array index. */
  key: string;
  /** Present only when editing a line that already exists in the database. */
  id?: string;
  product_name: string;
  epa_registration_number: string;
  active_ingredient: string;
  manufacturer: string;
  epa_lot_number: string;
  application_rate: string;
  rate_unit: string;
  total_amount_used: string;
  amount_per_tank: string;
  rei_hours: string;
  target_pest: string;
  /** Blank inherits the event's method. */
  method: string;
}

export interface PesticideApplicationDraft {
  event: EventDraft;
  lines: ProductLineDraft[];
}

/** Spray calculator hand-off into the application form. */
export interface CalculatorRecordPayload {
  event: Partial<EventDraft>;
  lines: Omit<ProductLineDraft, 'key'>[];
}

/** One flattened row of the regulator log: event context + a single product line. */
export interface PesticideLogLine {
  event: PesticideApplicationWithProducts;
  product?: PesticideApplicationProduct;
}

// ============================================================
// Spray Mix Templates
// ============================================================

export interface SprayMixTemplate {
  id: number;
  name: string;
  description?: string;
  area_sqft?: number;
  tank_size_gal?: number;
  carrier_rate: number;
  products: { productId: number; rate: string; rateUnit: string }[];
  created_at: string;
  updated_at: string;
}

// ============================================================
// Calendar Events
// ============================================================

export type CalendarEventType = 'tournament' | 'championship' | 'event' | 'maintenance' | 'holiday' | 'other';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  event_date: string;
  end_date?: string;
  event_type: CalendarEventType;
  all_day: boolean;
  start_time?: string;
  end_time?: string;
  color?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Staff Time Off (DB table exists, UI deferred)
// ============================================================

export type TimeOffReason = 'vacation' | 'sick' | 'personal' | 'other';
export type TimeOffStatus = 'pending' | 'approved' | 'denied';

export interface StaffTimeOff {
  id: string;
  staff_id: string;
  start_date: string;
  end_date: string;
  reason?: TimeOffReason;
  notes?: string;
  status: TimeOffStatus;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Maintenance Issues (BanburyMaintenance integration via Old Tom)
// ============================================================

export type IssueStatus = 'Open' | 'In Progress' | 'Completed';
export type IssuePriority = 'Low' | 'Medium' | 'High';

export interface MaintenanceIssue {
  id: number;
  issue_number: number;
  description: string;
  location_area?: string;
  location_detail?: string;
  location_position?: string;
  status: IssueStatus;
  priority: IssuePriority;
  reporter_name?: string;
  reporter_telegram_id?: string;
  photo_url?: string;
  notes?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface MaintenanceReporter {
  telegram_id: string;
  name: string;
  role?: string;
  is_active: boolean;
  message_count: number;
  last_message_date?: string;
  created_at: string;
  updated_at: string;
}
