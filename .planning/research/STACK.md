# Technology Stack

**Project:** DeepDive Chat
**Researched:** 2026-03-08
**Confidence note:** Training data cutoff August 2025. External network tools were unavailable during this research session. Versions reflect the stable ecosystem state as of mid-2025. Verify latest patch versions before install; major/minor recommendations are HIGH confidence.

---

## Recommended Stack

### Frontend Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React | 18.3.x | UI component tree | React 19 was released late 2024 but ecosystem compatibility (Clerk, Framer Motion, react-markdown) is solidly tested against 18. Use 18 to avoid upgrade friction in a greenfield experiment. |
| Vite | 5.x | Build tool + dev server | Standard 2025 React build tool. HMR is instant, ESM-native, no webpack config overhead. `npm create vite@latest` scaffolds correctly. |
| TypeScript | 5.x | Type safety | Required for maintainable state modeling — thread trees with recursive depth types benefit enormously from TS. |

### State Management

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Zustand | 4.5.x | Client state — thread tree, active thread, annotations | Minimal boilerplate, no Provider wrapping needed, easy devtools integration. Fits ephemeral (non-persisted) state perfectly. The `immer` middleware is available if deep thread-tree mutations get complex, but start without it. |

### Animation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Framer Motion | 11.x | Slide transitions between threads, action bubble, lead tag animations | Version 11 dropped the `motion` component API changes from v10 and added layout animations improvements. The `AnimatePresence` + `motion.div` pattern for slide transitions is exactly what thread navigation needs. Do NOT use v10 — the v11 layout animation rewrite is significant. |

### Auth

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @clerk/clerk-react | 5.x | Frontend auth — `<ClerkProvider>`, `useUser`, `useAuth`, `<SignIn>` | Clerk 5 unified the React SDK. Provides pre-built UI components for sign-in/sign-up, plus hooks for JWT retrieval to attach to backend requests. |
| @clerk/express | 1.x | Backend JWT middleware — `requireAuth()`, `clerkMiddleware()` | The official Clerk SDK for Express. Validates Clerk JWTs on the proxy backend without custom auth logic. Do NOT use the older `@clerk/clerk-sdk-node` — it is deprecated in favor of `@clerk/express`. |

### AI Provider SDK

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @google/generative-ai | 0.21.x | Gemini 2.0 Flash API calls on the backend | **Critical distinction:** Use `@google/generative-ai` (direct Gemini API, API key auth), NOT `@google-cloud/vertexai` (Vertex AI, GCP service account auth, enterprise). For a stateless Express proxy with a Gemini API key, the direct SDK is correct and far simpler. The SDK supports streaming via `generateContentStream()` which maps directly to SSE forwarding. |

### Search Provider

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @tavily/core | 0.x (latest) | Tavily web search for "Find Sources" feature | The official Tavily JS client published by Tavily themselves. Package name is `@tavily/core`, NOT `tavily` (the unscoped `tavily` package on npm is a third-party wrapper and should be avoided). Exposes `TavilyClient` with `search()` method. Wrap in a search service interface so the Tavily implementation can be swapped for an OpenAI Responses API implementation when the provider switches. |

### Markdown Rendering

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| react-markdown | 9.x | Render AI response text as Markdown in React | react-markdown 9 requires ESM and drops CJS — compatible with Vite's ESM-native build. The `children` prop accepts the raw markdown string. |
| remark-gfm | 4.x | GitHub Flavored Markdown (tables, strikethrough, task lists) | Required plugin for react-markdown to handle GFM syntax that Gemini outputs. Must match the remark version that react-markdown 9 expects (remark 15+). |

### Syntax Highlighting

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| react-syntax-highlighter | 15.x | Code block syntax highlighting inside markdown | The `Prism` renderer (not `hljs`) gives more language coverage and better React integration. Use the async-loading Prism variant (`react-syntax-highlighter/dist/esm/prism-async-light`) to avoid bundling all language grammars. Pass as the `code` component to react-markdown's `components` prop. |

**Why not highlight.js directly:** Using `highlight.js` directly requires imperative DOM mutation (`hljs.highlightElement()`), which conflicts with React's declarative rendering. `react-syntax-highlighter` is the correct React wrapper.

### HTTP Client (Frontend → Backend)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Native `fetch` | Browser built-in | API calls to Express backend | No library needed. The `EventSource` API handles SSE subscription. For non-streaming endpoints (simplify, cite), plain `fetch` is sufficient. Do NOT add axios — it adds weight with no benefit here. |

---

