// backend/src/middleware/byokRateLimiter.ts
// Per-user BYOK rate limiter: 30 requests/minute identified by userId (JWT sub).
// Applied to POST /api/verify-key and conditionally to chat/simplify/find-sources when BYOK is present.
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import type { Request } from 'express';

// Exported config for testability — tests can inspect config values and keyGenerator directly.
export const BYOK_RATE_LIMIT_CONFIG = {
  windowMs: 60000, // 1 minute
  limit: 30,
  keyGenerator: (req: Request): string => {
    // Prefer userId (JWT sub) over IP — ensures per-user limiting regardless of IP sharing/NAT
    const verifiedUser = (req as any).verifiedUser;
    if (verifiedUser?.sub) return verifiedUser.sub;
    const ip = req.ip;
    if (!ip) return 'anonymous';
    // Use ipKeyGenerator for proper IPv6 normalization (avoids ERR_ERL_KEY_GEN_IPV6)
    return ipKeyGenerator(ip);
  },
};

export const byokRateLimiter = rateLimit({
  windowMs: BYOK_RATE_LIMIT_CONFIG.windowMs,
  limit: BYOK_RATE_LIMIT_CONFIG.limit,
  keyGenerator: BYOK_RATE_LIMIT_CONFIG.keyGenerator,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      data: null,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many BYOK requests. Please wait a minute before trying again.',
      },
    });
  },
});
