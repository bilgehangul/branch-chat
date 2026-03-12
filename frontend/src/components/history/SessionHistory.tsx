// frontend/src/components/history/SessionHistory.tsx
// Lists the user's previous chat sessions as a folder-style tree.
// Active session shows child threads hierarchically nested beneath the root.
// Each entry has a 3-dot hover menu with inline rename and delete.
import { useState, useEffect, useRef, useCallback } from 'react';
import type { SessionListItem } from '../../api/sessions';
import type { Thread } from '../../types/index';
import { useSessionStore } from '../../store/sessionStore';
import { formatRelativeDate } from '../../utils/formatRelativeDate';

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

function ThreeDotButton({
  onClick,
  hoverReveal = false,
}: {
  onClick: (e: React.MouseEvent) => void;
  hoverReveal?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'absolute right-1 top-1/2 -translate-y-1/2 px-1.5 py-1 rounded text-stone-500 dark:text-slate-400 hover:bg-stone-200 dark:hover:bg-zinc-700 hover:text-stone-600 dark:hover:text-slate-300 transition-all text-sm leading-none',
        hoverReveal ? 'opacity-0 group-hover:opacity-100 transition-opacity' : '',
      ].join(' ')}
      title="Actions"
    >
      &#x22EE;
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

// ---------- Delete modal ----------

function DeleteModal({
  open,
  onConfirm,
  onCancel,
  message = 'This will delete the thread and all child branches.',
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  message?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" data-testid="delete-modal">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
        data-testid="delete-modal-backdrop"
      />
      {/* Dialog */}
      <div className="relative bg-white dark:bg-zinc-800 rounded-lg shadow-xl p-6 max-w-sm mx-4">
        <h3 className="text-sm font-semibold text-stone-900 dark:text-slate-100">
          Delete this thread?
        </h3>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          {message}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs rounded bg-stone-200 dark:bg-zinc-600 text-stone-700 dark:text-slate-200 hover:bg-stone-300 dark:hover:bg-zinc-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 text-xs rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
            data-testid="delete-confirm-btn"
          >
            Delete
          </button>
        </div>
      </div>
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
  onRequestDelete,
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
  onRequestDelete: (threadId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const setThreadTitle = useSessionStore((s) => s.setThreadTitle);

  const children = thread.childThreadIds
    .map((id) => threads[id])
    .filter(Boolean);

  const hasChildren = children.length > 0;
  const isActive = thread.id === activeThreadId;
  const isEditing = editingId === thread.id;
  const isMenuTarget = menuId === thread.id;

  // Connecting line position: left offset for vertical/horizontal lines
  const lineLeft = thread.depth > 0 ? (thread.depth - 1) * 16 + 7 : 0;

  return (
    <>
      <li
        className="group relative"
        style={{ paddingLeft: thread.depth * 16 }}
      >
        {/* VS Code-style connecting lines for nested threads */}
        {thread.depth > 0 && (
          <>
            {/* Vertical line from parent */}
            <span
              className="absolute top-0 bottom-0 border-l border-zinc-700 dark:border-zinc-700 border-stone-300"
              style={{ left: lineLeft }}
              aria-hidden="true"
            />
            {/* Horizontal stub to node content */}
            <span
              className="absolute border-t border-zinc-700 dark:border-zinc-700 border-stone-300"
              style={{ left: lineLeft, top: '50%', width: 8 }}
              aria-hidden="true"
            />
          </>
        )}

        <div
          className={[
            'flex items-center gap-1 pr-6 py-1 rounded text-xs transition-colors',
            isActive
              ? 'font-semibold bg-stone-100 dark:bg-zinc-800/50 border-l-2'
              : 'text-stone-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-zinc-800',
          ].join(' ')}
          style={isActive ? { borderLeftColor: thread.accentColor } : undefined}
          data-testid={isActive ? 'active-thread-row' : undefined}
        >
          {/* SVG Chevron expand/collapse toggle */}
          {hasChildren ? (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-stone-400 dark:text-slate-500 hover:text-stone-600 dark:hover:text-slate-300"
              title={expanded ? 'Collapse' : 'Expand'}
            >
              <svg
                className={`w-3 h-3 transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`}
                viewBox="0 0 16 16"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M6 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : (
            <span className="flex-shrink-0 w-4 h-4" />
          )}

          {/* Accent-color pip */}
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: thread.accentColor }}
            data-testid="accent-pip"
            aria-hidden="true"
          />

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

          {/* 3-dot menu trigger with hover reveal */}
          {!isEditing && (
            <ThreeDotButton
              hoverReveal
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
            onDelete={() => {
              onRequestDelete(thread.id);
              setMenu({ type: 'closed' });
            }}
            onConfirmDelete={() => setMenu({ type: 'closed' })}
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
            onRequestDelete={onRequestDelete}
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
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const deleteThread = useSessionStore((s) => s.deleteThread);

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
    liveRootThread.title !== 'New chat' &&
    liveRootThread.title.toLowerCase() !== 'root'
      ? liveRootThread.title
      : null;

  // Get root thread accent color for active session indicator
  const rootAccentColor = liveRootThread?.accentColor;

  // Check if child threads exist for the active session
  const childThreadsExist =
    threads && Object.values(threads).some((t) => t.depth > 0);

  return (
    <nav aria-label="Session history">
      <ul className="space-y-0.5 px-2 py-1">
        {sessions.map((session) => {
          const isActive = session.id === currentSessionId;
          const relativeDate = formatRelativeDate(session.lastActivityAt);
          const displayTitle =
            isActive && liveTitle ? liveTitle : session.title;
          const isEditingSession = editingId === session.id;
          const isMenuSession = menuId === session.id;

          return (
            <li key={session.id} className="group relative">
              {isEditingSession ? (
                <div className="px-3 py-3">
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
                    'w-full text-left px-3 py-3 pr-6 rounded-md text-sm transition-all',
                    isActive
                      ? 'bg-stone-100/80 dark:bg-zinc-800/60 font-medium border-l-2'
                      : 'hover:bg-stone-100/50 dark:hover:bg-zinc-800/40 hover:border-l-2 border-l-2 border-l-transparent',
                  ].join(' ')}
                  style={
                    isActive && rootAccentColor
                      ? { borderLeftColor: rootAccentColor }
                      : undefined
                  }
                  onMouseEnter={(e) => {
                    if (!isActive && rootAccentColor) {
                      (e.currentTarget as HTMLElement).style.borderLeftColor = rootAccentColor;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.borderLeftColor = 'transparent';
                    }
                  }}
                  title={displayTitle}
                >
                  <div className="truncate">{displayTitle}</div>
                  <div className="text-xs text-stone-400 dark:text-slate-500 mt-0.5">
                    {relativeDate}
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
                          onRequestDelete={setDeleteTarget}
                        />
                      ))
                  )}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      {/* Modal delete confirmation for threads */}
      <DeleteModal
        open={deleteTarget !== null}
        onConfirm={() => {
          if (deleteTarget) {
            deleteThread(deleteTarget);
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </nav>
  );
}
