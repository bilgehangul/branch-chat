# Phase 6: Polish and Deployment - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Ship the app: dark/light theme toggle with localStorage persistence, error states for all major failure scenarios, breadcrumb overflow (already partially implemented), rate limiting (already live in backend), E2E Playwright test suite covering 6 core flows, and deploy frontend to Vercel + backend to Render with GitHub Actions CI.

</domain>

<decisions>
## Implementation Decisions

### Theme toggle placement and appearance
- Toggle lives in the **top-right of the BreadcrumbBar/header**, sharing the header row with the breadcrumb path
- **Icon only**: moon 🌙 icon in dark mode (click → light), sun ☀️ icon in light mode (click → dark)
- Dark mode is default on first load (locked in ROADMAP success criteria); persists to `localStorage`

### Light theme visual character
- **Warm off-white / cream**: `stone-50` background, `stone-900` text, `stone-200` borders
- Not pure white — slightly warm to reduce eye strain for reading-heavy research sessions
- All existing dark theme variables (`zinc-900/800/700`) get light equivalents in the `stone` palette family

### Accent color adaptation across themes
- The 8-color muted branch palette adapts between themes: **same hues, different saturation/lightness**
- Dark mode: slightly brighter versions (pop on dark background)
- Light mode: slightly more muted versions (prevent colors from feeling too aggressive on warm white)
- Implementation: CSS custom properties per theme variant, not hardcoded hex in components

### Error states — which scenarios get UI treatment
All four scenarios covered:
1. **Rate limit hit (429)** — inline banner just above the chat input (not toast): `⚠ Rate limit reached. Try again in X minutes.` Input is disabled until the window expires.
2. **Streaming mid-failure** — inline below the partial AI response: `⚠ Response interrupted. [Retry]`. Partial text stays visible. Retry re-sends the same message.
3. **Network offline** — fixed top banner below header: `📡 No internet connection`. Auto-dismisses when reconnected.
4. **Clerk auth expiry (401)** — fixed top banner: `Session expired — [Sign in again]`. Stays until user acts.

### E2E test strategy
- **Playwright with mocked API responses** — intercept `**/api/chat`, `**/api/find-sources`, `**/api/simplify` and return pre-written SSE/JSON fixtures. No real API keys needed in CI; deterministic and fast.
- **6 flows, all required to pass** (matching ROADMAP success criteria):
  1. Auth (sign in, guest demo view)
  2. Root chat with streaming
  3. Go Deeper branching
  4. Find Sources
  5. Simplify
  6. Multi-level navigation (breadcrumb, spine, depth limit)
- **GitHub Actions CI**: runs on every push to `main`; blocks merge if any test fails
- Tests live in `frontend/e2e/` alongside fixture data in `frontend/e2e/fixtures/`

### Deployment architecture
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

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/src/index.css` — class-based dark mode already set up: `@variant dark (&:where(.dark, .dark *))`. Adding `.dark` to `<html>` element activates all dark styles. Theme toggle just needs to toggle this class and write to `localStorage`.
- `frontend/src/components/layout/BreadcrumbBar.tsx` — already has a right-side area (overflow logic, ResizeObserver). Theme toggle button slots in here naturally.
- `backend/src/middleware/rateLimiter.ts` — already live (100 req/15min per user/IP, `express-rate-limit`). Frontend just needs to handle the 429 response it will receive.
- Breadcrumb overflow — `collapse` logic, `ellipsis` button, `ResizeObserver`, and `truncate max-w-[120px]` already present. May need light review but structure is there.

### Established Patterns
- Dark theme colors: `zinc-900/800/700` backgrounds. Light theme should mirror with `stone-50/100/200`.
- Accent colors currently hardcoded in the 8-color palette array — need to become theme-aware CSS custom properties or dual arrays.
- `useAuth().getToken` pattern for auth layer — 401 detection happens at the API client layer (`frontend/src/api/`).
- SSE streaming in `frontend/src/hooks/useStreamingChat.ts` — error handling during stream is the hook's responsibility; UI receives `error` state.

### Integration Points
- `BreadcrumbBar.tsx` → add ThemeToggle button in top-right slot
- `App.tsx` or root layout → read `localStorage` on mount, apply `.dark` class to `<html>`, provide theme context
- `frontend/src/api/*.ts` (all API modules) → 401 handling → fire a global auth-expiry event or set Zustand flag
- `frontend/src/hooks/useStreamingChat.ts` → mid-stream error → set `streamError` state in store
- `frontend/src/components/input/ChatInput.tsx` (or parent) → subscribe to 429 state, disable input + show banner
- New: `frontend/e2e/` directory + `playwright.config.ts` + `frontend/e2e/fixtures/`
- New: `.github/workflows/e2e.yml` for CI

</code_context>

<specifics>
## Specific Ideas

- The warm cream light theme fits the "research tool" identity — it should feel like reading a well-typeset document, not a generic web app
- 🌙 / ☀️ icons in the header are sufficient — no need for a text label or elaborate toggle switch
- Mocked Playwright fixtures should include realistic SSE chunk sequences for the streaming tests (multiple `data:` lines with progressive token content)
- The rate limit banner above the input is preferable to a toast because the user needs to understand WHY their input is disabled — it's not a transient notification, it's a blocking state

</specifics>

<deferred>
## Deferred Ideas

- **Session persistence / database**: User wants to save chats and revisit them in the future. This is a significant new capability (database schema design, ORM/query layer, hydration on load, UI for chat history). Explicitly out of scope for v1 per PROJECT.md. Candidate for v2 milestone.
- **Custom domain**: Fine for v1 on default Vercel/Render URLs. Can be added in a post-launch task without replanning.

</deferred>

---

*Phase: 06-polish-and-deployment*
*Context gathered: 2026-03-09*
