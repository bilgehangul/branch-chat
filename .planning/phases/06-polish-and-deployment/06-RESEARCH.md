# Phase 6: Polish and Deployment - Research

**Researched:** 2026-03-09
**Domain:** Theme system (Tailwind v4), error states (React), Playwright E2E, Vercel + Render deployment
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Theme toggle placement and appearance**
- Toggle lives in the **top-right of the BreadcrumbBar/header**, sharing the header row with the breadcrumb path
- **Icon only**: moon icon in dark mode (click → light), sun icon in light mode (click → dark)
- Dark mode is default on first load; persists to `localStorage`

**Light theme visual character**
- **Warm off-white / cream**: `stone-50` background, `stone-900` text, `stone-200` borders
- Not pure white — slightly warm to reduce eye strain for reading-heavy research sessions
- All existing dark theme variables (`zinc-900/800/700`) get light equivalents in the `stone` palette family

**Accent color adaptation across themes**
- The 8-color muted branch palette adapts between themes: **same hues, different saturation/lightness**
- Dark mode: slightly brighter versions (pop on dark background)
- Light mode: slightly more muted versions (prevent colors from feeling too aggressive on warm white)
- Implementation: CSS custom properties per theme variant, not hardcoded hex in components

**Error states — which scenarios get UI treatment**
All four scenarios covered:
1. **Rate limit hit (429)** — inline banner just above the chat input (not toast): `⚠ Rate limit reached. Try again in X minutes.` Input is disabled until the window expires.
2. **Streaming mid-failure** — inline below the partial AI response: `⚠ Response interrupted. [Retry]`. Partial text stays visible. Retry re-sends the same message.
3. **Network offline** — fixed top banner below header: `No internet connection`. Auto-dismisses when reconnected.
4. **Clerk auth expiry (401)** — fixed top banner: `Session expired — [Sign in again]`. Stays until user acts.

**E2E test strategy**
- **Playwright with mocked API responses** — intercept `**/api/chat`, `**/api/find-sources`, `**/api/simplify` and return pre-written SSE/JSON fixtures. No real API keys needed in CI; deterministic and fast.
- **6 flows, all required to pass**: auth, root chat with streaming, Go Deeper branching, Find Sources, Simplify, multi-level navigation
- **GitHub Actions CI**: runs on every push to `main`; blocks merge if any test fails
- Tests live in `frontend/e2e/` alongside fixture data in `frontend/e2e/fixtures/`

**Deployment architecture**
- **Monorepo with separate services**: Vercel project pointed at `frontend/` directory; Render service pointed at `backend/` directory. Both auto-deploy from `main`.
- **No custom domain for v1**: default `*.vercel.app` and `*.onrender.com` URLs are acceptable
- **Vercel branch previews enabled**: every PR/branch gets a unique preview URL automatically
- **CORS**: backend `CLIENT_ORIGIN` env var must be updated from `localhost:5173` to the Vercel production URL after first deploy

### Claude's Discretion
- Exact CSS custom property naming convention for theme variables
- Transition animation on theme switch (instant vs subtle fade)
- Playwright fixture SSE format for streaming responses
- Render free tier cold-start behavior (may need a health check ping or startup note in README)
- Whether to add `vercel.json` / `render.yaml` config files for explicit build config (vs dashboard-only config)

### Deferred Ideas (OUT OF SCOPE)
- **Session persistence / database**: User wants to save chats and revisit them in the future. Out of scope for v1. Candidate for v2 milestone.
- **Custom domain**: Fine for v1 on default Vercel/Render URLs. Can be added in a post-launch task without replanning.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UI-01 | Default theme is dark; the app renders in dark mode on first load | Tailwind v4 `@custom-variant dark (&:where(.dark, .dark *))` already in `index.css`. Apply `.dark` class to `<html>` on mount via inline script in `index.html` to prevent FOUC. |
| UI-02 | User can toggle to light theme; preference is stored in localStorage and restored on next visit | `localStorage.setItem('theme', 'dark'\|'light')` pattern. React context for ThemeProvider. Toggle button in `BreadcrumbBar` right slot (beside `UserButton` in `AppShell` header). |
| DEPLOY-01 | Frontend is deployed to Vercel with auto-deploy from the main branch | Vercel project with Root Directory = `frontend/`. Build Command = `npm run build`. Output directory = `dist`. Auto-deploy on push to `main`. |
| DEPLOY-02 | Backend is deployed to Render (Node.js/Express proxy) | Render web service. Build Command = `npm install && npm run build`. Start Command = `node dist/index.js`. Backend already has `/health` endpoint for health checks. |
| DEPLOY-03 | A `.env.example` file documents every required environment variable with a description | Single `.env.example` at repo root. Documents all backend vars (PORT, CLIENT_ORIGIN, CLERK_SECRET_KEY, GEMINI_API_KEY, TAVILY_API_KEY, AI_PROVIDER) and frontend vars (VITE_CLERK_PUBLISHABLE_KEY, VITE_API_BASE_URL). |
| DEPLOY-04 | An E2E test suite (Playwright) covers the 6 core user flows | `@playwright/test` ^1.58.x. `playwright.config.ts` in `frontend/`. `frontend/e2e/` for specs. `frontend/e2e/fixtures/` for SSE and JSON mocks. GitHub Actions `e2e.yml` workflow. |
</phase_requirements>

