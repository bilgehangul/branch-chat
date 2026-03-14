---
phase: quick-26
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/src/contexts/SettingsContext.tsx
  - frontend/src/components/settings/SettingsModal.tsx
autonomous: true
requirements: []
must_haves:
  truths:
    - "After saving a BYOK API key, the first model for that provider is auto-selected and immediately active"
    - "Chat requests use the BYOK provider/model/key after saving (not silent free-tier fallback)"
    - "User can still change models via dropdown after auto-selection"
    - "The model dropdown shows the auto-selected model (not 'Free') after save"
  artifacts:
    - path: "frontend/src/contexts/SettingsContext.tsx"
      provides: "saveByokSettings auto-selects first model for provider"
    - path: "frontend/src/components/settings/SettingsModal.tsx"
      provides: "MODEL_LISTS exported for use by SettingsContext"
  key_links:
    - from: "frontend/src/contexts/SettingsContext.tsx"
      to: "frontend/src/hooks/useStreamingChat.ts"
      via: "byokModel must be non-null for byokCredentials to form"
      pattern: "tier.*byok.*byokProvider.*byokModel.*byokApiKey"
---

<objective>
Fix: after saving a BYOK API key (e.g., OpenAI), the model selection is not applied. The user ends up with tier='byok' but byokModel=null, causing useStreamingChat to silently fall back to the free tier Gemini provider.

Root cause: `saveByokSettings` in SettingsContext sets `tier: 'byok'` but does NOT set a default `byokModel`. The model was cleared to `null` by `setByokProvider` during the add-key flow, and `saveByokSettings` never restores it. This means `byokCredentials` in useStreamingChat evaluates to `undefined` (all four fields must be truthy), so the request goes to the free-tier default provider instead.

Fix: `saveByokSettings` must auto-select the first model for the chosen provider when `byokModel` is null at save time. This requires the model lists to be accessible from SettingsContext.

Output: Working BYOK flow where saving a key immediately activates the provider with its first model.
</objective>

<execution_context>
@C:/Users/bilge/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/bilge/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@frontend/src/contexts/SettingsContext.tsx
@frontend/src/components/settings/SettingsModal.tsx
@frontend/src/hooks/useStreamingChat.ts
@frontend/src/components/input/ModelBadge.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Extract MODEL_LISTS to shared location and auto-select first model on save</name>
  <files>frontend/src/components/settings/SettingsModal.tsx, frontend/src/contexts/SettingsContext.tsx</files>
  <action>
1. In SettingsModal.tsx, export the `MODEL_LISTS` constant (add `export` keyword). It is already a `Record<ByokProvider, { id: string; label: string }[]>` which is exactly what SettingsContext needs.

2. In SettingsContext.tsx, import `MODEL_LISTS` from `../components/settings/SettingsModal` (only the constant, no circular dependency risk since it's a plain data object).

   ALTERNATIVE if circular import is a concern: extract MODEL_LISTS into a new file `frontend/src/constants/models.ts` and import from there in both files. Use whichever approach is cleaner -- the key constraint is that SettingsContext must be able to look up the first model for a provider.

3. In `saveByokSettings`, after the existing logic but before the final `setState`, determine the model to save:
   ```ts
   const modelToSave = state.byokModel ?? MODEL_LISTS[provider]?.[0]?.id ?? null;
   ```

4. Update the `settingsData` object to use `modelToSave` instead of `state.byokModel`:
   ```ts
   const settingsData = {
     tier: 'byok' as Tier,
     byokProvider: provider,
     byokModel: modelToSave,  // was: state.byokModel (which could be null)
     byokKeyVerified: state.byokKeyVerified,
     searchProvider: state.searchProvider,
     savedKeys: newSavedKeys,
   };
   ```

5. Update the final `setState` call to also set `byokModel`:
   ```ts
   setState(s => ({ ...s, tier: 'byok', savedKeys: newSavedKeys, byokModel: modelToSave }));
   ```

6. Add `byokModel: modelToSave` to the `useCallback` dependency array is NOT needed since `modelToSave` is derived inside the callback from `state.byokModel` which is already a dependency.

This ensures that after save: tier='byok', byokProvider='openai', byokModel='gpt-5.4' (first OpenAI model), byokApiKey='sk-...' -- all four truthy, so byokCredentials forms correctly in useStreamingChat.
  </action>
  <verify>
    <automated>cd "C:/gmu/coding/GenAI Web interface/child_chats_v1/frontend" && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>After saving a BYOK key, byokModel is auto-populated with the first model for the provider. The activeModelId in SettingsModal dropdown reflects the selected model (not 'default'). byokCredentials in useStreamingChat is non-undefined when tier=byok.</done>
</task>

<task type="auto">
  <name>Task 2: Fix anthropic missing from createByokProvider type cast in chat.ts</name>
  <files>backend/src/routes/chat.ts</files>
  <action>
On line 49 of chat.ts, the type cast for `byok.provider` is `'gemini' | 'openai'` but is missing `'anthropic'`. Fix to include all three providers:

Change:
```ts
? createByokProvider(byok.provider as 'gemini' | 'openai', byok.model, rawApiKey)
```
To:
```ts
? createByokProvider(byok.provider as 'gemini' | 'openai' | 'anthropic', byok.model, rawApiKey)
```

This is a minor type safety fix found during investigation. Runtime behavior is unaffected (string passes through regardless of type annotation) but it prevents future confusion and matches the actual createByokProvider signature.
  </action>
  <verify>
    <automated>cd "C:/gmu/coding/GenAI Web interface/child_chats_v1/backend" && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>Type cast includes all three BYOK providers. TypeScript compiles without errors.</done>
</task>

</tasks>

<verification>
1. `cd frontend && npx tsc --noEmit` -- no type errors
2. `cd backend && npx tsc --noEmit` -- no type errors
3. Manual flow: open Settings > Add API Key > select OpenAI > enter key > verify > save > observe model dropdown shows first OpenAI model (GPT-5.4) selected, not "Gemini Flash 2.0 (Free)"
4. Send a message -- should use the OpenAI model (visible in network tab: byok object in request body has provider/model/apiKey)
</verification>

<success_criteria>
- After saving an API key, the model dropdown immediately shows the first model for the chosen provider
- Chat requests include byok credentials (not silent free-tier fallback)
- Existing model switching via dropdown continues to work
- TypeScript compiles cleanly in both frontend and backend
</success_criteria>

<output>
After completion, create `.planning/quick/26-fix-model-selection-not-applying-when-ch/26-SUMMARY.md`
</output>
