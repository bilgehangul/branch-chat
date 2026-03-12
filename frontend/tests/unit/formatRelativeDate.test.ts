import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatRelativeDate } from '../../src/utils/formatRelativeDate';

describe('formatRelativeDate', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  function freeze(iso: string) {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(iso));
  }

  const NOW = '2026-03-12T12:00:00Z';

  it('returns "just now" for 0 minutes ago', () => {
    freeze(NOW);
    expect(formatRelativeDate(new Date(NOW))).toBe('just now');
  });

  it('returns "Xm ago" for dates less than 1 hour ago', () => {
    freeze(NOW);
    const thirtyMinAgo = new Date('2026-03-12T11:30:00Z');
    expect(formatRelativeDate(thirtyMinAgo)).toBe('30m ago');
  });

  it('returns "1m ago" for 1 minute ago', () => {
    freeze(NOW);
    const oneMinAgo = new Date('2026-03-12T11:59:00Z');
    expect(formatRelativeDate(oneMinAgo)).toBe('1m ago');
  });

  it('returns "Xh ago" for dates less than 24 hours ago', () => {
    freeze(NOW);
    const threeHoursAgo = new Date('2026-03-12T09:00:00Z');
    expect(formatRelativeDate(threeHoursAgo)).toBe('3h ago');
  });

  it('returns "1h ago" at exactly 60 minutes', () => {
    freeze(NOW);
    const oneHourAgo = new Date('2026-03-12T11:00:00Z');
    expect(formatRelativeDate(oneHourAgo)).toBe('1h ago');
  });

  it('returns "Yesterday" for dates less than 48 hours ago but >= 24h', () => {
    freeze(NOW);
    const yesterday = new Date('2026-03-11T10:00:00Z');
    expect(formatRelativeDate(yesterday)).toBe('Yesterday');
  });

  it('returns short day name for dates less than 7 days ago but >= 48h', () => {
    freeze(NOW);
    // 3 days ago = March 9 = Monday
    const threeDaysAgo = new Date('2026-03-09T12:00:00Z');
    expect(formatRelativeDate(threeDaysAgo)).toBe('Mon');
  });

  it('returns "Mon" for 6 days ago', () => {
    freeze('2026-03-15T12:00:00Z'); // Sunday March 15
    const sixDaysAgo = new Date('2026-03-09T12:00:00Z'); // Monday March 9
    expect(formatRelativeDate(sixDaysAgo)).toBe('Mon');
  });

  it('returns "Mar 5" for same-year dates older than 7 days', () => {
    freeze(NOW);
    const twoWeeksAgo = new Date('2026-03-05T12:00:00Z');
    expect(formatRelativeDate(twoWeeksAgo)).toBe('Mar 5');
  });

  it('returns "Jan 15" for same-year dates in January', () => {
    freeze(NOW);
    const jan15 = new Date('2026-01-15T12:00:00Z');
    expect(formatRelativeDate(jan15)).toBe('Jan 15');
  });

  it('returns "Dec 15, 2025" for dates in a different year', () => {
    freeze(NOW);
    const lastYear = new Date('2025-12-15T12:00:00Z');
    expect(formatRelativeDate(lastYear)).toBe('Dec 15, 2025');
  });

  it('accepts string dates', () => {
    freeze(NOW);
    expect(formatRelativeDate('2026-03-12T11:30:00Z')).toBe('30m ago');
  });

  it('accepts ISO string dates from different year', () => {
    freeze(NOW);
    expect(formatRelativeDate('2025-06-01T00:00:00Z')).toBe('Jun 1, 2025');
  });
});
