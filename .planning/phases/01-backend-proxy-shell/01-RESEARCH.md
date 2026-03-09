# Phase 1: Backend Proxy Shell - Research

**Researched:** 2026-03-08
**Domain:** Node.js + Express authenticated proxy — Gemini streaming, Tavily search, Clerk JWT, rate limiting, provider abstraction
**Confidence:** HIGH (all findings verified against current official docs or npm)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UI-04 | AI provider abstracted behind `chat()`, `findSources()`, `simplify()` interface; switching between Gemini+Tavily and OpenAI+Responses API requires only an `AI_PROVIDER` env var change | Provider abstraction pattern documented; `@google/genai` + `@tavily/core` are v1 implementations; OpenAI stub pattern described |
| AUTH-04 | Every backend API call validates the Clerk JWT before processing if user is authenticated | `@clerk/express` `clerkMiddleware()` + `getAuth()` pattern verified; returns 401 JSON for API routes |
| UI-03 | Backend enforces per-user (or per-IP for unauthenticated) rate limiting on all API routes | `express-rate-limit` with `keyGenerator` using Clerk `userId` or fallback to `req.ip` |

</phase_requirements>

---

## Summary

Phase 1 builds the Express backend in isolation — no frontend exists yet. The gate is: `curl /api/chat` with a valid Clerk JWT returns SSE chunks; without a JWT, every route returns a structured 401 JSON response. The provider abstraction (`chat()`, `findSources()`, `simplify()`) must be designed here because retrofitting it after Gemini code is entangled with route handlers is expensive.

**Critical SDK update:** The prior stack research referenced `@google/generative-ai` as the Gemini SDK. That package is now officially deprecated as of November 30, 2025, with support ended. The replacement is `@google/genai` (GA as of May 2025, currently at v1.x). The API shape changed meaningfully — client initialization, the streaming call site, and the system instruction format all differ. All code in this phase must use `@google/genai`, not the deprecated package.

**Clerk pattern for APIs:** `requireAuth()` is designed for full-stack apps with redirects. For pure API backends, the correct pattern is `clerkMiddleware()` globally plus a custom `requireApiAuth` middleware that calls `getAuth(req)` and returns `{ data: null, error: { code: 'UNAUTHORIZED', message: '...' } }` with status 401. This must wrap every route before any handler logic.

**Primary recommendation:** Scaffold the Express server with TypeScript, wire `clerkMiddleware()` globally, create a single `authenticatedRouter`, add `express-rate-limit` with `keyGenerator`, implement `GeminiProvider` + `TavilyProvider` behind the interface, and validate with curl before any frontend work begins.

---

## Standard Stack

### Core Backend
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js | 20.x LTS | Runtime | LTS stability; Render supports it; 22.x is too new for production confidence |
| Express | 4.19.x | HTTP server + routing | Express 5 released but middleware ecosystem is solidly tested on 4; no compelling reason to use 5 |
| TypeScript | 5.x | Type safety | Provider abstraction interfaces, AuthenticatedRequest extension, SSE handler types |
| ts-node / tsx | latest | TypeScript dev execution | `tsx` is faster than `ts-node` for watch mode; either works |
| dotenv | 16.x | `.env` loading | Load `GEMINI_API_KEY`, `TAVILY_API_KEY`, `CLERK_SECRET_KEY`, `AI_PROVIDER` |
| cors | 2.x | CORS headers | Allow Vite dev server (localhost:5173) origin; lock to Vercel origin in production |

### Auth
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @clerk/express | 1.x | JWT validation middleware | Official Clerk SDK for Express; replaces deprecated `@clerk/clerk-sdk-node`; provides `clerkMiddleware()` and `getAuth()` |

### AI Provider
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @google/genai | 1.x | Gemini 2.0 Flash API — streaming + single-shot | **Replaces deprecated `@google/generative-ai`** (EOL Nov 2025). Direct API key auth; no GCP service account needed; supports `generateContentStream()` as async iterable |

