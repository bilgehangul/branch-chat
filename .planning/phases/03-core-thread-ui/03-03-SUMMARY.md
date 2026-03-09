---
phase: 03-core-thread-ui
plan: "03"
subsystem: ui
tags: [react, markdown, react-markdown, remark-gfm, react-syntax-highlighter, prism, tailwind, streaming]

# Dependency graph
requires:
  - phase: 03-01
    provides: TypeScript types (Message, Thread), Zustand store, selectors
  - phase: 02-01
    provides: AppShell component, dark theme tokens (zinc-900/800/100)

provides:
  - MarkdownRenderer component (GFM Markdown with Prism syntax highlighting, oneDark theme)
  - StreamingCursor component (typing dots pre-token, blinking underscore during stream)
  - MessageBlock component (role label, user/AI layout, streaming opacity+select-none)
  - ContextCard component (anchor text card for child thread headers, depth-gated)

affects:
  - 03-04 (ThreadView will compose all 4 components)
  - 04-branching (ContextCard rendered in child threads)

# Tech tracking
tech-stack:
  added:
    - react-markdown@^10.x (GFM Markdown rendering)
    - remark-gfm@^4.x (GFM tables, strikethrough, task lists)
    - react-syntax-highlighter@^15.x Prism light build (syntax highlighting with oneDark)
    - "@types/react-syntax-highlighter@^15.x"
  patterns:
    - Prism light build + registerLanguage to keep bundle lean (6 languages: tsx, ts, js, python, bash, json)
    - React.memo on MarkdownRenderer to prevent unnecessary re-renders during streaming
    - Streaming state drives CSS classes (opacity-80, select-none, pointer-events-none) on message container

key-files:
  created:
    - frontend/src/components/thread/MarkdownRenderer.tsx
    - frontend/src/components/thread/StreamingCursor.tsx
    - frontend/src/components/thread/MessageBlock.tsx
    - frontend/src/components/thread/ContextCard.tsx
  modified:
    - frontend/package.json (added 4 markdown/highlighting packages)
    - frontend/tests/unit/MarkdownRenderer.test.tsx (stub -> real tests)
    - frontend/tests/unit/MessageBlock.test.tsx (stub -> real tests)
    - frontend/tests/unit/ContextCard.test.tsx (stub -> real tests)

key-decisions:
  - "react-markdown v10 does not accept className prop on ReactMarkdown element — wrap in a div with prose classes instead"
  - "SyntaxHighlighter from prism-light exports default (not named Prism) — use default import"
  - "StreamingCursor injects keyframe CSS via inline style tag — avoids global CSS conflicts with Tailwind v4"
  - "MessageBlock streaming state applies opacity-80 + select-none + pointer-events-none as Tailwind classes (queryable in tests)"

patterns-established:
  - "Pattern: Prism light build — import SyntaxHighlighter from react-syntax-highlighter/dist/esm/prism-light (default import, not named)"
  - "Pattern: react-markdown v10 wrapper — wrap ReactMarkdown in a div; do not use className prop on ReactMarkdown itself"
  - "Pattern: Streaming visual state — Tailwind class strings (not inline styles) so tests can query class names"

requirements-completed: [CHAT-02, CHAT-05, CHAT-06]

# Metrics
duration: 8min
completed: 2026-03-09
---

# Phase 03 Plan 03: Message Rendering Components Summary

**Purely presentational rendering layer: GFM Markdown with Prism oneDark syntax highlighting, typing-dots + blinking-cursor streaming feedback, and accent-colored ContextCard for child thread headers**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-09T10:24:07Z
- **Completed:** 2026-03-09T10:27:30Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- MarkdownRenderer renders full GFM Markdown (headings, bold, lists, tables, fenced code blocks) using react-markdown v10 + remark-gfm v4 with Prism light build for syntax highlighting
- StreamingCursor shows animated typing dots (3 staggered bouncing dots) before first token, and a blinking underscore during active streaming
- MessageBlock applies opacity-80 + select-none + pointer-events-none when isStreaming, with "You"/"Gemini" role labels and correct user/AI background styling
- ContextCard renders the accent-bordered anchor text card at thread depth >= 1 with non-null anchorText; returns null otherwise
- Full unit suite: 57 tests pass (14 todos for future plans, 3 skipped ThreadView stubs), TypeScript clean

