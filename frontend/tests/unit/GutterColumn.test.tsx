import { describe, it } from 'vitest';

describe('GutterColumn', () => {
  // BRANCH-08: conditional rendering
  it.todo('renders nothing when thread has no childThreadIds');
  it.todo('renders the gutter column when thread has at least one childThreadId');

  // BRANCH-09: lead pill content
  it.todo('renders directional arrow (→) in each lead pill');
  it.todo('truncates thread title to 32 characters in lead pill');
  it.todo('displays live message count from thread.messageIds.length');
  it.todo('renders accent color pip using thread accentColor');

  // BRANCH-10: hover preview
  it.todo('shows preview card on pill hover with anchor text');
  it.todo('preview card shows first user message content');
  it.todo('preview card shows first line of first AI response');

  // BRANCH-11: navigation
  it.todo('clicking a lead pill calls setActiveThread with the correct threadId');
});
