# Phase 2: Frontend Foundation - Research

**Researched:** 2026-03-09
**Domain:** React/Vite scaffold, Clerk auth, Zustand state, SSE client, Tailwind CSS v4
**Confidence:** HIGH (core stack), MEDIUM (Tailwind v4 dark mode variant syntax)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Unauthenticated visitors land on a hardcoded **static demo chat** — no API calls, content baked into code
- Demo chat is **read-only**: chat input bar is visible but disabled, with an inline "Sign in to start your own conversation" message and sign-in button
- Guests cannot create real chat sessions — demo view only
- Sign-in button lives in the **top-right header** at all times
- AUTH-03 is revised: guests can view a demo but must sign in to interact
- Sign-in happens in a **modal overlay** on top of the demo chat using Clerk's embedded `<SignIn>` component
- No `/sign-in` route needed — auth is in-place
- Google OAuth redirect returns to the same page; modal closes after successful auth
- After signing in: modal closes, demo disappears, user sees a **blank chat interface** ready for their first message (fresh empty Zustand store)
- On logout (AUTH-05): all in-memory state cleared, user returns to demo chat view
- **Fully implemented actions** — not stubs. All actions from the data model are working:
  - `createSession`, `clearSession`
  - `createThread`, `setActiveThread`
  - `addMessage`, `updateMessage` (for streaming token appends), `setMessageStreaming`
  - `addChildLead`, `addAnnotation`, `setScrollPosition`
  - Selectors: `currentThread`, `threadAncestry`, `isAtMaxDepth`
- Flat `Record<id, Thread>` and `Record<id, Message>` shape — no nested tree mutations
- No localStorage persistence in v1
- Phase 2 builds `frontend/src/api/chat.ts` with `fetch` + `ReadableStream` streaming logic
- The `useStreamingChat` React hook lives in Phase 3 (not Phase 2)
- Also build `frontend/src/api/client.ts`, `simplify.ts`, and `search.ts` stubs

### Claude's Discretion
- ESLint config, Prettier, path aliases (@/ imports), Vite plugins — standard sensible defaults
- Tailwind dark mode strategy (class vs media)
- Vite proxy config for dev (to avoid CORS hitting the backend at localhost:3000)

### Deferred Ideas (OUT OF SCOPE)
- About page (user bio + project description) — add to backlog, could be Phase 2.1 or Phase 6
- AUTH-03 requirement update: REQUIREMENTS.md text says "full chat interface" for guests — updating the doc is deferred (noted here as revision needed)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can sign up and sign in with email/password via Clerk | Clerk `<SignIn>` + `<SignUp>` components with modal mode; `ClerkProvider` wraps app |
| AUTH-02 | User can sign in with Google OAuth via Clerk | Clerk handles Google OAuth natively via Dashboard config; no extra frontend code needed beyond `<SignIn>` |
| AUTH-03 (revised) | Unauthenticated users see a read-only demo chat; must sign in to interact | `<SignedIn>` / `<SignedOut>` conditional rendering; hardcoded demo data in code |
| AUTH-05 | Logout clears all in-memory session state (thread tree, messages, annotations) | Clerk `signOut()` triggers; Zustand `clearSession` action called in response via `useAuth` hook |
</phase_requirements>

---

## Summary

Phase 2 creates the React/Vite frontend from a clean scaffold. The primary technical domains are: Vite project setup with TypeScript + Tailwind CSS v4, Clerk React SDK integration for email/password and Google OAuth, conditional rendering of a demo chat vs. authenticated chat using Clerk's `<SignedIn>`/`<SignedOut>` components, a fully-typed and fully-implemented Zustand store matching the flat normalized data model from PROJECT.md Section 7, and an SSE client module in `frontend/src/api/`.

The architecture decision that shapes the most code is the modal-based auth flow: there is no `/sign-in` route. Clerk's `<SignIn>` component renders in a modal overlay controlled by local React state (a boolean `isModalOpen`). After successful auth, `<SignedIn>` renders the real chat shell, `<SignedOut>` renders the demo chat. The Zustand store is initialized with an empty state and `clearSession` is wired to Clerk's `signOut` callback to ensure logout zeroes all in-memory state.

