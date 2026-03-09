// backend/src/routes/chat.ts
// POST /api/chat — SSE streaming.
// Validates body, opens SSE headers, flushes, streams via aiProvider.streamChat().
// Aborts on client disconnect via req.on('close') + AbortController.
import { Router } from 'express';
import { aiProvider } from '../config.js';

export const chatRouter = Router();

chatRouter.post('/', async (req, res) => {
  const { messages, systemPrompt } = req.body as {
    messages?: Array<{ role: string; content: string }>;
    systemPrompt?: string;
  };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({
      data: null,
      error: { code: 'BAD_REQUEST', message: 'messages array is required and must not be empty' },
    });
    return;
  }

  // Validate message shapes
  const validMessages = messages.every(
    m => (m.role === 'user' || m.role === 'model') && typeof m.content === 'string'
  );
  if (!validMessages) {
    res.status(400).json({
      data: null,
      error: { code: 'BAD_REQUEST', message: 'Each message must have role ("user"|"model") and content (string)' },
    });
    return;
  }

  // Open SSE connection
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // CRITICAL: flush before async call so headers are sent immediately

  const controller = new AbortController();
  req.on('close', () => controller.abort());

  const writeEvent = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  await aiProvider.streamChat(
    messages as Array<{ role: 'user' | 'model'; content: string }>,
    systemPrompt ?? '',
    (chunk) => writeEvent({ type: 'chunk', text: chunk }),
    () => { writeEvent({ type: 'done' }); res.end(); },
    (err) => { writeEvent({ type: 'error', message: err.message }); res.end(); },
    controller.signal
  );
});
