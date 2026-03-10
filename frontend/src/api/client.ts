import type { ApiResponse } from '../../../shared/types';

export interface RequestOptions extends RequestInit {
  getToken?: () => Promise<string | null>;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export async function apiRequest<T>(
  path: string,
  options: RequestOptions
): Promise<ApiResponse<T>> {
  const { getToken, headers: extraHeaders, ...fetchOptions } = options;

  const token = getToken ? await getToken() : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extraHeaders as Record<string, string>),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...fetchOptions, headers });

  // Dispatch global event on 401 — AuthExpiredBanner listens for this
  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent('auth-expired'));
    return { data: null, error: { code: 'UNAUTHORIZED', message: 'Session expired. Please sign in again.' } };
  }

  return res.json() as Promise<ApiResponse<T>>;
}
