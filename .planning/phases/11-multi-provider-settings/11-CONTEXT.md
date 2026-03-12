# Phase 11: Multi-Provider Settings - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can choose between a free-tier Gemini model and bring their own API keys for Gemini, OpenAI, or Anthropic. Backend supports per-request provider instantiation with full security (key encryption, sanitization, rate limiting). All three providers fully implemented (streamChat, simplify, generateCitationNote).

</domain>

<decisions>
## Implementation Decisions

### Settings Panel
- Centered modal dialog with backdrop (click backdrop or X to dismiss)
- Gear icon in the right side of the top header bar (next to user avatar/sign-out)
- Focus trap inside modal (XCUT-02)
- Two sections: info-only free-tier label at top, collapsible BYOK section below (collapsed by default)

### Free-Tier Model
- No user-facing model toggle — free tier is Gemini Flash 2.0 with Flash 2.0 Lite as silent fallback on overload
- Settings modal shows "Current Model: Gemini Flash 2.0 (Free)" as informational label, not a toggle
- Backend narrows the fallback chain to just these 2 models (remove the other 4 currently in FREE_TIER_MODELS)

### BYOK Key Flow
- Provider selector: Gemini | OpenAI | Anthropic
- API key input with show/hide toggle, provider-specific placeholder text
- Explicit "Verify Key" button — backend makes lightweight test call, shows inline green checkmark or red error
- Model selector populates only after successful verification
- Explicit "Save" button required to apply changes (not auto-apply)
- "Clear Key & Reset to Free" button with confirmation dialog before clearing
- Key never displayed in full after entry — show only last 4 characters (PROV-15)
- Key encrypted in localStorage using Web Crypto AES-GCM keyed to userId + app salt (PROV-13)
- Key cleared from localStorage on sign-out (PROV-14)

### BYOK Verification Error
- Inline red error message below key input: "Invalid API key. Check your key and try again."
- Key stays in input so user can fix it — no modal or toast for errors

### Model Lists (Hardcoded Curated)
- Gemini: Flash 2.0, Flash 2.0 Lite, Pro 2.5
- OpenAI: gpt-4o, gpt-4o-mini
- Anthropic: Claude Sonnet 4, Claude Haiku

### Search Provider
- Search provider dropdown appears only when OpenAI is selected as BYOK provider
- Options: Tavily (default) or OpenAI Web Search
- Other providers (Gemini, Anthropic) always use Tavily

### Model Badge (ChatInput)
- Always visible — shows active model with provider icon (Gemini sparkle, OpenAI logo, Anthropic logo)
- Free tier: provider icon + "Gemini Flash"
- BYOK: key icon + provider icon + model name (e.g., "gpt-4o")
- Clickable — opens Settings modal

### Provider Implementation
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

</decisions>

<specifics>
## Specific Ideas

- Free tier: Flash 2.0 primary, Lite as silent fallback — user doesn't choose, just gets the best available
- BYOK Gemini option: users who want to use their own Gemini key (e.g., for higher quotas or Pro 2.5) can bring their own
- Confirmation dialog on "Clear Key" — user explicitly opted for this over instant-clear

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AIProvider` interface (`backend/src/providers/types.ts`): streamChat, simplify, generateCitationNote — all 3 providers must implement this
- `SearchProvider` interface (`backend/src/providers/types.ts`): findSources — Tavily and OpenAI Search already exist
- `GeminiProvider` (`backend/src/providers/gemini.ts`): working implementation, needs refactor to accept dynamic apiKey/model params
- `OpenAIProvider` (`backend/src/providers/openai.ts`): stub, needs full implementation
- `TavilyProvider` and `OpenAISearchProvider`: working, no changes needed
- `AppShell.tsx` (`frontend/src/components/layout/`): header where gear icon will be placed

### Established Patterns
- Provider abstraction via interfaces — route handlers import provider and call methods without knowing the concrete class
- `config.ts` is the single provider instantiation point — needs refactoring from singleton to factory
- Zustand for frontend state — SettingsContext should follow this pattern or use React context
- SSE streaming for chat — all providers must support the same onChunk/onDone/onError callback pattern

### Integration Points
- `config.ts`: currently exports singleton `aiProvider` and `searchProvider` — must become factory functions
- API routes: need to accept optional `byok` field in request body and create per-request provider instances
- `AppShell.tsx` header: gear icon placement
- `ChatInput` area: model badge display
- Sign-out flow: must clear encrypted key from localStorage

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 11-multi-provider-settings*
*Context gathered: 2026-03-12*
