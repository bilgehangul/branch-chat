// backend/src/providers/openai.ts
// OpenAIProvider — stub only. Forces interface completeness in Phase 1.
// Throws NotImplementedError so tests can verify it doesn't silently no-op.
import type { AIProvider, Message } from './types.js';

export class OpenAIProvider implements AIProvider {
  streamChat(
    _messages: Message[],
    _systemPrompt: string,
    _onChunk: (chunk: string) => void,
    _onDone: () => void,
    _onError: (err: Error) => void,
    _signal?: AbortSignal
  ): Promise<void> {
    throw new Error('OpenAIProvider not yet implemented. Set AI_PROVIDER=gemini.');
  }

  simplify(_text: string, _mode: string): Promise<string> {
    throw new Error('OpenAIProvider not yet implemented. Set AI_PROVIDER=gemini.');
  }
}
