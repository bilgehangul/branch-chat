# Phase 11: Multi-Provider Settings - Research

**Researched:** 2026-03-12
**Domain:** Multi-provider AI backend (Gemini, OpenAI, Anthropic), BYOK key management, frontend settings modal, Web Crypto API
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Settings Panel**
- Centered modal dialog with backdrop (click backdrop or X to dismiss)
- Gear icon in the right side of the top header bar (next to user avatar/sign-out)
- Focus trap inside modal (XCUT-02)
- Two sections: info-only free-tier label at top, collapsible BYOK section below (collapsed by default)

**Free-Tier Model**
- No user-facing model toggle — free tier is Gemini Flash 2.0 with Flash 2.0 Lite as silent fallback on overload
- Settings modal shows "Current Model: Gemini Flash 2.0 (Free)" as informational label, not a toggle
- Backend narrows the fallback chain to just these 2 models (remove the other 4 currently in FREE_TIER_MODELS)

**BYOK Key Flow**
- Provider selector: Gemini | OpenAI | Anthropic
- API key input with show/hide toggle, provider-specific placeholder text
- Explicit "Verify Key" button — backend makes lightweight test call, shows inline green checkmark or red error
- Model selector populates only after successful verification
- Explicit "Save" button required to apply changes (not auto-apply)
- "Clear Key & Reset to Free" button with confirmation dialog before clearing
- Key never displayed in full after entry — show only last 4 characters (PROV-15)
- Key encrypted in localStorage using Web Crypto AES-GCM keyed to userId + app salt (PROV-13)
- Key cleared from localStorage on sign-out (PROV-14)

**BYOK Verification Error**
- Inline red error message below key input: "Invalid API key. Check your key and try again."
- Key stays in input so user can fix it — no modal or toast for errors

**Model Lists (Hardcoded Curated)**
- Gemini: Flash 2.0, Flash 2.0 Lite, Pro 2.5
- OpenAI: gpt-4o, gpt-4o-mini
- Anthropic: Claude Sonnet 4.6, Claude Haiku 4.5

**Search Provider**
- Search provider dropdown appears only when OpenAI is selected as BYOK provider
- Options: Tavily (default) or OpenAI Web Search
- Other providers (Gemini, Anthropic) always use Tavily

**Model Badge (ChatInput)**
- Always visible — shows active model with provider icon (Gemini sparkle, OpenAI logo, Anthropic logo)
- Free tier: provider icon + "Gemini Flash"
- BYOK: key icon + provider icon + model name (e.g., "gpt-4o")
- Clickable — opens Settings modal

**Provider Implementation**
- All three providers fully implemented: Gemini, OpenAI, Anthropic
- OpenAI stub replaced with real implementation
- Anthropic Claude provider built from scratch
- Gemini provider refactored to accept dynamic apiKey + model (for BYOK users who bring their own Gemini key)

### Claude's Discretion
- Modal width, padding, and animation (open/close transition)
- Exact provider icon assets (SVG or emoji fallback)
- Key verification endpoint design (which lightweight API call to make per provider)
- SettingsContext internal state shape
- Rate limiting implementation details (30 req/min per user for BYOK)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PROV-01 | Gear icon button in header opens Settings panel | AppShell.tsx header pattern identified; gear icon SVG pattern from existing buttons |
| PROV-02 | Settings Section A — "Default Model" informational label (Gemini Flash 2.0 Free) | No toggle needed — purely display; SettingsContext free-tier state |
| PROV-03 | Settings Section B — "Use Your Own API Key" collapsible section (default collapsed) | useState(false) collapsed pattern established in sidebar ThreadNode |
| PROV-04 | BYOK provider selector: Gemini | OpenAI | Anthropic | Segment/radio button group UI |
| PROV-05 | API key input with show/hide toggle, provider-specific placeholder | input type=password + toggle pattern; placeholder per provider |
| PROV-06 | "Verify Key" button → lightweight backend call, shows green check or red error | POST /api/verify-key endpoint; per-provider lightweight call researched |
| PROV-07 | Model selector populates only after key verification | Conditional rendering gated on byokKeyVerified state |
| PROV-08 | Search provider selector (Tavily / OpenAI web search) when OpenAI selected | Conditional render gated on byokProvider === 'openai' |
| PROV-09 | "Clear Key & Reset to Free" button with confirmation dialog | ConfirmDialog component already exists and reusable |
| PROV-10 | Active model badge in ChatInput area, clickable to open Settings | ChatInput.tsx needs model badge row above textarea |
| PROV-11 | BYOK mode shows key icon next to model name in badge | Icon conditional on settings.tier === 'byok' |
| PROV-12 | SettingsContext manages full provider state shape | React Context pattern (matching ThemeContext/AuthContext) |
| PROV-13 | API key encrypted in localStorage using Web Crypto AES-GCM keyed to userId + app salt | Web Crypto API pattern documented; no external library needed |
| PROV-14 | Key cleared from localStorage on sign-out | AuthContext.signOut() must call settings.clearByokKey() |
| PROV-15 | Full key never displayed after entry — show only last 4 chars | Mask logic: key.slice(-4).padStart(key.length, '*') |
| BKND-01 | config.ts refactored from singleton to factory: getDefaultProvider(model?) + createByokProvider(provider, model, apiKey) | Factory pattern researched; no module re-import needed |
| BKND-02 | All API routes accept optional byok field in request body | Route body parsing pattern from existing routes |
| BKND-03 | Free-tier fallback chain narrowed to gemini-2.0-flash → gemini-2.0-flash-lite only | gemini.ts FREE_TIER_MODELS array trimming |
| BKND-04 | GeminiProvider constructor accepts apiKey + model parameters | Refactor GoogleGenAI init from module-level to constructor |
| BKND-05 | OpenAIProvider constructor accepts dynamic apiKey + model | openai npm package constructor accepts { apiKey } |
| BKND-06 | Anthropic Claude provider implementing AIProvider interface | @anthropic-ai/sdk streaming pattern documented |
| BKND-07 | API keys never logged — sanitization middleware redacts byok.apiKey in all logging | Express middleware pattern; req.body scrubbing |
| BKND-08 | API keys never persisted — exists only in request handler scope | Architectural constraint, no DB write |
| BKND-09 | Error responses redact any API key substrings | String replace in error handler |
| BKND-10 | Key format validation rejects malformed keys before hitting third-party APIs | Regex patterns per provider documented |
| BKND-11 | Per-user rate limiting for BYOK requests (30 req/min) | express-rate-limit keyGenerator using req.verifiedUser.sub |
| BKND-12 | CORS restricted to app domain only | CLIENT_ORIGIN env var already in index.ts; verify it's not wildcard |
| XCUT-02 | Settings modal traps focus | focus-trap-react or custom useFocusTrap hook |
</phase_requirements>

