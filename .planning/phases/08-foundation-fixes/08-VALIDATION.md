---
phase: 8
slug: foundation-fixes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 (unit) + Playwright 1.58.2 (E2E) |
| **Config file** | frontend/vitest.config.ts, frontend/playwright.config.ts |
| **Quick run command** | `cd frontend && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd frontend && npx vitest run && npx playwright test` |
| **Estimated runtime** | ~15 seconds (unit), ~45 seconds (E2E) |

---

## Sampling Rate

- **After every task commit:** Run `cd frontend && npx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd frontend && npx vitest run && npx playwright test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | TSEL-02 | unit | `cd frontend && npx vitest run src/tests/messageBlock.test.tsx -x` | Yes | ⬜ pending |
| 08-01-02 | 01 | 1 | TSEL-03 | unit | `cd frontend && npx vitest run src/tests/messageBlock.test.tsx -x` | Yes | ⬜ pending |
| 08-01-03 | 01 | 1 | TSEL-01 | unit | `cd frontend && npx vitest run src/tests/useTextSelection.test.ts -x` | ❌ W0 | ⬜ pending |
| 08-01-04 | 01 | 1 | TSEL-04 | unit | `cd frontend && npx vitest run src/tests/actionBubble.test.tsx -x` | Yes | ⬜ pending |
| 08-01-05 | 01 | 1 | TSEL-06 | unit | `cd frontend && npx vitest run src/tests/actionBubble.test.tsx -x` | Yes | ⬜ pending |
| 08-01-06 | 01 | 1 | TSEL-05 | unit | `cd frontend && npx vitest run src/tests/actionBubble.test.tsx -x` | Yes | ⬜ pending |
| 08-02-01 | 02 | 1 | ANNO-01 | unit | `cd frontend && npx vitest run src/tests/highlightOverlay.test.tsx -x` | ❌ W0 | ⬜ pending |
| 08-02-02 | 02 | 1 | ANNO-02 | unit | `cd frontend && npx vitest run src/tests/citationBlock.test.tsx -x` | Yes | ⬜ pending |
| 08-02-03 | 02 | 1 | ANNO-03 | unit | `cd frontend && npx vitest run src/tests/simplificationBlock.test.tsx -x` | Yes | ⬜ pending |
| 08-02-04 | 02 | 1 | ANNO-04 | unit | `cd frontend && npx vitest run src/tests/citationBlock.test.tsx -x` | Yes | ⬜ pending |
| 08-02-05 | 02 | 1 | ANNO-05 | unit | `cd frontend && npx vitest run src/tests/messageBlock.test.tsx -x` | Yes | ⬜ pending |
| 08-03-01 | 03 | 2 | MSGE-01 | unit | `cd frontend && npx vitest run src/tests/messageBlock.test.tsx -x` | Yes | ⬜ pending |
| 08-03-02 | 03 | 2 | XCUT-01 | unit | `cd frontend && npx vitest run src/tests/accessibility.test.tsx -x` | ❌ W0 | ⬜ pending |
| 08-03-03 | 03 | 2 | XCUT-02 | manual | N/A -- no modals exist yet | N/A | ⬜ pending |
| 08-03-04 | 03 | 2 | XCUT-03 | manual | Browser DevTools contrast audit | N/A | ⬜ pending |
| 08-03-05 | 03 | 2 | XCUT-04 | unit | `cd frontend && npx vitest run` | Yes | ⬜ pending |
| 08-03-06 | 03 | 2 | XCUT-05 | unit | `cd frontend && npx vitest run src/tests/useTextSelection.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `frontend/src/tests/useTextSelection.test.ts` — stubs for TSEL-01, XCUT-05 (selection filtering unit tests)
- [ ] `frontend/src/tests/highlightOverlay.test.tsx` — stubs for ANNO-01 (per-type highlight colors)
- [ ] `frontend/src/tests/accessibility.test.tsx` — stubs for XCUT-01 (aria-label presence checks)
- [ ] Update `frontend/src/tests/messageBlock.test.tsx` selectors for new class names and data attributes

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Focus trapping in modals | XCUT-02 | No modals exist yet (Phase 11) | Verify when Settings modal is built in Phase 11 |
| WCAG AA contrast ratios | XCUT-03 | Requires visual inspection across both themes | Open app in both light/dark mode, run DevTools Accessibility audit on all pages |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
