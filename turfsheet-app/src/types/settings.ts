export interface AppSettings {
  // Dashboard preferences
  defaultDashboardView: 'classic' | 'whiteboard';

  // Work hours
  workdayStartTime: string; // Format: "HH:MM" (24-hour)
  workdayEndTime: string;   // Format: "HH:MM" (24-hour)

  // Future settings can be added here
  // theme?: 'light' | 'dark';
  // notifications?: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  defaultDashboardView: 'whiteboard',
  workdayStartTime: '07:30',
  workdayEndTime: '14:30',
};
