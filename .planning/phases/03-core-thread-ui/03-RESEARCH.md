# Phase 3: Core Thread UI - Research

**Researched:** 2026-03-09
**Domain:** React chat UI, Markdown rendering, SSE streaming, navigation chrome
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Message layout**
- Full-width messages — no left/right chat bubbles
- User messages: slightly lighter background (zinc-800 tint) with a small "You" role label above
- AI messages: default zinc-900 background with a small "Gemini" role label above
- No timestamps shown on messages
- Generous spacing: 32px between message blocks
- Role labels are small, muted (zinc-400 or similar), positioned above their message block

**Input bar**
- Auto-expanding textarea: grows from 1 line up to ~4 lines, then scrolls internally
- Send button only — Enter key inserts a newline (not submit). User must click Send.
- Placeholder text: "Ask anything..."
- During streaming: input is disabled, send button changes to a Stop button (user can abort the stream)
- After stream ends or Stop pressed: input re-enables normally

**Streaming visual feedback**
- Pre-first-token (latency gap): animated typing dots (...) appear in the AI message area
- During streaming: blinking underscore (`_`) at the end of the last streamed token
- Text selection disabled (CHAT-06): message renders at ~80% opacity during streaming, returns to full opacity when complete
- Auto-scroll behavior: follows new tokens only if the user is already at the bottom of the thread view; stops auto-scrolling if user has scrolled up

