import { useState, useEffect } from 'react';

export function NetworkBanner() {
  const [offline, setOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  useEffect(() => {
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed top-12 left-0 right-0 z-40 bg-red-50 dark:bg-red-950 border-b border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-sm px-4 py-2 text-center">
      No internet connection
    </div>
  );
}
