# TurfSheet Style Guide

This guide defines the visual language and component standards for TurfSheet, ensuring a consistent and premium user experience across all modules. This guide is based on the `SiteExamples` reference and current implementation best practices.

## Foundations

### Color Palette

The TurfSheet color system is built around a signature "Turf Green" and a clean, professional neutral scale.

| Category | Name | Value | Usage |
| :--- | :--- | :--- | :--- |
| **Brand** | Turf Green | `#73A657` | Primary brand color, headers, primary buttons. |
| | Turf Green Dark | `#5D8A46` | Hover states, deep accents. |
| | Turf Green Light | `#E8F0E4` | Background tints, subtle highlights. |
| **Neutral** | Page Background | `#F4F6F8` | Main application background. |
| | Panel White | `#FFFFFF` | Cards, side panels, surfaces. |
| | Border Color | `#E0E4E8` | Dividers, card borders, form outlines. |
| **Text** | Text Primary | `#2C3E50` | Body text, titles, high-contrast labels. |
| | Text Secondary | `#7F8C8D` | Subheaders, descriptions, icons. |
| | Text Muted | `#BDC3C7` | Placeholders, disabled states. |
| **Accent** | Accent Orange | `#F39C12` | Warnings, special highlights (Help). |
| | Accent Grey | `#95A5A6` | Secondary actions, utility buttons. |

### Typography

TurfSheet uses a dual-font system for maximum readability and a premium aesthetic.

- **Headings (H1, H2, H3):** `Outfit`, sans-serif. Bold (700).
- **Body & UI:** `Inter`, sans-serif. Regular (400) to Semi-Bold (600).

### Spacing & Layout

| Token | Value | Description |
| :--- | :--- | :--- |
| `--sidebar-width` | `48px` | Slim, icon-only navigation sidebar. |
| `--header-height` | `60px` | Global top navigation bar height. |
| `--side-panel-width`| `300px` | Secondary information/action panel. |
| `--radius` | `4px` | Standard corner radius for cards and buttons. |

> [!NOTE]
> Recent UI iterations use a "Sharp" aesthetic (0px radius) for the main dashboard cards to match specific mockup requirements. This guide recommends `4px` for general application use to maintain a modern, "soft" feel.

### Shadows

- **Shadow SM:** `0 1px 3px rgba(0,0,0,0.12)`
- **Shadow MD:** `0 4px 6px rgba(0,0,0,0.08)`
- **Shadow LG:** `0 10px 15px rgba(0,0,0,0.05)`

## Components

### Buttons

Buttons come in three primary flavors:

- **Primary (Green):** Background `#73A657`, White text. Used for "Add staff", "Add Job".
- **Warning (Orange):** Background `#EAB35E`, White text. Used for "Help".
- **Neutral (Grey):** Background `#95A5A6`, White text. Used for "Display Mode", "Equipment Management".

### Cards (Job Cards)

Job cards are the primary unit of work on the dashboard.

- **Header:** Background `Turf Green`, White text, Bold. Occupies top of card.
- **Body:** White background, padding `12px`.
- **Details:** Text Primary, Font size `0.85rem`. Labels are Bold (700).
- **Crew Indicator:** Turf Green text, Bold.

### Navigation (Sidebar)

- **Background:** `Turf Green`.
- **Icons:** Minimalist (Lucide-React), centered.
- **Active State:** White background, Turf Green icon color.
- **Hover:** Subtle white opacity (`rgba(255,255,255,0.2)`).

## Design Tokens (CSS Variables)

```css
:root {
  --turf-green: #73A657;
  --turf-green-dark: #5D8A46;
  --turf-green-light: #E8F0E4;
  --bg-main: #F4F6F8;
  --border-color: #E0E4E8;
  --text-primary: #2C3E50;
  --text-secondary: #7F8C8D;
  
  --sidebar-width: 48px;
  --radius: 4px;
  --font-sans: 'Inter', sans-serif;
  --font-heading: 'Outfit', sans-serif;
}
```
