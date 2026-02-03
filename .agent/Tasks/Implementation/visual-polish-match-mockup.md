# Visual Polish: Match SiteExamples Design

## Overview
Transform the current React dashboard (`/home/cpbjr/WhitePineTech/Projects/turfsheet-app`) to match the high-fidelity design in `SiteExamples/`. The foundation is built - this is pure visual refinement. Fidelity to examples is extremely important. 

## Design Analysis

### SiteExamples Design Language (Target)
**Colors:**
- Turf Green: `#73A657` ✅ (already configured)
- Turf Green Dark: `#5D8A46` ✅
- Turf Green Light: `#E8F0E4` ✅
- Background Main: `#F4F6F8`
- Background White: `#FFFFFF`
- Text Primary: `#2C3E50`
- Text Secondary: `#7F8C8D`
- Text Muted: `#BDC3C7`
- Border Color: `#E0E4E8`
- Accent Orange: `#F39C12` (Help button)
- Accent Grey: `#95A5A6` (Secondary buttons)

**Typography:**
- Headings: `'Outfit', sans-serif` (weight: 700) ✅ (already configured)
- Body: `'Inter', sans-serif` ✅ (already configured)

**Layout Dimensions:**
- Sidebar: 60px (vertical icon bar, not 256px text menu)
- Header Height: 60px
- Side Panel: 300px (buttons + staff list)

**Shadows:**
- Small: `0 1px 3px rgba(0,0,0,0.12)`
- Medium: `0 4px 6px rgba(0,0,0,0.08)`
- Large: `0 10px 15px rgba(0,0,0,0.05)`

### Current Implementation Gaps

#### 1. **Sidebar - Complete Redesign Required**
**Current:** Full-width (256px) text navigation with hamburger menu
**Target:** Narrow vertical icon bar (60px) with circular logo and icon-only navigation

**Changes:**
- Replace text navigation with Font Awesome icons
- Circular white logo badge with "T"
- Icon buttons: Home, Calendar, Users, Briefcase, Chart, Settings
- Active state: white background, green text
- Hover state: `rgba(255,255,255,0.2)` background

#### 2. **Header - Layout Restructure**
**Current:** Simple date selector centered
**Target:** Title + date controls + user profile

**Changes:**
- Left: "TURFSHEET WHITEBOARD" heading (1.2rem, uppercase tracking)
- Center: Date navigation with chevrons + calendar icon + workday hours
- Right: Notification bell (with red dot) + user profile icon
- Background: white with bottom border
- Height: 60px exactly

#### 3. **Task Board - Job Cards Missing**
**Current:** Empty placeholder with "Add Job" button
**Target:** Grid of styled job cards with green headers

**Changes:**
- Job cards with green header bars (turf-green background)
- White card bodies with job details
- Close "X" icon in top right of each card
- Job detail labels in bold
- "Crew Needed" in green text
- "Assign Crew" link in green
- Grid layout: `repeat(auto-fill, minmax(280px, 1fr))`
- Card hover: lift effect with shadow

#### 4. **Right Panel - Button Stack + Staff List**
**Current:** Weather display + staff panel
**Target:** Action buttons + weekly staff schedule

**Changes:**
- Remove weather display component
- Add button stack at top:
  - Help (orange: `#EAB35E`)
  - Display Mode (grey: `#95A5A6`)
  - Add A Job (green: turf-green)
  - Add & Manage Equipment (grey)
  - Add Staff (green)
- Staff section with weekly date range header
- Staff items: name + "Enter Weekly Schedule Here" link

#### 5. **Spacing & Polish**
- Border radius: 4px (square corners on cards, not rounded)
- Section headers: uppercase, small font, bottom border
- Consistent padding: 20px on main containers
- Gap between cards: 16px

## Implementation Plan

### Phase 1: Sidebar Transformation
**File:** `/home/cpbjr/WhitePineTech/Projects/turfsheet-app/src/components/layout/Sidebar.tsx`

