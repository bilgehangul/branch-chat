// shared/types.ts
// Single source of truth for all shared data shapes.
// Backend imports from here; frontend will import from here in Phase 2.

export type Role = 'user' | 'model';

export interface Message {
  role: Role;
  content: string;
}

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface ApiError {
  code: string;
  message: string;
}

export interface ApiResponse<T = unknown> {
  data: T | null;
  error: ApiError | null;
}

// SSE event shapes sent over /api/chat stream
export type SseChunkEvent = { type: 'chunk'; text: string };
export type SseDoneEvent  = { type: 'done' };
export type SseErrorEvent = { type: 'error'; message: string };
export type SseEvent = SseChunkEvent | SseDoneEvent | SseErrorEvent;
