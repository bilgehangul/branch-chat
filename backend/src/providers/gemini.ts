// backend/src/providers/gemini.ts
// GeminiProvider — implements AIProvider using @google/genai (v1.x, NOT deprecated @google/generative-ai)
import { GoogleGenAI } from '@google/genai';
import type { AIProvider, Message, SearchResult } from './types.js';

// Free-tier models in priority order — tried in sequence on 503/overload errors.
// Narrowed to 2 reliable models; preview/pro variants hammer rate limits.
// TODO: Update FREE_TIER_MODELS when gemini-2.0-flash retires (June 2026)
export const FREE_TIER_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
] as const;

export const SIMPLIFY_PROMPTS: Record<string, string> = {
  simpler: 'Rewrite the following text so a 12-year-old can understand it. Keep it concise.',
  example: 'Explain the following text by giving a concrete, relatable real-world example.',
  analogy: 'Explain the following text using a clear analogy to something familiar.',
  technical: 'Rewrite the following text with more technical depth and precise terminology for an expert audience.',
};

function isRetryableError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('503') ||
    msg.includes('429') ||
    msg.includes('overloaded') ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('quota')
  );
}

export class GeminiProvider implements AIProvider {
  private ai: GoogleGenAI;
  private model: string | null;

  constructor(apiKey: string, model?: string) {
    this.ai = new GoogleGenAI({ apiKey });
    this.model = model ?? null;
  }

  async streamChat(
    messages: Message[],
    systemPrompt: string,
    onChunk: (chunk: string) => void,
    onDone: () => void,
    onError: (err: Error) => void,
    signal?: AbortSignal
  ): Promise<void> {
    const contents = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.content }],
    }));

    if (this.model) {
      // Specific model set — use it directly, no fallback
      if (signal?.aborted) { onDone(); return; }
      try {
        const response = await this.ai.models.generateContentStream({
          model: this.model,
          contents,
          config: { systemInstruction: systemPrompt || undefined },
        });
        for await (const chunk of response) {
          if (signal?.aborted) break;
          const text = chunk.text;
          if (text) onChunk(text);
        }
        onDone();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        onError(error);
      }
      return;
    }

    // No model set — iterate FREE_TIER_MODELS with fallback
    let lastErr: Error | null = null;
    for (const model of FREE_TIER_MODELS) {
      if (signal?.aborted) { onDone(); return; }
      try {
        const response = await this.ai.models.generateContentStream({
          model,
          contents,
          config: { systemInstruction: systemPrompt || undefined },
        });

        for await (const chunk of response) {
          if (signal?.aborted) break;
          const text = chunk.text;
          if (text) onChunk(text);
        }
        onDone();
        return;
      } catch (err) {
        lastErr = err instanceof Error ? err : new Error(String(err));
        if (!isRetryableError(err)) break; // non-retryable: fail immediately
        console.warn(`[GeminiProvider] ${model} unavailable, trying next model...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    onError(lastErr ?? new Error('All Gemini models unavailable'));
  }

  async simplify(text: string, mode: string): Promise<string> {
    const instruction = SIMPLIFY_PROMPTS[mode] ?? SIMPLIFY_PROMPTS['simpler'];

    if (this.model) {
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: `${instruction}\n\nText to rewrite:\n${text}`,
        config: { systemInstruction: 'You are a writing assistant. Return only the rewritten text, no preamble.' },
      });
      return response.text ?? '';
    }

    let lastErr: Error | null = null;
    for (const model of FREE_TIER_MODELS) {
      try {
        const response = await this.ai.models.generateContent({
          model,
          contents: `${instruction}\n\nText to rewrite:\n${text}`,
          config: { systemInstruction: 'You are a writing assistant. Return only the rewritten text, no preamble.' },
        });
        return response.text ?? '';
      } catch (err) {
        lastErr = err instanceof Error ? err : new Error(String(err));
        if (!isRetryableError(err)) break;
        console.warn(`[GeminiProvider] ${model} unavailable for simplify, trying next...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    throw lastErr ?? new Error('All Gemini models unavailable');
  }

  async generateCitationNote(results: SearchResult[], originalText: string): Promise<string> {
    const sourceList = results
      .map((r, i) => `${i + 1}. "${r.title}" (${r.url}): ${r.content.slice(0, 200)}`)
      .join('\n');

    const prompt = `You found these sources for the text: "${originalText.slice(0, 300)}"\n\nSources:\n${sourceList}\n\nWrite 1–2 sentences synthesizing what these sources say about the text. Be factual and concise. Return only the note, no preamble.`;

    if (this.model) {
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt,
        config: { systemInstruction: 'You are a research assistant. Return only the citation note.' },
      });
      return response.text ?? '';
    }

    let lastErr: Error | null = null;
    for (const model of FREE_TIER_MODELS) {
      try {
        const response = await this.ai.models.generateContent({
          model,
          contents: prompt,
          config: { systemInstruction: 'You are a research assistant. Return only the citation note.' },
        });
        return response.text ?? '';
      } catch (err) {
        lastErr = err instanceof Error ? err : new Error(String(err));
        if (!isRetryableError(err)) break;
        console.warn(`[GeminiProvider] ${model} unavailable for citation note, trying next...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    throw lastErr ?? new Error('All Gemini models unavailable');
  }
}
