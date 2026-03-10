import { apiRequest } from './client';
import type { ApiResponse } from '../../../shared/types';

export async function simplifyText(
  params: { text: string; mode: 'simpler' | 'example' | 'analogy' | 'technical' },
  getToken: () => Promise<string | null>
): Promise<ApiResponse<{ rewritten: string }>> {
  return apiRequest<{ rewritten: string }>('/api/simplify', {
    method: 'POST',
    body: JSON.stringify(params),
    getToken,
  });
}

export async function summarizeMessages(
  params: { text: string },
  getToken: () => Promise<string | null>
): Promise<ApiResponse<{ rewritten: string }>> {
  return apiRequest<{ rewritten: string }>('/api/simplify', {
    method: 'POST',
    body: JSON.stringify({ text: params.text, mode: 'simpler' }),
    getToken,
  });
}
