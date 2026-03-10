// backend/tests/auth.test.ts
// Integration tests — all three routes must return 401 without a valid Google ID token.
// With a valid mock token, the auth middleware passes and the route handler runs.

import request from 'supertest';

// Mock google-auth-library so tests run without real Google credentials.
// Default: verifyIdToken throws (simulates invalid/missing token).
const mockGetPayload = jest.fn();
const mockVerifyIdToken = jest.fn();

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
}));

let app: import('express').Application;
let server: import('http').Server;

beforeAll(async () => {
  // verifyIdToken throws by default → 401
  mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));
  const mod = await import('../src/index.js');
  app = mod.app;
  server = mod.server;
});

afterAll(async () => {
  server.close();
});

describe('Auth middleware — 401 without valid Google token', () => {
  it('POST /api/chat without token returns 401 UNAUTHORIZED', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ messages: [{ role: 'user', content: 'test' }] });
    expect(res.status).toBe(401);
    expect(res.body.data).toBeNull();
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('POST /api/simplify without token returns 401 UNAUTHORIZED', async () => {
    const res = await request(app)
      .post('/api/simplify')
      .send({ text: 'hello', mode: 'simpler' });
    expect(res.status).toBe(401);
    expect(res.body.data).toBeNull();
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('POST /api/find-sources without token returns 401 UNAUTHORIZED', async () => {
    const res = await request(app)
      .post('/api/find-sources')
      .send({ query: 'test query' });
    expect(res.status).toBe(401);
    expect(res.body.data).toBeNull();
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('POST /api/chat with invalid Bearer token returns 401', async () => {
    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', 'Bearer invalid_token_here')
      .send({ messages: [{ role: 'user', content: 'test' }] });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('POST /api/chat with valid mock token passes auth (not 401)', async () => {
    // Configure mock to return a valid payload for this test
    mockGetPayload.mockReturnValue({ sub: 'test-sub-123', email: 'test@example.com', name: 'Test User' });
    mockVerifyIdToken.mockResolvedValueOnce({ getPayload: mockGetPayload });

    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', 'Bearer valid_mock_token')
      .send({ messages: [] }); // empty messages — may return 400/500 from route, but NOT 401
    expect(res.status).not.toBe(401);
  });
});
