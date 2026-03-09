import { apiRequest } from './client';
import type { ApiResponse } from '../../../shared/types';

export async function simplifyText(
  params: { text: string; mode: 'simpler' | 'example' | 'analogy' | 'technical' },
  getToken: () => Promise<string | null>
): Promise<ApiResponse<{ text: string }>> {
  return apiRequest<{ text: string }>('/api/simplify', {
    method: 'POST',
    body: JSON.stringify(params),
    getToken,
  });
}
