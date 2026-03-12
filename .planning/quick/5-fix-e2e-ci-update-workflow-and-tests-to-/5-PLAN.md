---
plan: 5
type: execute
wave: 1
depends_on: []
files_modified:
  - .github/workflows/e2e.yml
  - frontend/src/main.tsx
autonomous: true
must_haves:
  truths:
    - "E2E tests run on CI without a real Clerk or Google OAuth secret"
    - "The app dev server starts successfully with a placeholder auth env var"
    - "All existing E2E test files are unchanged (they already use page.route() mocks)"
  artifacts:
    - path: ".github/workflows/e2e.yml"
      provides: "CI workflow with safe placeholder auth env var"
    - path: "frontend/src/main.tsx"
      provides: "App entry that does not hard-crash when auth key is a placeholder"
  key_links:
    - from: ".github/workflows/e2e.yml"
      to: "frontend/src/main.tsx"
      via: "VITE_CLERK_PUBLISHABLE_KEY env var passed to npm run dev via playwright webServer"
      pattern: "VITE_CLERK_PUBLISHABLE_KEY"
---

<objective>
Fix E2E CI failures caused by a missing or unset Clerk publishable key. The app's entry point hard-crashes (`throw new Error`) when `VITE_CLERK_PUBLISHABLE_KEY` is absent, preventing Playwright from loading any page. All E2E tests already mock API routes via `page.route()` — no real auth is needed at runtime.

Purpose: E2E tests must be runnable on CI without storing real auth credentials as secrets.
Output: Updated CI workflow with a placeholder key, and a guarded `main.tsx` that degrades gracefully when the key is a placeholder.
</objective>

<execution_context>
@C:/Users/bilge/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/bilge/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@frontend/src/main.tsx
@.github/workflows/e2e.yml
@frontend/playwright.config.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update CI workflow with placeholder Clerk key</name>
  <files>.github/workflows/e2e.yml</files>
  <action>
    Replace the `VITE_CLERK_PUBLISHABLE_KEY: ${{ secrets.VITE_CLERK_PUBLISHABLE_KEY }}` line in the "Run E2E tests" step env block with a hardcoded placeholder:

    ```yaml
    VITE_CLERK_PUBLISHABLE_KEY: pk_test_placeholder_for_ci_only
    ```

    Keep `VITE_API_BASE_URL: ""` as-is. Also add `VITE_GOOGLE_CLIENT_ID: "123456789-placeholder.apps.googleusercontent.com"` to the same env block so the workflow is ready for when Phase 7 replaces Clerk with Google OAuth. Do NOT remove `VITE_CLERK_PUBLISHABLE_KEY` yet — Phase 7 may not have landed on this branch.

    The placeholder value `pk_test_placeholder_for_ci_only` is not a real Clerk key and will not authenticate anyone. It is safe to commit. Real Google OAuth client IDs are also public (embedded in frontend JS), so the placeholder value is safe.

    Rationale: The Clerk SDK accepts any string value for `publishableKey` at construction time — it only fails at actual auth API calls, which never happen in E2E tests (all API routes are mocked via `page.route()`).
  </action>
  <verify>
    <automated>grep "pk_test_placeholder_for_ci_only" .github/workflows/e2e.yml && grep "VITE_GOOGLE_CLIENT_ID" .github/workflows/e2e.yml</automated>
  </verify>
  <done>The CI workflow env block contains a non-secret placeholder for VITE_CLERK_PUBLISHABLE_KEY and VITE_GOOGLE_CLIENT_ID, with no reference to ${{ secrets.VITE_CLERK_PUBLISHABLE_KEY }}</done>
</task>

<task type="auto">
  <name>Task 2: Guard main.tsx against hard-crash on placeholder key</name>
  <files>frontend/src/main.tsx</files>
  <action>
    The current code in `frontend/src/main.tsx` is:

    ```typescript
    const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
    if (!PUBLISHABLE_KEY) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');
    ```

    This throws before React mounts if the env var is missing or empty, which crashes the dev server response before Playwright can load any page.

    Replace the hard `throw` with a conditional that allows the app to render without Clerk when a placeholder is detected. Apply this defensive pattern:

    ```typescript
    const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
    const isTestEnv = !PUBLISHABLE_KEY || PUBLISHABLE_KEY.startsWith('pk_test_placeholder');

    // In development/CI with a placeholder key, render without ClerkProvider
    // so E2E tests can load the app. In production, PUBLISHABLE_KEY is always set.
    const root = createRoot(document.getElementById('root')!);

    if (isTestEnv) {
      root.render(
        <StrictMode>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </StrictMode>
      );
    } else {
      root.render(
        <StrictMode>
          <ThemeProvider>
            <ClerkProvider publishableKey={PUBLISHABLE_KEY!}>
              <App />
            </ClerkProvider>
          </ThemeProvider>
        </StrictMode>
      );
    }
    ```

    Keep all existing imports. Do NOT remove the ClerkProvider import or the else branch — Phase 7 will replace this file wholesale when it lands; this change only makes the current state CI-safe in the interim.

    Note: Phase 7 is replacing Clerk with Google OAuth. After Phase 7 lands, this file will be rewritten entirely. This change is a minimal safety shim for the current Clerk-based code so E2E CI is unblocked now.

    Also check if `App.tsx` or any component accessed via the root route renders a `<SignedIn>`/`<SignedOut>` Clerk gate that would block the chat UI from rendering. If so, note that `frontend/src/tests/setup.ts` already mocks those components to render their children — but that mock is only loaded by vitest, not by Playwright. For Playwright/E2E, if `App.tsx` conditionally renders Clerk guards without a fallback, those guards will receive undefined context and may throw. Inspect `frontend/src/App.tsx` and if Clerk hooks (`useAuth`, `useUser`) are called unconditionally, wrap them in a guard or provide a no-op fallback context. Only modify App.tsx if it will crash without ClerkProvider context; otherwise leave it unchanged.
  </action>
  <verify>
    <automated>cd frontend && npm run build -- --mode development 2>&1 | tail -5 || npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>frontend/src/main.tsx no longer throws when VITE_CLERK_PUBLISHABLE_KEY is a placeholder; the app renders the ThemeProvider and App tree without Clerk in that case. TypeScript compiles without new errors.</done>
</task>

</tasks>

<verification>
After both tasks, simulate CI locally:

```bash
cd frontend
VITE_CLERK_PUBLISHABLE_KEY=pk_test_placeholder_for_ci_only npx vite build --mode development 2>&1 | tail -10
```

Also verify the workflow file is valid YAML:

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/e2e.yml'))" && echo "YAML valid"
```
</verification>

<success_criteria>
- `.github/workflows/e2e.yml` contains no reference to `${{ secrets.VITE_CLERK_PUBLISHABLE_KEY }}`
- `frontend/src/main.tsx` does not throw when `VITE_CLERK_PUBLISHABLE_KEY` equals `pk_test_placeholder_for_ci_only`
- `npm run dev` (started by Playwright webServer) can serve the app with the placeholder key
- All E2E test files remain unchanged (they already mock all API routes)
- TypeScript compiles without errors
</success_criteria>

<output>
After completion, create `.planning/quick/5-fix-e2e-ci-update-workflow-and-tests-to-/5-SUMMARY.md` following the summary template.
</output>
