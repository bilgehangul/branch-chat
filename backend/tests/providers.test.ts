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
