# TurfSheet PRD: API Specification

> Extracted from PRD.md lines 1308-2078. Source of truth: [PRD.md](../../PRD.md)

## API Specification

### Authentication

#### POST /api/auth/login
Email/password login, returns JWT access and refresh tokens.

**Request:**
```json
{
  "email": "super@banburygolf.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "name": "John Smith",
    "email": "super@banburygolf.com",
    "role": "MANAGER",
    "organization_id": "uuid"
  },
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "expires_in": 900
}
```

#### POST /api/auth/refresh
Refresh access token using refresh token.

#### POST /api/auth/logout
Invalidate refresh token.

#### POST /api/auth/forgot-password
Send password reset email.

---

### Tasks

#### GET /api/tasks
List tasks with filtering.

**Query Parameters:**
- `date` - Filter by scheduled date (YYYY-MM-DD)
- `assigned_to` - Filter by worker UUID
- `status` - Filter by status (PENDING, IN_PROGRESS, COMPLETED, SKIPPED)
- `zone_id` - Filter by zone UUID
- `priority` - Filter by priority
- `page` - Pagination page number
- `limit` - Items per page (default 50)

**Response:**
```json
{
  "tasks": [
    {
      "id": "uuid",
      "title": "Mow Front 9 Greens",
      "description": "Double-cut greens 1-9",
      "zone": {
        "id": "uuid",
        "name": "Front 9 Greens",
        "type": "GREENS",
        "color": "#10b981"
      },
      "assigned_to": {
        "id": "uuid",
        "name": "Mike Johnson",
        "schedule_type": "ROTATION_BLUE"
      },
      "assigned_by": {
        "id": "uuid",
        "name": "John Smith"
      },
      "scheduled_date": "2026-01-26",
      "scheduled_time": "06:30:00",
      "priority": "HIGH",
      "status": "IN_PROGRESS",
      "estimated_minutes": 120,
      "track_mow_direction": true,
      "mow_direction": "N",
      "equipment_used": null,
      "completed_at": null,
      "completion_notes": null,
      "completion_photos": []
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 142,
    "total_pages": 3
  }
}
```

#### GET /api/tasks/:id
Get task details.

#### POST /api/tasks
Create task (manager only).

**Request:**
```json
{
  "title": "Mow Front 9 Greens",
  "description": "Double-cut greens 1-9",
  "zone_id": "uuid",
  "assigned_to": "uuid",
  "scheduled_date": "2026-01-26",
  "scheduled_time": "06:30:00",
  "priority": "HIGH",
  "estimated_minutes": 120,
  "track_mow_direction": true,
  "template_id": "uuid" // Optional
}
```

**Response:**
```json
{
  "task": { /* task object */ },
  "availability_warning": null // Or "Worker is not scheduled on this date"
}
```

#### PUT /api/tasks/:id
Update task.

#### DELETE /api/tasks/:id
Delete task (manager only).

#### POST /api/tasks/:id/complete
Mark task complete with notes and photos.

**Request:**
```json
{
  "mow_direction": "N",
  "equipment_used": "uuid",
  "completion_notes": "Greens looking great, slight dry spot on #7",
  "completion_photos": ["https://s3.../photo1.jpg", "https://s3.../photo2.jpg"]
}
```

#### POST /api/tasks/generate-from-templates
Create daily tasks from recurring templates.

**Request:**
```json
{
  "date": "2026-01-27", // Generate for this date
  "template_ids": ["uuid1", "uuid2"] // Optional, or all active templates
}
```

**Response:**
```json
{
  "created_tasks": 12,
  "tasks": [ /* array of created tasks */ ]
}
```

---

### Users & Availability

#### GET /api/users
List team members.

