TurfSheet

Golf Course Task Management System

Architecture & Technical Specification

Executive Summary
TurfSheet is a task management application designed specifically for golf course maintenance operations. The system enables superintendents and managers to assign daily tasks to grounds crew members based on their availability, skills, and current conditions. Workers receive assignments on mobile devices while managers coordinate from a desktop dashboard.

Key differentiators include golf-specific features like mowing direction tracking, weather-aware scheduling, and integrated team communication—all at a fraction of the cost of existing solutions.

Core Features
Task Management
Create, assign, and track daily maintenance tasks
Recurring task templates (daily mowing, weekly aerating, seasonal projects)
Golf-specific task types: mowing with direction tracking, bunker maintenance, irrigation checks
Priority levels and time estimates
Photo documentation for completed work
Course zone organization (greens, fairways, rough, bunkers, clubhouse)
Staff & Scheduling
Worker availability calendar
Skill profiles (equipment certifications, training completed)
Smart assignment suggestions based on skills and availability
Shift templates for seasonal staffing changes
Communication Hub
Team announcements and broadcasts
Task-specific comments and questions
Direct messaging between manager and workers
Push notifications for new assignments and updates
Reporting & History
Daily completion summaries
Mowing direction history per area (prevent wear patterns)
Worker productivity metrics
Historical task logs for compliance and planning
Equipment Management
Track equipment location, usage, and maintenance with a path toward Toro integration.

Equipment inventory with type, model, serial number, and hour meter
Checkout/check-in logging (who has what, when)
Usage logging tied to tasks (which mower was used for which area)
Basic maintenance tracking (oil changes, blade sharpening, repairs)
Service alerts based on hour meter thresholds
Issue reporting with photos ("left reel making noise")
Future: Toro myTurf Integration - Toro's myTurf platform provides GPS tracking, fault codes, and telematics for connected equipment. Architecture allows for future API integration to pull real-time location, engine hours, and diagnostic alerts directly into TurfSheet.

Irrigation Quick-Log
Daily tracking of hand watering, probing, and irrigation adjustments—replacing the super's paper log.

Morning probe readings by green (moisture level, firmness notes)
Hand watering log (which greens/areas, duration, time of day)
Dry spot tracking with photo documentation
Syringe cycle logging (quick cooling cycles on hot days)
Historical view: see watering patterns over time per green
Correlation with weather data ("Green 7 always needs extra on south slope")
Superintendent Dashboard
A dedicated command center for the superintendent and assistant supers with agronomic data tracking and weather intelligence.

Grass Clippings Tracking
Daily clipping yield recording by zone (greens, fairways, etc.)
Volume measurements with trend visualization
Correlation views: clippings vs. weather, fertilizer apps, irrigation
Alerts for unusual yield changes (growth spurts or stress indicators)
Weather Intelligence
Beyond simple forecasts—pattern recognition and historical analog matching to support agronomic decisions.

Current conditions & forecast: 7-14 day forecast with hourly detail for spray windows
Historical comparison: Current season vs. 30-year averages (GDD accumulation, precip totals, temp ranges)
Analog year matching: Identify past years with similar patterns (e.g., "2025 is tracking like 2015") to inform expectations
Pattern alerts: Notifications when current conditions deviate significantly from historical norms
GDD tracking: Growing degree day accumulation with pest/disease model thresholds
Microclimate notes: Log local observations that differ from weather station data
Example Insight: "January 2025 is running 4.2°F above the 30-year average with 62% of normal precipitation. The closest historical match is January 2015 (correlation: 0.87). In 2015, early warmth led to premature green-up followed by frost damage in late February. Consider delaying spring fertilization."

System Architecture
Architecture Overview
The system follows a modern three-tier architecture optimized for cost-efficiency and maintainability. A single backend serves both the manager web dashboard and worker mobile apps through a unified REST API.

┌─────────────────────────────────────────────────────────────┐

