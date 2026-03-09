// backend/tests/providers.test.ts
// Wave 0 stub. Tests filled in Plan 02 when provider files exist.

describe('Provider factory — config.ts', () => {
  it.todo('AI_PROVIDER=gemini returns GeminiProvider instance');
  it.todo('AI_PROVIDER=openai returns OpenAIProvider instance');
  it.todo('Default (no AI_PROVIDER env) returns GeminiProvider');
});

describe('OpenAI stub — throws NotImplementedError', () => {
  it.todo('OpenAIProvider.streamChat() throws with message containing "not yet implemented"');
  it.todo('OpenAIProvider.simplify() throws with message containing "not yet implemented"');
  it.todo('OpenAISearchProvider.findSources() throws with message containing "not yet implemented"');
});
