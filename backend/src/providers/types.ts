// backend/src/providers/types.ts
// Provider abstraction interfaces. Designed from UI feature needs — NOT from Gemini API shape.
// Route handlers depend only on these interfaces. Provider-specific imports stay inside
// the concrete class files.

export interface Message {
  role: 'user' | 'model';
  content: string;
}

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface AIProvider {
  /**
   * Stream a chat response. Calls onChunk for each text chunk, onDone when complete,
   * onError on failure. Signal can abort mid-stream.
   */
  streamChat(
    messages: Message[],
    systemPrompt: string,
    onChunk: (chunk: string) => void,
    onDone: () => void,
    onError: (err: Error) => void,
    signal?: AbortSignal
  ): Promise<void>;

  /**
   * Single-shot text rewrite. mode is one of: "simpler" | "example" | "analogy" | "technical"
   */
  simplify(text: string, mode: string): Promise<string>;

  /**
   * Generate a 1–2 sentence citation note synthesizing the search results
   * in context of the original query text.
   */
  generateCitationNote(results: SearchResult[], originalText: string): Promise<string>;
}

export interface SearchProvider {
  /**
   * Web search. Returns up to maxResults results (default 3).
   */
  findSources(query: string, maxResults?: number): Promise<SearchResult[]>;
}