### Search Provider
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tavily/core | 0.7.x | Tavily web search for `findSources()` | Official Tavily JS client (scoped package); do NOT use unscoped `tavily` package (third-party wrapper) |

### Rate Limiting
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| express-rate-limit | 7.x | Per-user and per-IP rate limiting | Standard Express rate limiter; `keyGenerator` function enables per-user limiting using Clerk `userId` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@google/genai` | `@google/generative-ai` | `@google/generative-ai` is officially deprecated and EOL as of Nov 30, 2025. Do not use. |
| `@google/genai` | Vercel AI SDK (`ai` package) | Vercel AI SDK adds a second abstraction layer on top of the project's own provider abstraction — unnecessary indirection |
| `@clerk/express` | manual `jsonwebtoken` | Clerk handles key rotation, JWKS fetching, and session revocation automatically; manual JWT is error-prone |
| `express-rate-limit` in-memory store | Redis store | Redis adds infrastructure complexity; in-memory is sufficient for single Render instance v1; add Redis if horizontal scaling becomes needed |

**Installation:**
```bash
# In /server
mkdir server && cd server
npm init -y
npm install express cors dotenv @google/genai @tavily/core @clerk/express express-rate-limit
npm install -D typescript @types/express @types/node tsx nodemon
```

---

## Architecture Patterns

### Recommended Project Structure
```
server/
├── src/
│   ├── index.ts              # Entry point: app setup, global middleware, mount router
│   ├── config.ts             # Env var loading + provider factory (reads AI_PROVIDER)
│   ├── middleware/
│   │   ├── auth.ts           # requireApiAuth — calls getAuth(), returns 401 JSON if no userId
│   │   └── rateLimiter.ts    # express-rate-limit config with keyGenerator
│   ├── providers/
│   │   ├── types.ts          # AIProvider + SearchProvider interfaces
│   │   ├── gemini.ts         # GeminiProvider implements AIProvider
│   │   ├── tavily.ts         # TavilyProvider implements SearchProvider
│   │   ├── openai.ts         # OpenAIProvider stub (throws NotImplementedError)
│   │   └── openai-search.ts  # OpenAISearchProvider stub
│   └── routes/
│       ├── index.ts          # Mounts all routes on authenticatedRouter
│       ├── chat.ts           # POST /api/chat — SSE streaming
│       ├── simplify.ts       # POST /api/simplify — single-shot JSON
│       └── find-sources.ts   # POST /api/find-sources — single-shot JSON
├── .env                      # Not committed
├── .env.example              # Committed — documents all env vars
├── package.json
└── tsconfig.json
```

### Pattern 1: Provider Interface (Design from UI Needs)
**What:** A TypeScript interface defined by what the UI features need, not by what the Gemini API provides. Two concrete implementations behind it.
**When to use:** Always — the interface is the contract. Route handlers only import from `config.ts`; they never instantiate providers directly.

```typescript
// Source: project decision from ARCHITECTURE.md + STATE.md
// server/src/providers/types.ts

export interface Message {
  role: 'user' | 'model';
  content: string;
}

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface AIProvider {
  // Streaming chat — yields text chunks
  streamChat(
    messages: Message[],
    systemPrompt: string,
    onChunk: (chunk: string) => void,
    onDone: () => void,
    onError: (err: Error) => void,
    signal?: AbortSignal
  ): Promise<void>;

  // Single-shot text rewrite (simplify)
  simplify(text: string, mode: string): Promise<string>;
}

export interface SearchProvider {
  findSources(query: string, maxResults?: number): Promise<SearchResult[]>;
}
```

### Pattern 2: Provider Factory (Single Env Var Switch)
**What:** `config.ts` reads `AI_PROVIDER` and exports singleton instances. Route handlers import `aiProvider` and `searchProvider` — they never branch on the env var.
**When to use:** Always — no `if (AI_PROVIDER === 'gemini')` in route handlers.

```typescript
// Source: project decision from STATE.md
// server/src/config.ts
import { GeminiProvider } from './providers/gemini.js';
import { TavilyProvider } from './providers/tavily.js';
import { OpenAIProvider } from './providers/openai.js';
import { OpenAISearchProvider } from './providers/openai-search.js';
import type { AIProvider, SearchProvider } from './providers/types.js';