---

## Summary

Phase 11 adds multi-provider support so users can choose between a free Gemini tier or bring their own API key for Gemini, OpenAI, or Anthropic. The work splits across three surfaces: (1) backend provider refactor from singletons to per-request factories with real OpenAI and Anthropic implementations, (2) a new Settings modal in the frontend with BYOK flow and encrypted localStorage persistence, and (3) a model badge in ChatInput.

The backend is well-prepared — the `AIProvider` interface already defines all three required methods, and the route handlers are thin enough that accepting an optional `byok` body field and swapping the provider instance at the top of each handler is sufficient. The two new SDKs (`openai` v6.x and `@anthropic-ai/sdk` v0.78.x) both follow the same async-iterable streaming pattern, making them straightforward to integrate into the existing callback-based wrapper.

On the frontend, the project already uses React Context for auth and theme — SettingsContext follows that exact pattern. The existing `ConfirmDialog` component (createPortal-based, backdrop click to dismiss) is directly reusable for the "Clear Key" confirmation. Web Crypto AES-GCM is native in all modern browsers and requires no extra library. Focus trapping can be implemented via a small custom hook using `useRef`/`useEffect` without adding a dependency.

**Primary recommendation:** Implement in three waves: (1) backend factory refactor + three provider implementations + security middleware, (2) SettingsContext + modal UI + encrypted localStorage, (3) ChatInput model badge + sign-out key cleanup.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `openai` (npm) | ^6.27.0 | OpenAI API client for Node.js | Official OpenAI SDK; supports streaming via async iterable |
| `@anthropic-ai/sdk` | ^0.78.0 | Anthropic Claude API client | Official Anthropic SDK; streaming via `messages.stream()` |
| `@google/genai` | ^1.44.0 (already installed) | Gemini API client | Already used; refactor to accept constructor params |
| `express-rate-limit` | ^8.3.0 (already installed) | Per-user rate limiting | Already in project; custom keyGenerator for userId |
| Web Crypto API (browser built-in) | — | AES-GCM key encryption in localStorage | No library needed; available in all modern browsers |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `focus-trap-react` | ^10.x | Focus trap for Settings modal | If custom hook proves fiddly; adds ~4KB gzipped |
| (Custom `useFocusTrap` hook) | — | Focus trap via useRef/useEffect | Preferred — zero dependency, follows project pattern |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Web Crypto API (native) | `crypto-js` | crypto-js adds bundle weight; Web Crypto is async but native and audited |
| Custom useFocusTrap hook | `focus-trap-react` | focus-trap-react is battle-tested; custom is zero-dep but requires careful key event handling |
| React Context for SettingsContext | Zustand slice | Context is fine for low-frequency settings state; Zustand adds complexity without benefit here |

**Installation (backend):**
```bash
cd backend && npm install openai @anthropic-ai/sdk
```

**Installation (frontend):** No new packages required for the modal (Web Crypto is built-in). If using focus-trap-react:
```bash
cd frontend && npm install focus-trap-react
```

---

## Architecture Patterns

