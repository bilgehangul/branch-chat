// backend/src/index.ts
// Express app entry point.
// MIDDLEWARE ORDER IS CRITICAL — do not reorder:
//   1. clerkMiddleware() — must be global and first (populates req.auth for all getAuth() calls)
//   2. cors() — before routes
//   3. express.json() — before routes that read req.body
//   4. apiRateLimiter — before route handlers (after Clerk so keyGenerator can read userId)
//   5. apiRouter at /api — authenticated sub-router with requireApiAuth
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { apiRouter } from './routes/index.js';

export const app = express();

// 1. Clerk — must be first so getAuth() works in all subsequent middleware and handlers
app.use(clerkMiddleware());

// 2-3. Standard middleware
app.use(cors({
  origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '1mb' }));

// 4. Rate limiting on all /api routes
app.use('/api', apiRateLimiter);

// 5. Authenticated API routes
app.use('/api', apiRouter);

// Health check — unauthenticated, not rate limited
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT ?? 3001;
export const server = app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT} with AI_PROVIDER=${process.env.AI_PROVIDER ?? 'gemini'}`);
});
