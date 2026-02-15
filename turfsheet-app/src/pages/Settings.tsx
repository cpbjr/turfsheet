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
