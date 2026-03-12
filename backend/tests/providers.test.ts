// backend/tests/providers.test.ts
// Tests for provider factory pattern and provider implementations.

// Mock @google/genai before importing anything that uses it
const mockGenerateContentStream = jest.fn();
const mockGenerateContent = jest.fn();

jest.mock('@google/genai', () => {
  return {
    __esModule: true,
    GoogleGenAI: jest.fn().mockImplementation(() => ({
      models: {
        generateContentStream: mockGenerateContentStream,
        generateContent: mockGenerateContent,
      },
    })),
  };
});

// Mock openai SDK
// ts-jest compiles `import OpenAI from 'openai'` as `openai_1.default` (CommonJS interop).
// The mock must expose a callable constructor at `default`.
const mockChatCreate = jest.fn();

jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockChatCreate,
        },
      },
    })),
  };
});

// Mock @anthropic-ai/sdk
// Same ts-jest CommonJS interop pattern as openai mock.
const mockAnthropicMessagesCreate = jest.fn();
const mockAnthropicModelsListFn = jest.fn();

jest.mock('@anthropic-ai/sdk', () => {
  const mockStream = jest.fn();
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: {
        stream: mockStream,
        create: mockAnthropicMessagesCreate,
      },
      models: {
        list: mockAnthropicModelsListFn,
      },
    })),
  };
});

import { GeminiProvider } from '../src/providers/gemini.js';
import { OpenAIProvider } from '../src/providers/openai.js';
import { AnthropicProvider } from '../src/providers/anthropic.js';
import { OpenAISearchProvider } from '../src/providers/openai-search.js';
import { getDefaultProvider, createByokProvider, getDefaultSearchProvider } from '../src/config.js';
import type { SearchResult } from '../src/providers/types.js';

// ──────────────────────────────────────────────
// GeminiProvider: constructor injection
// ──────────────────────────────────────────────
describe('GeminiProvider — constructor injection', () => {
  beforeEach(() => {
    mockGenerateContentStream.mockReset();
    mockGenerateContent.mockReset();
  });

  it('accepts (apiKey, model) parameters in constructor', () => {
    const provider = new GeminiProvider('test-api-key', 'gemini-2.0-flash');
    expect(provider).toBeInstanceOf(GeminiProvider);
  });

  it('accepts apiKey only (model undefined)', () => {
    const provider = new GeminiProvider('test-api-key');
    expect(provider).toBeInstanceOf(GeminiProvider);
  });

  it('FREE_TIER_MODELS contains exactly gemini-2.0-flash and gemini-2.0-flash-lite', () => {
    const { FREE_TIER_MODELS } = require('../src/providers/gemini.js');
    expect(FREE_TIER_MODELS).toEqual(['gemini-2.0-flash', 'gemini-2.0-flash-lite']);
  });

  it('when model is set, streamChat uses only that model (no fallback)', async () => {
    // Provide an async iterable for the stream
    async function* mockChunks() {
      yield { text: 'hello' };
    }
    mockGenerateContentStream.mockResolvedValueOnce(mockChunks());

    const provider = new GeminiProvider('test-key', 'gemini-2.0-flash');
    const chunks: string[] = [];
    await provider.streamChat(
      [{ role: 'user', content: 'hi' }],
      'system',
      (c) => chunks.push(c),
      () => {},
      (e) => { throw e; }
    );

    expect(mockGenerateContentStream).toHaveBeenCalledTimes(1);
    expect(mockGenerateContentStream).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'gemini-2.0-flash' })
    );
    expect(chunks).toEqual(['hello']);
  });

  it('when model is null/undefined, streamChat falls back through FREE_TIER_MODELS', async () => {
    // First model fails with 503, second succeeds
    async function* mockChunks() {
      yield { text: 'fallback' };
    }
    mockGenerateContentStream
      .mockRejectedValueOnce(new Error('503 Service Unavailable'))
      .mockResolvedValueOnce(mockChunks());

    const provider = new GeminiProvider('test-key');
    const chunks: string[] = [];
    await provider.streamChat(
      [{ role: 'user', content: 'hi' }],
      'system',
      (c) => chunks.push(c),
      () => {},
      (e) => { throw e; }
    );

    expect(mockGenerateContentStream).toHaveBeenCalledTimes(2);
    expect(chunks).toEqual(['fallback']);
  });
});

