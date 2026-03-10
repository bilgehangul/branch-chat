---
phase: quick-11
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - backend/.env.example
  - frontend/.env.example
  - backend/src/middleware/auth.ts
  - frontend/src/contexts/AuthContext.tsx
  - frontend/src/types/index.ts
  - frontend/src/components/thread/ContextCard.tsx
  - frontend/src/components/branching/ActionBubble.tsx
  - frontend/src/components/branching/GutterColumn.tsx
  - frontend/src/components/layout/AncestorPeekPanel.tsx
  - frontend/src/components/layout/BreadcrumbBar.tsx
  - frontend/src/components/ui/ConfirmDialog.tsx
autonomous: true
requirements: [AUDIT-01, AUDIT-02, AUDIT-03]
must_haves:
  truths:
    - "No Clerk references remain in .env.example files"
    - "GOOGLE_CLIENT_ID is documented in backend .env.example"
    - "All listed components render correctly in dark mode"
    - "No dead annotation type 'rewrite' in type union"
    - "No stale Clerk comments in auth code"
  artifacts:
    - path: "backend/.env.example"
      provides: "Correct env template without Clerk keys, with GOOGLE_CLIENT_ID"
    - path: "frontend/.env.example"
      provides: "Correct env template with VITE_GOOGLE_CLIENT_ID"
    - path: "frontend/src/types/index.ts"
      provides: "Clean Annotation type union without 'rewrite'"
  key_links: []
---

<objective>
Fix all issues found in codebase audit: stale .env.example files with Clerk references, dark mode gaps across 6 components, and dead code cleanup.

Purpose: Eliminate technical debt identified during audit — stale auth references, broken dark mode, unused type variants.
Output: Clean .env.example files, dark-mode-complete components, no dead code.
</objective>

<execution_context>
@C:/Users/bilge/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/bilge/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@backend/.env.example
@frontend/.env.example
@frontend/src/types/index.ts
@frontend/src/contexts/AuthContext.tsx
@backend/src/middleware/auth.ts
@frontend/src/components/thread/ContextCard.tsx
@frontend/src/components/branching/ActionBubble.tsx
@frontend/src/components/branching/GutterColumn.tsx
@frontend/src/components/layout/AncestorPeekPanel.tsx
@frontend/src/components/layout/BreadcrumbBar.tsx
@frontend/src/components/ui/ConfirmDialog.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix .env.example files and remove stale Clerk references</name>
  <files>backend/.env.example, frontend/.env.example, backend/src/middleware/auth.ts, frontend/src/contexts/AuthContext.tsx</files>
  <action>
1. **backend/.env.example**: Remove the two Clerk lines (`CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` with their comments). Add `GOOGLE_CLIENT_ID=your_google_client_id_here` under the Tavily section with a comment `# Google OAuth (audience for ID token verification)`.

2. **frontend/.env.example**: Replace `VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here` with `VITE_GOOGLE_CLIENT_ID=your_google_client_id_here` and update the comment from `# Clerk authentication (required)` to `# Google OAuth (required)`.

3. **backend/src/middleware/auth.ts**: Line 3 says `// Replaces Clerk getAuth() pattern.` — update to `// Google OAuth ID token verification. Attaches verified user to req.verifiedUser.` (remove the Clerk reference).

4. **frontend/src/contexts/AuthContext.tsx**: Update the 3 stale Clerk comments:
   - Line 2: Change `// Replaces ClerkProvider + useAuth. Backed by Google OAuth via @react-oauth/google.` to `// Google OAuth authentication via @react-oauth/google.`
   - Line 3: Change `// Stores Google ID token in localStorage; exposes same getToken signature as Clerk.` to `// Stores Google ID token in localStorage; provides getToken for API authorization.`
   - Line 63: Change `// Same async signature as Clerk's getToken — no changes needed to api/ layer` to `// Async getToken for API authorization header`
  </action>
  <verify>
    <automated>grep -rn "clerk\|Clerk\|CLERK" backend/.env.example frontend/.env.example backend/src/middleware/auth.ts frontend/src/contexts/AuthContext.tsx; echo "EXIT:$?"</automated>
  </verify>
  <done>Zero grep matches for clerk/Clerk/CLERK in all four files. GOOGLE_CLIENT_ID present in both .env.example files.</done>
