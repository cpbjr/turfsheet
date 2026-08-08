import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Leave `/logout` before/while clearing the session.
 *
 * If the URL stays on `/logout`, a successful re-login remounts this page and
 * immediately signs the user out again (AuthGate re-opens Routes after login).
 * Navigate first: once session is null AuthGate unmounts this component, so a
 * post-signOut navigate would never run.
 */
export default function LogoutPage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/', { replace: true });
    void signOut();
  }, [signOut, navigate]);

  return (
    <div className="p-8 text-text-secondary">Signing out…</div>
  );
}
