# TurfSheet PRD: Data Models

> Extracted from PRD.md lines 920-1306. Source of truth: [PRD.md](../../PRD.md)

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
