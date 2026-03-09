import type { ApiResponse } from '../../../shared/types';

export interface RequestOptions extends RequestInit {
  getToken?: () => Promise<string | null>;
}

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

  const res = await fetch(path, { ...fetchOptions, headers });
  return res.json() as Promise<ApiResponse<T>>;
}
