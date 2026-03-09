// backend/tests/auth.test.ts
// Integration tests — all three routes must return 401 without a valid Clerk JWT.
// Uses supertest to send HTTP requests to the Express app without a running port.

import request from 'supertest';

// Mock @clerk/express so tests run without real Clerk keys.
// getAuth returns { userId: null } by default (simulates unauthenticated request).
jest.mock('@clerk/express', () => ({
  clerkMiddleware: jest.fn(() => (
    _req: unknown, _res: unknown, next: () => void
  ) => next()),
  getAuth: jest.fn().mockReturnValue({ userId: null }),
}));

// Import app after mocks are set up
let app: import('express').Application;

beforeAll(async () => {
  const mod = await import('../src/index.js');
  app = mod.app;
});

afterAll(async () => {
  const mod = await import('../src/index.js');
  mod.server.close();
});

describe('Auth middleware — 401 on all routes without JWT', () => {
  it('POST /api/chat without JWT returns 401 with UNAUTHORIZED code', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ messages: [{ role: 'user', content: 'test' }] });

    expect(res.status).toBe(401);
    expect(res.body.data).toBeNull();
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('POST /api/simplify without JWT returns 401 with UNAUTHORIZED code', async () => {
    const res = await request(app)
      .post('/api/simplify')
      .send({ text: 'hello', mode: 'simpler' });

    expect(res.status).toBe(401);
    expect(res.body.data).toBeNull();
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('POST /api/find-sources without JWT returns 401 with UNAUTHORIZED code', async () => {
    const res = await request(app)
      .post('/api/find-sources')
      .send({ query: 'test query' });

    expect(res.status).toBe(401);
    expect(res.body.data).toBeNull();
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('POST /api/chat with invalid JWT returns 401 (getAuth returns no userId)', async () => {
    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', 'Bearer invalid_token_here')
      .send({ messages: [{ role: 'user', content: 'test' }] });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});
