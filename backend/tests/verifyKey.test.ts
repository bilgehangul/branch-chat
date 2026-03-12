// backend/tests/verifyKey.test.ts
// Tests for POST /api/verify-key — key format validation and error redaction.
// All actual SDK calls are mocked so no real API requests are made.

// --- Mock SDKs used by verify-key.ts via dynamic import ---
const mockGeminiGenerateContent = jest.fn();
const mockOpenAIModelsList = jest.fn();
const mockAnthropicModelsList = jest.fn();

// Mock @google/genai for dynamic import in verify-key.ts
jest.mock('@google/genai', () => ({
  __esModule: true,
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGeminiGenerateContent,
    },
  })),
}));

// Mock openai for dynamic import in verify-key.ts
jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    models: {
      list: mockOpenAIModelsList,
    },
  })),
}));

// Mock @anthropic-ai/sdk for dynamic import in verify-key.ts
jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    models: {
      list: mockAnthropicModelsList,
    },
  })),
}));

import request from 'supertest';
import express from 'express';
import { verifyKeyRouter } from '../src/routes/verify-key.js';
import { KEY_PATTERNS } from '../src/routes/verify-key.js';

// Build a minimal test app (no real auth middleware needed for format validation tests)
function buildTestApp() {
  const app = express();
  app.use(express.json());
  // Inject a fake verifiedUser so requireApiAuth is bypassed
  app.use((req, _res, next) => {
    (req as any).verifiedUser = { sub: 'test-user-123' };
    next();
  });
  app.use('/api/verify-key', verifyKeyRouter);
  return app;
}

