/**
 * The settings context object and its hook, kept out of SettingsContext.tsx so that file
 * exports only the SettingsProvider component. Mixing component and non-component exports in
 * one module defeats Fast Refresh (react-hooks/only-export-components).
 */

import { createContext, useContext } from 'react';
import type { AppSettings } from '../types/settings';

export interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
