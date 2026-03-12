---
phase: 9
slug: layout-positioning
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 + @testing-library/react 16.3.2 |
| **Config file** | `frontend/vitest.config.ts` |
| **Quick run command** | `cd frontend && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd frontend && npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd frontend && npx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd frontend && npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | PILL-01 | unit | `cd frontend && npx vitest run src/tests/gutterColumn.test.tsx -x` | ❌ W0 | ⬜ pending |
| 09-01-02 | 01 | 1 | PILL-02 | unit | `cd frontend && npx vitest run src/tests/gutterColumn.test.tsx -x` | ❌ W0 | ⬜ pending |
| 09-01-03 | 01 | 1 | PILL-03 | unit | `cd frontend && npx vitest run src/tests/threadView.test.tsx -x` | ❌ W0 | ⬜ pending |
| 09-02-01 | 02 | 1 | PILL-04 | unit | `cd frontend && npx vitest run src/tests/threadTransition.test.tsx -x` | ❌ W0 | ⬜ pending |
| 09-02-02 | 02 | 1 | PILL-05 | unit | `cd frontend && npx vitest run src/tests/threadTransition.test.tsx -x` | ❌ W0 | ⬜ pending |
| 09-02-03 | 02 | 1 | PILL-06 | unit | `cd frontend && npx vitest run src/tests/previewCard.test.tsx -x` | ❌ W0 | ⬜ pending |
| 09-02-04 | 02 | 1 | PILL-07 | unit | `cd frontend && npx vitest run src/tests/previewCard.test.tsx -x` | ❌ W0 | ⬜ pending |
| 09-02-05 | 02 | 1 | PILL-08 | unit | `cd frontend && npx vitest run src/tests/gutterColumn.test.tsx -x` | ❌ W0 | ⬜ pending |
| 09-03-01 | 03 | 2 | ANCS-01 | unit | `cd frontend && npx vitest run src/tests/ancestorRail.test.tsx -x` | ❌ W0 | ⬜ pending |
| 09-03-02 | 03 | 2 | ANCS-02 | unit | `cd frontend && npx vitest run src/tests/ancestorRail.test.tsx -x` | ❌ W0 | ⬜ pending |
| 09-03-03 | 03 | 2 | ANCS-03 | unit | `cd frontend && npx vitest run src/tests/ancestorRail.test.tsx -x` | ❌ W0 | ⬜ pending |
| 09-03-04 | 03 | 2 | ANCS-04 | unit | `cd frontend && npx vitest run src/tests/ancestorRail.test.tsx -x` | ❌ W0 | ⬜ pending |
| 09-03-05 | 03 | 2 | ANCS-05 | unit | `cd frontend && npx vitest run src/tests/ancestorRail.test.tsx -x` | ❌ W0 | ⬜ pending |
| 09-03-06 | 03 | 2 | ANCS-06 | unit | `cd frontend && npx vitest run src/tests/ancestorRail.test.tsx -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `frontend/src/tests/gutterColumn.test.tsx` — stubs for PILL-01, PILL-02, PILL-08 (grid layout, no JS measurement, descendant collapse)
- [ ] `frontend/src/tests/threadTransition.test.tsx` — stubs for PILL-04, PILL-05 (crossfade, interruptibility)
- [ ] `frontend/src/tests/previewCard.test.tsx` — stubs for PILL-06, PILL-07 (auto-flip, triangle pointer)
- [ ] `frontend/src/tests/ancestorRail.test.tsx` — stubs for ANCS-01 through ANCS-06 (rail, overlay, highlight, text size)
- [ ] `frontend/src/tests/threadView.test.tsx` — stubs for PILL-03 (no conditional padding classes)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual pill alignment with message text | PILL-01 | Pixel-level visual check | Resize browser at multiple widths; pills should stay aligned with their anchor message row |
| Crossfade smoothness perception | PILL-04 | Subjective visual quality | Navigate between threads; confirm no flash or jank during 150ms fade |
| Rail hover expand feels responsive | ANCS-02 | Subjective interaction quality | Hover over ancestor rails; confirm 200ms expand feels smooth, no flicker |
| Bottom fade gradient blending | ANCS-04 | Visual color matching | Verify gradient matches panel bg in both light and dark themes |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
