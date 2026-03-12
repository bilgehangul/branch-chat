// backend/src/routes/chat.ts
// POST /api/chat — SSE streaming.
// Validates body, opens SSE headers, flushes, streams via aiProvider.streamChat().
// Aborts on client disconnect via req.on('close') + AbortController.
// After stream completes, saves user + AI messages to MongoDB (fire-and-forget).
import { Router } from 'express';
import { getDefaultProvider, createByokProvider } from '../config.js';
import { Message } from '../db/models/Message.js';
import { Session } from '../db/models/Session.js';

export const chatRouter = Router();

chatRouter.post('/', async (req, res) => {
  const { messages, systemPrompt, sessionId, threadId, userMsgId, aiMsgId, userText, byok } = req.body as {
    messages?: Array<{ role: string; content: string }>;
    systemPrompt?: string;
    sessionId?: string;
    threadId?: string;
    userMsgId?: string;
    aiMsgId?: string;
    userText?: string;
    byok?: { provider?: string; model?: string; apiKey?: string };
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

  // Resolve provider — BYOK or default
  const rawApiKey = byok?.apiKey;
  if (byok) delete (byok as Record<string, unknown>).apiKey; // scrub key before any logging
  const aiProvider = (rawApiKey && byok?.provider && byok?.model)
    ? createByokProvider(byok.provider as 'gemini' | 'openai', byok.model, rawApiKey)
    : getDefaultProvider();

  // Open SSE connection
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // CRITICAL: flush before async call so headers are sent immediately

  const controller = new AbortController();
  req.on('close', () => controller.abort());

  const writeEvent = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  // Accumulate full AI content for save-on-done
  let fullContent = '';
  const userId = req.verifiedUser!.sub;

  await aiProvider.streamChat(
    messages as Array<{ role: 'user' | 'model'; content: string }>,
    systemPrompt ?? '',
    (chunk: string) => {
      fullContent += chunk;
      writeEvent({ type: 'chunk', text: chunk });
    },
    () => {
      // onDone — write final SSE event, close stream, then save messages
      writeEvent({ type: 'done' });
      res.end();

      // Save user + AI messages to MongoDB after stream completes (fire-and-forget)
      const saveMessages = async () => {
        try {
          if (sessionId && threadId && userMsgId && aiMsgId && userText) {
            await Promise.all([
              Message.create({
                _id: userMsgId, threadId, sessionId, userId,
                role: 'user', content: userText, createdAt: new Date(),
                annotations: [], childLeads: [],
              } as never),
              Message.create({
                _id: aiMsgId, threadId, sessionId, userId,
                role: 'assistant', content: fullContent, createdAt: new Date(),
                annotations: [], childLeads: [],
              } as never),
              Session.findByIdAndUpdate(sessionId, { lastActivityAt: new Date() }),
            ]);
          }
        } catch (err) {
          console.error('[chat] Failed to save messages to MongoDB:', err);
          // Non-fatal — SSE already closed, user has their response
        }
      };
      void saveMessages();
    },
    (err: Error) => { writeEvent({ type: 'error', message: err.message }); res.end(); },
    controller.signal
  );
});
