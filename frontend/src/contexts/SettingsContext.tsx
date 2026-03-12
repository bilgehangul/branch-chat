// frontend/src/contexts/SettingsContext.tsx
// Settings state management: tier, BYOK provider/model/key, search provider, modal open state.
// PROV-01, PROV-02, PROV-03, PROV-04, PROV-12, PROV-13
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { encryptApiKey, decryptApiKey, clearApiKey } from '../utils/cryptoStorage';

export type ByokProvider = 'gemini' | 'openai' | 'anthropic';
export type SearchProvider = 'tavily' | 'openai-search';
export type Tier = 'free' | 'byok';

interface SettingsState {
  tier: Tier;
  byokProvider: ByokProvider | null;
  byokModel: string | null;
  byokApiKey: string | null;       // in-memory only — never written directly to localStorage
  byokKeyVerified: boolean;
  searchProvider: SearchProvider;
  isModalOpen: boolean;
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
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

const SETTINGS_KEY = (userId: string | null) => `byok_settings_${userId ?? 'anonymous'}`;
const KEY_STORAGE_KEY = (userId: string | null) => `byok_key_${userId ?? 'anonymous'}`;

const DEFAULT_STATE: SettingsState = {
  tier: 'free',
  byokProvider: null,
  byokModel: null,
  byokApiKey: null,
  byokKeyVerified: false,
  searchProvider: 'tavily',
  isModalOpen: false,
};

interface SettingsProviderProps {
  children: React.ReactNode;
  userId: string | null;
}

export function SettingsProvider({ children, userId }: SettingsProviderProps) {
  const [state, setState] = useState<SettingsState>(() => {
    // Eagerly load non-sensitive settings from localStorage (provider/model/tier)
    try {
      const raw = localStorage.getItem(SETTINGS_KEY(userId));
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SettingsState>;
        return {
          ...DEFAULT_STATE,
          tier: parsed.tier ?? 'free',
          byokProvider: parsed.byokProvider ?? null,
          byokModel: parsed.byokModel ?? null,
          byokKeyVerified: parsed.byokKeyVerified ?? false,
          searchProvider: parsed.searchProvider ?? 'tavily',
        };
      }
    } catch {
      // Corrupted storage — start fresh
    }
    return { ...DEFAULT_STATE };
  });

  // On mount: attempt to decrypt and load the API key into memory
  useEffect(() => {
    if (!userId) return;
    const stored = localStorage.getItem(KEY_STORAGE_KEY(userId));
    if (!stored) return;
    decryptApiKey(userId, stored)
      .then(apiKey => {
        setState(s => ({ ...s, byokApiKey: apiKey }));
      })
      .catch(() => {
        // Key unreadable (wrong user, corrupted) — clear it
        localStorage.removeItem(KEY_STORAGE_KEY(userId));
      });
  }, [userId]);

  const openModal = useCallback(() => setState(s => ({ ...s, isModalOpen: true })), []);
  const closeModal = useCallback(() => setState(s => ({ ...s, isModalOpen: false })), []);

  const setByokProvider = useCallback((provider: ByokProvider) => {
    setState(s => ({
      ...s,
      byokProvider: provider,
      byokModel: null,
      byokApiKey: null,       // clear any key from a previous provider
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

  /**
   * Persist the current BYOK settings:
   * - Encrypt the API key to localStorage
   * - Save provider/model/tier as JSON (non-sensitive)
   */
  const saveByokSettings = useCallback(async (uid: string | null) => {
    if (!uid || !state.byokApiKey) return;
    const encrypted = await encryptApiKey(uid, state.byokApiKey);
    localStorage.setItem(KEY_STORAGE_KEY(uid), encrypted);
    const settingsData = {
      tier: 'byok' as Tier,
      byokProvider: state.byokProvider,
      byokModel: state.byokModel,
      byokKeyVerified: state.byokKeyVerified,
      searchProvider: state.searchProvider,
    };
    localStorage.setItem(SETTINGS_KEY(uid), JSON.stringify(settingsData));
    setState(s => ({ ...s, tier: 'byok' }));
  }, [state.byokApiKey, state.byokProvider, state.byokModel, state.byokKeyVerified, state.searchProvider]);

  /**
   * Clear BYOK key and reset to free tier.
   */
  const clearByokKey = useCallback((uid: string | null) => {
    if (uid) {
      clearApiKey(uid);
      localStorage.removeItem(SETTINGS_KEY(uid));
    }
    setState({
      ...DEFAULT_STATE,
      isModalOpen: state.isModalOpen,
    });
  }, [state.isModalOpen]);

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
