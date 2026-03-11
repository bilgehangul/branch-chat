---
phase: quick-20
plan: 20
subsystem: frontend-demo
tags: [demo, landing-page, interactive, zustand, navigation]
dependency_graph:
  requires: [SessionHistory, BreadcrumbBar, AncestorPeekPanel, GutterColumn, MessageList, ContextCard]
  provides: [DemoAppShell, DemoThreadView, expanded-demoData]
  affects: [App.tsx, landing-page-UX]
tech_stack:
  added: []
  patterns: [zustand-hydration-for-demo, real-component-reuse-in-demo-mode]
key_files:
  created:
    - frontend/src/components/demo/DemoThreadView.tsx
    - frontend/src/components/demo/DemoAppShell.tsx
  modified:
    - frontend/src/components/demo/demoData.ts
    - frontend/src/App.tsx
decisions:
  - Demo hydration uses ref guard to avoid re-hydrating on every render cycle
  - DemoAppShell "+ New Chat" button calls onSignInClick rather than being hidden
  - AncestorPeekPanel onDelete/onSummarize/onCompact are no-ops (empty functions) in demo mode
  - DemoThreadView onTryAnother redirects to sign-in instead of performing API call
metrics:
  duration: 3 min
  completed: "2026-03-11T03:31:43Z"
---

# Quick Task 20: Interactive Landing Page Demo with Navigation Summary

Interactive landing page demo using real app components with 3-depth photosynthesis thread hierarchy, annotations, and full navigation.

## What Changed

### Task 1: Expand demo data and create DemoThreadView (54ce3749)

**demoData.ts** -- Complete rewrite with photosynthesis topic:
- Root thread: "How does photosynthesis work?" with 4 messages (user question, detailed AI response with code block, follow-up about leaf color, AI explanation of absorption spectrum)
- Child thread 1: "Light reactions step by step" (depth 1, accent #E8AA14) -- 2 messages
- Child thread 2: "Calvin cycle carbon fixation" (depth 1, accent #97CC04) -- 2 messages
- Grandchild thread: "ATP synthase rotary motor" (depth 2, accent #F45D01) -- 2 messages
- Source annotation on chlorophyll paragraph with 3 sources (Khan Academy, Nature, NCBI)
- Simplification annotation (analogy mode) on electron transport chain paragraph
- ChildLeads on "light reactions" and "Calvin cycle" paragraphs pointing to child threads
- ChildLead on "ATP synthase" paragraph in child thread 1 pointing to grandchild

**DemoThreadView.tsx** -- Simplified ThreadView for demo mode:
- Reads from Zustand store (same pattern as real ThreadView)
- Renders real MessageList and GutterColumn components
- Includes slide transition and scroll position save/restore logic
- Disabled CTA footer with "Sign in to start chatting" button replaces ChatInput
- Does NOT import useAuth, useStreamingChat, useTextSelection, ActionBubble, or any API modules

### Task 2: Create DemoAppShell and wire into App.tsx (2a2a720a)

**DemoAppShell.tsx** -- Full app layout for unauthenticated visitors:
- Sidebar with "Chats" header, "+ New Chat" button (calls onSignInClick), and SessionHistory
- Resizable sidebar with drag handle via useResizableSidebar hook
- Ancestor peek panels using real AncestorPeekPanel component with same width calculation as AppShell
- Header with BreadcrumbBar, ThemeToggle, and "Sign in" button
- DemoThreadView as the main content area

**App.tsx** -- Updated unauthenticated branch:
- Imports DemoAppShell and demo data exports
- useEffect hydrates Zustand store with demo data when !isSignedIn and store is empty
- Ref guard prevents re-hydration on every render
- Replaces DemoChat with DemoAppShell in the unauthenticated return block
- SignInModal overlay preserved

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

- TypeScript: `npx tsc --noEmit` passes with zero errors
- Vite build: production build succeeds (491 KB JS, 36 KB CSS)
- All real components (MessageList, GutterColumn, BreadcrumbBar, AncestorPeekPanel, SessionHistory, ContextCard) render from hydrated Zustand store
- 3-depth thread hierarchy fully navigable via sidebar, gutter pills, breadcrumbs, and ancestor peek panels

## Self-Check: PASSED

- [x] frontend/src/components/demo/DemoThreadView.tsx exists
- [x] frontend/src/components/demo/DemoAppShell.tsx exists
- [x] frontend/src/components/demo/demoData.ts updated
- [x] frontend/src/App.tsx updated
- [x] Commit 54ce3749 exists
- [x] Commit 2a2a720a exists