│ CLIENT LAYER │

│ ┌──────────────────┐ ┌──────────────────────────┐ │

│ │ Manager Web App │ │ Worker Mobile App │ │

│ │ (React + Vite) │ │ (React Native/Expo) │ │

│ └────────┬─────────┘ └────────────┬─────────────┘ │

└───────────┼──────────────────────────────┼──────────────────┘

│ HTTPS/WSS │

▼ ▼

┌─────────────────────────────────────────────────────────────┐

│ API LAYER │

│ ┌─────────────────────────────────────────────────────┐ │

│ │ Node.js + Express API │ │

│ │ Auth │ Tasks │ Users │ Messages │ Notifications │ │

│ └─────────────────────────────────────────────────────┘ │

└─────────────────────────────────────────────────────────────┘

│

▼

┌─────────────────────────────────────────────────────────────┐

│ DATA LAYER │

│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │

│ │ PostgreSQL │ │ Redis │ │ S3/Spaces │ │

│ │ (Primary DB)│ │ (Cache) │ │ (Images) │ │

│ └──────────────┘ └──────────────┘ └──────────────┘ │

└─────────────────────────────────────────────────────────────┘

Technology Stack
Layer

Technology

Rationale

Manager Dashboard

React + Vite + TypeScript

Fast dev cycle, type safety, huge ecosystem

Worker Mobile App

React Native + Expo

Single codebase for iOS/Android, OTA updates

Backend API

Node.js + Express

JavaScript everywhere, easy hiring, low cost

Database

PostgreSQL

Robust, free, excellent for relational data

Cache/Realtime

Redis

Session storage, pub/sub for live updates

File Storage

DigitalOcean Spaces / S3

Cheap, scalable image storage

Push Notifications

Expo Push + Firebase

Free tier covers small teams

Hosting

Railway / Render / DO App Platform

Simple deployment, affordable scaling

Data Models
Organization
Represents a golf course or maintenance facility.

Field

Type

Description

id

UUID

Primary key

name

String

Golf course name

timezone

String

Local timezone for scheduling

created_at

Timestamp

Creation date

User
Staff members including managers and workers.

Field

Type

Description

id

UUID

Primary key

organization_id

UUID (FK)

Reference to organization

email

String

Login email (unique)

phone

String

Optional phone for SMS

name

String

Display name

role

Enum

MANAGER | WORKER

skills

String[]

Certifications and abilities

avatar_url

String

Profile picture URL

push_token

String

For push notifications

active

Boolean

Account status

Zone
Areas of the golf course for task organization.

Field

Type

Description

id

UUID

Primary key

organization_id

UUID (FK)

Reference to organization

name

String

e.g., "Front 9 Greens", "Fairways 10-18"

type

Enum

GREENS | FAIRWAYS | ROUGH | BUNKERS | etc.

color

String

Hex color for UI display

TaskTemplate
Reusable templates for recurring tasks.

Field

Type

Description

id

UUID

Primary key

organization_id

UUID (FK)

Reference to organization

title

String

Task name

description

Text

Detailed instructions

zone_id

UUID (FK)

Default zone

estimated_minutes

Integer

Expected duration

required_skills

String[]

Skills needed for assignment

recurrence_rule

String

RRULE format (iCal standard)

track_mow_direction

Boolean

Whether to capture mowing direction

Task
Individual task instances assigned to workers.

Field

Type

Description

id

UUID

Primary key

template_id

UUID (FK)

Optional link to template

organization_id

UUID (FK)

Reference to organization

title

String

Task name

description

Text

Instructions

zone_id

UUID (FK)

Location on course

assigned_to

UUID (FK)

Worker assigned

assigned_by

UUID (FK)

Manager who assigned

scheduled_date

Date

Day task is due

scheduled_time

Time

Optional start time

priority

Enum

LOW | NORMAL | HIGH | URGENT

status

