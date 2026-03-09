// backend/src/config.ts
// Provider factory — single source of provider instantiation.
// Route handlers import { aiProvider, searchProvider } and never branch on AI_PROVIDER.
// The ONLY place in the codebase that reads process.env.AI_PROVIDER.
import { GeminiProvider } from './providers/gemini.js';
import { TavilyProvider } from './providers/tavily.js';
import { OpenAIProvider } from './providers/openai.js';
import { OpenAISearchProvider } from './providers/openai-search.js';
import type { AIProvider, SearchProvider } from './providers/types.js';

const PROVIDER = process.env.AI_PROVIDER ?? 'gemini';

export const aiProvider: AIProvider =
  PROVIDER === 'openai' ? new OpenAIProvider() : new GeminiProvider();

export const searchProvider: SearchProvider =
  PROVIDER === 'openai' ? new OpenAISearchProvider() : new TavilyProvider();
