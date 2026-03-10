---
phase: quick-7
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - backend/src/routes/sessions.ts
  - backend/src/index.ts
  - frontend/src/api/sessions.ts
  - frontend/src/components/thread/ThreadView.tsx
autonomous: true
requirements: [PERSIST-01, PERSIST-02, PERSIST-03, PERSIST-04, PERSIST-05]

must_haves:
  truths:
    - "Child threads created via Go Deeper survive page refresh"
    - "Gutter pills (childLeads) are visible after page reload"
    - "Find Sources and Simplify annotations are visible after page reload"
    - "Scroll position is restored on return to a thread after page reload"
    - "Deleted threads and their messages are removed from MongoDB"
  artifacts:
    - path: "backend/src/routes/sessions.ts"
      provides: "POST /api/threads, PATCH /api/threads/:id, DELETE /api/threads/:id, PATCH /api/messages/:id"
    - path: "frontend/src/api/sessions.ts"
      provides: "createThreadOnBackend, updateThreadOnBackend, deleteThreadFromDB, updateMessageOnBackend"
    - path: "frontend/src/components/thread/ThreadView.tsx"
      provides: "fire-and-forget persistence wiring in handleGoDeeper, handleFindSources, handleSimplify, scroll save, GutterColumn delete"
  key_links:
    - from: "frontend/src/components/thread/ThreadView.tsx"
      to: "POST /api/threads"
      via: "createThreadOnBackend() called in handleGoDeeper after createThread()"
    - from: "frontend/src/components/thread/ThreadView.tsx"
      to: "PATCH /api/messages/:id"
      via: "updateMessageOnBackend() called after addChildLead(), addAnnotation(), updateAnnotation()"
    - from: "frontend/src/components/thread/ThreadView.tsx"
      to: "DELETE /api/threads/:id"
      via: "deleteThreadFromDB() called alongside deleteThread() in GutterColumn onDeleteThread callback"
---

<objective>
Persist child threads, message annotations, childLeads, scroll position, and thread deletion to MongoDB so data survives page refresh.

Purpose: Six mutation paths in ThreadView.tsx update only Zustand but never hit the backend. On reload, all branching structure, gutter pills, and annotation results are lost.
Output: Four new backend routes + four new API client functions + fire-and-forget wiring at each mutation site.
</objective>

<execution_context>
@C:/Users/bilge/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/bilge/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

<interfaces>
<!-- From backend/src/db/models/Thread.ts -->
IThread fields: _id (String/UUID), sessionId, userId, parentThreadId (null|string),
depth (0-4), anchorText (null|string), parentMessageId (null|string), title, accentColor,
childThreadIds (string[]), scrollPosition (number), createdAt

<!-- From backend/src/db/models/Message.ts -->
IMessage fields: _id (String/UUID), threadId, sessionId, userId, role, content, createdAt,
annotations (Mixed — array), childLeads (Mixed — array)

<!-- From backend/src/routes/sessions.ts — ownership check pattern -->
Ownership check for Sessions: Session.findById(id) then check session.userId === req.verifiedUser!.sub
Ownership check for Threads: Thread.findById(id) then check thread.userId === req.verifiedUser!.sub
Ownership check for Messages: Message.findById(id) then check message.userId === req.verifiedUser!.sub

<!-- From frontend/src/api/sessions.ts — apiFetch helper already defined -->
apiFetch(url, options, getToken): handles Bearer token, Content-Type, API_BASE prefix

<!-- From frontend/src/components/thread/ThreadView.tsx — key call sites -->
handleGoDeeper(): calls createThread() → addChildLead() → clearBubble() → setActiveThread()
handleFindSources(): calls addAnnotation() or updateAnnotation() at end of doFetch()
handleSimplify(): calls addAnnotation() or updateAnnotation() at end of doFetch()
scroll save useEffect: calls setScrollPosition(prevId, scrollRef.current.scrollTop) when activeThreadId changes
GutterColumn prop: onDeleteThread={deleteThread} — this is the delete entry point

<!-- From backend/src/routes/index.ts — route registration pattern -->
New routers added as: apiRouter.use('/threads', threadsRouter); apiRouter.use('/messages', messagesRouter);
All routes auto-inherit requireApiAuth from apiRouter.use(requireApiAuth)

