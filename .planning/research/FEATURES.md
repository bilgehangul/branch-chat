# Feature Landscape

**Domain:** Branching / non-linear AI research chat interface
**Project:** DeepDive Chat
**Researched:** 2026-03-08
**Confidence note:** Web search tools unavailable. Analysis based on training data (cutoff August 2025) covering the competitive landscape of Perplexity AI, ChatGPT, Claude.ai, Kagi Assistant, Mem AI, Roam Research integrations, and branching/annotation UI patterns. Confidence is MEDIUM for market patterns; HIGH for UX patterns that are well-established in the literature.

---

## Table Stakes

Features users expect in any modern AI chat interface. Missing = product feels broken or abandoned.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Streaming AI responses (SSE) | Every major chat UI streams; static responses feel broken | Low | Already decided: SSE for primary chat, non-streamed for simplify/cite |
| Markdown rendering | AI responses use headers, bold, code blocks, lists; raw markdown is illegible | Low | Must handle: `**bold**`, `# heading`, `` `code` ``, fenced code blocks, ordered/unordered lists |
| Code block syntax highlighting | Code without highlighting is unreadable; users paste and judge quality on this | Low | Use Prism.js or Shiki; auto-detect language |
| Message history scroll | Users scroll up to re-read; infinite scroll within a thread | Low | Within-session only is fine for v1 |
| Input textarea with submit | Shift+Enter for newline, Enter to send — standard across all tools | Low | Auto-resize textarea as user types |
| Loading / thinking indicator | Without it users think the app is broken after submitting | Low | Animated dots or spinner during AI latency |
| Error states and retry | Network failures, API errors — must be shown and retryable | Low | Show error message + retry button inline |
| Dark / light theme | Expected by users who spend hours in the UI | Low | System preference default + manual toggle |
| Authentication gate | Without auth, API keys exposed; users expect accounts | Low | Already decided: Clerk |
| Stop generation button | Users need to interrupt long responses | Low | Cancel SSE stream and show partial response |
| Copy button on code blocks | Ubiquitous; saves users a frustrating selection dance | Low | Clipboard API, "Copied!" confirmation flash |
| Responsive text size | Minimum legible reading width and font size for dense content | Low | 720px max content column is already decided |
| Empty state / onboarding | First-time users need a prompt prompt; blank canvas is confusing | Low | Starter question suggestions or welcome copy |

---

## Core Branching Features (Table Stakes for DeepDive's Niche)

These are not universal AI chat table stakes, but they ARE table stakes for DeepDive specifically — the entire product premise fails without them.

| Feature | Why Required | Complexity | Notes |
|---------|--------------|------------|-------|
| Text selection detection on AI messages | The entire branch interaction starts here; if selection is unreliable the product doesn't work | Medium | Must fire only on AI message text, not input; must work across word, sentence, paragraph boundaries; cap at one paragraph per PROJECT.md |
| Action bubble on selection | Users need affordance to know what they can do with selected text | Medium | Position bubble above or below selection using getBoundingClientRect; dismiss on click-outside or Escape |
| "Go Deeper" child thread creation | The core differentiator — anchored sub-conversation | Medium | Captures anchor text + parent message ID + scroll position; creates child thread in Zustand store |
| Animated slide transition | Without it, thread navigation is disorienting; users lose spatial awareness | Low | 200ms ease-out horizontal slide is already decided; CSS transform is sufficient |
| Breadcrumb navigation bar | Users must always know where they are and be able to return | Low | Persistent top bar at depth ≥ 1; each crumb clickable; truncate long thread titles |
| Left spine navigation strip | Visual affordance that a parent context exists | Low | 28px colored strip on left at depth ≥ 1; click to navigate up; accent color matches thread |
| Child lead gutter tags | Users need to see where branches were created when they return to parent | High | 200px right gutter column; pill tags anchored vertically to originating paragraph; thread title (32 char), message count, accent color pip |
| Thread depth limit enforcement | Without a limit, deep nesting makes navigation collapse | Low | Disable "Go Deeper" at depth 4; visual indicator explaining why |
| Accent color assignment | Visual differentiation between sibling threads at same depth | Low | 8-color palette, auto-assigned round-robin or by index |

---

## Inline Annotation Features (Table Stakes for Research Niche)

