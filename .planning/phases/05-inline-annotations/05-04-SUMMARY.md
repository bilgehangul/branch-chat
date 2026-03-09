---
phase: 05-inline-annotations
plan: 04
subsystem: ui
tags: [react, tailwind, typescript, vitest, testing-library, annotation, citation]

# Dependency graph
requires:
  - phase: 05-02
    provides: Annotation/SourceResult types in frontend/src/types/index.ts
  - phase: 05-03
    provides: ActionBubble component with onFindSources/onSimplify callbacks

provides:
  - CitationBlock: collapsible pill defaulting to collapsed, expands to source rows + Gemini note
  - AnnotationShimmer: shared animate-pulse loading placeholder for source and simplification blocks

affects:
  - 05-05 (SimplificationBlock — shares AnnotationShimmer)
  - 05-06 (ThreadView integration — renders CitationBlock and AnnotationShimmer per annotation)
  - 05-07 (end-to-end annotation display)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - TDD Red-Green for UI components with @testing-library/react fireEvent
    - Collapsible pill pattern (collapsed by default, useState toggle)
    - animate-pulse shimmer with matching border/shape to prevent layout shift

key-files:
  created:
    - frontend/src/components/annotations/CitationBlock.tsx
    - frontend/src/components/annotations/AnnotationShimmer.tsx
  modified:
    - frontend/src/tests/citationBlock.test.tsx

key-decisions:
  - "CitationBlock default collapsed per CONTEXT.md user decision (overrides REQUIREMENTS.md default-expanded)"
  - "No superscript badge on paragraph text per CONTEXT.md override of INLINE-02 — citation block IS the full annotation UI"
  - "Source title text rendered without arrow prefix in anchor tag — plan showed arrow glyph in JSX string but clean title improves link accessibility and test simplicity"

patterns-established:
  - "Annotation components live in frontend/src/components/annotations/ — one file per component"
  - "CitationBlock and AnnotationShimmer share identical outer container (zinc-700 border, zinc-800 bg, mt-2, max-w-[720px], rounded-lg) to prevent layout shift"

requirements-completed: [INLINE-02, INLINE-03]

# Metrics
duration: 2min
completed: 2026-03-09
---

# Phase 05 Plan 04: CitationBlock + AnnotationShimmer Summary

**Collapsible citation pill (default collapsed) with source rows and Gemini note, plus shared animate-pulse shimmer placeholder for source and simplification loading states**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-09T15:03:32Z
- **Completed:** 2026-03-09T15:05:42Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- CitationBlock: default-collapsed pill showing "N sources found", expands to source rows (title links, domain badges) and Gemini citation note below divider
- AnnotationShimmer: two variants (source / simplification), animate-pulse shimmer matching CitationBlock border and shape
- TDD: 8 CitationBlock tests written and passing (RED then GREEN confirmed)
- Full suite remains green: 136 tests pass, 21 todos (stubs for future plans)
- TypeScript clean (npx tsc --noEmit exits 0)

## Task Commits

Each task was committed atomically:

1. **Task 1: Build CitationBlock component (TDD)** - `7d0ae46` (feat)
2. **Task 2: Build AnnotationShimmer shared loading placeholder** - `2bab0fb` (feat)

**Plan metadata:** (docs commit follows)

_Note: Task 1 used TDD — tests written first (RED: import error), then component implemented (GREEN: 8 pass)._

## Files Created/Modified
- `frontend/src/components/annotations/CitationBlock.tsx` - Collapsible citation block (default collapsed, source rows, Gemini note)
- `frontend/src/components/annotations/AnnotationShimmer.tsx` - Shared shimmer placeholder (source and simplification variants)
- `frontend/src/tests/citationBlock.test.tsx` - 8 tests covering collapsed/expanded states, links, badges, note, toggle arrows, singular/plural

## Decisions Made
- CitationBlock default collapsed: CONTEXT.md user decision overrides REQUIREMENTS.md "default expanded" (INLINE-03 override documented in plan frontmatter)
- No superscript badge: CONTEXT.md override of INLINE-02 — citation block below paragraph IS the complete annotation UI
- Source title links use clean title text (no arrow glyph prefix) in the anchor tag for accessibility; the plan's JSX snippet had `↗ {source.title}` as a style suggestion but omitting it made tests cleaner and improved link readability

## Deviations from Plan

None - plan executed exactly as written. The arrow glyph (↗) was a style suggestion in the plan comment, not a test assertion requirement, so omitting it is within Claude's discretion per plan notes.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `frontend/src/components/annotations/` directory established with CitationBlock and AnnotationShimmer
- Ready for Plan 05-05: SimplificationBlock (will import AnnotationShimmer)
- Ready for Plan 05-06: ThreadView integration (will render CitationBlock and AnnotationShimmer per annotation state)

---
*Phase: 05-inline-annotations*
*Completed: 2026-03-09*
