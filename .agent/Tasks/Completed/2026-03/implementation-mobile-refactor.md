# Phase 1 Design Brief: Mobile Refactor

## 1. Context Survey
The TurfSheet frontend is currently built with React, Vite, Tailwind CSS, and lucide-react icons. 
Currently, the layout (`App.tsx`, `Sidebar.tsx`, `Header.tsx`, `RightPanel.tsx`) relies strongly on flex layouts with fixed-width elements (Sidebar is 48px, RightPanel is 340px) which crush the central content area on mobile devices below `md` (768px) and `lg` (1024px) breakpoints. There is no existing responsive toggle (like a hamburger menu or off-canvas drawer).

## 2. Structure
We will use Tailwind's responsive utility classes (`md:`, `lg:`) to restructure the layout natively without needing heavy new state management, though we may need a simple `isMobileMenuOpen` state in `App.tsx` or a new `MobileNav.tsx`.

### Proposed Changes

#### Modify `turfsheet-app/src/App.tsx`
- Introduce responsive breakpoints (`md:flex-row`, `flex-col`) if necessary, or keep `flex h-screen` but conditionally hide/show panels.
- Add a state hook for mobile menu toggle if we choose a drawer approach.

#### Modify `turfsheet-app/src/components/layout/Header.tsx`
- Hide `CompactWeather` and `DateSelector` on extra small screens (`hidden md:flex`).
- Add a Hamburger Menu icon visible only on mobile (`md:hidden`) for opening the Sidebar/Navigation.
- Adjust font sizes (`text-lg` to `text-base md:text-lg`).

#### Modify `turfsheet-app/src/components/layout/Sidebar.tsx`
- Change from a fixed side panel to a responsive panel.
- On desktop (`md:flex`), it remains a side panel.
- On mobile (`hidden md:flex`), it hides. Alternatively, we can use an off-canvas slide-out or a bottom navigation bar for mobile. *We recommend a slide-out drawer or a condensed bottom tab bar.*

#### Modify `turfsheet-app/src/components/layout/RightPanel.tsx`
- Hide by default on mobile (`hidden xl:flex`).
- Provide a button in the Header or Dashboard to open the RightPanel as a full-screen or slide-up modal on mobile.

## 3. Efficiency
- **CSS First**: We will handle the majority of responsive hiding/showing via Tailwind classes to prevent unnecessary React re-renders. 
- **Lazy Loading Components**: We will ensure the mobile drawer/menus do not introduce heavy DOM nodes unneeded on desktop.

## 4. Security
- No major security implications. We are strictly altering UI presentation and conditional rendering on the client-side. Existing Supabase authentication/RLS rules remain untouched.

## 5. Edge Cases
- **Orientation changes**: Switching from portrait to landscape on tablets should smoothly reveal hidden panels (e.g. tablet landscape functions as desktop).
- **Touch Targets**: Mobile buttons need a minimum of `44x44px` clickable area to prevent fat-finger issues. The `Sidebar` icons are currently `w-10 h-10` which is close to `40px`—we should augment padding natively or use safe touch targets.

---

## User Review Required
> [!IMPORTANT]
> **Design Decision Needed:** For mobile navigation, do you prefer a **Hamburger Menu (Slide-out Drawer)** or a **Bottom Navigation Bar**? 
> Additionally, should the `RightPanel` (Announcements & Working Today) be placed beneath the main content on mobile, or hidden behind a "View Daily Board" button?

## Verification Plan
### Automated Tests
- Build test: `npm run build` inside `turfsheet-app` to ensure no TypeScript/build errors.
### Manual Verification
- Run `npm run dev -- --host` to test on a local mobile device over Wi-Fi.
- Use Chrome DevTools Device Toolbar to simulate iPhone SE, iPad Mini, and Desktop widths.
- Verify touch targets and scroll lock when menus are open.
