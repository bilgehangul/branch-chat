// frontend/src/components/history/SessionHistory.tsx
// Lists the user's previous chat sessions as a folder-style tree.
// Active session shows child threads hierarchically nested beneath the root.
// Each entry has a 3-dot hover menu with inline rename and delete.
import { useState, useEffect, useRef, useCallback } from 'react';
import type { SessionListItem } from '../../api/sessions';
import type { Thread } from '../../types/index';
import { useSessionStore } from '../../store/sessionStore';

interface SessionHistoryProps {
  sessions: SessionListItem[];
  onLoadSession: (sessionId: string) => void;
  currentSessionId: string | null;
  threads?: Record<string, Thread>;
  onNavigateThread?: (threadId: string) => void;
  activeThreadId?: string | null;
  onRenameSession?: (sessionId: string, title: string) => void;
  onDeleteSession?: (sessionId: string) => void;
}

// ---------- 3-dot menu ----------

type MenuState =
  | { type: 'closed' }
  | { type: 'open'; id: string }
  | { type: 'confirm-delete'; id: string };

function useMenu() {
  const [menu, setMenu] = useState<MenuState>({ type: 'closed' });
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (menu.type === 'closed') return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenu({ type: 'closed' });
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menu.type]);

  return { menu, setMenu, menuRef };
}

function ThreeDotButton({ onClick }: { onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 px-1 py-0.5 rounded text-stone-400 dark:text-slate-500 hover:bg-stone-200 dark:hover:bg-zinc-700 hover:text-stone-600 dark:hover:text-slate-300 transition-all text-xs leading-none"
      title="Actions"
    >
      &#x2026;
    </button>
  );
}

function DropdownMenu({
  menuRef,
  menuState,
  onEdit,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
}: {
  menuRef: React.RefObject<HTMLDivElement | null>;
  menuState: MenuState;
  onEdit: () => void;
  onDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}) {
  if (menuState.type === 'confirm-delete') {
    return (
      <div
        ref={menuRef}
        className="absolute right-0 top-full mt-1 z-10 bg-white dark:bg-zinc-800 shadow-lg rounded border border-stone-200 dark:border-zinc-600 py-1 px-2 flex items-center gap-2 text-xs whitespace-nowrap"
      >
        <span className="text-red-600 dark:text-red-400 font-medium">Delete?</span>
        <button
          onClick={onConfirmDelete}
          className="px-2 py-0.5 rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
        >
          Yes
        </button>
        <button
          onClick={onCancelDelete}
          className="px-2 py-0.5 rounded bg-stone-200 dark:bg-zinc-600 hover:bg-stone-300 dark:hover:bg-zinc-500 transition-colors"
        >
          No
        </button>
      </div>
    );
  }

  if (menuState.type !== 'open') return null;

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full mt-1 z-10 bg-white dark:bg-zinc-800 shadow-lg rounded border border-stone-200 dark:border-zinc-600 py-1 min-w-[100px]"
    >
      <button
        onClick={onEdit}
        className="w-full text-left px-3 py-1 text-xs hover:bg-stone-100 dark:hover:bg-zinc-700 transition-colors"
      >
        Edit title
      </button>
      <button
        onClick={onDelete}
        className="w-full text-left px-3 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-stone-100 dark:hover:bg-zinc-700 transition-colors"
      >
        Delete
      </button>
    </div>
  );
}

// ---------- Inline edit ----------

function InlineEdit({
  initialTitle,
  onSave,
  onCancel,
}: {
  initialTitle: string;
  onSave: (title: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initialTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = value.trim();
      if (trimmed) onSave(trimmed);
      else onCancel();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => {
        const trimmed = value.trim();
        if (trimmed) onSave(trimmed);
        else onCancel();
      }}
      className="w-full px-1 py-0.5 text-xs rounded border border-blue-400 dark:border-blue-500 bg-white dark:bg-zinc-900 text-stone-900 dark:text-slate-100 outline-none"
    />
  );
}