const PROVIDER = process.env.AI_PROVIDER ?? 'gemini';

export const aiProvider: AIProvider =
  PROVIDER === 'openai' ? new OpenAIProvider() : new GeminiProvider();

export const searchProvider: SearchProvider =
  PROVIDER === 'openai' ? new OpenAISearchProvider() : new TavilyProvider();
```

### Pattern 3: Gemini Provider with New SDK
**What:** `@google/genai` (v1.x) — the replacement for deprecated `@google/generative-ai`. The API changed significantly.
**When to use:** All Gemini calls in this project must use this SDK, not the old one.

```typescript
// Source: https://ai.google.dev/gemini-api/docs/migrate
// server/src/providers/gemini.ts
import { GoogleGenAI } from '@google/genai';
import type { AIProvider, Message } from './types.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export class GeminiProvider implements AIProvider {
  async streamChat(
    messages: Message[],
    systemPrompt: string,
    onChunk: (chunk: string) => void,
    onDone: () => void,
    onError: (err: Error) => void,
    signal?: AbortSignal
  ): Promise<void> {
    try {
      const contents = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      const response = await ai.models.generateContentStream({
        model: 'gemini-2.0-flash',
        contents,
        config: { systemInstruction: systemPrompt }
      });

      for await (const chunk of response) {
        if (signal?.aborted) break;
        const text = chunk.text;
        if (text) onChunk(text);
      }
      onDone();
    } catch (err) {
      onError(err instanceof Error ? err : new Error(String(err)));
    }
  }

  async simplify(text: string, mode: string): Promise<string> {
    const prompt = buildSimplifyPrompt(text, mode); // internal helper
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt
    });
    return response.text ?? '';
  }
}
```

### Pattern 4: SSE Streaming Route
**What:** Express route that opens SSE headers, iterates provider stream, writes normalized `data:` events, handles client disconnect via `AbortController`.
**When to use:** `/api/chat` route only. Non-streaming routes return plain JSON.

```typescript
// Source: ARCHITECTURE.md SSE pattern + project decisions
// server/src/routes/chat.ts
import { Router } from 'express';
import { requireApiAuth } from '../middleware/auth.js';
import { aiProvider } from '../config.js';

export const chatRouter = Router();

chatRouter.post('/', requireApiAuth, async (req, res) => {
  const { messages, systemPrompt } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const controller = new AbortController();
  req.on('close', () => controller.abort());

  const writeEvent = (data: object) =>
    res.write(`data: ${JSON.stringify(data)}\n\n`);

  await aiProvider.streamChat(
    messages,
    systemPrompt ?? '',
    (chunk) => writeEvent({ type: 'chunk', text: chunk }),
    () => { writeEvent({ type: 'done' }); res.end(); },
    (err) => { writeEvent({ type: 'error', message: err.message }); res.end(); },
    controller.signal
  );
});
```

### Pattern 5: Clerk Authentication Middleware for APIs
**What:** `clerkMiddleware()` globally attaches auth state; a custom `requireApiAuth` guard returns 401 JSON (not a redirect) for unauthenticated requests.
**When to use:** `clerkMiddleware()` on `app`; `requireApiAuth` on every route in the authenticated router.

```typescript
// Source: https://clerk.com/docs/reference/express/overview
// server/src/middleware/auth.ts
import { getAuth } from '@clerk/express';
import type { Request, Response, NextFunction } from 'express';