**Navigation chrome**
- Breadcrumb bar: chevron-separated path — `Root > Thread Title > Child Title`
- Root thread breadcrumb label: first few words of the first user message (generic placeholder "New Chat" until first message is sent
- Breadcrumb ancestors are clickable — navigate with slide-left transition
- Overflow: middle crumbs collapse to `...`; clicking `...` shows dropdown of full path (NAV-03)
- Left spine strip (28px): shows colored left border in thread accent color + parent thread title rotated 90° vertically
- Spine visible at thread depth >= 1 only; clicking navigates to parent with slide-left transition
- Slide transitions: 200ms ease-out directional — no extra visual flourishes

### Claude's Discretion
- Exact role label typography (font size, weight, margin)
- Markdown rendering library choice (react-markdown, marked, etc.) and syntax highlighting library (prism, highlight.js, shiki)
- Code block color scheme for dark mode
- Exact opacity value for streaming disabled state (~80% guideline)
- Stop button visual design (icon, color)
- Empty state shown before user sends first message

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CHAT-01 | User can type a message and receive a streaming Gemini response (token-by-token via SSE) | useStreamingChat hook wires existing chat.ts + AbortController to Zustand; createSession must be called on sign-in |
| CHAT-02 | AI responses render as Markdown with full GFM support (headers, bold, lists, code blocks with syntax highlighting) | react-markdown v10 + remark-gfm v4 + react-syntax-highlighter (Prism oneDark) |
| CHAT-03 | User can send follow-up messages in root thread (multi-turn) | Thread message history passed as messages[] array to streamChat; handled by store addMessage |
| CHAT-04 | Child threads support multi-turn conversations | Same ThreadView component renders any thread by activeThreadId; CHAT-03 and CHAT-04 share same implementation path |
| CHAT-05 | Child threads display a context card at top showing anchor text and parent message source | ContextCard component renders thread.anchorText + parentMessageId lookup; visible only when thread.depth >= 1 and anchorText != null |
| CHAT-06 | Text selection disabled on a message while streaming; re-enabled when complete | CSS user-select: none + pointer-events: none on message container when isStreaming === true; opacity ~80% |
| NAV-01 | Persistent breadcrumb bar (48px, top of screen) showing full thread path from root to current | BreadcrumbBar component uses selectThreadAncestry selector; renders chevron-separated crumbs |
| NAV-02 | Each breadcrumb ancestor is clickable and navigates with slide-left transition | onClick calls setActiveThread + triggers slide-left CSS transition; ancestor = any crumb before the last |
| NAV-03 | Middle crumbs collapse to `...` when path overflows; clicking shows dropdown of full path | Measure rendered width vs container width; collapse middle crumbs to ellipsis button with dropdown overlay |
| NAV-04 | Left spine strip (28px) visible at depth >= 1, showing parent title and accent color | SpineStrip component; CSS writing-mode: vertical-rl for rotated text; accent color from parent thread |
| NAV-05 | Clicking left spine navigates to immediate parent with slide-left transition | onClick calls setActiveThread(parentThreadId); same transition mechanism as NAV-02 |
| NAV-06 | All thread navigation uses 200ms ease-out directional slide transitions | CSS translateX transitions on a wrapper div; direction determined by whether we navigate deeper (right) or shallower (left) |
| NAV-07 | Returning to a parent thread restores scroll position | setScrollPosition called on navigation away; scroll restored in useEffect when thread becomes active |
</phase_requirements>

---

## Summary

Phase 3 fills all three AppShell slots — header (BreadcrumbBar), main (ThreadView), footer (ChatInput) — and adds the `useStreamingChat` hook that bridges the existing `streamChat` SSE client to the Zustand store. The phase is heavily UI-focused with no new backend work required.

The primary library decision (discretion area) is the Markdown rendering stack. Research confirms `react-markdown v10` with `remark-gfm v4` is the current standard for GFM-compliant Markdown in React 19. For syntax highlighting inside code blocks, `react-syntax-highlighter` using the Prism light build with `oneDark` theme is the right choice for the zinc dark palette — it uses inline styles which avoids global CSS conflicts with Tailwind v4.

The navigation chrome (breadcrumbs, spine strip, slide transitions) can be implemented entirely with Tailwind v4 utility classes and native CSS transitions — no animation library is needed. The 200ms ease-out slide is a CSS `translateX` transition on a wrapper div, with direction state tracked in a React ref or simple state variable.

**Primary recommendation:** react-markdown v10 + remark-gfm v4 + react-syntax-highlighter/Prism (oneDark) for Markdown; AbortController for stream cancellation; native CSS transitions for navigation slides.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-markdown | ^10.x | Renders Markdown string as React elements | React 19 compatible (v9.0.2+ fixes React 19 types); pure ESM; extensible via remark/rehype plugins |
| remark-gfm | ^4.0.0 | Adds GFM: tables, strikethrough, task lists, footnotes | Required plugin for full GFM; v4 targets remark-parse v11 / remark v15, matching react-markdown v10 internals |
| react-syntax-highlighter | ^15.x | Syntax-highlighted code blocks inside Markdown | Inline styles — no CSS import or Tailwind conflict; Prism build has oneDark for zinc-compatible dark theme |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/react-syntax-highlighter | ^15.x | TypeScript types | Always install alongside react-syntax-highlighter |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-syntax-highlighter | rehype-highlight | rehype-highlight injects CSS class names — requires importing a CSS file which can conflict with Tailwind v4; inline styles simpler for this project |
| react-markdown | marked + DOMPurify | Lower bundle size but requires manual sanitization and custom component injection for code highlighting; more hand-roll work |
| react-markdown | @uiw/react-md-editor | Overkill — includes editor UI; this project only needs rendering |

**Installation:**
```bash
cd frontend && npm install react-markdown remark-gfm react-syntax-highlighter @types/react-syntax-highlighter
```

## Architecture Patterns

### Recommended Project Structure
```
frontend/src/
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx          # Updated: wires BreadcrumbBar + ThreadView + ChatInput
│   │   ├── BreadcrumbBar.tsx     # NAV-01, NAV-02, NAV-03
│   │   └── SpineStrip.tsx        # NAV-04, NAV-05
│   ├── thread/
│   │   ├── ThreadView.tsx        # CHAT-01 through CHAT-06 container
│   │   ├── MessageList.tsx       # Renders ordered message list
│   │   ├── MessageBlock.tsx      # Single message (role label + content)
│   │   ├── MarkdownRenderer.tsx  # CHAT-02: react-markdown + syntax highlighter
│   │   ├── StreamingCursor.tsx   # Blinking underscore + typing dots
│   │   └── ContextCard.tsx       # CHAT-05: anchor text card for child threads
│   └── input/
│       └── ChatInput.tsx         # Auto-expand textarea + Send/Stop button
├── hooks/
│   └── useStreamingChat.ts       # CHAT-01: wires streamChat → Zustand
└── store/
    └── sessionStore.ts           # Existing — no changes needed
```

### Pattern 1: useStreamingChat Hook
**What:** Encapsulates stream lifecycle — creates the AI message in the store, drives chunk updates via `updateMessage`, flips `isStreaming`, and exposes an `abort()` function for the Stop button.
**When to use:** Called from ThreadView/ChatInput when user submits a message.
**Example:**
```typescript
// hooks/useStreamingChat.ts
import { useRef, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { streamChat } from '../api/chat';
import { useSessionStore } from '../store/sessionStore';

export function useStreamingChat() {
  const { getToken } = useAuth();
  const { addMessage, updateMessage, setMessageStreaming, messages, threads, activeThreadId } =
    useSessionStore();
  const abortRef = useRef<(() => void) | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!activeThreadId) return;

      // 1. Add user message
      const userMsg = {
        id: crypto.randomUUID(),
        threadId: activeThreadId,
        role: 'user' as const,
        content: text,
        annotations: [],
        childLeads: [],
        isStreaming: false,
        createdAt: Date.now(),
      };
      addMessage(userMsg);

      // 2. Add empty AI message (streaming placeholder)
      const aiMsgId = crypto.randomUUID();
      addMessage({
        id: aiMsgId,
        threadId: activeThreadId,
        role: 'assistant' as const,
        content: '',
        annotations: [],
        childLeads: [],
        isStreaming: true,
        createdAt: Date.now(),
      });

      // 3. Build history for API (all messages in current thread + new user message)
      const thread = threads[activeThreadId];
      const history = thread.messageIds
        .map((id) => messages[id])
        .filter(Boolean)
        .map((m) => ({ role: m.role, content: m.content }));

      // 4. Stream
      const controller = new AbortController();
      abortRef.current = () => controller.abort();

      await streamChat(
        { messages: history, signal: controller.signal },
        getToken,
        (chunk) => updateMessage(aiMsgId, { content: messages[aiMsgId]?.content + chunk }),
        () => setMessageStreaming(aiMsgId, false),
        (err) => {
          updateMessage(aiMsgId, { content: `Error: ${err}` });
          setMessageStreaming(aiMsgId, false);
        }
      );
      abortRef.current = null;
    },
    [activeThreadId, addMessage, updateMessage, setMessageStreaming, messages, threads, getToken]
  );

  const abort = useCallback(() => {
    abortRef.current?.();
  }, []);

  return { sendMessage, abort };
}
```
Note: `streamChat` in `chat.ts` currently does not accept a `signal` parameter — the hook will need to pass `signal` and `chat.ts` will need a one-line addition to the fetch call: `signal: body.signal`. The signal is passed through cleanly; the AbortError is caught by the existing try-catch.

### Pattern 2: MarkdownRenderer with Code Highlighting
**What:** Renders a Markdown string with GFM support and syntax-highlighted fenced code blocks. Custom `code` component intercepts fenced blocks and renders them via react-syntax-highlighter.
**When to use:** Inside MessageBlock for assistant messages. User messages can optionally use plain text.
**Example:**
```typescript
// components/thread/MarkdownRenderer.tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter/dist/esm/prism-light';
import oneDark from 'react-syntax-highlighter/dist/esm/styles/prism/one-dark';

// Register only needed languages to keep bundle lean
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';

SyntaxHighlighter.registerLanguage('tsx', tsx);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('json', json);

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          const isBlock = !!match;
          return isBlock ? (
            <SyntaxHighlighter
              style={oneDark}
              language={match[1]}
              PreTag="div"
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code
              className="bg-zinc-800 text-zinc-200 rounded px-1 py-0.5 text-sm font-mono"
              {...props}
            >
              {children}
            </code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
```

### Pattern 3: Auto-Scroll with User-Scroll Detection
**What:** Tracks whether the user is at the bottom of the scroll container. Scrolls automatically on new content only when at the bottom; does nothing if user has scrolled up.
**When to use:** Inside ThreadView, triggered on every streaming chunk.
**Example:**
```typescript
// Inside ThreadView.tsx
const scrollRef = useRef<HTMLDivElement>(null);
const bottomAnchorRef = useRef<HTMLDivElement>(null);
const isAtBottomRef = useRef(true);

// Track user scroll position
useEffect(() => {
  const el = scrollRef.current;
  if (!el) return;
  const handleScroll = () => {
    const threshold = 50; // px from bottom counts as "at bottom"
    isAtBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  };
  el.addEventListener('scroll', handleScroll, { passive: true });
  return () => el.removeEventListener('scroll', handleScroll);
}, []);

// Auto-scroll on new content, only if at bottom
useEffect(() => {
  if (isAtBottomRef.current) {
    bottomAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
  }
}, [messages]); // re-runs on every chunk update
```

### Pattern 4: Auto-Expanding Textarea
**What:** Textarea that grows from 1 line to ~4 lines maximum, then scrolls internally. No external library needed.
**When to use:** ChatInput component.
**Example:**
```typescript
// Inside ChatInput.tsx
const textareaRef = useRef<HTMLTextAreaElement>(null);
const LINE_HEIGHT = 24; // px — matches leading-6
const MAX_ROWS = 4;

const handleInput = () => {
  const el = textareaRef.current;
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${Math.min(el.scrollHeight, LINE_HEIGHT * MAX_ROWS)}px`;
};
```

### Pattern 5: CSS Slide Transition (200ms ease-out)
**What:** Directional slide transition between threads. Going deeper slides content in from the right; going back (up the tree) slides content in from the left. Implemented with CSS `translateX` + `transition`, no animation library.
**When to use:** ThreadView wrapper div, triggered by `activeThreadId` change.
**Example:**
```typescript
// Track slide direction in a ref
const slideDirectionRef = useRef<'left' | 'right'>('left');