---

## Summary

Phase 6 ships the remaining two UI requirements (dark/light theme toggle) and all four deployment requirements (Vercel, Render, .env.example, Playwright E2E). The theme work is largely wiring up infrastructure that already exists — `index.css` already has the `@custom-variant dark` rule, so the implementation is toggling a class on `<html>` and persisting to `localStorage`. Error state handling is new UI work: four distinct patterns covering 429, mid-stream failure, network offline, and 401 auth expiry. The Playwright E2E suite is built from scratch and requires a `playwright.config.ts`, six spec files with mocked API responses, and a GitHub Actions workflow. Deployment uses standard Vercel (frontend subdirectory) and Render (Node.js web service) configurations.

The single highest-risk area is Playwright's handling of SSE streaming intercepts. Playwright's `route.fulfill` does not natively support true streaming (progressive chunks) — it returns the entire body at once. The correct approach for mocking streaming is to use `route.fulfill` with a complete pre-built SSE response body as a single string, which the browser's `ReadableStream` + `TextDecoder` will process correctly. The existing `streamChat` function in `frontend/src/api/chat.ts` reads chunks via `reader.read()` — Playwright will deliver the full response body, but the reader still processes it correctly. Tests verify final rendered output, not intermediate chunk display.

**Primary recommendation:** Use `@playwright/test` ^1.58.x. Mock all three API routes (`/api/chat`, `/api/find-sources`, `/api/simplify`) via `page.route()` returning static fixture strings. Start Vite dev server via `webServer` in `playwright.config.ts`. Run on `ubuntu-latest` in GitHub Actions with `npx playwright install --with-deps chromium`.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@playwright/test` | ^1.58.x | E2E test runner, browser automation | Official Microsoft tool, best-in-class for modern web E2E |
| Tailwind CSS | ^4.2.1 (already installed) | Theme system via CSS custom properties | Already in project; v4 `@custom-variant` handles class-based dark mode |
| Vercel | N/A (platform) | Frontend hosting | Auto-deploy from GitHub, Vite detection, branch previews |
| Render | N/A (platform) | Backend hosting | Free tier Node.js, auto-deploy from GitHub, PORT env var support |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@playwright/test` chromium only | — | CI browser target | Faster CI; no need for full cross-browser matrix for v1 |
| GitHub Actions `actions/checkout@v4` | v4 | CI checkout | Standard, required for E2E workflow |
| GitHub Actions `actions/setup-node@v4` | v4 | CI Node setup | Standard |
| GitHub Actions `actions/upload-artifact@v4` | v4 | Upload Playwright HTML report | Useful for CI failure debugging |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Playwright | Cypress | Playwright is faster in CI, better SSE/fetch interception, no iframe limitation |
| Playwright | Vitest + jsdom | jsdom cannot test real browser rendering, streaming, or Clerk auth flows |
| Render render.yaml | Dashboard-only config | render.yaml is reproducible IaC; dashboard-only config is easier for first deploy but not version controlled |

**Installation:**
```bash
# In frontend/ directory
npm install --save-dev @playwright/test
npx playwright install chromium
```

---

## Architecture Patterns

