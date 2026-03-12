// frontend/src/components/settings/SettingsModal.tsx
// Modal shell with backdrop, focus trap, and Escape-to-close. PROV-01, XCUT-02.
// Redesigned: shows saved keys list, model selector grouped by provider, and BYOK add flow.
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { ByokSection } from './ByokSection';
import { useAuth } from '../../contexts/AuthContext';
import type { ByokProvider } from '../../contexts/SettingsContext';

const MODEL_LISTS: Record<ByokProvider, { id: string; label: string }[]> = {
  gemini: [
    { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { id: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite' },
  ],
  openai: [
    { id: 'o3', label: 'o3' },
    { id: 'o3-mini', label: 'o3 Mini' },
    { id: 'o4-mini', label: 'o4 Mini' },
    { id: 'gpt-4.1', label: 'GPT-4.1' },
    { id: 'gpt-4.1-mini', label: 'GPT-4.1 Mini' },
    { id: 'gpt-4.1-nano', label: 'GPT-4.1 Nano' },
    { id: 'gpt-4o', label: 'GPT-4o' },
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  ],
  anthropic: [
    { id: 'claude-opus-4-6', label: 'Claude Opus 4' },
    { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4' },
    { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
  ],
};

const PROVIDER_LABELS: Record<ByokProvider, string> = {
  gemini: 'Gemini',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
};

function maskKey(key: string): string {
  if (key.length <= 4) return key;
  return `••••${key.slice(-4)}`;
}

export function SettingsModal() {
  const {
    isModalOpen, closeModal, tier, byokProvider, byokModel, byokApiKey,
    setByokModel, clearByokKey, savedKeys, removeKey, switchToKey, switchToFree,
  } = useSettings();
  const { user } = useAuth();
  const containerRef = useFocusTrap(isModalOpen);
  const [showAddKey, setShowAddKey] = useState(false);
  const [confirmDeleteProvider, setConfirmDeleteProvider] = useState<ByokProvider | null>(null);

  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, closeModal]);

  // Reset add-key form when modal closes
  useEffect(() => {
    if (!isModalOpen) {
      setShowAddKey(false);
      setConfirmDeleteProvider(null);
    }
  }, [isModalOpen]);

  if (!isModalOpen) return null;

  // Current active model for the selector
  const activeModelId = tier === 'byok' && byokModel ? `${byokProvider}:${byokModel}` : 'default';

  function handleModelChange(value: string) {
    if (value === 'default') {
      switchToFree(user?.sub ?? null);
    } else {
      const [provider, ...modelParts] = value.split(':');
      const modelId = modelParts.join(':');
      const prov = provider as ByokProvider;
      // Only allow selecting models from providers that have saved keys
      if (savedKeys.some(k => k.provider === prov)) {
        switchToKey(prov, modelId, user?.sub ?? null);
      }
    }
  }

  function handleDeleteKey(provider: ByokProvider) {
    removeKey(provider, user?.sub ?? null);
    setConfirmDeleteProvider(null);
  }

  const modal = (
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={closeModal}
        aria-hidden="true"
        data-testid="settings-backdrop"
      />

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
        <div className="overflow-y-auto px-5 py-4 space-y-5">

          {/* Model selector */}
          <div>
            <label htmlFor="model-select" className="block text-xs font-medium text-stone-500 dark:text-slate-400 mb-1.5">
              Active Model
            </label>
            <select
              id="model-select"
              value={activeModelId}
              onChange={e => handleModelChange(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md border border-stone-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-stone-900 dark:text-slate-100 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-800 outline-none"
              aria-label="Select active model"
            >
              <option value="default">Gemini Flash 2.0 (Free)</option>
              {/* Show provider groups only for providers with saved keys */}
              {(['gemini', 'openai', 'anthropic'] as ByokProvider[]).map(prov => {
                const hasKey = savedKeys.some(k => k.provider === prov);
                if (!hasKey) return null;
                return (
                  <optgroup key={prov} label={PROVIDER_LABELS[prov]}>
                    {MODEL_LISTS[prov].map(m => (
                      <option key={`${prov}:${m.id}`} value={`${prov}:${m.id}`}>
                        {m.label}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>

          {/* Saved API Keys */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-stone-500 dark:text-slate-400">
                API Keys
              </span>
            </div>

            {savedKeys.length === 0 ? (
              <p className="text-xs text-stone-400 dark:text-zinc-500 py-2">
                No API keys added. Using free tier.
              </p>
            ) : (
              <div className="space-y-2">
                {savedKeys.map(({ provider, maskedKey }) => (
                  <div
                    key={provider}
                    className={`flex items-center justify-between px-3 py-2 rounded-md border text-sm ${
                      tier === 'byok' && byokProvider === provider
                        ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/20'
                        : 'border-stone-200 dark:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-stone-700 dark:text-slate-200">
                        {PROVIDER_LABELS[provider]}
                      </span>
                      <span className="text-stone-400 dark:text-zinc-500 text-xs font-mono truncate">
                        {maskKey(maskedKey)}
                      </span>
                      {tier === 'byok' && byokProvider === provider && (
                        <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded">
                          Active
                        </span>
                      )}
                    </div>

                    {/* Delete button */}
                    {confirmDeleteProvider === provider ? (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleDeleteKey(provider)}
                          className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteProvider(null)}
                          className="text-xs px-2 py-1 rounded border border-stone-300 dark:border-zinc-600 text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-zinc-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteProvider(provider)}
                        aria-label={`Delete ${PROVIDER_LABELS[provider]} key`}
                        className="p-1 rounded text-stone-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-stone-100 dark:hover:bg-zinc-700 transition-colors flex-shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add Key button */}
            {!showAddKey && (
              <button
                type="button"
                onClick={() => setShowAddKey(true)}
                className="mt-2 w-full py-2 px-4 text-sm font-medium rounded-md border border-dashed border-stone-300 dark:border-zinc-600 text-stone-500 dark:text-slate-400 hover:border-stone-400 dark:hover:border-zinc-500 hover:text-stone-700 dark:hover:text-slate-200 hover:bg-stone-50 dark:hover:bg-zinc-700/50 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 outline-none"
              >
                + Add API Key
              </button>
            )}

            {/* Inline BYOK add form */}
            {showAddKey && (
              <div className="mt-3">
                <ByokSection onDone={() => setShowAddKey(false)} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