describe('POST /api/verify-key — key format validation', () => {
  const app = buildTestApp();

  beforeEach(() => {
    mockGeminiGenerateContent.mockReset();
    mockOpenAIModelsList.mockReset();
    mockAnthropicModelsList.mockReset();
  });

  // --- Gemini key format ---
  it('valid gemini key format (AIza + 35 chars) passes regex and proceeds to API call', async () => {
    mockGeminiGenerateContent.mockResolvedValueOnce({ text: 'ok' });

    const validGeminiKey = 'AIza' + 'A'.repeat(35);
    const res = await request(app)
      .post('/api/verify-key')
      .send({ provider: 'gemini', apiKey: validGeminiKey });

    expect(res.status).toBe(200);
    expect(res.body.data.valid).toBe(true);
    expect(res.body.error).toBeNull();
  });

  it('invalid gemini key (too short) returns valid:false without API call', async () => {
    const res = await request(app)
      .post('/api/verify-key')
      .send({ provider: 'gemini', apiKey: 'AIza-short' });

    expect(res.status).toBe(200);
    expect(res.body.data.valid).toBe(false);
    expect(res.body.data.message).toMatch(/invalid key format/i);
    // No API call made
    expect(mockGeminiGenerateContent).not.toHaveBeenCalled();
  });

  it('invalid gemini key (wrong prefix) returns valid:false', async () => {
    const res = await request(app)
      .post('/api/verify-key')
      .send({ provider: 'gemini', apiKey: 'BXYZ' + 'A'.repeat(35) });

    expect(res.status).toBe(200);
    expect(res.body.data.valid).toBe(false);
    expect(mockGeminiGenerateContent).not.toHaveBeenCalled();
  });

  // --- OpenAI key format ---
  it('valid openai key (sk- prefix + 20+ chars) passes regex', async () => {
    mockOpenAIModelsList.mockResolvedValueOnce({ data: [] });

    const validOpenAIKey = 'sk-' + 'A'.repeat(20);
    const res = await request(app)
      .post('/api/verify-key')
      .send({ provider: 'openai', apiKey: validOpenAIKey });

    expect(res.status).toBe(200);
    expect(res.body.data.valid).toBe(true);
  });

  it('valid openai key (sk-proj- prefix) passes regex', async () => {
    mockOpenAIModelsList.mockResolvedValueOnce({ data: [] });

    const validOpenAIKey = 'sk-proj-' + 'A'.repeat(20);
    const res = await request(app)
      .post('/api/verify-key')
      .send({ provider: 'openai', apiKey: validOpenAIKey });

    expect(res.status).toBe(200);
    expect(res.body.data.valid).toBe(true);
  });

  it('invalid openai key returns valid:false without API call', async () => {
    const res = await request(app)
      .post('/api/verify-key')
      .send({ provider: 'openai', apiKey: 'not-a-valid-key' });

    expect(res.status).toBe(200);
    expect(res.body.data.valid).toBe(false);
    expect(mockOpenAIModelsList).not.toHaveBeenCalled();
  });

  // --- Anthropic key format ---
  it('valid anthropic key (sk-ant- prefix + 32+ chars) passes regex', async () => {
    mockAnthropicModelsList.mockResolvedValueOnce({ data: [] });

    const validAnthropicKey = 'sk-ant-' + 'A'.repeat(32);
    const res = await request(app)
      .post('/api/verify-key')
      .send({ provider: 'anthropic', apiKey: validAnthropicKey });

    expect(res.status).toBe(200);
    expect(res.body.data.valid).toBe(true);
  });

  it('invalid anthropic key returns valid:false without API call', async () => {
    const res = await request(app)
      .post('/api/verify-key')
      .send({ provider: 'anthropic', apiKey: 'sk-ant-short' });

    expect(res.status).toBe(200);
    expect(res.body.data.valid).toBe(false);
    expect(mockAnthropicModelsList).not.toHaveBeenCalled();
  });

  // --- Missing fields ---
  it('missing provider returns 400', async () => {
    const res = await request(app)
      .post('/api/verify-key')
      .send({ apiKey: 'sk-test-key' });

    expect(res.status).toBe(400);
  });

  it('missing apiKey returns 400', async () => {
    const res = await request(app)
      .post('/api/verify-key')
      .send({ provider: 'openai' });

    expect(res.status).toBe(400);
  });

  it('unknown provider returns 400', async () => {
    const res = await request(app)
      .post('/api/verify-key')
      .send({ provider: 'unknown', apiKey: 'some-key' });

    expect(res.status).toBe(400);
  });

  // --- Error redaction (BKND-09) ---
  it('error message redacts the raw API key', async () => {
    const secretKey = 'sk-' + 'S'.repeat(20);
    mockOpenAIModelsList.mockRejectedValueOnce(
      new Error(`Authentication failed for key ${secretKey} - invalid credentials`)
    );

    const res = await request(app)
      .post('/api/verify-key')
      .send({ provider: 'openai', apiKey: secretKey });

    expect(res.status).toBe(200);
    expect(res.body.data.valid).toBe(false);
    expect(res.body.data.message).not.toContain(secretKey);
    expect(res.body.data.message).toContain('[REDACTED]');
  });

  // --- KEY_PATTERNS export for direct testing ---
  it('KEY_PATTERNS.gemini matches valid gemini key format', () => {
    expect(KEY_PATTERNS.gemini.test('AIza' + 'A'.repeat(35))).toBe(true);
    expect(KEY_PATTERNS.gemini.test('AIza-short')).toBe(false);
    expect(KEY_PATTERNS.gemini.test('AIza_' + 'B'.repeat(34))).toBe(true); // underscore allowed
  });

  it('KEY_PATTERNS.openai matches valid openai key formats', () => {
    expect(KEY_PATTERNS.openai.test('sk-' + 'A'.repeat(20))).toBe(true);
    expect(KEY_PATTERNS.openai.test('sk-proj-' + 'A'.repeat(20))).toBe(true);
    expect(KEY_PATTERNS.openai.test('not-a-key')).toBe(false);
  });

  it('KEY_PATTERNS.anthropic matches valid anthropic key formats', () => {
    expect(KEY_PATTERNS.anthropic.test('sk-ant-' + 'A'.repeat(32))).toBe(true);
    expect(KEY_PATTERNS.anthropic.test('sk-ant-short')).toBe(false);
    expect(KEY_PATTERNS.anthropic.test('sk-ant-' + 'A-_'.repeat(15))).toBe(true);
  });
});