### Recommended File Structure
```
backend/src/
├── providers/
│   ├── types.ts           # AIProvider, SearchProvider interfaces (unchanged)
│   ├── gemini.ts          # Refactored: constructor(apiKey, model); free-tier variant
│   ├── openai.ts          # Full implementation replacing stub
│   ├── anthropic.ts       # New: AnthropicProvider implementing AIProvider
│   ├── openai-search.ts   # Full implementation replacing stub
│   └── tavily.ts          # Unchanged
├── config.ts              # Refactored: getDefaultProvider() + createByokProvider()
├── middleware/
│   ├── auth.ts            # Unchanged
│   ├── rateLimiter.ts     # Unchanged (IP-based global limiter)
│   └── byokRateLimiter.ts # New: per-userId limiter (30 req/min) for BYOK routes
└── routes/
    ├── chat.ts            # Accept byok body field; call createByokProvider if present
    ├── simplify.ts        # Accept byok body field
    ├── find-sources.ts    # Accept byok body field; also accept byokSearch field
    └── verify-key.ts      # New: POST /api/verify-key

frontend/src/
├── contexts/
│   ├── AuthContext.tsx    # Add: call clearByokKey() on signOut
│   └── SettingsContext.tsx # New: provider state + Web Crypto persistence
├── components/
│   ├── layout/
│   │   └── AppShell.tsx   # Add gear icon button in header
│   ├── input/
│   │   └── ChatInput.tsx  # Add model badge row above textarea
│   └── settings/
│       ├── SettingsModal.tsx      # New: modal shell with backdrop + focus trap
│       ├── FreeTierSection.tsx    # New: informational label section
│       └── ByokSection.tsx        # New: collapsible BYOK UI
```

### Pattern 1: Backend Factory (BKND-01)

**What:** Replace module-level singleton exports in `config.ts` with factory functions. Route handlers call the factory per-request when `byok` is present, otherwise call `getDefaultProvider()`.

**When to use:** Any route that accepts AI calls.

**Example:**
```typescript
// backend/src/config.ts
import { GeminiProvider } from './providers/gemini.js';
import { OpenAIProvider } from './providers/openai.js';
import { AnthropicProvider } from './providers/anthropic.js';
import type { AIProvider, SearchProvider } from './providers/types.js';

// Default free-tier provider (singleton — constructed once at startup)
const defaultAiProvider: AIProvider = new GeminiProvider(
  process.env.GEMINI_API_KEY!,
  'gemini-2.0-flash'  // primary; fallback logic inside GeminiProvider
);

export function getDefaultProvider(): AIProvider {
  return defaultAiProvider;
}

export function createByokProvider(
  provider: 'gemini' | 'openai' | 'anthropic',
  model: string,
  apiKey: string
): AIProvider {
  if (provider === 'gemini') return new GeminiProvider(apiKey, model);
  if (provider === 'openai') return new OpenAIProvider(apiKey, model);
  if (provider === 'anthropic') return new AnthropicProvider(apiKey, model);
  throw new Error(`Unknown provider: ${provider}`);
}
```

### Pattern 2: Route BYOK Injection (BKND-02)

**What:** Each route reads optional `byok` from the request body and creates a per-request provider instance if present.

```typescript
// In chat.ts (and simplify.ts, find-sources.ts)
import { getDefaultProvider, createByokProvider } from '../config.js';

chatRouter.post('/', async (req, res) => {
  const { messages, byok, ... } = req.body;

  const aiProvider = byok
    ? createByokProvider(byok.provider, byok.model, byok.apiKey)
    : getDefaultProvider();

  // rest of handler unchanged
});
```

### Pattern 3: GeminiProvider Constructor Refactor (BKND-04)

**What:** Move `GoogleGenAI` instantiation from module level to constructor. For free-tier, constructor uses only Flash 2.0 + Lite fallback.

```typescript
// backend/src/providers/gemini.ts
const FREE_TIER_MODELS = ['gemini-2.0-flash', 'gemini-2.0-flash-lite'] as const;

export class GeminiProvider implements AIProvider {
  private ai: GoogleGenAI;
  private model: string | null; // null = free-tier fallback mode

  constructor(apiKey: string, model?: string) {
    this.ai = new GoogleGenAI({ apiKey });
    this.model = model ?? null;
  }

  async streamChat(...) {
    const models = this.model ? [this.model] : FREE_TIER_MODELS;
    for (const m of models) { /* existing retry loop */ }
  }
}
```

### Pattern 4: OpenAI Streaming (BKND-05)

**What:** Use `openai` npm package with `for await` on `stream: true` response, convert to existing `onChunk`/`onDone`/`onError` callbacks.

```typescript
// backend/src/providers/openai.ts
import OpenAI from 'openai';
import type { AIProvider, Message, SearchResult } from './types.js';

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async streamChat(
    messages: Message[],
    systemPrompt: string,
    onChunk: (chunk: string) => void,
    onDone: () => void,
    onError: (err: Error) => void,
    signal?: AbortSignal
  ): Promise<void> {
    try {
      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
          ...messages.map(m => ({
            role: m.role === 'model' ? 'assistant' as const : 'user' as const,
            content: m.content,
          })),
        ],
        stream: true,
      }, { signal });

      for await (const chunk of stream) {
        if (signal?.aborted) break;
        const text = chunk.choices[0]?.delta?.content ?? '';
        if (text) onChunk(text);
      }
      onDone();
    } catch (err) {
      onError(err instanceof Error ? err : new Error(String(err)));
    }
  }
}
```

