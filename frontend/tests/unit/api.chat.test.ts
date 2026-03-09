import { describe, it, expect, vi, beforeEach } from 'vitest';
import { streamChat } from '../../src/api/chat';

// Helper: build a mock ReadableStream from an array of string chunks
function makeStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let index = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(encoder.encode(chunks[index++]));
      } else {
        controller.close();
      }
    },
  });
}

const noopGetToken = async () => null;

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('streamChat', () => {
  it('calls onChunk for each data: chunk event', async () => {
    const body = makeStream([
      'data: {"type":"chunk","text":"hello"}\n\ndata: {"type":"chunk","text":" world"}\n\n',
    ]);
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(body, { status: 200 }),
    );

    const onChunk = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();

    await streamChat({ messages: [] }, noopGetToken, onChunk, onDone, onError);

    expect(onChunk).toHaveBeenCalledTimes(2);
    expect(onChunk).toHaveBeenNthCalledWith(1, 'hello');
    expect(onChunk).toHaveBeenNthCalledWith(2, ' world');
    expect(onError).not.toHaveBeenCalled();
  });

  it('calls onDone and stops reading when data: [DONE] received', async () => {
    const body = makeStream([
      'data: {"type":"chunk","text":"token"}\n\ndata: [DONE]\n\n',
    ]);
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(body, { status: 200 }),
    );

    const onChunk = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();

    await streamChat({ messages: [] }, noopGetToken, onChunk, onDone, onError);

    expect(onChunk).toHaveBeenCalledTimes(1);
    expect(onChunk).toHaveBeenCalledWith('token');
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  it('calls onError when HTTP response is not ok', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(null, { status: 503 }),
    );

    const onChunk = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();

    await streamChat({ messages: [] }, noopGetToken, onChunk, onDone, onError);

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toContain('503');
    expect(onChunk).not.toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('handles SSE chunks split across read() boundaries (remainder buffer)', async () => {
    // First chunk: incomplete JSON line
    // Second chunk: completes the JSON line
    const body = makeStream([
      'data: {"type":"chunk","tex',
      't":"partial"}\n\n',
    ]);
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(body, { status: 200 }),
    );

    const onChunk = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();

    await streamChat({ messages: [] }, noopGetToken, onChunk, onDone, onError);

    expect(onChunk).toHaveBeenCalledTimes(1);
    expect(onChunk).toHaveBeenCalledWith('partial');
    expect(onError).not.toHaveBeenCalled();
  });

  it('skips malformed JSON lines without throwing', async () => {
    const body = makeStream([
      'data: NOT_VALID_JSON\n\ndata: {"type":"chunk","text":"ok"}\n\n',
    ]);
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(body, { status: 200 }),
    );

    const onChunk = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();

    await streamChat({ messages: [] }, noopGetToken, onChunk, onDone, onError);

    expect(onChunk).toHaveBeenCalledTimes(1);
    expect(onChunk).toHaveBeenCalledWith('ok');
    expect(onError).not.toHaveBeenCalled();
  });

  it('treats AbortError as clean stop — calls onDone, not onError', async () => {
    const abortController = new AbortController();

    vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async () => {
      abortController.abort();
      const err = new DOMException('The user aborted a request.', 'AbortError');
      throw err;
    });

    const onChunk = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();

    await streamChat(
      { messages: [], signal: abortController.signal },
      noopGetToken,
      onChunk,
      onDone,
      onError,
    );

    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  it('passes AbortSignal to fetch options', async () => {
    const abortController = new AbortController();
    const body = makeStream(['data: {"type":"chunk","text":"hi"}\n\n']);

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(body, { status: 200 }),
    );

    await streamChat(
      { messages: [], signal: abortController.signal },
      noopGetToken,
      vi.fn(),
      vi.fn(),
      vi.fn(),
    );

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const fetchInit = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(fetchInit.signal).toBe(abortController.signal);
  });

  it('includes systemPrompt in fetch body when systemInstruction is provided', async () => {
    const body = makeStream(['data: {"type":"done"}\n\n']);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(body, { status: 200 }),
    );

    await streamChat(
      { messages: [], systemInstruction: 'You are focused on topic X.' },
      noopGetToken,
      vi.fn(),
      vi.fn(),
      vi.fn(),
    );

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const fetchInit = fetchSpy.mock.calls[0][1] as RequestInit;
    const parsedBody = JSON.parse(fetchInit.body as string) as Record<string, unknown>;
    expect(parsedBody.systemPrompt).toBe('You are focused on topic X.');
  });

  it('omits systemPrompt from fetch body when systemInstruction is absent', async () => {
    const body = makeStream(['data: {"type":"done"}\n\n']);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(body, { status: 200 }),
    );

    await streamChat(
      { messages: [] },
      noopGetToken,
      vi.fn(),
      vi.fn(),
      vi.fn(),
    );

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const fetchInit = fetchSpy.mock.calls[0][1] as RequestInit;
    const parsedBody = JSON.parse(fetchInit.body as string) as Record<string, unknown>;
    expect(parsedBody).not.toHaveProperty('systemPrompt');
  });

  it('omits systemPrompt from fetch body when systemInstruction is empty string', async () => {
    const body = makeStream(['data: {"type":"done"}\n\n']);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(body, { status: 200 }),
    );

    await streamChat(
      { messages: [], systemInstruction: '' },
      noopGetToken,
      vi.fn(),
      vi.fn(),
      vi.fn(),
    );

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const fetchInit = fetchSpy.mock.calls[0][1] as RequestInit;
    const parsedBody = JSON.parse(fetchInit.body as string) as Record<string, unknown>;
    expect(parsedBody).not.toHaveProperty('systemPrompt');
  });
});