Enum

PENDING | IN_PROGRESS | COMPLETED | SKIPPED

mow_direction

Enum

N | NE | E | SE | S | SW | W | NW

completed_at

Timestamp

When marked complete

completion_notes

Text

Worker notes on completion

completion_photos

String[]

URLs to uploaded photos

Availability
Worker availability windows.

Field

Type

Description

id

UUID

Primary key

user_id

UUID (FK)

Worker reference

date

Date

Specific date

start_time

Time

Shift start

end_time

Time

Shift end

is_recurring

Boolean

Weekly pattern vs one-off

day_of_week

Integer

0-6 for recurring (Sunday=0)

Message
Communication between team members.

Field

Type

Description

id

UUID

Primary key

organization_id

UUID (FK)

Organization scope

sender_id

UUID (FK)

Who sent it

recipient_id

UUID (FK)

Null for broadcasts

task_id

UUID (FK)

Optional task context

content

Text

Message body

type

Enum

DIRECT | BROADCAST | TASK_COMMENT

read_at

Timestamp

When recipient read it

created_at

Timestamp

Send time

Equipment
Inventory of mowers, utility vehicles, sprayers, and other equipment.

Field

Type

Description

id

UUID

Primary key

organization_id

UUID (FK)

Reference to organization

name

String

Display name (e.g., "Greens Mower #2")

type

Enum

MOWER | UTILITY | SPRAYER | AERATOR | OTHER

make

String

Manufacturer (e.g., "Toro")

model

String

Model name/number

serial_number

String

Serial number for warranty/service

year

Integer

Model year

hour_meter

Decimal

Current engine hours

status

Enum

AVAILABLE | IN_USE | MAINTENANCE | OUT_OF_SERVICE

checked_out_to

UUID (FK)

Current user (if checked out)

checked_out_at

Timestamp

When checked out

next_service_hours

Decimal

Hour meter threshold for next service

toro_asset_id

String

Future: myTurf integration ID

photo_url

String

Equipment photo

notes

Text

General notes, quirks, settings

EquipmentLog
Usage history, checkouts, and maintenance records.

Field

Type

Description

id

UUID

Primary key

equipment_id

UUID (FK)

Reference to equipment

user_id

UUID (FK)

Who performed action

task_id

UUID (FK)

Optional link to task

log_type

Enum

CHECKOUT | CHECKIN | MAINTENANCE | ISSUE | FUEL

hour_meter_reading

Decimal

Hour meter at time of log

description

Text

Details (maintenance performed, issue reported)

photos

String[]

Issue photos

created_at

Timestamp

When logged

IrrigationLog
Daily hand watering, probing, and irrigation activity records.

Field

Type

Description

id

UUID

Primary key

organization_id

UUID (FK)

Reference to organization

zone_id

UUID (FK)

Green or area

recorded_by

UUID (FK)

Staff member

recorded_date

Date

Date of activity

recorded_time

Time

Time of activity

activity_type

Enum

PROBE | HAND_WATER | SYRINGE | DRY_SPOT | SYSTEM_RUN

probe_reading

Decimal

Moisture meter reading (if probing)

duration_minutes

Integer

How long watered (if applicable)

coverage_notes

String

e.g., "south slope", "front edge"

firmness_rating

Integer

1-10 subjective firmness (optional)

photos

String[]

Dry spot or condition photos

notes

Text

Additional observations

ChemicalProduct (Future)
Inventory of fertilizers, pesticides, and other turf chemicals.

Field

Type

Description

id

UUID

Primary key

organization_id

UUID (FK)

Reference to organization

name

String

Product name

type

Enum

FERTILIZER | HERBICIDE | FUNGICIDE | INSECTICIDE | PGR | OTHER

epa_registration

String

EPA registration number

active_ingredient

String

Primary active ingredient

rei_hours

Integer

Re-entry interval in hours

sds_url

String