**Note:** OpenAI role is `'assistant'` not `'model'` — map when constructing messages array.

### Pattern 5: Anthropic Streaming (BKND-06)

**What:** Use `@anthropic-ai/sdk` with `messages.stream()` for the callback pattern.

```typescript
// backend/src/providers/anthropic.ts
import Anthropic from '@anthropic-ai/sdk';
import type { AIProvider, Message, SearchResult } from './types.js';

export class AnthropicProvider implements AIProvider {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async streamChat(
    messages: Message[],
    systemPrompt: string,
    onChunk: (chunk: string) => void,
    onDone: () => void,
    onError: (err: Error) => void,
    signal?: AbortSignal
  ): Promise<void> {
    try {
      const stream = this.client.messages.stream({
        model: this.model,
        max_tokens: 4096,
        system: systemPrompt || undefined,
        messages: messages.map(m => ({
          role: m.role === 'model' ? 'assistant' as const : 'user' as const,
          content: m.content,
        })),
      });

      for await (const event of stream) {
        if (signal?.aborted) break;
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          onChunk(event.delta.text);
        }
      }
      onDone();
    } catch (err) {
      onError(err instanceof Error ? err : new Error(String(err)));
    }
  }
}
```

**Note:** Anthropic's role mapping is the same as OpenAI: `'model'` → `'assistant'`. The Anthropic SDK does not support AbortSignal natively — check `signal?.aborted` in the loop. The `system` parameter is top-level, not in the messages array.

### Pattern 6: Key Verification Endpoint (PROV-06)

**What:** `POST /api/verify-key` accepts `{ provider, apiKey }`, makes the lightest possible call to the provider, returns `{ valid: true }` or `{ valid: false, message: "..." }`.

**Lightweight calls per provider:**
- **Gemini:** `ai.models.generateContent({ model: 'gemini-2.0-flash', contents: 'hi', config: { maxOutputTokens: 1 } })` — single token response
- **OpenAI:** `client.models.list()` — lists models, no token cost, just auth check
- **Anthropic:** `client.models.list()` — Anthropic Models API (GET /v1/models) works as a key validator

### Pattern 7: Web Crypto AES-GCM Encryption (PROV-13)

**What:** Derive a key from `userId + APP_SALT`, encrypt the API key with AES-GCM, store IV + ciphertext in localStorage.

```typescript
// frontend/src/utils/cryptoStorage.ts

const APP_SALT = 'contextdive_byok_v1'; // hardcoded app constant

async function deriveKey(userId: string): Promise<CryptoKey> {
  const raw = new TextEncoder().encode(userId + APP_SALT);
  const digest = await crypto.subtle.digest('SHA-256', raw);
  return crypto.subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function encryptApiKey(userId: string, apiKey: string): Promise<string> {
  const key = await deriveKey(userId);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(apiKey);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  // Store as base64: iv (12 bytes) + ciphertext
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.byteLength);
  return btoa(String.fromCharCode(...combined));
}

export async function decryptApiKey(userId: string, stored: string): Promise<string> {
  const key = await deriveKey(userId);
  const combined = Uint8Array.from(atob(stored), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new TextDecoder().decode(plain);
}
```

**Storage key:** `byok_key_${userId}` in localStorage.

### Pattern 8: SettingsContext Shape (PROV-12)

**What:** React Context following ThemeContext/AuthContext patterns. State stored in context; persistence (encrypt/decrypt) is async, so hydration happens in a useEffect on mount.

```typescript
// frontend/src/contexts/SettingsContext.tsx

interface SettingsState {
  tier: 'free' | 'byok';
  byokProvider: 'gemini' | 'openai' | 'anthropic' | null;
  byokModel: string | null;
  byokApiKey: string | null;       // in-memory only (never stored plain)
  byokKeyVerified: boolean;
  searchProvider: 'tavily' | 'openai-search';
  isModalOpen: boolean;
}

interface SettingsContextValue extends SettingsState {
  openModal: () => void;
  closeModal: () => void;
  setByokProvider: (p: 'gemini' | 'openai' | 'anthropic') => void;
  setByokModel: (m: string) => void;
  setByokApiKey: (k: string) => void;
  setByokKeyVerified: (v: boolean) => void;
  setSearchProvider: (s: 'tavily' | 'openai-search') => void;
  saveByokSettings: (userId: string) => Promise<void>;
  clearByokKey: (userId: string) => Promise<void>;
}
```

**Note:** `byokApiKey` lives in memory only. Persisted form (encrypted ciphertext) lives in `localStorage`. On mount, the context decrypts and loads the key into memory. On sign-out, `clearByokKey` removes the localStorage entry.

### Pattern 9: Key Format Validation (BKND-10)

Per-provider regex patterns to reject malformed keys before hitting third-party APIs:

```typescript
const KEY_PATTERNS: Record<string, RegExp> = {
  gemini: /^AIza[0-9A-Za-z\-_]{35}$/,
  openai: /^sk-[A-Za-z0-9]{20,}$/,          // sk- prefix + alphanumeric (also sk-proj- for new keys)
  anthropic: /^sk-ant-[A-Za-z0-9\-_]{32,}$/,
};
```

**Note:** Key format validation is a first-pass sanity check only — not a security guarantee. Always follow with actual verification call.

### Pattern 10: Focus Trap Hook (XCUT-02)

**What:** Custom hook that traps keyboard focus inside the modal. No external dependency needed.

```typescript
// frontend/src/hooks/useFocusTrap.ts
import { useEffect, useRef } from 'react';

export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    const getFocusable = () => Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = getFocusable();
      if (!focusable.length) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // Focus first focusable element on open
    getFocusable()[0]?.focus();

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  return containerRef;
}
```

### Anti-Patterns to Avoid

- **Module-level GoogleGenAI instantiation after refactor:** The current `gemini.ts` creates `const ai = new GoogleGenAI(...)` at module level. After refactoring, this must move into the constructor or it will always use `process.env.GEMINI_API_KEY` instead of the BYOK key.
- **Logging `req.body.byok.apiKey`:** Express's default error handler or any console.log of the full request body will leak the API key. Sanitization middleware must run before any logging middleware.
- **Persisting the plain API key:** The key must exist in-memory only during the request handler scope. Never `await Message.create({ apiKey: ... })` or similar.
- **Auto-saving on input change:** The "Save" button is explicit — do not wire `onChange` of the model/provider selectors to immediately persist.
- **Displaying the full key after entry:** Once the user saves and closes, re-opening the modal must show `****...XXXX` (last 4 only), not the decrypted value.
- **Global singleton provider in config.ts after refactor:** After refactoring, `aiProvider` should no longer be a module-level singleton export (this will break the existing `providers.test.ts` — that test file must be updated).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OpenAI streaming | Manual fetch with SSE parsing | `openai` npm SDK | Handles backpressure, abort, error types, retries |
| Anthropic streaming | Manual fetch with SSE parsing | `@anthropic-ai/sdk` | Handles event parsing, streaming types, error handling |
| AES encryption | Manual XOR or simple base64 | Web Crypto `SubtleCrypto.encrypt` | Browser-native, FIPS-compliant, async, no bundle cost |
| Rate limiting per user | Counter in memory/Map | `express-rate-limit` with `keyGenerator` | Already installed; handles window reset, memory management |
| Focus trapping | Tab order manipulation via tabIndex | `useFocusTrap` hook (custom, ~30 lines) | Complete solution; handles Shift+Tab, dynamic focusable elements |

**Key insight:** The OpenAI and Anthropic SDKs both use the exact same `for await (const chunk of stream)` pattern — the implementation structure of both providers will be nearly identical, making both easy to verify and test.

---

## Common Pitfalls

### Pitfall 1: OpenAI Role Name Mismatch
**What goes wrong:** The existing `AIProvider` interface uses `role: 'user' | 'model'` (Gemini convention), but OpenAI expects `'user' | 'assistant'`.
**Why it happens:** Each provider has its own convention; the Gemini SDK used `'model'` as the assistant role.
**How to avoid:** Always map `role === 'model' ? 'assistant' : 'user'` in OpenAI and Anthropic provider constructors before building the messages array.
**Warning signs:** TypeScript will not catch this — OpenAI accepts any string for role in JS. The model will either error or behave strangely if `'model'` is passed.

### Pitfall 2: Anthropic System Prompt Location
**What goes wrong:** Passing `systemPrompt` inside the messages array with `role: 'system'` causes an Anthropic API error.
**Why it happens:** Anthropic's API takes `system` as a top-level parameter, not inside the `messages` array.
**How to avoid:** Pass `system: systemPrompt || undefined` at the top level of `messages.stream({ ... })`.
**Warning signs:** 400 error from Anthropic API: "messages.0.role: Input should be 'user' or 'assistant'".

### Pitfall 3: Web Crypto API is Async — Synchronous localStorage Reads Break
**What goes wrong:** `SettingsContext` tries to read and decrypt the BYOK key synchronously during `useState` initialization (like AuthContext reads the Google token), but `crypto.subtle.decrypt` is a Promise.
**Why it happens:** Web Crypto is always async — there is no sync decrypt.
**How to avoid:** Initialize `byokApiKey: null` in useState, then decrypt in a `useEffect` that runs once on mount. Show a loading state if needed during hydration.
**Warning signs:** The key appears as `null` even when it was stored; decryption silently skipped.

### Pitfall 4: BYOK API Key Leaking in Error Responses
**What goes wrong:** When an upstream API rejects a BYOK key (e.g., invalid key), the SDK error message may include the key in the error string.
**Why it happens:** Some SDKs include request details in error messages for debugging.
**How to avoid:** In the `verify-key` route and all BYOK routes, catch errors and redact before sending to client: `message.replace(apiKey, '[REDACTED]')`.
**Warning signs:** Error logs or client-side error messages containing `sk-...` or `AIza...` strings.