// On navigate:
// - Going to parent/ancestor → slideDirectionRef.current = 'left'
// - Going to child → slideDirectionRef.current = 'right' (Phase 4)

// CSS classes (Tailwind v4 arbitrary values):
// Enter from right: 'translate-x-full' → 'translate-x-0'
// Enter from left:  '-translate-x-full' → 'translate-x-0'
// transition: 'transition-transform duration-200 ease-out'
```
Phase 3 only uses slide-left (navigating to ancestors). The right-slide direction for child navigation is used in Phase 4.

### Pattern 6: Streaming Cursor and Typing Dots
**What:** Typing dots animation for pre-first-token latency. Blinking underscore appended to streamed content. Both are CSS animations, no JS timers.
**When to use:** Inside StreamingCursor component, rendered conditionally in MessageBlock.
**Example:**
```css
/* Typing dots — three animated dots bouncing with staggered delay */
@keyframes bounce-dot {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}

/* Blinking underscore */
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
```
The condition: show typing dots when `isStreaming === true && content === ''`; show blinking cursor when `isStreaming === true && content !== ''`.

### Anti-Patterns to Avoid
- **Storing AbortController in React state:** Causes re-renders. Store in a `useRef` instead.
- **Calling `updateMessage` with full content string built from scratch each chunk:** Leads to O(n^2) string concatenation. Instead, store accumulated content in a ref during streaming and call `updateMessage` with the ref value, OR use `updateMessage` with a functional patch that appends to existing content (see hook example above). The existing `updateMessage` implementation spreads the patch — it does NOT accumulate. The hook must track accumulated text itself.
- **Using `EventSource` for SSE:** Cannot send Authorization headers. The project already correctly uses `fetch` + `ReadableStream`.
- **Mounting react-syntax-highlighter with the full build:** Bundles all languages (500+ kb). Always use the light build (`prism-light`) and register only needed languages.
- **Setting `overflow: hidden` on the scroll container (ThreadView main area):** Breaks scroll-position restoration and auto-scroll. Use `overflow-y: auto`.
- **Building breadcrumb overflow detection on mount only:** Container width can change. Use a `ResizeObserver` on the breadcrumb container to re-evaluate overflow.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| GFM Markdown parsing + rendering | Custom regex HTML | react-markdown + remark-gfm | Handles edge cases: nested lists, tables, escaped chars, XSS |
| Syntax highlighting | Custom tokenizer | react-syntax-highlighter (Prism) | 100+ languages, maintained, zero CSS-global side effects via inline styles |
| SSE stream cancellation | Manual flag variable | AbortController + fetch signal | Race conditions in flag approach; AbortController is the web standard |

**Key insight:** Markdown rendering has a long tail of correctness edge cases (nested code spans, GFM table alignment, link titles with quotes) that make custom solutions unreliable within a sprint. react-markdown with remark-gfm is battle-tested against the CommonMark and GFM test suites.

## Common Pitfalls

### Pitfall 1: Content Accumulation in Streaming
**What goes wrong:** Each `onChunk` call receives only the new token, not the full text so far. If `updateMessage` is called with just the chunk, the message content will always be the last token only.
**Why it happens:** The existing `updateMessage` implementation merges a `Partial<Message>` patch — it does not append string fields.
**How to avoid:** In `useStreamingChat`, maintain an accumulator ref: `const accRef = useRef('')`. In `onChunk`, do `accRef.current += chunk; updateMessage(id, { content: accRef.current })`. Reset the ref when a new stream starts.
**Warning signs:** AI message shows only the last word/token of the response.

### Pitfall 2: createSession Not Called on Sign-In
**What goes wrong:** `activeThreadId` is null, `threads` is empty — nothing renders, send does nothing.
**Why it happens:** `createSession(userId)` must be called after Clerk confirms sign-in. The existing `App.tsx` wires `clearSession` on sign-out but does not yet call `createSession` on sign-in.
**How to avoid:** In `App.tsx` SignedIn branch, add a `useEffect` that calls `createSession(userId)` when `isSignedIn === true && session === null`.
**Warning signs:** ThreadView renders empty, ChatInput submit does nothing.

### Pitfall 3: isStreaming Flag Left True on Stream Abort
**What goes wrong:** User clicks Stop — stream aborts — but `isStreaming` stays `true` permanently, locking the input.
**Why it happens:** The `fetch` rejects with an `AbortError` when aborted. If the `onError` callback is not called on abort, `setMessageStreaming(false)` never runs.
**How to avoid:** In `streamChat` (chat.ts) or in the hook's catch block, check `error.name === 'AbortError'` and still call `onDone()` (or handle it as a clean stop, not an error).
**Warning signs:** After clicking Stop, the textarea remains disabled and the Send button doesn't reappear.

### Pitfall 4: Scroll Position Restoration Firing Too Early
**What goes wrong:** `scrollRef.current.scrollTop = savedPosition` is set in a `useEffect` triggered by `activeThreadId` change, but the DOM hasn't rendered the messages yet. Scroll goes to 0.
**Why it happens:** React renders are async; the scroll container may not have its full height yet when the effect fires.
**How to avoid:** Use `requestAnimationFrame` inside the effect before setting `scrollTop`, or use `useLayoutEffect` with a brief delay. A `requestAnimationFrame` is usually sufficient.
**Warning signs:** Navigating back to a parent thread always lands at the top.

### Pitfall 5: Breadcrumb Title Before First Message
**What goes wrong:** Breadcrumb shows empty string or "Root" instead of the intended "New Chat" placeholder.
**Why it happens:** `thread.title` is set to `'Root'` in `createSession`. The dynamic title (first few words of first user message) needs to be updated when the first message is sent.
**How to avoid:** In `useStreamingChat` or in `ChatInput`, after `addMessage` for the user's first message (when `thread.messageIds.length === 0`), call a store action or `updateMessage`-equivalent to update `thread.title`. The store has no `updateThread` action yet — this will need to be added.
**Warning signs:** Breadcrumb always shows "Root" even after first message.

### Pitfall 6: react-markdown Re-Rendering on Every Chunk
**What goes wrong:** Full Markdown re-parse on every streaming token causes noticeable lag for long responses.
**Why it happens:** react-markdown is not cheap to run. Each chunk change triggers a full re-render.
**How to avoid:** Wrap `MarkdownRenderer` in `React.memo`. During streaming, the content prop changes frequently — memo won't prevent re-renders triggered by content changes, but it prevents re-renders from parent re-renders unrelated to the message content. For very long responses, consider only rendering Markdown when `isStreaming === false` and showing plain text during streaming.
**Warning signs:** Noticeable jank or frame drops when receiving long streamed responses.

## Code Examples

Verified patterns from official sources and existing codebase:

### Multi-Turn History Construction
```typescript
// Source: existing chat.ts interface — messages array expected by /api/chat
const thread = threads[activeThreadId];
const history = thread.messageIds
  .map((id) => messages[id])
  .filter(Boolean)
  .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', content: m.content }));
