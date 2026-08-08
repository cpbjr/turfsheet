/**
 * The auth context object and its hook, kept out of AuthContext.tsx so that file exports
 * only the AuthProvider component. Mixing component and non-component exports in one module
 * defeats Fast Refresh (react-hooks/only-export-components).
 */

import { createContext, useContext } from 'react';
import type { Session } from '@supabase/supabase-js';

export interface AuthContextType {
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