## Backend Stack

### Core

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Node.js | 20.x LTS | Runtime | LTS version. Use 20 not 22 for Render stability. |
| Express | 4.19.x | HTTP server + routing | Express 5 was released but ecosystem middleware (body-parser, cors, etc.) is solidly tested on 4. No async error handling improvements in 5 are needed for this scope. Use 4. |
| cors | 2.x | CORS headers for Vite dev server | Required to allow the Vite dev server (localhost:5173) to call Express (localhost:3001). Configure to allow only the Vercel frontend origin in production. |
| dotenv | 16.x | Environment variable loading | Load `GEMINI_API_KEY`, `TAVILY_API_KEY`, `CLERK_SECRET_KEY` from `.env`. Use `dotenv/config` import at the top of the entry file. |

### SSE Streaming

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| eventsource-parser | 1.x or 3.x | Parse SSE chunks from Gemini SDK stream | The Gemini SDK's `generateContentStream()` returns an async iterable of chunks, not raw SSE text — so you write SSE to the client yourself (`res.write('data: ...\n\n')`). The `eventsource-parser` is needed on the *frontend* only if you open a raw SSE connection. Since the backend forwards chunks from the SDK's async iterable, the backend does not need this parser — just write the chunks as SSE. The frontend uses the native `EventSource` API or a `fetch`+`ReadableStream` consumer. |

**SSE pattern for this project:**
- Backend: `res.setHeader('Content-Type', 'text/event-stream')`, then iterate `generateContentStream()` and `res.write()` each chunk.
- Frontend: Use `EventSource` pointed at `/api/chat/stream` endpoint, handle `onmessage`.

---

## Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx | 2.x | Conditional className strings | Thread accent color application, active state on breadcrumbs, depth-dependent styles |
| tailwind-merge | 2.x | Merge Tailwind classes without conflicts | If using Tailwind; combine with clsx via `cn()` utility |
| uuid | 9.x or 10.x | Generate thread IDs, message IDs | Each thread and message needs a stable unique ID. Use `crypto.randomUUID()` (browser built-in) in the frontend instead of the library — no import needed for modern browsers. |

---

## CSS / Styling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind CSS | 3.4.x | Utility-first styling | The gutter layout (200px right column, 720px content, 28px left spine), depth-based color accents, and responsive constraints map cleanly to Tailwind utilities. Avoid v4 alpha — ecosystem tooling (plugins, IDE support) is not yet mature. |
| CSS custom properties | Native | Thread accent colors | The 8-color palette for child thread accents should be defined as CSS custom properties (`--thread-accent-1` through `--thread-accent-8`), set on the thread container element. This lets Framer Motion animate color transitions cleanly. |

---

## Deployment

| Service | Purpose | Why |
|---------|---------|-----|
| Vercel | Frontend (React/Vite) | Zero-config Vite deployment. Automatic HTTPS, CDN, preview deployments. Free tier sufficient for experiment phase. |
| Render | Backend (Express) | Simpler than Railway for always-on Express. Free tier has cold starts but is adequate for v1. Set `NODE_ENV=production` and configure environment variables in Render dashboard. |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| AI SDK | @google/generative-ai | @google-cloud/vertexai | Vertex requires GCP service account, IAM setup, project configuration — massive overhead for an API-key-based prototype |
| AI SDK | @google/generative-ai | Vercel AI SDK (ai package) | The Vercel AI SDK abstracts providers well but adds another abstraction layer. Since the project already has a custom provider abstraction requirement, using the Vercel AI SDK would be an abstraction on top of an abstraction. Use the native SDK. |
| Search | @tavily/core | openai (Responses API) | OpenAI Responses API web search is only usable when on the OpenAI provider. The abstraction layer should make both interchangeable. Start with Tavily (Gemini path). |
| State | Zustand | Redux Toolkit | RTK is correct for large teams and complex async flows. For this scope (ephemeral thread tree, no persistence), Zustand is proportionate. |
| State | Zustand | Jotai | Jotai's atom-per-value model is harder to model a nested thread tree than Zustand's single store slice. |
| Auth | @clerk/express | jsonwebtoken + manual validation | Clerk handles key rotation, session revocation, and JWT validation automatically. Manual JWT validation is error-prone. |
| Build | Vite | Create React App | CRA is deprecated. Vite is the clear successor. |
| Routing | React Router v6 | TanStack Router | No multi-page routing needed — thread navigation is in-app state, not URL-based (v1). If URL-based deep linking is added later, TanStack Router is worth evaluating. |
| Markdown | react-markdown | @uiw/react-md-editor | react-markdown is render-only (no editor), which is exactly what's needed. No editor functionality required. |
| Syntax highlight | react-syntax-highlighter (Prism) | highlight.js direct | Imperative DOM mutation conflicts with React rendering. Use the React wrapper. |
| CSS | Tailwind CSS | CSS Modules | Both are valid. Tailwind wins here because the gutter layout with dynamic accent colors is easier to prototype with utilities than with module files. |
| HTTP | Native fetch | axios | No benefit at this complexity level. Axios adds 40KB+ for what `fetch` handles natively. |

