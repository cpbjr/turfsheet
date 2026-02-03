# TurfSheet Phase 2 - Component Code Reference

## Quick Reference for Layout Components

### Component Import Pattern
```typescript
// In App.tsx or any parent component:
import { Sidebar, Header, RightPanel } from './components/layout';
```

---

## Sidebar Component Features

**File:** `/src/components/layout/Sidebar.tsx`

### Key Props
- Uses React hooks: `useState`
- Internal state: `activeNav` (tracks selected navigation item)

### Navigation Items Structure
```javascript
navItems = [
  { id: 'dashboard', icon: 'fa-house', label: 'Dashboard' },
  { id: 'calendar', icon: 'fa-calendar', label: 'Calendar' },
  { id: 'staff', icon: 'fa-users', label: 'Staff' },
  { id: 'jobs', icon: 'fa-briefcase', label: 'Jobs' },
  { id: 'analytics', icon: 'fa-chart-line', label: 'Analytics' },
  { id: 'settings', icon: 'fa-gear', label: 'Settings' },
]
```

### Styling Classes Used
- `w-sidebar` (60px) - Width from Tailwind config
- `bg-turf-green` - Green background
- `flex flex-col items-center` - Vertical centering
- `rounded-lg` - Button border radius
- Active state: `bg-white text-turf-green`
- Hover state: `bg-white/20`

### Extending the Navigation
To add a new nav item:
```typescript
{ id: 'reports', icon: 'fa-file-chart', label: 'Reports' }
```

---

## Header Component Features

**File:** `/src/components/layout/Header.tsx`

### Date Formatting
```typescript
const formatDate = (date: Date) => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',      // "Wed"
    month: 'short',         // "Feb"
    day: 'numeric',         // "5"
    year: 'numeric',        // "2025"
  };
  return date.toLocaleDateString('en-US', options);
};
// Output: "Wed Feb 5, 2025"
```

### Header Sections
1. **Left:** "TURFSHEET WHITEBOARD" title
2. **Center:** Date selector with navigation
3. **Right:** User profile (bell + avatar)

### Styling Classes
- `h-header` (60px) - Height from Tailwind config
- `bg-white border-b border-border-color` - White with border
- `font-heading font-bold` - Outfit font, bold
- `bg-bg-main` - Rounded date selector background
- `text-turf-green` - Green workday text

### Customization Points
- Change date format in `formatDate()`
- Add notification count to bell icon
- Add user name/avatar image
- Add dropdown menu to user profile

---

## RightPanel Component Features

**File:** `/src/components/layout/RightPanel.tsx`

### Button Configuration
```typescript
buttons = [
  { id: 1, label: 'Help', color: 'bg-accent-orange' },
  { id: 2, label: 'Display Mode', color: 'bg-accent-grey' },
  { id: 3, label: 'Add A Job', color: 'bg-turf-green' },
  { id: 4, label: 'Add & Manage Equipment', color: 'bg-accent-grey' },
  { id: 5, label: 'Add Staff', color: 'bg-turf-green' },
]
```

### Staff Member Template
```typescript
staffMembers = [
  {
    id: 1,
    name: 'Doug Soldat',
    schedule: 'Enter Weekly Schedule Here'
  },
  // ... more staff
]
```

### Styling Classes
- `w-side-panel` (300px) - Width from Tailwind config
- `bg-white border-l border-border-color` - White with left border
- `overflow-y-auto flex flex-col` - Scrollable column layout
- Button colors: `bg-accent-orange`, `bg-accent-grey`, `bg-turf-green`
- `hover:opacity-90` - Button hover effect

### Adding New Buttons
```typescript
const buttons = [
  // ... existing buttons
  { id: 6, label: 'View Schedule', color: 'bg-turf-green' },
];
```

### Adding New Staff
```typescript
const staffMembers = [
  // ... existing staff
  { id: 5, name: 'Jane Doe', schedule: 'Enter Weekly Schedule Here' },
];
```

---

## App.tsx Main Layout

**File:** `/src/App.tsx`

### Outer Structure
```jsx
<div className="flex h-screen w-screen overflow-hidden bg-white">
  <Sidebar />
  <main className="flex-1 flex flex-col overflow-hidden">
    <Header />
    <div className="flex flex-1 overflow-hidden">
      {/* Task Board */}
      {/* RightPanel */}
    </div>
  </main>
</div>
```

### Job Card Structure
```jsx
<div className="bg-white border border-border-color rounded shadow-sm hover:shadow-md">
  <div className="bg-turf-green text-white px-3 py-2 font-semibold text-sm flex justify-between items-center">
    <span>Job Title</span>
    <i className="fa-solid fa-xmark"></i>
  </div>
  <div className="p-3 space-y-1">
    {/* Job details */}
  </div>
</div>
```

