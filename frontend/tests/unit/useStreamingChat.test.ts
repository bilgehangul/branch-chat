/**
 * Test stubs for useStreamingChat hook
 * Requirements: CHAT-01, CHAT-03, CHAT-04
 *
 * All tests use test.todo() — no implementation exists yet.
 * This file must pass (with pending stubs) before the hook is implemented.
 */

import { describe } from 'vitest';

describe('useStreamingChat', () => {
  // CHAT-01: Message accumulation
  test.todo('sendMessage adds user message and empty AI placeholder to store');
  test.todo('AI message content accumulates chunks from onChunk calls');

  // CHAT-03: Context passing
  test.todo('sendMessage passes full thread message history to streamChat');

  // CHAT-04: Child thread support
  test.todo('hook works identically for child threads (multi-turn supported)');

  // Abort behavior
  test.todo('abort() sets isStreaming=false on the AI message');
});
