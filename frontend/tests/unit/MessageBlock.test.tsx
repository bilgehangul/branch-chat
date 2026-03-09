/**
 * Test stubs for MessageBlock component
 * Requirements: CHAT-06
 *
 * All tests use test.todo() — no implementation exists yet.
 * This file must pass (with pending stubs) before the component is implemented.
 */

import { describe } from 'vitest';

describe('MessageBlock', () => {
  // CHAT-06: Streaming visual state
  test.todo('has user-select-none style when isStreaming is true');
  test.todo('has ~80% opacity when isStreaming is true');
  test.todo('restores full opacity when isStreaming is false');

  // CHAT-06: Role labels
  test.todo('renders role label "You" for user messages');
  test.todo('renders role label "Gemini" for assistant messages');
});
