import { apiRequest } from './client';
import type { ApiResponse, SearchResult } from '../../../shared/types';

export async function searchSources(
  params: { query: string },
  getToken: () => Promise<string | null>
): Promise<ApiResponse<SearchResult[]>> {
  return apiRequest<SearchResult[]>('/api/find-sources', {
    method: 'POST',
    body: JSON.stringify(params),
    getToken,
  });
}