// Note: Gemini API uses 'model' not 'assistant' for AI role.
// Verify what the backend /api/chat route expects — if it normalizes roles, use 'assistant'.
// The existing SseEvent type + backend routes should clarify this.
```

### Scroll Position Save/Restore
```typescript
// Save before navigating away
const saveScroll = (threadId: string) => {
  const el = scrollRef.current;
  if (el) setScrollPosition(threadId, el.scrollTop);
};

// Restore after navigating to thread
useEffect(() => {
  requestAnimationFrame(() => {
    const el = scrollRef.current;
    if (el && thread) el.scrollTop = thread.scrollPosition;
  });
}, [activeThreadId]);
```

### Left Spine Strip — Vertical Text
```tsx
// 28px wide strip, colored border, vertically rotated text
<div
  className="w-7 flex-shrink-0 flex items-center justify-center cursor-pointer"
  style={{ borderLeft: `3px solid ${parentThread.accentColor}` }}
  onClick={() => navigateToParent()}
>
  <span
    className="text-xs text-zinc-400 truncate"
    style={{
      writingMode: 'vertical-rl',
      textOrientation: 'mixed',
      transform: 'rotate(180deg)',
      maxHeight: '120px',
    }}
  >
    {parentThread.title}
  </span>
</div>
```

### Streaming State — Input Disable + Stop Button
```tsx
// ChatInput.tsx
<button
  onClick={isStreaming ? onStop : onSend}
  className={`px-3 py-1.5 rounded text-sm font-medium ${
    isStreaming
      ? 'bg-zinc-600 hover:bg-zinc-500 text-zinc-200'
      : 'bg-blue-600 hover:bg-blue-500 text-white'
  }`}
