import { create } from 'zustand';
import type {
  Session,
  Thread,
  Message,
  Annotation,
  ChildLead,
  CreateThreadParams,
} from '../types/index';
import { summarizeMessages } from '../api/simplify';

interface SessionState {
  session: Session | null;
  threads: Record<string, Thread>;
  messages: Record<string, Message>; // FLAT at store root — NOT inside Thread
  activeThreadId: string | null;

  createSession: (userId: string) => void;
  clearSession: () => void;
  createThread: (params: CreateThreadParams) => string; // returns new thread id
  setActiveThread: (threadId: string) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, patch: Partial<Message>) => void;
  setMessageStreaming: (id: string, isStreaming: boolean) => void;
  addChildLead: (messageId: string, lead: ChildLead) => void;
  addAnnotation: (messageId: string, annotation: Annotation) => void;
  updateAnnotation: (messageId: string, annotationId: string, patch: Partial<Annotation>) => void;
  setScrollPosition: (threadId: string, position: number) => void;
  setThreadTitle: (threadId: string, title: string) => void;
  deleteThread: (threadId: string) => void;
  summarizeThread: (threadId: string, getToken: () => Promise<string | null>) => Promise<void>;
  compactThread: (threadId: string, getToken: () => Promise<string | null>) => Promise<void>;
  hydrateSession: (data: {
    session: { id: string; createdAt: number };
    threads: Record<string, Thread>;
    messages: Record<string, Message>;
    activeThreadId: string | null;
  }) => void;
}

