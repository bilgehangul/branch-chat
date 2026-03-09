// backend/tests/providers.test.ts
import { OpenAIProvider } from '../src/providers/openai.js';
import { OpenAISearchProvider } from '../src/providers/openai-search.js';

describe('OpenAI stub — throws NotImplementedError', () => {
  const provider = new OpenAIProvider();
  const searchProvider = new OpenAISearchProvider();

  it('OpenAIProvider.streamChat() throws with "not yet implemented"', () => {
    expect(() => provider.streamChat([], '', () => {}, () => {}, () => {}))
      .toThrow(/not yet implemented/i);
  });

  it('OpenAIProvider.simplify() throws with "not yet implemented"', () => {
    expect(() => provider.simplify('text', 'simpler'))
      .toThrow(/not yet implemented/i);
  });

  it('OpenAISearchProvider.findSources() throws with "not yet implemented"', () => {
    expect(() => searchProvider.findSources('query'))
      .toThrow(/not yet implemented/i);
  });
});

describe('Provider factory — config.ts', () => {
  const originalEnv = process.env.AI_PROVIDER;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.AI_PROVIDER;
    } else {
      process.env.AI_PROVIDER = originalEnv;
    }
  });

  it('Default (no AI_PROVIDER env) returns GeminiProvider and TavilyProvider', async () => {
    delete process.env.AI_PROVIDER;
    let aiProvider: unknown;
    let searchProvider: unknown;
    await jest.isolateModulesAsync(async () => {
      const config = await import('../src/config.js');
      aiProvider = config.aiProvider;
      searchProvider = config.searchProvider;
    });
    expect((aiProvider as object).constructor.name).toBe('GeminiProvider');
    expect((searchProvider as object).constructor.name).toBe('TavilyProvider');
  });

  it('AI_PROVIDER=gemini returns GeminiProvider and TavilyProvider', async () => {
    process.env.AI_PROVIDER = 'gemini';
    let aiProvider: unknown;
    let searchProvider: unknown;
    await jest.isolateModulesAsync(async () => {
      const config = await import('../src/config.js');
      aiProvider = config.aiProvider;
      searchProvider = config.searchProvider;
    });
    expect((aiProvider as object).constructor.name).toBe('GeminiProvider');
    expect((searchProvider as object).constructor.name).toBe('TavilyProvider');
  });

  it('AI_PROVIDER=openai returns OpenAIProvider and OpenAISearchProvider', async () => {
    process.env.AI_PROVIDER = 'openai';
    let aiProvider: unknown;
    let searchProvider: unknown;
    await jest.isolateModulesAsync(async () => {
      const config = await import('../src/config.js');
      aiProvider = config.aiProvider;
      searchProvider = config.searchProvider;
    });
    expect((aiProvider as object).constructor.name).toBe('OpenAIProvider');
    expect((searchProvider as object).constructor.name).toBe('OpenAISearchProvider');
  });
});
