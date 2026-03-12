# BranchChat Redesign — Design & Implementation Plan

*Prepared for Claude Code implementation. Each section describes the problem, the design intent, and specific implementation guidance referencing exact files and components.*

---

## 1. Session History Sidebar (Left Panel) — Visual Overhaul

### Problem
The sidebar (`AppShell.tsx` → `<aside>` + `SessionHistory.tsx`) is visually bare — plain white/dark background, no hierarchy indicators, tiny text, no visual identity. Sessions are flat buttons with truncated titles and a date. The active session thread tree uses uniform `text-xs` with basic indentation and no visual polish. The 3-dot menu feels like an afterthought.

### Design Direction

**Goal:** Transform the sidebar into a polished, app-grade navigation panel that feels like a modern IDE sidebar or Notion's page tree — warm, scannable, and visually layered.

**Visual language:**
- The sidebar should feel like a distinct zone — give it a subtle background texture or color shift. In dark mode, use `zinc-950` (current) but add a very subtle gradient from top to bottom (e.g., `zinc-950` → `zinc-900/80`). In light mode, a warm off-white like `stone-50` → `white`.
- The "Chats" header should be more prominent — make it a real section header with the app name or a small logo mark, not just tiny uppercase text. Add a subtle bottom border with some padding.
- The "+ New Chat" button should be a proper styled button with an icon, rounded corners, a subtle background fill, and hover elevation — not an inline text link. Position it prominently in the header area. Consider a filled/outlined style: e.g., in dark mode, `bg-zinc-800 border border-zinc-700` with a `+` icon from lucide or similar.