>
  {isStreaming ? 'Stop' : 'Send'}
</button>
<textarea
  disabled={isStreaming}
  className={isStreaming ? 'opacity-50 cursor-not-allowed' : ''}
/>
```

### CHAT-05: Context Card for Child Threads
```tsx
// ContextCard.tsx — shown at top of ThreadView when thread.depth >= 1
{thread.anchorText && (
  <div className="mx-auto max-w-[720px] mb-8 px-4 py-3 bg-zinc-800 border-l-4 rounded-r"
    style={{ borderColor: thread.accentColor }}>
    <p className="text-xs text-zinc-400 mb-1">Branched from parent thread</p>
    <p className="text-sm text-zinc-200 italic">"{thread.anchorText}"</p>
  </div>
)}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| @google/generative-ai | @google/genai v1.x | Nov 2025 EOL | Already handled in Phase 1 — no impact on Phase 3 |
| EventSource for SSE | fetch + ReadableStream | Ongoing | Already handled in Phase 2 — no impact |
| react-syntax-highlighter full build | Prism light build + registerLanguage | react-syntax-highlighter v15 | Reduces bundle from ~1MB to ~50-100kb for common languages |
| react-markdown v8 (requires React 18 types workaround) | react-markdown v9+ (v9.0.2 fixes React 19 types natively) | Jan 2025 | No workaround needed — install v10 directly |

