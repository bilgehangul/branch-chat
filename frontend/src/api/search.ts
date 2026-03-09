import { apiRequest } from './client';
import type { ApiResponse, SearchResult } from '../../../shared/types';
import type { SourceResult } from '../types/index';

// Converts SearchResult (backend shape) to SourceResult (frontend annotation shape)
export function toSourceResult(r: SearchResult): SourceResult {
  let domain = r.url;
  try { domain = new URL(r.url).hostname.replace(/^www\./, ''); } catch { /* invalid URL */ }
  return { title: r.title, url: r.url, domain, snippet: r.content };
}

export async function searchSources(
  params: { query: string },
  getToken: () => Promise<string | null>
): Promise<ApiResponse<{ results: SearchResult[]; citationNote: string }>> {
  return apiRequest<{ results: SearchResult[]; citationNote: string }>('/api/find-sources', {
    method: 'POST',
    body: JSON.stringify(params),
    getToken,
  });
}
