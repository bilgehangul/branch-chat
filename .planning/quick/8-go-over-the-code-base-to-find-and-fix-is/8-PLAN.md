---
phase: quick-8
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - shared/types.ts
  - frontend/src/api/client.ts
  - frontend/src/store/sessionStore.ts
  - backend/src/routes/chat.ts
  - backend/src/routes/sessions.ts
autonomous: true
requirements: []

must_haves:
  truths:
    - "Role enum is consistent across shared types, backend providers, backend DB, and frontend"
    - "apiRequest 401 return matches ApiResponse shape (not raw string)"
    - "Summary/compact messages include createdAt timestamp"
    - "Thread delete on backend cleans up childLeads in parent messages"
  artifacts:
    - path: "shared/types.ts"
      provides: "Corrected shared Message role type with migration note"
    - path: "frontend/src/api/client.ts"
      provides: "Type-safe 401 handling returning proper ApiError"
    - path: "frontend/src/store/sessionStore.ts"
      provides: "createdAt on summary/compact messages"
    - path: "backend/src/routes/sessions.ts"
      provides: "childLeads cleanup on thread delete"
  key_links:
    - from: "frontend/src/hooks/useStreamingChat.ts"
      to: "backend/src/routes/chat.ts"
      via: "role mapping: frontend 'assistant' -> wire 'model' -> backend saves 'assistant'"
      pattern: "role.*model|role.*assistant"
    - from: "frontend/src/api/client.ts"
      to: "shared/types.ts"
      via: "ApiResponse type import"
      pattern: "ApiResponse"
---

<objective>
Fix type mismatches, data shape inconsistencies, and missing cleanup logic found during codebase audit.

Purpose: The codebase has accumulated several subtle issues across 7 phases of development: a role enum mismatch between shared/frontend/backend types, a type-unsafe 401 handler, missing timestamps on generated messages, and orphaned childLeads after thread deletion.
Output: Cleaned up type consistency, proper error shapes, and complete data cleanup.
</objective>

<execution_context>
@C:/Users/bilge/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/bilge/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@shared/types.ts
@frontend/src/types/index.ts
@frontend/src/api/client.ts
@frontend/src/store/sessionStore.ts
@frontend/src/hooks/useStreamingChat.ts
@backend/src/providers/types.ts
@backend/src/routes/chat.ts
@backend/src/routes/sessions.ts
@backend/src/db/models/Message.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix role enum mismatch, apiRequest 401 shape, and missing createdAt</name>
  <files>shared/types.ts, frontend/src/api/client.ts, frontend/src/store/sessionStore.ts</files>
  <action>
Three targeted fixes:

1. **shared/types.ts**: The shared `Message` interface uses `role: 'user' | 'model'` but the frontend uses `'user' | 'assistant'` and the backend DB stores `'assistant'`. The backend `providers/types.ts` correctly uses `'model'` for the AI provider wire format. Update shared/types.ts `Message.role` to `'user' | 'model'` (keep as-is since it represents wire format) BUT add a clear doc comment: `// Wire format for AI providers. Frontend uses 'assistant' — see frontend/src/types/index.ts`. This is NOT a code bug (the mapping happens correctly in useStreamingChat line 88), but the shared type is misleading. Also add `role: 'user' | 'model' | 'assistant'` to cover both wire and storage formats with a comment explaining why.

Actually, the cleanest fix: shared/types.ts Message is used by the backend providers only. Leave it as `'user' | 'model'`. Add a JSDoc comment explaining the role mapping: backend providers use 'model', MongoDB stores 'assistant', frontend Zustand uses 'assistant'. The mapping happens in useStreamingChat.ts (assistant->model for outbound) and chat.ts saves as 'assistant'.

2. **frontend/src/api/client.ts**: On 401, `apiRequest` returns `{ error: 'Session expired...' }` but `ApiResponse.error` is typed as `ApiError | null` (an object with `code` and `message` fields). Fix the 401 return to: `return { data: null, error: { code: 'UNAUTHORIZED', message: 'Session expired. Please sign in again.' } };`

3. **frontend/src/store/sessionStore.ts**: In `summarizeThread` and `compactThread`, the created `summaryMessage` objects are missing `createdAt`. Add `createdAt: Date.now()` to both summary message constructions (lines ~273 and ~325).
  </action>
  <verify>
    <automated>cd frontend && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>shared/types.ts has clarifying JSDoc on role enum; apiRequest returns proper ApiError object on 401; summary messages include createdAt</done>
</task>

<task type="auto">
  <name>Task 2: Add childLeads cleanup to backend thread delete and fix session title persistence</name>
  <files>backend/src/routes/sessions.ts</files>
  <action>
In the `DELETE /api/threads/:id` handler (threadsRouter.delete), after deleting threads and messages, add cleanup of orphaned childLeads references:

After `await Message.deleteMany(...)`, add:
```
// Clean up childLeads references in parent thread's messages
// Messages in the parent thread may have childLeads pointing to deleted threads
if (thread.parentThreadId) {
  const parentMessages = await Message.find({ threadId: thread.parentThreadId }).lean();
  for (const pm of parentMessages) {
    if (Array.isArray(pm.childLeads) && pm.childLeads.length > 0) {
      const filtered = pm.childLeads.filter(
        (cl: { threadId?: string }) => cl.threadId && !toDelete.includes(cl.threadId)
      );
      if (filtered.length !== pm.childLeads.length) {
        await Message.findByIdAndUpdate(pm._id, { $set: { childLeads: filtered } });
      }
    }
  }
}
```

Use `toDelete` (the array of deleted thread IDs) to filter out stale childLeads. Convert `toDelete` from a flat array or use Set for efficient lookup. Note: `toDelete` is already an array of strings in the current code.
  </action>
  <verify>
    <automated>cd backend && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>DELETE /api/threads/:id cleans up childLeads in parent thread's messages, preventing orphaned references after branch deletion</done>
</task>

</tasks>

<verification>
- `cd frontend && npx tsc --noEmit` passes with no type errors
- `cd backend && npx tsc --noEmit` passes with no type errors
- Manual: delete a child thread, reload session, confirm parent message childLeads array no longer contains reference to deleted thread
</verification>

<success_criteria>
- Role enum documented clearly across shared/backend/frontend boundary
- apiRequest 401 returns `{ data: null, error: { code: 'UNAUTHORIZED', message: '...' } }` matching ApiResponse type
- summarizeThread/compactThread messages include createdAt
- Thread deletion cleans up childLeads in parent messages on backend
</success_criteria>

<output>
After completion, create `.planning/quick/8-go-over-the-code-base-to-find-and-fix-is/8-SUMMARY.md`
</output>
