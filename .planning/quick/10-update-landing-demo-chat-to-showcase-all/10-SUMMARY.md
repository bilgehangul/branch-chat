---
phase: quick-10
plan: "01"
subsystem: frontend-demo
tags: [demo, landing-page, static-showcase, ux]
dependency_graph:
  requires: []
  provides: [rich-static-demo-for-unauthenticated-visitors]
  affects: [frontend/src/components/demo/DemoChat.tsx, frontend/src/App.tsx]
tech_stack:
  added: []
  patterns: [DemoMessageBlock-wrapper-without-store, static-data-module, sign-in-intercept-pattern]
key_files:
  created:
    - frontend/src/components/demo/demoData.ts
  modified:
    - frontend/src/components/demo/DemoChat.tsx
decisions:
  - "DemoMessageBlock wrapper renders same JSX as MessageBlock with an explicit underlineMap prop instead of useSessionStore call — avoids any store dependency in the demo"
  - "Demo shows root thread msg-2 (the source of branching) inline in the main area rather than hiding it, so the citation block, simplification block, and code block are all visible to unauthenticated visitors"
  - "Vite bundles successfully (370 modules, 481 kB JS) even though tsc -b reports pre-existing test file errors that predate this task"
metrics:
  duration: "~12 min"
  completed: "2026-03-10"
  tasks_completed: 2
  files_changed: 2
---

# Phase quick-10 Plan 01: Update Landing Demo Chat to Showcase All Features Summary

Rich static demo chat replacing the 4-message placeholder — showcases every major app feature (branching, annotations, code blocks, context card, gutter pill, breadcrumbs) to entice unauthenticated visitors to sign up.

## What Was Built

### demoData.ts (new)
Static fake conversation data conforming exactly to the `Thread`, `Message`, `Annotation`, `ChildLead` types:

- **Root thread** (`root-thread-1`, depth 0, accent `#2D7DD2`): 4 messages
  - msg-1: user asks about backpropagation
  - msg-2: AI response with multi-paragraph markdown, Python code block, citation annotation (paragraph 1), simplification annotation (paragraph 4), and a `ChildLead` pointing to the child thread
  - msg-3: user follow-up about learning rate
  - msg-4: AI response about adaptive optimisers
- **Child thread** (`child-thread-1`, depth 1, accent `#E8AA14`): 2 messages, chain rule deep-dive
- **Citation annotation** on msg-2 paragraph 1: 3 real academic sources (cs231n, colah, deeplearningbook) + citation note
- **Simplification annotation** on msg-2 paragraph 4: analogy mode with full replacement text

### DemoChat.tsx (rewritten, +370/-73 lines)
Full-featured static demo layout:

1. **Ancestor peek panel** (left sidebar, hidden on mobile) — root thread message snippets with the parent message highlighted with accent border
2. **Breadcrumb header** — "Root › chain rule and gradient" with clickable root crumb routing to sign-in modal; theme toggle + sign-in button
3. **Root thread excerpt** — msg-1 user bubble + msg-2 AI bubble showing:
   - Paragraph 1 underlined in child thread accent color (childLead indicator)
   - Python code block with one-dark syntax highlighting
   - Collapsed citation block with 3 sources
   - Simplification block (Analogy mode) with rewritten text
4. **Branch divider** — visual separator with accent badge "↗ Branched into child thread"
5. **ContextCard** — "Branched from parent thread" card with anchor text quote (using the real `ContextCard` component)
6. **Child thread messages** — msg-c1/msg-c2 rendered via `DemoMessageBlock` with `MarkdownRenderer`
7. **Static action bubble** — Go Deeper / Find Sources / Simplify buttons, all routing to sign-in
8. **Gutter pill + preview card** (right column, hidden below lg) — thread title, message count, preview of first 2 child messages
9. **Persistent sign-in CTA banner** above the input
10. **Disabled input area** — placeholder text + sign-in button

Every interactive element (breadcrumb, peek panel items, action bubble, gutter pill, input sign-in button, theme toggle) calls `onSignInClick` which opens the sign-in modal in `App.tsx`.

## Deviations from Plan

### Auto-fix: Template literal backtick conflict in demoData.ts
- **Found during:** Task 1 TypeScript compilation
- **Issue:** The MSG_C2 content used backticks for inline code inside a template literal, causing TS parse errors (subscript Unicode chars and nested backtick issues)
- **Fix:** Converted MSG_C2 content to an array of plain strings joined with `\n`, using regular quotes; avoided Unicode subscript chars in favour of ASCII equivalents (`a1`, `a2`, `y_hat`)
- **Files modified:** `frontend/src/components/demo/demoData.ts`
- **Commit:** 18e2e833

### Scope expansion: Root thread msg-2 shown in main area (not just peek panel)
- **Found during:** Task 2 — realised the citation block and simplification block on msg-2 would be invisible if only the child thread messages were rendered
- **Fix:** Added msg-1 and msg-2 to the top of the main message column as a "Root thread excerpt", then the branch divider, then the context card, then child thread messages — showing the full branching story in one scroll
- **Impact:** More informative demo; slightly longer scroll, but all features are visible above the fold on desktop

## Self-Check

Files exist:
- `frontend/src/components/demo/demoData.ts` — FOUND
- `frontend/src/components/demo/DemoChat.tsx` — FOUND

Commits exist:
- `18e2e833` — feat(quick-10): create static demo data file — FOUND
- `3470f357` — feat(quick-10): rewrite DemoChat with full static showcase — FOUND

TypeScript: zero errors in `src/components/` subtree
Vite build: `✓ built in 1.45s` — 370 modules, 481 kB JS bundle

## Self-Check: PASSED