</task>

<task type="auto">
  <name>Task 2: Add dark mode variants to all 6 components</name>
  <files>frontend/src/components/thread/ContextCard.tsx, frontend/src/components/branching/ActionBubble.tsx, frontend/src/components/branching/GutterColumn.tsx, frontend/src/components/layout/AncestorPeekPanel.tsx, frontend/src/components/layout/BreadcrumbBar.tsx, frontend/src/components/ui/ConfirmDialog.tsx</files>
  <action>
Add `dark:` Tailwind variants to every hardcoded light-mode class. Follow the project's established dark palette: `dark:bg-zinc-900` for page bg, `dark:bg-zinc-800` for cards/panels, `dark:border-zinc-700` for borders, `dark:text-zinc-100/200/300/400` for text hierarchy.

**ContextCard.tsx:**
- Line 17: `text-slate-600` -> add `dark:text-zinc-400`
- Line 23: `bg-white` -> add `dark:bg-zinc-800`
- Line 24: `text-slate-400` -> add `dark:text-zinc-500`

**ActionBubble.tsx:**
- Line 96: `bg-white border border-slate-200` -> add `dark:bg-zinc-800 dark:border-zinc-700`

**GutterColumn.tsx — ThreadContextMenu (line 78):**
- `bg-white border border-slate-200` -> add `dark:bg-zinc-800 dark:border-zinc-700`
- Line 82: `text-red-600 hover:bg-red-50` -> add `dark:text-red-400 dark:hover:bg-red-900/30`
- Lines 88, 94: `text-slate-600 hover:bg-slate-50` -> add `dark:text-zinc-300 dark:hover:bg-zinc-700`

**GutterColumn.tsx — DescendantPill (line 131):**
- `text-slate-600 hover:bg-slate-100` -> add `dark:text-zinc-300 dark:hover:bg-zinc-700`
- `text-slate-300` -> add `dark:text-zinc-500`
- `text-slate-400` -> add `dark:text-zinc-500`

**GutterColumn.tsx — LeadPill (line 190):**
- `border-slate-200 hover:bg-slate-50` and `bg-white` -> add `dark:border-zinc-700 dark:hover:bg-zinc-700 dark:bg-zinc-800`
- `bg-white/90` mobile variant -> add `dark:bg-zinc-800/90`
- `text-slate-400` -> add `dark:text-zinc-500`
- `text-slate-800` -> add `dark:text-zinc-100`

**GutterColumn.tsx — Preview card (line 224):**
- `bg-white border border-slate-200` -> add `dark:bg-zinc-800 dark:border-zinc-700`
- `text-slate-700` -> add `dark:text-zinc-200`
- `text-slate-500` -> add `dark:text-zinc-400`

**GutterColumn.tsx — Descendant border (line 208):**
- `border-slate-200` -> add `dark:border-zinc-700`

**AncestorPeekPanel.tsx — ContextMenu (line 39):**
- `bg-white border border-slate-200` -> add `dark:bg-zinc-800 dark:border-zinc-700`
- `text-red-600 hover:bg-red-50` -> add `dark:text-red-400 dark:hover:bg-red-900/30`
- `text-slate-600 hover:bg-slate-50` -> add `dark:text-zinc-300 dark:hover:bg-zinc-700`

**AncestorPeekPanel.tsx — Panel (line 105):**
- `bg-slate-50/80 sm:bg-slate-50` -> add `dark:bg-zinc-900/80 sm:dark:bg-zinc-900`
- `hover:bg-slate-100` -> add `dark:hover:bg-zinc-800`

**AncestorPeekPanel.tsx — Title header (line 116):**
- `bg-white border-b border-slate-200` -> add `dark:bg-zinc-800 dark:border-zinc-700`
- `text-slate-600` -> add `dark:text-zinc-400`