### Recommended Project Structure
```
frontend/
├── e2e/
│   ├── fixtures/
│   │   ├── chat-stream.txt          # SSE fixture: progressive data: lines
│   │   ├── find-sources.json        # JSON fixture: Tavily-style source results
│   │   └── simplify.json            # JSON fixture: simplified text response
│   ├── auth.spec.ts                 # Flow 1: sign in, guest demo view
│   ├── root-chat.spec.ts            # Flow 2: root chat with streaming
│   ├── go-deeper.spec.ts            # Flow 3: branch creation
│   ├── find-sources.spec.ts         # Flow 4: Find Sources annotation
│   ├── simplify.spec.ts             # Flow 5: Simplify annotation
│   └── navigation.spec.ts           # Flow 6: breadcrumb + spine + depth limit
├── playwright.config.ts
├── src/
│   ├── components/
│   │   └── ui/
│   │       ├── ThemeToggle.tsx       # NEW: icon button, reads/writes theme context
│   │       ├── RateLimitBanner.tsx   # NEW: inline above ChatInput
│   │       ├── NetworkBanner.tsx     # NEW: fixed top, auto-dismiss on reconnect
│   │       └── AuthExpiredBanner.tsx # NEW: fixed top, action link
│   ├── contexts/
│   │   └── ThemeContext.tsx          # NEW: ThemeProvider + useTheme hook
│   └── index.css                    # EXISTING: @custom-variant dark already set
frontend/index.html                  # ADD: inline script to prevent FOUC
.github/
└── workflows/
    └── e2e.yml
.env.example                         # NEW: at repo root
render.yaml                          # NEW: optional, IaC for Render
```

### Pattern 1: FOUC-Free Dark Mode Initialization

**What:** Inline script in `<head>` reads `localStorage` and applies `.dark` to `<html>` before React hydrates.

**When to use:** Required — without this, the app flashes light mode on first load in dark mode default.

**Example:**
```html
<!-- frontend/index.html — in <head> before any CSS links -->
<script>
  (function() {
    var stored = localStorage.getItem('theme');
    // Default is dark; only apply light if explicitly set
    if (stored === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  })();
</script>
```

### Pattern 2: ThemeContext + ThemeToggle

**What:** A React context provides `theme` + `setTheme`, persisting to `localStorage` and toggling the `.dark` class on `document.documentElement`.

**When to use:** Makes theme state available throughout the app without prop drilling.

**Example:**
```typescript
// frontend/src/contexts/ThemeContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'dark' | 'light';

const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void }>({
  theme: 'dark',
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Read initial value from localStorage (inline script already applied the class)
    return (localStorage.getItem('theme') as Theme) ?? 'dark';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

### Pattern 3: Playwright Route Mocking for SSE

**What:** Intercept `/api/chat` before page navigation; return a complete SSE body as a string. Playwright fulfills the entire body at once, but `ReadableStream` still processes it correctly.

**When to use:** All streaming chat E2E tests. No real API key required.

**Example:**
```typescript
// frontend/e2e/root-chat.spec.ts
import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

const SSE_FIXTURE = readFileSync(
  join(__dirname, 'fixtures/chat-stream.txt'), 'utf-8'
);

test('root chat streaming renders AI response', async ({ page }) => {
  await page.route('**/api/chat', route => {
    route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: SSE_FIXTURE,
    });
  });

  await page.goto('/');
  // ... interact and assert
});
```

**SSE fixture format** (`frontend/e2e/fixtures/chat-stream.txt`):
```
data: {"type":"chunk","text":"Hello"}

data: {"type":"chunk","text":", world"}

data: {"type":"chunk","text":"!"}

data: {"type":"done"}

data: [DONE]

```
Note: Each `data:` line must be followed by a blank line (SSE spec). Final `[DONE]` sentinel matches the existing `streamChat` parser.

### Pattern 4: playwright.config.ts with Vite webServer

**What:** Playwright starts Vite dev server before tests and kills it after.

**When to use:** Local development runs. CI uses `reuseExistingServer: !process.env.CI` (false in CI, so Playwright starts its own server).

**Example:**
```typescript
// frontend/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    cwd: '.', // frontend/ directory
  },
});
```

### Pattern 5: Render.yaml for Backend

**What:** `render.yaml` at repo root declares the backend service as Infrastructure as Code.

**When to use:** Reproducible deployments; also documents required env vars.

**Example:**
```yaml
# render.yaml (at repo root)
services:
  - type: web
    name: deepdive-backend
    runtime: node
    rootDir: backend
    buildCommand: npm install && npm run build
    startCommand: node dist/index.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: CLERK_SECRET_KEY
        sync: false  # must be set in dashboard
      - key: GEMINI_API_KEY
        sync: false
      - key: TAVILY_API_KEY
        sync: false
      - key: AI_PROVIDER
        value: gemini
      - key: CLIENT_ORIGIN
        sync: false  # set to Vercel URL after first frontend deploy