The SSE client in `api/chat.ts` uses `fetch` + `ReadableStream` (not `EventSource`) because `EventSource` cannot send custom headers and the backend requires a Clerk JWT on every request. The base `api/client.ts` accepts a `getToken` async function as a parameter (passed from the calling code that has access to Clerk's `useAuth` hook) rather than calling the hook internally, which would violate React's rules of hooks.

**Primary recommendation:** Use `@clerk/clerk-react` with `<SignedIn>`/`<SignedOut>` for routing between demo and authenticated views; use Zustand's `create<StoreType>()()` curried pattern for full TypeScript inference; use `@tailwindcss/vite` plugin (not PostCSS) for Tailwind v4.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | ^19.0.0 | UI framework | Project decision; locked |
| react-dom | ^19.0.0 | DOM renderer | Paired with react |
| vite | ^6.x | Build tool / dev server | Project decision; fastest HMR, first-class TypeScript |
| typescript | ^5.x | Language | Project-wide strict TypeScript |
| @clerk/clerk-react | ^5.x | Auth components + hooks | Project decision; handles Clerk JWT, Google OAuth, session |
| zustand | ^5.x | State management | Project decision; minimal boilerplate, flat Record shape fits well |
| tailwindcss | ^4.x | Styling | Project decision; utility-first |
| @tailwindcss/vite | ^4.x | Vite plugin for Tailwind v4 | Required for v4 — replaces PostCSS setup |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zustand/react/shallow | (included) | `useShallow` for multi-field selectors | Prevent re-renders when selecting multiple store fields |
| @testing-library/react | ^16.x | Component testing | All component-level Vitest tests |
| @testing-library/user-event | ^14.x | Simulate user interactions | Click, type, etc. in tests |
| @testing-library/jest-dom | ^6.x | DOM matchers | `toBeInTheDocument`, `toBeDisabled`, etc. |
| vitest | ^3.x | Test runner | Native Vite integration; Jest-compatible API |
| jsdom | ^26.x | Browser DOM simulation | Vitest `environment: 'jsdom'` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@tailwindcss/vite` plugin | PostCSS + autoprefixer | PostCSS is the v3 approach; v4 Vite plugin is simpler and faster — use the plugin |
| Zustand flat Record store | React Context | Context causes component-tree rerenders; Zustand selector subscriptions are more targeted |
| `fetch` + `ReadableStream` | `EventSource` | `EventSource` cannot send Authorization headers — cannot use for authenticated SSE |

**Installation:**
```bash
# In frontend/ directory
npm create vite@latest . -- --template react-ts
npm install @clerk/clerk-react zustand
npm install -D tailwindcss @tailwindcss/vite
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

---

## Architecture Patterns

### Recommended Project Structure

Matches PROJECT.md Section 10 exactly:

```
frontend/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── vitest.config.ts          (or inline in vite.config.ts)
├── src/
│   ├── main.tsx              ← ClerkProvider wraps everything
│   ├── App.tsx               ← SignedIn / SignedOut routing
│   ├── types/
│   │   └── index.ts          ← Thread, Message, Annotation, ChildLead, Session interfaces
│   ├── store/
│   │   ├── sessionStore.ts   ← Zustand store with all actions
│   │   └── selectors.ts      ← currentThread, threadAncestry, isAtMaxDepth
│   ├── api/
│   │   ├── client.ts         ← base fetch wrapper; accepts getToken param
│   │   ├── chat.ts           ← SSE streaming via fetch + ReadableStream
│   │   ├── simplify.ts       ← stub: POST /api/simplify
│   │   └── search.ts         ← stub: POST /api/search
│   ├── components/
│   │   ├── layout/
│   │   │   └── AppShell.tsx  ← outer layout shell (Phase 2: skeleton only)
│   │   └── demo/
│   │       └── DemoChat.tsx  ← hardcoded static demo; disabled input with CTA
│   └── ...hooks, utils, prompts (stubs or empty dirs)
└── tests/
    └── unit/
```

### Pattern 1: Clerk Provider + Modal Auth (no route)

**What:** `ClerkProvider` at root. `<SignedIn>` renders the real app shell. `<SignedOut>` renders the demo chat. A modal trigger (local state boolean) shows `<SignIn>` as an overlay.

**When to use:** This is the only pattern for this project. No `/sign-in` route.

```typescript
// Source: https://clerk.com/docs/quickstarts/react
// main.tsx
import { ClerkProvider } from '@clerk/clerk-react';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  </StrictMode>
);

// App.tsx
import { SignedIn, SignedOut } from '@clerk/clerk-react';

export function App() {
  return (
    <>
      <SignedIn>
        <AppShell />   {/* real authenticated chat interface */}
      </SignedIn>
      <SignedOut>
        <DemoChat />   {/* hardcoded read-only demo */}
      </SignedOut>
    </>
  );
}
```

### Pattern 2: Modal Sign-In Overlay

**What:** A boolean in local React state controls whether the `<SignIn>` component is visible. It renders as an overlay over the demo chat. Clerk handles the post-sign-in redirect internally — the `<SignedIn>`/`<SignedOut>` condition flips automatically.

**When to use:** The "Sign in" button in the header and the CTA in the disabled input bar both set this boolean to `true`.

```typescript
// DemoChat.tsx (or a shared AuthModal component)
import { SignIn } from '@clerk/clerk-react';

function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
         onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>
        <SignIn routing="hash" />
      </div>
    </div>
  );
}
```

**Note:** `routing="hash"` keeps Clerk's internal navigation within the modal without pushing to the URL history. The alternative `routing="virtual"` also works. Do NOT use the default `routing="path"` since that requires a dedicated route.

### Pattern 3: Zustand Store — Flat Normalized Shape

**What:** A single Zustand store with `Record<string, Thread>` and `Record<string, Message>` as the primary data structures. All mutations are shallow — actions receive an id and update one record at a time.

**When to use:** This shape is locked. Every future phase depends on it. Never nest messages inside thread objects at the store level.

```typescript
// Source: https://zustand.docs.pmnd.rs/learn/guides/beginner-typescript
// store/sessionStore.ts
import { create } from 'zustand';
import type { Session, Thread, Message, Annotation, ChildLead } from '../types';

interface SessionState {
  // Data
  session: Session | null;
  threads: Record<string, Thread>;
  messages: Record<string, Message>;
  activeThreadId: string | null;

  // Actions
  createSession: (userId: string) => void;
  clearSession: () => void;
  createThread: (params: CreateThreadParams) => string; // returns new thread id
  setActiveThread: (threadId: string) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, patch: Partial<Message>) => void;
  setMessageStreaming: (id: string, isStreaming: boolean) => void;
  addChildLead: (messageId: string, lead: ChildLead) => void;
  addAnnotation: (messageId: string, annotation: Annotation) => void;
  setScrollPosition: (threadId: string, position: number) => void;
}

export const useSessionStore = create<SessionState>()((set, get) => ({
  session: null,
  threads: {},
  messages: {},
  activeThreadId: null,

  clearSession: () => set({
    session: null,
    threads: {},
    messages: {},
    activeThreadId: null,
  }),

  addMessage: (message) => set((state) => ({
    messages: { ...state.messages, [message.id]: message },
  })),

  updateMessage: (id, patch) => set((state) => ({
    messages: {
      ...state.messages,
      [id]: { ...state.messages[id], ...patch },
    },
  })),
  // ... remaining actions
}));
```

### Pattern 4: Zustand Selectors with useShallow

**What:** When a component subscribes to multiple fields, wrap the selector in `useShallow` to prevent re-renders when unrelated store values change.

```typescript
// Source: https://zustand.docs.pmnd.rs/learn/guides/beginner-typescript
import { useShallow } from 'zustand/react/shallow';
import { useSessionStore } from '../store/sessionStore';

function ThreadPanel() {
  const { activeThreadId, threads } = useSessionStore(
    useShallow((s) => ({ activeThreadId: s.activeThreadId, threads: s.threads }))
  );
  // ...
}
```

### Pattern 5: SSE Client — fetch + ReadableStream

**What:** `api/chat.ts` opens a streaming fetch to the backend `/api/chat` endpoint. A `TextDecoder` reads `Uint8Array` chunks into strings, splits on `\n`, and parses `data:` lines. The `[DONE]` sentinel terminates the loop.

**When to use:** Any SSE streaming consumption in this project. `EventSource` is never used here.

```typescript
// Source: https://tpiros.dev/blog/streaming-llm-responses-a-deep-dive/
// Adapted for this project's SseEvent types from shared/types.ts
import type { SseEvent } from '../../../shared/types';

export async function streamChat(
  body: { messages: Array<{ role: string; content: string }> },
  getToken: () => Promise<string | null>,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (message: string) => void
): Promise<void> {
  const token = await getToken();
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    onError(`HTTP ${res.status}`);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    const text = decoder.decode(value, { stream: true });
    for (const line of text.split('\n')) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (raw === '[DONE]') { onDone(); return; }
      try {
        const event = JSON.parse(raw) as SseEvent;
        if (event.type === 'chunk') onChunk(event.text);
        if (event.type === 'error') onError(event.message);
      } catch {
        // skip malformed lines
      }
    }
  }
}
```

**Critical:** The backend sends `data: [DONE]\n\n` as a raw sentinel string, not JSON. The code above checks for the literal string `[DONE]` before attempting `JSON.parse`. This matches the pattern established in `backend/src/routes/chat.ts` from Phase 1.

### Pattern 6: API Client — Token as Parameter

**What:** `api/client.ts` does not call `useAuth()` directly (hooks cannot be used outside React components/hooks). Instead, it accepts a `getToken` async function parameter, which callers (hooks or components with Clerk context) provide.

```typescript
// api/client.ts
export interface RequestOptions extends RequestInit {
  getToken?: () => Promise<string | null>;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<import('../../../shared/types').ApiResponse<T>> {
  const { getToken, ...fetchOptions } = options;
  const token = getToken ? await getToken() : null;

  const res = await fetch(path, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...fetchOptions.headers,
    },
  });

  return res.json();
}
```

### Pattern 7: Vite Dev Proxy

**What:** Vite's `server.proxy` forwards all `/api` requests to the backend dev server, eliminating CORS issues in local development.

```typescript
// Source: https://vite.dev/config/server-options
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': '/src' },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

**Note:** The backend runs on port 3001 (per `backend/.env.example`). The proxy is dev-only; production uses Vercel rewrites or Render's CORS config.

### Pattern 8: Tailwind v4 Dark Mode (Class Strategy)

**What:** Tailwind v4 removes `tailwind.config.js`. Dark mode class strategy is configured in the main CSS file using `@variant`.

**Recommendation:** Use class-based dark mode (not `prefers-color-scheme`) so Phase 6's theme toggle can control it programmatically.

```css
/* src/index.css */
@import "tailwindcss";

/* Class-based dark mode: apply dark styles when .dark is on a parent */
@variant dark (&:where(.dark, .dark *));
```

Usage in JSX: `<div className="bg-white dark:bg-zinc-900">` — add `.dark` to `<html>` or `<body>` to activate.

The project requires dark mode as default (UI-01, Phase 6). Phase 2 scaffolds the CSS variable foundation; the actual toggle lives in Phase 6.

### Anti-Patterns to Avoid

- **Calling `useAuth()` / `useUser()` outside React components or hooks:** Clerk hooks require React context. The `api/client.ts` module must accept token as a parameter, not call hooks internally.
- **Nested message arrays inside Thread objects in Zustand:** `thread.messages: Message[]` creates copies on every append and breaks memoization. Use `Record<id, Message>` at the store root level; Thread only stores `messageIds: string[]`.
- **`EventSource` for SSE:** Cannot send the `Authorization` header. Always use `fetch + ReadableStream`.
- **`routing="path"` on `<SignIn>` component without a dedicated route:** Causes navigation errors. Use `routing="hash"` or `routing="virtual"` for modal usage.
- **Writing DOM pixel positions to Zustand:** Gutter pill vertical anchors depend on the rendered DOM. These must be tracked in component refs (ResizeObserver), never in Zustand. (Phase 4 concern — establish the rule now.)

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth session management, JWT issuance | Custom auth service | Clerk `<ClerkProvider>` + `useAuth` | Token refresh, session expiry, PKCE flow have many edge cases |
| Google OAuth flow | Custom OAuth redirect handler | Clerk Dashboard config + `<SignIn>` | Clerk handles redirect URIs, token exchange, and error states |
| SSE line buffering | Custom chunked string accumulator | The `TextDecoder({ stream: true })` pattern | Chunks can split mid-line; `stream: true` maintains a buffer across `decode()` calls |
| Multi-field selector memoization | Custom equality check | `useShallow` from `zustand/react/shallow` | Handles shallow equality correctly across object shapes |

**Key insight:** The SSE chunk boundary problem is subtle. A single network chunk may contain half a JSON payload split across a `\n`. The `TextDecoder` `stream: true` option maintains state across calls so partial characters (especially multi-byte UTF-8) are not dropped. Buffer the incomplete line remainder across loop iterations.

---

## Common Pitfalls

### Pitfall 1: Clerk publishable key not found at runtime
**What goes wrong:** `VITE_CLERK_PUBLISHABLE_KEY` is `undefined` at runtime; Clerk throws or silently fails.
**Why it happens:** Vite only exposes environment variables prefixed with `VITE_` to the client bundle. Variables without the prefix are server-side only.
**How to avoid:** Always prefix frontend Clerk key with `VITE_`. Throw an early error in `main.tsx` if the key is falsy so failures are obvious: `if (!PUBLISHABLE_KEY) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY')`.
**Warning signs:** Clerk components render nothing; no error in console except for silent React rendering bail-out.

### Pitfall 2: SSE chunks split across JSON payload boundaries
**What goes wrong:** `JSON.parse` throws on a partial line because the network delivered half a `data:` line in one `read()` call and the rest in the next.
**Why it happens:** TCP does not guarantee chunk alignment with SSE message boundaries.
**How to avoid:** Maintain a `remainder` string buffer between loop iterations. Append each decoded chunk to `remainder`, split on `\n`, process all complete lines, and keep the last (potentially incomplete) element as the new `remainder`.
**Warning signs:** Intermittent `SyntaxError: Unexpected end of JSON input` in the browser console during streaming.

### Pitfall 3: Zustand store not reset on logout
**What goes wrong:** User logs out, logs back in as a different account, and sees the previous user's session data.
**Why it happens:** Clerk's `signOut` only clears the auth session, not the Zustand store.
**How to avoid:** In `App.tsx` or a `ClerkSignOutHandler` component, call `useSessionStore.getState().clearSession()` in an `afterSignOut` callback or listen for Clerk's session change event.
**Warning signs:** Stale thread data visible briefly after login with a fresh account.

### Pitfall 4: `routing="path"` on modal SignIn component
**What goes wrong:** Clerk's `<SignIn>` component tries to push `/sign-in` to the router; with no router defined, this causes a navigation error or blank screen.
**Why it happens:** The default `routing` prop value is `"path"`, which assumes a dedicated route is mounted.
**How to avoid:** Always pass `routing="hash"` when using `<SignIn>` in a modal context. Verify by checking that the URL does not change when the modal opens.
**Warning signs:** URL changes to `/sign-in` when modal opens; blank screen inside the modal.

### Pitfall 5: TypeScript strict mode failures at build time
**What goes wrong:** `tsc --noEmit` fails with TS2339, TS2307 (module not found for `../../shared/types`), or TS18047 (`possibly undefined`) errors.
**Why it happens:** The `tsconfig.json` `paths` for `@/` and the relative path to `shared/types.ts` must be configured correctly. `strict: true` will surface implicit `any` and undefined checks everywhere.
**How to avoid:** Add path alias in both `tsconfig.json` and `vite.config.ts`. For shared types, use `"paths": { "../../shared/*": ["../../shared/*"] }` or configure `rootDir` to the repo root. Verify `tsc --noEmit` passes before shipping any plan.

### Pitfall 6: Zustand `__mocks__` directory location for Vitest
**What goes wrong:** Vitest does not pick up the Zustand mock and store state bleeds between tests.
**Why it happens:** Vitest's `__mocks__` resolution uses the configured `root` directory, not the project root. If `root` is `./src`, the mock must be at `./src/__mocks__/zustand.ts`.
**How to avoid:** Set `root` explicitly in `vitest.config.ts` and place `__mocks__/zustand.ts` accordingly. Alternatively, reset state directly in `afterEach` by calling `useSessionStore.setState(initialState, true)`.

---

## Code Examples

### Zustand Store Reset Pattern for Tests
```typescript
// Avoids __mocks__ complexity — reset directly using setState
import { useSessionStore } from '../store/sessionStore';

const initialState = useSessionStore.getState();

afterEach(() => {
  useSessionStore.setState(initialState, true); // true = replace (not merge)
});
```

### TextDecoder Line Buffering
```typescript
// Handles chunks that split mid-line
let remainder = '';
while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  const text = remainder + decoder.decode(value, { stream: true });
  const lines = text.split('\n');
  remainder = lines.pop() ?? ''; // last element may be incomplete
  for (const line of lines) {
    if (!line.startsWith('data: ')) continue;
    // process complete line
  }
}
```

### Clerk afterSignOut Handler
```typescript
// App.tsx — wiring Clerk signOut to Zustand clearSession
import { useAuth } from '@clerk/clerk-react';
import { useSessionStore } from './store/sessionStore';

function LogoutButton() {
  const { signOut } = useAuth();
  const clearSession = useSessionStore((s) => s.clearSession);

  return (
    <button onClick={() => { clearSession(); signOut(); }}>
      Sign out
    </button>
  );
}
```

### threadAncestry Selector
```typescript
// store/selectors.ts
export function selectThreadAncestry(
  threads: Record<string, Thread>,
  threadId: string
): Thread[] {
  const ancestry: Thread[] = [];
  let current: Thread | undefined = threads[threadId];
  while (current) {
    ancestry.unshift(current);
    current = current.parentThreadId ? threads[current.parentThreadId] : undefined;
  }
  return ancestry;
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind PostCSS config (`tailwind.config.js`) | CSS-first config + `@tailwindcss/vite` plugin | Tailwind v4 (Jan 2025) | No `tailwind.config.js` file; dark mode variant configured in CSS |
| `darkMode: 'class'` in tailwind.config | `@variant dark (&:where(.dark, .dark *))` in CSS | Tailwind v4 | Same behavior, different syntax |
| Zustand `create(...)` (v3) | `create<State>()()` curried syntax (v4+) | Zustand v4 (2023) | Required for TypeScript inference without explicit type annotation |
| `@clerk/react` (older name) | `@clerk/clerk-react` | Clerk SDK reorganization | The npm package name is `@clerk/clerk-react` |
| `EventSource` for SSE | `fetch` + `ReadableStream` | Auth headers required | `EventSource` API cannot send Authorization headers |

**Deprecated/outdated:**
- `tailwind.config.js` with `content` and `darkMode` keys: Not used in v4. The `@tailwindcss/vite` plugin scans content automatically.
- `@tailwind base; @tailwind components; @tailwind utilities;` directives: Replaced by `@import "tailwindcss"` in v4.

---

## Open Questions

1. **Clerk `routing` prop for modal `<SignIn>`**
   - What we know: `routing="hash"` works without a router; `routing="path"` requires a dedicated URL route
   - What's unclear: Whether `routing="virtual"` (Clerk's newer modal-first mode) provides a better DX than `routing="hash"` in 2026. The distinction is LOW confidence as documentation was sparse.
   - Recommendation: Start with `routing="hash"`. If Clerk shows deprecation warnings, switch to `routing="virtual"`.

2. **Shared types import path in frontend `tsconfig.json`**
   - What we know: `shared/types.ts` is at the repo root; frontend is at `frontend/`. The relative import is `../../shared/types.ts`.
   - What's unclear: Whether `rootDir` in `frontend/tsconfig.json` must be set to the repo root (`../..`) or whether a path alias is cleaner.
   - Recommendation: Set `"rootDir": "../.."` in frontend `tsconfig.json` (matching what the backend did in Phase 1 to resolve TS6059). Confirm with `tsc --noEmit`.

3. **Zustand v5 breaking changes**
   - What we know: Zustand v5 was released (npm shows v5.x). The curried `create<State>()()` syntax is confirmed current.
   - What's unclear: Whether v5 introduced any breaking changes to the testing/reset pattern or `useShallow` import path vs v4.
   - Recommendation: Pin to `zustand@^5` and verify `useShallow` import from `zustand/react/shallow` at scaffold time.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (^3.x) |
| Config file | `frontend/vitest.config.ts` (or inline in `vite.config.ts` under `test:`) |
| Quick run command | `cd frontend && npx vitest run --reporter=verbose` |
| Full suite command | `cd frontend && npx vitest run --coverage` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Email/password sign-in shows Clerk `<SignIn>` component | component | `vitest run tests/unit/App.test.tsx` | Wave 0 |
| AUTH-01 | `<SignedOut>` renders demo chat; `<SignedIn>` renders app shell | component | `vitest run tests/unit/App.test.tsx` | Wave 0 |
| AUTH-02 | Google OAuth: Clerk `<SignIn>` component renders Google button | component | `vitest run tests/unit/App.test.tsx` | Wave 0 (mock Clerk) |
| AUTH-03 | Demo chat input is disabled with CTA text visible | component | `vitest run tests/unit/DemoChat.test.tsx` | Wave 0 |
| AUTH-03 | Demo chat does not make any `fetch` calls | unit | `vitest run tests/unit/DemoChat.test.tsx` | Wave 0 |
| AUTH-05 | `clearSession` resets all store fields to empty/null | unit | `vitest run tests/unit/sessionStore.test.ts` | Wave 0 |
| AUTH-05 | Logout button calls `clearSession` then `signOut` | component | `vitest run tests/unit/LogoutButton.test.tsx` | Wave 0 |
| Store | `createThread` adds thread to `threads` Record, updates parent `childThreadIds` | unit | `vitest run tests/unit/sessionStore.test.ts` | Wave 0 |
| Store | `addMessage` adds to `messages` Record (not nested in thread) | unit | `vitest run tests/unit/sessionStore.test.ts` | Wave 0 |
| Store | `updateMessage` patches specific message without mutating others | unit | `vitest run tests/unit/sessionStore.test.ts` | Wave 0 |
| Store | `setMessageStreaming` flips `isStreaming` on single message | unit | `vitest run tests/unit/sessionStore.test.ts` | Wave 0 |
| Store | `selectThreadAncestry` returns correct array from root to leaf | unit | `vitest run tests/unit/selectors.test.ts` | Wave 0 |
| Store | `isAtMaxDepth` returns `true` for depth 4 thread, `false` for depth 0-3 | unit | `vitest run tests/unit/selectors.test.ts` | Wave 0 |
| SSE client | `streamChat` parses `data: {"type":"chunk","text":"hello"}` and calls `onChunk` | unit | `vitest run tests/unit/api.chat.test.ts` | Wave 0 |
| SSE client | `streamChat` terminates on `data: [DONE]` sentinel and calls `onDone` | unit | `vitest run tests/unit/api.chat.test.ts` | Wave 0 |
| SSE client | `streamChat` handles chunks split across read boundaries (buffering) | unit | `vitest run tests/unit/api.chat.test.ts` | Wave 0 |

### Mocking Strategy for Clerk in Tests

Clerk hooks require a real `ClerkProvider` context in component tests. Use `vi.mock('@clerk/clerk-react')` to return controlled stubs:

```typescript
// tests/unit/setup.ts (add to Vitest setupFiles)
vi.mock('@clerk/clerk-react', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  SignedIn: ({ children }: { children: React.ReactNode }) => children,   // override per test
  SignedOut: ({ children }: { children: React.ReactNode }) => children,  // override per test
  SignIn: () => <div data-testid="clerk-sign-in" />,
  useAuth: () => ({ signOut: vi.fn(), getToken: vi.fn().mockResolvedValue('test-token') }),
}));
```

Test files that need to simulate auth state should override `SignedIn`/`SignedOut` using `vi.mocked`.

### Sampling Rate
- **Per task commit:** `cd frontend && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd frontend && npx vitest run --coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `frontend/vitest.config.ts` — test environment `jsdom`, `globals: true`, `setupFiles`
- [ ] `frontend/src/tests/setup.ts` — imports `@testing-library/jest-dom`, Clerk mock
- [ ] `frontend/tests/unit/sessionStore.test.ts` — covers all store actions + reset pattern
- [ ] `frontend/tests/unit/selectors.test.ts` — covers `currentThread`, `threadAncestry`, `isAtMaxDepth`
- [ ] `frontend/tests/unit/App.test.tsx` — covers `SignedIn`/`SignedOut` conditional rendering
- [ ] `frontend/tests/unit/DemoChat.test.tsx` — covers disabled input, CTA text, no-fetch assertion
- [ ] `frontend/tests/unit/api.chat.test.ts` — covers SSE parsing, buffering, DONE sentinel

