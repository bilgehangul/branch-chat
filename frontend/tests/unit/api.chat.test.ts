import { describe, it } from 'vitest';

describe('streamChat', () => {
  it.todo('calls onChunk for each data: chunk event');
  it.todo('calls onDone and stops reading when data: [DONE] received');
  it.todo('calls onError when HTTP response is not ok');
  it.todo('handles SSE chunks split across read() boundaries (remainder buffer)');
  it.todo('skips malformed JSON lines without throwing');
});
