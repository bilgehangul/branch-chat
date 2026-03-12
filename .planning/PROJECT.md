# ContextDive Chat

## What This Is

ContextDive Chat is a web-based AI chat interface for researchers, students, and knowledge workers who need to explore complex topics without losing their place or context. The AI's response is a living document — users select text, branch into focused sub-conversations, annotate with sources or rewrites, and navigate back through a visual thread tree. It mirrors how humans naturally read and learn: non-linear, layered, always returnable.

## Core Value

A user must be able to branch off any paragraph into a focused child conversation and return to the exact spot in the parent — with a visible lead marker showing where they went and what they found.

## Current Milestone: v2.0 BranchChat Redesign

**Goal:** Comprehensive UI/UX redesign — polished sidebar, ancestor panels, branch pill alignment, text selection fixes, annotation improvements, message rendering polish, and multi-provider BYOK settings.

**Target features:**
- Polished sidebar with IDE-grade session tree, accent colors, relative dates, hover menus
- Ancestor peek panels redesigned as collapsible rails with hover expansion
- Branch pills switched to layout-based positioning (CSS Grid) to eliminate JS drift
- Text selection filtered to assistant-only messages, ActionBubble scroll-relative
- Annotation cards with light-mode support, text highlighting, enter animations
- Message rendering: code copy button, heading hierarchy, table striping, blockquote styling
- Multi-provider settings: free tier (Gemini Flash 2.0/Lite) + BYOK (Gemini/OpenAI/Anthropic) with encrypted key storage

## Requirements

### Validated

- [x] User can authenticate with Google OAuth before accessing the chat interface — v1.0
- [x] User can start a root-level chat thread and receive streaming AI responses — v1.0
- [x] User can select up to one paragraph of AI response text and see an action bubble — v1.0
- [x] User can create a child thread ("Go Deeper") from selected text, with slide transition — v1.0
- [x] User can navigate back to parent threads via breadcrumb bar or left spine — v1.0
- [x] User can see child lead tags in parent message gutters, anchored to the originating paragraph — v1.0
- [x] User can find sources for selected text via Tavily (or OpenAI Responses API when on OpenAI) — v1.0
- [x] User can simplify selected text with 4 modes; toggle back to original — v1.0
- [x] Thread tree supports up to 5 depth levels; Go Deeper disabled at depth 4 — v1.0
- [x] Accent colors auto-assigned from 8-color palette per child thread — v1.0
- [x] Annotated text (simplified or sourced) remains fully re-selectable for any action — v1.0
- [x] AI provider is abstracted so switching to OpenAI changes only config, not code — v1.0
- [x] App deployed on AWS EC2 Ubuntu (single instance — nginx serves React static files + reverse-proxies /api to Express on port 3001; PM2 manages Node.js; Let's Encrypt SSL) — v1.0
- [x] Session history: past chat sessions are loadable from the SessionHistory sidebar (MongoDB Atlas persistence) — v1.0

### Active

- [ ] Sidebar redesigned with polished session tree, accent colors, relative dates, hover menus
- [ ] Ancestor peek panels redesigned as collapsible hover-expand rails
- [ ] Branch pills use layout-based positioning (no JS measurement drift)
- [ ] Text selection fires only on assistant message content
- [ ] ActionBubble positioned scroll-relative (not viewport-fixed)
- [ ] Annotation cards support light mode with proper color variants
- [ ] Annotation target text highlighted inline with visual connection to card
- [ ] Code blocks have copy-to-clipboard button
- [ ] Message rendering polished: heading hierarchy, list spacing, table striping, blockquote styling
- [ ] Multi-provider settings: free tier model toggle + BYOK with encrypted key storage
- [ ] Backend provider factory pattern with per-request BYOK instantiation
- [ ] Anthropic Claude provider implementation
- [ ] BYOK security: key encryption, sanitization middleware, format validation, rate limiting

### Out of Scope

- Mobile support — text selection and gutter layout require desktop viewport (≥1024px)
- Full thread tree sharing — shared links open the active thread only, not the full tree
- Collaborative sessions — one user per session
- Voice input/output, file/image uploads, PDF ingestion
- Custom AI personas or user-editable system prompts
- Export to markdown or PDF

## Context

The fundamental design insight is that current AI chat UIs force linear conversations, which breaks the natural human learning loop of reading → branching → returning. DeepDive Chat solves this by treating each AI response as a document with annotation and branch points, not a sequential chat message.

**Thread model:** root thread (depth 0) + up to 4 generations of child threads, each anchored to the paragraph that spawned it. Navigation via animated slide transitions (200ms ease-out), breadcrumb bar (top), and left spine strip (visible at depth ≥ 1).

**Inline annotations:** two types — source injections (citation block below paragraph, badge at end of text) and rewrites/simplifications (text replaced inline, toggle to original). Both are non-chat-messages; they modify rendered output in place. Annotated text stays re-selectable.

**Child leads:** pill-shaped gutter tags in a 200px right column, anchored at the vertical position of the originating paragraph. Show thread title (32 char max), message count, accent color pip. Hover shows preview card (anchor text + first exchange). Click navigates into that thread.

**Versioning plan from document:**
- v0.1 (Core Shell): Auth, root chat with streaming, Go Deeper + navigation, child leads
- v0.2 (Inline Features): Find Sources (Tavily), Simplify (4 modes), lead hover previews
- v0.3 (Polish): Full E2E tests, breadcrumb overflow, error states, dark/light theme, rate limiting, deployment

## Constraints

- **AI Provider**: Gemini 2.0 Flash for all AI tasks (primary chat + simplify + citation notes) — provider-agnostic abstraction layer required so switching to OpenAI (`gpt-4o` + Responses API) is a config change
- **Search Provider**: Tavily when on Gemini; OpenAI Responses API (built-in web search) when on OpenAI — abstracted behind a search service interface
- **Auth**: Google OAuth — google-auth-library on backend (verifies Google ID tokens), @react-oauth/google GoogleLogin button on frontend; no Clerk dependency
- **State**: Zustand store — sessions persisted to MongoDB Atlas via Express API
- **Viewport**: Desktop only (≥1024px); right gutter (200px) + content column (720px max) + left spine (28px) layout
- **Backend**: Node.js + Express on AWS EC2 (PM2 process manager) — MongoDB Atlas via Mongoose for session/thread/message persistence
- **Streaming**: All primary chat via SSE (Server-Sent Events); simplify and cite are non-streamed

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Gemini 2.0 Flash for all AI tasks | Single fast model for everything — simplicity over specialization | — Pending |
| Provider abstraction layer | Easy switch to OpenAI without code changes — both LLM and search swap together | — Pending |
| Tavily → OpenAI Responses API swap | When on OpenAI, use its built-in web search; no Tavily needed | — Pending |
| AWS EC2 Ubuntu chosen for single-instance deployment | nginx serves React build + reverse-proxies API; eliminates split Vercel/Render setup | — Pending |
| MongoDB Atlas for persistence | Managed cloud MongoDB eliminates self-hosted DB complexity; Mongoose ODM; sessions/threads/messages persist across devices | Shipped in Phase 7 |
| Annotated text remains re-selectable | Users can Go Deeper from a simplified paragraph or source an already-annotated claim | — Pending |
| Selection capped at one paragraph | Prevents ambiguous multi-paragraph anchors; keeps child thread context tight | — Pending |
| Max 5 thread depth levels | Encourages synthesis before further exploration; prevents infinite nesting | — Pending |

---
*Last updated: 2026-03-11 after milestone v2.0 BranchChat Redesign initialization*
