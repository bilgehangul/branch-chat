// backend/src/routes/sessions.ts
import { Router } from 'express';
import { Session } from '../db/models/Session.js';
import { Thread } from '../db/models/Thread.js';
import { Message } from '../db/models/Message.js';

export const sessionsRouter = Router();

// GET /api/sessions — list user's 20 most recent sessions
sessionsRouter.get('/', async (req, res) => {
  try {
    const userId = req.verifiedUser!.sub;
    const sessions = await Session.find({ userId })
      .sort({ lastActivityAt: -1 })
      .limit(20)
      .lean();

    const result = await Promise.all(sessions.map(async (s) => {
      const rootThread = await Thread.findOne({
        sessionId: s._id.toString(),
        depth: 0,
      }).lean();
      return {
        id: s._id.toString(),
        createdAt: s.createdAt.getTime(),
        lastActivityAt: s.lastActivityAt.getTime(),
        title: rootThread?.title ?? 'Untitled',
      };
    }));

    res.json({ data: result, error: null });
  } catch (err) {
    console.error('[GET /api/sessions]', err);
    res.status(500).json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Failed to load sessions.' } });
  }
});

// GET /api/sessions/:id — load all threads + messages for a session
sessionsRouter.get('/:id', async (req, res) => {
  try {
    const userId = req.verifiedUser!.sub;
    const sessionId = req.params.id;

    const session = await Session.findById(sessionId).lean();
    if (!session) {
      res.status(404).json({ data: null, error: { code: 'NOT_FOUND', message: 'Session not found.' } });
      return;
    }
    if (session.userId !== userId) {
      res.status(403).json({ data: null, error: { code: 'FORBIDDEN', message: 'Access denied.' } });
      return;
    }

    const threads = await Thread.find({ sessionId }).lean();
    const messages = await Message.find({ sessionId }).sort({ createdAt: 1 }).lean();

    // Reconstruct messageIds per thread (sorted by createdAt — already sorted by query)
    const messageIdsByThread: Record<string, string[]> = {};
    for (const m of messages) {
      const tid = m.threadId;
      if (!messageIdsByThread[tid]) messageIdsByThread[tid] = [];
      messageIdsByThread[tid]!.push(m._id);
    }

    // Shape threads to match Zustand Thread type
    const frontendThreads = threads.map((t) => ({
      id: t._id,
      depth: t.depth,
      parentThreadId: t.parentThreadId ?? null,
      anchorText: t.anchorText ?? null,
      parentMessageId: t.parentMessageId ?? null,
      title: t.title,
      accentColor: t.accentColor,
      childThreadIds: t.childThreadIds ?? [],
      scrollPosition: t.scrollPosition ?? 0,
      messageIds: messageIdsByThread[t._id] ?? [],
    }));

    // Shape messages to match Zustand Message type
    const frontendMessages = messages.map((m) => ({
      id: m._id,
      threadId: m.threadId,
      role: m.role as 'user' | 'assistant',
      content: m.content,
      annotations: Array.isArray(m.annotations) ? m.annotations : [],
      childLeads: Array.isArray(m.childLeads) ? m.childLeads : [],
      isStreaming: false,
      createdAt: m.createdAt.getTime(),
    }));

    res.json({
      data: {
        session: { id: session._id.toString(), createdAt: session.createdAt.getTime() },
        threads: frontendThreads,
        messages: frontendMessages,
      },
      error: null,
    });
  } catch (err) {
    console.error('[GET /api/sessions/:id]', err);
    res.status(500).json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Failed to load session.' } });
  }
});

// POST /api/sessions — create new session + root thread
sessionsRouter.post('/', async (req, res) => {
  try {
    const userId = req.verifiedUser!.sub;
    const { sessionId, rootThreadId, accentColor } = req.body as {
      sessionId: string;
      rootThreadId: string;
      accentColor?: string;
    };

    if (!sessionId || !rootThreadId) {
      res.status(400).json({ data: null, error: { code: 'BAD_REQUEST', message: 'sessionId and rootThreadId required.' } });
      return;
    }

    // Upsert user record
    const { User } = await import('../db/models/User.js');
    const tokenUser = req.verifiedUser!;
    await User.findOneAndUpdate(
      { googleSub: tokenUser.sub },
      { googleSub: tokenUser.sub, email: tokenUser.email, name: tokenUser.name },
      { upsert: true, returnDocument: 'after' }
    );

    const session = await Session.create({
      _id: sessionId,
      userId,
    } as never); // _id override

    await Thread.create({
      _id: rootThreadId,
      sessionId: session._id.toString(),
      userId,
      parentThreadId: null,
      depth: 0,
      anchorText: null,
      parentMessageId: null,
      title: 'Root',
      accentColor: accentColor ?? '#2D7DD2',
      childThreadIds: [],
      scrollPosition: 0,
    } as never);

    res.status(201).json({
      data: { sessionId: session._id.toString(), rootThreadId },
      error: null,
    });
  } catch (err) {
    console.error('[POST /api/sessions]', err);
    res.status(500).json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Failed to create session.' } });
  }
});

// ---- Thread mutation routes ------------------------------------------------

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

// ---- Message mutation routes -----------------------------------------------

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

    await Message.findByIdAndUpdate(req.params.id, { $set: patch });
    res.json({ data: { updated: true }, error: null });
  } catch (err) {
    console.error('[PATCH /api/messages/:id]', err);
    res.status(500).json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Failed to update message.' } });
  }
});