```

### Anti-Patterns to Avoid

- **FOUC on first load**: Never rely on React `useEffect` alone to apply the `.dark` class. The effect runs after paint. Use the inline `<head>` script.
- **Hardcoded accent colors in components**: The `ACCENT_PALETTE` in `theme.ts` has hex values; for light/dark adaptation, expose them as CSS custom properties (`--accent-1` through `--accent-8`) with `@theme` variants, rather than dual JS arrays.
- **Storing theme in Zustand**: Theme is a document-level concern (`<html>` class + `localStorage`). It does not belong in the session store.
- **Running Playwright against the production URL in CI**: E2E tests should run against `localhost` with mocked APIs so they are fast, deterministic, and require no secrets.
- **`npx playwright install` without `--with-deps`**: On `ubuntu-latest`, browser system dependencies are not pre-installed. Always use `npx playwright install --with-deps chromium`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| FOUC prevention | Complex JS theme hydration | Inline `<head>` script (3 lines) | Runs synchronously before paint; no library needed |
| SSE mocking in tests | MSW or custom dev server | `page.route()` + static fixture string | Playwright route mocking handles fetch interception natively; MSW adds complexity |
| Online/offline detection | Custom polling | `window.addEventListener('online' / 'offline')` | Browser events are accurate and fire instantly |
| Rate limit countdown timer | Manual interval | `RateLimit-Reset` header from `express-rate-limit` (draft-7 headers already set) | Backend already sends `RateLimit-Reset` epoch second; parse it client-side |
| CSS theme variables | Duplicating every color in JS | `@theme` in Tailwind v4 CSS + CSS custom properties | Let CSS cascade handle it; React only needs to toggle the class |

**Key insight:** The theme system's complexity lives entirely in CSS. React's job is to toggle one class name and write one localStorage key.

---

## Common Pitfalls

### Pitfall 1: Flash of Unstyled Content (FOUC)
**What goes wrong:** App renders in light mode briefly before React mounts, reads localStorage, and applies `.dark` class via `useEffect`.
**Why it happens:** `useEffect` runs after the browser's first paint. CSS is applied before JS executes.
**How to avoid:** Add an inline `<script>` in `<head>` of `index.html` that reads `localStorage` and adds/removes `.dark` synchronously before the page renders.
**Warning signs:** Visible white flash on page load when testing with dark mode default.

### Pitfall 2: Playwright SSE Interception Behavior
**What goes wrong:** Developer expects `route.fulfill` to stream chunks progressively; instead the entire response body is delivered at once.
**Why it happens:** Playwright's route interception bypasses the network stack; it fulfills the request with the full body immediately.
**How to avoid:** Design fixtures as complete SSE bodies (all `data:` lines concatenated). The existing `streamChat` reader processes the full body in a single `read()` call. Tests verify the final rendered state, not intermediate streaming states.
**Warning signs:** Tests pass but streaming animation never shows; that's acceptable for mocked E2E tests.

### Pitfall 3: Clerk Auth in E2E Tests
**What goes wrong:** E2E tests fail on sign-in because Clerk's modal requires real CLERK_PUBLISHABLE_KEY and network access to Clerk's servers.
**Why it happens:** Clerk uses an iframe for the sign-in modal; Playwright can interact with iframes, but the auth flow requires real Clerk credentials.
**How to avoid:** For auth flow test (Flow 1): use a real test user in Clerk dashboard, OR mock the `@clerk/clerk-react` module to auto-return a signed-in state. The simplest approach for CI is to set `VITE_CLERK_PUBLISHABLE_KEY` in the CI environment and use Clerk's test mode with a dedicated test user account. Alternatively, test only the unauthenticated guest demo view (which doesn't require Clerk auth).
**Warning signs:** Auth test hangs waiting for Clerk iframe to load in CI where Clerk network is unavailable.

### Pitfall 4: Vite Environment Variable Prefix
**What goes wrong:** `CLERK_PUBLISHABLE_KEY` is undefined in the browser bundle.
**Why it happens:** Vite only exposes env vars prefixed with `VITE_` to the client bundle.
**How to avoid:** The existing `main.tsx` likely uses `VITE_CLERK_PUBLISHABLE_KEY`. Confirm all client-side env vars use this prefix. In `.env.example`, document only `VITE_`-prefixed vars as frontend vars.
**Warning signs:** Console error: `Clerk: Missing publishableKey`.

### Pitfall 5: Render Cold Start Delay
**What goes wrong:** First request after 15 minutes of inactivity takes 30–60 seconds. Users see a timeout error.
**Why it happens:** Render's free tier spins down web services after 15 minutes of inactivity.
**How to avoid:** Document this in README with a note about the cold-start delay. The backend already has `/health` endpoint — this can be used for external uptime monitoring pings (Uptime Robot free tier). This is Claude's Discretion territory per CONTEXT.md.
**Warning signs:** Backend requests timeout on first load after idle period.

### Pitfall 6: CORS Origin Mismatch After Deploy
**What goes wrong:** Frontend on `xxx.vercel.app` gets CORS errors from backend on `yyy.onrender.com`.
**Why it happens:** Backend `index.ts` uses `process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'`. The Vercel URL is unknown until after first deploy.
**How to avoid:** Deploy frontend first, copy the Vercel URL, set `CLIENT_ORIGIN` env var in Render dashboard, trigger a Render redeploy.
**Warning signs:** Browser console shows `CORS policy: No 'Access-Control-Allow-Origin' header`.