export function requireApiAuth(req: Request, res: Response, next: NextFunction) {
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({
      data: null,
      error: { code: 'UNAUTHORIZED', message: 'Valid authentication required' }
    });
  }
  next();
}
```

```typescript
// server/src/index.ts (global middleware)
import { clerkMiddleware } from '@clerk/express';
app.use(clerkMiddleware());
// clerkMiddleware() MUST be registered before any route that calls getAuth()
```

### Pattern 6: Per-User Rate Limiting
**What:** `express-rate-limit` with `keyGenerator` that uses the Clerk `userId` for authenticated requests and falls back to `req.ip` for unauthenticated ones. Applied to the authenticated router.
**When to use:** All API routes.

```typescript
// Source: express-rate-limit docs + Clerk getAuth pattern
// server/src/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';
import { getAuth } from '@clerk/express';

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,                // 100 requests per window
  keyGenerator: (req) => {
    const { userId } = getAuth(req);
    return userId ?? (req.ip ?? 'unknown');
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      data: null,
      error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later' }
    });
  }
});
```

### Pattern 7: Standard Response Envelope
**What:** All non-streaming routes return `{ data: ..., error: null }` on success, `{ data: null, error: { code, message } }` on failure. HTTP status codes: 200 success, 400 validation, 401 auth, 429 rate limit, 502 upstream.
**When to use:** `/api/simplify` and `/api/find-sources` responses. SSE streaming events use the inline `{ type, ... }` format instead.

```typescript
// Simplify route example
router.post('/simplify', requireApiAuth, async (req, res) => {
  const { text, mode } = req.body;
  if (!text || !mode) {
    return res.status(400).json({
      data: null,
      error: { code: 'BAD_REQUEST', message: 'text and mode are required' }
    });
  }
  try {
    const rewritten = await aiProvider.simplify(text, mode);
    res.json({ data: { rewritten }, error: null });
  } catch (err) {
    res.status(502).json({
      data: null,
      error: { code: 'UPSTREAM_ERROR', message: 'AI provider request failed' }
    });
  }
});
```

### Pattern 8: Tavily Search Implementation
**What:** `@tavily/core` `tavily()` factory with `search()` method. Returns `results` array with `title`, `url`, `content`, `score`.
**When to use:** `TavilyProvider.findSources()` implementation.

```typescript
// Source: https://docs.tavily.com/sdk/javascript/quick-start
// server/src/providers/tavily.ts
import { tavily } from '@tavily/core';
import type { SearchProvider, SearchResult } from './types.js';

const client = tavily({ apiKey: process.env.TAVILY_API_KEY! });

export class TavilyProvider implements SearchProvider {
  async findSources(query: string, maxResults = 3): Promise<SearchResult[]> {
    const response = await client.search(query, { maxResults });
    return response.results.map(r => ({
      title: r.title,
      url: r.url,
      content: r.content,
      score: r.score
    }));
  }
}
```

### Pattern 9: OpenAI Stub (Force Interface Completeness)
**What:** Stub implementations that throw `NotImplementedError`. Forces the interface to be complete before the second provider is needed.
**When to use:** Ship these stubs in Phase 1. They prove the abstraction compiles with two implementations.

```typescript
// server/src/providers/openai.ts
import type { AIProvider, Message } from './types.js';

