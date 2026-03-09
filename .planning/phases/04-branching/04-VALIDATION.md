---
phase: 4
slug: branching
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.0.18 + jsdom |
| **Config file** | `frontend/vitest.config.ts` |
| **Quick run command** | `cd frontend && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd frontend && npx vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd frontend && npx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd frontend && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 4-01-01 | 01 | 0 | BRANCH-01, BRANCH-04 | unit | `cd frontend && npx vitest run tests/unit/useTextSelection.test.ts` | ❌ W0 | ⬜ pending |
| 4-01-02 | 01 | 0 | BRANCH-02, BRANCH-03, BRANCH-12 | unit | `cd frontend && npx vitest run tests/unit/ActionBubble.test.tsx` | ❌ W0 | ⬜ pending |
| 4-01-03 | 01 | 0 | BRANCH-08, BRANCH-09, BRANCH-10, BRANCH-11 | unit | `cd frontend && npx vitest run tests/unit/GutterColumn.test.tsx` | ❌ W0 | ⬜ pending |
| 4-02-01 | 02 | 1 | BRANCH-01, BRANCH-04 | unit | `cd frontend && npx vitest run tests/unit/useTextSelection.test.ts` | ❌ W0 | ⬜ pending |
| 4-02-02 | 02 | 1 | BRANCH-02, BRANCH-03 | unit | `cd frontend && npx vitest run tests/unit/ActionBubble.test.tsx` | ❌ W0 | ⬜ pending |
| 4-03-01 | 03 | 2 | BRANCH-05, BRANCH-06 | unit | `cd frontend && npx vitest run tests/unit/sessionStore.test.ts` | ✅ extend | ⬜ pending |
| 4-03-02 | 03 | 2 | BRANCH-07 | unit | `cd frontend && npx vitest run tests/unit/MessageBlock.test.tsx` | ✅ extend | ⬜ pending |
| 4-04-01 | 04 | 2 | BRANCH-08, BRANCH-09, BRANCH-10, BRANCH-11 | unit | `cd frontend && npx vitest run tests/unit/GutterColumn.test.tsx` | ❌ W0 | ⬜ pending |
| 4-05-01 | 05 | 2 | BRANCH-12 | unit | `cd frontend && npx vitest run tests/unit/ActionBubble.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `frontend/tests/unit/useTextSelection.test.ts` — stubs for BRANCH-01, BRANCH-04
- [ ] `frontend/tests/unit/ActionBubble.test.tsx` — stubs for BRANCH-02, BRANCH-03, BRANCH-12
- [ ] `frontend/tests/unit/GutterColumn.test.tsx` — stubs for BRANCH-08, BRANCH-09, BRANCH-10, BRANCH-11
- [ ] Verify `unist-util-visit` in `frontend/node_modules`; install as direct dep if missing
- [ ] Verify `@types/hast` in `frontend/node_modules/@types`; install as dev dep if missing

*Existing infrastructure (`sessionStore.test.ts`, `MessageBlock.test.tsx`) covers BRANCH-05, BRANCH-06, BRANCH-07 via extension.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Slide-right transition on child thread open | BRANCH-04 | CSS animation timing; jsdom doesn't render transitions | Select text, click "Go Deeper", observe transition direction |
| Gutter pill vertical alignment with anchor paragraph | BRANCH-08 | DOM positioning requires real browser layout | Open child thread, compare pill position vs underlined paragraph |
| Action bubble 100ms appearance timing | BRANCH-02 | Wall-clock timing hard to assert in jsdom | Select text, release mouse, confirm bubble appears quickly |
| Breadcrumb/spine back navigation with scroll restore | BRANCH-11 | Scroll position requires real browser | Navigate into child, back out, confirm parent scroll position restored |
| Selection inside code blocks (SyntaxHighlighter DOM) | BRANCH-01 | SyntaxHighlighter internal DOM structure needs browser verification | Select text inside a code block, confirm bubble appears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
