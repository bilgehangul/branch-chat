// frontend/src/components/settings/ByokSection.tsx
// Collapsible BYOK (Bring Your Own API Key) form section. PROV-02, PROV-03, PROV-04.
import { useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import type { ByokProvider } from '../../contexts/SettingsContext';

const PROVIDERS: { id: ByokProvider; label: string }[] = [
  { id: 'gemini', label: 'Gemini' },
  { id: 'openai', label: 'OpenAI' },
  { id: 'anthropic', label: 'Anthropic' },
];

const PLACEHOLDERS: Record<ByokProvider, string> = {
  gemini: 'AIza...',
  openai: 'sk-...',
  anthropic: 'sk-ant-...',
};

export function ByokSection() {
  const {
    tier,
    byokProvider,
    byokApiKey,
    byokKeyVerified,
    searchProvider,
    setByokProvider,
    setByokApiKey,
    setSearchProvider,
    clearByokKey,
  } = useSettings();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="border border-stone-200 dark:border-zinc-700 rounded-lg overflow-hidden">
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setIsExpanded(prev => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-stone-700 dark:text-slate-200 hover:bg-stone-50 dark:hover:bg-zinc-700/50 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-800 outline-none"
        aria-expanded={isExpanded}
        aria-controls="byok-section-content"
      >
        <span>Use Your Own API Key</span>
        {/* Chevron icon */}
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div
          id="byok-section-content"
          className="px-4 pb-4 space-y-4 border-t border-stone-200 dark:border-zinc-700 pt-4"
        >
          {/* Provider selector */}
          <div>
            <label className="block text-xs font-medium text-stone-500 dark:text-slate-400 mb-1.5">
              Provider
            </label>
            <div className="flex gap-1" role="group" aria-label="Select provider">
              {PROVIDERS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setByokProvider(id)}
                  className={`flex-1 py-1.5 px-2 text-sm rounded-md border transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-800 outline-none
                    ${byokProvider === id
                      ? 'bg-blue-500 text-white border-blue-500 font-medium'
                      : 'bg-white dark:bg-zinc-800 text-stone-600 dark:text-slate-300 border-stone-300 dark:border-zinc-600 hover:bg-stone-50 dark:hover:bg-zinc-700'
                    }`}
                  aria-pressed={byokProvider === id}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* API key input */}
          <div>
            <label htmlFor="byok-api-key" className="block text-xs font-medium text-stone-500 dark:text-slate-400 mb-1.5">
              API Key
            </label>
            <div className="flex gap-2">
              <input
                id="byok-api-key"
                type={showKey ? 'text' : 'password'}
                value={byokApiKey ?? ''}
                onChange={e => setByokApiKey(e.target.value || null)}
                placeholder={byokProvider ? PLACEHOLDERS[byokProvider] : 'Select a provider first'}
                disabled={!byokProvider}
                className="flex-1 text-sm px-3 py-2 rounded-md border border-stone-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-stone-900 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-zinc-500 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-800 outline-none"
                autoComplete="off"
                spellCheck={false}
              />
              {/* Show/hide toggle */}
              <button
                type="button"
                onClick={() => setShowKey(prev => !prev)}
                aria-label={showKey ? 'Hide API key' : 'Show API key'}
                className="p-2 rounded-md border border-stone-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-stone-500 dark:text-slate-400 hover:bg-stone-50 dark:hover:bg-zinc-700 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-800 outline-none"
              >
                {showKey ? (
                  // Eye-off icon
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  // Eye icon
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Verify Key button placeholder (wired in 11-04) */}
          <button
            type="button"
            disabled={!byokApiKey || !byokProvider}
            className="w-full py-2 px-4 text-sm font-medium rounded-md bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-800 outline-none"
            aria-label="Verify API key"
          >
            Verify Key
          </button>

          {/* Model selector placeholder — enabled after verification in 11-04 */}
          <div>
            <label htmlFor="byok-model" className="block text-xs font-medium text-stone-500 dark:text-slate-400 mb-1.5">
              Model
            </label>
            <select
              id="byok-model"
              disabled={!byokKeyVerified}
              className="w-full text-sm px-3 py-2 rounded-md border border-stone-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-stone-900 dark:text-slate-100 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-800 outline-none"
              aria-label="Select model"
            >
              <option value="">Verify key first</option>
            </select>
          </div>

          {/* Search provider dropdown — only for OpenAI */}
          {byokProvider === 'openai' && (
            <div>
              <label htmlFor="search-provider" className="block text-xs font-medium text-stone-500 dark:text-slate-400 mb-1.5">
                Search Provider
              </label>
              <select
                id="search-provider"
                value={searchProvider}
                onChange={e => setSearchProvider(e.target.value as 'tavily' | 'openai-search')}
                className="w-full text-sm px-3 py-2 rounded-md border border-stone-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-stone-900 dark:text-slate-100 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-800 outline-none"
                aria-label="Select search provider"
              >
                <option value="tavily">Tavily (default)</option>
                <option value="openai-search">OpenAI Web Search</option>
              </select>
            </div>
          )}

          {/* Save button — disabled until key verified (wiring in 11-04) */}
          <button
            type="button"
            disabled={!byokKeyVerified}
            className="w-full py-2 px-4 text-sm font-medium rounded-md bg-stone-800 dark:bg-slate-200 text-white dark:text-zinc-900 hover:bg-stone-700 dark:hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-800 outline-none"
            aria-label="Save BYOK settings"
          >
            Save Settings
          </button>

          {/* Clear Key button — only visible when on byok tier */}
          {tier === 'byok' && (
            <button
              type="button"
              onClick={() => clearByokKey(null)}
              className="w-full py-2 px-4 text-sm font-medium rounded-md border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-800 outline-none"
              aria-label="Clear API key and reset to free tier"
            >
              Clear Key &amp; Reset to Free
            </button>
          )}
        </div>
      )}
    </div>
  );
}