**Deprecated/outdated:**
- `@google/generative-ai`: EOL Nov 2025 — already replaced by `@google/genai` in Phase 1
- react-markdown v8: Predates React 19 type fixes — use v9.0.2+ (currently v10.x)

## Open Questions

1. **Role name normalization: 'assistant' vs 'model' for Gemini API**
   - What we know: The Gemini API uses `'model'` as the role name for AI turns. The existing `streamChat` body accepts `Array<{ role: string; content: string }>`. The backend route `/api/chat` may normalize this.
   - What's unclear: Whether the backend normalizes `'assistant'` → `'model'` before passing to Gemini, or whether the frontend must send `'model'`.
   - Recommendation: Read `backend/src/routes/chat.ts` at plan time to confirm. If normalization happens in the backend, the frontend should use `'assistant'` for consistency with the store types. If not, the hook must map `assistant` → `model` when building history.

2. **AbortController signal threading into chat.ts**
   - What we know: `chat.ts streamChat` currently has no `signal` parameter. AbortController is the right approach.
   - What's unclear: Whether the signal should be part of the `body` argument (breaking change to the interface) or a separate 5th parameter.
   - Recommendation: Add `signal?: AbortSignal` as an optional property of the `body` parameter object to minimize the API surface change. The task plan should include a one-line update to `chat.ts`.

