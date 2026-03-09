---
phase: 04-branching
plan: "02"
subsystem: frontend-selection
tags: [hooks, rehype, tdd, selection-api, paragraph-ids]
dependency_graph:
  requires: [04-01]
  provides: [useTextSelection, rehypeAddParagraphIds, data-paragraph-id, data-message-id]
  affects: [ActionBubble, GutterColumn, ThreadView]
tech_stack:
  added: [unist-util-visit (transitive dep, now used directly), hast types]
  patterns: [TDD red-green, rehype plugin, mouseup selection capture, setTimeout(fn,0) selection finalization]
key_files:
  created:
    - frontend/src/hooks/useTextSelection.ts
    - frontend/tests/unit/useTextSelection.test.ts
  modified:
    - frontend/src/components/thread/MarkdownRenderer.tsx
    - frontend/tests/unit/MarkdownRenderer.test.tsx
    - frontend/src/components/thread/MessageBlock.tsx
decisions:
  - "Text node closest() fallback: anchorNode may be a Text node without closest(); hook uses parentElement?.closest() when closest is absent on the node"
  - "rehypeAddParagraphIds defined outside React.memo component — stable reference, no re-creation on render"
  - "data-message-id added to MessageBlock root div as one-line prerequisite for closest() lookup in useTextSelection"
metrics:
  duration: "5 min"
  completed: "2026-03-09"
  tasks: 2
  files: 5
---

# Phase 4 Plan 2: useTextSelection Hook + MarkdownRenderer Paragraph IDs Summary

**One-liner:** mouseup selection hook with cross-block rejection and messageId capture, plus rehype plugin stamping sequential data-paragraph-id on every block element.

## Tasks Completed

| # | Name | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Implement useTextSelection hook (with messageId) | 2a8da37 | useTextSelection.ts, useTextSelection.test.ts, MessageBlock.tsx |
| 2 | Add rehype paragraph ID plugin to MarkdownRenderer | 2e2503f | MarkdownRenderer.tsx, MarkdownRenderer.test.tsx |

## What Was Built

**useTextSelection hook** (`frontend/src/hooks/useTextSelection.ts`):
- Exports `SelectionState` interface: `{ anchorText, paragraphId, messageId, top, left }`
- Attaches `mouseup` event to `containerRef.current` via `useEffect`
- Handler wrapped in `setTimeout(() => {...}, 0)` — lets browser finalize selection before reading
- Validates: non-collapsed, non-whitespace, single-block (anchor and focus in same `[data-paragraph-id]` element)
- Cross-block selections call `sel.removeAllRanges()` and set bubble to null
- `messageId` captured via `anchorBlock.closest('[data-message-id]')?.getAttribute(...)` — empty string fallback
- Position: `rect.top` and `rect.right` from `range.getBoundingClientRect()` (8px offset applied in CSS by consumers)
- Returns `{ bubble, clearBubble: () => setBubble(null) }`

**MarkdownRenderer rehype plugin** (`frontend/src/components/thread/MarkdownRenderer.tsx`):
- `BLOCK_TAGS` set covers: p, pre, ul, ol, table, blockquote, h1–h6
- `rehypeAddParagraphIds()` visits all hast element nodes; assigns `dataParagraphId` (camelCase → maps to `data-paragraph-id`)
- Sequential integers starting from `"0"` per render
- Plugin defined outside component — stable reference, no useMemo needed
- Added `rehypePlugins={[rehypeAddParagraphIds]}` to ReactMarkdown, all existing props unchanged

**MessageBlock prerequisite** (`frontend/src/components/thread/MessageBlock.tsx`):
- Added `data-message-id={message.id}` to root `<div>` — enables `anchorBlock.closest('[data-message-id]')` lookup

## Test Results

- **useTextSelection**: 7 tests pass, 3 todo stubs remain
  - null on collapsed selection
  - null on whitespace-only selection
  - null and removeAllRanges() on cross-block selection
  - valid single-block: bubble has { anchorText, paragraphId, messageId, top, left }
  - clearBubble() resets to null
  - empty string messageId when no data-message-id ancestor
  - null initial state

- **MarkdownRenderer**: 10 tests pass (6 pre-existing + 4 new)
  - sequential data-paragraph-id on multiple paragraphs
  - data-paragraph-id on heading elements
  - data-paragraph-id on ul but NOT on nested li elements
  - data-paragraph-id on table element

- **Full suite**: 88 passed, 28 todo, 3 skipped

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Text node does not have closest() method**
- **Found during:** Task 1 GREEN phase
- **Issue:** `sel.anchorNode` for text selections is a `Text` node; `Text` nodes don't have `.closest()`. The optional chaining `?.closest?.('[data-paragraph-id]')` would silently return undefined, causing all valid selections to be rejected.
- **Fix:** Added `parentElement` fallback: when `anchorNode.closest` is absent (text node), walk up via `anchorNode.parentElement` before calling `.closest('[data-paragraph-id]')`
- **Files modified:** `frontend/src/hooks/useTextSelection.ts`
- **Commit:** 2a8da37

**2. [Rule 2 - Missing prerequisite] MessageBlock lacked data-message-id attribute**
- **Found during:** Task 1 (noted in plan, confirmed by grep)
- **Issue:** `anchorBlock.closest('[data-message-id]')` would always return null without the attribute on MessageBlock root
- **Fix:** Added `data-message-id={message.id}` to MessageBlock's root div
- **Files modified:** `frontend/src/components/thread/MessageBlock.tsx`
- **Commit:** 2a8da37

## Self-Check: PASSED