// ---------- ThreadNode ----------

function ThreadNode({
  thread,
  threads,
  onNavigateThread,
  activeThreadId,
  editingId,
  setEditingId,
  menuId,
  menuState,
  setMenu,
  menuRef,
}: {
  thread: Thread;
  threads: Record<string, Thread>;
  onNavigateThread?: (threadId: string) => void;
  activeThreadId?: string | null;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  menuId: string | null;
  menuState: MenuState;
  setMenu: (m: MenuState) => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [expanded, setExpanded] = useState(true);
  const setThreadTitle = useSessionStore((s) => s.setThreadTitle);
  const deleteThread = useSessionStore((s) => s.deleteThread);

  const children = thread.childThreadIds
    .map((id) => threads[id])
    .filter(Boolean);

  const hasChildren = children.length > 0;
  const isActive = thread.id === activeThreadId;
  const isEditing = editingId === thread.id;
  const isMenuTarget = menuId === thread.id;

  return (
    <>
      <li
        className="group relative"
        style={{ paddingLeft: thread.depth * 16 }}
      >
        <div
          className={`flex items-center gap-0.5 pr-6 py-1 rounded text-xs transition-colors ${
            isActive
              ? 'font-semibold bg-stone-200/50 dark:bg-zinc-700/50'
              : 'text-stone-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-zinc-800'
          }`}
        >
          {/* Expand/collapse toggle */}
          {hasChildren ? (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-stone-400 dark:text-slate-500 hover:text-stone-600 dark:hover:text-slate-300"
              title={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded ? '\u25BC' : '\u25B6'}
            </button>
          ) : (
            <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-stone-300 dark:text-slate-600">
              &#x2013;
            </span>
          )}

          {/* Title or inline edit */}
          {isEditing ? (
            <InlineEdit
              initialTitle={thread.title}
              onSave={(title) => {
                setThreadTitle(thread.id, title);
                setEditingId(null);
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <button
              onClick={() => onNavigateThread?.(thread.id)}
              className="truncate text-left flex-1 min-w-0"
              title={thread.title}
            >
              {thread.title}
            </button>
          )}

          {/* 3-dot menu trigger */}
          {!isEditing && (
            <ThreeDotButton
              onClick={(e) => {
                e.stopPropagation();
                setMenu(
                  isMenuTarget && menuState.type !== 'closed'
                    ? { type: 'closed' }
                    : { type: 'open', id: thread.id }
                );
              }}
            />
          )}
        </div>

        {/* Dropdown */}
        {isMenuTarget && menuState.type !== 'closed' && (
          <DropdownMenu
            menuRef={menuRef}
            menuState={menuState}
            onEdit={() => {
              setEditingId(thread.id);
              setMenu({ type: 'closed' });
            }}
            onDelete={() => setMenu({ type: 'confirm-delete', id: thread.id })}
            onConfirmDelete={() => {
              deleteThread(thread.id);
              setMenu({ type: 'closed' });
            }}
            onCancelDelete={() => setMenu({ type: 'closed' })}
          />
        )}
      </li>
      {expanded &&
        children.map((child) => (
          <ThreadNode
            key={child.id}
            thread={child}
            threads={threads}
            onNavigateThread={onNavigateThread}
            activeThreadId={activeThreadId}
            editingId={editingId}
            setEditingId={setEditingId}
            menuId={menuId}
            menuState={menuState}
            setMenu={setMenu}
            menuRef={menuRef}
          />
        ))}
    </>
  );
}

// ---------- SessionHistory ----------

export function SessionHistory({
  sessions,
  onLoadSession,
  currentSessionId,
  threads,
  onNavigateThread,
  activeThreadId,
  onRenameSession,
  onDeleteSession,
}: SessionHistoryProps) {
  const { menu, setMenu, menuRef } = useMenu();
  const [editingId, setEditingId] = useState<string | null>(null);

  const menuId = menu.type !== 'closed' ? menu.id : null;

  // Close menu when editingId changes
  const handleSetEditingId = useCallback(
    (id: string | null) => {
      setEditingId(id);
      if (id) setMenu({ type: 'closed' });
    },
    [setMenu]
  );

  if (sessions.length === 0) {
    return (
      <div className="text-sm text-stone-500 dark:text-slate-500 px-3 py-2">
        No previous sessions
      </div>
    );
  }

  // Build hierarchical tree: find root threads (depth === 0) for active session
  const rootThreads: Thread[] = [];
  if (threads) {
    for (const t of Object.values(threads)) {
      if (t.depth === 0) {
        rootThreads.push(t);
      }
    }
  }

  // For the active session, get the live title from the Zustand root thread
  const liveRootThread = rootThreads.length > 0 ? rootThreads[0] : null;
  const liveTitle =
    liveRootThread &&
    liveRootThread.title &&
    liveRootThread.title !== 'New chat'
      ? liveRootThread.title
      : null;

  // Check if child threads exist for the active session
  const childThreadsExist =
    threads && Object.values(threads).some((t) => t.depth > 0);

  return (
    <nav aria-label="Session history">
      <ul className="space-y-1 px-2">
        {sessions.map((session) => {
          const isActive = session.id === currentSessionId;
          const date = new Date(session.lastActivityAt).toLocaleDateString();
          const displayTitle =
            isActive && liveTitle ? liveTitle : session.title;
          const isEditingSession = editingId === session.id;
          const isMenuSession = menuId === session.id;

          return (
            <li key={session.id} className="group relative">
              {isEditingSession ? (
                <div className="px-3 py-2">
                  <InlineEdit
                    initialTitle={displayTitle}
                    onSave={(title) => {
                      onRenameSession?.(session.id, title);
                      setEditingId(null);
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              ) : (
                <button
                  onClick={() => onLoadSession(session.id)}
                  className={[
                    'w-full text-left px-3 py-2 pr-6 rounded text-sm truncate transition-colors',
                    isActive
                      ? 'bg-stone-200 dark:bg-zinc-700 font-medium'
                      : 'hover:bg-stone-100 dark:hover:bg-zinc-800',
                  ].join(' ')}
                  title={displayTitle}
                >
                  <div className="truncate">{displayTitle}</div>
                  <div className="text-xs text-stone-400 dark:text-slate-500">
                    {date}
                  </div>
                </button>
              )}

              {/* 3-dot menu for sessions */}
              {!isEditingSession && (onRenameSession || onDeleteSession) && (
                <ThreeDotButton
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenu(
                      isMenuSession && menu.type !== 'closed'
                        ? { type: 'closed' }
                        : { type: 'open', id: session.id }
                    );
                  }}
                />
              )}

              {isMenuSession && menu.type !== 'closed' && (
                <DropdownMenu
                  menuRef={menuRef}
                  menuState={menu}
                  onEdit={() => {
                    handleSetEditingId(session.id);
                  }}
                  onDelete={() =>
                    setMenu({ type: 'confirm-delete', id: session.id })
                  }
                  onConfirmDelete={() => {
                    onDeleteSession?.(session.id);
                    setMenu({ type: 'closed' });
                  }}
                  onCancelDelete={() => setMenu({ type: 'closed' })}
                />
              )}

              {/* Show child threads hierarchically for active session */}
              {isActive && childThreadsExist && threads && (
                <ul className="ml-2 mt-1 space-y-0.5">
                  {rootThreads.map((root) =>
                    root.childThreadIds
                      .map((id) => threads[id])
                      .filter(Boolean)
                      .map((child) => (
                        <ThreadNode
                          key={child.id}
                          thread={child}
                          threads={threads}
                          onNavigateThread={onNavigateThread}
                          activeThreadId={activeThreadId}
                          editingId={editingId}
                          setEditingId={handleSetEditingId}
                          menuId={menuId}
                          menuState={menu}
                          setMenu={setMenu}
                          menuRef={menuRef}
                        />
                      ))
                  )}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
