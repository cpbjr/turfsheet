import { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { Check, RotateCcw } from 'lucide-react';

export default function Settings() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    if (confirm('Reset all settings to defaults?')) {
      resetSettings();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const formatTimeForInput = (time: string) => time;
  const formatTimeForDisplay = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="min-h-screen bg-dashboard-bg p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-text-primary mb-2">
            Settings
          </h1>
          <p className="text-text-secondary font-sans">
            Configure your TurfSheet preferences
          </p>
        </div>

        {/* Settings Form */}
        <div className="bg-panel-white border border-border-color rounded-lg shadow-sm">
          {/* Dashboard Preferences */}
          <div className="p-6 border-b border-border-color">
            <h2 className="text-lg font-heading font-bold text-text-primary mb-4">
              Dashboard
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-sans font-medium text-text-primary mb-2">
                  Default Dashboard View
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border border-border-color rounded hover:bg-dashboard-bg/30 cursor-pointer">
                    <input
                      type="radio"
                      name="dashboardView"
                      value="whiteboard"
                      checked={settings.defaultDashboardView === 'whiteboard'}
                      onChange={(e) => {
                        updateSettings({ defaultDashboardView: e.target.value as 'whiteboard' });
                        handleSave();
                      }}
                      className="w-4 h-4 text-turf-green"
                    />
                    <div className="flex-1">
                      <div className="font-sans font-medium text-text-primary">
                        Staff Whiteboard
                      </div>
                      <div className="text-sm text-text-secondary">
                        Staff-centric view with primary and second jobs (recommended)
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border border-border-color rounded hover:bg-dashboard-bg/30 cursor-pointer">
                    <input
                      type="radio"
                      name="dashboardView"
                      value="classic"
                      checked={settings.defaultDashboardView === 'classic'}
                      onChange={(e) => {
                        updateSettings({ defaultDashboardView: e.target.value as 'classic' });
                        handleSave();
                      }}
                      className="w-4 h-4 text-turf-green"
                    />
                    <div className="flex-1">
                      <div className="font-sans font-medium text-text-primary">
                        Classic Dashboard
                      </div>
                      <div className="text-sm text-text-secondary">
                        Job-centric view with sections and priorities
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Organization Profile */}
          <div className="p-6 border-b border-border-color">
            <h2 className="text-lg font-heading font-bold text-text-primary mb-4">
              Organization Profile
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-sans font-medium text-text-primary mb-2">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    value={settings.organizationName}
                    onChange={(e) => {
                      updateSettings({ organizationName: e.target.value });
                      handleSave();
                    }}
                    placeholder="e.g. White Pine Management"
                    className="w-full px-4 py-2 border border-border-color rounded font-sans focus:outline-none focus:border-turf-green"
                  />
                </div>
                <div>
                  <label className="block text-sm font-sans font-medium text-text-primary mb-2">
                    Course Name
                  </label>
                  <input
                    type="text"
                    value={settings.courseName}
                    onChange={(e) => {
                      updateSettings({ courseName: e.target.value });
                      handleSave();
                    }}
                    placeholder="e.g. Banbury Golf Course"
                    className="w-full px-4 py-2 border border-border-color rounded font-sans focus:outline-none focus:border-turf-green"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-sans font-medium text-text-primary mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={settings.location}
                  onChange={(e) => {
                    updateSettings({ location: e.target.value });
                    handleSave();
                  }}
                  placeholder="e.g. Eagle, ID 83616"
                  className="w-full px-4 py-2 border border-border-color rounded font-sans focus:outline-none focus:border-turf-green"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-sans font-medium text-text-primary mb-2">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => {
                      updateSettings({ contactEmail: e.target.value });
                      handleSave();
                    }}
                    placeholder="contact@example.com"
                    className="w-full px-4 py-2 border border-border-color rounded font-sans focus:outline-none focus:border-turf-green"
                  />
                </div>
                <div>
                  <label className="block text-sm font-sans font-medium text-text-primary mb-2">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={settings.contactPhone}
                    onChange={(e) => {
                      updateSettings({ contactPhone: e.target.value });
                      handleSave();
                    }}
                    placeholder="(208) 555-1234"
                    className="w-full px-4 py-2 border border-border-color rounded font-sans focus:outline-none focus:border-turf-green"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-sans font-medium text-text-primary mb-2">
                  Timezone
                </label>
                <select
                  value={settings.timezone}
                  onChange={(e) => {
                    updateSettings({ timezone: e.target.value });
                    handleSave();
                  }}
                  className="w-full px-4 py-2 border border-border-color rounded font-sans focus:outline-none focus:border-turf-green"
                >
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Phoenix">Arizona Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="America/Anchorage">Alaska Time</option>
                  <option value="Pacific/Honolulu">Hawaii Time</option>
                </select>
              </div>
            </div>
          </div>

          {/* Work Hours */}
          <div className="p-6 border-b border-border-color">
            <h2 className="text-lg font-heading font-bold text-text-primary mb-4">
              Work Hours
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-sans font-medium text-text-primary mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={formatTimeForInput(settings.workdayStartTime)}
                  onChange={(e) => {
                    updateSettings({ workdayStartTime: e.target.value });
                    handleSave();
                  }}
                  className="w-full px-4 py-2 border border-border-color rounded font-sans focus:outline-none focus:border-turf-green"
                />
                <p className="mt-1 text-xs text-text-secondary">
                  Currently: {formatTimeForDisplay(settings.workdayStartTime)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-sans font-medium text-text-primary mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={formatTimeForInput(settings.workdayEndTime)}
                  onChange={(e) => {
                    updateSettings({ workdayEndTime: e.target.value });
                    handleSave();
                  }}
                  className="w-full px-4 py-2 border border-border-color rounded font-sans focus:outline-none focus:border-turf-green"
                />
                <p className="mt-1 text-xs text-text-secondary">
                  Currently: {formatTimeForDisplay(settings.workdayEndTime)}
                </p>
              </div>
            </div>
          </div>

          {/* User Preferences */}
          <div className="p-6 border-b border-border-color">
            <h2 className="text-lg font-heading font-bold text-text-primary mb-4">
              User Preferences
            </h2>

            <div className="space-y-4">
              <label className="flex items-center justify-between p-3 border border-border-color rounded hover:bg-dashboard-bg/30 cursor-pointer">
                <div>
                  <div className="font-sans font-medium text-text-primary">
                    Enable Notifications
                  </div>
                  <div className="text-sm text-text-secondary">
                    Receive in-app notifications for important events
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableNotifications}
                  onChange={(e) => {
                    updateSettings({ enableNotifications: e.target.checked });
                    handleSave();
                  }}
                  className="w-5 h-5 text-turf-green rounded focus:ring-turf-green"
                />
              </label>

              <label className="flex items-center justify-between p-3 border border-border-color rounded hover:bg-dashboard-bg/30 cursor-pointer">
                <div>
                  <div className="font-sans font-medium text-text-primary">
                    Email Alerts
                  </div>
                  <div className="text-sm text-text-secondary">
                    Receive email notifications for task assignments
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableEmailAlerts}
                  onChange={(e) => {
                    updateSettings({ enableEmailAlerts: e.target.checked });
                    handleSave();
                  }}
                  className="w-5 h-5 text-turf-green rounded focus:ring-turf-green"
                />
              </label>

              <label className="flex items-center justify-between p-3 border border-border-color rounded hover:bg-dashboard-bg/30 cursor-pointer">
                <div>
                  <div className="font-sans font-medium text-text-primary">
                    Sound Alerts
                  </div>
                  <div className="text-sm text-text-secondary">
                    Play sounds for notifications and alerts
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableSoundAlerts}
                  onChange={(e) => {
                    updateSettings({ enableSoundAlerts: e.target.checked });
                    handleSave();
                  }}
                  className="w-5 h-5 text-turf-green rounded focus:ring-turf-green"
                />
              </label>

              <label className="flex items-center justify-between p-3 border border-border-color rounded hover:bg-dashboard-bg/30 cursor-pointer">
                <div>
                  <div className="font-sans font-medium text-text-primary">
                    Weather Alerts
                  </div>
                  <div className="text-sm text-text-secondary">
                    Show alerts for severe weather conditions
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showWeatherAlerts}
                  onChange={(e) => {
                    updateSettings({ showWeatherAlerts: e.target.checked });
                    handleSave();
                  }}
                  className="w-5 h-5 text-turf-green rounded focus:ring-turf-green"
                />
              </label>

              <label className="flex items-center justify-between p-3 border border-border-color rounded hover:bg-dashboard-bg/30 cursor-pointer">
                <div>
                  <div className="font-sans font-medium text-text-primary">
                    Auto-save Drafts
                  </div>
                  <div className="text-sm text-text-secondary">
                    Automatically save form drafts as you type
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoSaveDrafts}
                  onChange={(e) => {
                    updateSettings({ autoSaveDrafts: e.target.checked });
                    handleSave();
                  }}
                  className="w-5 h-5 text-turf-green rounded focus:ring-turf-green"
                />
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 flex items-center justify-between">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-sm font-sans text-text-secondary hover:text-text-primary border border-border-color rounded hover:bg-dashboard-bg/30 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Defaults
            </button>

            {saved && (
              <div className="flex items-center gap-2 text-turf-green font-sans text-sm">
                <Check className="w-4 h-4" />
                Settings saved automatically
              </div>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-turf-green-light border border-turf-green/20 rounded">
          <p className="text-sm font-sans text-text-primary">
            <strong>Note:</strong> Settings are saved automatically and stored locally in your browser.
            You can switch between dashboard views at any time using the navigation menu.
          </p>
        </div>
      </div>
    </div>
  );
}