export class OpenAIProvider implements AIProvider {
  streamChat(): Promise<void> {
    throw new Error('OpenAIProvider not yet implemented. Set AI_PROVIDER=gemini.');
  }
  simplify(): Promise<string> {
    throw new Error('OpenAIProvider not yet implemented. Set AI_PROVIDER=gemini.');
  }
}
```

### Anti-Patterns to Avoid

- **`requireAuth()` on API routes:** `requireAuth()` redirects unauthenticated users to a sign-in page. For REST APIs, always use `clerkMiddleware()` + `getAuth()` + manual 401 JSON response.
- **Using `@google/generative-ai`:** This package is EOL. `npm install @google/generative-ai` installs a deprecated library. Use `@google/genai`.
- **Calling `getAuth()` before `clerkMiddleware()`:** `clerkMiddleware()` must be registered globally on `app` before any route that calls `getAuth()`. If `clerkMiddleware()` is not applied, `getAuth()` returns no `userId` even for valid JWTs.
- **Provider-specific logic in route handlers:** Route handlers must only call `aiProvider.streamChat()`, `aiProvider.simplify()`, `searchProvider.findSources()`. Any `if (AI_PROVIDER === 'gemini')` branches in route handlers defeat the abstraction.
- **Not calling `res.flushHeaders()` before the async stream starts:** Without `flushHeaders()`, the SSE headers aren't sent until the first `res.write()`. Some clients and proxies buffer until headers are flushed, causing delayed streaming onset.
- **Not handling `req.on('close', ...)` on the streaming route:** If the client disconnects mid-stream, the Gemini SDK will continue making API calls and consuming quota unless the `AbortSignal` is triggered.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT validation + JWKS fetching | Custom `jsonwebtoken` + JWKS endpoint fetching | `@clerk/express` `clerkMiddleware()` + `getAuth()` | Key rotation, JWKS caching, session revocation, token expiry — all handled by Clerk SDK |
| SSE text encoding | Manual `TextEncoder` + chunking | `res.write('data: ...\n\n')` — Express handles it | Express response write handles encoding; just format the SSE event string correctly |
| Rate limiting state | Custom in-memory Map with TTL cleanup | `express-rate-limit` | Handles window expiry, memory management, multiple stores (Redis when needed) |
| Gemini API authentication | Manual API key headers in fetch calls | `@google/genai` SDK | SDK manages auth, retry logic, and response parsing |

**Key insight:** All the complexity in this phase is integration work, not custom infrastructure. Every significant problem (JWT, rate limiting, AI streaming, search) has a well-maintained library that handles the edge cases. The only custom code should be the thin provider adapter classes and the response envelope format.

---

## Common Pitfalls

### Pitfall 1: Wrong Gemini SDK Package
**What goes wrong:** `npm install @google/generative-ai` installs a deprecated library that reached end-of-life November 30, 2025. Code using the old package will have different initialization (`new GoogleGenerativeAI()` vs `new GoogleGenAI()`), different stream access (`.stream` property vs direct `for await`), and missing access to newer Gemini features.
**Why it happens:** Search results, tutorials, and older Stack Overflow answers still reference `@google/generative-ai`. The package still exists on npm but is deprecated.
**How to avoid:** Always install `@google/genai`. Verify by checking `package.json` — the package name is `@google/genai`, not `@google/generative-ai`.
**Warning signs:** Import of `GoogleGenerativeAI` (old) vs `GoogleGenAI` (new); streaming via `.stream` property (old) vs direct `for await` on response (new).

### Pitfall 2: Clerk Middleware Order
**What goes wrong:** `clerkMiddleware()` is registered after some routes. Those routes call `getAuth(req)` and get `{ userId: null }` even for requests with valid JWTs, causing spurious 401 responses.
**Why it happens:** Express middleware is order-dependent. `clerkMiddleware()` must populate `req.auth` before any handler reads it.
**How to avoid:** Register `app.use(clerkMiddleware())` as the very first middleware, before CORS, rate limiting, or any route mounting.
**Warning signs:** Valid JWT returns 401; `getAuth(req).userId` is null even with correct Authorization header.

### Pitfall 3: Auth Middleware Not Applied to All Routes
**What goes wrong:** A new route is added directly to `app` (bypassing the authenticated router), inheriting global `clerkMiddleware()` but not `requireApiAuth`. Unauthenticated requests to that route succeed.
**Why it happens:** Express Router instances don't automatically share middleware. Adding `requireApiAuth` to the router doesn't protect routes on `app` directly.
**How to avoid:** Single `authenticatedRouter` instance with `requireApiAuth` at the top. All API routes mount on this router. Write a curl test asserting 401 on every route without a JWT — run it before every deployment.
**Warning signs:** A route returns 200 for a curl without an Authorization header.

### Pitfall 4: Provider Abstraction Leaks Gemini Shapes
**What goes wrong:** The `AIProvider` interface is designed by wrapping the Gemini SDK call, producing a `generateContent(request: GeminiRequest)` interface instead of `chat(messages, systemPrompt)`. When OpenAI provider is added, the interface doesn't map to OpenAI's paradigm.
**Why it happens:** Developers design the interface by looking at the SDK they're implementing rather than what the UI needs.
**How to avoid:** Define the interface in `types.ts` before writing any provider implementation. Methods are `streamChat()`, `simplify()`, `findSources()` — feature-oriented names, not SDK-oriented names.
**Warning signs:** Interface method takes a `GenerateContentRequest` type or imports anything from `@google/genai`.

### Pitfall 5: SSE Connection Not Aborted on Client Disconnect
**What goes wrong:** Client navigates away or closes the tab mid-stream. The Express `req` socket closes, but the Gemini streaming loop continues to `for await` and consume API quota.
**Why it happens:** Node.js HTTP connections close silently; the application must listen for the `close` event explicitly.
**How to avoid:** Create `AbortController`; pass its `signal` to the streaming call; trigger `controller.abort()` in `req.on('close', ...)`.
**Warning signs:** Gemini API quota consumed faster than user count suggests; Render logs show streaming continuing after client connections close.

### Pitfall 6: Missing `res.flushHeaders()` Before Async Stream
**What goes wrong:** SSE stream appears to work in testing but delays delivery of the first chunk by several seconds in production, especially through proxies and load balancers.
**Why it happens:** Without `res.flushHeaders()`, Express buffers the headers until the first `res.write()`. HTTP infrastructure often waits for a full response header + body before forwarding.
**How to avoid:** Call `res.flushHeaders()` immediately after setting SSE headers, before the async provider call.
**Warning signs:** Streaming works with direct connections but buffers for several seconds through Render or any proxy.

---

## Code Examples

Verified patterns from official sources:

### New Gemini SDK Initialization and Streaming
```typescript
// Source: https://ai.google.dev/gemini-api/docs/migrate
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// Streaming with multi-turn history
const response = await ai.models.generateContentStream({
  model: 'gemini-2.0-flash',
  contents: [
    { role: 'user', parts: [{ text: 'Hello' }] },
    { role: 'model', parts: [{ text: 'Hi! How can I help?' }] },
    { role: 'user', parts: [{ text: 'Explain recursion.' }] }
  ],
  config: { systemInstruction: 'You are a helpful programming tutor.' }
});