Link to Safety Data Sheet

default_rate

Decimal

Default application rate

rate_unit

String

e.g., "oz/1000 sq ft", "lbs/acre"

quantity_on_hand

Decimal

Current inventory level

quantity_unit

String

e.g., "gallons", "lbs"

ApplicationRecord (Future)
Log of chemical applications for compliance and planning.

Field

Type

Description

id

UUID

Primary key

organization_id

UUID (FK)

Reference to organization

product_id

UUID (FK)

Reference to ChemicalProduct

zone_id

UUID (FK)

Area of application

applied_by

UUID (FK)

Certified applicator

scheduled_date

Date

Planned application date

applied_at

Timestamp

Actual application time

rate_applied

Decimal

Actual rate used

area_treated_sqft

Integer

Square footage treated

total_product_used

Decimal

Amount of product consumed

wind_speed_mph

Decimal

Weather condition at application

wind_direction

String

Wind direction

temperature_f

Decimal

Temperature at application

humidity_percent

Integer

Relative humidity

soil_moisture

String

DRY | MOIST | WET

rei_expires_at

Timestamp

When re-entry is safe

notes

Text

Additional observations

status

Enum

SCHEDULED | COMPLETED | SKIPPED | CANCELLED

ClippingRecord
Daily grass clipping yield measurements for tracking turf health and growth patterns.

Field

Type

Description

id

UUID

Primary key

organization_id

UUID (FK)

Reference to organization

zone_id

UUID (FK)

Area measured

recorded_date

Date

Date of measurement

recorded_by

UUID (FK)

Staff member who recorded

volume_liters

Decimal

Clipping volume collected

measurement_method

Enum

BASKET | WEIGHT | ESTIMATE

height_of_cut_mm

Decimal

HOC setting used

notes

Text

Observations (color, density, stress signs)

WeatherReading
Local weather observations and API data for historical tracking.

Field

Type

Description

id

UUID

Primary key

organization_id

UUID (FK)

Reference to organization

reading_date

Date

Date of reading

source

Enum

API | MANUAL | ON_SITE_STATION

temp_high_f

Decimal

Daily high temperature

temp_low_f

Decimal

Daily low temperature

temp_avg_f

Decimal

Average temperature

precipitation_in

Decimal

Rainfall/precipitation

humidity_avg

Integer

Average relative humidity %

wind_avg_mph

Decimal

Average wind speed

gdd_base50

Decimal

Growing degree days (base 50°F)

soil_temp_4in_f

Decimal

Soil temperature at 4 inches

notes

Text

Manual observations, microclimate notes

HistoricalWeatherBaseline
Pre-loaded 30-year climate normals and notable historical seasons for analog matching.

Field

Type

Description

id

UUID

Primary key

location_id

String

Weather station or region ID

year

Integer

Historical year (or 0 for 30-yr avg)

month

Integer

Month (1-12)

day_of_month

Integer

Day (1-31), null for monthly summary

temp_avg_f

Decimal

Historical average temp

precip_avg_in

Decimal

Historical average precipitation

gdd_cumulative

Decimal

Cumulative GDD to this date

season_notes

Text

Notable events (e.g., "Late frost Feb 28")

API Endpoints
Authentication
POST /api/auth/login - Email/password login, returns JWT

POST /api/auth/refresh - Refresh access token

POST /api/auth/logout - Invalidate refresh token

POST /api/auth/forgot-password - Send reset email

Tasks
GET /api/tasks - List tasks (filterable by date, assignee, status, zone)

GET /api/tasks/:id - Get task details

POST /api/tasks - Create task (manager only)

PUT /api/tasks/:id - Update task

DELETE /api/tasks/:id - Delete task (manager only)

POST /api/tasks/:id/complete - Mark complete with notes/photos

POST /api/tasks/generate-from-templates - Create daily tasks from recurring templates

Users & Availability
GET /api/users - List team members