### Pitfall 7: Rate Limit Header Parsing
**What goes wrong:** Frontend shows "Try again in X minutes" but X is incorrect.
**Why it happens:** `express-rate-limit` with `standardHeaders: 'draft-7'` sends `RateLimit-Reset` as an epoch second (Unix timestamp). Incorrect parsing (treating it as seconds-remaining vs epoch) gives wrong countdown.
**How to avoid:** Parse `RateLimit-Reset` as epoch: `const resetAt = parseInt(headers.get('RateLimit-Reset') ?? '0') * 1000; const minutes = Math.ceil((resetAt - Date.now()) / 60000);`
**Warning signs:** Banner shows negative minutes or extremely large numbers.

---

## Code Examples

Verified patterns from official sources and project codebase:

### Theme Toggle in AppShell Header
```typescript
// frontend/src/components/layout/AppShell.tsx — header row addition
// Source: CONTEXT.md + project code
<header className="h-12 bg-white dark:bg-zinc-900 border-b border-stone-200 dark:border-zinc-700 flex items-center px-4 flex-shrink-0 gap-2">
  <div className="flex-1 min-w-0">
    <BreadcrumbBar />
  </div>
  <ThemeToggle />  {/* NEW — placed between breadcrumb and UserButton */}
  <UserButton />
</header>
```

### ThemeToggle Component
```typescript
// frontend/src/components/ui/ThemeToggle.tsx
import { useTheme } from '../../contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="p-1.5 rounded text-slate-500 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? '🌙' : '☀️'}
    </button>
  );
}
```

### Inline 429 Rate Limit Banner
```typescript
// Parent (ChatInput area) subscribes to error state
// Banner appears above the textarea, input disabled
{rateLimitError && (
  <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm rounded-t-lg">
    <span>⚠</span>
    <span>Rate limit reached. Try again in {minutesRemaining} minutes.</span>
  </div>
)}
```

### Network Offline Banner
```typescript
// frontend/src/components/ui/NetworkBanner.tsx
import { useState, useEffect } from 'react';

export function NetworkBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed top-12 left-0 right-0 z-40 bg-red-50 dark:bg-red-950 border-b border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-sm px-4 py-2 text-center">
      No internet connection
    </div>
  );
}
```

### GitHub Actions E2E Workflow
```yaml
# .github/workflows/e2e.yml
# Source: playwright.dev/docs/ci-intro
name: E2E Tests
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  e2e:
    timeout-minutes: 30
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: lts/*
      - name: Install frontend dependencies
        run: cd frontend && npm ci
      - name: Install Playwright Chromium
        run: cd frontend && npx playwright install --with-deps chromium
      - name: Run E2E tests
        run: cd frontend && npx playwright test
        env:
          VITE_CLERK_PUBLISHABLE_KEY: ${{ secrets.VITE_CLERK_PUBLISHABLE_KEY }}
      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: frontend/playwright-report/
          retention-days: 30
```