3. **Thread title update action**
   - What we know: `sessionStore.ts` has no `updateThread` action. Breadcrumb dynamic title requires updating `thread.title` after first message.
   - What's unclear: Whether to add a full `updateThread` action or a targeted `setThreadTitle` action.
   - Recommendation: Add `setThreadTitle(threadId: string, title: string)` as a minimal targeted action. The first 6 words of the first user message become the title, capped to a reasonable character length.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x with jsdom + @testing-library/react 16 |
| Config file | `frontend/vitest.config.ts` |
| Quick run command | `cd frontend && npx vitest run tests/unit/ --reporter=verbose` |
| Full suite command | `cd frontend && npx vitest run --reporter=verbose` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CHAT-01 | sendMessage adds user + AI messages to store; AI message gets content from chunks | unit | `cd frontend && npx vitest run tests/unit/useStreamingChat.test.ts -x` | Wave 0 |
| CHAT-02 | MarkdownRenderer renders headings, bold, code blocks, GFM tables | unit | `cd frontend && npx vitest run tests/unit/MarkdownRenderer.test.tsx -x` | Wave 0 |
| CHAT-03 | sendMessage passes full thread history to streamChat | unit (mock) | `cd frontend && npx vitest run tests/unit/useStreamingChat.test.ts -x` | Wave 0 |
| CHAT-04 | Same as CHAT-03 — child thread multi-turn uses same hook | unit | same file | Wave 0 |
| CHAT-05 | ContextCard renders anchor text for depth >= 1 threads | unit | `cd frontend && npx vitest run tests/unit/ContextCard.test.tsx -x` | Wave 0 |
| CHAT-06 | MessageBlock has user-select-none + reduced opacity when isStreaming | unit | `cd frontend && npx vitest run tests/unit/MessageBlock.test.tsx -x` | Wave 0 |
| NAV-01 | BreadcrumbBar renders correct crumb labels from ancestry | unit | `cd frontend && npx vitest run tests/unit/BreadcrumbBar.test.tsx -x` | Wave 0 |
| NAV-02 | Clicking ancestor crumb calls setActiveThread with correct id | unit | same file | Wave 0 |
| NAV-03 | BreadcrumbBar collapses middle crumbs when ancestry.length > 3 | unit | same file | Wave 0 |
| NAV-04 | SpineStrip renders when thread.depth >= 1 | unit | `cd frontend && npx vitest run tests/unit/SpineStrip.test.tsx -x` | Wave 0 |
| NAV-05 | Clicking SpineStrip calls setActiveThread with parentThreadId | unit | same file | Wave 0 |
| NAV-06 | Slide direction state changes correctly on ancestor vs child navigate | unit | `cd frontend && npx vitest run tests/unit/ThreadView.test.tsx -x` | Wave 0 |
| NAV-07 | setScrollPosition called when navigating away; scrollTop restored on navigate back | unit | same file | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd frontend && npx vitest run tests/unit/ --reporter=verbose`
- **Per wave merge:** `cd frontend && npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `frontend/tests/unit/useStreamingChat.test.ts` — covers CHAT-01, CHAT-03, CHAT-04
- [ ] `frontend/tests/unit/MarkdownRenderer.test.tsx` — covers CHAT-02
- [ ] `frontend/tests/unit/MessageBlock.test.tsx` — covers CHAT-06
- [ ] `frontend/tests/unit/ContextCard.test.tsx` — covers CHAT-05
- [ ] `frontend/tests/unit/BreadcrumbBar.test.tsx` — covers NAV-01, NAV-02, NAV-03
- [ ] `frontend/tests/unit/SpineStrip.test.tsx` — covers NAV-04, NAV-05
- [ ] `frontend/tests/unit/ThreadView.test.tsx` — covers NAV-06, NAV-07

