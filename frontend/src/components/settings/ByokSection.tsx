// frontend/src/components/settings/ByokSection.tsx
// BYOK add-key form. Used inline inside SettingsModal when user clicks "+ Add API Key".
import { useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import type { ByokProvider } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

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

interface ByokSectionProps {
  onDone?: () => void;
}

export function ByokSection({ onDone }: ByokSectionProps) {
  const {
    byokProvider, byokApiKey, byokKeyVerified, savedKeys,
    setByokProvider, setByokApiKey, setByokKeyVerified,
    saveByokSettings,
  } = useSettings();
  const { getToken, user } = useAuth();

  const [showKey, setShowKey] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Filter out providers that already have saved keys
  const availableProviders = PROVIDERS.filter(
    p => !savedKeys.some(k => k.provider === p.id)
  );

  function handleProviderChange(provider: ByokProvider) {
    setByokProvider(provider);
    setVerifyResult(null);
  }

  async function handleVerify() {
    if (!byokProvider || !byokApiKey) return;
    setIsVerifying(true);
    setVerifyResult(null);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/verify-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ provider: byokProvider, apiKey: byokApiKey }),
      });
      const json = await res.json() as { data?: { valid: boolean; message?: string }; error?: string };
      if (json.data?.valid) {
        setByokKeyVerified(true);
        setVerifyResult({ success: true, message: json.data.message ?? 'Key verified' });
      } else {
        setByokKeyVerified(false);
        setVerifyResult({ success: false, message: json.data?.message ?? json.error ?? 'Verification failed' });
      }
    } catch {
      setByokKeyVerified(false);
      setVerifyResult({ success: false, message: 'Network error during verification' });
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleSave() {
    if (!byokKeyVerified) return;
    setIsSaving(true);
    try {
      await saveByokSettings(user?.sub ?? null);
      onDone?.();
    } finally {
      setIsSaving(false);
    }
  }

  const canVerify = !!(byokApiKey && byokProvider) && !isVerifying;

  return (
    <div className="border border-stone-200 dark:border-zinc-700 rounded-lg p-4 space-y-3 bg-stone-50 dark:bg-zinc-800/50">
      {/* Provider selector */}
      <div>
        <label className="block text-xs font-medium text-stone-500 dark:text-slate-400 mb-1.5">
          Provider
        </label>
        {availableProviders.length === 0 ? (
          <p className="text-xs text-stone-400 dark:text-zinc-500">
            Keys added for all providers.
          </p>
        ) : (
          <div className="flex gap-1" role="group" aria-label="Select provider">
            {availableProviders.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => handleProviderChange(id)}
                className={`flex-1 py-1.5 px-2 text-sm rounded-md border transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 outline-none
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
        )}
      </div>

      {/* API key input */}
      {byokProvider && (
        <>
          <div>
            <label htmlFor="byok-api-key" className="block text-xs font-medium text-stone-500 dark:text-slate-400 mb-1.5">
              API Key
            </label>
            <div className="flex gap-2">
              <input
                id="byok-api-key"
                type={showKey ? 'text' : 'password'}
                value={byokApiKey ?? ''}
                onChange={e => {
                  setByokApiKey(e.target.value || null);
                  if (byokKeyVerified) {
                    setByokKeyVerified(false);
                    setVerifyResult(null);
                  }
                }}
                placeholder={PLACEHOLDERS[byokProvider]}
                className="flex-1 text-sm px-3 py-2 rounded-md border border-stone-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-stone-900 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-zinc-500 focus-visible:ring-2 focus-visible:ring-blue-500 outline-none"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setShowKey(prev => !prev)}
                aria-label={showKey ? 'Hide API key' : 'Show API key'}
                className="p-2 rounded-md border border-stone-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-stone-500 dark:text-slate-400 hover:bg-stone-50 dark:hover:bg-zinc-700 transition-colors"
              >
                {showKey ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Verify + result */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => void handleVerify()}
              disabled={!canVerify}
              className="w-full py-2 px-4 text-sm font-medium rounded-md bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verifying...
                </>
              ) : 'Verify Key'}
            </button>

            {verifyResult && (
              <div
                role="status"
                className={`flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-md ${
                  verifyResult.success
                    ? 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30'
                    : 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30'
                }`}
              >
                {verifyResult.success ? '✓' : '✗'} {verifyResult.message}
              </div>
            )}
          </div>

          {/* Save + Cancel buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={!byokKeyVerified || isSaving}
              className="flex-1 py-2 px-4 text-sm font-medium rounded-md bg-stone-800 dark:bg-slate-200 text-white dark:text-zinc-900 hover:bg-stone-700 dark:hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Key'}
            </button>
            <button
              type="button"
              onClick={() => {
                setByokApiKey(null);
                setByokKeyVerified(false);
                onDone?.();
              }}
              className="flex-1 py-2 px-4 text-sm font-medium rounded-md border border-stone-300 dark:border-zinc-600 text-stone-700 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