### .env.example
```bash
# .env.example — at repository root
# Copy to .env and fill in values. Never commit .env to version control.

# === BACKEND (backend/.env) ===

# Port the Express server listens on (Render sets this automatically)
PORT=3001

# Clerk secret key — get from Clerk dashboard > API Keys
CLERK_SECRET_KEY=sk_test_...

# Gemini API key — get from Google AI Studio
GEMINI_API_KEY=AIza...

# Tavily API key — get from tavily.com
TAVILY_API_KEY=tvly-...

# AI provider selection: "gemini" or "openai"
AI_PROVIDER=gemini

# Frontend origin for CORS — set to Vercel URL in production
# Development: http://localhost:5173
# Production: https://your-app.vercel.app
CLIENT_ORIGIN=http://localhost:5173

# === FRONTEND (frontend/.env.local) ===

# Clerk publishable key — get from Clerk dashboard > API Keys
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# Backend API base URL (used if Vite proxy is not active)
# Development: leave empty (Vite proxy handles /api routing)
# Production: https://your-backend.onrender.com
VITE_API_BASE_URL=
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.js darkMode: 'class'` | `@custom-variant dark` in CSS | Tailwind v4 (2024) | No JS config file; pure CSS |
| `EventSource` for SSE | `fetch` + `ReadableStream` | Project Phase 1 decision | Required for auth headers |
| Playwright v1.20–1.40 | Playwright v1.58.x (current) | 2025 | Built-in `route.fulfill`, stable webServer config |
| Render free tier: always-on | Render free tier: 15-min spin-down | ~2023 | Must document cold-start delay; use health check ping |
| Vercel `vercel.json` required for monorepo | Vercel dashboard `Root Directory` setting | 2022 | Dashboard config is sufficient; `vercel.json` optional |

**Deprecated/outdated:**
- `tailwindcss darkMode` config key: Removed in Tailwind v4; use `@custom-variant` in CSS.
- `@google/generative-ai`: EOL'd November 2025; project already uses `@google/genai` v1.x (confirmed in Phase 1).
- Playwright `--browser` flag: Replaced by `--project` flag in v1.x; `playwright.config.ts` `projects` array is correct.

---

## Open Questions

1. **Clerk E2E test strategy for auth flow**
   - What we know: Clerk sign-in uses an iframe modal. Playwright can interact with iframes. Clerk has a "test mode" with `pk_test_` keys.
   - What's unclear: Whether Clerk test mode allows automated sign-in without real network calls, and whether `VITE_CLERK_PUBLISHABLE_KEY` is safe to commit as a CI secret.
   - Recommendation: Test only the guest/unauthenticated demo flow for the "auth" E2E spec (avoids Clerk network dependency in CI). Document that authenticated flow requires manual browser testing.

2. **Accent palette CSS custom properties naming**
   - What we know: `ACCENT_PALETTE` in `constants/theme.ts` has 8 hardcoded hex values used in component style props. CONTEXT.md says light/dark adaptation should use CSS custom properties.
   - What's unclear: Whether thread accent colors (dynamic, set per-thread at runtime) can practically be CSS custom properties (they'd need to be inline styles per-thread).
   - Recommendation: Keep thread accent colors as inline `style` attributes (they are inherently dynamic), but create dual JS arrays (`ACCENT_PALETTE_DARK` / `ACCENT_PALETTE_LIGHT`) selected by theme. This is simpler than CSS custom properties for dynamic per-thread values.

3. **Vite proxy vs `VITE_API_BASE_URL` in production**
   - What we know: `vite.config.ts` proxies `/api` to `localhost:3001` in dev. In production Vercel build, there is no dev server, so `/api` calls would go to `vercel.app/api` which doesn't exist.
   - What's unclear: Does the current `api/chat.ts` use a hardcoded `/api/chat` path or a configurable base URL?
   - Recommendation: The `chat.ts` uses relative path `'/api/chat'`. In production, the frontend needs to know the Render URL. Add `VITE_API_BASE_URL` env var and prefix all `fetch` calls: `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/chat`. In dev, `VITE_API_BASE_URL` is empty and Vite proxy handles it. In Vercel production, set it to the Render URL.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.0.18 (unit) + Playwright ^1.58.x (E2E) |
