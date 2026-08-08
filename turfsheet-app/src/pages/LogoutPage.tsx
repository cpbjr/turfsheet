import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function LogoutPage() {
  const { signOut } = useAuth();

  useEffect(() => {
    // Clearing the session drops the gate back to the login page on its own.
    signOut();
  }, [signOut]);

  return (
    <div className="p-8 text-text-secondary">Signing out…</div>
  );
}
