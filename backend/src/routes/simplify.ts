// backend/src/routes/simplify.ts
// POST /api/simplify — single-shot text rewrite via aiProvider.simplify().
// Returns standard JSON envelope: { data: { rewritten }, error: null }.
import { Router } from 'express';
import { getDefaultProvider, createByokProvider } from '../config.js';

export const simplifyRouter = Router();

simplifyRouter.post('/', async (req, res) => {
  const { text, mode, byok } = req.body as {
    text?: string;
    mode?: string;
    byok?: { provider?: string; model?: string; apiKey?: string };
  };

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    res.status(400).json({
      data: null,
      error: { code: 'BAD_REQUEST', message: 'text is required and must be a non-empty string' },
    });
    return;
  }

  const validModes = ['simpler', 'example', 'analogy', 'technical'];
  if (!mode || !validModes.includes(mode)) {
    res.status(400).json({
      data: null,
      error: { code: 'BAD_REQUEST', message: `mode is required; must be one of: ${validModes.join(', ')}` },
    });
    return;
  }

  // Resolve provider — BYOK or default
  const rawApiKey = byok?.apiKey;
  if (byok) delete (byok as Record<string, unknown>).apiKey; // scrub key before any logging
  const aiProvider = (rawApiKey && byok?.provider && byok?.model)
    ? createByokProvider(byok.provider as 'gemini' | 'openai', byok.model, rawApiKey)
    : getDefaultProvider();

  try {
    const rewritten = await aiProvider.simplify(text, mode);
    res.json({ data: { rewritten }, error: null });
  } catch (err) {
    res.status(502).json({
      data: null,
      error: { code: 'UPSTREAM_ERROR', message: 'AI is temporarily overloaded. Please try again in a moment.' },
    });
  }
});
