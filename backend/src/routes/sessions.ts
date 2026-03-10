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
      { upsert: true, new: true }
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
