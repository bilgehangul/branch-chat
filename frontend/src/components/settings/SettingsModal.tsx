// frontend/src/components/settings/SettingsModal.tsx
// Modal shell with backdrop, focus trap, and Escape-to-close. PROV-01, XCUT-02.
// Renders via createPortal at z-[9000] (below ConfirmDialog's z-[10000]).
import { createPortal } from 'react-dom';
import { useEffect } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { FreeTierSection } from './FreeTierSection';
import { ByokSection } from './ByokSection';

export function SettingsModal() {
  const { isModalOpen, closeModal } = useSettings();
  const containerRef = useFocusTrap(isModalOpen);

  // Close on Escape key
  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, closeModal]);

  if (!isModalOpen) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={closeModal}
        aria-hidden="true"
        data-testid="settings-backdrop"
      />

      {/* Dialog panel */}
      <div
        ref={containerRef}
        className="relative z-10 w-full max-w-md mx-4 bg-white dark:bg-zinc-800 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        role="document"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 dark:border-zinc-700">
          <h2 className="text-base font-semibold text-stone-900 dark:text-slate-100">
            Settings
          </h2>
          <button
            type="button"
            onClick={closeModal}
            aria-label="Close settings"
            className="p-1.5 rounded-lg text-stone-500 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-zinc-700 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-800 outline-none"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-5 py-4 space-y-4">
          <FreeTierSection />
          <ByokSection />
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
