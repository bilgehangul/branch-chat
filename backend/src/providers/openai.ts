// backend/src/providers/openai.ts
// OpenAIProvider — full implementation using openai npm SDK.
import OpenAI from 'openai';
import type { AIProvider, Message, SearchResult } from './types.js';
import { SIMPLIFY_PROMPTS } from './gemini.js';

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new OpenAI({ apiKey });
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
    // Map internal role 'model' -> 'assistant' for OpenAI API
    const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({
        role: (m.role === 'model' ? 'assistant' : m.role) as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    try {
      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages: openaiMessages,
        stream: true,
      });

      for await (const chunk of stream) {
        if (signal?.aborted) break;
        const content = chunk.choices[0]?.delta?.content;
        if (content) onChunk(content);
      }
      onDone();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      onError(error);
    }
  }

  async simplify(text: string, mode: string): Promise<string> {
    const instruction = SIMPLIFY_PROMPTS[mode] ?? SIMPLIFY_PROMPTS['simpler'];

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: 'You are a writing assistant. Return only the rewritten text, no preamble.' },
        { role: 'user', content: `${instruction}\n\nText to rewrite:\n${text}` },
      ],
      stream: false,
    });

    return response.choices[0]?.message?.content ?? '';
  }

  async generateCitationNote(results: SearchResult[], originalText: string): Promise<string> {
    const sourceList = results
      .map((r, i) => `${i + 1}. "${r.title}" (${r.url}): ${r.content.slice(0, 200)}`)
      .join('\n');

    const prompt = `You found these sources for the text: "${originalText.slice(0, 300)}"\n\nSources:\n${sourceList}\n\nWrite 1–2 sentences synthesizing what these sources say about the text. Be factual and concise. Return only the note, no preamble.`;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: 'You are a research assistant. Return only the citation note.' },
        { role: 'user', content: prompt },
      ],
      stream: false,
    });

    return response.choices[0]?.message?.content ?? '';
  }
}