1. Install Font Awesome icons: `npm install --save @fortawesome/fontawesome-svg-core @fortawesome/free-solid-svg-icons @fortawesome/react-fontawesome`
2. Replace current sidebar with:
   - Width: 60px (change from w-64 to w-[60px])
   - Background: turf-green
   - Circular logo badge (32px white circle with "T")
   - Icon-only navigation using FontAwesome
   - Active/hover states matching mockup

### Phase 2: Header Restructure
**Files:**
- `/home/cpbjr/WhitePineTech/Projects/turfsheet-app/src/components/layout/Header.tsx`
- `/home/cpbjr/WhitePineTech/Projects/turfsheet-app/src/components/DateSelector.tsx`

1. Add header title "TURFSHEET WHITEBOARD"
2. Restructure DateSelector with navigation chevrons
3. Add workday hours display (green text)
4. Add right-side user controls (bell + profile icons)
5. Ensure 60px height constraint

### Phase 3: Task Board with Job Cards
**File:** `/home/cpbjr/WhitePineTech/Projects/turfsheet-app/src/components/TaskBoard.tsx`

1. Create JobCard component with:
   - Green header with title + close icon
   - White body with job details
   - Proper typography and spacing
2. Add sample job data (Mow Greens, Mow Fairways, Mow Approaches, Roll Greens, Change Cups)
3. Implement grid layout
4. Add hover effects

### Phase 4: Right Panel Redesign
**File:** `/home/cpbjr/WhitePineTech/Projects/turfsheet-app/src/components/layout/RightPanel.tsx`

1. Remove WeatherDisplay component import/usage
2. Add ActionButtons component:
   - Help (orange)
   - Display Mode (grey)
   - Add A Job (green)
   - Add & Manage Equipment (grey)
   - Add Staff (green)
3. Update StaffPanel component with weekly date range
4. Width: 300px exactly

### Phase 5: Color System Update
**File:** `/home/cpbjr/WhitePineTech/Projects/turfsheet-app/tailwind.config.js`

Add mockup color palette to Tailwind theme:
```js
colors: {
  'turf-green': '#73A657',
  'turf-green-dark': '#5D8A46',
  'turf-green-light': '#E8F0E4',
  'bg-main': '#F4F6F8',
  'text-primary': '#2C3E50',
  'text-secondary': '#7F8C8D',
  'text-muted': '#BDC3C7',
  'border-color': '#E0E4E8',
  'accent-orange': '#F39C12',
  'accent-grey': '#95A5A6',
  'btn-orange': '#EAB35E', // Specific button shade
}
```

### Phase 6: Typography & Spacing Polish
**Files:** All components

1. Update section headers: uppercase, 0.9rem, text-secondary
2. Card border-radius: 4px (change from default rounded-lg)
3. Consistent spacing: p-6 → p-5 where needed to match mockup
4. Font sizes: Match exact sizes from SiteExamples CSS

## Critical Files to Modify

1. `/home/cpbjr/WhitePineTech/Projects/turfsheet-app/src/components/layout/Sidebar.tsx` - Complete redesign
2. `/home/cpbjr/WhitePineTech/Projects/turfsheet-app/src/components/layout/Header.tsx` - Layout restructure
3. `/home/cpbjr/WhitePineTech/Projects/turfsheet-app/src/components/DateSelector.tsx` - Add chevrons and controls
4. `/home/cpbjr/WhitePineTech/Projects/turfsheet-app/src/components/TaskBoard.tsx` - Add job cards
5. `/home/cpbjr/WhitePineTech/Projects/turfsheet-app/src/components/layout/RightPanel.tsx` - Replace weather with buttons
6. `/home/cpbjr/WhitePineTech/Projects/turfsheet-app/tailwind.config.js` - Expand color palette
7. `/home/cpbjr/WhitePineTech/Projects/turfsheet-app/src/components/StaffPanel.tsx` - Update styling to match mockup

**Optional:** Create new components:
- `src/components/JobCard.tsx` - Reusable job card component
- `src/components/ActionButtons.tsx` - Button stack for right panel