export const useSessionStore = create<SessionState>()((set, get) => ({
  session: null,
  threads: {},
  messages: {},
  activeThreadId: null,

  createSession: (userId: string) => {
    const sessionId = crypto.randomUUID();
    const rootThreadId = crypto.randomUUID();
    const session: Session = {
      id: sessionId,
      userId,
      createdAt: Date.now(),
    };
    const rootThread: Thread = {
      id: rootThreadId,
      depth: 0,
      parentThreadId: null,
      anchorText: null,
      parentMessageId: null,
      title: 'Root',
      accentColor: '#2D7DD2',
      messageIds: [],
      childThreadIds: [],
      scrollPosition: 0,
    };
    set({
      session,
      threads: { [rootThreadId]: rootThread },
      activeThreadId: rootThreadId,
      messages: {},
    });
  },

  clearSession: () => {
    set({ session: null, threads: {}, messages: {}, activeThreadId: null });
  },

  createThread: (params: CreateThreadParams) => {
    const newId = crypto.randomUUID();
    const { threads } = get();
    const parentDepth =
      params.parentThreadId != null
        ? (threads[params.parentThreadId]?.depth ?? -1)
        : -1;
    const depth = Math.min(parentDepth + 1, 4) as 0 | 1 | 2 | 3 | 4;

    const newThread: Thread = {
      id: newId,
      depth,
      parentThreadId: params.parentThreadId,
      anchorText: params.anchorText,
      parentMessageId: params.parentMessageId,
      title: params.title,
      accentColor: params.accentColor,
      messageIds: [],
      childThreadIds: [],
      scrollPosition: 0,
    };

    set((state) => {
      const updatedThreads: Record<string, Thread> = {
        ...state.threads,
        [newId]: newThread,
      };
      if (params.parentThreadId != null && state.threads[params.parentThreadId]) {
        const parent = state.threads[params.parentThreadId]!;
        updatedThreads[params.parentThreadId] = {
          ...parent,
          childThreadIds: [...parent.childThreadIds, newId],
        };
      }
      return { threads: updatedThreads };
    });

    return newId;
  },

  setActiveThread: (threadId: string) => {
    set({ activeThreadId: threadId });
  },

  addMessage: (message: Message) => {
    set((state) => ({
      messages: { ...state.messages, [message.id]: message },
      threads: {
        ...state.threads,
        [message.threadId]: {
          ...state.threads[message.threadId]!,
          messageIds: [...(state.threads[message.threadId]?.messageIds ?? []), message.id],
        },
      },
    }));
  },

  updateMessage: (id: string, patch: Partial<Message>) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [id]: { ...state.messages[id]!, ...patch },
      },
    }));
  },

  setMessageStreaming: (id: string, isStreaming: boolean) => {
    get().updateMessage(id, { isStreaming });
  },

  addChildLead: (messageId: string, lead: ChildLead) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [messageId]: {
          ...state.messages[messageId]!,
          childLeads: [...(state.messages[messageId]?.childLeads ?? []), lead],
        },
      },
    }));
  },

  addAnnotation: (messageId: string, annotation: Annotation) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [messageId]: {
          ...state.messages[messageId]!,
          annotations: [...(state.messages[messageId]?.annotations ?? []), annotation],
        },
      },
    }));
  },

  updateAnnotation: (messageId: string, annotationId: string, patch: Partial<Annotation>) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [messageId]: {
          ...state.messages[messageId]!,
          annotations: state.messages[messageId]!.annotations.map(a =>
            a.id === annotationId ? { ...a, ...patch } : a
          ),
        },
      },
    }));
  },

  setScrollPosition: (threadId: string, position: number) => {
    set((state) => ({
      threads: {
        ...state.threads,
        [threadId]: {
          ...state.threads[threadId]!,
          scrollPosition: position,
        },
      },
    }));
  },

  setThreadTitle: (threadId: string, title: string) => {
    set((state) => ({
      threads: {
        ...state.threads,
        [threadId]: { ...state.threads[threadId]!, title },
      },
    }));
  },

  deleteThread: (threadId: string) => {
    set((state) => {
      // Collect threadId + all descendant IDs
      function collectIds(id: string): string[] {
        const t = state.threads[id];
        if (!t) return [];
        return [id, ...t.childThreadIds.flatMap(collectIds)];
      }
      const toDelete = new Set(collectIds(threadId));

      // Rebuild threads without deleted ones, and remove deleted childThreadIds from parents
      const newThreads: Record<string, Thread> = {};
      for (const [id, t] of Object.entries(state.threads)) {
        if (toDelete.has(id)) continue;
        newThreads[id] = {
          ...t,
          childThreadIds: t.childThreadIds.filter(c => !toDelete.has(c)),
        };
      }

      // Rebuild messages: remove messages from deleted threads, remove childLeads pointing to deleted threads
      const newMessages: Record<string, Message> = {};
      for (const [id, m] of Object.entries(state.messages)) {
        if (toDelete.has(m.threadId)) continue;
        newMessages[id] = {
          ...m,
          childLeads: m.childLeads.filter(cl => !toDelete.has(cl.threadId)),
        };
      }

      // If the active thread was deleted, fall back to parent thread or first available
      const deletedThread = state.threads[threadId];
      let newActiveThreadId = state.activeThreadId;
      if (newActiveThreadId && toDelete.has(newActiveThreadId)) {
        newActiveThreadId =
          (deletedThread?.parentThreadId && newThreads[deletedThread.parentThreadId]
            ? deletedThread.parentThreadId
            : null) ?? Object.keys(newThreads)[0] ?? null;
      }

      return { threads: newThreads, messages: newMessages, activeThreadId: newActiveThreadId };
    });
  },

  summarizeThread: async (threadId: string, getToken: () => Promise<string | null>) => {
    const thread = get().threads[threadId];
    if (!thread) return;

    // Recursively collect messages from thread + all descendant threads
    function collectAllMessages(tid: string): Message[] {
      const t = get().threads[tid];
      if (!t) return [];
      const directMsgs = t.messageIds.map(id => get().messages[id]).filter(Boolean) as Message[];
      const childMsgs = t.childThreadIds.flatMap(childId => collectAllMessages(childId));
      return [...directMsgs, ...childMsgs];
    }

    // Build combined text that includes thread structure
    function buildCombinedText(tid: string, indent = 0): string {
      const t = get().threads[tid];
      if (!t) return '';
      const prefix = '  '.repeat(indent);
      const header = indent === 0 ? `Thread: ${t.title}\n` : `${prefix}Child thread: ${t.title}\n`;
      const msgs = t.messageIds
        .map(id => get().messages[id])
        .filter(Boolean) as Message[];
      const msgText = msgs.map(m => {
        const role = m.role === 'user' ? 'User' : 'AI';
        return `${prefix}[${role}]: ${m.content}`;
      }).join('\n');
      const childText = t.childThreadIds.map(cid => buildCombinedText(cid, indent + 1)).join('\n');
      return [header, msgText, childText].filter(Boolean).join('\n');
    }

    const allMsgs = collectAllMessages(threadId);
    if (allMsgs.length === 0) return;

    const combinedText = buildCombinedText(threadId);

    try {
      const response = await summarizeMessages({ text: combinedText }, getToken);
      if (response.error || !response.data) {
        console.error('[summarizeThread] API error:', response.error);
        return;
      }

      // Create a NEW child thread under the target thread with the summary
      const summaryThreadId = get().createThread({
        parentThreadId: threadId,
        anchorText: null,
        parentMessageId: null,
        title: 'Summary',
        accentColor: thread.accentColor,
      });

      const summaryMsgId = crypto.randomUUID();
      const summaryMessage: Message = {
        id: summaryMsgId,
        role: 'assistant',
        content: response.data.rewritten,
        threadId: summaryThreadId,
        isStreaming: false,
        childLeads: [],
        annotations: [],
        createdAt: Date.now(),
      };

      // Add the summary message to the new child thread
      get().addMessage(summaryMessage);
    } catch (err) {
      console.error('[summarizeThread] failed:', err);
    }
  },

  compactThread: async (threadId: string, getToken: () => Promise<string | null>) => {
    const thread = get().threads[threadId];
    if (!thread) return;

    // Collect all descendant thread IDs (not including threadId itself)
    function collectDescendantIds(tid: string): string[] {
      const t = get().threads[tid];
      if (!t) return [];
      return t.childThreadIds.flatMap(cid => [cid, ...collectDescendantIds(cid)]);
    }

    // Recursively build combined text from thread + all descendants
    function buildCombinedText(tid: string, indent = 0): string {
      const t = get().threads[tid];
      if (!t) return '';
      const prefix = '  '.repeat(indent);
      const header = indent === 0 ? `Thread: ${t.title}\n` : `${prefix}Child thread: ${t.title}\n`;
      const msgs = t.messageIds
        .map(id => get().messages[id])
        .filter(Boolean) as Message[];
      const msgText = msgs.map(m => {
        const role = m.role === 'user' ? 'User' : 'AI';
        return `${prefix}[${role}]: ${m.content}`;
      }).join('\n');
      const childText = t.childThreadIds.map(cid => buildCombinedText(cid, indent + 1)).join('\n');
      return [header, msgText, childText].filter(Boolean).join('\n');
    }

    const combinedText = buildCombinedText(threadId);
    if (!combinedText.trim()) return;

    const descendantIds = collectDescendantIds(threadId);

    try {
      const response = await summarizeMessages({ text: combinedText }, getToken);
      if (response.error || !response.data) {
        console.error('[compactThread] API error:', response.error);
        return;
      }

      const summaryId = crypto.randomUUID();
      const summaryMessage: Message = {
        id: summaryId,
        role: 'assistant',
        content: response.data.rewritten,
        threadId,
        isStreaming: false,
        childLeads: [],
        annotations: [],
        createdAt: Date.now(),
      };

      const toRemove = new Set(descendantIds);

      set(state => {
        // Remove all descendant threads from the threads map
        const newThreads: Record<string, Thread> = {};
        for (const [id, t] of Object.entries(state.threads)) {
          if (toRemove.has(id)) continue;
          newThreads[id] = {
            ...t,
            childThreadIds: t.childThreadIds.filter(c => !toRemove.has(c)),
          };
        }

        // Replace target thread's messages with a single summary; clear child threads
        newThreads[threadId] = {
          ...newThreads[threadId]!,
          messageIds: [summaryId],
          childThreadIds: [],
        };

        // Remove messages from deleted threads and the original thread's messages
        const removedMsgIds = new Set<string>();
        for (const [, msg] of Object.entries(state.messages)) {
          if (toRemove.has(msg.threadId) || msg.threadId === threadId) {
            removedMsgIds.add(msg.id);
          }
        }

        const newMessages: Record<string, Message> = { [summaryId]: summaryMessage };
        for (const [id, msg] of Object.entries(state.messages)) {
          if (removedMsgIds.has(id)) continue;
          // Remove childLeads that pointed to deleted threads
          newMessages[id] = {
            ...msg,
            childLeads: msg.childLeads.filter(cl => !toRemove.has(cl.threadId)),
          };
        }

        return { threads: newThreads, messages: newMessages };
      });
    } catch (err) {
      console.error('[compactThread] failed:', err);
    }
  },
  hydrateSession: ({ session, threads, messages, activeThreadId }) => {
    set({
      session: {
        id: session.id,
        userId: '', // hydrated sessions belong to the current user; userId set by auth context
        createdAt: session.createdAt,
      },
      threads,
      messages,
      activeThreadId,
    });
  },
}));

export const initialState = useSessionStore.getState();
