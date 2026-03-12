// backend/src/routes/find-sources.ts
// POST /api/find-sources — Tavily web search via searchProvider.findSources().
// Returns standard JSON envelope: { data: { results }, error: null }.
import { Router } from 'express';
import { getDefaultSearchProvider, getDefaultProvider, createByokProvider } from '../config.js';

export const findSourcesRouter = Router();

findSourcesRouter.post('/', async (req, res) => {
  const { query, byok } = req.body as {
    query?: string;
    byok?: { provider?: string; model?: string; apiKey?: string };
  };

  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    res.status(400).json({
      data: null,
      error: { code: 'BAD_REQUEST', message: 'query is required and must be a non-empty string' },
    });
    return;
  }

  // Resolve AI provider for citation note — BYOK or default
  // Search provider always uses default (BYOK search handled in plan 11-04)
  const rawApiKey = byok?.apiKey;
  if (byok) delete (byok as Record<string, unknown>).apiKey; // scrub key before any logging
  const aiProvider = (rawApiKey && byok?.provider && byok?.model)
    ? createByokProvider(byok.provider as 'gemini' | 'openai', byok.model, rawApiKey)
    : getDefaultProvider();

  const searchProvider = getDefaultSearchProvider();

  try {
    const results = await searchProvider.findSources(query.trim(), 3);

    // Generate AI synthesis note — sequential since note needs results
    let citationNote = '';
    if (results.length > 0) {
      try {
        citationNote = await aiProvider.generateCitationNote(results, query.trim());
      } catch {
        // Citation note failure is non-fatal — return results without note
        citationNote = '';
      }
    }

    res.json({ data: { results, citationNote }, error: null });
  } catch (err) {
    res.status(502).json({
      data: null,
      error: { code: 'UPSTREAM_ERROR', message: 'Search provider request failed' },
    });
  }
});
