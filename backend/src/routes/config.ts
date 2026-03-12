// backend/src/routes/config.ts
// Public config endpoint — returns non-sensitive app configuration.
// Mounted BEFORE requireApiAuth in the API router so it's accessible without auth.
import { Router } from 'express';

const PROVIDER = process.env.AI_PROVIDER ?? 'gemini';
const MODEL_LABELS: Record<string, string> = {
  gemini: 'Gemini Flash 2.0',
  openai: 'GPT-4o',
};

export const configRouter = Router();

configRouter.get('/', (_req, res) => {
  res.json({ modelLabel: MODEL_LABELS[PROVIDER] ?? PROVIDER });
});