| Config file | `frontend/vitest.config.ts` (unit) + `frontend/playwright.config.ts` (E2E — Wave 0 gap) |
| Quick run command | `cd frontend && npx vitest run` |
| Full suite command | `cd frontend && npx vitest run && npx playwright test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UI-01 | Dark mode on first load, `.dark` on `<html>` | E2E | `cd frontend && npx playwright test e2e/root-chat.spec.ts` | ❌ Wave 0 |
| UI-02 | Toggle persists to localStorage, restores on reload | E2E | `cd frontend && npx playwright test e2e/root-chat.spec.ts` | ❌ Wave 0 |
| DEPLOY-01 | Frontend live on Vercel, auto-deploys from main | manual-only | N/A — verify via Vercel dashboard | ❌ manual |
| DEPLOY-02 | Backend live on Render, auto-deploys from main | manual-only | N/A — verify via `curl https://xxx.onrender.com/health` | ❌ manual |
| DEPLOY-03 | `.env.example` documents all required vars | smoke | `test -f .env.example` (CI step) | ❌ Wave 0 |
| DEPLOY-04 | All 6 Playwright flows pass | E2E | `cd frontend && npx playwright test` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `cd frontend && npx vitest run`
- **Per wave merge:** `cd frontend && npx vitest run && npx playwright test`
- **Phase gate:** Full Playwright suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `frontend/playwright.config.ts` — Playwright config with webServer + chromium project
- [ ] `frontend/e2e/fixtures/chat-stream.txt` — SSE fixture for streaming tests
- [ ] `frontend/e2e/fixtures/find-sources.json` — JSON fixture for Find Sources tests
- [ ] `frontend/e2e/fixtures/simplify.json` — JSON fixture for Simplify tests
- [ ] `frontend/e2e/auth.spec.ts` — stub (guest view only)
- [ ] `frontend/e2e/root-chat.spec.ts` — streaming flow + theme toggle
- [ ] `frontend/e2e/go-deeper.spec.ts` — branch creation flow
- [ ] `frontend/e2e/find-sources.spec.ts` — annotation flow
- [ ] `frontend/e2e/simplify.spec.ts` — simplify flow
- [ ] `frontend/e2e/navigation.spec.ts` — breadcrumb + spine + depth limit
- [ ] `.github/workflows/e2e.yml` — CI workflow
- [ ] `.env.example` — at repo root
- [ ] Framework install: `cd frontend && npm install --save-dev @playwright/test && npx playwright install chromium`

---

## Sources

### Primary (HIGH confidence)
- [playwright.dev/docs/mock](https://playwright.dev/docs/mock) — route.fulfill API, intercept patterns
- [playwright.dev/docs/test-webserver](https://playwright.dev/docs/test-webserver) — webServer config options + code examples
- [playwright.dev/docs/ci-intro](https://playwright.dev/docs/ci-intro) — GitHub Actions workflow YAML (verified)
- [tailwindcss.com/docs/dark-mode](https://tailwindcss.com/docs/dark-mode) — `@custom-variant dark` v4 syntax (verified)
- Project `frontend/src/index.css` — confirms `@custom-variant dark (&:where(.dark, .dark *))` already present
- Project `backend/src/middleware/rateLimiter.ts` — confirms `standardHeaders: 'draft-7'`, 429 response shape
- Project `frontend/src/components/layout/AppShell.tsx` — confirms header structure for ThemeToggle placement

### Secondary (MEDIUM confidence)
- [vercel.com/docs/monorepos](https://vercel.com/docs/monorepos) — Root Directory config for subdirectory deploy
- [render.com/docs/deploys](https://render.com/docs/deploys) — auto-deploy behavior, NODE_ENV, PORT
- [render.com/docs/infrastructure-as-code](https://render.com/docs/infrastructure-as-code) — render.yaml format

### Tertiary (LOW confidence)
- Community reports on Render free tier cold-start (30–60 second delay after 15 min inactivity) — consistent across multiple sources but not official SLA
- Playwright SSE `route.fulfill` behavior (delivers full body at once, not streaming) — based on GitHub issue #15353 + inferred from docs; verified by understanding of Playwright's interception model

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — library versions confirmed from package.json; Playwright docs verified
- Architecture patterns: HIGH — Tailwind v4 syntax verified from official docs; theme patterns consistent with existing `index.css`
- Pitfalls: HIGH — FOUC, CORS order, env var prefix are well-documented; Render cold-start is MEDIUM (community-sourced)

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable stack; Playwright releases monthly but API is stable)