for await (const chunk of response) {
  process.stdout.write(chunk.text ?? '');
}
```

### Non-Streaming Gemini Call (Simplify)
```typescript
// Source: https://ai.google.dev/gemini-api/docs/migrate
const response = await ai.models.generateContent({
  model: 'gemini-2.0-flash',
  contents: 'Rewrite this for a 10-year-old: ' + text,
  config: { systemInstruction: 'You are a writing assistant.' }
});
const rewritten = response.text; // string
```

### Tavily Search
```typescript
// Source: https://docs.tavily.com/sdk/javascript/quick-start
import { tavily } from '@tavily/core';

const client = tavily({ apiKey: process.env.TAVILY_API_KEY! });
const response = await client.search(query, { maxResults: 3 });
// response.results: Array<{ title, url, content, score }>
```

### Clerk Middleware Setup
```typescript
// Source: https://clerk.com/docs/reference/express/overview
import { clerkMiddleware, getAuth } from '@clerk/express';
import express from 'express';

const app = express();
app.use(clerkMiddleware()); // Must be first

// Custom API auth guard (NOT requireAuth — that redirects)
const requireApiAuth = (req, res, next) => {
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({
      data: null,
      error: { code: 'UNAUTHORIZED', message: 'Valid authentication required' }
    });
  }
  next();
};
```

### Per-User Rate Limiting
```typescript
// Source: express-rate-limit docs + getAuth pattern
import rateLimit from 'express-rate-limit';
import { getAuth } from '@clerk/express';