---

## Installation

```bash
# Frontend (in /client or root)
npm create vite@latest client -- --template react-ts
cd client
npm install react-markdown remark-gfm react-syntax-highlighter
npm install @clerk/clerk-react
npm install zustand
npm install framer-motion
npm install clsx tailwind-merge
npm install -D tailwindcss postcss autoprefixer @types/react-syntax-highlighter

# Backend (in /server)
mkdir server && cd server
npm init -y
npm install express cors dotenv @google/generative-ai @tavily/core @clerk/express
npm install -D typescript @types/express @types/node ts-node nodemon
```

---

## Provider Abstraction Pattern

The project requires AI and search providers to be swappable via config. The recommended pattern:

```typescript
// server/src/providers/types.ts
interface AIProvider {
  streamChat(messages: Message[], systemPrompt: string): AsyncIterable<string>;
  complete(prompt: string): Promise<string>;
}

interface SearchProvider {
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
}

// server/src/providers/gemini.ts — implements AIProvider using @google/generative-ai
// server/src/providers/openai.ts — implements AIProvider using openai package
// server/src/providers/tavily.ts — implements SearchProvider using @tavily/core
// server/src/providers/openai-search.ts — implements SearchProvider using OpenAI Responses API

// server/src/config.ts
const PROVIDER = process.env.AI_PROVIDER ?? 'gemini'; // 'gemini' | 'openai'
export const aiProvider: AIProvider = PROVIDER === 'openai' ? new OpenAIProvider() : new GeminiProvider();
export const searchProvider: SearchProvider = PROVIDER === 'openai' ? new OpenAISearchProvider() : new TavilyProvider();
```

Switching from Gemini+Tavily to OpenAI+Responses API is then a single environment variable change.

---

## Confidence Assessment

| Library | Confidence | Notes |
|---------|------------|-------|
| @google/generative-ai (vs Vertex AI) | HIGH | Well-documented distinction; direct SDK is unambiguous for API-key use |
| @tavily/core package name | MEDIUM | Package name `@tavily/core` is what Tavily publishes officially; verify on npmjs.com before install — the ecosystem is newer |
| @clerk/clerk-react 5.x | HIGH | Clerk 5 launched mid-2024; well within training data |
| @clerk/express (not clerk-sdk-node) | HIGH | Clerk explicitly deprecated `clerk-sdk-node` in favor of `@clerk/express` |
| Framer Motion 11.x | HIGH | v11 released early 2024; stable and widely adopted |
| React 18 (not 19) | HIGH | React 19 exists but ecosystem compatibility risk is real for a greenfield prototype |
| Zustand 4.5.x | HIGH | Stable, no major breaking changes expected |
| react-markdown 9.x + remark-gfm 4.x | HIGH | ESM-only shift is well-documented; versions are compatible |
| react-syntax-highlighter (Prism) | HIGH | Standard pattern; `react-syntax-highlighter` is the dominant choice |
| Vite 5.x | HIGH | Clear standard; no credible alternative |
| Express 4.x (not 5) | HIGH | Express 5 released but adoption is very early |
| Tailwind CSS 3.4.x (not v4) | HIGH | Tailwind v4 entered beta mid-2025; avoid for production greenfield |
| eventsource-parser usage | MEDIUM | SSE pattern requires verification — the Gemini SDK async iterable approach means this library may not be needed at all; verify with SDK docs |

---

## Sources

- Training data (August 2025 cutoff): HIGH confidence base for all recommendations
- External network tools (WebFetch, WebSearch, npm registry) were unavailable during this research session
- Verify exact patch versions at https://npmjs.com before scaffolding
- Clerk migration guide: https://clerk.com/docs/upgrade-guides (verify @clerk/express is current name)
- Gemini SDK docs: https://ai.google.dev/api/generate-content (verify generateContentStream API)
- Tavily JS docs: https://docs.tavily.com (verify @tavily/core package name)
