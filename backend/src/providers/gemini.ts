// backend/src/providers/gemini.ts
// GeminiProvider — implements AIProvider using @google/genai (v1.x, NOT deprecated @google/generative-ai)
import { GoogleGenAI } from '@google/genai';
import type { AIProvider, Message } from './types.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const SIMPLIFY_PROMPTS: Record<string, string> = {
  simpler: 'Rewrite the following text so a 12-year-old can understand it. Keep it concise.',
  example: 'Explain the following text by giving a concrete, relatable real-world example.',
  analogy: 'Explain the following text using a clear analogy to something familiar.',
  technical: 'Rewrite the following text with more technical depth and precise terminology for an expert audience.',
};

export class GeminiProvider implements AIProvider {
  async streamChat(
    messages: Message[],
    systemPrompt: string,
    onChunk: (chunk: string) => void,
    onDone: () => void,
    onError: (err: Error) => void,
    signal?: AbortSignal
  ): Promise<void> {
    try {
      const contents = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }],
      }));

      const response = await ai.models.generateContentStream({
        model: 'gemini-2.0-flash',
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
      onError(err instanceof Error ? err : new Error(String(err)));
    }
  }

  async simplify(text: string, mode: string): Promise<string> {
    const instruction = SIMPLIFY_PROMPTS[mode] ?? SIMPLIFY_PROMPTS['simpler'];
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `${instruction}\n\nText to rewrite:\n${text}`,
      config: { systemInstruction: 'You are a writing assistant. Return only the rewritten text, no preamble.' },
    });
    return response.text ?? '';
  }
}