**AncestorPeekPanel.tsx — Messages:**
- `text-slate-700` -> add `dark:text-zinc-200`
- `text-slate-600` -> add `dark:text-zinc-300`
- `text-slate-400` -> add `dark:text-zinc-500`

**AncestorPeekPanel.tsx — Bottom fade (line 175):**
- `from-slate-50` -> add `dark:from-zinc-900`

**BreadcrumbBar.tsx — Dropdown (line 85):**
- `bg-white border border-slate-200` -> add `dark:bg-zinc-800 dark:border-zinc-700`
- `text-slate-700 hover:bg-slate-100` -> add `dark:text-zinc-200 dark:hover:bg-zinc-700`

**BreadcrumbBar.tsx — Crumb text:**
- `text-slate-500 hover:text-slate-800` -> add `dark:text-zinc-400 dark:hover:text-zinc-100`
- `text-slate-400` (chevron) -> add `dark:text-zinc-600`
- `text-slate-900` (current crumb) -> add `dark:text-zinc-100`

**ConfirmDialog.tsx:**
- Line 30: `bg-white` -> add `dark:bg-zinc-800`
- Line 31: `text-slate-800` -> add `dark:text-zinc-100`
- Line 32: `text-slate-500` -> add `dark:text-zinc-400`
- Line 35: `bg-slate-100 hover:bg-slate-200 text-slate-600` -> add `dark:bg-zinc-700 dark:hover:bg-zinc-600 dark:text-zinc-300`
  </action>
  <verify>
    <automated>cd "C:/gmu/coding/GenAI Web interface/child_chats_v1" && npx tsc --noEmit -p frontend/tsconfig.app.json 2>&1 | head -20</automated>
  </verify>
  <done>All 6 components compile without errors. Every bg-white has a dark:bg-zinc-800 counterpart. Every text-slate-* has a dark:text-zinc-* counterpart. Every border-slate-* has a dark:border-zinc-* counterpart.</done>
</task>

<task type="auto">
  <name>Task 3: Remove dead 'rewrite' annotation type</name>
  <files>frontend/src/types/index.ts</files>
  <action>
In `frontend/src/types/index.ts` line 35, change the Annotation `type` field from:
```
type: 'source' | 'rewrite' | 'simplification';
```
to:
```
type: 'source' | 'simplification';
```

Only 'source' and 'simplification' are used in the codebase. 'rewrite' is dead code that was never implemented.

After editing, verify no code references `'rewrite'` as an annotation type:
```bash
grep -rn "'rewrite'" frontend/src/
```
  </action>
  <verify>
    <automated>cd "C:/gmu/coding/GenAI Web interface/child_chats_v1" && grep -rn "'rewrite'" frontend/src/ ; npx tsc --noEmit -p frontend/tsconfig.app.json 2>&1 | head -20</automated>
  </verify>
  <done>No references to 'rewrite' in frontend/src/. TypeScript compiles without errors confirming no code depends on the removed variant.</done>
</task>

</tasks>

<verification>
- `grep -rn "clerk\|Clerk\|CLERK" backend/.env.example frontend/.env.example backend/src/middleware/auth.ts frontend/src/contexts/AuthContext.tsx` returns 0 matches
- `grep -rn "GOOGLE_CLIENT_ID" backend/.env.example frontend/.env.example` returns matches in both files
- `grep -rn "'rewrite'" frontend/src/` returns 0 matches
- `npx tsc --noEmit -p frontend/tsconfig.app.json` compiles clean
- All 6 dark-mode-fixed components have `dark:` variants on every light-mode class
</verification>

<success_criteria>
- Zero Clerk references in .env.example files and auth code comments
- GOOGLE_CLIENT_ID documented in both .env.example files
- All 6 components have dark: Tailwind variants for bg, text, and border classes
- 'rewrite' annotation type removed, TypeScript compiles clean
</success_criteria>

<output>
After completion, create `.planning/quick/11-extensive-codebase-audit-find-and-fix-al/11-SUMMARY.md`
</output>