<!-- sessionId in ThreadView -->
const sessionId = useSessionStore.getState().session?.id  // synchronous snapshot
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Backend — add threads and messages mutation routes</name>
  <files>backend/src/routes/sessions.ts, backend/src/routes/index.ts, backend/src/index.ts</files>
  <action>
Add four new routes. Keep threads routes in a new dedicated router `threadsRouter` appended at the bottom of `backend/src/routes/sessions.ts` (export it), and a `messagesRouter` similarly. Register both in `backend/src/routes/index.ts`. Also add `'DELETE'` to the CORS methods array in `backend/src/index.ts`.

**In `backend/src/routes/sessions.ts`**, add after the existing sessionsRouter code:

```typescript
import { Router } from 'express'; // already imported
// ... (existing sessionsRouter code unchanged) ...

export const threadsRouter = Router();

// POST /api/threads — create child thread
threadsRouter.post('/', async (req, res) => {
  try {
    const userId = req.verifiedUser!.sub;
    const { threadId, sessionId, parentThreadId, depth, anchorText, parentMessageId, title, accentColor } =
      req.body as {
        threadId: string; sessionId: string; parentThreadId: string;
        depth: number; anchorText: string; parentMessageId: string | null;
        title: string; accentColor: string;
      };

    if (!threadId || !sessionId || !parentThreadId) {
      res.status(400).json({ data: null, error: { code: 'BAD_REQUEST', message: 'threadId, sessionId, parentThreadId required.' } });
      return;
    }

    // Ownership: verify session belongs to this user
    const session = await Session.findById(sessionId).lean();
    if (!session || session.userId !== userId) {
      res.status(403).json({ data: null, error: { code: 'FORBIDDEN', message: 'Access denied.' } });
      return;
    }

    await Thread.create({
      _id: threadId, sessionId, userId, parentThreadId, depth: depth ?? 1,
      anchorText: anchorText ?? null, parentMessageId: parentMessageId ?? null,
      title, accentColor, childThreadIds: [], scrollPosition: 0,
    } as never);

    // Update parent thread's childThreadIds array
    await Thread.findByIdAndUpdate(parentThreadId, { $push: { childThreadIds: threadId } });

    res.status(201).json({ data: { threadId }, error: null });
  } catch (err) {
    console.error('[POST /api/threads]', err);
    res.status(500).json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Failed to create thread.' } });
  }
});

// PATCH /api/threads/:id — update title and/or scrollPosition
threadsRouter.patch('/:id', async (req, res) => {
  try {
    const userId = req.verifiedUser!.sub;
    const thread = await Thread.findById(req.params.id).lean();
    if (!thread || thread.userId !== userId) {
      res.status(403).json({ data: null, error: { code: 'FORBIDDEN', message: 'Access denied.' } });
      return;
    }

    const { title, scrollPosition } = req.body as { title?: string; scrollPosition?: number };
    const patch: Record<string, unknown> = {};
    if (title !== undefined) patch['title'] = title;
    if (scrollPosition !== undefined) patch['scrollPosition'] = scrollPosition;

    await Thread.findByIdAndUpdate(req.params.id, { $set: patch });
    res.json({ data: { updated: true }, error: null });
  } catch (err) {
    console.error('[PATCH /api/threads/:id]', err);
    res.status(500).json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Failed to update thread.' } });
  }
});

// DELETE /api/threads/:id — delete thread and all descendants + their messages
threadsRouter.delete('/:id', async (req, res) => {
  try {
    const userId = req.verifiedUser!.sub;
    const thread = await Thread.findById(req.params.id).lean();
    if (!thread || thread.userId !== userId) {
      res.status(403).json({ data: null, error: { code: 'FORBIDDEN', message: 'Access denied.' } });
      return;
    }

    // Collect all descendant thread IDs (BFS using in-memory sessionId query)
    const allThreadsInSession = await Thread.find({ sessionId: thread.sessionId }).lean();
    const threadMap = new Map(allThreadsInSession.map(t => [t._id, t]));

    const toDelete: string[] = [];
    const queue = [req.params.id];
    while (queue.length) {
      const id = queue.shift()!;
      toDelete.push(id);
      const t = threadMap.get(id);
      if (t?.childThreadIds) queue.push(...t.childThreadIds);
    }

    await Thread.deleteMany({ _id: { $in: toDelete } });
    await Message.deleteMany({ threadId: { $in: toDelete } });

    res.json({ data: { deleted: toDelete.length }, error: null });
  } catch (err) {
    console.error('[DELETE /api/threads/:id]', err);
    res.status(500).json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete thread.' } });
  }
});

export const messagesRouter = Router();

// PATCH /api/messages/:id — update annotations and/or childLeads (replace whole array)
messagesRouter.patch('/:id', async (req, res) => {
  try {
    const userId = req.verifiedUser!.sub;
    const message = await Message.findById(req.params.id).lean();
    if (!message || message.userId !== userId) {
      res.status(403).json({ data: null, error: { code: 'FORBIDDEN', message: 'Access denied.' } });
      return;
    }

    const { annotations, childLeads } = req.body as { annotations?: unknown[]; childLeads?: unknown[] };
    if (annotations !== undefined && !Array.isArray(annotations)) {
      res.status(400).json({ data: null, error: { code: 'BAD_REQUEST', message: 'annotations must be an array.' } });
      return;
    }
    if (childLeads !== undefined && !Array.isArray(childLeads)) {
      res.status(400).json({ data: null, error: { code: 'BAD_REQUEST', message: 'childLeads must be an array.' } });
      return;
    }

    const patch: Record<string, unknown> = {};
    if (annotations !== undefined) patch['annotations'] = annotations;
    if (childLeads !== undefined) patch['childLeads'] = childLeads;

    // markModified not needed for $set — we replace, not mutate in place
    await Message.findByIdAndUpdate(req.params.id, { $set: patch });
    res.json({ data: { updated: true }, error: null });
  } catch (err) {
    console.error('[PATCH /api/messages/:id]', err);
    res.status(500).json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Failed to update message.' } });
  }
});
```

