export interface AppSettings {
  // Dashboard preferences
  defaultDashboardView: 'classic' | 'whiteboard';

  // Work hours
  workdayStartTime: string; // Format: "HH:MM" (24-hour)
  workdayEndTime: string;   // Format: "HH:MM" (24-hour)

  // Organization Profile
  organizationName: string;
  courseName: string;
  location: string;
  contactEmail: string;
  contactPhone: string;
  timezone: string;

  // User Preferences
  enableNotifications: boolean;
  enableEmailAlerts: boolean;
  enableSoundAlerts: boolean;
  showWeatherAlerts: boolean;
  autoSaveDrafts: boolean;

  // Future settings can be added here
  // theme?: 'light' | 'dark';
}

export const DEFAULT_SETTINGS: AppSettings = {
  defaultDashboardView: 'whiteboard',
  workdayStartTime: '07:30',
  workdayEndTime: '14:30',

  // Organization defaults
  organizationName: '',
  courseName: '',
  location: '',
  contactEmail: '',
  contactPhone: '',
  timezone: 'America/New_York',

  // User preference defaults
  enableNotifications: true,
  enableEmailAlerts: false,
  enableSoundAlerts: true,
  showWeatherAlerts: true,
  autoSaveDrafts: true,
};
