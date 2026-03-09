// backend/src/middleware/rateLimiter.ts
// Per-user rate limiting using express-rate-limit.
// keyGenerator: Clerk userId for authenticated requests, req.ip for guests.
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { getAuth } from '@clerk/express';

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,                // 100 requests per 15 min per user/IP
  keyGenerator: (req) => {
    const { userId } = getAuth(req);
    const ip = req.ip ?? 'anonymous';
    return userId ?? (ip === 'anonymous' ? 'anonymous' : ipKeyGenerator(ip));
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      data: null,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please try again later.',
      },
    });
  },
});