**Session list entries:**
- Each session row should have more vertical padding (py-2.5 → py-3) and clear hover states (a left-colored bar on hover, or a gentle background shift).
- The active session should have a strong visual indicator: a 2px accent-colored left border + a tinted background (use the root thread's `accentColor` at 10% opacity).
- Date text should be more subtle — use relative time ("2h ago", "Yesterday", "Mar 5") instead of raw locale date strings.
- Truncation should use `line-clamp-1` and the full title should appear in a tooltip.

**Thread tree within active session (ThreadNode):**
- Replace the plain `▶/▼` toggles with smoother chevron icons (rotated on expand with a CSS transition: `transition-transform duration-150`).
- Each thread node should show its accent-color pip inline (currently only in the pills), giving a visual thread-identity.
- The active thread row should be highlighted with a left-border accent color + background tint.
- Indent lines: add a thin vertical connecting line (a `border-left` on a pseudo-element or a wrapper div) to show the tree structure visually, similar to VS Code's file tree.

**3-dot menus (ThreeDotButton + DropdownMenu):**
- The 3-dot trigger should only appear on hover (use `opacity-0 group-hover:opacity-100 transition-opacity`).
- The dropdown should have a subtle box-shadow and rounded corners (`rounded-lg shadow-xl`), and confirmation flows (delete) should use a modal-style confirmation rather than the current tiny inline "Yes/No" buttons.

### Files to Modify
- `frontend/src/components/layout/AppShell.tsx` — sidebar `<aside>` structure and styling
- `frontend/src/components/history/SessionHistory.tsx` — session list, ThreadNode, menus
- `frontend/src/index.css` — any new utility classes or animations

---

## 2. Ancestor Peek Panels — Redesign for Clarity

### Problem
The `AncestorPeekPanel.tsx` renders parent thread contexts as narrow strips to the left of the main thread. Their widths are fixed at 68px / 110px / 180px (computed in `AppShell.tsx` lines 101-102). At these widths, especially 68px, the content is unreadable — just tiny 10px text crammed into a narrow column. The panels feel like leftover debug UI rather than a useful navigation feature.

### Design Direction

**Option A — Collapsible rail with hover expansion (recommended):**
- Replace the static-width panels with a thin "spine" rail (24-32px wide) that shows only the thread accent-color stripe and a minimal icon/pip.
- On hover, the rail expands to ~220px with a smooth CSS transition (`transition-all duration-200 ease-out`) and reveals the full thread context (messages, title, branch button).
- This clears horizontal space for the main chat and makes the ancestor context available on demand.
- The expanded panel should look like a card overlay (with `shadow-lg`, rounded right edge) floating over the main content, not pushing it.

**Option B — Breadcrumb-only (simpler):**
- Remove the ancestor panels entirely.
- Rely on the `BreadcrumbBar` (already present) for navigation.
- Enhance the breadcrumb bar: clicking a breadcrumb crumb could show a dropdown preview of that thread's last few messages.

**Regardless of option chosen, fix the following:**
- The bottom fade gradient (`from-slate-50 dark:from-zinc-900`) should match the panel background color.
- The highlighted anchor message should be more prominent: larger text, a colored left-border stripe, and the "↗ branch" button should be a real pill-shaped badge.
- Remove the `text-[10px]` sizes — minimum readable size is `text-xs` (12px).
- The context menu (right-click → Delete/Summarize/Compact) should match the redesigned dropdown style from Section 1.

### Files to Modify
- `frontend/src/components/layout/AppShell.tsx` — ancestor panel widths and rendering logic
- `frontend/src/components/layout/AncestorPeekPanel.tsx` — complete visual redesign
- `frontend/src/components/layout/SpineStrip.tsx` — may be repurposed or removed

---

## 3. Branch Conversation Pills (GutterColumn) — Alignment & Positioning Fix

### Problem
Branch pills (`GutterColumn.tsx` → `LeadPill`) are absolutely positioned at `right: 4px/8px` within the content wrapper. The `measurePillTop()` function reads `anchorRect.top - wrapperRect.top` to compute the Y-position relative to the wrapper. **However, the pills often drift out of alignment** because:

1. The `contentWrapperRef` div has `className="relative px-4"` but the inner slide-transition div adds `pr-[80px] sm:pr-[140px]` to make room for pills. This padding affects layout flow and can shift paragraph positions relative to where they were when measurement occurred.
2. The `ResizeObserver` on `wrapperRef` recomputes positions on content reflow, but **not** on window resize or on font load / image load within messages. Also, the dependency array `[childLeads.length, posVersion]` doesn't capture message content changes that could reflow text.
3. Cross-paragraph selections record `paragraphIndex` from the first block element's `data-paragraph-id`, but after markdown rendering, block indices can shift if the message content changes (e.g., during streaming).

### Design Direction

**Goal:** Pills must **always** be vertically aligned with their anchor paragraph's top edge — no drift, no lag.

**Positioning strategy — switch to a layout-based approach instead of JS measurement:**
- Instead of absolute positioning with JS-computed `top` values, render each pill **inline within the message flow**.
- Modify `MessageBlock` or `MarkdownRenderer` to render the pill inline-end of the anchor paragraph (using a flex row or a `float: right` approach).
- The pill sits in a right margin area. Use CSS Grid on the message content area: `grid-template-columns: 1fr auto` where the `auto` column holds branch pills.
- This eliminates all JS measurement, ResizeObserver complexity, and drift issues.

**If the absolute-positioning approach is kept (less recommended):**
- Attach a `MutationObserver` + `ResizeObserver` on each individual anchor paragraph element, not just the wrapper.
- Recompute positions on: content wrapper resize, window resize, any DOM mutation within the scroll container, and after streaming completes (listen for `isStreaming` going from `true` to `false`).
- Add a `requestAnimationFrame` loop that runs only while streaming is active to continuously sync pill positions with reflowing content.
- Ensure the padding `pr-[80px] sm:pr-[140px]` is always applied (not conditional on `hasChildThreads`) so layout doesn't shift when the first branch is created.

**Transition improvements:**
- The current slide transition (`translate-x-[-100%]` for 200ms) is jarring. Replace with a gentler crossfade: opacity 1 → 0 over 150ms, swap content, opacity 0 → 1 over 150ms. Or a subtle slide of -20px (not -100%) with opacity fade.
- Make the transition interruptible: if the user navigates again mid-transition, cancel the current animation.

**Pill visual improvements:**
- The hover preview card (`w-64`, absolute positioned at `top: full`) can overlap other pills or fall off-screen. Add position clamping or use a Popover/Tooltip component that auto-positions.
- The preview card should have a small pointer/arrow indicating which pill it belongs to.
- The descendant pills (nested children within a pill) add visual noise — collapse them by default and show on expand/hover.

### Files to Modify
- `frontend/src/components/branching/GutterColumn.tsx` — positioning logic, layout strategy
- `frontend/src/components/thread/ThreadView.tsx` — transition logic, padding, wrapper structure
- `frontend/src/components/thread/MessageBlock.tsx` — if switching to inline pill rendering
- `frontend/src/components/thread/MarkdownRenderer.tsx` — if pills render alongside paragraphs

---

## 4. Text Selection & ActionBubble — Fix Selection Behavior

### Problem
The `useTextSelection` hook (`hooks/useTextSelection.ts`) listens for `mouseup` inside the scroll container, reads the browser's `Selection` object, finds `data-paragraph-id` blocks, and surfaces bubble state. Issues:

1. **Selection scope is too broad:** The hook captures any text the user selects within the scroll container, but it should only activate on **assistant message content** (not on user messages, not on context cards, not on annotation blocks, not on UI elements like buttons/headers). Currently, selecting text in a user bubble or annotation block also triggers the ActionBubble.

2. **ActionBubble positioning uses viewport coordinates** (`position: fixed` with `top: bubble.top, left: bubble.left`). When the user scrolls after selecting text, the bubble stays fixed in viewport space while the highlighted text scrolls away. The bubble should scroll with the text or dismiss on scroll.

3. **The "Simplify" and "Find Sources" actions operate on `paragraphIndex`**, which means the entire paragraph block is the target. But the user may have selected only a specific phrase within the paragraph. The annotation block then appears after the whole paragraph, which is confusing — the user expects the annotation to appear right after their selected text.

4. **Cross-paragraph selection** currently picks the lower-indexed paragraph as the anchor. If the user selects across paragraphs 2 and 3, the annotation goes under paragraph 2. This is unexpected — annotations should apply to the exact selection, not to an arbitrary paragraph.

### Design Direction

**Selection filtering:**
- In `useTextSelection`, add a guard: the selection's anchor and focus must both be inside an element with `data-message-id` that corresponds to an assistant message (check `message.role === 'assistant'`). One way: add a `data-message-role="assistant"` attribute to the MessageBlock wrapper div. In the hook, verify this attribute before surfacing the bubble.
- Exclude selections that start or end inside elements with `data-testid` or specific class markers that identify annotation blocks, context cards, or UI buttons. Add `data-no-selection` attributes to these elements and check `!anchorBlock.closest('[data-no-selection]')`.

**Bubble positioning — switch to scroll-relative:**
- Change the ActionBubble from `position: fixed` to `position: absolute` inside the scroll container's `relative` wrapper (same approach as HighlightOverlay).
- Compute `top` and `left` relative to the content wrapper (using `rect.top - wrapperRect.top + scrollTop`) instead of viewport coordinates.
- This makes the bubble scroll with the text naturally.
- Add a scroll listener that dismisses the bubble if the user scrolls more than ~100px (to handle the case where they scroll away from their selection).

**Fine-grained annotation anchoring:**
- Instead of storing only `paragraphIndex` in annotations, also store the `targetText` (already done) and use it for inline insertion.
- Render simplification/source annotations **immediately after the selected text** within the paragraph, not after the entire paragraph. This requires:
  - Wrapping the selected text range in a `<span>` marker (identified by annotation ID) within the rendered markdown.
  - In `MarkdownRenderer`, after the standard markdown rendering pass, walk the rendered DOM and inject annotation blocks right after the marked span, not after the block-level element.
  - A simpler alternative: keep annotations after the paragraph block, but add a small visual indicator (a colored underline or highlight) on the exact selected text within the paragraph, with the annotation card below clearly labeled "About: '{selected text fragment}'" to create a visual connection.

### Files to Modify
- `frontend/src/hooks/useTextSelection.ts` — selection validation, coordinate system
- `frontend/src/components/branching/ActionBubble.tsx` — positioning strategy
- `frontend/src/components/thread/ThreadView.tsx` — ActionBubble placement in DOM
- `frontend/src/components/thread/MessageBlock.tsx` — role attributes
- `frontend/src/components/thread/MarkdownRenderer.tsx` — inline annotation placement

---

## 5. Inline Annotations — Placement & Output Format

### Problem
Currently, simplification and source annotations render after the **entire block element** (paragraph, heading, list, etc.) via the `annotationsAfter()` function in `MarkdownRenderer.tsx`. The annotations are visually inside the AI message bubble (`max-w-[85%]` container) but styled with their own `max-w-[720px] mx-auto`, which creates a width mismatch — the annotation card may be wider or narrower than the message bubble it's attached to.

The `SimplificationBlock` uses a dark indigo theme (`bg-indigo-950 border-indigo-800`) which works in dark mode but looks harsh. The `CitationBlock` uses `bg-zinc-800` which also only works in dark mode. Neither component adapts to light mode — the dark-on-dark colors would be invisible on a light background.

### Design Direction

**Annotation placement — right under the selected text:**
- Keep annotations rendered after the block element (moving them mid-paragraph is complex and fragile with markdown rendering), but add a clear visual connection to the selected text:
  - When an annotation exists, highlight the `targetText` within the paragraph with a subtle background color (like `bg-amber-100/30 dark:bg-amber-500/10 rounded px-0.5`). This requires post-processing the rendered markdown to find and wrap the target text string.
  - The annotation card itself should have a small upward-pointing caret/arrow and the quoted `targetText` at the top in italics, making it clear what it refers to.

**Annotation card redesign:**
- Both `SimplificationBlock` and `CitationBlock` need light-mode variants. Use CSS `dark:` prefixes properly:
  - Simplification: `bg-indigo-50 border-indigo-200 dark:bg-indigo-950 dark:border-indigo-800`
  - Citation: `bg-stone-50 border-stone-200 dark:bg-zinc-800 dark:border-zinc-700`
- The annotation cards should respect the message bubble's width — remove the `max-w-[720px] mx-auto` from annotation components (they're already inside the message bubble which has its own max-width).
- Add a subtle enter animation: `animate-in` — slide up 8px + fade in over 200ms using a CSS keyframe.