| Feature | Why Expected in Research Tool | Complexity | Notes |
|---------|-------------------------------|------------|-------|
| Source injection ("Find Sources") | Research users will not trust unsourced AI claims; citations are the minimum credibility signal | Medium | Tavily (Gemini) / OpenAI Responses API (OpenAI); inject citation block below paragraph, badge at end of selected text |
| Inline simplify / rewrite | Dense AI prose is often unusable; rewrite modes make content actionable | Medium | 4 modes already decided; replace text inline, toggle back to original |
| Toggle to original text | Rewrite without undo creates anxiety; users need safety | Low | Annotated segments store original + rewrite; button to swap back |
| Re-selectable annotated text | Users exploring layered topics need to branch further from already-annotated text | Low | Annotated spans must not block selection events — critical edge case |

---

## Differentiators

Features that set DeepDive apart from standard AI chat. Not universally expected, but high value in the research-first niche.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Child lead hover preview card | Lets users quickly recall what a branch contained without navigating into it | Medium | On gutter tag hover: show anchor text + first Q&A exchange; small card, dismiss on mouse-leave |
| Per-paragraph branch anchoring | Branches are spatially linked to where in a document they originated — not just which message | High | Position anchoring requires tracking paragraph DOM position and updating on scroll/resize |
| Thread tree accent coloring | Color-coded threads give spatial memory cues; users can recall "the blue thread was about X" | Low | 8 colors, assigned per thread; used in spine, crumb, and gutter tag |
| Provider-agnostic abstraction | Switch LLM + search provider via config, not code change | Medium | Already decided; differentiates from single-provider lock-in |
| Simplify modes (4 distinct tones) | ELI5, shorter, formal, bullet-point — each serves a different research workflow | Medium | More nuanced than generic "simplify" — the specificity is the differentiator |
| Stateless / ephemeral sessions | Zero data retention is a privacy differentiator for sensitive research topics | Low | Intentional v1 constraint; can message it as privacy-first |
| Selection capped to one paragraph | Forces focused branching; prevents sprawling, unfocused child threads | Low | A design opinion, not just a limitation — tight anchors produce tighter children |
| 5-level depth ceiling | Encourages synthesis; the depth limit is a research workflow guardrail, not just a technical limit | Low | Surface messaging about why Go Deeper is disabled at depth 4 |

---

## Anti-Features

Features to deliberately NOT build for v1. Each has a reason for exclusion and a note on when to reconsider.

| Anti-Feature | Why Avoid in v1 | What to Do Instead | Reconsider When |
|--------------|-----------------|-------------------|-----------------|
| Session persistence / database | Adds backend complexity (database, migration, auth-scoped queries) that is out of scope for experiment validation | Ephemeral Zustand store; lose on refresh is acceptable for v1 | v2 after product-market fit validated |
| Thread tree export (Markdown, PDF, JSON) | Raises questions about what to export (full tree? active branch? annotations?); design cost exceeds v1 value | Users can copy individual messages | After persistence is added |
| Sharing / collaborative sessions | Requires shared state, real-time sync, conflict resolution — entirely separate system | No sharing in v1 | After persistence |
| Mobile support | Text selection UX is fundamentally different on touch; gutter layout is impossible below 1024px | Desktop-only; clear viewport guard | After core UX is validated and responsive layout is designed from scratch |
| Voice input / output | Separate modality; no synergy with text-selection branching model | None needed | If users request it for dictation |
| File / image / PDF upload | RAG pipeline, chunking, embedding — separate product surface | None; users paste or type | After validating research chat model |
| Custom system prompts | Adds persona complexity; distracts from core research UX | Fixed research-focused system prompt | After v2 if power users demand it |
| Per-thread AI model selection | Model management UI adds cognitive overhead | One model per provider config | If switching between models for cost/quality becomes user need |
| Inline diff view for rewrites | Showing what changed is intellectually interesting but adds UI complexity | Show original vs. rewrite toggle; diff view is optional later | If simplify feature becomes heavily used |
| Thread bookmarking / starring | Requires persistence to be meaningful | Not available in v1 | After session persistence |
| Search across thread history | Requires persistence + search index | Not available in v1 | After persistence |
| Multi-select / multi-paragraph branching | Creates ambiguous anchor context; undermines focused child threads | Single-paragraph selection cap | Never — this is a design principle, not just a constraint |
| Keyboard shortcuts for all actions | High discoverability cost; users must learn a shortcut language | Mouse/click-first UX; basic shortcuts (Enter to send, Escape to dismiss) only | If power users request productivity optimizations |