// ──────────────────────────────────────────────
// OpenAIProvider: full implementation
// ──────────────────────────────────────────────
describe('OpenAIProvider — full implementation', () => {
  beforeEach(() => {
    mockChatCreate.mockReset();
  });

  it('OpenAIProvider(apiKey, model) creates instance without throwing', () => {
    const provider = new OpenAIProvider('sk-test', 'gpt-4o');
    expect(provider).toBeInstanceOf(OpenAIProvider);
  });

  it('streamChat maps role "model" to "assistant"', async () => {
    async function* mockSSEChunks() {
      yield { choices: [{ delta: { content: 'hi' } }] };
      yield { choices: [{ delta: { content: ' there' } }] };
    }
    mockChatCreate.mockResolvedValueOnce(mockSSEChunks());

    const provider = new OpenAIProvider('sk-test', 'gpt-4o');
    const chunks: string[] = [];
    await provider.streamChat(
      [
        { role: 'user', content: 'hello' },
        { role: 'model', content: 'world' }, // should map to 'assistant'
      ],
      'system prompt',
      (c) => chunks.push(c),
      () => {},
      (e) => { throw e; }
    );

    const callArgs = mockChatCreate.mock.calls[0][0];
    const assistantMsg = callArgs.messages.find((m: { role: string }) => m.role === 'assistant');
    expect(assistantMsg).toBeDefined();
    expect(assistantMsg.content).toBe('world');
    expect(chunks).toEqual(['hi', ' there']);
  });

  it('simplify returns response.choices[0].message.content', async () => {
    mockChatCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'simplified text' } }],
    });

    const provider = new OpenAIProvider('sk-test', 'gpt-4o');
    const result = await provider.simplify('original text', 'simpler');
    expect(result).toBe('simplified text');
  });

  it('generateCitationNote returns synthesized note', async () => {
    mockChatCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'These sources confirm the claim.' } }],
    });

    const provider = new OpenAIProvider('sk-test', 'gpt-4o');
    const results: SearchResult[] = [
      { title: 'Test', url: 'http://example.com', content: 'content', score: 0.9 },
    ];
    const note = await provider.generateCitationNote(results, 'original query');
    expect(note).toBe('These sources confirm the claim.');
  });
});