## Verification Plan

1. **Visual Comparison:**
   - Run dev server: `cd /home/cpbjr/WhitePineTech/Projects/turfsheet-app && npm run dev`
   - Open mockup: `file:///home/cpbjr/WhitePineTech/Projects/TurfSheet/SiteExamples/index.html`
   - Open app: `http://localhost:5173/`
   - Compare side-by-side in browser

2. **Checklist:**
   - [ ] Sidebar is 60px wide with icon-only navigation
   - [ ] Header shows title, date controls, and user profile
   - [ ] Job cards display with green headers and proper spacing
   - [ ] Right panel has action buttons (not weather)
   - [ ] Colors match exactly (use browser DevTools color picker)
   - [ ] Typography sizes and weights match
   - [ ] Spacing and padding match mockup
   - [ ] Hover states work on all interactive elements
   - [ ] Layout is responsive and doesn't break

3. **Browser DevTools Inspection:**
   - Use inspector to compare computed styles
   - Check color values match SiteExamples exactly
   - Verify font sizes and spacing values

## Success Criteria
Dashboard visually indistinguishable from `SiteExamples/index.html` while maintaining React functionality and clean component architecture.

---

## MANDATORY VALIDATION COMMANDS

**These commands MUST be run before marking any work complete. Do not skip. Do not delegate without visual verification.**

### 1. Visual Fidelity Check (REQUIRED - Run First)
```bash
# Open both in browser side-by-side
# Mockup: file:///home/cpbjr/WhitePineTech/Projects/TurfSheet/SiteExamples/index.html
# App: http://localhost:5173/

# VISUAL CHECKLIST (use browser DevTools color picker):
- [ ] Background is LIGHT (#F4F6F8), NOT dark
- [ ] Sidebar is GREEN (#73A657), NOT dark
- [ ] Header is WHITE (#FFFFFF), NOT dark
- [ ] Text is DARK (#2C3E50), NOT light
- [ ] Job cards have GREEN headers (#73A657)
- [ ] Overall appearance matches mockup EXACTLY
```

### 2. Color Validation (REQUIRED - After Visual Check)
```bash
# Use browser DevTools Inspector to verify exact colors:
# Right-click element → Inspect → computed styles → color/background-color

CRITICAL COLORS - Must Match Exactly:
- Sidebar background: #73A657 (Turf Green)
- Header background: #FFFFFF (White)
- Page background: #F4F6F8 (Light Gray)
- Job card headers: #73A657 (Turf Green)
- Primary text: #2C3E50 (Dark Blue-Gray)
- Secondary text: #7F8C8D (Medium Gray)
- Help button: #EAB35E (Orange)
- Buttons (grey): #95A5A6 (Gray)

VERIFICATION COMMAND:
npm run build 2>&1 | grep -i "error" && echo "BUILD FAILED" || echo "✓ Build successful"
```

### 3. Layout Dimension Check (REQUIRED)
```bash
# Measure with DevTools Inspector:
- [ ] Sidebar width: exactly 60px
- [ ] Header height: exactly 60px
- [ ] Right panel width: exactly 300px
- [ ] Job cards: minimum 280px, responsive grid
```

### 4. Before Committing - Run This Script
```bash
# Location: .agent/workflows/validate-design.sh
# Run before starting implementation and before committing

bash .agent/workflows/validate-design.sh
```

---

## ⚠️ CRITICAL REMINDER

**Claude: You MUST perform these checks visually before considering work complete:**

1. **Open the mockup and app in separate browser windows side-by-side**
2. **Take a screenshot of both**
3. **Compare them directly - do they look the same?**
4. **Use DevTools color picker to verify colors match exactly**
5. **If anything looks different → STOP and fix it**

**Do not:**
- ❌ Assume colors are correct without checking
- ❌ Delegate to subagents without visual verification
- ❌ Skip the visual comparison step
- ❌ Trust that "it should look right" without seeing it

**The last failure happened because these validation steps were skipped. Ensure they are never skipped again.**
