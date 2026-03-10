// backend/src/index.ts
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { apiRouter } from './routes/index.js';

export const app = express();

// 1. CORS — before routes
app.use(cors({
  origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 2. Body parsing
app.use(express.json({ limit: '1mb' }));

// 3. Rate limiting on all /api routes
app.use('/api', apiRateLimiter);

// 4. Authenticated API routes
app.use('/api', apiRouter);

// Health check — unauthenticated, not rate limited
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Start server — exported for tests (tests import app directly, not server)
export const server = app.listen(process.env.PORT ?? 3001, () => {
  console.log(`Backend running on port ${process.env.PORT ?? 3001}`);
});
