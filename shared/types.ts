// shared/types.ts
// Single source of truth for all shared data shapes.
// Backend imports from here; frontend will import from here in Phase 2.

/**
 * Role values across the system:
 *   - Backend AI provider wire format (GeminiProvider, shared/types.ts): 'user' | 'model'
 *   - MongoDB storage (backend/src/db/models/Message.ts):                 'user' | 'assistant'
 *   - Frontend Zustand store (frontend/src/types/index.ts):                'user' | 'assistant'
 *
 * Mapping in useStreamingChat.ts (outbound): frontend 'assistant' -> wire 'model'
 * Mapping in chat.ts (inbound save):         wire 'model' response -> stored as 'assistant'
 *
 * This type covers the wire format only. Frontend uses its own role union.
 */
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
