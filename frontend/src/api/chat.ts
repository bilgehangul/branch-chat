import type { SseEvent } from '../../../shared/types';

export async function streamChat(
  body: { messages: Array<{ role: string; content: string }>; signal?: AbortSignal; systemInstruction?: string },
  getToken: () => Promise<string | null>,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (message: string) => void
): Promise<void> {
  try {
  const token = await getToken();
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      messages: body.messages,
      ...(body.systemInstruction ? { systemPrompt: body.systemInstruction } : {}),
    }),
    signal: body.signal,
  });

  if (!res.ok || !res.body) {
    onError(`HTTP ${res.status}`);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let remainder = ''; // CRITICAL: maintains incomplete line across read() calls

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    // Prepend remainder from previous iteration before splitting
    const text = remainder + decoder.decode(value, { stream: true });
    const lines = text.split('\n');
    remainder = lines.pop() ?? ''; // last element may be incomplete — hold for next iteration

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      // Check for DONE sentinel BEFORE attempting JSON.parse
      if (raw === '[DONE]') { onDone(); return; }
      try {
        const event = JSON.parse(raw) as SseEvent;
        if (event.type === 'chunk') onChunk(event.text);
        if (event.type === 'error') onError(event.message);
        if (event.type === 'done') { onDone(); return; }
      } catch {
        // skip malformed lines silently
      }
    }
  }
  } catch (err) {
    const isAbort =
      (err instanceof Error && err.name === 'AbortError') ||
      (err instanceof DOMException && (err.name === 'AbortError' || err.code === 20));
    if (isAbort) {
      onDone();
      return;
    }
    throw err;
  }
}
