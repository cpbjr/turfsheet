import { useEffect, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginPage from '../pages/LoginPage';

/**
 * The anonymous exemption is the pin handout token, not the /maps route.
 * Bare /maps still requires a session, otherwise the pin editor stays public.
 * Token length mirrors the guard in MapsPage.tsx.
 */
export function isPinHandoutRequest(pathname: string, search: string): boolean {
  if (pathname !== '/maps') return false;
  const token = (new URLSearchParams(search).get('pinToken') || '').trim();
  return token.length >= 16;
}

/** Drop a stuck `/logout` URL so login cannot remount LogoutPage and sign out again. */
function LoggedOut() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === '/logout') {
      navigate('/', { replace: true });
    }
  }, [location.pathname, navigate]);

  return <LoginPage />;
}

export default function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  // Checked before `loading` resolves so clubhouse visitors never see a login flash.
  if (isPinHandoutRequest(location.pathname, location.search)) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-dashboard-bg">
        <div className="w-8 h-8 border-2 border-border-color border-t-turf-green rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <LoggedOut />;
  }

  return <>{children}</>;
}
