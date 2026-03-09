---
status: complete
phase: 04-branching
source: 04-01-SUMMARY.md, 04-02-SUMMARY.md, 04-03-SUMMARY.md, 04-04-SUMMARY.md, 04-05-SUMMARY.md, 04-06-SUMMARY.md, 04-07-SUMMARY.md
started: 2026-03-09T17:35:00Z
updated: 2026-03-09T17:55:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Text Selection Bubble
expected: Get an AI response. Click and drag to select text in the AI message. A floating bubble appears above the selection with "Go Deeper" (blue), "Find Sources" (disabled), "Simplify" (disabled). The selected text stays highlighted while the bubble is visible.
result: pass

### 2. Go Deeper — Context Card Shown Immediately
expected: With the bubble showing, click "Go Deeper". You are taken into a new child thread. At the very top of the empty chat (before you type anything), the selected text quote card is visible — it shows "You selected:" with the exact text you highlighted, styled in the thread's accent color.
result: pass

### 3. Anchor Underline in Parent Thread
expected: After diving deeper into a child thread, navigate back to the parent (click the ancestor panel on the left). The paragraph where you made the selection has a colored underline matching the child thread's accent color, showing exactly where the branch was created.
result: pass

### 4. Branch Pills — Inline and Scroll-Aligned
expected: From the parent thread (which now has a child), the branch pill appears to the RIGHT of the text content, horizontally aligned with the anchor paragraph. When you scroll the thread, the pill scrolls with the text and stays aligned — it does not stay fixed in place.
result: pass

### 5. Branch Pill Hover Preview
expected: Hover your mouse over a branch pill. A preview card appears below it showing: the anchor text (text you selected), your first message in the child thread, and the first line of the AI's response in that child thread.
result: pass

### 6. Branch Pill Navigation
expected: Click a branch pill. You are navigated into that child thread. The ancestor panel for the parent appears on the left side of the screen.
result: pass

### 7. Ancestor Panel — Highlighted Anchor + Branch Button
expected: While inside a child thread, the parent thread is visible as a narrow panel on the left. The specific message where you made the selection is highlighted (accent-colored left border). Inside that highlighted message, a small "↗ branch" button is visible — clicking it navigates you into the child thread.
result: pass

### 8. Right-Click Context Menu — Delete Thread
expected: Right-click on a branch pill (or on an ancestor panel). A context menu appears with three options: "Delete thread", "Summarize", "Compact". Click "Delete thread" — the thread and all its descendants are removed and you are navigated back to the parent.
result: pass

## Summary

total: 8
passed: 8
issues: 0
pending: 0
skipped: 0

## Gaps

[none yet]
