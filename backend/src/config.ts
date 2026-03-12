// backend/src/config.ts
// Provider factory — single source of provider instantiation.
// Exports factory functions instead of singletons, enabling per-request BYOK provider creation.
// This is the ONLY place in the codebase that reads process.env.GEMINI_API_KEY for the default provider.
import { GeminiProvider } from './providers/gemini.js';
import { TavilyProvider } from './providers/tavily.js';
import { OpenAIProvider } from './providers/openai.js';
import type { AIProvider, SearchProvider } from './providers/types.js';

// Default providers — created once at startup using server-side API keys
const defaultAiProvider: AIProvider = new GeminiProvider(
  process.env.GEMINI_API_KEY!, // primary free-tier
);
const defaultSearchProvider: SearchProvider = new TavilyProvider();

export function getDefaultProvider(): AIProvider {
  return defaultAiProvider;
}

export function getDefaultSearchProvider(): SearchProvider {
  return defaultSearchProvider;
}

export function createByokProvider(
  provider: 'gemini' | 'openai' | 'anthropic',
  model: string,
  apiKey: string
): AIProvider {
  if (provider === 'gemini') return new GeminiProvider(apiKey, model);
  if (provider === 'openai') return new OpenAIProvider(apiKey, model);
  throw new Error(`Unknown provider: ${provider}`);
  // anthropic added in plan 11-02
}
