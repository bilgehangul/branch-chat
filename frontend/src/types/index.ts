export const MAX_THREAD_DEPTH = 4;

export interface Session {
  id: string;
  userId: string;
  createdAt: number; // Date.now() timestamp
}

export interface Thread {
  id: string;
  depth: 0 | 1 | 2 | 3 | 4;
  parentThreadId: string | null;
  anchorText: string | null;
  parentMessageId: string | null;
  title: string;
  accentColor: string;
  messageIds: string[];       // ORDERED — references into messages Record
  childThreadIds: string[];
  scrollPosition: number;
}

export interface Message {
  id: string;
  threadId: string;
  role: 'user' | 'assistant';
  content: string;
  annotations: Annotation[];
  childLeads: ChildLead[];
  isStreaming: boolean;
  createdAt: number;
}

export interface Annotation {
  id: string;
  type: 'source' | 'rewrite' | 'simplification';
  targetText: string;
  paragraphIndex: number;
  originalText: string;
  replacementText: string | null;
  citationNote: string | null;
  sources: SourceResult[];
  isShowingOriginal: boolean;
}

export interface SourceResult {
  title: string;
  url: string;
  domain: string;
  snippet: string;
}

export interface ChildLead {
  threadId: string;
  paragraphIndex: number;
  anchorText: string;
  messageCount: number;
}

export interface CreateThreadParams {
  parentThreadId: string | null;
  anchorText: string | null;
  parentMessageId: string | null;
  title: string;
  accentColor: string;
}