GET /api/users/:id/availability - Get availability for user

PUT /api/users/:id/availability - Update availability

GET /api/users/available?date=YYYY-MM-DD - List available workers for date

Messages
GET /api/messages - List messages (supports filters)

POST /api/messages - Send message

POST /api/messages/broadcast - Send to all workers (manager only)

PUT /api/messages/:id/read - Mark as read

Templates & Zones
GET /api/templates - List task templates

POST /api/templates - Create template

GET /api/zones - List course zones

POST /api/zones - Create zone

Chemical Applications (Future)
GET /api/chemicals - List chemical products in inventory

POST /api/chemicals - Add product to inventory

GET /api/applications - List application records (filterable)

POST /api/applications - Schedule or record an application

PUT /api/applications/:id/complete - Record completion with conditions

GET /api/applications/active-rei - List zones with active re-entry restrictions

GET /api/applications/export - Export spray log (CSV/PDF) for compliance

Equipment
GET /api/equipment - List all equipment with status

POST /api/equipment - Add equipment to inventory

GET /api/equipment/:id - Get equipment details with recent logs

POST /api/equipment/:id/checkout - Check out to worker

POST /api/equipment/:id/checkin - Return with hour meter reading

POST /api/equipment/:id/issue - Report problem with photos

POST /api/equipment/:id/maintenance - Log maintenance performed

GET /api/equipment/alerts - Equipment needing service or with open issues

Irrigation Quick-Log
GET /api/irrigation - List irrigation logs (filterable by zone, date, type)

POST /api/irrigation - Log probe reading, hand watering, or syringe

GET /api/irrigation/today - Today's activity summary by green

GET /api/irrigation/zone/:id/history - Historical patterns for specific green

GET /api/irrigation/dry-spots - Active dry spot issues with photos

Clippings & Agronomic Data
GET /api/clippings - List clipping records (filterable by zone, date range)

POST /api/clippings - Record daily clipping measurement

GET /api/clippings/trends - Aggregated trends with moving averages

GET /api/clippings/correlations - Clippings vs weather/inputs analysis

Weather Intelligence
GET /api/weather/current - Current conditions and forecast

GET /api/weather/history - Historical readings for this course

POST /api/weather/reading - Log manual weather observation

GET /api/weather/comparison - Current season vs 30-year normals

GET /api/weather/analogs - Find historical years matching current pattern

GET /api/weather/gdd - Growing degree day accumulation and projections

GET /api/weather/alerts - Pattern deviation alerts and insights

Weather Intelligence: Technical Approach
The analog year matching system helps superintendents recognize when current conditions mirror historical patterns, enabling proactive rather than reactive management.

Data Sources
NOAA Climate Data Online: Free historical daily data by weather station
Open-Meteo API: Free forecasts and historical data, no API key required
Visual Crossing: Affordable historical weather with good coverage (backup)
On-site observations: Manual entries for microclimate accuracy
Analog Year Matching Algorithm
The system compares current season-to-date metrics against each historical year using weighted correlation:

Collect daily data: temp high/low, precipitation, GDD accumulation
Normalize to season progress: Compare Jan 1 - today vs same window in historical years
Calculate similarity scores: Pearson correlation on temp trends, precip patterns, GDD curves
Weight recent data: Last 30 days weighted 2x vs earlier season
Rank and surface: Show top 3 analog years with correlation scores
Pull forward insights: Display what happened next in analog years (frost dates, disease pressure, etc.)
Practical Insights Delivered
Pattern Detected

Actionable Insight

Early warm spell (like 2015)

"2015 saw late Feb frost after similar warmth. Delay spring fert, monitor soil temps."

Below-normal precip + high GDD

"Conditions favor dollar spot. In 2018, outbreaks started week 3 of this pattern."

Wet spring (like 2017)

"2017 had extended Pythium pressure through June. Plan preventive apps."

GDD ahead of schedule