**Simplification output format:**
- The current `SimplificationBlock` shows a header row + raw text. Improve:
  - Show the mode as a small colored badge/tag (e.g., `<span class="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full">Simpler</span>`).
  - Render the simplified text with proper markdown formatting (it may contain bold, lists, etc.). Use the same `MarkdownRenderer` component for the replacement text, but with a flag to skip annotation injection (prevent recursion).
  - "Try another mode" should be a row of small pill buttons always visible (not hidden behind a toggle), since there are only 4 options.

**Citation output format:**
- Default to expanded (not collapsed) — users asked for sources, they want to see them.
- Each source should show a favicon (fetch via `https://www.google.com/s2/favicons?domain={domain}`), the title as a link, a snippet preview, and the domain badge.
- The citation note from the AI should be styled as a soft callout at the bottom.

### Files to Modify
- `frontend/src/components/annotations/CitationBlock.tsx` — visual redesign, light mode
- `frontend/src/components/annotations/SimplificationBlock.tsx` — visual redesign, light mode, mode picker
- `frontend/src/components/thread/MarkdownRenderer.tsx` — text highlighting, annotation placement
- `frontend/src/index.css` — animation keyframes

---

## 6. Message Output Format & Rendering

### Problem
The current `MessageBlock` renders AI messages in a chat-bubble style (`bg-white rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]`). The label above says "Gemini" (hardcoded in the component, line 46). The markdown rendering is functional but lacks polish: no spacing rhythm, no visual hierarchy for headings within a message, code blocks have no copy button, and lists within messages look cramped.