### Pitfall 5: Stale Provider Singleton in Tests
**What goes wrong:** `backend/tests/providers.test.ts` currently tests that `config.ts` exports singletons. After refactoring to factories, these tests break.
**Why it happens:** Test imports the old singleton exports which no longer exist.
**How to avoid:** Update `providers.test.ts` to test `getDefaultProvider()` and `createByokProvider()` instead. The test for "OpenAI stub throws" can be removed since OpenAI is now implemented.
**Warning signs:** `TypeError: config.aiProvider is not a function` or `undefined`.

### Pitfall 6: Modal Z-Index Conflicts
**What goes wrong:** The Settings modal renders behind the `ConfirmDialog` (z-[10000]) or behind the ancestor rail overlay.
**Why it happens:** The existing `ConfirmDialog` uses `z-[10000]`. Other overlays use lower z-index.
**How to avoid:** Render the modal via `createPortal(dialog, document.body)` with `z-[9000]` (below ConfirmDialog so the "Clear Key" confirmation renders above the settings modal). The confirmation dialog's `z-[10000]` ensures it is always on top.
**Warning signs:** Settings modal appears but the "Clear Key" confirm dialog is invisible or behind the modal.

### Pitfall 7: Gemini 2.0 Flash Retirement Date
**What goes wrong:** `gemini-2.0-flash` is listed as retiring June 1, 2026 per Google's documentation. The free tier uses this model.
**Why it happens:** Google auto-retires older model aliases.
**How to avoid:** This is known — the code should work until June 1, 2026. Add a TODO comment in `gemini.ts` to update `FREE_TIER_MODELS` when Gemini 2.5 Flash becomes reliably free. The BYOK curated list can include `gemini-2.5-flash` and `gemini-2.5-pro` since those are user-supplied keys.
**Warning signs:** 404 or model-not-found errors from Gemini API after June 2026.

---

## Code Examples

### OpenAI `simplify()` Implementation
```typescript
// Source: openai npm SDK v6.x, official pattern
async simplify(text: string, mode: string): Promise<string> {
  const instruction = SIMPLIFY_PROMPTS[mode] ?? SIMPLIFY_PROMPTS['simpler'];
  const response = await this.client.chat.completions.create({
    model: this.model,
    messages: [
      { role: 'system', content: 'You are a writing assistant. Return only the rewritten text, no preamble.' },
      { role: 'user', content: `${instruction}\n\nText to rewrite:\n${text}` },
    ],
    max_tokens: 1000,
  });
  return response.choices[0]?.message?.content ?? '';
}
```

### Anthropic `simplify()` Implementation
```typescript
// Source: @anthropic-ai/sdk v0.78.x, official pattern
async simplify(text: string, mode: string): Promise<string> {
  const instruction = SIMPLIFY_PROMPTS[mode] ?? SIMPLIFY_PROMPTS['simpler'];
  const response = await this.client.messages.create({
    model: this.model,
    max_tokens: 1000,
    system: 'You are a writing assistant. Return only the rewritten text, no preamble.',
    messages: [{ role: 'user', content: `${instruction}\n\nText to rewrite:\n${text}` }],
  });
  const block = response.content[0];
  return block?.type === 'text' ? block.text : '';
}
```

### Per-User BYOK Rate Limiter
```typescript
// backend/src/middleware/byokRateLimiter.ts
// Source: express-rate-limit v8.x, keyGenerator pattern
import rateLimit from 'express-rate-limit';

export const byokRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 30,
  keyGenerator: (req) => {
    // req.verifiedUser is set by requireApiAuth, which runs before this limiter
    return req.verifiedUser?.sub ?? req.ip ?? 'anonymous';
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      data: null,
      error: { code: 'RATE_LIMITED', message: 'Too many requests. Please wait before trying again.' },
    });
  },
});
```

Apply this limiter conditionally in each route that accepts BYOK, or create a separate `byokRouter` that applies the limiter globally.

### API Key Sanitization Middleware
```typescript
// backend/src/middleware/sanitizeBody.ts
import type { Request, Response, NextFunction } from 'express';

export function sanitizeByokKey(req: Request, _res: Response, next: NextFunction) {
  if (req.body?.byok?.apiKey) {
    // Redact in-place — logging middleware sees scrubbed body
    req.body = {
      ...req.body,
      byok: { ...req.body.byok, apiKey: '[REDACTED]' },
    };
  }
  next();
}
```

**Important:** This must run AFTER `express.json()` parses the body but the actual `apiKey` value must be extracted from the raw body BEFORE this middleware runs. Use a pattern where routes extract `apiKey` first, then the sanitizer runs for logging.

A cleaner approach: extract the key at the route handler level, remove it from `req.body` immediately, then all downstream middleware/logging sees a clean body:

```typescript
// In the route handler (before any await):
const rawApiKey = req.body?.byok?.apiKey as string | undefined;
if (req.body?.byok) delete req.body.byok.apiKey;  // scrub before any logging
```

### Model Badge Component Structure
```tsx
// frontend/src/components/input/ModelBadge.tsx
interface ModelBadgeProps {
  tier: 'free' | 'byok';
  providerName: string;   // 'Gemini', 'OpenAI', 'Anthropic'
  modelDisplayName: string;  // 'Flash 2.0', 'gpt-4o', 'Sonnet 4.6'
  onClick: () => void;
}
```

