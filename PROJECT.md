# DeepDive Chat — Project Description

> A research-first chat interface that mirrors how humans naturally learn: read, select, branch, go deeper, and return.

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Product Vision](#2-product-vision)
3. [Core Concepts](#3-core-concepts)
4. [Feature Specifications](#4-feature-specifications)
5. [Design Requirements](#5-design-requirements)
6. [Technical Architecture](#6-technical-architecture)
7. [Data Model](#7-data-model)
8. [API Integrations](#8-api-integrations)
9. [Prompt Design](#9-prompt-design)
10. [Folder Structure](#10-folder-structure)
11. [Testing Strategy](#11-testing-strategy)
12. [Engineering Practices](#12-engineering-practices)
13. [Versioning & Release Strategy](#13-versioning--release-strategy)
14. [Out of Scope — v1](#14-out-of-scope--v1)
15. [Open Questions](#15-open-questions)

---

## 1. Problem Statement

Current AI chat interfaces like ChatGPT, Claude, and Gemini share one fundamental design constraint: **conversations only grow downward**. Every follow-up question extends a single linear thread. This works for task completion, but breaks down for learning and research.

When a person reads a document or article to learn a topic, their process is non-linear:

- Read the main text
- Encounter an unfamiliar term or concept → look it up
- Return to the main text with better understanding
- Follow a citation → read a related source
- Return again
- Ask a small question about a specific sentence
- Come back and continue reading

This back-and-forth between a primary source and exploratory sub-questions is how comprehension is built. Chat interfaces destroy this loop. When you ask a follow-up question, the original AI response scrolls away. When you go deep on one concept, the thread becomes *about that concept*, not the original topic. You lose your place. You lose the context. You stop going deep because navigation becomes painful.

**DeepDive Chat solves this by treating the AI's response as a living document you can annotate, branch off of, and always return to.**

---

## 2. Product Vision

DeepDive Chat is a web-based AI chat interface designed for researchers, students, and knowledge workers who want to have multi-layered conversations about complex topics without losing their place or their context.

The guiding metaphor is **a research notebook with branches**. The AI's response is not a chat message — it is a document. You read it, highlight parts of it, ask questions about specific sentences, simplify confusing passages, find sources for claims, and create focused sub-conversations that grow off the document at the exact point they originated.

### What success looks like

A user pastes a complex research topic into the chat. The AI produces a structured explanation. The user selects a sentence they don't understand, creates a child thread, goes three levels deep into that concept, and then returns to the original explanation with full comprehension — seeing exactly which sentence they branched off of, with a lead tag showing the conversation they just had is sitting right there, ready to re-enter.

This is the reading and learning flow that humans naturally use. DeepDive Chat encodes it into software.

---

## 3. Core Concepts

These concepts are the foundation of every design and engineering decision in this project. All contributors must internalize them before writing a line of code.

### 3.1 Thread

A **thread** is a single conversation between the user and the AI. Every session begins with one thread (the root). Threads are created when a user selects text in an AI response and chooses "Go Deeper." Each thread has a parent (except root) and can have many children.

Threads are not chat histories. They are **contexts**. Each thread carries the anchor text that spawned it, the parent message it came from, and the user's original session topic. The AI in each thread knows where it sits in the tree and adjusts its behavior accordingly.

### 3.2 Thread Depth

The maximum depth of the thread tree is **5 generations**:

```
Depth 0 — Root thread (the original conversation)
Depth 1 — Child thread (branched from root)
Depth 2 — Grandchild thread
Depth 3 — Great-grandchild thread
Depth 4 — Great-great-grandchild thread (maximum)
```

At depth 4, the "Go Deeper" option in the selection action bubble is disabled. Users are shown a message: *"Maximum depth reached. Return to a parent thread to explore further."* This limit is intentional — it encourages synthesis before further exploration.

### 3.3 Child Lead

A **child lead** is the inline visual marker that appears in a parent message at the exact position where a child thread was created. It is a small pill-shaped tag in the right gutter of the message, anchored vertically to the paragraph from which the thread was branched. It shows the child thread title and message count. It is the visual evidence that a branch exists and is the doorway back into it.

### 3.4 Anchor Text

The **anchor text** is the selected paragraph (or part of it) that a user chose when creating a child thread, simplifying text, or finding sources. It is stored with the child thread, used in system prompts, highlighted with a persistent colored underline in the parent message, and linked to the child lead.

### 3.5 Inline Annotation

An **inline annotation** is a modification or addition to an existing AI message — not a new chat message. Simplifications and source injections are both annotations. They modify the rendered message in place, with a toggle to view the original. They do not appear in the chat feed as new messages.

### 3.6 Session

A **session** is the top-level container for everything the user does in one visit. It contains the root thread, which contains all descendant threads. Sessions are stateless on the backend — the full session state lives in the browser. Users must be authenticated to use the app, but no session data is persisted server-side in v1.

---

## 4. Feature Specifications

### 4.1 Authentication

- Users must log in before using the app.
- Authentication provider: **Clerk** (handles UI, sessions, JWTs without a custom backend).
- On login, a unique user ID is issued and stored in the browser session.
- No user data — thread history, session state — is stored on the server in v1.
- Auth gates the entire app. No chat interface is visible without being logged in.
- Logout clears all in-memory state.

### 4.2 Starting a Session

- The root thread has a standard chat input at the bottom of the screen.
- The user types their topic or question and submits.
- The AI streams a response.
- Once a response has finished streaming, text selection becomes active on it.
- Subsequent user messages in the root thread continue the root thread conversation.

### 4.3 Text Selection and the Action Bubble

Text selection is the primary interaction in the interface. It must work precisely and feel native.

**How selection works:**
- User clicks and drags across text in any AI response to select it.
- Selection is capped at one paragraph. If the user's drag crosses a paragraph boundary, the selection is automatically trimmed to the paragraph where the drag began.
- A floating **action bubble** appears 8px above the top-right corner of the selection bounding box.
- The bubble appears within 100ms of the user releasing the mouse button.
- The bubble disappears when the user clicks outside it or starts a new selection.

**Action bubble contents:**

| Action | Label | Icon | Behavior |
|---|---|---|---|
| Go Deeper | "Go Deeper" | branching arrow | Creates a child thread from the selected text |
| Find Sources | "Find Sources" | magnifier | Calls Tavily, injects inline citation annotation |
| Simplify | "Simplify" | magic wand | Rewrites the selected text inline with a dropdown of modes |

**Disabled states:**
- "Go Deeper" is disabled (grayed out, tooltip shown) when the current thread is at depth 4.
- All actions are disabled while a response is actively streaming.

### 4.4 Go Deeper — Child Thread Creation

When the user selects "Go Deeper" from the action bubble:

1. A new child thread is created in the session state.
2. The child thread is auto-named: a 3–6 word title generated from the selected anchor text (client-side, using the first meaningful noun phrase in the selection).
3. An accent color is auto-assigned to the thread from a predefined palette of 8 colors, cycling in order of creation.
4. The parent message is updated: the anchor text receives a persistent colored underline in the thread's accent color. A child lead tag appears in the right gutter of the parent message at the vertical position of the anchor text.
5. The interface transitions: the current thread slides left and off screen (200ms ease-out), the new child thread slides in from the right.
6. The child thread opens with an empty input and a context card at the top showing the anchor text and which parent message it came from.
7. The breadcrumb bar updates to show the new thread as the current location.
8. The left spine becomes visible, showing the immediate parent thread title.

### 4.5 Child Leads in the Parent Message

Each child lead is an inline tag in the right gutter of the AI message, anchored at the vertical position of the anchor text paragraph.

**Lead tag anatomy:**
```
↳  Why does temperature affect output?  •  8  ●
```
- ↳ directional arrow
- Auto-generated thread title (truncated to 32 characters with ellipsis)
- Message count (updates live as messages are added to the child thread)
- Color pip matching the thread's accent color

**Interactions:**
- Single click → navigates into the child thread (same slide-right transition as creating a new thread)
- Hover → shows a small floating preview card above the tag containing: the anchor text, the first user message sent in the child thread, and the first line of the AI's first response
- The colored underline on the anchor text and the lead tag are always in sync — same accent color

**Multiple leads on one message:**
- If a message has multiple child threads branching from different paragraphs, each lead appears at its respective vertical position in the gutter
- Leads do not stack or overlap because they are anchored to their paragraph's vertical position
- If two branches were made from the same paragraph, the two leads stack vertically in that paragraph's gutter zone

### 4.6 Find Sources — Tavily Inline Injection

When the user selects "Find Sources":

1. The action bubble shows a loading spinner in place of the icon.
2. A call is made to the backend, which queries the **Tavily Search API** with the selected text as the query.
3. The top 2–3 results are returned. A second prompt call is made to the Claude API (using Haiku for speed) to generate a 1–2 sentence inline citation note that confirms, nuances, or corrects the selected claim based on the sources found.
4. The selected text in the AI message is updated inline: a small citation badge appears at the end of the selected text, styled like a superscript footnote number.
5. Below the paragraph (not as a new chat message), a **citation block** is injected — a compact card showing the citation note and the 2–3 source links with titles and domains.
6. The citation block is collapsible. Default state is expanded.
7. There is no limit on how many times a user can use "Find Sources" per session.

**Error handling:**
- If Tavily returns no results: show inline message "No sources found for this claim."
- If Tavily API fails: show inline message "Source lookup unavailable. Try again." with a retry button.

### 4.7 Simplify — Inline Rewrite

When the user selects "Simplify", a secondary dropdown appears attached to the action bubble with four modes:

| Mode | Instruction to AI |
|---|---|
| Simpler | Rewrite for a general audience with no assumed background |
| Give an example | Add a concrete real-world example after the selected text |
| Use an analogy | Rewrite using an analogy that preserves the core meaning |
| More technical | Rewrite with precise technical language and terminology |

On mode selection:

1. The action bubble shows a loading state.
2. A call is made to the Claude API (Haiku) with the simplify prompt.
3. The selected text in the message is **replaced inline** with the rewritten version.
4. A small toggle appears beside the replaced text: "↩ Original" — clicking it swaps the text back to the original. Clicking "↩ Rewrite" on the original restores the rewrite.
5. The toggle persists until the user refreshes or clears the session.

### 4.8 Navigation — Breadcrumb

The breadcrumb bar is a persistent single-line bar at the top of the screen. It is always visible.

**Structure:**
```
📄 Root  ›  🔵 Attention Mechanism  ›  🟠 Softmax  ›  🟢 Gradient Flow  (current)
```

- Root is always shown with a document icon and the first 4 words of the user's opening message
- Each child crumb shows its accent color pip and its auto-generated thread title
- The current thread is shown in full weight, not a link
- All ancestor crumbs are clickable links that navigate back to that thread

**Overflow behavior:**
- When the full path does not fit in one line, middle crumbs collapse into `...`
- The breadcrumb always shows: Root on the left, the current thread on the right, `...` in between
- Clicking `...` opens a dropdown showing the full collapsed path, each crumb clickable

### 4.9 Navigation — Left Spine

The left spine is a thin strip (28px wide) fixed to the left edge of the screen. It is only visible when the current thread is a child (depth ≥ 1).

**Appearance:**
- A vertical colored line in the parent thread's accent color
- The parent thread's title rotated 90° along the strip
- A left-facing chevron (‹) at the top of the strip

**Interaction:**
- Click anywhere on the left spine → navigates back to the immediate parent thread (reverse slide transition, 200ms)
- This always goes up exactly one level. To jump multiple levels, the user uses the breadcrumb.

---

## 5. Design Requirements

### 5.1 Layout

- The active chat thread always occupies the **full available width** of the screen. No split panes. No columns.
- Maximum content width: **720px**, centered, with generous side gutters. This is a reading interface, not a dashboard.
- The right gutter (for child leads) is **200px** wide and sits outside the 720px content column.
- Total minimum viewport width supported: **1024px** (desktop/laptop only in v1).
- The breadcrumb bar is fixed to the top, **48px** tall, full viewport width, with a subtle bottom border.
- The left spine is **28px** wide, fixed to the left, full viewport height minus the breadcrumb.
- The chat input is fixed to the bottom of the viewport, full content width.

### 5.2 Thread Transitions

All thread navigation must be animated with directional slide transitions.

- **Going deeper** (creating or entering a child thread): current thread slides left off screen, new thread slides in from the right. Duration: 200ms, ease-out.
- **Going back** (breadcrumb or left spine): current thread slides right off screen, parent thread slides in from the left. Duration: 200ms, ease-out.
- Transitions are **not skippable** and **not re-triggered** if already animating (debounce navigation).
- When returning to a parent thread, the scroll position is restored to where the user was when they left.

### 5.3 Text Selection

- The browser's native text selection behavior is preserved. No custom selection engine.
- The action bubble must not interfere with further text selection after it appears.
- If the user starts a new selection while the bubble is visible, the bubble is dismissed first.
- Selected text that has an active annotation (source or rewrite) should still be re-selectable.

### 5.4 Typography and Readability

- Base font: **Inter** (via Google Fonts). Clean, highly legible, designed for screens.
- AI response body text: 16px, 1.7 line height. This is a reading interface. Comfort matters.
- Code blocks: **JetBrains Mono**, 14px, with syntax highlighting via highlight.js.
- AI responses are rendered as **Markdown**, not plain text. Headings, bold, code blocks, and lists must all render correctly.
- Message bubbles are not used. User messages appear right-aligned in a muted block. AI responses appear left-aligned as full-width prose.

### 5.5 Color and Theme

- Default: **dark theme**. Reading long AI responses is easier on a dark background.
- Light theme toggled by user preference (stored in localStorage).
- Thread accent colors are taken from a fixed 8-color palette with sufficient contrast on both dark and light backgrounds.

**Suggested palette (8 colors):**
```
Blue     #2D7DD2
Orange   #E06C1E
Green    #27A060
Purple   #7C4DBA
Red      #D93B3B
Teal     #1A9E8C
Yellow   #C9900A
Pink     #C4357A
```

### 5.6 The Action Bubble

- Appears floating above the selection, never clipped by the viewport edge (position adjusts if near edges).
- Three buttons in a pill-shaped container.
- On hover of each button: show a tooltip with the action name.
- On loading state: the button icon becomes a spinner; the other buttons are still active.
- The bubble has a subtle drop shadow and a border to lift it above the text.

### 5.7 Child Leads in the Gutter

- Leads are rendered in the right gutter column (200px), right-aligned.
- Each lead is visually connected to its anchor text by a 1px horizontal dotted line at the vertical midpoint of the anchor paragraph.
- Leads have a subtle hover state (background lightens, cursor becomes pointer).
- The hover preview card appears above the lead tag, never obscuring the chat content below it.

---

## 6. Technical Architecture

### 6.1 Stack

| Layer | Choice | Rationale |
|---|---|---|
| Frontend | **React** (Vite) | Component model maps cleanly to thread tree; Vite for fast iteration |
| Styling | **Tailwind CSS** | Utility-first, consistent spacing, easy dark mode |
| Animations | **Framer Motion** | Production-grade slide transitions; declarative API for layout changes |
| Markdown rendering | **react-markdown** + **remark-gfm** | Full markdown support with GFM extensions |
| Syntax highlighting | **highlight.js** | Lightweight, wide language support |
| State management | **Zustand** | Simple, minimal boilerplate; thread tree is the primary complex state |
| Authentication | **Clerk** | Handles the full auth flow without a custom backend in v1 |
| Backend | **Node.js + Express** | Thin API proxy layer; handles Claude and Tavily calls; no database in v1 |
| AI — primary | **Anthropic Claude API** (Sonnet 4) | Main chat responses |
| AI — secondary | **Anthropic Claude API** (Haiku) | Simplifications and source injection notes (speed and cost) |
| Search | **Tavily API** | Purpose-built for AI research queries; structured JSON responses |
| Deployment | **Vercel** (frontend) + **Railway** or **Render** (backend) | Fast, free tier available for experimentation |

### 6.2 Why a Backend Proxy

Even in a stateless v1, a thin backend is required for:
- Keeping the Anthropic API key and Tavily API key **out of the browser**
- Enforcing rate limiting per authenticated user (prevent abuse)
- Adding request logging for research purposes (understanding usage patterns)
- Streaming Claude responses through Server-Sent Events (SSE) without CORS issues

The backend does not store any session data. It is a pure proxy with auth validation.

### 6.3 Streaming

All Claude API calls for primary chat responses must stream. The response appears token-by-token in the UI. This is critical for perceived performance on long, structured AI explanations.

- Backend opens an SSE connection to the Claude API.
- Frontend connects to the backend via `EventSource` or `fetch` with `ReadableStream`.
- Streaming is complete when the backend sends a `[DONE]` event.
- Text selection is disabled on a message while it is streaming. It is re-enabled on `[DONE]`.

### 6.4 State Architecture

All session state lives in a single Zustand store. The store is the source of truth for:

- The thread tree (all threads, their messages, their child threads)
- The current active thread ID
- Navigation history (for scroll position restoration)
- UI state (action bubble visibility, transition direction, loading states per feature)

The store is **not persisted** to localStorage in v1 (session is lost on refresh). This is intentional for the experiment phase.

---

## 7. Data Model

These are the core data structures. All state in the Zustand store conforms to these types. TypeScript interfaces should be defined in `src/types/index.ts` and imported everywhere.

```
Session
├── id: string
├── userId: string (from Clerk)
├── createdAt: timestamp
└── rootThread: Thread

Thread
├── id: string
├── depth: 0 | 1 | 2 | 3 | 4
├── parentThreadId: string | null
├── anchorText: string | null         ← the selected text that spawned this thread
├── parentMessageId: string | null    ← which message it was selected from
├── title: string                     ← auto-generated, 3–6 words
├── accentColor: string               ← hex, from the 8-color palette
├── messages: Message[]
├── childThreadIds: string[]          ← ordered list of child thread IDs
└── scrollPosition: number            ← restored on return navigation

Message
├── id: string
├── role: "user" | "assistant"
├── content: string                   ← raw markdown string
├── annotations: Annotation[]
├── childLeads: ChildLead[]           ← indexed by paragraph position
├── isStreaming: boolean
└── createdAt: timestamp

Annotation
├── id: string
├── type: "source" | "rewrite" | "simplification"
├── targetText: string               ← the exact text being annotated
├── paragraphIndex: number           ← which paragraph in the message
├── originalText: string             ← preserved for toggle-back
├── replacementText: string | null   ← for rewrites/simplifications
├── citationNote: string | null      ← for sources
├── sources: SourceResult[]          ← for sources
└── isShowingOriginal: boolean       ← toggle state

SourceResult
├── title: string
├── url: string
├── domain: string
└── snippet: string

ChildLead
├── threadId: string
├── paragraphIndex: number           ← vertical anchor position
├── anchorText: string
└── messageCount: number             ← updates live
```

---

## 8. API Integrations

### 8.1 Claude API (Anthropic)

All Claude calls are made server-side through the backend proxy. The frontend never calls the Anthropic API directly.

**Models used:**
- `claude-sonnet-4-20250514` — all primary chat responses (root and child threads)
- `claude-haiku-4-5-20251001` — simplifications, rewrite modes, source citation notes

**Endpoints needed:**
- `POST /api/chat` — primary chat, streamed via SSE
- `POST /api/simplify` — inline rewrite, non-streamed, returns text directly
- `POST /api/cite` — source annotation note generation, non-streamed

### 8.2 Tavily API

Called server-side through the backend proxy.

**Endpoint needed:**
- `POST /api/search` — takes `{ query: string }`, returns Tavily results, filtered to top 3

**Tavily parameters to use:**
- `search_depth: "advanced"` — better quality results for research queries
- `max_results: 3`
- `include_answer: false` — we generate our own citation note via Claude
- `include_raw_content: false`

### 8.3 Authentication (Clerk)

- Frontend uses Clerk's React SDK (`@clerk/clerk-react`) for the sign-in UI and session management.
- Every backend API call includes a Clerk JWT in the `Authorization` header.
- Backend validates the JWT using Clerk's Node.js SDK before processing any request.
- User ID from the JWT is used for rate limiting tracking (even though no data is stored, abuse prevention is needed).

---

## 9. Prompt Design

Good prompts are as important as good code in this application. They must be version-controlled, documented, and tested like any other module.

All prompts live in `src/prompts/` as TypeScript template functions that accept parameters and return complete prompt strings. They are never written inline in API calls.

### 9.1 Root Thread System Prompt

Used for: all messages in a depth-0 thread.

```
You are a research assistant helping a user explore a complex topic in depth.

Write your responses as well-structured, readable prose. Use clear paragraph 
breaks. Define technical terms inline when first introduced. When you reference 
a concept that warrants deeper explanation, write it as a clear, self-contained 
paragraph — the user may branch off it for a focused sub-conversation.

Do not use excessive bullet points. Prefer paragraphs. Use headers only if the 
response is long and benefits from clear sectioning.

Your goal is to give a response the user can read carefully, select specific 
parts of, and explore further. Write for depth and clarity.
```

### 9.2 Child Thread System Prompt

Used for: all messages in threads at depth ≥ 1.

```
You are helping a user go deeper on a specific part of a larger explanation.

Context:
- Root topic: {{rootTopic}}
- Parent explanation (abbreviated): {{parentMessageSummary}}
- The text the user selected to explore: "{{anchorText}}"
- Current depth in the conversation tree: {{depth}} of 5

Stay focused on the selected text and its immediate conceptual neighborhood. 
Do not re-explain the full parent context unless directly necessary. 
The user already has that context — they are here to understand this 
specific thing more deeply.

Write in clear, focused prose. Be thorough on this one concept. The user 
will return to the parent explanation after this conversation.
```

### 9.3 Simplify / Rewrite Prompt

Used for: all four modes of the Simplify action.

```
Rewrite the following text {{mode_instruction}}.

Rules:
- Preserve all factual content. Do not add or remove information.
- Match the approximate length of the original (±20%).
- Do not include any preamble, explanation, or meta-commentary.
- Return only the rewritten text.

Text to rewrite:
"{{selectedText}}"
```

Mode instructions:
- Simpler: `in plain language for a general audience with no assumed technical background`
- Give an example: `by adding a concrete, real-world example that illustrates the concept. Append the example after the original text.`
- Use an analogy: `using an analogy that captures the core idea in familiar terms`
- More technical: `using precise technical terminology appropriate for an expert in the field`

### 9.4 Source Citation Note Prompt

Used for: generating the inline citation note after Tavily returns results.

```
You are given an AI-generated claim and search results from the web.
Write a 1–2 sentence citation note that does one of the following:
- Confirms the claim with supporting evidence from the sources
- Nuances the claim with additional context
- Corrects the claim if the sources indicate it is inaccurate

Rules:
- Be direct and factual. No preamble.
- Reference the source by domain name only (e.g., "According to nature.com...").
- Do not reproduce text from the sources directly.
- Return only the citation note. Nothing else.

Claim: "{{selectedText}}"

Sources:
{{sources}}
```

### 9.5 Thread Auto-Title Generation

Used for: naming a new child thread at creation time. Client-side, uses a simple heuristic — not an API call.

Algorithm:
1. Take the anchor text.
2. Strip leading/trailing whitespace and punctuation.
3. Take the first sentence if the anchor text is multiple sentences.
4. Return the first 6 words followed by `...` if longer.

This is deterministic and instant. Reserve API calls for substantive generation tasks.

---

## 10. Folder Structure

```
deepdive-chat/
│
├── README.md
├── PROJECT.md                         ← this document
├── .env.example                       ← template for required env vars
├── .gitignore
│
├── frontend/                          ← React + Vite application
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── index.html
│   │
│   ├── src/
│   │   ├── main.tsx                   ← app entry, Clerk provider, router
│   │   ├── App.tsx                    ← root component, auth guard
│   │   │
│   │   ├── types/
│   │   │   └── index.ts               ← all TypeScript interfaces (Session, Thread, Message, etc.)
│   │   │
│   │   ├── store/
│   │   │   ├── sessionStore.ts        ← Zustand store: thread tree, active thread, UI state
│   │   │   └── selectors.ts           ← derived state selectors (currentThread, threadAncestry, etc.)
│   │   │
│   │   ├── prompts/
│   │   │   ├── rootThread.ts
│   │   │   ├── childThread.ts
│   │   │   ├── simplify.ts
│   │   │   └── citationNote.ts
│   │   │
│   │   ├── api/
│   │   │   ├── client.ts              ← base fetch wrapper with auth headers
│   │   │   ├── chat.ts                ← /api/chat SSE streaming logic
│   │   │   ├── simplify.ts            ← /api/simplify call
│   │   │   └── search.ts              ← /api/search (Tavily) call
│   │   │
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── AppShell.tsx       ← outer layout: breadcrumb + left spine + main area + input
│   │   │   │   ├── BreadcrumbBar.tsx
│   │   │   │   └── LeftSpine.tsx
│   │   │   │
│   │   │   ├── thread/
│   │   │   │   ├── ThreadView.tsx     ← animated container for a single thread
│   │   │   │   ├── MessageList.tsx    ← scrollable message list, restores scroll position
│   │   │   │   ├── MessageItem.tsx    ← renders one message (user or assistant)
│   │   │   │   ├── AssistantMessage.tsx ← markdown rendering + annotation overlays + gutter
│   │   │   │   ├── UserMessage.tsx
│   │   │   │   └── ChatInput.tsx      ← message input bar, fixed to bottom
│   │   │   │
│   │   │   ├── selection/
│   │   │   │   ├── SelectionManager.tsx  ← handles mouseup, paragraph cap enforcement
│   │   │   │   └── ActionBubble.tsx      ← floating bubble with 3 actions
│   │   │   │
│   │   │   ├── annotations/
│   │   │   │   ├── AnnotatedText.tsx     ← renders message content with inline annotations
│   │   │   │   ├── CitationBlock.tsx     ← collapsible source card injected below paragraph
│   │   │   │   └── RewriteToggle.tsx    ← original ↔ rewrite toggle UI
│   │   │   │
│   │   │   ├── leads/
│   │   │   │   ├── GutterColumn.tsx      ← right gutter container, positions leads by paragraph
│   │   │   │   ├── ChildLead.tsx         ← single lead tag with hover preview
│   │   │   │   └── LeadPreviewCard.tsx   ← hover preview showing anchor text + first exchange
│   │   │   │
│   │   │   └── ui/
│   │   │       ├── Spinner.tsx
│   │   │       ├── Tooltip.tsx
│   │       └── ColorPip.tsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useTextSelection.ts    ← encapsulates selection state and paragraph cap logic
│   │   │   ├── useThreadNavigation.ts ← navigate(), goBack(), transition direction logic
│   │   │   ├── useStreamingChat.ts    ← SSE connection management, token-by-token state updates
│   │   │   └── useChildLeads.ts      ← derives lead positions from message paragraph layout
│   │   │
│   │   └── utils/
│   │       ├── threadTitle.ts         ← auto-title generation from anchor text
│   │       ├── accentColor.ts         ← color assignment from 8-color palette
│   │       └── paragraphIndex.ts      ← maps DOM paragraph positions to message content index
│   │
│   └── tests/
│       ├── unit/                      ← Vitest unit tests
│       └── integration/               ← Playwright component tests
│
├── backend/                           ← Node.js + Express proxy
│   ├── package.json
│   ├── tsconfig.json
│   │
│   ├── src/
│   │   ├── index.ts                   ← server entry, middleware, route mounting
│   │   ├── middleware/
│   │   │   ├── auth.ts                ← Clerk JWT validation
│   │   │   └── rateLimit.ts           ← per-user rate limiting
│   │   │
│   │   ├── routes/
│   │   │   ├── chat.ts                ← POST /api/chat, SSE streaming
│   │   │   ├── simplify.ts            ← POST /api/simplify
│   │   │   └── search.ts              ← POST /api/search
│   │   │
│   │   └── services/
│   │       ├── anthropic.ts           ← Anthropic SDK wrapper
│   │       └── tavily.ts              ← Tavily API wrapper
│   │
│   └── tests/
│       └── integration/               ← Supertest API tests
│
└── shared/                            ← Types shared between frontend and backend
    └── types.ts
```

---

## 11. Testing Strategy

Testing is not optional for a production-ready interface. Each layer of the application has its own testing responsibility.

### 11.1 Unit Tests (Vitest — frontend)

Unit tests cover pure logic functions that have no side effects and no UI dependencies. These are the easiest tests to write and maintain and should be written before or alongside the functions they test.

**What to unit test:**

- `threadTitle.ts` — test that auto-title generation correctly trims sentences, removes punctuation, respects the 6-word limit, and handles edge cases (empty string, single word, very long word)
- `accentColor.ts` — test that colors are assigned in order, cycle correctly after 8, and are deterministic given the same thread creation order
- `paragraphIndex.ts` — test the mapping logic from DOM positions to content paragraph indices
- `selectors.ts` — test derived Zustand selectors: `currentThread`, `threadAncestry`, `isAtMaxDepth`, `siblingThreads`
- All prompt template functions — test that templates correctly interpolate variables, handle missing variables gracefully, and produce non-empty strings

### 11.2 Component Tests (Playwright Component Testing)

Component tests render individual React components in isolation and assert on their rendered output and behavior.

**What to component test:**

- `ActionBubble` — renders correctly with all 3 actions; "Go Deeper" is disabled when `isAtMaxDepth=true`; loading state renders spinner; clicking outside dismisses the bubble
- `BreadcrumbBar` — renders full path correctly at each depth; overflow collapses middle crumbs; clicking a crumb fires navigation with correct thread ID
- `ChildLead` — renders title, message count, color pip; hover shows preview card; click fires navigation
- `AnnotatedText` — renders source annotation correctly; rewrite toggle switches between original and rewritten text; citation block is collapsible
- `LeftSpine` — not rendered at depth 0; rendered at depth ≥ 1 with correct parent title; click fires go-back navigation

### 11.3 Integration Tests (Supertest — backend)

Integration tests call the actual Express route handlers with mocked external services (Anthropic SDK and Tavily are mocked).

**What to integration test:**

- `POST /api/chat` — rejects requests with no auth token; rejects requests with invalid token; calls Anthropic with correct model and system prompt based on thread depth; streams a response
- `POST /api/simplify` — rejects unauthenticated requests; calls Haiku (not Sonnet); returns non-empty text
- `POST /api/search` — rejects unauthenticated requests; calls Tavily with the correct query; returns max 3 results; handles Tavily failure gracefully and returns 502 with descriptive error

### 11.4 End-to-End Tests (Playwright — full app)

E2E tests run against the full application (frontend + backend) in a test environment with real API calls to Claude and Tavily (using test API keys with spending caps).

**Core E2E flows to cover:**

1. **Authentication flow** — unauthenticated user sees login page; authenticated user sees chat interface
2. **Root chat flow** — user sends a message; response streams; text becomes selectable after stream ends
3. **Go Deeper flow** — user selects a paragraph; action bubble appears; clicking Go Deeper creates child thread; interface transitions; breadcrumb updates; left spine appears; returning to parent shows child lead
4. **Find Sources flow** — user selects text; clicks Find Sources; citation block appears inline below the paragraph with source links
5. **Simplify flow** — user selects text; clicks Simplify; chooses "Simpler"; selected text is replaced; toggle to original works
6. **Navigation flow** — navigate 3 levels deep via Go Deeper; use breadcrumb to jump back to root; verify correct thread is shown; re-enter a child thread via its lead

### 11.5 Test Coverage Targets

| Layer | Target |
|---|---|
| Unit (pure functions) | 100% |
| Component tests | All interactive components covered |
| Backend integration | All routes, auth checks, and error paths covered |
| E2E core flows | All 6 core flows passing |

---

## 12. Engineering Practices

### 12.1 TypeScript Everywhere

Both frontend and backend are TypeScript. No implicit `any`. The `shared/types.ts` file is the single source of truth for data model types. If a type is needed in both frontend and backend, it lives in `shared/` and is imported, never duplicated.

### 12.2 Environment Variables

No API keys in code. All secrets are environment variables. The `.env.example` file in the root documents every required variable with a description. Actual `.env` files are in `.gitignore`.

Required variables:
```
# Backend
ANTHROPIC_API_KEY=
TAVILY_API_KEY=
CLERK_SECRET_KEY=

# Frontend
VITE_CLERK_PUBLISHABLE_KEY=
VITE_API_BASE_URL=
```

### 12.3 Atomic Commits

Every commit should represent one coherent change. Follow Conventional Commits format:

```
feat: add action bubble component with three action buttons
fix: restore scroll position when returning to parent thread
test: add unit tests for threadTitle auto-generation
refactor: extract useTextSelection hook from SelectionManager
chore: add Tavily SDK and update environment variable docs
```

Prefixes: `feat`, `fix`, `test`, `refactor`, `chore`, `docs`, `style`

### 12.4 Branch Strategy

```
main          ← always deployable, protected branch
develop       ← integration branch, merged into main at releases
feature/*     ← individual features, branched from develop
fix/*         ← bug fixes, branched from develop (or main for hotfixes)
```

Pull requests to `main` require passing CI (all tests) and at least one review.

### 12.5 Component Design Principles

- **Single responsibility.** Each component does one thing. `AssistantMessage` renders a message. `AnnotatedText` handles annotation overlays. They do not know about each other.
- **Props down, events up.** Components receive data as props and communicate upward via callbacks. Store access is limited to container-level components, not leaf components.
- **No business logic in components.** Logic lives in hooks and utilities. Components render.
- **Explicit loading and error states.** Every component that performs async work must have a visible loading state and a graceful error state. No silent failures.

### 12.6 API Design Principles (Backend)

- All routes return consistent JSON envelopes: `{ data: ..., error: null }` on success, `{ data: null, error: { code: string, message: string } }` on failure.
- HTTP status codes are used correctly. Auth failures are 401. Validation failures are 400. Upstream failures (Anthropic, Tavily) are 502.
- All routes are logged at the request and response level with user ID (no message content logged).

### 12.7 Code Review Checklist

Before any PR is merged:
- [ ] No hardcoded API keys or secrets
- [ ] New components have at least one test
- [ ] New utility functions have unit tests
- [ ] No `console.log` left in production code (use a logger)
- [ ] Error states are handled
- [ ] TypeScript compiles with no errors
- [ ] Passes all existing tests

---

## 13. Versioning & Release Strategy

### v0.1 — Core Shell

**Goal:** A working chat interface with thread creation and navigation. No inline features yet.

Deliverables:
- Authentication with Clerk
- Root thread chat with Claude API streaming
- Text selection and action bubble (Go Deeper only — other buttons disabled but visible)
- Child thread creation and thread slide transitions
- Breadcrumb navigation and left spine
- Child leads appearing in parent message gutters
- Zustand store with full thread tree state

Done when: A user can have a multi-level conversation, navigate back and forth, and see leads in the parent.

---

### v0.2 — Inline Features

**Goal:** The full selection action set works.

Deliverables:
- Find Sources via Tavily with inline citation block injection
- Simplify with four modes and original/rewrite toggle
- Action bubble loading states for all three actions
- Lead hover preview cards

Done when: A user can annotate AI responses with sources and rewrites without leaving the thread.

---

### v0.3 — Polish & Hardening

**Goal:** Stable enough for external users to try.

Deliverables:
- Full E2E test suite passing
- Breadcrumb overflow handling
- Depth limit enforcement (Go Deeper disabled at depth 4)
- Error states for all API failures
- Dark/light theme toggle
- Basic rate limiting on backend
- Deployment pipeline (Vercel + Railway/Render)
- Shareable session link (URL encodes active thread ID so a shared link opens to the right place in the tree)

Done when: External users can be invited to try it without handholding.

---

## 14. Out of Scope — v1

The following are explicitly excluded from v1 to maintain focus:

- **Mobile support** — the text selection and gutter layout do not work at small screen sizes. Defer entirely.
- **Session persistence** — sessions are lost on page refresh. This is intentional. Persistence requires a database and changes the architecture significantly.
- **Sharing full thread trees** — sharing a link opens the correct active thread but does not allow recipients to navigate the full tree.
- **Collaborative sessions** — one user per session.
- **Voice input or output**
- **File or image uploads**
- **PDF or document ingestion**
- **Custom AI personas or system prompt editing by users**
- **Export to markdown or PDF**

---

## 15. Open Questions

These are not blockers for starting development, but must be resolved before v0.3:

1. **Scroll position restoration precision.** When returning to a parent thread, the scroll should restore to where the user was. This depends on whether the DOM has re-rendered correctly before the scroll is applied. The implementation needs to handle this with a `useLayoutEffect` and possibly a short delay.

2. **Child lead vertical positioning.** Leads are anchored to the paragraph they came from. The mapping from a paragraph in the message content to a vertical pixel position in the rendered DOM is non-trivial. This needs a reliable `ResizeObserver`-based approach that recalculates on window resize and content changes.

3. **Re-selection of annotated text.** If a paragraph has already been simplified, can the user select the simplified text and simplify it again? Can they create a child thread from an already-annotated paragraph? Decision needed before building `AnnotatedText`.

4. **Action bubble position when selection is near viewport edges.** The bubble should never be clipped. It needs position correction logic when the selection bounding box is near the top or right edge of the viewport.

---

*Document version: 0.1 — Initial*
*Last updated: project planning phase*
*Status: Ready for development to begin at v0.1*
