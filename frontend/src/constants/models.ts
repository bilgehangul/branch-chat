// frontend/src/constants/models.ts
// Canonical model list for each BYOK provider. Shared between SettingsContext and SettingsModal.
import type { ByokProvider } from '../contexts/SettingsContext';

export const MODEL_LISTS: Record<ByokProvider, { id: string; label: string }[]> = {
  gemini: [
    { id: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro' },
    { id: 'gemini-3-flash-preview', label: 'Gemini 3 Flash' },
    { id: 'gemini-3.1-flash-lite-preview', label: 'Gemini 3.1 Flash Lite' },
    { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' },
    { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (retiring Jun 2026)' },
  ],
  openai: [
    { id: 'gpt-5.4', label: 'GPT-5.4' },
    { id: 'gpt-5.4-pro', label: 'GPT-5.4 Pro' },
    { id: 'gpt-5-mini', label: 'GPT-5 Mini' },
    { id: 'gpt-5-nano', label: 'GPT-5 Nano' },
    { id: 'gpt-5', label: 'GPT-5' },
    { id: 'gpt-5.1', label: 'GPT-5.1' },
    { id: 'gpt-5.2', label: 'GPT-5.2' },
    { id: 'gpt-4.1', label: 'GPT-4.1' },
    { id: 'gpt-4.1-mini', label: 'GPT-4.1 Mini' },
    { id: 'gpt-4o', label: 'GPT-4o (legacy)' },
  ],
  anthropic: [
    { id: 'claude-opus-4-6', label: 'Claude Opus 4.6' },
    { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
    { id: 'claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5' },
    { id: 'claude-opus-4-1-20250414', label: 'Claude Opus 4.1' },
    { id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
    { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
    { id: 'claude-3-5-haiku-20241022', label: 'Claude Haiku 3.5' },
  ],
};
