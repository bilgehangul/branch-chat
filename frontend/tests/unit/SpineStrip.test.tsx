/**
 * Tests for SpineStrip component
 * Requirements: NAV-04, NAV-05
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SpineStrip } from '../../src/components/layout/SpineStrip';
import type { Thread } from '../../src/types/index';

// Mock useSessionStore
vi.mock('../../src/store/sessionStore', () => ({
  useSessionStore: vi.fn(),
}));

import { useSessionStore } from '../../src/store/sessionStore';

const mockSetActiveThread = vi.fn();

function makeThread(overrides: Partial<Thread> & { id: string }): Thread {
  return {
    depth: 0,
    parentThreadId: null,
    anchorText: null,
    parentMessageId: null,
    title: overrides.title ?? overrides.id,
    accentColor: '#2D7DD2',
    messageIds: [],
    childThreadIds: [],
    scrollPosition: 0,
    ...overrides,
  };
}

function setupStore(threads: Record<string, Thread>, activeThreadId: string | null) {
  (useSessionStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: (s: object) => unknown) => {
    return selector({
      threads,
      activeThreadId,
      setActiveThread: mockSetActiveThread,
    });
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SpineStrip', () => {
  // NAV-04: Does not render at depth 0
  it('does not render when thread.depth === 0', () => {
    const root = makeThread({ id: 'root', depth: 0 });
    setupStore({ root }, 'root');

    const { container } = render(<SpineStrip />);
    expect(container.firstChild).toBeNull();
  });

  // NAV-04: Renders at depth >= 1
  it('renders the strip when thread.depth >= 1', () => {
    const parent = makeThread({ id: 'parent', depth: 0, title: 'Parent Thread', accentColor: '#FF5733' });
    const child = makeThread({ id: 'child', depth: 1, parentThreadId: 'parent', title: 'Child Thread' });
    const threads = { parent, child };
    setupStore(threads, 'child');

    const { container } = render(<SpineStrip />);
    expect(container.firstChild).not.toBeNull();
  });

  // NAV-05: Displays parent thread title
  it('displays parent thread title as vertical text', () => {
    const parent = makeThread({ id: 'parent', depth: 0, title: 'Parent Thread', accentColor: '#FF5733' });
    const child = makeThread({ id: 'child', depth: 1, parentThreadId: 'parent', title: 'Child Thread' });
    const threads = { parent, child };
    setupStore(threads, 'child');

    render(<SpineStrip />);
    expect(screen.getByText('Parent Thread')).toBeInTheDocument();
  });

  // NAV-05: Border color matches parent accentColor
  it('applies parent thread accentColor as left border color', () => {
    const parent = makeThread({ id: 'parent', depth: 0, title: 'Parent Thread', accentColor: '#FF5733' });
    const child = makeThread({ id: 'child', depth: 1, parentThreadId: 'parent', title: 'Child Thread' });
    const threads = { parent, child };
    setupStore(threads, 'child');

    const { container } = render(<SpineStrip />);
    const strip = container.firstChild as HTMLElement;
    // jsdom normalizes hex to rgb, so check for either format
    const borderLeft = strip.style.borderLeft;
    const hasBorderColor =
      borderLeft.includes('#FF5733') ||
      borderLeft.includes('rgb(255, 87, 51)') ||
      borderLeft.includes('255, 87, 51');
    expect(hasBorderColor).toBe(true);
  });

  // NAV-05: Click calls setActiveThread with parentThreadId
  it('clicking the strip calls setActiveThread with parentThreadId', () => {
    const parent = makeThread({ id: 'parent', depth: 0, title: 'Parent Thread', accentColor: '#FF5733' });
    const child = makeThread({ id: 'child', depth: 1, parentThreadId: 'parent', title: 'Child Thread' });
    const threads = { parent, child };
    setupStore(threads, 'child');

    const { container } = render(<SpineStrip />);
    const strip = container.firstChild as HTMLElement;
    fireEvent.click(strip);

    expect(mockSetActiveThread).toHaveBeenCalledWith('parent');
  });
});
