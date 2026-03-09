// backend/src/providers/gemini.ts
// GeminiProvider — implements AIProvider using @google/genai (v1.x, NOT deprecated @google/generative-ai)
import { GoogleGenAI } from '@google/genai';
import type { AIProvider, Message, SearchResult } from './types.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// Free-tier models in priority order — tried in sequence on 503/overload errors
const FREE_TIER_MODELS = [
  'gemini-3-flash-preview',
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',

] as const;

const SIMPLIFY_PROMPTS: Record<string, string> = {
  simpler: 'Rewrite the following text so a 12-year-old can understand it. Keep it concise.',
  example: 'Explain the following text by giving a concrete, relatable real-world example.',
  analogy: 'Explain the following text using a clear analogy to something familiar.',
  technical: 'Rewrite the following text with more technical depth and precise terminology for an expert audience.',
};

function isRetryableError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('503') || msg.includes('overloaded') || msg.includes('UNAVAILABLE') || msg.includes('quota');
}

export class GeminiProvider implements AIProvider {
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

    let lastErr: Error | null = null;
    for (const model of FREE_TIER_MODELS) {
      if (signal?.aborted) { onDone(); return; }
      try {
        const response = await ai.models.generateContentStream({
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
      }
    }
    onError(lastErr ?? new Error('All Gemini models unavailable'));
  }

  async simplify(text: string, mode: string): Promise<string> {
    const instruction = SIMPLIFY_PROMPTS[mode] ?? SIMPLIFY_PROMPTS['simpler'];

    let lastErr: Error | null = null;
    for (const model of FREE_TIER_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: `${instruction}\n\nText to rewrite:\n${text}`,
          config: { systemInstruction: 'You are a writing assistant. Return only the rewritten text, no preamble.' },
        });
        return response.text ?? '';
      } catch (err) {
        lastErr = err instanceof Error ? err : new Error(String(err));
        if (!isRetryableError(err)) break;
        console.warn(`[GeminiProvider] ${model} unavailable for simplify, trying next...`);
      }
    }
    throw lastErr ?? new Error('All Gemini models unavailable');
  }

  async generateCitationNote(results: SearchResult[], originalText: string): Promise<string> {
    const sourceList = results
      .map((r, i) => `${i + 1}. "${r.title}" (${r.url}): ${r.content.slice(0, 200)}`)
      .join('\n');

    const prompt = `You found these sources for the text: "${originalText.slice(0, 300)}"\n\nSources:\n${sourceList}\n\nWrite 1–2 sentences synthesizing what these sources say about the text. Be factual and concise. Return only the note, no preamble.`;

    let lastErr: Error | null = null;
    for (const model of FREE_TIER_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: { systemInstruction: 'You are a research assistant. Return only the citation note.' },
        });
        return response.text ?? '';
      } catch (err) {
        lastErr = err instanceof Error ? err : new Error(String(err));
        if (!isRetryableError(err)) break;
        console.warn(`[GeminiProvider] ${model} unavailable for citation note, trying next...`);
      }
    }
    throw lastErr ?? new Error('All Gemini models unavailable');
  }
}
