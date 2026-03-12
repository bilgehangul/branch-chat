// backend/src/providers/anthropic.ts
// AnthropicProvider — implements AIProvider using @anthropic-ai/sdk.
// Key pitfalls:
//   - systemPrompt goes as top-level 'system' param, NOT inside messages array
//   - Internal role 'model' must be mapped to 'assistant'
//   - Stream events: check type === 'content_block_delta' && delta.type === 'text_delta'
import Anthropic from '@anthropic-ai/sdk';
import type { AIProvider, Message, SearchResult } from './types.js';
import { SIMPLIFY_PROMPTS } from './gemini.js';

export class AnthropicProvider implements AIProvider {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async streamChat(
    messages: Message[],
    systemPrompt: string,
    onChunk: (chunk: string) => void,
    onDone: () => void,
    onError: (err: Error) => void,
    signal?: AbortSignal
  ): Promise<void> {
    // Map internal role 'model' -> 'assistant' for Anthropic API
    const anthropicMessages: Anthropic.MessageParam[] = messages.map(m => ({
      role: m.role === 'model' ? 'assistant' : 'user',
      content: m.content,
    }));

    try {
      const stream = this.client.messages.stream({
        model: this.model,
        max_tokens: 4096,
        // systemPrompt is TOP-LEVEL, not in messages
        system: systemPrompt || undefined,
        messages: anthropicMessages,
      });

      for await (const event of stream) {
        if (signal?.aborted) break;
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          onChunk(event.delta.text);
        }
      }
      onDone();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      onError(error);
    }
  }

  async simplify(text: string, mode: string): Promise<string> {
    const instruction = SIMPLIFY_PROMPTS[mode] ?? SIMPLIFY_PROMPTS['simpler'];

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      system: 'You are a writing assistant. Return only the rewritten text, no preamble.',
      messages: [
        { role: 'user', content: `${instruction}\n\nText to rewrite:\n${text}` },
      ],
    });

    const block = response.content[0];
    return block?.type === 'text' ? block.text : '';
  }

  async generateCitationNote(results: SearchResult[], originalText: string): Promise<string> {
    const sourceList = results
      .map((r, i) => `${i + 1}. "${r.title}" (${r.url}): ${r.content.slice(0, 200)}`)
      .join('\n');

    const prompt = `You found these sources for the text: "${originalText.slice(0, 300)}"\n\nSources:\n${sourceList}\n\nWrite 1–2 sentences synthesizing what these sources say about the text. Be factual and concise. Return only the note, no preamble.`;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 512,
      system: 'You are a research assistant. Return only the citation note.',
      messages: [
        { role: 'user', content: prompt },
      ],
    });

    const block = response.content[0];
    return block?.type === 'text' ? block.text : '';
  }
}
