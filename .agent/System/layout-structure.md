# TurfSheet Dashboard - Layout Structure

## Visual Layout Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    App Container (100vh × 100vw)                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────┬────────────────────────────────────────────────┬─────────┐  │
│  │    │                                                 │         │  │
│  │    │         HEADER                                  │         │  │
│  │    │  "TURFSHEET WHITEBOARD"  [Date]  [Bell] [User] │         │  │
│  │    │                         60px height             │         │  │
│  │    │                                                 │         │  │
│  ├────┼────────────────────────────────────────────────┼─────────┤  │
│  │    │                                                 │         │  │
│  │SIDE│                                                 │  RIGHT  │  │
│  │ BAR│         MAIN CONTENT - TASK BOARD              │  PANEL  │  │
│  │    │                                                 │         │  │
│  │60px│  ┌─────────────────────────────────────┐      │ 300px   │  │
│  │    │  │ FIRST JOBS                          │      │         │  │
│  │    │  │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐│      │         │  │
│  │    │  │ │ Card │ │ Card │ │ Card │ │ Card ││      │ Buttons:│  │
│  │    │  │ │      │ │      │ │      │ │      ││      │ • Help  │  │
│  │    │  │ └──────┘ └──────┘ └──────┘ └──────┘│      │ • Mode  │  │
│  │    │  │                                     │      │ • Job   │  │
│  │    │  │ SECOND JOBS                         │      │ • Equip │  │
│  │    │  │ ┌──────┐                            │      │ • Staff │  │
│  │    │  │ │ Card │                            │      │         │  │
│  │    │  │ └──────┘                            │      │ Staff:  │  │
│  │    │  └─────────────────────────────────────┘      │ • Doug  │  │
│  │    │                                                 │ • John  │  │
│  │    │                                                 │ • Tony  │  │
│  │    │                                                 │ • Peter │  │
│  │    │                                                 │         │  │
│  └────┴────────────────────────────────────────────────┴─────────┘  │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
App.tsx
├── Sidebar (60px width)
│   ├── Logo (white "T" circle)
│   └── Navigation (6 items)
│       ├── Dashboard (home icon) - ACTIVE
│       ├── Calendar
│       ├── Staff
│       ├── Jobs
│       ├── Analytics
│       └── Settings
│
├── Main Content Area (flex-1)
│   ├── Header (60px height)
│   │   ├── Title: "TURFSHEET WHITEBOARD"
│   │   ├── Date Selector
│   │   │   ├── Previous arrow
│   │   │   ├── Date display
│   │   │   ├── Calendar icon
│   │   │   ├── Next arrow
│   │   │   └── Workday hours
│   │   └── User Profile
│   │       ├── Notification bell (red dot)
│   │       └── User avatar
│   │
│   └── Dashboard Content (flex-1)
│       ├── Task Board (flex-1, scrollable)
│       │   ├── First Jobs Section
│       │   │   └── Job Cards Grid
│       │   │       ├── Mow Greens
│       │   │       ├── Mow Fairways
│       │   │       ├── Mow Approaches
│       │   │       └── Roll Greens
│       │   │
│       │   └── Second Jobs Section
│       │       └── Job Cards Grid
│       │           └── Change Cups
│       │
│       └── RightPanel (300px width, scrollable)
│           ├── Button Panel
│           │   ├── Help (orange)
│           │   ├── Display Mode (grey)
│           │   ├── Add A Job (green)
│           │   ├── Add & Manage Equipment (grey)
│           │   └── Add Staff (green)
│           │
│           └── Staff Section
│               ├── Doug Soldat
│               ├── John User
│               ├── Tony Smith
│               └── Peter Jackson
```

---

## Grid Responsive Behavior

### Job Card Grid
```
Mobile (< 768px):
┌────────────┐
│   Card     │
└────────────┘
│   Card     │
└────────────┘
(1 column)

Tablet (768px - 1024px):
┌────────────┬────────────┐
│   Card     │   Card     │
└────────────┴────────────┘
│   Card     │   Card     │
└────────────┴────────────┘
(2 columns)

Laptop (1024px - 1280px):
┌────────────┬────────────┬────────────┐
│   Card     │   Card     │   Card     │
└────────────┴────────────┴────────────┘
(3 columns)