**In `backend/src/routes/index.ts`**, add:
```typescript
import { threadsRouter, messagesRouter } from './sessions.js'; // add to existing import or separate line
// ...
apiRouter.use('/threads', threadsRouter);
apiRouter.use('/messages', messagesRouter);
```

**In `backend/src/index.ts`**, change CORS methods to:
```typescript
methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
```
  </action>
  <verify>
    <automated>cd "C:/gmu/coding/GenAI Web interface/child_chats_v1/backend" && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>TypeScript compiles without errors. Four routes exist: POST /api/threads, PATCH /api/threads/:id, DELETE /api/threads/:id, PATCH /api/messages/:id. All ownership-checked. CORS allows DELETE.</done>
</task>

<task type="auto">
  <name>Task 2: Frontend — API client functions + ThreadView persistence wiring</name>
  <files>frontend/src/api/sessions.ts, frontend/src/components/thread/ThreadView.tsx</files>
  <action>
**In `frontend/src/api/sessions.ts`**, append four new exported functions after the existing `createSessionOnBackend`:

```typescript
export async function createThreadOnBackend(
  payload: {
    threadId: string; sessionId: string; parentThreadId: string;
    depth: number; anchorText: string; parentMessageId: string | null;
    title: string; accentColor: string;
  },
  getToken: () => Promise<string | null>
): Promise<void> {
  try {
    await apiFetch('/api/threads', { method: 'POST', body: JSON.stringify(payload) }, getToken);
  } catch {
    // fire-and-forget — non-fatal
  }
}

export async function updateThreadOnBackend(
  threadId: string,
  patch: { title?: string; scrollPosition?: number },
  getToken: () => Promise<string | null>
): Promise<void> {
  try {
    await apiFetch(`/api/threads/${threadId}`, { method: 'PATCH', body: JSON.stringify(patch) }, getToken);
  } catch {
    // fire-and-forget — non-fatal
  }
}

export async function deleteThreadFromDB(
  threadId: string,
  getToken: () => Promise<string | null>
): Promise<void> {
  try {
    await apiFetch(`/api/threads/${threadId}`, { method: 'DELETE' }, getToken);
  } catch {
    // fire-and-forget — non-fatal
  }
}

export async function updateMessageOnBackend(
  messageId: string,
  patch: { annotations?: unknown[]; childLeads?: unknown[] },
  getToken: () => Promise<string | null>
): Promise<void> {
  try {
    await apiFetch(`/api/messages/${messageId}`, { method: 'PATCH', body: JSON.stringify(patch) }, getToken);
  } catch {
    // fire-and-forget — non-fatal
  }
}
```

