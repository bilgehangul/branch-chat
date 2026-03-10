// backend/src/index.ts
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './db/connection.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { apiRouter } from './routes/index.js';

// --- Startup env validation ---
const REQUIRED_ENV = ['GOOGLE_CLIENT_ID'] as const;
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`[startup] FATAL: Missing required env var ${key}`);
    process.exit(1);
  }
}
if (!process.env.MONGODB_URI) {
  console.warn('[startup] WARNING: MONGODB_URI is not set — database operations will be unavailable');
}

export const app = express();

// 1. CORS — before routes
app.use(cors({
  origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 2. Body parsing
app.use(express.json({ limit: '1mb' }));

// 3. Rate limiting on all /api routes
app.use('/api', apiRateLimiter);

// 4. Authenticated API routes
app.use('/api', apiRouter);

// Health check — unauthenticated
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Connect to MongoDB then start listening.
// connectDB() is a no-op when MONGODB_URI is absent (test environments).
// server is exported synchronously so supertest can import it.
export const server = app.listen(process.env.PORT ?? 3001, () => {
  console.log(`Backend running on port ${process.env.PORT ?? 3001}`);
});

// Initiate DB connection after listen (non-blocking for tests)
connectDB().catch((err) => console.error('[startup] DB connection failed:', err));
