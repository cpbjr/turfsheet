# TurfSheet: Minimal Viable Dashboard (Foundation)

## Goal
Transform the static SiteExamples into a working foundation with:
- Date display with calendar picker
- Weather information (current conditions + sunrise/sunset + precipitation)
- Empty/blank board structure to add jobs
- Empty/blank section to add employees
- Clean, simple, and functional

## Current State Analysis

### What Exists
- **SiteExamples/** - Beautiful static HTML/CSS/JS mockup showing:
  - Sidebar navigation
  - Header with date selector
  - Task board with job cards (static examples)
  - Right panel with buttons and staff list (static examples)
  - Professional green color scheme (#73A657)
  - Clean, modern design

### What We're Building
A **real working application** that starts simple and grows:
1. Display today's date with a calendar of the month (no prev/next day navigation)
2. Fetch and show current weather + sunrise/sunset + precipitation chance
3. Blank board with "+ Add Job" button (button only, no functionality yet)
4. Blank staff section with "+ Add Employee" button (button only, no functionality yet)

## Technology Stack

### Frontend
- **React** with **Vite** + **TypeScript**
- **TailwindCSS** for styling (matches SiteExamples color scheme)
- **shadcn/ui** for components (buttons, cards, date picker)
- **Lucide React** for icons (modern, clean icons)

### Weather API
- **Open-Meteo API** (free, no API key required)
  - Current weather conditions
  - Sunrise/sunset times
  - Temperature, humidity, wind speed, precipitation probability

### Location
- Banbury Golf Course, Eagle, WI
- Coordinates: 42.88°N, -88.49°W (we'll use these for weather)

## Implementation Plan

### Phase 0: Save Plan to Project (FIRST STEP)

**Before starting any implementation work:**

1. **Create Implementation directory** (if it doesn't exist)
```bash
mkdir -p .agent/Tasks/Implementation
```

2. **Copy this plan to the project**
```bash
cp ~/.claude/plans/effervescent-enchanting-star.md .agent/Tasks/Implementation/minimal-viable-dashboard.md
```

3. **Open plan in IDE**
- This keeps the plan visible during implementation
- You can follow along, check off steps, or make edits
- File location: `.agent/Tasks/Implementation/minimal-viable-dashboard.md`

### Phase 1: Project Setup (Foundation)

**1. Create React + Vite + TypeScript project**
```bash
npm create vite@latest turfsheet-app -- --template react-ts
cd turfsheet-app
npm install
```

**2. Install dependencies**
```bash
# Styling
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# UI Components
npx shadcn-ui@latest init

# Icons
npm install lucide-react

# Date handling
npm install date-fns
```

**3. Configure TailwindCSS with TurfSheet colors**
- Copy color scheme from SiteExamples/style.css
- Set up custom theme in tailwind.config.js
- Configure fonts (Inter + Outfit from Google Fonts)

**4. Copy layout structure from SiteExamples**
- Recreate sidebar component
- Recreate header component
- Recreate main content area
- Recreate right panel

### Phase 2: Date Display & Calendar

**1. Create DateSelector component**
- Display current date in format: "Wed Feb 5, 2025"
- Calendar icon that opens a month view calendar
- Allow user to select any day from the calendar

**2. Store current date in state**
- Use React useState hook
- Initialize with today's date
- Update when date selected from calendar

**3. Display workday hours (static for now)**
- Show "Workday: 07:30 AM-2:30 PM" (hardcoded)
- Green text color to match design

### Phase 3: Weather Integration

**1. Create weather API service**
```typescript
// src/services/weather.ts
const LOCATION = {
  latitude: 42.88,
  longitude: -88.49,
  timezone: 'America/Chicago'
};

async function getCurrentWeather() {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${LOCATION.latitude}&longitude=${LOCATION.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,precipitation_probability&daily=sunrise,sunset,precipitation_probability_max&timezone=${LOCATION.timezone}`;

  const response = await fetch(url);
  return response.json();
}
```

**2. Create WeatherDisplay component**
- Temperature (large, prominent)
- Weather icon (sunny, cloudy, rainy, etc.)
- Humidity %
- Wind speed
- Sunrise time (formatted as "6:15 AM")
- Sunset time (formatted as "5:42 PM")
- Expected/chance of precipitation (%)

**3. Place weather in header or top of right panel**
- Clean, compact display
- Updates when date changes (future feature)

### Phase 4: Blank Board Structure

**1. Create task board sections**
- "First Jobs" section (empty)
- "+ Add Job" button (styled, non-functional)
- Clean card layout matching SiteExamples

**2. Style empty state**
- Light gray background
- Dashed border placeholder
- Centered "+ Add Job" button
- Message: "No jobs scheduled for this day"

### Phase 5: Blank Staff Section

**1. Create staff panel in right sidebar**
- "Staff" heading
- Empty staff list
- "+ Add Employee" button (styled, non-functional)
- Clean layout matching SiteExamples

**2. Style empty state**
- Message: "No employees added yet"
- Centered "+ Add Employee" button

### Phase 6: Polish & Testing

**1. Responsive design**
- Ensure layout works on desktop
- Sidebar collapses on mobile (future)
- Buttons are clickable size

**2. Color scheme verification**
- Match SiteExamples green (#73A657)
- Match background colors
- Match text colors
- Match button styles

**3. Test basic interactions**
- Click calendar icon to select date
- Verify weather loads
- Verify weather displays correctly
- Verify empty states look clean

**4. Local development workflow**
```bash
npm run dev
# Opens at http://localhost:5173
```

## File Structure

```
turfsheet-app/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx           # Left navigation
│   │   │   ├── Header.tsx            # Top header with date
│   │   │   └── RightPanel.tsx        # Right sidebar
│   │   ├── DateSelector.tsx          # Date navigation component
│   │   ├── WeatherDisplay.tsx        # Weather info component
│   │   ├── TaskBoard.tsx             # Main board (empty state)
│   │   └── StaffPanel.tsx            # Staff list (empty state)
│   ├── services/
│   │   └── weather.ts                # Weather API calls
│   ├── types/
│   │   └── weather.ts                # TypeScript types
│   ├── App.tsx                       # Main app component
│   ├── main.tsx                      # Entry point
│   └── index.css                     # Tailwind imports
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts
```

## Critical Files to Modify/Create

### 1. tailwind.config.js
```javascript
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'turf-green': '#73A657',
        'turf-green-dark': '#5D8A46',
        'turf-green-light': '#E8F0E4',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

### 2. src/services/weather.ts
```typescript
interface WeatherData {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    weather_code: number;
    precipitation_probability?: number;
  };
  daily: {
    sunrise: string[];
    sunset: string[];
    precipitation_probability_max?: number[];
  };
}

export async function getCurrentWeather(): Promise<WeatherData> {
  const url = 'https://api.open-meteo.com/v1/forecast?latitude=42.88&longitude=-88.49&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,precipitation_probability&daily=sunrise,sunset,precipitation_probability_max&timezone=America/Chicago';

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch weather');
  }

  return response.json();
}
```

### 3. src/components/DateSelector.tsx
```typescript
import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';

export function DateSelector() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

  const handleDateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    setCurrentDate(date);
    setShowCalendar(false);
  };

  return (
    <div className="flex items-center gap-3 bg-gray-100 px-4 py-2 rounded-full">
      <span className="font-medium">
        {format(currentDate, 'EEE MMM d, yyyy')}
      </span>
      <button
        onClick={() => setShowCalendar(!showCalendar)}
        className="p-1 hover:bg-gray-200 rounded"
      >
        <Calendar className="w-4 h-4" />
      </button>
      {showCalendar && (
        <input
          type="date"
          value={format(currentDate, 'yyyy-MM-dd')}
          onChange={handleDateSelect}
          autoFocus
          className="absolute ml-2 p-2 rounded border border-gray-300"
        />
      )}
      <span className="ml-3 text-turf-green font-medium">
        Workday: 07:30 AM-2:30 PM
      </span>
    </div>
  );
}
```

### 4. src/components/WeatherDisplay.tsx
```typescript
import { useEffect, useState } from 'react';
import { getCurrentWeather } from '../services/weather';
import { Sun, Cloud, CloudRain } from 'lucide-react';

export function WeatherDisplay() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentWeather()
      .then(setWeather)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading weather...</div>;
  if (!weather) return null;

  const precipitationChance = weather.current.precipitation_probability || 0;
  const weatherIcon = precipitationChance > 50 ?
    <CloudRain className="w-8 h-8 text-blue-500" /> :
    <Sun className="w-8 h-8 text-yellow-500" />;

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex items-center gap-4">
        {weatherIcon}
        <div>
          <div className="text-2xl font-bold">
            {Math.round(weather.current.temperature_2m)}°F
          </div>
          <div className="text-sm text-gray-600">
            Humidity: {weather.current.relative_humidity_2m}%
          </div>
        </div>
      </div>
      <div className="mt-3 text-sm text-gray-600">
        <div>Wind: {Math.round(weather.current.wind_speed_10m)} mph</div>
        <div>Precipitation: {precipitationChance}%</div>
        <div>Sunrise: {new Date(weather.daily.sunrise[0]).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div>
        <div>Sunset: {new Date(weather.daily.sunset[0]).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div>
      </div>
    </div>
  );
}
```

### 5. src/components/TaskBoard.tsx
```typescript
import { Plus } from 'lucide-react';

export function TaskBoard() {
  return (
    <div className="flex-1 p-6">
      <section>
        <h3 className="text-sm uppercase text-gray-500 mb-4 border-b pb-2">
          First Jobs
        </h3>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <p className="text-gray-500 mb-4">No jobs scheduled for this day</p>
          <button className="bg-turf-green text-white px-6 py-2 rounded-lg flex items-center gap-2 mx-auto hover:bg-turf-green-dark">
            <Plus className="w-4 h-4" />
            Add Job
          </button>
        </div>
      </section>
    </div>
  );
}
```

### 6. src/components/StaffPanel.tsx
```typescript
import { Plus } from 'lucide-react';

export function StaffPanel() {
  return (
    <div className="w-80 bg-white border-l border-gray-200 p-6">
      <h4 className="text-sm font-semibold mb-4">Staff</h4>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <p className="text-gray-500 mb-4 text-sm">No employees added yet</p>
        <button className="bg-turf-green text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto text-sm hover:bg-turf-green-dark">
          <Plus className="w-4 h-4" />
          Add Employee
        </button>
      </div>
    </div>
  );
}
```

## Verification Steps

After implementation, verify:

1. **Visual appearance**
   - Run `npm run dev`
   - Open http://localhost:5173
   - Compare to SiteExamples/index.html
   - Colors match? Layout matches? Fonts match?

2. **Date navigation**
   - Click calendar icon → date picker appears
   - Select a date → date updates and picker closes
   - Date format displays correctly

3. **Weather display**
   - Temperature shows (number in °F)
   - Humidity shows (percentage)
   - Wind speed shows (mph)
   - Precipitation chance shows (percentage)
   - Sunrise time shows (formatted as "6:15 AM")
   - Sunset time shows (formatted as "5:42 PM")
   - Weather icon changes based on precipitation (sun vs rain cloud)

4. **Empty states**
   - "No jobs scheduled" message appears
   - "+ Add Job" button visible and styled
   - "No employees added" message appears
   - "+ Add Employee" button visible and styled

5. **Buttons (non-functional is OK)**
   - Buttons have hover effects
   - Buttons look clickable
   - No console errors when clicking

## What This Foundation Enables

Once this minimal foundation is working:

✅ **Visual proof of concept** - You can see your app and show others
✅ **Date context** - Every future feature knows what day we're working with
✅ **Weather awareness** - Ready to build weather-dependent features
✅ **Clear UI structure** - Sidebar, header, board, staff panel all in place
✅ **Ready for real data** - Easy to replace "+ Add Job" with real job creation
✅ **Ready for real employees** - Easy to replace "+ Add Employee" with real staff management

## Next Steps (Future Work)

After this foundation is complete, natural next steps are:

1. **Job creation modal** - Make "+ Add Job" button open a form
2. **Job display** - Show jobs as cards on the board
3. **Employee management** - Add employee form and list
4. **Task assignment** - Drag jobs to employees
5. **Database integration** - Save jobs and employees (Supabase)

## Summary

This plan focuses on:
- **Starting small** - Just date, weather, and empty structure
- **Visual foundation** - Matches SiteExamples design
- **Working code** - Real React app, not static HTML
- **No complexity** - No database, no authentication, no advanced features yet
- **Immediate feedback** - You can run it and see results today

Let's build something you can see and interact with, then grow it step by step!
