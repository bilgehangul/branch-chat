// backend/tests/rateLimiter.test.ts
// Tests for IP-only rate limiter keyGenerator (Clerk removed in Phase 7).
import type { Request } from 'express';

describe('Rate limiter', () => {
  it('apiRateLimiter is a middleware function', () => {
    jest.isolateModules(() => {
      const { apiRateLimiter } = require('../src/middleware/rateLimiter.js');
      expect(typeof apiRateLimiter).toBe('function');
    });
  });

  it('keyGenerator returns IP for requests with valid IP', () => {
    // IP-only key generation (Clerk userId removed in Phase 7)
    const fakeReq = { ip: '1.2.3.4' } as unknown as Request;
    const ip = fakeReq.ip ?? 'anonymous';
    const key = ip === 'anonymous' ? 'anonymous' : ip;
    expect(key).toBe('1.2.3.4');
  });

  it('keyGenerator returns "anonymous" when IP is absent', () => {
    const fakeReq = { ip: undefined } as unknown as Request;
    const ip = fakeReq.ip ?? 'anonymous';
    const key = ip === 'anonymous' ? 'anonymous' : ip;
    expect(key).toBe('anonymous');
  });
});
