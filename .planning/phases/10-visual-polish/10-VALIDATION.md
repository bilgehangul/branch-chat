---
phase: 10
slug: visual-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 + @testing-library/react 16.3.2 |
| **Config file** | `frontend/vitest.config.ts` |
| **Quick run command** | `cd frontend && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd frontend && npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd frontend && npx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd frontend && npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | SIDE-01 | manual | Visual CSS check | N/A | ⬜ pending |
| 10-01-02 | 01 | 1 | SIDE-02 | manual | Visual CSS check | N/A | ⬜ pending |
| 10-01-03 | 01 | 1 | SIDE-03 | manual | Visual CSS check | N/A | ⬜ pending |
| 10-01-04 | 01 | 1 | SIDE-04 | manual | Visual CSS check | N/A | ⬜ pending |
| 10-01-05 | 01 | 1 | SIDE-05 | unit | `cd frontend && npx vitest run tests/unit/SessionHistory.test.tsx -x` | ❌ W0 | ⬜ pending |
| 10-01-06 | 01 | 1 | SIDE-06 | unit | `cd frontend && npx vitest run tests/unit/formatRelativeDate.test.ts -x` | ❌ W0 | ⬜ pending |
| 10-02-01 | 02 | 1 | SIDE-07 | manual | Visual CSS check | N/A | ⬜ pending |
| 10-02-02 | 02 | 1 | SIDE-08 | unit | `cd frontend && npx vitest run tests/unit/SessionHistory.test.tsx -x` | ❌ W0 | ⬜ pending |
| 10-02-03 | 02 | 1 | SIDE-09 | unit | `cd frontend && npx vitest run tests/unit/SessionHistory.test.tsx -x` | ❌ W0 | ⬜ pending |
| 10-02-04 | 02 | 1 | SIDE-10 | manual | Visual CSS check | N/A | ⬜ pending |
| 10-02-05 | 02 | 1 | SIDE-11 | manual | Visual CSS check | N/A | ⬜ pending |
| 10-02-06 | 02 | 1 | SIDE-12 | unit | `cd frontend && npx vitest run tests/unit/SessionHistory.test.tsx -x` | ❌ W0 | ⬜ pending |
| 10-03-01 | 03 | 1 | MSGE-02 | unit | `cd frontend && npx vitest run tests/unit/MarkdownRenderer.test.tsx -x` | ✅ | ⬜ pending |
| 10-03-02 | 03 | 1 | MSGE-03 | unit | `cd frontend && npx vitest run tests/unit/MarkdownRenderer.test.tsx -x` | ✅ | ⬜ pending |
| 10-03-03 | 03 | 1 | MSGE-04 | manual | Visual CSS check | N/A | ⬜ pending |
| 10-03-04 | 03 | 1 | MSGE-05 | unit | `cd frontend && npx vitest run tests/unit/MarkdownRenderer.test.tsx -x` | ✅ | ⬜ pending |
| 10-03-05 | 03 | 1 | MSGE-06 | unit | `cd frontend && npx vitest run tests/unit/MarkdownRenderer.test.tsx -x` | ✅ | ⬜ pending |
| 10-03-06 | 03 | 1 | MSGE-07 | unit | `cd frontend && npx vitest run tests/unit/MessageBlock.test.tsx -x` | ✅ | ⬜ pending |
| 10-03-07 | 03 | 1 | MSGE-08 | unit | `cd frontend && npx vitest run tests/unit/MessageBlock.test.tsx -x` | ✅ | ⬜ pending |
| 10-03-08 | 03 | 1 | MSGE-09 | manual | Visual animation check | N/A | ⬜ pending |
| 10-04-01 | 04 | 2 | ANNO-06 | manual | Visual animation check | N/A | ⬜ pending |
| 10-04-02 | 04 | 2 | ANNO-07 | unit | `cd frontend && npx vitest run tests/unit/SimplificationBlock.test.tsx -x` | ❌ W0 | ⬜ pending |
| 10-04-03 | 04 | 2 | ANNO-08 | unit | `cd frontend && npx vitest run tests/unit/SimplificationBlock.test.tsx -x` | ❌ W0 | ⬜ pending |
| 10-04-04 | 04 | 2 | ANNO-09 | unit | `cd frontend && npx vitest run tests/unit/SimplificationBlock.test.tsx -x` | ❌ W0 | ⬜ pending |
| 10-04-05 | 04 | 2 | ANNO-10 | unit | `cd frontend && npx vitest run tests/unit/CitationBlock.test.tsx -x` | ❌ W0 | ⬜ pending |
| 10-04-06 | 04 | 2 | ANNO-11 | unit | `cd frontend && npx vitest run tests/unit/CitationBlock.test.tsx -x` | ❌ W0 | ⬜ pending |
| 10-04-07 | 04 | 2 | ANNO-12 | unit | `cd frontend && npx vitest run tests/unit/CitationBlock.test.tsx -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `frontend/tests/unit/formatRelativeDate.test.ts` — stubs for SIDE-06
- [ ] `frontend/tests/unit/SessionHistory.test.tsx` — stubs for SIDE-05, SIDE-08, SIDE-09, SIDE-12
- [ ] `frontend/tests/unit/SimplificationBlock.test.tsx` — stubs for ANNO-07, ANNO-08, ANNO-09
- [ ] `frontend/tests/unit/CitationBlock.test.tsx` — stubs for ANNO-10, ANNO-11, ANNO-12

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sidebar gradient appearance | SIDE-01 | Visual CSS gradient perception | Inspect sidebar bg in dark and light modes |
| Header and button styling | SIDE-02, SIDE-03 | Visual CSS check | Verify header font size/weight, button styling |
| Session hover states | SIDE-04 | CSS :hover state | Hover over sessions, check left bar + bg tint |
| Chevron rotation animation | SIDE-07 | CSS transition visual | Click expand/collapse, confirm smooth rotation |
| Connecting lines in tree | SIDE-10 | Visual CSS pattern | Expand nested threads, check line alignment |
| 3-dot hover reveal | SIDE-11 | CSS opacity transition | Hover over thread rows, check dot appearance |
| List spacing | MSGE-04 | Visual spacing check | View AI message with lists, confirm space-y-1.5 |
| Streaming cursor blink | MSGE-09 | CSS animation visual | Send message, observe blinking bar cursor |
| Annotation slide-up animation | ANNO-06 | CSS animation visual | Trigger annotation, observe 200ms slide-up+fade |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