## Task Commits

1. **Task 1: MarkdownRenderer + StreamingCursor** - `7a4e65b` (feat)
2. **Task 2: MessageBlock + ContextCard** - `1b005b1` (feat)

## Files Created/Modified

- `frontend/src/components/thread/MarkdownRenderer.tsx` - GFM Markdown renderer with Prism light build, wrapped in React.memo
- `frontend/src/components/thread/StreamingCursor.tsx` - Typing dots (pre-token) and blinking underscore (streaming) via CSS keyframes
- `frontend/src/components/thread/MessageBlock.tsx` - Single message with role label, content, streaming visual state
- `frontend/src/components/thread/ContextCard.tsx` - Child thread anchor text card with dynamic accent border color
- `frontend/package.json` - Added react-markdown, remark-gfm, react-syntax-highlighter, @types/react-syntax-highlighter
- `frontend/tests/unit/MarkdownRenderer.test.tsx` - 6 real tests (was stub)
- `frontend/tests/unit/MessageBlock.test.tsx` - 8 real tests (was stub)
- `frontend/tests/unit/ContextCard.test.tsx` - 5 real tests (was stub)

## Decisions Made

- react-markdown v10 no longer accepts a `className` prop directly on `ReactMarkdown` — fixed by wrapping in a `<div className="prose ...">` instead. This is a v10 breaking change documented in their changelog.
- `react-syntax-highlighter/dist/esm/prism-light` exports a default export (not a named `Prism` export) — must use `import SyntaxHighlighter from '...'` not `import { Prism as SyntaxHighlighter } from '...'`.
- StreamingCursor uses an inline `<style>` tag for keyframe animations to avoid global CSS pollution with Tailwind v4.
- MessageBlock streaming classes are Tailwind utility strings (not inline CSS) to make them queryable by class name in tests.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] react-markdown v10 rejects className prop on ReactMarkdown**
- **Found during:** Task 1 (MarkdownRenderer implementation)
- **Issue:** The plan specified `className="prose prose-invert ..."` directly on `<ReactMarkdown>`. react-markdown v10 throws `ERR_ASSERTION: Unexpected className prop` for this usage.
- **Fix:** Wrapped `<ReactMarkdown>` in `<div className="prose prose-invert prose-zinc max-w-none text-zinc-100">` instead.
- **Files modified:** frontend/src/components/thread/MarkdownRenderer.tsx
- **Verification:** All 6 MarkdownRenderer tests pass after fix.
- **Committed in:** 7a4e65b (Task 1 commit)

**2. [Rule 1 - Bug] prism-light uses default export, not named Prism export**
- **Found during:** Task 1 (MarkdownRenderer implementation)
- **Issue:** The plan and RESEARCH.md specified `import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter/dist/esm/prism-light'`. At runtime, `SyntaxHighlighter` was `undefined` because prism-light only has a default export.
- **Fix:** Changed to `import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/prism-light'`.
- **Files modified:** frontend/src/components/thread/MarkdownRenderer.tsx
- **Verification:** `registerLanguage` calls succeed; syntax highlighting renders in tests.
- **Committed in:** 7a4e65b (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 bugs — react-markdown v10 API changes)
**Impact on plan:** Both fixes were in the same task and file, resolved before the test suite ran. No scope changes.

## Issues Encountered

None beyond the two auto-fixed deviations above.

## Next Phase Readiness

- All 4 presentational components are complete and export correctly
- TypeScript compiles clean, no peer dep issues
- Ready for Plan 03-04 (ThreadView) which will compose MarkdownRenderer, StreamingCursor, MessageBlock, and ContextCard
- No blockers

---
*Phase: 03-core-thread-ui*
*Completed: 2026-03-09*