---

## Sources

### Primary (HIGH confidence)
- `https://clerk.com/docs/quickstarts/react` — ClerkProvider setup, publishable key env var, afterSignOutUrl
- `https://clerk.com/docs/guides/development/making-requests` — getToken pattern, async token in fetch, hook context requirement
- `https://zustand.docs.pmnd.rs/learn/guides/beginner-typescript` — `create<State>()()` curried syntax, `useShallow` import and usage
- `https://vite.dev/config/server-options` — `server.proxy` configuration for dev CORS avoidance
- `shared/types.ts` (local file) — `SseEvent`, `ApiResponse`, `ApiError` shapes already defined; frontend imports verbatim
- `backend/package.json` (local file) — confirms `@clerk/express ^2.0.1`, TypeScript ^5.9.3 for version alignment

### Secondary (MEDIUM confidence)
- `https://tpiros.dev/blog/streaming-llm-responses-a-deep-dive/` — `fetch` + `ReadableStream` SSE pattern with `TextDecoder`, `[DONE]` sentinel handling; verified against MDN Web API spec
- `https://tailwindcss.com/blog/tailwindcss-v4` — Tailwind v4 breaking changes, `@tailwindcss/vite` plugin, `@import "tailwindcss"` CSS entry point
- `https://dev.to/geane_ramos/how-to-setup-your-vite-project-with-react-typescript-and-tailwindcss-v4-2bkm` — Step-by-step Tailwind v4 + Vite config; consistent with official release notes

### Tertiary (LOW confidence)
- `https://github.com/pmndrs/zustand/discussions/1829` — Zustand Vitest reset pattern via `getState()` / `setState(initial, true)`; community-verified but not in official docs
- Multiple WebSearch results for Clerk `routing="hash"` modal mode — the `routing` prop behavior for modal vs route usage; low confidence due to inconsistent official documentation coverage

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages are the project-locked choices; versions confirmed via npm
- Architecture: HIGH — Clerk `<SignedIn>`/`<SignedOut>`, Zustand flat Record, SSE fetch pattern all verified against official sources
- Pitfalls: MEDIUM — line buffering pitfall and Zustand test reset confirmed via community sources and MDN; Clerk `routing` prop pitfall is MEDIUM (official doc sparse)
- Tailwind dark mode: MEDIUM — v4 `@variant` syntax confirmed from official blog post; exact syntax for class strategy requires validation at scaffold time

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (Clerk and Tailwind v4 are active — check for breaking changes if more than 30 days)