Desktop (> 1280px):
┌────────────┬────────────┬────────────┬────────────┐
│   Card     │   Card     │   Card     │   Card     │
└────────────┴────────────┴────────────┴────────────┘
(4 columns)
```

---

## Color Zones

```
┌─────────────────────────────────────────────────────────────────────┐
│                        White Background                              │
│                                                                       │
│  ┌────┬────────────────────────────────────────────┬─────────┐      │
│  │ 🟢 │             White Background                │ 🟤      │      │
│  │ 🟢 │             HEADER                           │ White   │      │
│  │ 🟢 │ Light Grey Background (bg-bg-main)          │ Border  │      │
│  │    │ (#F4F6F8)                                   │ Left    │      │
│  │    │ ┌──────────────────────────────────────┐    │         │      │
│  │    │ │  WHITE CARD                          │    │ 🟠🟠🟠   │      │
│  │    │ │  ┌──────────────────────────────┐    │    │ 🟠 🔘 🟠│      │
│  │    │ │  │ 🟢 Green Header              │    │    │ 🟠🟠🟠   │      │
│  │    │ │  │ Job Title & Close Icon       │    │    │         │      │
│  │    │ │  ├──────────────────────────────┤    │    │ 🔘 🔘   │      │
│  │    │ │  │ Details...                   │    │    │ 🟩 🟩   │      │
│  │    │ │  │ 🟢 Crew Needed: 3            │    │    │ 🟩 🟩   │      │
│  │    │ │  │ 🟢 Assign Crew               │    │    │         │      │
│  │    │ │  └──────────────────────────────┘    │    │ Staff   │      │
│  │    │ └──────────────────────────────────────┘    │ Names   │      │
│  │    │                                             │         │      │
│  └────┴────────────────────────────────────────────┴─────────┘      │
│                                                                       │
│  Legend:                                                              │
│  🟢 = Turf Green (#73A657)                                           │
│  🟤 = Text Secondary (#7F8C8D)                                       │
│  🔘 = Grey Accent (#95A5A6) or Light Green (#E8F0E4)                │
│  🟠 = Accent Orange (#EAB35E)                                        │
│  🟩 = Green Buttons (Turf Green)                                     │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Job Card Anatomy

```
┌─────────────────────────────────┐
│ 🟢 Mow Greens           ✕       │  ← Green header with title & close
├─────────────────────────────────┤
│                                   │
│ Mow Direction: Left to Right (8-2)│
│ Clean Up: Clockwise               │
│ HOC: 0.125"                        │
│                                   │
│ 🟢 Crew Needed: 3                 │  ← Green text
│ 🟢 Assign Crew                    │  ← Green link/button
│                                   │
└─────────────────────────────────┘

Styling:
- Card: White background, light border, subtle shadow
- On hover: Shadow increases, card lifts slightly up
- Header: Turf green background, white text, flexbox
- Body: Light padding, small font sizes
- Links: Green text, hover to darker green
```

---

## Dimensions Reference

### Container Widths
- **Total width:** 100vw (100% viewport)
- **Sidebar:** 60px (fixed, left)
- **Right Panel:** 300px (fixed, right)
- **Main content:** calc(100vw - 360px)

### Container Heights
- **Total height:** 100vh (100% viewport)
- **Header:** 60px (fixed, top)
- **Sidebar:** 100vh (full height)
- **Main/Right content:** calc(100vh - 60px)
- **Task board:** 100% - 60px (scrollable)

### Spacing
- **Sidebar logo margin:** 30px bottom
- **Sidebar nav gaps:** 15px bottom
- **Header padding:** 24px horizontal
- **Header gaps:** 20px (between sections)
- **Panel sections:** 5px padding
- **Job cards grid:** 16px gap

### Component Sizes
- **Nav buttons:** 40px × 40px (rounded 8px)
- **Logo circle:** 32px × 32px (circle)
- **Job cards:** 280px minimum width
- **Button padding:** 10px
- **Text sizes:** xs (0.75rem), sm (0.875rem), base (1rem)

---

## Z-Index Stacking

```
Level 100: Sidebar
Level 50:  (reserved for modals/dropdowns)
Level 0:   Header, Main content, Right panel
```

---

## Scroll Behavior

### Horizontal Scrolling
- **Disabled everywhere** - Fixed sidebars prevent horizontal scroll

### Vertical Scrolling
- **Header:** No scroll (fixed, 60px)
- **Sidebar:** No scroll (navigation always visible)
- **Task board:** Scrollable (overflow-y-auto)
- **Right panel:** Scrollable (overflow-y-auto)
- **Custom scrollbar:** 6px wide, grey (#d1d5db), hover darker

---

## Accessibility Features

1. **Button Titles** - Navigation items have tooltips
2. **Icon Labels** - Font Awesome semantic icons
3. **Color Contrast** - All text meets WCAG AA standards
4. **Keyboard Navigation** - All buttons are keyboard accessible
5. **Focus States** - Clear active/focus indicators

---

## Dark Mode Support (Future)

The CSS is structured to support dark mode via `.dark` class on root element:

```css
/* Light mode (default) */
body { background: white; color: #1f2937; }

/* Dark mode (when class="dark" on html) */
.dark body { background: #1f2937; color: white; }
```

To enable: `document.documentElement.classList.add('dark')`

---
