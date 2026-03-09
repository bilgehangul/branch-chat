// backend/src/providers/openai-search.ts
// OpenAISearchProvider — stub only.
import type { SearchProvider, SearchResult } from './types.js';

export class OpenAISearchProvider implements SearchProvider {
  findSources(_query: string, _maxResults?: number): Promise<SearchResult[]> {
    throw new Error('OpenAISearchProvider not yet implemented. Set AI_PROVIDER=gemini.');
  }
}
