// backend/tests/sanitizeBody.test.ts
// Tests for the BYOK key extraction + scrubbing pattern used in API routes.
// Verifies that extracting rawApiKey and deleting it from byok prevents key leakage.

describe('BYOK key extraction and body scrubbing pattern', () => {
  it('extracting rawApiKey and deleting from byok removes key from body', () => {
    const reqBody = {
      messages: [{ role: 'user', content: 'hello' }],
      byok: {
        provider: 'openai',
        model: 'gpt-4o',
        apiKey: 'sk-supersecret-key',
      },
    };

    // Simulate the pattern used in chat.ts, simplify.ts, find-sources.ts
    const byok = reqBody.byok;
    const rawApiKey = byok?.apiKey;
    if (byok) {
      delete (byok as any).apiKey;
    }

    // rawApiKey captured
    expect(rawApiKey).toBe('sk-supersecret-key');

    // apiKey no longer in byok
    expect((byok as any).apiKey).toBeUndefined();

    // reqBody.byok still has provider and model but not apiKey
    expect(reqBody.byok).toEqual({ provider: 'openai', model: 'gpt-4o' });
  });

  it('extracting from byok when byok is undefined does not throw', () => {
    const reqBody: { byok?: { provider: string; model: string; apiKey: string } } = {
    };

    const byok = reqBody.byok;
    const rawApiKey = byok?.apiKey;
    if (byok) {
      delete (byok as any).apiKey;
    }

    expect(rawApiKey).toBeUndefined();
    expect(byok).toBeUndefined();
  });

  it('after deletion, apiKey is not forwarded to downstream processing', () => {
    const reqBody = {
      byok: {
        provider: 'anthropic',
        model: 'claude-sonnet-4-6',
        apiKey: 'sk-ant-supersecret',
      },
    };

    const byok = reqBody.byok;
    const rawApiKey = byok?.apiKey;
    if (byok) delete (byok as any).apiKey;

    // Simulate what gets logged/forwarded downstream
    const loggedBody = JSON.stringify(reqBody);
    expect(loggedBody).not.toContain('sk-ant-supersecret');
    expect(rawApiKey).toBe('sk-ant-supersecret');
  });
});
