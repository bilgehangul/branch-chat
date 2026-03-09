/**
 * ACCENT_PALETTE — 8-color cycling palette for child thread accent colors.
 * Each new child thread picks the next color in this cycle (modulo 8).
 *
 * Requirements: BRANCH-05
 */

import type { Thread } from '../types/index';

export const ACCENT_PALETTE = [
  '#C9A0A0', // dusty rose
  '#8FAF8F', // sage green
  '#A89EC9', // soft lavender
  '#C9A87A', // warm amber
  '#7A9EC9', // slate blue
  '#7AB5B5', // muted teal
  '#C9A88F', // peach
  '#B09898', // dusty mauve
] as const;

/**
 * Returns the next accent color for a new child thread of `parentThread`.
 * Cycles through ACCENT_PALETTE based on current number of existing children.
 */
export function getNextAccentColor(parentThread: Thread): string {
  return ACCENT_PALETTE[parentThread.childThreadIds.length % ACCENT_PALETTE.length]!;
}
