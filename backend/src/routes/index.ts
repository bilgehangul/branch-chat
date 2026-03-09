// backend/src/routes/index.ts
// Authenticated API router — requireApiAuth applied to ALL routes here.
// Adding a new route to this file automatically inherits auth protection.
// Do NOT add routes directly to app in index.ts — that bypasses requireApiAuth.
import { Router } from 'express';
import { requireApiAuth } from '../middleware/auth.js';
import { chatRouter } from './chat.js';
import { simplifyRouter } from './simplify.js';
import { findSourcesRouter } from './find-sources.js';

export const apiRouter = Router();

// Auth guard on every route in this router
apiRouter.use(requireApiAuth);

apiRouter.use('/chat', chatRouter);
apiRouter.use('/simplify', simplifyRouter);
apiRouter.use('/find-sources', findSourcesRouter);
