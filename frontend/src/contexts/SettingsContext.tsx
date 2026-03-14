// frontend/src/contexts/SettingsContext.tsx
// Settings state management: tier, BYOK provider/model/key, search provider, modal, saved keys registry.
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { encryptApiKey, decryptApiKey, clearApiKey } from '../utils/cryptoStorage';
import { MODEL_LISTS } from '../constants/models';

export type ByokProvider = 'gemini' | 'openai' | 'anthropic';
export type SearchProvider = 'tavily' | 'openai-search';
export type Tier = 'free' | 'byok';

export interface SavedKeyEntry {
  provider: ByokProvider;
  maskedKey: string;   // last 4 chars for display
}

interface SettingsState {
  tier: Tier;
  byokProvider: ByokProvider | null;
  byokModel: string | null;
  byokApiKey: string | null;
  byokKeyVerified: boolean;
  searchProvider: SearchProvider;
  isModalOpen: boolean;
  savedKeys: SavedKeyEntry[];
}

interface SettingsContextValue extends SettingsState {
  openModal: () => void;
  closeModal: () => void;
  setByokProvider: (provider: ByokProvider) => void;
  setByokModel: (model: string | null) => void;
  setByokApiKey: (key: string | null) => void;
  setByokKeyVerified: (verified: boolean) => void;
  setSearchProvider: (provider: SearchProvider) => void;
  saveByokSettings: (userId: string | null) => Promise<void>;
  clearByokKey: (userId: string | null) => void;
  removeKey: (provider: ByokProvider, userId: string | null) => void;
  switchToKey: (provider: ByokProvider, model: string, userId: string | null) => void;
  switchToFree: (userId: string | null) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

const SETTINGS_KEY = (userId: string | null) => `byok_settings_${userId ?? 'anonymous'}`;
const KEY_STORAGE_KEY = (userId: string | null, provider: ByokProvider) =>
  `byok_key_${userId ?? 'anonymous'}_${provider}`;
// Legacy key format (single key, no provider suffix)
const LEGACY_KEY_STORAGE = (userId: string | null) => `byok_key_${userId ?? 'anonymous'}`;

const DEFAULT_STATE: SettingsState = {
  tier: 'free',
  byokProvider: null,
  byokModel: null,
  byokApiKey: null,
  byokKeyVerified: false,
  searchProvider: 'tavily',
  isModalOpen: false,
  savedKeys: [],
};

interface SettingsProviderProps {
  children: React.ReactNode;
  userId: string | null;
}

export function SettingsProvider({ children, userId }: SettingsProviderProps) {
  const [state, setState] = useState<SettingsState>(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY(userId));
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SettingsState> & { savedKeys?: SavedKeyEntry[] };
        return {
          ...DEFAULT_STATE,
          tier: parsed.tier ?? 'free',
          byokProvider: parsed.byokProvider ?? null,
          byokModel: parsed.byokModel ?? null,
          byokKeyVerified: parsed.byokKeyVerified ?? false,
          searchProvider: parsed.searchProvider ?? 'tavily',
          savedKeys: parsed.savedKeys ?? [],
        };
      }
    } catch { /* start fresh */ }
    return { ...DEFAULT_STATE };
  });

  // On mount: decrypt the active provider's key into memory
  useEffect(() => {
    if (!userId || state.tier !== 'byok' || !state.byokProvider) return;
    const storageKey = KEY_STORAGE_KEY(userId, state.byokProvider);
    const stored = localStorage.getItem(storageKey)
      // Fallback to legacy single-key format
      ?? localStorage.getItem(LEGACY_KEY_STORAGE(userId));
    if (!stored) return;
    decryptApiKey(userId, stored)
      .then(apiKey => {
        setState(s => ({ ...s, byokApiKey: apiKey }));
      })
      .catch(() => {
        localStorage.removeItem(storageKey);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const openModal = useCallback(() => setState(s => ({ ...s, isModalOpen: true })), []);
  const closeModal = useCallback(() => setState(s => ({ ...s, isModalOpen: false })), []);

  const setByokProvider = useCallback((provider: ByokProvider) => {
    setState(s => ({
      ...s,
      byokProvider: provider,
      byokModel: null,
      byokApiKey: null,
      byokKeyVerified: false,
    }));
  }, []);

  const setByokModel = useCallback((model: string | null) => {
    setState(s => ({ ...s, byokModel: model }));
  }, []);

  const setByokApiKey = useCallback((key: string | null) => {
    setState(s => ({ ...s, byokApiKey: key }));
  }, []);

  const setByokKeyVerified = useCallback((verified: boolean) => {
    setState(s => ({ ...s, byokKeyVerified: verified }));
  }, []);

  const setSearchProvider = useCallback((provider: SearchProvider) => {
    setState(s => ({ ...s, searchProvider: provider }));
  }, []);

  const saveByokSettings = useCallback(async (uid: string | null) => {
    if (!uid || !state.byokApiKey || !state.byokProvider) return;
    const provider = state.byokProvider;
    const encrypted = await encryptApiKey(uid, state.byokApiKey);
    localStorage.setItem(KEY_STORAGE_KEY(uid, provider), encrypted);

    // Update saved keys registry
    const maskedKey = state.byokApiKey.length > 4 ? state.byokApiKey.slice(-4) : state.byokApiKey;
    const newSavedKeys = [
      ...state.savedKeys.filter(k => k.provider !== provider),
      { provider, maskedKey },
    ];

    // Auto-select first model for the provider if no model is currently chosen.
    // setByokProvider clears byokModel to null, so after the add-key flow byokModel
    // is always null here — this ensures byokCredentials in useStreamingChat is non-undefined.
    const modelToSave = state.byokModel ?? MODEL_LISTS[provider]?.[0]?.id ?? null;

    const settingsData = {
      tier: 'byok' as Tier,
      byokProvider: provider,
      byokModel: modelToSave,
      byokKeyVerified: state.byokKeyVerified,
      searchProvider: state.searchProvider,
      savedKeys: newSavedKeys,
    };
    localStorage.setItem(SETTINGS_KEY(uid), JSON.stringify(settingsData));
    setState(s => ({ ...s, tier: 'byok', savedKeys: newSavedKeys, byokModel: modelToSave }));
  }, [state.byokApiKey, state.byokProvider, state.byokModel, state.byokKeyVerified, state.searchProvider, state.savedKeys]);

  const clearByokKey = useCallback((uid: string | null) => {
    if (uid) {
      clearApiKey(uid);
      localStorage.removeItem(SETTINGS_KEY(uid));
      // Clear all per-provider keys
      for (const prov of ['gemini', 'openai', 'anthropic'] as ByokProvider[]) {
        localStorage.removeItem(KEY_STORAGE_KEY(uid, prov));
      }
      localStorage.removeItem(LEGACY_KEY_STORAGE(uid));
    }
    setState(s => ({
      ...DEFAULT_STATE,
      isModalOpen: s.isModalOpen,
    }));
  }, []);

  /** Remove a single provider's key */
  const removeKey = useCallback((provider: ByokProvider, uid: string | null) => {
    if (uid) {
      localStorage.removeItem(KEY_STORAGE_KEY(uid, provider));
    }
    setState(s => {
      const newSavedKeys = s.savedKeys.filter(k => k.provider !== provider);
      // If removing the active provider, revert to free
      const isActive = s.tier === 'byok' && s.byokProvider === provider;
      const newState: SettingsState = {
        ...s,
        savedKeys: newSavedKeys,
        ...(isActive ? {
          tier: 'free' as Tier,
          byokProvider: null,
          byokModel: null,
          byokApiKey: null,
          byokKeyVerified: false,
        } : {}),
      };
      // Persist updated settings
      if (uid) {
        localStorage.setItem(SETTINGS_KEY(uid), JSON.stringify({
          tier: newState.tier,
          byokProvider: newState.byokProvider,
          byokModel: newState.byokModel,
          byokKeyVerified: newState.byokKeyVerified,
          searchProvider: newState.searchProvider,
          savedKeys: newSavedKeys,
        }));
      }
      return newState;
    });
  }, []);

  /** Switch active model to a saved key's provider+model */
  const switchToKey = useCallback((provider: ByokProvider, model: string, uid: string | null) => {
    if (!uid) return;
    const storageKey = KEY_STORAGE_KEY(uid, provider);
    const stored = localStorage.getItem(storageKey);
    if (!stored) return;

    decryptApiKey(uid, stored)
      .then(apiKey => {
        setState(s => {
          const newState = {
            ...s,
            tier: 'byok' as Tier,
            byokProvider: provider,
            byokModel: model,
            byokApiKey: apiKey,
            byokKeyVerified: true,
          };
          localStorage.setItem(SETTINGS_KEY(uid), JSON.stringify({
            tier: 'byok',
            byokProvider: provider,
            byokModel: model,
            byokKeyVerified: true,
            searchProvider: s.searchProvider,
            savedKeys: s.savedKeys,
          }));
          return newState;
        });
      })
      .catch(() => { /* key decrypt failed, stay on current */ });
  }, []);

  /** Switch back to free tier */
  const switchToFree = useCallback((uid: string | null) => {
    setState(s => {
      const newState = {
        ...s,
        tier: 'free' as Tier,
        byokProvider: null,
        byokModel: null,
        byokApiKey: null,
        byokKeyVerified: false,
      };
      if (uid) {
        localStorage.setItem(SETTINGS_KEY(uid), JSON.stringify({
          tier: 'free',
          byokProvider: null,
          byokModel: null,
          byokKeyVerified: false,
          searchProvider: s.searchProvider,
          savedKeys: s.savedKeys,
        }));
      }
      return newState;
    });
  }, []);

  const value: SettingsContextValue = {
    ...state,
    openModal,
    closeModal,
    setByokProvider,
    setByokModel,
    setByokApiKey,
    setByokKeyVerified,
    setSearchProvider,
    saveByokSettings,
    clearByokKey,
    removeKey,
    switchToKey,
    switchToFree,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}
