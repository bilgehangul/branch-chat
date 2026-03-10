// backend/src/middleware/rateLimiter.ts
// Per-IP rate limiting. Note: requireApiAuth runs inside apiRouter (after rate limiter),
// so req.verifiedUser is not available here. Use IP for all rate limiting in Phase 7.
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import type { Request } from 'express';

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  keyGenerator: (req: Request) => {
    const ip = req.ip ?? 'anonymous';
    return ip === 'anonymous' ? 'anonymous' : ipKeyGenerator(ip);
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
