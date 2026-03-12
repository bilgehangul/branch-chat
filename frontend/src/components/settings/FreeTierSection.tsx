// frontend/src/components/settings/FreeTierSection.tsx
// Informational label showing the current free-tier model. PROV-01.
// Per user decision: NO toggle — this is informational only.

export function FreeTierSection() {
  return (
    <div className="flex items-center gap-2 px-1 py-2">
      {/* Sparkle icon for Gemini */}
      <svg
        className="w-4 h-4 text-blue-500 flex-shrink-0"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 2 L13.5 9.5 L21 12 L13.5 14.5 L12 22 L10.5 14.5 L3 12 L10.5 9.5 Z" />
      </svg>
      <span className="text-sm text-stone-600 dark:text-slate-400">
        Current Model:{' '}
        <span className="font-medium text-stone-800 dark:text-slate-200">
          Gemini Flash 2.0 (Free)
        </span>
      </span>
    </div>
  );
}
