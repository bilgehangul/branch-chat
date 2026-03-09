import { useState, useEffect } from 'react';

export function AuthExpiredBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleAuthExpired() {
      setVisible(true);
    }
    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed top-12 left-0 right-0 z-40 bg-amber-50 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100 text-sm px-4 py-2 flex items-center justify-center gap-3">
      <span>Session expired</span>
      <button
        onClick={() => { setVisible(false); window.location.reload(); }}
        className="underline font-medium hover:no-underline"
      >
        Sign in again
      </button>
    </div>
  );
}
