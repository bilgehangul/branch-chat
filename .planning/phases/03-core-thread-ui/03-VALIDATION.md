---
phase: 3
slug: core-thread-ui
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x with jsdom + @testing-library/react 16 |
| **Config file** | `frontend/vitest.config.ts` |
| **Quick run command** | `cd frontend && npx vitest run tests/unit/ --reporter=verbose` |
| **Full suite command** | `cd frontend && npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd frontend && npx vitest run tests/unit/ --reporter=verbose`
- **After every plan wave:** Run `cd frontend && npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-W0-stubs | W0 | 0 | ALL | unit stubs | `cd frontend && npx vitest run tests/unit/ --reporter=verbose` | ❌ W0 | ⬜ pending |
| 3-streaming-hook | TBD | 1 | CHAT-01, CHAT-03, CHAT-04 | unit | `cd frontend && npx vitest run tests/unit/useStreamingChat.test.ts -x` | ❌ W0 | ⬜ pending |
| 3-markdown | TBD | 1 | CHAT-02 | unit | `cd frontend && npx vitest run tests/unit/MarkdownRenderer.test.tsx -x` | ❌ W0 | ⬜ pending |
| 3-message-block | TBD | 1 | CHAT-06 | unit | `cd frontend && npx vitest run tests/unit/MessageBlock.test.tsx -x` | ❌ W0 | ⬜ pending |
| 3-context-card | TBD | 1 | CHAT-05 | unit | `cd frontend && npx vitest run tests/unit/ContextCard.test.tsx -x` | ❌ W0 | ⬜ pending |
| 3-breadcrumb | TBD | 2 | NAV-01, NAV-02, NAV-03 | unit | `cd frontend && npx vitest run tests/unit/BreadcrumbBar.test.tsx -x` | ❌ W0 | ⬜ pending |
| 3-spine | TBD | 2 | NAV-04, NAV-05 | unit | `cd frontend && npx vitest run tests/unit/SpineStrip.test.tsx -x` | ❌ W0 | ⬜ pending |
| 3-thread-view | TBD | 2 | NAV-06, NAV-07 | unit | `cd frontend && npx vitest run tests/unit/ThreadView.test.tsx -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `frontend/tests/unit/useStreamingChat.test.ts` — stubs for CHAT-01, CHAT-03, CHAT-04
- [ ] `frontend/tests/unit/MarkdownRenderer.test.tsx` — stub for CHAT-02
- [ ] `frontend/tests/unit/MessageBlock.test.tsx` — stub for CHAT-06
- [ ] `frontend/tests/unit/ContextCard.test.tsx` — stub for CHAT-05
- [ ] `frontend/tests/unit/BreadcrumbBar.test.tsx` — stubs for NAV-01, NAV-02, NAV-03
- [ ] `frontend/tests/unit/SpineStrip.test.tsx` — stubs for NAV-04, NAV-05
- [ ] `frontend/tests/unit/ThreadView.test.tsx` — stubs for NAV-06, NAV-07

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Streaming tokens appear token-by-token in browser | CHAT-01 | Requires live Gemini SSE connection | Open app, send a message, verify tokens appear progressively |
| Blinking underscore cursor during streaming | CHAT-01 | Visual/animation behavior | Observe `_` blinking at end of streaming text |
| Animated typing dots before first token | CHAT-01 | Visual/animation behavior | Observe `...` during latency gap before first token |
| 80% opacity on streaming message | CHAT-06 | Visual behavior | Observe message appears dimmed while streaming |
| Auto-scroll stops when user scrolls up | CHAT-01 | User scroll interaction | During stream, scroll up — verify scroll position stops following |
| Slide transition direction 200ms ease-out | NAV-06 | Animation behavior | Navigate between threads, observe slide direction and timing |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
