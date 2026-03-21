# Design Brief: Maintenance Photos Feature

## Context Survey
- **Existing Setup:** The app is a Vite React SPA using `@supabase/supabase-js`. 
- **Current Flow:** `MaintenancePage.tsx` lists issues and has a "Detail Modal" to view them securely.
- **Backend Architecture Decision:** **Single Source of Truth.** To prevent a "coding nightmare" and duplicated logic, the OpenClaw agent is the sole processor of new maintenance issues and photo uploads.
- **Goal:** Allow the UI to gracefully display uploaded photos, and document the future approach for web-based creation.

## Structure
1. **Storage Bucket:** A Supabase storage bucket named `maintenance-photos` was created and set to **Public** to allow simple read access.
2. **Database:** The `photo_url` column in `turfsheet.maintenance_issues` is solely populated by OpenClaw.
3. **Frontend Display Logic:** `MaintenancePage.tsx` renders the image and provides a click-to-enlarge fullscreen lightbox overlay using a high `z-index` overlay to appear above existing modals.
4. **Future Web Creation Flow:** If web-based creation is eventually needed, the web app will NOT write to Supabase directly. Instead, the UI will present a form and send an HTTP `POST` webhook to the OpenClaw Agent host, passing the text payload and photo file. The OpenClaw agent will parse, validate, and securely upload the data precisely as if it came from Telegram. 

## Efficiency
- The web app avoids bundling heavy upload/compression logic by offloading it entirely to OpenClaw.
- Public bucket URLs allow standard frontend browser caching for images.

## Security
- **Data Integrity:** The OpenClaw agent (acting via a Service Role key or backend auth) is the only entity authorized to insert records and upload images.
- **Storage Policies:** 
  - Allow `SELECT` for public visitors (strictly limited to `maintenance-photos`).
  - Web users cannot modify the bucket or bypass the agent.

## Edge Cases
- **Missing File:** Handled natively by rendering the photo block conditionally.
- **Broken Link:** The enlarge overlay gracefully falls back to the standard browser broken-image icon.
- **Web App Downtime:** OpenClaw via Telegram remains entirely functional for staff in the field, ensuring no interruption to logging maintenance issues.