---

## Feature Dependencies

```
Clerk Auth
  └── All features (nothing loads without auth)

Root chat thread (streaming SSE)
  └── Text selection detection
        └── Action bubble
              ├── Go Deeper → Child thread creation
              │     ├── Animated slide transition
              │     ├── Breadcrumb navigation
              │     ├── Left spine strip
              │     ├── Thread depth limit enforcement
              │     └── Accent color assignment
              │           └── Child lead gutter tags
              │                 └── Child lead hover preview card
              ├── Find Sources → Source citation injection
              │     └── Re-selectable annotated text (shared concern)
              └── Simplify → Inline rewrite
                    ├── Toggle to original
                    └── Re-selectable annotated text (shared concern)

Dark/light theme (independent, no deps)
```

Key dependency notes:
- Re-selectable annotated text must be solved once and applied to both source injections and rewrites — it is a shared rendering concern, not two separate features.
- Child lead gutter tags depend on accurate paragraph-level position anchoring, which requires solving DOM position tracking before the tags can be placed correctly.
- Hover preview cards depend on child lead tags existing first; they are an enhancement, not a base feature.
- Thread accent colors must be assigned at thread creation time and stored in Zustand so all three consumers (spine, breadcrumb, gutter tags) read from the same source.

---

## MVP Recommendation

### Must ship in v0.1 (Core Shell)

These are the features that prove the core hypothesis — branching creates value:

1. Clerk auth gate
2. Root chat with streaming SSE + markdown rendering
3. Text selection + action bubble
4. Go Deeper child thread creation
5. Animated slide transition (200ms ease-out)
6. Breadcrumb navigation bar
7. Left spine navigation strip
8. Child lead gutter tags (static, no hover preview)
9. Thread depth limit (5 levels, disable at depth 4)
10. Accent color assignment per thread

### Must ship in v0.2 (Inline Features)

These complete the research-assistant differentiation:

11. Find Sources (Tavily / OpenAI Responses API)
12. Source citation injection block + badge
13. Simplify with 4 modes
14. Toggle to original
15. Re-selectable annotated text
16. Child lead hover preview card

### Must ship in v0.3 (Polish)

These make the product feel complete and deployable:

17. Dark / light theme
18. Stop generation button
19. Error states and retry
20. Breadcrumb overflow handling
21. Rate limiting on backend
22. Empty state / onboarding prompts
23. E2E tests (Playwright)
24. Deployment (Vercel + Render)

### Defer

- **Export** — after persistence
- **Sharing** — after persistence
- **Mobile** — new design effort, separate milestone
- **Session persistence** — v2 milestone

---

## Competitive Context

**Confidence: MEDIUM (training data, not verified against 2026 product state)**

| Product | Branching | Inline Annotation | Source Citation | Thread Nav |
|---------|-----------|-------------------|-----------------|------------|
| ChatGPT | Edit message = fork, but no paragraph-level branching; conversation tree view added in 2024 | None | None (no grounding by default) | Simple back/forward via conversation tree |
| Claude.ai | No branching; edit sends new message; no thread tree | None | None | Linear only |
| Perplexity AI | No branching; follow-up questions are linear appends | None | Inline numbered citations with source panel | Linear only |
| Kagi Assistant | No branching | None | Optional source display | Linear only |
| Notion AI | No branching; inline suggestions are ephemeral | Block-level comments | None | Document-level only |
| Mem AI | No branching; AI is a sidebar assistant | Highlights as memory | None | Linear |

**Gap DeepDive fills:** No existing major product offers paragraph-level branching anchored to a specific text selection with spatial gutter markers showing where branches originated. This is genuinely novel interaction design in the consumer AI space.

---

## Sources

- Project context: `.planning/PROJECT.md` (HIGH confidence — authoritative project document)
- Competitive analysis: Training data through August 2025 (MEDIUM confidence — products evolve; verify ChatGPT conversation tree and Perplexity features against current versions before using competitively)
- UI/UX patterns: Well-established HCI literature on annotation systems, non-linear reading, and spatial navigation (HIGH confidence — these patterns predate AI chat)
- Feature complexity estimates: Based on typical React + Zustand + DOM API implementation patterns (MEDIUM confidence — actual complexity depends on edge cases discovered during implementation)
