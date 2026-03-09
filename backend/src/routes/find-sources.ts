// backend/src/routes/find-sources.ts
// POST /api/find-sources — Tavily web search via searchProvider.findSources().
// Returns standard JSON envelope: { data: { results }, error: null }.
import { Router } from 'express';
import { searchProvider } from '../config.js';

export const findSourcesRouter = Router();

findSourcesRouter.post('/', async (req, res) => {
  const { query } = req.body as { query?: string };

  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    res.status(400).json({
      data: null,
      error: { code: 'BAD_REQUEST', message: 'query is required and must be a non-empty string' },
    });
    return;
  }

  try {
    const results = await searchProvider.findSources(query.trim(), 3);
    res.json({ data: { results }, error: null });
  } catch (err) {
    res.status(502).json({
      data: null,
      error: { code: 'UPSTREAM_ERROR', message: 'Search provider request failed' },
    });
  }
});
