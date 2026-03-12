// backend/tests/byokRateLimiter.test.ts
// Tests for byokRateLimiter middleware — per-user rate limiting at 30 req/min.

import { byokRateLimiter, BYOK_RATE_LIMIT_CONFIG } from '../src/middleware/byokRateLimiter.js';

describe('byokRateLimiter — configuration', () => {
  it('exports a middleware function', () => {
    expect(typeof byokRateLimiter).toBe('function');
  });

  it('BYOK_RATE_LIMIT_CONFIG.windowMs is 60000 (1 minute)', () => {
    expect(BYOK_RATE_LIMIT_CONFIG.windowMs).toBe(60000);
  });

  it('BYOK_RATE_LIMIT_CONFIG.limit is 30', () => {
    expect(BYOK_RATE_LIMIT_CONFIG.limit).toBe(30);
  });

  it('keyGenerator uses req.verifiedUser.sub when present', () => {
    const mockReq = {
      verifiedUser: { sub: 'user-abc-123' },
      ip: '1.2.3.4',
    };
    const key = BYOK_RATE_LIMIT_CONFIG.keyGenerator(mockReq as any);
    expect(key).toBe('user-abc-123');
  });

  it('keyGenerator falls back to req.ip (normalized via ipKeyGenerator) when verifiedUser is absent', () => {
    const mockReq = {
      ip: '1.2.3.4',
    };
    const key = BYOK_RATE_LIMIT_CONFIG.keyGenerator(mockReq as any);
    // IPv4 passes through ipKeyGenerator unchanged
    expect(key).toBe('1.2.3.4');
  });

  it('keyGenerator falls back to "anonymous" when both are absent', () => {
    const mockReq = {};
    const key = BYOK_RATE_LIMIT_CONFIG.keyGenerator(mockReq as any);
    expect(key).toBe('anonymous');
  });
});