// ──────────────────────────────────────────────
// AnthropicProvider: full implementation
// ──────────────────────────────────────────────
describe('AnthropicProvider — full implementation', () => {
  let Anthropic: jest.Mock;

  beforeEach(() => {
    // Reset the mock stream function reference per test
    Anthropic = (require('@anthropic-ai/sdk') as { default: jest.Mock }).default;
    mockAnthropicMessagesCreate.mockReset();
    mockAnthropicModelsListFn.mockReset();
  });

  it('AnthropicProvider(apiKey, model) creates instance without throwing', () => {
    const provider = new AnthropicProvider('sk-ant-test', 'claude-sonnet-4-6');
    expect(provider).toBeInstanceOf(AnthropicProvider);
    expect(Anthropic).toHaveBeenCalledWith({ apiKey: 'sk-ant-test' });
  });

  it('streamChat maps role "model" to "assistant"', async () => {
    // messages.stream returns an async iterable of MessageStreamEvent
    async function* mockStreamEvents() {
      yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'hello' } };
      yield { type: 'content_block_delta', delta: { type: 'text_delta', text: ' world' } };
      yield { type: 'message_stop' };
    }
    // Re-create with fresh mock to capture the stream call
    const mockStreamFn = jest.fn().mockReturnValue(mockStreamEvents());
    (Anthropic as jest.Mock).mockImplementationOnce(() => ({
      messages: { stream: mockStreamFn, create: mockAnthropicMessagesCreate },
      models: { list: mockAnthropicModelsListFn },
    }));

    const provider = new AnthropicProvider('sk-ant-test', 'claude-sonnet-4-6');
    const chunks: string[] = [];
    await provider.streamChat(
      [
        { role: 'user', content: 'hello' },
        { role: 'model', content: 'previous response' }, // should map to 'assistant'
      ],
      'system prompt',
      (c: string) => chunks.push(c),
      () => {},
      (e: Error) => { throw e; }
    );

    expect(mockStreamFn).toHaveBeenCalledTimes(1);
    const callArg = mockStreamFn.mock.calls[0][0];
    // systemPrompt passed as top-level 'system', NOT in messages array
    expect(callArg.system).toBe('system prompt');
    expect(callArg.messages).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ role: 'system' })])
    );
    // 'model' role should be mapped to 'assistant'
    const assistantMsg = callArg.messages.find((m: { role: string }) => m.role === 'assistant');
    expect(assistantMsg).toBeDefined();
    expect(assistantMsg.content).toBe('previous response');
    expect(chunks).toEqual(['hello', ' world']);
  });

  it('streamChat passes systemPrompt as top-level system param, not in messages', async () => {
    async function* emptyStream() {
      yield { type: 'message_stop' };
    }
    const mockStreamFn = jest.fn().mockReturnValue(emptyStream());
    (Anthropic as jest.Mock).mockImplementationOnce(() => ({
      messages: { stream: mockStreamFn, create: mockAnthropicMessagesCreate },
      models: { list: mockAnthropicModelsListFn },
    }));

    const provider = new AnthropicProvider('sk-ant-test', 'claude-sonnet-4-6');
    await provider.streamChat(
      [{ role: 'user', content: 'hi' }],
      'Be helpful',
      () => {},
      () => {},
      (e: Error) => { throw e; }
    );

    const callArg = mockStreamFn.mock.calls[0][0];
    expect(callArg.system).toBe('Be helpful');
    // No system role in messages
    const systemInMessages = callArg.messages?.find((m: { role: string }) => m.role === 'system');
    expect(systemInMessages).toBeUndefined();
  });

  it('simplify returns content from response.content[0].text', async () => {
    mockAnthropicMessagesCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'simplified text' }],
    });
    (Anthropic as jest.Mock).mockImplementationOnce(() => ({
      messages: { stream: jest.fn(), create: mockAnthropicMessagesCreate },
      models: { list: mockAnthropicModelsListFn },
    }));

    const provider = new AnthropicProvider('sk-ant-test', 'claude-sonnet-4-6');
    const result = await provider.simplify('original text', 'simpler');
    expect(result).toBe('simplified text');
  });

  it('generateCitationNote returns synthesized note', async () => {
    mockAnthropicMessagesCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'These sources confirm the claim.' }],
    });
    (Anthropic as jest.Mock).mockImplementationOnce(() => ({
      messages: { stream: jest.fn(), create: mockAnthropicMessagesCreate },
      models: { list: mockAnthropicModelsListFn },
    }));

    const provider = new AnthropicProvider('sk-ant-test', 'claude-sonnet-4-6');
    const results: SearchResult[] = [
      { title: 'Test', url: 'http://example.com', content: 'content', score: 0.9 },
    ];
    const note = await provider.generateCitationNote(results, 'original query');
    expect(note).toBe('These sources confirm the claim.');
  });
});

// ──────────────────────────────────────────────
// OpenAISearchProvider: still a stub
// ──────────────────────────────────────────────
describe('OpenAISearchProvider stub — throws NotImplementedError', () => {
  const searchProvider = new OpenAISearchProvider();

  it('OpenAISearchProvider.findSources() throws with "not yet implemented"', () => {
    expect(() => searchProvider.findSources('query'))
      .toThrow(/not yet implemented/i);
  });
});

// ──────────────────────────────────────────────
// Config factory functions
// ──────────────────────────────────────────────
describe('Provider factory — config.ts', () => {
  it('getDefaultProvider() returns a GeminiProvider instance', () => {
    const provider = getDefaultProvider();
    expect(provider.constructor.name).toBe('GeminiProvider');
  });

  it('getDefaultSearchProvider() returns a TavilyProvider instance', () => {
    const provider = getDefaultSearchProvider();
    expect(provider.constructor.name).toBe('TavilyProvider');
  });

  it('createByokProvider("gemini", model, apiKey) returns GeminiProvider', () => {
    const provider = createByokProvider('gemini', 'gemini-2.5-pro', 'AIza-test');
    expect(provider.constructor.name).toBe('GeminiProvider');
  });

  it('createByokProvider("openai", model, apiKey) returns OpenAIProvider', () => {
    const provider = createByokProvider('openai', 'gpt-4o', 'sk-test');
    expect(provider.constructor.name).toBe('OpenAIProvider');
  });

  it('createByokProvider("anthropic", model, apiKey) returns AnthropicProvider', () => {
    const provider = createByokProvider('anthropic', 'claude-sonnet-4-6', 'sk-ant-test');
    expect(provider.constructor.name).toBe('AnthropicProvider');
  });

  it('createByokProvider with unknown provider throws', () => {
    expect(() => createByokProvider('unknown' as 'gemini', 'some-model', 'sk-test'))
      .toThrow(/Unknown provider/i);
  });
});