**Query Parameters:**
- `role` - Filter by MANAGER or WORKER
- `active` - Filter by active status (true/false)
- `schedule_type` - Filter by schedule type

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "name": "Mike Johnson",
      "email": "mike@banburygolf.com",
      "phone": "+1-555-0123",
      "role": "WORKER",
      "schedule_type": "ROTATION_BLUE",
      "specific_days": null,
      "skills": ["Greens Mower Certified", "Irrigation Tech"],
      "avatar_url": "https://s3.../avatar.jpg",
      "active": true
    }
  ]
}
```

#### GET /api/users/:id/availability
Get availability for specific user.

**Query Parameters:**
- `start_date` - Start of date range (YYYY-MM-DD)
- `end_date` - End of date range (YYYY-MM-DD)

**Response:**
```json
{
  "user_id": "uuid",
  "schedule_type": "ROTATION_BLUE",
  "availability": [
    {
      "date": "2026-01-26",
      "is_working_day": true,
      "reason": "Blue rotation - working day",
      "override": null
    },
    {
      "date": "2026-01-27",
      "is_working_day": false,
      "reason": "Blue rotation - off day",
      "override": {
        "id": "uuid",
        "is_available": true,
        "reason": "Covering for Orange crew",
        "approved_by": "uuid"
      }
    }
  ],
  "next_working_dates": [
    "2026-01-26",
    "2026-01-28",
    "2026-01-29"
  ]
}
```

#### PUT /api/users/:id/availability
Create availability override (time-off request or schedule exception).

**Request:**
```json
{
  "date": "2026-02-15",
  "is_available": false,
  "reason": "Doctor appointment",
  "start_time": "09:00:00",
  "end_time": "12:00:00"
}
```

#### GET /api/users/available
List available workers for specific date.

**Query Parameters:**
- `date` - Date to check (YYYY-MM-DD)
- `required_skills` - Comma-separated skills (optional)

**Response:**
```json
{
  "date": "2026-01-26",
  "available_workers": [
    {
      "id": "uuid",
      "name": "Mike Johnson",
      "schedule_type": "ROTATION_BLUE",
      "skills": ["Greens Mower Certified"],
      "current_workload_minutes": 270,
      "availability_status": "SCHEDULED"
    }
  ],
  "unavailable_workers": [
    {
      "id": "uuid",
      "name": "Sarah Chen",
      "schedule_type": "ROTATION_ORANGE",
      "reason": "Orange rotation - off day"
    }
  ]
}
```

---

### Messages

#### GET /api/messages
List messages with filtering.

**Query Parameters:**
- `type` - DIRECT, BROADCAST, TASK_COMMENT
- `task_id` - Filter by task
- `unread` - true/false
- `page` - Pagination

**Response:**
```json
{
  "messages": [
    {
      "id": "uuid",
      "sender": {
        "id": "uuid",
        "name": "John Smith",
        "avatar_url": "https://..."
      },
      "recipient": {
        "id": "uuid",
        "name": "Mike Johnson"
      },
      "task": null,
      "content": "Great work on the greens today!",
      "type": "DIRECT",
      "read_at": null,
      "created_at": "2026-01-26T15:30:00Z"
    }
  ]
}
```

#### POST /api/messages
Send message.

**Request:**
```json
{
  "recipient_id": "uuid", // Null for broadcast
  "task_id": "uuid", // Optional
  "content": "Great work on the greens today!",
  "type": "DIRECT"
}
```

#### POST /api/messages/broadcast
Send to all workers (manager only).

**Request:**
```json
{
  "content": "Course closed tomorrow for tournament prep. All hands on deck at 5:30 AM.",
  "priority": "HIGH"
}
```

#### PUT /api/messages/:id/read
Mark message as read.

---

### Templates & Zones

#### GET /api/templates
List task templates.

**Response:**
```json
{
  "templates": [
    {
      "id": "uuid",
      "title": "Mow Greens",
      "description": "Double-cut all greens",
      "zone": {
        "id": "uuid",
        "name": "All Greens",
        "type": "GREENS"
      },
      "estimated_minutes": 180,
      "required_skills": ["Greens Mower Certified"],
      "frequency_category": "DAILY",
      "alternating_group": null,
      "recurrence_rule": "FREQ=DAILY",
      "track_mow_direction": true,
      "track_equipment_used": true
    }
  ]
}
```

#### POST /api/templates
Create task template.

#### GET /api/zones
List course zones.

#### POST /api/zones
Create zone.

---

### Equipment

#### GET /api/equipment
List all equipment with status.

**Response:**
```json
{
  "equipment": [
    {
      "id": "uuid",
      "name": "Greens Mower #2",
      "type": "MOWER",
      "make": "Toro",
      "model": "Greensmaster 3250-D",
      "serial_number": "12345",
      "year": 2023,
      "hour_meter": 487.5,
      "status": "IN_USE",
      "checked_out_to": {
        "id": "uuid",
        "name": "Mike Johnson"
      },
      "checked_out_at": "2026-01-26T06:15:00Z",
      "next_service_hours": 500,
      "photo_url": "https://...",
      "notes": "Just serviced, running great"
    }
  ]
}
```

#### POST /api/equipment
Add equipment to inventory.

#### GET /api/equipment/:id
Get equipment details with recent logs.

**Response:**
```json
{
  "equipment": { /* equipment object */ },
  "recent_logs": [
    {
      "id": "uuid",
      "user": {
        "id": "uuid",
        "name": "Mike Johnson"
      },
      "log_type": "CHECKOUT",
      "hour_meter_reading": 487.5,
      "description": null,
      "created_at": "2026-01-26T06:15:00Z"
    }
  ],
  "service_due": false,
  "open_issues": []
}
```

#### POST /api/equipment/:id/checkout
Check out equipment to worker.

**Request:**
```json
{
  "user_id": "uuid",
  "hour_meter_reading": 487.5
}
```

#### POST /api/equipment/:id/checkin
Return equipment.

**Request:**
```json
{
  "hour_meter_reading": 492.3,
  "notes": "Ran well, no issues"
}
```

#### POST /api/equipment/:id/issue
Report problem with photos.

**Request:**
```json
{
  "description": "Left reel making grinding noise",
  "hour_meter_reading": 490.0,
  "photos": ["https://s3.../issue1.jpg"]
}
```

#### POST /api/equipment/:id/maintenance
Log maintenance performed.

**Request:**
```json
{
  "description": "Changed oil, sharpened blades",
  "hour_meter_reading": 492.3,
  "photos": []
}
```

#### GET /api/equipment/alerts
Equipment needing service or with open issues.

---

### Irrigation Quick-Log

#### GET /api/irrigation
List irrigation logs.

**Query Parameters:**
- `zone_id` - Filter by zone
- `start_date` - Start of date range
- `end_date` - End of date range
- `activity_type` - Filter by type

#### POST /api/irrigation
Log probe reading, hand watering, or syringe.

**Request:**
```json
{
  "zone_id": "uuid",
  "recorded_date": "2026-01-26",
  "recorded_time": "06:00:00",
  "activity_type": "PROBE",
  "probe_reading": 18.5,
  "firmness_rating": 7,
  "coverage_notes": "Front edge slightly dry",
  "photos": [],
  "notes": "Looks good overall"
}
```

#### GET /api/irrigation/today
Today's activity summary by green.

**Response:**
```json
{
  "date": "2026-01-26",
  "activities": [
    {
      "zone": {
        "id": "uuid",
        "name": "Green #1"
      },
      "probe_reading": 19.2,
      "firmness": 8,
      "hand_watered": false,
      "syringed": false,
      "notes": "Perfect"
    }
  ]
}
```

#### GET /api/irrigation/zone/:id/history
Historical patterns for specific green.

**Query Parameters:**
- `days` - Number of days to look back (default 30)

#### GET /api/irrigation/dry-spots
Active dry spot issues with photos.

---

### Clippings & Agronomic Data

#### GET /api/clippings
List clipping records.

**Query Parameters:**
- `zone_id` - Filter by zone
- `start_date` - Start of date range
- `end_date` - End of date range

#### POST /api/clippings
Record daily clipping measurement.

**Request:**
```json
{
  "zone_id": "uuid",
  "recorded_date": "2026-01-26",
  "volume_liters": 42.5,
  "measurement_method": "BASKET",
  "height_of_cut_mm": 3.2,
  "notes": "Healthy green color, good density"
}
```

#### GET /api/clippings/trends
Aggregated trends with moving averages.

**Query Parameters:**
- `zone_id` - Specific zone or all
- `days` - Lookback period (default 30)

**Response:**
```json
{
  "zone": {
    "id": "uuid",
    "name": "All Greens"
  },
  "period": "30 days",
  "data": [
    {
      "date": "2026-01-26",
      "volume_liters": 42.5,
      "moving_avg_7day": 38.2,
      "moving_avg_14day": 36.8
    }
  ],
  "summary": {
    "avg_volume": 37.5,
    "min_volume": 28.0,
    "max_volume": 48.5,
    "trend": "INCREASING"
  }
}
```

#### GET /api/clippings/correlations
Clippings vs weather/inputs analysis.

---

### Weather Intelligence

#### GET /api/weather/current
Current conditions and forecast.

**Response:**
```json
{
  "current": {
    "temperature_f": 72,
    "humidity": 65,
    "wind_speed_mph": 8,
    "conditions": "Partly Cloudy",
    "updated_at": "2026-01-26T14:30:00Z"
  },
  "forecast": [
    {
      "date": "2026-01-27",
      "temp_high_f": 75,
      "temp_low_f": 58,
      "precipitation_chance": 20,
      "wind_avg_mph": 10,
      "conditions": "Sunny"
    }
  ],
  "spray_windows": [
    {
      "date": "2026-01-27",
      "start_time": "06:00:00",
      "end_time": "10:00:00",
      "conditions": "Ideal: low wind, moderate temp"
    }
  ]
}
```

#### GET /api/weather/history
Historical readings for this course.

**Query Parameters:**
- `start_date` - Start of date range
- `end_date` - End of date range

#### POST /api/weather/reading
Log manual weather observation.

**Request:**
```json
{
  "reading_date": "2026-01-26",
  "source": "MANUAL",
  "temp_high_f": 74,
  "temp_low_f": 58,
  "precipitation_in": 0.0,
  "notes": "Microclimate: greens 15-18 noticeably warmer than weather station"
}
```

#### GET /api/weather/comparison
Current season vs 30-year normals.

**Response:**
```json
{
  "current_season": {
    "start_date": "2026-01-01",
    "end_date": "2026-01-26",
    "avg_temp_f": 52.3,
    "total_precip_in": 2.8,
    "gdd_accumulated": 145
  },
  "thirty_year_normal": {
    "avg_temp_f": 48.1,
    "total_precip_in": 4.5,
    "gdd_accumulated": 120
  },
  "deviations": {
    "temp_deviation_f": 4.2,
    "precip_percent": 62,
    "gdd_ahead_by": 25
  },
  "interpretation": "Season running significantly warmer and drier than average"
}
```

#### GET /api/weather/analogs
Find historical years matching current pattern.

**Response:**
```json
{
  "current_year": 2026,
  "analog_years": [
    {
      "year": 2015,
      "correlation": 0.87,
      "similarity_description": "Very similar temp and precip pattern",
      "what_happened_next": "Late Feb frost after early warmth caused damage to greens 7, 12, 15",
      "superintendent_notes": "Delayed spring fertilization by 3 weeks. Good decision."
    },
    {
      "year": 2009,
      "correlation": 0.79,
      "similarity_description": "Similar GDD accumulation, slightly wetter",
      "what_happened_next": "Early Poa annua seedheads, dollar spot pressure in March"
    }
  ],
  "actionable_insights": [
    "Consider delaying spring fertilization",
    "Monitor for early Poa annua activity",
    "Prepare for potential late-season frost"
  ]
}
```

#### GET /api/weather/gdd
Growing degree day accumulation and projections.

**Response:**
```json
{
  "current_gdd": 145,
  "thirty_year_avg_gdd": 120,
  "ahead_by": 25,
  "projections": [
    {
      "threshold": 200,
      "description": "Crabgrass germination",
      "estimated_date": "2026-02-10",
      "normal_date": "2026-02-20",
      "days_early": 10
    }
  ]
}
```

#### GET /api/weather/alerts
Pattern deviation alerts and insights.
