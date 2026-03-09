---
phase: 5
slug: inline-annotations
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `frontend/vitest.config.ts` (or `frontend/vite.config.ts` — Wave 0 confirms) |
| **Quick run command** | `cd frontend && npx vitest run --reporter=verbose 2>&1 \| tail -20` |
| **Full suite command** | `cd frontend && npx vitest run 2>&1` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd frontend && npx vitest run --reporter=verbose 2>&1 | tail -20`
- **After every plan wave:** Run `cd frontend && npx vitest run 2>&1`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 5-01-01 | 01 | 0 | INLINE-01, INLINE-02 | unit | `cd frontend && npx vitest run src/tests/citationBlock.test.tsx 2>&1` | ❌ W0 | ⬜ pending |
| 5-01-02 | 01 | 0 | INLINE-03, INLINE-04 | unit | `cd frontend && npx vitest run src/tests/simplificationBlock.test.tsx 2>&1` | ❌ W0 | ⬜ pending |
| 5-01-03 | 01 | 0 | INLINE-05 | unit | `cd frontend && npx vitest run src/tests/sessionStore.annotations.test.ts 2>&1` | ❌ W0 | ⬜ pending |
| 5-02-01 | 02 | 1 | INLINE-01 | unit | `cd frontend && npx vitest run src/tests/citationBlock.test.tsx 2>&1` | ❌ W0 | ⬜ pending |
| 5-02-02 | 02 | 1 | INLINE-02 | unit | `cd frontend && npx vitest run src/tests/citationBlock.test.tsx 2>&1` | ❌ W0 | ⬜ pending |
| 5-02-03 | 02 | 1 | INLINE-06 | unit | `cd frontend && npx vitest run src/tests/citationBlock.test.tsx 2>&1` | ❌ W0 | ⬜ pending |
| 5-03-01 | 03 | 1 | INLINE-03 | unit | `cd frontend && npx vitest run src/tests/simplificationBlock.test.tsx 2>&1` | ❌ W0 | ⬜ pending |
| 5-03-02 | 03 | 1 | INLINE-04 | unit | `cd frontend && npx vitest run src/tests/simplificationBlock.test.tsx 2>&1` | ❌ W0 | ⬜ pending |
| 5-04-01 | 04 | 1 | INLINE-05 | unit | `cd frontend && npx vitest run src/tests/sessionStore.annotations.test.ts 2>&1` | ❌ W0 | ⬜ pending |
| 5-04-02 | 04 | 1 | INLINE-07 | unit | `cd frontend && npx vitest run src/tests/sessionStore.annotations.test.ts 2>&1` | ❌ W0 | ⬜ pending |
| 5-05-01 | 05 | 2 | INLINE-08 | manual | — | — | ⬜ pending |
| 5-05-02 | 05 | 2 | INLINE-08 | manual | — | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `frontend/src/tests/citationBlock.test.tsx` — stubs for INLINE-01, INLINE-02, INLINE-06
- [ ] `frontend/src/tests/simplificationBlock.test.tsx` — stubs for INLINE-03, INLINE-04
- [ ] `frontend/src/tests/sessionStore.annotations.test.ts` — stubs for INLINE-05, INLINE-07

*vitest is already installed via the existing frontend setup; no new framework install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Annotation blocks re-selectable; action bubble shows all 3 options on annotated text | INLINE-08 | DOM interaction with text selection not automatable in jsdom | Select text inside a previously-annotated paragraph → verify bubble shows Go Deeper, Find Sources, Simplify |
| Gutter pill positions do not shift after annotation blocks are injected | INLINE-08 | CSS layout / visual regression not automatable in jsdom | Annotate a paragraph mid-message → scroll and verify pill alignment matches non-annotated paragraphs |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
