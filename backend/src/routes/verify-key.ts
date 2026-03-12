// backend/src/routes/verify-key.ts
// POST /api/verify-key — validates BYOK API key format then makes a lightweight test call.
// Security:
//   - Format validation rejects malformed keys without network calls
//   - Error messages redact the raw API key (BKND-09)
//   - byokRateLimiter applied at 30 req/min per userId
import { Router } from 'express';
import { byokRateLimiter } from '../middleware/byokRateLimiter.js';
import type { Request, Response } from 'express';

export const verifyKeyRouter = Router();

// Key format patterns — exported for testability
export const KEY_PATTERNS: Record<string, RegExp> = {
  gemini: /^AIza[0-9A-Za-z\-_]{35}$/,
  openai: /^sk-[A-Za-z0-9\-_]{20,}$/,
  anthropic: /^sk-ant-[A-Za-z0-9\-_]{32,}$/,
};

const SUPPORTED_PROVIDERS = ['gemini', 'openai', 'anthropic'] as const;
type SupportedProvider = typeof SUPPORTED_PROVIDERS[number];

function isSupportedProvider(p: string): p is SupportedProvider {
  return (SUPPORTED_PROVIDERS as readonly string[]).includes(p);
}

// Redact the raw API key from any error message string
function redactKey(message: string, apiKey: string): string {
  return message.replace(apiKey, '[REDACTED]');
}

async function makeTestCall(provider: SupportedProvider, apiKey: string): Promise<void> {
  if (provider === 'gemini') {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });
    await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: 'hi',
      config: { maxOutputTokens: 1 },
    });
    return;
  }

  if (provider === 'openai') {
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({ apiKey });
    await client.models.list();
    return;
  }

  if (provider === 'anthropic') {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic({ apiKey });
    await client.models.list();
    return;
  }
}

verifyKeyRouter.post('/', byokRateLimiter, async (req: Request, res: Response): Promise<void> => {
  const { provider, apiKey } = req.body as { provider?: string; apiKey?: string };

  // Validate required fields
  if (!provider || !apiKey) {
    res.status(400).json({
      data: null,
      error: { code: 'MISSING_FIELDS', message: 'provider and apiKey are required' },
    });
    return;
  }

  // Validate provider is supported
  if (!isSupportedProvider(provider)) {
    res.status(400).json({
      data: null,
      error: { code: 'UNKNOWN_PROVIDER', message: `Unknown provider: ${provider}` },
    });
    return;
  }

  // Format validation — reject malformed keys without network call
  const pattern = KEY_PATTERNS[provider];
  if (!pattern.test(apiKey)) {
    res.status(200).json({
      data: { valid: false, message: `Invalid key format for ${provider}` },
      error: null,
    });
    return;
  }

  // Format valid — make lightweight test call to verify key is active
  try {
    await makeTestCall(provider, apiKey);
    res.status(200).json({
      data: { valid: true },
      error: null,
    });
  } catch (err) {
    const rawMsg = err instanceof Error ? err.message : String(err);
    const safeMsg = redactKey(rawMsg, apiKey);
    res.status(200).json({
      data: { valid: false, message: safeMsg },
      error: null,
    });
  }
});