### Design Direction

**Model label:**
- Replace the hardcoded "Gemini" label with a dynamic label derived from the current model/provider setting (see Section 7). Fall back to "AI" if not configured.

**Message rendering improvements:**
- **Headings within messages:** AI responses with `##` or `###` headings should have proper visual weight — a larger font, a thin bottom border, and top margin spacing. The current `prose` plugin handles this but the sizes are too subtle within a bubble.
- **Code blocks:** Add a copy-to-clipboard button (small icon in the top-right corner of each code block). The button should appear on hover with `opacity-0 group-hover:opacity-100`. On click, copy the code text and show a brief "Copied!" toast.
- **Lists:** Add slightly more spacing between list items (`space-y-1.5` or adjust the prose plugin spacing). Nested lists should have clear indentation.
- **Tables:** Already have `overflow-x-auto`, but add `min-w-full` and subtle row striping (`even:bg-stone-50 dark:even:bg-zinc-800/50`).
- **Blockquotes:** Style with a colored left border (use the thread's accent color if available) and italic text.

**User message improvements:**
- The user bubble (`bg-blue-600 text-white`) is fine but should use `whitespace-pre-wrap break-words` to handle long unbroken strings.
- Add a small timestamp on hover (the `createdAt` field exists on messages but is never displayed).

**Streaming state:**
- The current streaming indicator is `opacity-80 select-none pointer-events-none` on the message + a `StreamingCursor` component. The cursor should be a proper blinking animation, not just a static element.
- Consider showing a "Thinking..." skeleton above the message while content is empty.

### Files to Modify
- `frontend/src/components/thread/MessageBlock.tsx` — model label, message layout
- `frontend/src/components/thread/MarkdownRenderer.tsx` — code copy button, heading styles, list spacing
- `frontend/src/components/thread/StreamingCursor.tsx` — improved animation
- `frontend/src/index.css` — prose overrides, animations

---

## 7. Multi-Provider API Key Settings

### Problem
The backend currently hardcodes the AI provider via `process.env.AI_PROVIDER` and `process.env.GEMINI_API_KEY` on the AWS server. Users cannot choose their own model or bring their own API key. The provider abstraction exists (`AIProvider` / `SearchProvider` interfaces in `providers/types.ts`) with `GeminiProvider` and `OpenAIProvider` implementations, but switching requires environment variable changes and a server restart.

### Core Principle — Two-Tier Model

There are two distinct modes and the system must cleanly separate them:

**Tier 1 — Free defaults (no API key required from users):**
- `gemini-2.0-flash` and `gemini-2.0-flash-lite` are the default models, powered by the server-owner's `GEMINI_API_KEY` in the `.env` file on AWS.
- Users see these as "Gemini Flash 2.0" and "Gemini Flash 2.0 Lite" in a simple model switcher (a dropdown or toggle in the header or input area — not buried in settings).
- No setup friction. New users land in the app and start chatting immediately against `gemini-2.0-flash`.
- The existing `FREE_TIER_MODELS` fallback chain in `gemini.ts` should be narrowed to ONLY `gemini-2.0-flash` → `gemini-2.0-flash-lite` for the free tier. Remove the preview/pro models from the default chain — those burn through quota and are not the intended free experience.
- The search provider for Tier 1 remains Tavily, using the server's `TAVILY_API_KEY` from `.env`.

**Tier 2 — Bring Your Own Key (BYOK, optional):**
- Users who want access to more powerful or different models can open Settings and provide their own API key for any supported provider.
- When a user provides their own key, the server-side `.env` key is NEVER used for that user's requests — their key fully replaces the server key for all API calls in that session.
- Supported BYOK providers: Gemini (with user's own key for pro/2.5 models), OpenAI, Anthropic.

### Design Direction

**1. Settings UI (frontend):**

- Add a **gear icon** button in the header bar (next to the theme toggle in `AppShell.tsx`).
- Clicking it opens a Settings panel (slide-over from the right, or a centered modal). The panel has two clear sections:

  **Section A — "Default Model" (always visible, no key needed):**
  - A simple toggle or radio group between `Gemini Flash 2.0` and `Gemini Flash 2.0 Lite`.
  - These are labeled clearly as "Free" with a small badge.
  - This is the only section a casual user ever needs to see.

  **Section B — "Use Your Own API Key" (collapsible, advanced):**
  - A collapsible section (default collapsed) with a header like "Unlock more models with your API key".
  - When expanded:
    - **Provider selector:** Segmented button or dropdown: `Gemini` | `OpenAI` | `Anthropic`
    - **API Key input:** `<input type="password">` with a show/hide toggle eye icon. Placeholder text like "sk-..." or "AIza..." depending on selected provider.
    - **"Verify Key" button:** Makes a lightweight backend call (e.g., a single-token completion or a models list call) to confirm the key works. Shows a green checkmark on success, red error message on failure.
    - **Model selector:** A dropdown that populates ONLY after the key is verified:
      - Gemini: `gemini-2.5-pro`, `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-2.0-flash-lite`
      - OpenAI: `gpt-4o`, `gpt-4o-mini`, `gpt-4.1`, `gpt-4.1-mini`, `gpt-4.1-nano`, `o4-mini`
      - Anthropic: `claude-sonnet-4-20250514`, `claude-haiku-4-5-20251001`
    - **Search provider:** Tavily (default, using server key) or OpenAI web search (if OpenAI key is provided). A simple dropdown.
    - **"Clear Key & Reset to Free" button:** One click to remove the stored key and revert to Tier 1. Styled as a destructive/secondary action.

  **Active model indicator:**
  - Show the current model as a small subtle badge in the `ChatInput` area, left of the textarea. E.g., "Gemini Flash 2.0" in muted text, or "GPT-4o 🔑" (with key icon) if using BYOK.
  - Clicking this badge opens the Settings panel for quick switching.

**2. Frontend storage and context:**

- Create a `SettingsContext` (`frontend/src/contexts/SettingsContext.tsx`) that manages:
  ```
  {
    tier: 'free' | 'byok',
    freeModel: 'gemini-2.0-flash' | 'gemini-2.0-flash-lite',
    byokProvider: 'gemini' | 'openai' | 'anthropic' | null,
    byokModel: string | null,
    byokApiKey: string | null,       // stored in memory + encrypted localStorage
    byokKeyVerified: boolean,
    searchProvider: 'tavily' | 'openai-search',
  }
  ```
- **Key storage security (critical):**
  - The API key is stored in `localStorage` under a key like `branchChat_byok`. Before writing to localStorage, **encrypt the key using the Web Crypto API** (AES-GCM) with a key derived from a combination of the user's Clerk user ID + a static app salt. This prevents other scripts on the same origin from reading the raw key.
  - Implementation: Use `crypto.subtle.importKey()` → `crypto.subtle.deriveKey()` (PBKDF2 from userId + salt) → `crypto.subtle.encrypt()` (AES-GCM). Store the IV + ciphertext as a base64 string. Decrypt on app load.
  - On sign-out, clear the encrypted key from localStorage.
  - Never display the full key in the UI after entry — show only the last 4 characters (e.g., "sk-...4f2b").
  - The key is sent to the backend per-request and is **never stored, logged, or persisted server-side** (see backend section below).

**3. Backend changes:**

- **Request format:** All API routes (`/api/chat`, `/api/simplify`, `/api/find-sources`) accept two new optional fields in the request body:
  ```json
  {
    "byok": {
      "provider": "openai",
      "model": "gpt-4o",
      "apiKey": "sk-..."
    },
    ...existing fields...
  }
  ```
  If `byok` is absent or null, the server uses its default Gemini provider with the `.env` key. A `model` field at the top level (outside `byok`) controls which free-tier model to use (`gemini-2.0-flash` or `gemini-2.0-flash-lite`).

- **Provider resolution in routes (pseudocode):**
  ```
  if (req.body.byok && req.body.byok.apiKey) {
    // BYOK path — instantiate a fresh provider with the user's key
    provider = createProvider(byok.provider, byok.model, byok.apiKey)
  } else {
    // Free tier path — use server's .env key with the requested free model
    provider = getDefaultProvider(req.body.model || 'gemini-2.0-flash')
  }
  ```

- **`config.ts` refactor:** Change from a singleton export to a factory pattern:
  - Keep `getDefaultProvider(model?: string): AIProvider` — returns a `GeminiProvider` using `process.env.GEMINI_API_KEY` with the specified model (defaulting to `gemini-2.0-flash`).
  - Add `createByokProvider(provider: string, model: string, apiKey: string): AIProvider` — instantiates the correct provider class with the user's credentials.
  - Keep `getDefaultSearchProvider(): SearchProvider` — returns Tavily with server key.
  - Add `createByokSearchProvider(provider: string, apiKey: string): SearchProvider` — for OpenAI search with user's key.

- **`gemini.ts` changes:**
  - Refactor the constructor to accept `apiKey` and `model` parameters instead of reading from `process.env` at module level.
  - Remove the `FREE_TIER_MODELS` fallback chain for BYOK calls — when a user specifies a model, use exactly that model, no fallback. If it fails, return the error directly.
  - For free-tier calls, narrow the fallback chain to: `gemini-2.0-flash` → `gemini-2.0-flash-lite` only. Remove `gemini-3-flash-preview`, `gemini-2.5-pro`, `gemini-2.5-flash`, `gemini-2.5-flash-lite` from the default chain.

- **`openai.ts` changes:** Refactor to accept dynamic `apiKey` and `model` in constructor.

- **New `anthropic.ts` provider:**
  - Implement `AIProvider` using the `@anthropic-ai/sdk` npm package.
  - `streamChat`: Use `client.messages.stream()` with the specified model. Map the internal `Message` format (role: 'user' | 'model') to Anthropic's format (role: 'user' | 'assistant'). Yield text chunks from the stream.
  - `simplify`: Use `client.messages.create()` (non-streaming) with the same prompt templates.
  - `generateCitationNote`: Same as simplify, single-shot completion.

**4. Backend security (CRITICAL — implement all of these):**

  - **Never log API keys:** Add a sanitization middleware that runs before route handlers. If any request body contains a `byok.apiKey` field, replace it with `"[REDACTED]"` in any `console.log`, `console.error`, or structured logging output. Do NOT use a simple `JSON.stringify(req.body)` anywhere in error handlers or logging.
  - **Never persist API keys:** The key exists only in the request handler's local scope. It is passed to the provider constructor, used for the API call, and then the provider instance is garbage collected. No database writes, no Redis cache, no file system writes.
  - **Strip keys from error responses:** In the global Express error handler and in each route's catch block, ensure that if an error message contains the user's API key (some SDKs include it in error strings), it is redacted before sending the response. Pattern: `errorMessage.replace(apiKey, '[KEY_REDACTED]')`.
  - **Rate limit BYOK routes:** Apply a per-user rate limit (e.g., 30 requests/minute) to prevent abuse of the proxy pattern. Use the existing `rateLimiter.ts` middleware, parameterized for BYOK.
  - **Validate key format before use:** Before instantiating a provider, do a basic format check:
    - Gemini keys start with `AIza` and are ~39 characters.
    - OpenAI keys start with `sk-` and are 51+ characters.
    - Anthropic keys start with `sk-ant-` and are 93+ characters.
    Reject obviously malformed keys immediately with a 400 error — don't pass garbage to third-party APIs.
  - **HTTPS only:** The deploy config (`nginx.conf`) should enforce HTTPS. API keys travel over the wire in the request body, so TLS is non-negotiable. Verify the existing nginx config redirects HTTP → HTTPS and uses a valid certificate.
  - **CORS policy:** Tighten the CORS policy (if not already) to only allow requests from the app's own domain. This prevents malicious third-party sites from making requests to the backend with a user's key via the browser.

**5. Frontend API changes:**

- Modify `streamChat()` in `api/chat.ts`:
  ```
  // Read settings from SettingsContext (passed as params)
  body: {
    messages, systemPrompt, sessionId, threadId, userMsgId, aiMsgId, userText,
    model: settings.tier === 'free' ? settings.freeModel : undefined,
    byok: settings.tier === 'byok' ? {
      provider: settings.byokProvider,
      model: settings.byokModel,
      apiKey: settings.byokApiKey,
    } : undefined,
  }
  ```
- Same pattern for `simplify.ts` and `search.ts`.
- The `useStreamingChat` hook reads settings from `SettingsContext` via `useContext(SettingsContext)` and passes them to `streamChat()`.

**6. UI state for model display:**

- `ChatInput` receives the current model name from `SettingsContext` and renders it as a small muted label: e.g., `<span class="text-xs text-stone-400">Gemini Flash 2.0</span>` left of the textarea.
- `MessageBlock` reads the model name from context (or from a future per-message `model` field if you want to track which model generated each response) and displays it instead of the hardcoded "Gemini" label.
- When in BYOK mode, show a small key icon (🔑 or a lucide `Key` icon) next to the model name to indicate the user's own key is active.

### Files to Create
- `frontend/src/contexts/SettingsContext.tsx` — settings state, encrypted localStorage, Web Crypto helpers
- `frontend/src/components/settings/SettingsPanel.tsx` — the settings UI (modal/slide-over)
- `backend/src/providers/anthropic.ts` — Anthropic Claude provider implementing AIProvider
- `backend/src/middleware/sanitizeByok.ts` — middleware to redact API keys from logs and errors

### Files to Modify
- `frontend/src/components/layout/AppShell.tsx` — add gear icon settings button to header
- `frontend/src/components/input/ChatInput.tsx` — show current model badge, clickable to open settings
- `frontend/src/components/thread/MessageBlock.tsx` — dynamic model label from context
- `frontend/src/api/chat.ts` — include `model` / `byok` in request body
- `frontend/src/api/simplify.ts` — include `model` / `byok` in request body
- `frontend/src/api/search.ts` — include `model` / `byok` in request body
- `frontend/src/hooks/useStreamingChat.ts` — read SettingsContext, pass to API calls
- `backend/src/routes/chat.ts` — read `byok`/`model` from body, resolve provider
- `backend/src/routes/simplify.ts` — read `byok`/`model` from body, resolve provider
- `backend/src/routes/find-sources.ts` — read `byok`/`model` from body, resolve provider
- `backend/src/config.ts` — refactor from singleton to factory: `getDefaultProvider()`, `createByokProvider()`
- `backend/src/providers/gemini.ts` — constructor accepts apiKey + model; narrow free-tier fallback to 2.0-flash + 2.0-flash-lite only
- `backend/src/providers/openai.ts` — constructor accepts dynamic apiKey + model
- `backend/src/middleware/rateLimiter.ts` — add BYOK-specific rate limit tier

---

## 8. Implementation Priority & Sequencing

This is the recommended order, grouped by dependency:

### Phase 1 — Foundation fixes (no visual regressions)
1. **Text selection filtering** (Section 4, selection-only) — small, self-contained, fixes broken behavior
2. **Annotation light-mode support** (Section 5, CSS-only) — quick CSS changes
3. **Model label fix** ("Gemini" → dynamic) — one-line change in MessageBlock

### Phase 2 — Layout & positioning
4. **Branch pill alignment** (Section 3) — switch to grid-based or inline layout
5. **ActionBubble positioning** (Section 4, bubble positioning) — switch to scroll-relative
6. **Transition smoothing** (Section 3, transitions) — replace jarring slide

### Phase 3 — Visual polish
7. **Sidebar redesign** (Section 1) — comprehensive style update
8. **Ancestor panels redesign** (Section 2) — collapsible rail or removal
9. **Message output format** (Section 6) — markdown rendering improvements, code copy button
10. **Annotation cards redesign** (Section 5, output format) — visual redesign of both blocks

### Phase 4 — New feature
11. **Settings UI + two-tier model** (Section 7) — SettingsContext, settings panel, free model toggle, BYOK section
12. **Backend provider refactor** (Section 7) — factory pattern in config.ts, narrow free-tier fallback chain, BYOK request handling
13. **Anthropic provider + security middleware** (Section 7) — new provider class, sanitizeByok middleware, key format validation

---

## 9. Cross-Cutting Concerns

**Accessibility:**
- All new interactive elements need `aria-label`, keyboard navigation (tab order, Enter/Escape handling), and focus-visible outlines.
- The settings modal must trap focus.
- Color choices must meet WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text).

**Responsive behavior:**
- The sidebar should collapse to a hamburger menu below `sm` breakpoint (640px). Currently it uses `hidden sm:flex`.
- Branch pills on mobile should be smaller or collapse to an icon-only state.
- The settings panel should be a full-screen slide-over on mobile.

**Performance:**
- If switching to grid-based pill layout, ensure the grid doesn't cause layout thrashing during streaming (messages are updating every ~50ms during stream).
- The `MarkdownRenderer` is already wrapped in `React.memo` — ensure any new props (like highlight targets) are stable references to prevent unnecessary re-renders.
- Settings stored in `localStorage` should be read once at mount, not on every render.

**BYOK Security Checklist (must be verified before shipping):**
- [ ] API keys encrypted in localStorage with Web Crypto AES-GCM (keyed to userId + app salt)
- [ ] Keys cleared from localStorage on sign-out
- [ ] Backend never logs, persists, or caches user API keys
- [ ] Error responses from backend redact any API key substrings
- [ ] BYOK request body contains key only inside `byok.apiKey` — no duplication in headers
- [ ] Key format validation rejects malformed keys before hitting third-party APIs
- [ ] Per-user rate limiting applied to BYOK requests (30 req/min)
- [ ] HTTPS enforced end-to-end (verify nginx config)
- [ ] CORS restricted to app domain only
- [ ] UI never displays full key after initial entry (show only last 4 chars)
- [ ] Provider instances created per-request and garbage collected — no key caching in memory across requests

**Testing:**
- Existing tests in `frontend/src/tests/` cover ActionBubble, CitationBlock, SimplificationBlock, MessageBlock. Update these to match new DOM structure and class names.
- Add tests for:
  - Text selection filtering (selecting user message should NOT produce bubble)
  - Settings context (provider switch, key validation)
  - Light mode annotation rendering

---

## Summary Table

| Area | Core Problem | Key Design Change |
|------|-------------|-------------------|
| Sidebar | Flat, unpolished | Styled session tree with accent colors, relative dates, hover menus |
| Ancestor panels | Unreadable at narrow widths | Collapsible rail with hover expansion |
| Branch pills | Misaligned with text | Grid/inline layout instead of JS absolute positioning |
| Text selection | Fires on wrong elements | Filter to assistant-only, add `data-no-selection` guards |
| ActionBubble | Drifts on scroll | Absolute position in scroll container, not fixed |
| Annotations | Disconnected from selected text | Highlight target text, visual connection to card |
| Output format | Missing light mode, no code copy | Light/dark variants, code copy button, favicon sources |
| Provider settings | Hardcoded Gemini, no user choice | Free tier: Gemini 2.0 Flash/Lite (server key), BYOK: encrypted user keys, per-request provider instantiation |