## Sources

### Primary (HIGH confidence)
- github.com/remarkjs/react-markdown — confirmed v10.x, React 19 compatible (v9.0.2+ fixes React 19 types), remark-gfm v4 required
- github.com/react-syntax-highlighter/react-syntax-highlighter — confirmed Prism light build pattern, oneDark theme available
- Existing codebase (chat.ts, sessionStore.ts, selectors.ts, AppShell.tsx, types/index.ts) — read directly; all interfaces confirmed
- MDN Web APIs — AbortController is the standard for fetch cancellation

### Secondary (MEDIUM confidence)
- remarkjs.github.io/react-markdown/ — official docs confirmed plugin pattern (remarkPlugins, custom code component)
- tuffstuff9.hashnode.dev — streaming-aware auto-scroll pattern (isAtBottom threshold detection)
- css-tricks.com — scrollHeight-based textarea auto-resize technique (well-established pattern)

### Tertiary (LOW confidence)
- WebSearch aggregated results on React 19 + react-markdown compatibility — corroborated by changelog reference but not independently verified against package.json peerDeps

## Metadata

**Confidence breakdown:**
- Standard stack (react-markdown + remark-gfm + react-syntax-highlighter): HIGH — confirmed library identities, versions, plugin patterns from official sources
- Architecture (component structure, hook design): HIGH — derived directly from existing codebase interfaces which are locked
- Pitfalls: HIGH — 4 of 6 pitfalls are derived from reading the actual source code and spotting real gaps (no createSession call in App.tsx, no updateThread action in store, updateMessage merge semantics, AbortError handling)
- NAV patterns (slide transitions, spine strip): MEDIUM — CSS approach confirmed from Tailwind docs; exact implementation is straightforward but not battle-tested against this codebase

**Research date:** 2026-03-09
**Valid until:** 2026-06-09 (react-markdown and react-syntax-highlighter are stable; Tailwind v4 is current)