### Job Grid Configuration
```javascript
className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
```
- 1 column on mobile
- 2 columns on tablets (md:)
- 3 columns on laptops (lg:)
- 4 columns on large screens (xl:)

### Section Structure
```jsx
<section className="flex-1 p-5 overflow-y-auto bg-bg-main">
  <div className="space-y-6">
    {/* First Jobs */}
    {/* Second Jobs */}
  </div>
</section>
```

---

## Tailwind Configuration Reference

**File:** `/tailwind.config.js`

### Using Custom Colors in Classes
```javascript
// Defined colors are accessible as:
className="bg-turf-green"        // #73A657
className="bg-turf-green-dark"   // #5D8A46
className="text-turf-green"      // Use as text color
className="border-border-color"  // Use as border
```

### Using Custom Spacing
```javascript
className="w-sidebar"    // 60px width
className="h-header"     // 60px height
className="w-side-panel" // 300px width
```

### Using Custom Fonts
```javascript
className="font-sans"     // Inter (body text)
className="font-heading"  // Outfit (headings)
```

### Using Custom Shadows
```javascript
className="shadow-sm"  // 0 1px 3px rgba(0,0,0,0.12)
className="shadow-md"  // 0 4px 6px rgba(0,0,0,0.08)
className="shadow-lg"  // 0 10px 15px rgba(0,0,0,0.05)
```

---

## Icon Reference (Font Awesome)

**Provided by:** Font Awesome 6.4.0 (CDN)

### Common Icons Used
```html
<i class="fa-solid fa-house"></i>           <!-- Dashboard -->
<i class="fa-solid fa-calendar"></i>        <!-- Calendar -->
<i class="fa-solid fa-users"></i>           <!-- Staff -->
<i class="fa-solid fa-briefcase"></i>       <!-- Jobs -->
<i class="fa-solid fa-chart-line"></i>      <!-- Analytics -->
<i class="fa-solid fa-gear"></i>            <!-- Settings -->
<i class="fa-solid fa-xmark"></i>           <!-- Close/Remove -->
<i class="fa-solid fa-chevron-left"></i>    <!-- Previous -->
<i class="fa-solid fa-chevron-right"></i>   <!-- Next -->
<i class="fa-solid fa-calendar-days"></i>   <!-- Calendar picker -->
<i class="fa-solid fa-bell"></i>            <!-- Notifications -->
<i class="fa-solid fa-circle-user"></i>     <!-- User profile -->
```

---

## CSS Variables (from index.css)

### Font Setup
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;600;700&display=swap');

body {
  font-family: 'Inter', sans-serif;
  color: #1f2937;
  overflow: hidden;
  height: 100vh;
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
}
```

### Scrollbar Styling
```css
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
```

---

## Common Tailwind Utilities Used

### Layout & Display
- `flex` - Flexbox container
- `flex-col` - Column direction
- `gap-X` - Gap between items
- `justify-between` - Space-between alignment
- `items-center` - Center items vertically
- `overflow-hidden` - Hide overflow
- `overflow-y-auto` - Vertical scroll

### Sizing
- `h-screen` - 100vh height
- `w-screen` - 100vw width
- `flex-1` - Flex grow
- `p-X` - Padding
- `px-X` - Horizontal padding
- `py-X` - Vertical padding

### Colors & Backgrounds
- `bg-white` - White background
- `bg-turf-green` - Green background
- `text-white` - White text
- `text-gray-800` - Dark grey text

### Borders & Shadows
- `border` - Add border
- `border-b` - Bottom border
- `border-l` - Left border
- `rounded` - Border radius
- `shadow-sm` - Small shadow
- `shadow-md` - Medium shadow

### Interactions
- `hover:shadow-md` - Hover effect
- `transition-all` - Smooth transition
- `duration-150` - 150ms transition duration
- `cursor-pointer` - Pointer cursor

---

## Build & Deployment Commands

```bash
# Development server
npm run dev
# Output: http://localhost:5178 (or next available port)

# Production build
npm run build
# Output: dist/ directory ready for deployment

# Linting
npm run lint
# Check code quality

# Preview production build
npm run preview
```

---

## Notes for Developers

1. **Component Modularity** - Each layout component can be used independently
2. **State Management** - Currently uses React hooks, ready for Context API/Redux
3. **Responsive Design** - Grid system built with mobile-first approach
4. **Accessibility** - Font Awesome provides semantic icons, buttons include titles
5. **Performance** - Tailwind purges unused CSS in production builds
6. **Type Safety** - TypeScript interfaces used for data structures

---
