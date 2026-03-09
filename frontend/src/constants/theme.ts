/**
 * ACCENT_PALETTE — 8-color cycling palette for child thread accent colors.
 * Each new child thread picks the next color in this cycle (modulo 8).
 *
 * Requirements: BRANCH-05
 */

import type { Thread } from '../types/index';

// Dark mode: slightly brighter for pop on dark backgrounds (original values)
export const ACCENT_PALETTE_DARK = [
  '#C9A0A0', // dusty rose
  '#8FAF8F', // sage green
  '#A89EC9', // soft lavender
  '#C9A87A', // warm amber
  '#7A9EC9', // slate blue
  '#7AB5B5', // muted teal
  '#C9A88F', // peach
  '#B09898', // dusty mauve
] as const;

// Light mode: same hues, more muted/darker to prevent aggression on warm white
export const ACCENT_PALETTE_LIGHT = [
  '#A06060', // dusty rose — deeper
  '#507050', // sage green — deeper
  '#6B609A', // soft lavender — deeper
  '#8B6A30', // warm amber — deeper
  '#3A6090', // slate blue — deeper
  '#3A7070', // muted teal — deeper
  '#8B6A50', // peach — deeper
  '#705555', // dusty mauve — deeper
] as const;

// Keep ACCENT_PALETTE as the dark variant for backward compat (all existing code uses this)
export const ACCENT_PALETTE = ACCENT_PALETTE_DARK;

/**
 * Returns the next accent color for a new child thread of `parentThread`.
 * Cycles through the appropriate palette based on `isDark` (defaults to dark).
 */
export function getNextAccentColor(parentThread: Thread, isDark = true): string {
  const palette = isDark ? ACCENT_PALETTE_DARK : ACCENT_PALETTE_LIGHT;
  return palette[parentThread.childThreadIds.length % palette.length]!;
}