const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  keyGenerator: (req) => {
    const { userId } = getAuth(req);
    return userId ?? (req.ip ?? 'anonymous');
  }
});
```

### Express App Entry Point Structure
```typescript
// server/src/index.ts
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { requireApiAuth } from './middleware/auth.js';
import { chatRouter } from './routes/chat.js';
import { simplifyRouter } from './routes/simplify.js';
import { findSourcesRouter } from './routes/find-sources.js';

const app = express();

// Global middleware — ORDER MATTERS
app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173' }));
app.use(express.json());
app.use(clerkMiddleware()); // Must be before any getAuth() call
app.use('/api', apiRateLimiter); // Rate limit all /api routes

// Authenticated routes
const apiRouter = express.Router();
apiRouter.use(requireApiAuth); // Protects all routes below
apiRouter.use('/chat', chatRouter);
apiRouter.use('/simplify', simplifyRouter);
apiRouter.use('/find-sources', findSourcesRouter);
app.use('/api', apiRouter);

app.listen(process.env.PORT ?? 3001);
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@google/generative-ai` | `@google/genai` | GA May 2025, old package EOL Nov 30 2025 | New import path, new client class (`GoogleGenAI`), streaming via `for await` directly on response (no `.stream` property), `config.systemInstruction` for system prompt |
| `GoogleGenerativeAI().getGenerativeModel()` | `new GoogleGenAI({ apiKey })` then `ai.models.*` | May 2025 | Flatter API; all operations through unified `ai` client |
| `.stream` async iterable property | Direct `for await (const chunk of response)` | May 2025 | Simpler iteration; `chunk.text` (no function call) |
| `@clerk/clerk-sdk-node` | `@clerk/express` | 2024 | Old package deprecated; `@clerk/express` provides `clerkMiddleware()` and `getAuth()` |
| `requireAuth()` for API backends | `clerkMiddleware()` + `getAuth()` + manual 401 | Current | `requireAuth()` redirects; APIs need explicit 401 JSON |

**Deprecated/outdated:**
- `@google/generative-ai`: EOL. All docs from before mid-2025 referencing this package are outdated.
- `@clerk/clerk-sdk-node`: Deprecated in favor of `@clerk/express`.
- `EventSource` for authenticated SSE: Cannot send Authorization headers. Use `fetch` + `ReadableStream` on the frontend (this affects how the frontend consumes the backend built in this phase).

---

## Open Questions

1. **`chunk.text` nullable in `@google/genai`**
   - What we know: The migration guide shows `chunk.text` (property access, not method call). Some chunks may have `undefined` text (metadata chunks).
   - What's unclear: Whether `chunk.text` is typed as `string | undefined` and whether empty chunks need explicit filtering.
   - Recommendation: Add `if (text)` guard before calling `onChunk(text)`. Emit only non-empty chunks to SSE.

2. **Tavily `maxResults` parameter field name**
   - What we know: From search results, `maxResults` is mentioned as a parameter. The response has `results` array.
   - What's unclear: The exact TypeScript option type for `@tavily/core` v0.7.x (could be `max_results` snake_case per REST API convention).
   - Recommendation: Verify against the `@tavily/core` TypeScript type definitions after install. The SDK wraps the REST API, and Tavily's REST API uses `max_results`; the JS SDK may normalize to camelCase.

3. **Render and SSE connection behavior**
   - What we know: Render free tier has cold starts and connection timeouts.
   - What's unclear: Whether Render's proxy layer buffers SSE chunks or passes them through immediately. Paid tiers may differ.
   - Recommendation: Test curl streaming on the actual Render deployment before declaring the phase complete. The success criterion requires SSE chunks arriving progressively — this must be verified on Render, not just localhost.

4. **`clerkMiddleware()` options for production**
   - What we know: `clerkMiddleware()` works without options in development.
   - What's unclear: Whether production requires explicit `publishableKey` or `secretKey` options or if environment variable names (`CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`) are picked up automatically.
   - Recommendation: Set `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` as environment variables and let the SDK auto-detect them. Verify in Render dashboard environment settings.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — Wave 0 must install |
| Config file | none — see Wave 0 |
| Quick run command | `npx jest --testPathPattern=auth --passWithNoTests` |
| Full suite command | `npx jest` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-04 | `POST /api/chat` without JWT returns `{ data: null, error: { code: 'UNAUTHORIZED' } }` status 401 | integration | `npx jest tests/auth.test.ts -t "returns 401"` | Wave 0 |
| AUTH-04 | `POST /api/simplify` without JWT returns 401 | integration | `npx jest tests/auth.test.ts -t "simplify 401"` | Wave 0 |
| AUTH-04 | `POST /api/find-sources` without JWT returns 401 | integration | `npx jest tests/auth.test.ts -t "find-sources 401"` | Wave 0 |
| UI-04 | `AI_PROVIDER=openai` starts server without crashing (stub throws, doesn't crash on init) | unit | `npx jest tests/providers.test.ts -t "openai stub"` | Wave 0 |
| UI-03 | Rate limiter `keyGenerator` returns `userId` for authenticated requests | unit | `npx jest tests/rateLimiter.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest tests/auth.test.ts --passWithNoTests`
- **Per wave merge:** `npx jest`
- **Phase gate:** Full suite green; curl test against live Render deployment confirms SSE streaming before Phase 2 begins

### Wave 0 Gaps
- [ ] `server/tests/auth.test.ts` — 401 assertions for all three routes
- [ ] `server/tests/providers.test.ts` — provider factory, stub behavior
- [ ] `server/tests/rateLimiter.test.ts` — keyGenerator unit test
- [ ] `server/jest.config.ts` — Jest config for TypeScript (or vitest alternative)
- [ ] Framework install: `npm install -D jest @types/jest ts-jest supertest @types/supertest` — or `vitest` if preferred

---

## Sources

### Primary (HIGH confidence)
- [Gemini SDK Migration Guide](https://ai.google.dev/gemini-api/docs/migrate) — `@google/genai` vs deprecated `@google/generative-ai`; new streaming API shape; `contents` format for multi-turn; `config.systemInstruction`
- [Clerk Express Overview](https://clerk.com/docs/reference/express/overview) — `clerkMiddleware()` + `getAuth()` pattern; `requireAuth()` is NOT for API routes
- [Clerk requireAuth Reference](https://clerk.com/docs/reference/express/require-auth) — confirmed: do not use on API routes
- [Clerk Express Quickstart](https://clerk.com/docs/quickstarts/express) — setup order, global middleware registration
- [deprecated-generative-ai-js GitHub](https://github.com/google-gemini/deprecated-generative-ai-js) — confirms EOL Nov 30 2025

### Secondary (MEDIUM confidence)
- [@google/genai npm page](https://www.npmjs.com/package/@google/genai) — v1.x version confirmed; GA status
- [@tavily/core quickstart](https://docs.tavily.com/sdk/javascript/quick-start) — `tavily()` factory pattern; `search()` method
- [tavily-js GitHub](https://github.com/tavily-ai/tavily-js) — `@tavily/core` is official; response `results` array structure
- [express-rate-limit npm](https://www.npmjs.com/package/express-rate-limit) — `keyGenerator` option for per-user limiting
- WebSearch result for Tavily response structure — `results[].title`, `url`, `content`, `score` fields; `maxResults` parameter

### Tertiary (LOW confidence / verify before use)
- `@tavily/core` `maxResults` vs `max_results` parameter casing — verify from TypeScript type definitions after install
- Render SSE behavior — streaming through Render's proxy layer must be empirically verified on deployment

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified via official docs; one critical correction from prior research (`@google/genai` replaces `@google/generative-ai`)
- Architecture: HIGH — derived from project decisions in STATE.md/ARCHITECTURE.md + verified Clerk and Gemini patterns
- Pitfalls: HIGH — grounded in official SDK behavior and project-specific decisions

**Research date:** 2026-03-08
**Valid until:** 2026-06-08 (90 days — both Clerk and Gemini SDK are fast-moving; verify major version changes before use)