### Verify Key Route Skeleton
```typescript
// backend/src/routes/verify-key.ts
// POST /api/verify-key — { provider, apiKey } → { valid: boolean, message?: string }
import { Router } from 'express';

export const verifyKeyRouter = Router();

verifyKeyRouter.post('/', async (req, res) => {
  const { provider, apiKey } = req.body as { provider?: string; apiKey?: string };

  if (!provider || !apiKey) {
    res.status(400).json({ data: null, error: { code: 'BAD_REQUEST', message: 'provider and apiKey required' } });
    return;
  }

  // Format validation first (no network call for obviously bad keys)
  // ... regex check ...

  // Lightweight test call per provider
  try {
    if (provider === 'gemini') {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });
      await ai.models.generateContent({ model: 'gemini-2.0-flash', contents: 'hi', config: { maxOutputTokens: 1 } });
    } else if (provider === 'openai') {
      const OpenAI = (await import('openai')).default;
      const client = new OpenAI({ apiKey });
      await client.models.list();
    } else if (provider === 'anthropic') {
      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const client = new Anthropic({ apiKey });
      await client.models.list();
    }
    res.json({ data: { valid: true }, error: null });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    // Redact key from error message
    const safeMsg = apiKey ? msg.replace(apiKey, '[REDACTED]') : msg;
    res.json({ data: { valid: false, message: safeMsg }, error: null });
  }
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Module-level `const ai = new GoogleGenAI(...)` | Constructor injection of `apiKey` + `model` | This phase | Enables per-request BYOK instantiation |
| `aiProvider` singleton export from config.ts | `getDefaultProvider()` factory + `createByokProvider()` factory | This phase | Routes can use different providers per request |
| Hardcoded `FREE_TIER_MODELS` with 6 models | Trimmed to 2 models (Flash 2.0 + Lite) | This phase | Less noise, more predictable fallback |
| OpenAI/Anthropic as stubs only | Full implementations | This phase | Users can actually use these providers |
| No key storage | AES-GCM encrypted localStorage | This phase | BYOK keys persist across page reloads |

**Current model IDs (verified 2026-03-12):**

| Provider | Model Label | API Model ID |
|----------|-------------|--------------|
| Anthropic | Claude Sonnet 4.6 | `claude-sonnet-4-6` |
| Anthropic | Claude Haiku 4.5 | `claude-haiku-4-5-20251001` |
| OpenAI | GPT-4o | `gpt-4o` |
| OpenAI | GPT-4o Mini | `gpt-4o-mini` |
| Gemini (BYOK) | Flash 2.0 | `gemini-2.0-flash` |
| Gemini (BYOK) | Flash 2.0 Lite | `gemini-2.0-flash-lite` |
| Gemini (BYOK) | Pro 2.5 | `gemini-2.5-pro` |
| Gemini (free tier) | Flash 2.0 (primary) | `gemini-2.0-flash` |
| Gemini (free tier) | Flash 2.0 Lite (fallback) | `gemini-2.0-flash-lite` |

**Note:** `gemini-2.0-flash` is scheduled for retirement June 1, 2026. This is acceptable for launch but should be tracked.

---

## Open Questions

1. **OpenAI Web Search (OpenAISearchProvider) implementation scope**
   - What we know: `openai-search.ts` is a stub. PROV-08 says it appears as an option when OpenAI BYOK is selected.
   - What's unclear: Does this phase implement the actual OpenAI Web Search API, or just the UI toggle with the stub remaining?
   - Recommendation: Implement the real OpenAISearchProvider using the `openai` npm SDK's web search tool calling. If too complex, implement as: if `searchProvider === 'openai-search'`, fall back to Tavily with a note — but better to implement properly since the SDK is already being installed.

2. **BYOK rate limiter placement for BYOK vs free-tier routes**
   - What we know: 30 req/min for BYOK users. The existing IP limiter covers all routes at 100/15min.
   - What's unclear: Should the per-user BYOK limiter apply to all routes when `byok` is present in the body, or only specific routes?
   - Recommendation: Apply `byokRateLimiter` middleware only when `req.body.byok` is present. Can be a conditional inside the route handler, or a separate router middleware that checks for `byok` presence.

3. **Anthropic `messages.stream()` AbortSignal support**
   - What we know: The Anthropic SDK's `messages.stream()` does not natively accept an AbortSignal in the same way as `fetch`.
   - What's unclear: Whether the AbortController can be wired into the Anthropic stream.
   - Recommendation: Use `for await` loop with `if (signal?.aborted) break` check per iteration. This doesn't abort the network request immediately but stops processing chunks. Acceptable for this use case.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Frontend Framework | Vitest ^4.0.18 + @testing-library/react ^16.3.2 |
| Frontend Config | `frontend/vitest.config.ts` |
| Frontend Quick Run | `cd frontend && npx vitest run` |
| Frontend Full Suite | `cd frontend && npx vitest run --reporter=verbose` |
| Backend Framework | Jest ^30.2.0 + ts-jest |
| Backend Config | `backend/package.json` (jest field implied) |
| Backend Quick Run | `cd backend && npm test` |
| Backend Full Suite | `cd backend && npm test -- --verbose` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PROV-06 | Verify Key button shows green/red inline | unit | `cd frontend && npx vitest run src/tests/settingsModal.test.tsx` | ❌ Wave 0 |
| PROV-12 | SettingsContext state management | unit | `cd frontend && npx vitest run src/tests/settingsContext.test.ts` | ❌ Wave 0 |
| PROV-13 | AES-GCM encrypt/decrypt round trip | unit | `cd frontend && npx vitest run src/tests/cryptoStorage.test.ts` | ❌ Wave 0 |
| PROV-14 | Key cleared on sign-out | unit | `cd frontend && npx vitest run src/tests/settingsContext.test.ts` | ❌ Wave 0 |
| PROV-15 | Key masked to last 4 chars display | unit | `cd frontend && npx vitest run src/tests/settingsModal.test.tsx` | ❌ Wave 0 |
| BKND-01 | Factory functions return correct providers | unit | `cd backend && npm test -- --testPathPattern=providers` | ❌ Wave 0 (update existing) |
| BKND-04 | GeminiProvider(apiKey, model) works | unit | `cd backend && npm test -- --testPathPattern=providers` | ❌ Wave 0 (update existing) |
| BKND-05 | OpenAIProvider streamChat maps roles | unit | `cd backend && npm test -- --testPathPattern=providers` | ❌ Wave 0 |
| BKND-06 | AnthropicProvider implements AIProvider | unit | `cd backend && npm test -- --testPathPattern=providers` | ❌ Wave 0 |
| BKND-07 | API key not present in logged body | unit | `cd backend && npm test -- --testPathPattern=sanitize` | ❌ Wave 0 |
| BKND-10 | Key format validation regex | unit | `cd backend && npm test -- --testPathPattern=verify` | ❌ Wave 0 |
| BKND-11 | Per-user rate limiter 30 req/min | unit | `cd backend && npm test -- --testPathPattern=byokRateLimit` | ❌ Wave 0 |
| XCUT-02 | Focus trapped inside modal | unit | `cd frontend && npx vitest run src/tests/settingsModal.test.tsx` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `cd frontend && npx vitest run` and `cd backend && npm test`
- **Per wave merge:** Full suite across both frontend and backend
- **Phase gate:** Both test suites green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `frontend/src/tests/settingsModal.test.tsx` — covers PROV-06, PROV-15, XCUT-02
- [ ] `frontend/src/tests/settingsContext.test.ts` — covers PROV-12, PROV-13, PROV-14
- [ ] `frontend/src/tests/cryptoStorage.test.ts` — covers PROV-13 (AES-GCM round-trip)
- [ ] `backend/tests/providers.test.ts` — UPDATE existing: remove stub tests, add factory + new provider tests
- [ ] `backend/tests/verifyKey.test.ts` — covers BKND-10 (key format validation; mock actual API calls)
- [ ] `backend/tests/byokRateLimiter.test.ts` — covers BKND-11
- [ ] `backend/tests/sanitizeBody.test.ts` — covers BKND-07

---

## Sources

### Primary (HIGH confidence)
- Official Anthropic models page (platform.claude.com/docs/en/about-claude/models/overview) — verified model IDs: `claude-sonnet-4-6`, `claude-haiku-4-5-20251001`
- Existing codebase: `backend/src/providers/types.ts`, `gemini.ts`, `config.ts`, `routes/chat.ts` — direct read
- MDN Web Crypto API (developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt) — AES-GCM pattern
- express-rate-limit npm (keyGenerator pattern) — confirmed via WebSearch + documentation

### Secondary (MEDIUM confidence)
- WebSearch: @anthropic-ai/sdk v0.78.0 streaming pattern — `messages.stream()` + event loop
- WebSearch: openai npm v6.27.0 streaming pattern — `chat.completions.create({ stream: true })` + `for await`
- WebSearch: Gemini model IDs — `gemini-2.0-flash`, `gemini-2.5-flash`, `gemini-2.5-pro` confirmed via Google AI docs
- WebSearch: focus-trap-react + custom useFocusTrap hook patterns — multiple sources agree

### Tertiary (LOW confidence)
- OpenAI `client.models.list()` as key validator — community-confirmed pattern, not official docs
- Anthropic `client.models.list()` as key validator — docs.anthropic.com/en/api/models-list confirms endpoint exists

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — SDKs verified via npm search, versions confirmed
- Architecture: HIGH — directly derived from existing codebase patterns
- Model IDs: HIGH (Anthropic) / MEDIUM (OpenAI, Gemini) — Anthropic verified via official docs, OpenAI/Gemini via search
- Pitfalls: HIGH — most derived from reading actual code discrepancies (role name mismatch, module-level init)
- Crypto Pattern: HIGH — MDN Web Crypto is authoritative

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (30 days) — note Gemini 2.0 Flash retires June 1, 2026
