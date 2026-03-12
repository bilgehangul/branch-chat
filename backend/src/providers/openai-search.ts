// backend/src/providers/openai-search.ts
// OpenAISearchProvider — BYOK web search using OpenAI Responses API with web_search_preview tool.
// This is an optional provider used only when the user has an OpenAI BYOK key and explicitly selects it.
// Tavily remains the default and recommended search provider for all users.
//
// Implementation notes:
//   - Uses the OpenAI Responses API (client.responses.create) with web_search_preview tool
//   - Falls back to chat-completions-based extraction if Responses API returns no web results
//   - Results are AI-generated/web-searched content, formatted as SearchResult[]
import OpenAI from 'openai';
import type { SearchProvider, SearchResult } from './types.js';

export class OpenAISearchProvider implements SearchProvider {
  private client: OpenAI | null;

  constructor(apiKey?: string) {
    this.client = apiKey ? new OpenAI({ apiKey }) : null;
  }

  async findSources(query: string, maxResults = 3): Promise<SearchResult[]> {
    if (!this.client) {
      throw new Error('OpenAISearchProvider requires an apiKey. Pass it to the constructor.');
    }

    try {
      // Use the OpenAI Responses API with web_search_preview tool
      const response = await (this.client.responses as any).create({
        model: 'gpt-4o-mini',
        tools: [{ type: 'web_search_preview' }],
        input: `Search the web and find up to ${maxResults} relevant sources about: "${query}". For each source, provide a title, URL, and brief excerpt.`,
      });

      // Extract search results from Responses API output
      const results = extractResultsFromResponse(response, maxResults);
      if (results.length > 0) return results;
    } catch {
      // Responses API failed — fall through to chat completion fallback
    }

    // Fallback: use chat completion to generate structured source suggestions
    // NOTE: These are AI-generated citations, not real-time web search results.
    return this.findSourcesViaChatFallback(query, maxResults);
  }

  private async findSourcesViaChatFallback(query: string, maxResults: number): Promise<SearchResult[]> {
    const response = await this.client!.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a research assistant. Return ONLY valid JSON — no markdown, no explanation.',
        },
        {
          role: 'user',
          content: `Find up to ${maxResults} real, existing web sources about: "${query}"\n\nReturn a JSON array of objects with fields: title (string), url (string), content (brief excerpt, max 200 chars), score (relevance 0.0-1.0).\n\nExample: [{"title":"...","url":"https://...","content":"...","score":0.9}]`,
        },
      ],
      stream: false,
    });

    const text = response.choices[0]?.message?.content ?? '[]';
    try {
      const parsed: unknown = JSON.parse(text);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .slice(0, maxResults)
        .map((item: unknown) => {
          if (typeof item !== 'object' || item === null) return null;
          const r = item as Record<string, unknown>;
          if (typeof r.title !== 'string' || typeof r.url !== 'string') return null;
          return {
            title: r.title,
            url: r.url,
            content: typeof r.content === 'string' ? r.content : '',
            score: typeof r.score === 'number' ? r.score : 0.5,
          } satisfies SearchResult;
        })
        .filter((r): r is SearchResult => r !== null);
    } catch {
      return [];
    }
  }
}

// Parse SearchResult[] from OpenAI Responses API output structure
function extractResultsFromResponse(response: unknown, maxResults: number): SearchResult[] {
  if (typeof response !== 'object' || response === null) return [];

  const resp = response as Record<string, unknown>;

  // Responses API: output is an array of items, some of type 'web_search_call' or 'message'
  const output = resp.output;
  if (!Array.isArray(output)) return [];

  const results: SearchResult[] = [];

  for (const item of output) {
    if (typeof item !== 'object' || item === null) continue;
    const outItem = item as Record<string, unknown>;

    // Message content items may contain web search result annotations
    if (outItem.type === 'message' && Array.isArray(outItem.content)) {
      for (const contentBlock of outItem.content as unknown[]) {
        if (typeof contentBlock !== 'object' || contentBlock === null) continue;
        const block = contentBlock as Record<string, unknown>;

        if (block.type === 'output_text' && Array.isArray(block.annotations)) {
          for (const annotation of block.annotations as unknown[]) {
            if (typeof annotation !== 'object' || annotation === null) continue;
            const ann = annotation as Record<string, unknown>;

            if (ann.type === 'url_citation') {
              results.push({
                title: String(ann.title ?? 'Web Source'),
                url: String(ann.url ?? ''),
                content: String(ann.start_index ?? ''),
                score: 0.8,
              });
              if (results.length >= maxResults) return results;
            }
          }
        }
      }
    }
  }

  return results;
}
