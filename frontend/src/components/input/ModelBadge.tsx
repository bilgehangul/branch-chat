// frontend/src/components/input/ModelBadge.tsx
// Clickable badge showing the active model. Free tier shows Gemini Flash; BYOK shows key icon + provider + model.
// PROV-10, PROV-11
import { useSettings } from '../../contexts/SettingsContext';

/** Human-readable display names for BYOK models */
const MODEL_DISPLAY_NAMES: Record<string, string> = {
  // Gemini
  'gemini-3.1-pro-preview': 'Gemini 3.1 Pro',
  'gemini-3-flash-preview': 'Gemini 3 Flash',
  'gemini-3.1-flash-lite-preview': 'Gemini 3.1 Flash Lite',
  'gemini-2.5-pro': 'Gemini 2.5 Pro',
  'gemini-2.5-flash': 'Gemini 2.5 Flash',
  'gemini-2.5-flash-lite': 'Gemini 2.5 Flash Lite',
  'gemini-2.0-flash': 'Gemini 2.0 Flash',
  // OpenAI
  'gpt-5.4': 'GPT-5.4',
  'gpt-5.4-pro': 'GPT-5.4 Pro',
  'gpt-5-mini': 'GPT-5 Mini',
  'gpt-5-nano': 'GPT-5 Nano',
  'gpt-5': 'GPT-5',
  'gpt-5.1': 'GPT-5.1',
  'gpt-5.2': 'GPT-5.2',
  'gpt-4.1': 'GPT-4.1',
  'gpt-4.1-mini': 'GPT-4.1 Mini',
  'gpt-4o': 'GPT-4o',
  // Anthropic
  'claude-opus-4-6': 'Claude Opus 4.6',
  'claude-sonnet-4-6': 'Claude Sonnet 4.6',
  'claude-sonnet-4-5-20250929': 'Claude Sonnet 4.5',
  'claude-opus-4-1-20250414': 'Claude Opus 4.1',
  'claude-sonnet-4-20250514': 'Claude Sonnet 4',
  'claude-haiku-4-5-20251001': 'Claude Haiku 4.5',
  'claude-3-5-haiku-20241022': 'Claude Haiku 3.5',
};

// Inline SVG provider icons
function GeminiIcon() {
  return (
    <svg
      className="w-3 h-3"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      {/* Sparkle / 4-pointed star */}
      <path d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z" />
    </svg>
  );
}

function OpenAIIcon() {
  return (
    <svg
      className="w-3 h-3"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
    </svg>
  );
}

function AnthropicIcon() {
  return (
    <svg
      className="w-3 h-3"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      {/* Simple A shape */}
      <path d="M12 3 L20 21 H16.5 L14.5 16 H9.5 L7.5 21 H4 L12 3 Z M12 8 L10.5 13 H13.5 Z" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg
      className="w-3 h-3"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 0 1 21.75 8.25Z" />
    </svg>
  );
}

export function ModelBadge() {
  const { tier, byokProvider, byokModel, openModal } = useSettings();

  const isByok = tier === 'byok' && byokProvider && byokModel;

  // Compute display name
  let modelName: string;
  let providerLabel: string | null = null;

  if (isByok) {
    modelName = MODEL_DISPLAY_NAMES[byokModel!] ?? byokModel!;
    providerLabel = byokProvider === 'gemini' ? 'Gemini' : byokProvider === 'openai' ? 'OpenAI' : 'Anthropic';
  } else {
    modelName = 'Gemini Flash';
    providerLabel = null;
  }

  const ariaLabel = `Active model: ${isByok ? `${providerLabel} ${modelName}` : modelName}. Click to open settings`;

  return (
    <button
      type="button"
      onClick={openModal}
      aria-label={ariaLabel}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-stone-100 dark:bg-zinc-700 text-stone-600 dark:text-slate-300 hover:bg-stone-200 dark:hover:bg-zinc-600 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-800 outline-none"
    >
      {isByok ? (
        <>
          {/* Key icon for BYOK mode */}
          <KeyIcon />
          {/* Provider icon */}
          {byokProvider === 'gemini' && <GeminiIcon />}
          {byokProvider === 'openai' && <OpenAIIcon />}
          {byokProvider === 'anthropic' && <AnthropicIcon />}
          <span>{modelName}</span>
        </>
      ) : (
        <>
          {/* Free tier: sparkle + model name */}
          <GeminiIcon />
          <span>{modelName}</span>
        </>
      )}
    </button>
  );
}