"Crabgrass germination expected 10 days early. Adjust pre-emergent timing."

Implementation Notes
Pre-load 30 years of historical data for the course's region during onboarding
Daily cron job fetches current conditions and updates comparisons
Allow supers to annotate historical years with their own notes ("2019: worst Poa triv year")
Start simple (temp + precip correlation), add complexity based on user feedback
Consider regional turf networks where supers can share analog insights
Cost Analysis
Estimated monthly costs for a small team (5-20 workers):

Service

Provider

Monthly Cost

Backend Hosting

Railway / Render

$5 - $20

PostgreSQL Database

Railway / Supabase

$0 - $10

Redis Cache

Upstash

$0 (free tier)

File Storage (10GB)

DO Spaces / S3

$5

Push Notifications

Expo / Firebase

$0 (free tier)

Domain + SSL

Cloudflare

$10/year

TOTAL

$10 - $35/month

Compare to Whiteboard app pricing (typically $50-200/month for similar features). This architecture can run at 10-20% of the cost while maintaining full functionality.

Security Considerations
Authentication: JWT tokens with short expiry (15 min access, 7 day refresh)
Authorization: Role-based access control (RBAC) - managers vs workers
Data isolation: All queries scoped by organization_id
Transport: HTTPS only, HSTS headers
Passwords: bcrypt hashing with salt rounds ≥ 12
Input validation: Zod schemas on all API inputs
Rate limiting: Redis-based rate limiting on auth endpoints
Development Phases
Phase 1: MVP (4-6 weeks)
User authentication and organization setup
Basic task creation and assignment
Worker mobile app with task list and completion
Manager dashboard with daily view
Push notifications for new assignments
Phase 2: Core Features (3-4 weeks)
Recurring task templates
Availability management
Course zones and mowing direction tracking
Photo uploads for task completion
Weekly calendar view
Equipment inventory and checkout/checkin
Irrigation quick-log (probe readings, hand watering)
Phase 3: Communication & Polish (2-3 weeks)
Direct messaging
Team announcements/broadcasts
Task comments
Basic reporting dashboard
Skill-based assignment suggestions
Phase 4: Enhancement (Ongoing)
Weather API integration
Historical analytics
Equipment tracking
Multi-course support
Phase 5: Chemical Application Management
Comprehensive tracking for fertilizers, pesticides, and other turf chemicals to support regulatory compliance and agronomic planning.

Product inventory with EPA registration numbers and SDS links
Application scheduling with weather-aware recommendations
Detailed application records (product, rate, area, applicator, conditions)
Re-entry interval (REI) and pre-harvest interval tracking
Spray log exports for state reporting requirements
Applicator certification tracking
Historical application reports by zone/product/date range
Phase 6: Tournament Prep Mode
Specialized workflow for tournament and event preparation.

Tournament checklist templates with countdown timers
Pre-tournament task sequences (T-minus scheduling)
Pin placement planning and logging
Course setup verification checklists
Event-day communication hub
Post-event recovery task generation
Phase 7: Regulatory Compliance Dashboard
Centralized compliance tracking for audits and certifications.

Applicator license expiration tracking with renewal alerts
Required training completion records
Spray log completeness verification
Equipment safety inspection logs
Audit-ready report generation (PDF exports)
Document storage for licenses, certifications, SDS sheets
Phase 8: Toro myTurf Integration
Connect with Toro's telematics platform for real-time equipment data.

OAuth connection to myTurf API
Auto-sync equipment hours and location
Pull fault codes and diagnostic alerts into TurfSheet
GPS tracking display on course map
Automated service reminders from Toro data
Usage analytics and efficiency reporting
Next Steps
Review and validate this architecture against your specific needs
Finalize feature prioritization for MVP
Set up development environment and CI/CD pipeline
Create database schema and seed data
Begin API development with authentication
Parallel development of manager dashboard and worker app