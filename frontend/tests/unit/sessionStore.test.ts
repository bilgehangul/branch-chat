import { describe, it } from 'vitest';

describe('sessionStore actions', () => {
  it.todo('clearSession resets all fields to initial state');
  it.todo('createSession sets session and creates root thread');
  it.todo('addMessage adds message to messages Record at store root (not nested in thread)');
  it.todo('updateMessage patches a single message without affecting others');
  it.todo('setMessageStreaming flips isStreaming on one message only');
  it.todo('createThread adds to threads Record and updates parent childThreadIds');
  it.todo('setActiveThread updates activeThreadId');
  it.todo('addChildLead adds ChildLead to correct message');
  it.todo('setScrollPosition updates scrollPosition on correct thread');
});