**In `frontend/src/components/thread/ThreadView.tsx`**, make the following targeted additions:

1. Add imports at the top (after existing `sessions` import or alongside it):
```typescript
import { createThreadOnBackend, updateThreadOnBackend, deleteThreadFromDB, updateMessageOnBackend } from '../../api/sessions';
```

2. Inside `handleGoDeeper()`, after `setActiveThread(newThreadId)` add:
```typescript
// Persist child thread to MongoDB (fire-and-forget)
const sessionId = useSessionStore.getState().session?.id;
if (sessionId) {
  void createThreadOnBackend({
    threadId: newThreadId,
    sessionId,
    parentThreadId: activeThreadId,
    depth: (activeThread.depth ?? 0) + 1,
    anchorText,
    parentMessageId: messageId || null,
    title,
    accentColor,
  }, getToken);
}
// Persist parent message childLeads (fire-and-forget)
if (messageId) {
  const updatedChildLeads = useSessionStore.getState().messages[messageId]?.childLeads;
  if (updatedChildLeads) {
    void updateMessageOnBackend(messageId, { childLeads: updatedChildLeads }, getToken);
  }
}
```

3. Inside `handleFindSources()` → inside `doFetch()`, after `setPendingAnnotation(null)` (the success path that calls `addAnnotation` or `updateAnnotation`) add:
```typescript
// Persist updated annotations (fire-and-forget)
const updatedAnnotations = useSessionStore.getState().messages[messageId]?.annotations;
if (updatedAnnotations) {
  void updateMessageOnBackend(messageId, { annotations: updatedAnnotations }, getToken);
}
```

4. Inside `handleSimplify()` → inside `doFetch()`, after `setPendingAnnotation(null)` (same success path) add:
```typescript
// Persist updated annotations (fire-and-forget)
const updatedAnnotations = useSessionStore.getState().messages[messageId]?.annotations;
if (updatedAnnotations) {
  void updateMessageOnBackend(messageId, { annotations: updatedAnnotations }, getToken);
}
```

5. In the scroll-save useEffect (the one with `if (prevId && scrollRef.current) { setScrollPosition(...) }`), add the persistence call right after `setScrollPosition`:
```typescript
void updateThreadOnBackend(prevId, { scrollPosition: scrollRef.current.scrollTop }, getToken);
```

6. Replace the `onDeleteThread` prop passed to `GutterColumn` — change from:
```typescript
onDeleteThread={deleteThread}
```
to:
```typescript
onDeleteThread={(threadId) => {
  deleteThread(threadId);
  void deleteThreadFromDB(threadId, getToken);
}}
```

Note: `getToken` is already available in ThreadView scope via `const { getToken } = useAuth();` at line 39.
  </action>
  <verify>
    <automated>cd "C:/gmu/coding/GenAI Web interface/child_chats_v1/frontend" && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>Frontend TypeScript compiles without errors. Four new API functions exported from sessions.ts. ThreadView fires persistence calls at all six mutation sites without blocking UI flow.</done>
</task>

</tasks>

<verification>
After both tasks:
1. `cd backend && npx tsc --noEmit` — zero errors
2. `cd frontend && npx tsc --noEmit` — zero errors
3. Manual smoke test (dev server):
   - Create session, Go Deeper on a paragraph → reload page → child thread appears in gutter
   - Find Sources on a paragraph → reload → citation block still rendered
   - Simplify a paragraph → reload → simplification block still rendered
   - Navigate away from a thread (scroll down first) → reload → scroll position restored
   - Delete a child thread → reload → thread gone from gutter, not in session history
</verification>

<success_criteria>
All six data-loss scenarios fixed: child threads, childLeads (gutter pills), source annotations, simplification annotations, scroll position, and thread deletion all survive page reload. Fire-and-forget pattern ensures zero UI blocking. Backend ownership checks prevent cross-user data access.
</success_criteria>

<output>
After completion, create `.planning/quick/7-fix-mongodb-persistence-gaps-child-threa/7-SUMMARY.md` with what was built, files changed, and any decisions made.
</output>
