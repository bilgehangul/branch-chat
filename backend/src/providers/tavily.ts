// backend/src/providers/tavily.ts
// TavilyProvider — implements SearchProvider using @tavily/core (official scoped package)
// Do NOT use the unscoped 'tavily' package (third-party wrapper).
import { tavily } from '@tavily/core';
import type { SearchProvider, SearchResult } from './types.js';

const client = tavily({ apiKey: process.env.TAVILY_API_KEY! });

export class TavilyProvider implements SearchProvider {
  async findSources(query: string, maxResults = 3): Promise<SearchResult[]> {
    const response = await client.search(query, { maxResults });
    return response.results.map(r => ({
      title: r.title,
      url: r.url,
      content: r.content,
      score: r.score,
    }));
  }
}
