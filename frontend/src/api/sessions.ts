// frontend/src/api/sessions.ts
// API client for session persistence endpoints.
// Uses direct fetch with Bearer token (matching pattern from api/chat.ts).

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

async function apiFetch(
  url: string,
  options: RequestInit,
  getToken: () => Promise<string | null>
): Promise<Response> {
  const token = await getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(`${API_BASE}${url}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string> ?? {}) },
  });
}

export interface SessionListItem {
  id: string;
  createdAt: number;
  lastActivityAt: number;
  title: string;
}

export interface SessionLoadData {
  session: { id: string; createdAt: number };
  threads: Array<{
    id: string;
    depth: number;
    parentThreadId: string | null;
    anchorText: string | null;
    parentMessageId: string | null;
    title: string;
    accentColor: string;
    childThreadIds: string[];
    scrollPosition: number;
    messageIds: string[];
  }>;
  messages: Array<{
    id: string;
    threadId: string;
    role: 'user' | 'assistant';
    content: string;
    annotations: unknown[];
    childLeads: unknown[];
    isStreaming: boolean;
    createdAt: number;
  }>;
}

export async function fetchSessions(
  getToken: () => Promise<string | null>
): Promise<SessionListItem[]> {
  try {
    const res = await apiFetch('/api/sessions', { method: 'GET' }, getToken);
    if (!res.ok) return [];
    const json = await res.json() as { data: SessionListItem[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

export async function loadSession(
  sessionId: string,
  getToken: () => Promise<string | null>
): Promise<SessionLoadData | null> {
  try {
    const res = await apiFetch(`/api/sessions/${sessionId}`, { method: 'GET' }, getToken);
    if (!res.ok) return null;
    const json = await res.json() as { data: SessionLoadData };
    return json.data ?? null;
  } catch {
    return null;
  }
}

export async function createSessionOnBackend(
  payload: { sessionId: string; rootThreadId: string; accentColor?: string },
  getToken: () => Promise<string | null>
): Promise<{ sessionId: string; rootThreadId: string } | null> {
  try {
    const res = await apiFetch('/api/sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, getToken);
    if (!res.ok) return null;
    const json = await res.json() as { data: { sessionId: string; rootThreadId: string } };
    return json.data ?? null;
  } catch {
    return null;
  }
}

export async function createThreadOnBackend(
  payload: {
    threadId: string; sessionId: string; parentThreadId: string;
    depth: number; anchorText: string; parentMessageId: string | null;
    title: string; accentColor: string;
  },
  getToken: () => Promise<string | null>
): Promise<void> {
  try {
    await apiFetch('/api/threads', { method: 'POST', body: JSON.stringify(payload) }, getToken);
  } catch {
    // fire-and-forget — non-fatal
  }
}

export async function updateThreadOnBackend(
  threadId: string,
  patch: { title?: string; scrollPosition?: number },
  getToken: () => Promise<string | null>
): Promise<void> {
  try {
    await apiFetch(`/api/threads/${threadId}`, { method: 'PATCH', body: JSON.stringify(patch) }, getToken);
  } catch {
    // fire-and-forget — non-fatal
  }
}

export async function deleteThreadFromDB(
  threadId: string,
  getToken: () => Promise<string | null>
): Promise<void> {
  try {
    await apiFetch(`/api/threads/${threadId}`, { method: 'DELETE' }, getToken);
  } catch {
    // fire-and-forget — non-fatal
  }
}

export async function deleteSessionFromDB(
  sessionId: string,
  getToken: () => Promise<string | null>
): Promise<void> {
  try {
    await apiFetch(`/api/sessions/${sessionId}`, { method: 'DELETE' }, getToken);
  } catch {
    // fire-and-forget
  }
}

export async function updateMessageOnBackend(
  messageId: string,
  patch: { annotations?: unknown[]; childLeads?: unknown[] },
  getToken: () => Promise<string | null>
): Promise<void> {
  try {
    await apiFetch(`/api/messages/${messageId}`, { method: 'PATCH', body: JSON.stringify(patch) }, getToken);
  } catch {
    // fire-and-forget — non-fatal
  }
}
