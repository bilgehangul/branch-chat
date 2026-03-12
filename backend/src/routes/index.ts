// backend/src/routes/index.ts
// Authenticated API router — requireApiAuth applied to ALL routes here.
// Adding a new route to this file automatically inherits auth protection.
// Do NOT add routes directly to app in index.ts — that bypasses requireApiAuth.
import { Router } from 'express';
import { requireApiAuth } from '../middleware/auth.js';
import { configRouter } from './config.js';
import { chatRouter } from './chat.js';
import { simplifyRouter } from './simplify.js';
import { findSourcesRouter } from './find-sources.js';
import { sessionsRouter, threadsRouter, messagesRouter } from './sessions.js';

export const apiRouter = Router();

// Public routes (no auth required)
apiRouter.use('/config', configRouter);

// Auth guard on remaining routes
apiRouter.use(requireApiAuth);

apiRouter.use('/chat', chatRouter);
apiRouter.use('/simplify', simplifyRouter);
apiRouter.use('/find-sources', findSourcesRouter);
apiRouter.use('/sessions', sessionsRouter);
apiRouter.use('/threads', threadsRouter);
apiRouter.use('/messages', messagesRouter);
