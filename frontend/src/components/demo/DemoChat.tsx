/**
 * DemoChat — rich static showcase for unauthenticated visitors.
 *
 * Renders a fully visual replica of the authenticated experience using static
 * fake data from demoData.ts.  No Zustand store, no API calls, no auth hooks.
 *
 * Every interactive element calls onSignInClick instead of performing the
 * real action.
 */
import type { Message } from '../../types/index';
import { MarkdownRenderer } from '../thread/MarkdownRenderer';
import { ContextCard } from '../thread/ContextCard';
import {
  DEMO_THREADS,
  DEMO_MESSAGES,
  DEMO_ROOT_THREAD_ID,
  DEMO_CHILD_THREAD_ID,
} from './demoData';

interface DemoChatProps {
  onSignInClick: () => void;
}

// ---------------------------------------------------------------------------
// DemoMessageBlock — visual parity with MessageBlock, but no store dependency
// ---------------------------------------------------------------------------
function DemoMessageBlock({
  message,
  underlineMap,
  onSignInClick,
}: {
  message: Message;
  underlineMap: Record<number, string>;
  onSignInClick: () => void;
}) {
  const isUser = message.role === 'user';

  return (
    <div className="mb-6 max-w-[720px] mx-auto" data-message-id={message.id}>
      <p className={`text-xs mb-1 font-medium text-slate-500 ${isUser ? 'text-right' : 'text-left'}`}>
        {isUser ? 'You' : 'Gemini'}
      </p>
      <div className={isUser ? 'flex justify-end' : 'flex justify-start'}>
        <div
          className={
            isUser
              ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 ml-auto max-w-[75%]'
              : 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-zinc-700 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3 mr-auto max-w-[85%] overflow-hidden'
          }
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <MarkdownRenderer
              content={message.content}
              underlineMap={underlineMap}
              annotations={message.annotations}
              pendingAnnotation={null}
              errorAnnotation={null}
              messageId={message.id}
              onTryAnother={() => onSignInClick()}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main DemoChat component
// ---------------------------------------------------------------------------
export function DemoChat({ onSignInClick }: DemoChatProps) {
  const rootThread = DEMO_THREADS[DEMO_ROOT_THREAD_ID]!;
  const childThread = DEMO_THREADS[DEMO_CHILD_THREAD_ID]!;

  const rootMessages = rootThread.messageIds
    .map(id => DEMO_MESSAGES[id])
    .filter((m): m is Message => m !== undefined);

  const childMessages = childThread.messageIds
    .map(id => DEMO_MESSAGES[id])
    .filter((m): m is Message => m !== undefined);

  return (
    <div className="flex h-screen bg-zinc-900 text-slate-100 overflow-hidden">

      {/* ------------------------------------------------------------------ */}
      {/* Ancestor peek panel — visible sm+, shows root thread messages       */}
      {/* ------------------------------------------------------------------ */}
      <aside
        className="hidden sm:flex flex-col w-[110px] shrink-0 border-r border-zinc-800 bg-zinc-900 overflow-hidden"
        aria-label="Parent thread peek"
      >
        {/* Peek panel header */}
        <div
          className="h-12 flex items-center justify-center border-b border-zinc-800 px-2"
          style={{ borderLeftColor: rootThread.accentColor, borderLeftWidth: 3 }}
        >
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide truncate">
            {rootThread.title}
          </span>
        </div>

        {/* Root thread message snippets */}
        <div className="flex-1 overflow-hidden py-2 space-y-1 px-1">
          {rootMessages.map(msg => {
            const isParentMsg = msg.id === childThread.parentMessageId;
            return (
              <button
                key={msg.id}
                onClick={onSignInClick}
                className={`w-full text-left px-2 py-1.5 rounded text-[10px] leading-tight transition-colors ${
                  isParentMsg
                    ? 'bg-zinc-700 text-zinc-200'
                    : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-400'
                }`}
                style={
                  isParentMsg
                    ? { borderLeft: `2px solid ${rootThread.accentColor}` }
                    : undefined
                }
              >
                <span className="block mb-0.5 font-medium" style={{ color: msg.role === 'user' ? '#60a5fa' : rootThread.accentColor }}>
                  {msg.role === 'user' ? 'You' : 'AI'}
                </span>
                <span className="line-clamp-3 break-words">{msg.content.slice(0, 80)}…</span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ------------------------------------------------------------------ */}
      {/* Main content area                                                   */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Header / breadcrumb bar */}
        <header className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0">
          <nav className="flex items-center gap-1 text-sm" aria-label="Thread navigation">
            {/* Parent crumb — clickable → sign in */}
            <button
              onClick={onSignInClick}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              {rootThread.title}
            </button>
            {/* Chevron separator */}
            <span className="text-zinc-600 select-none">›</span>
            {/* Current crumb — non-clickable */}
            <span className="text-zinc-300 font-medium truncate max-w-[200px]">
              {childThread.title}
            </span>
          </nav>

          <div className="flex items-center gap-2">
            {/* Theme toggle placeholder */}
            <button
              onClick={onSignInClick}
              className="w-8 h-8 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              aria-label="Toggle theme"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            </button>
            {/* Sign in button */}
            <button
              onClick={onSignInClick}
              className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors font-medium"
            >
              Sign in
            </button>
          </div>
        </header>

        {/* ---------------------------------------------------------------- */}
        {/* Message area with relative positioning for gutter + action bubble */}
        {/* ---------------------------------------------------------------- */}
        <main className="flex-1 overflow-y-auto">
          <div className="relative flex gap-0">

            {/* Message column */}
            <div className="flex-1 min-w-0 px-4 py-6">

              {/* ---------------------------------------------------------- */}
              {/* Root thread excerpt: msg-1 (user) + msg-2 (AI)             */}
              {/* msg-2 shows: code block, citation block, simplification,   */}
              {/* and the underlined childLead paragraph                     */}
              {/* ---------------------------------------------------------- */}
              <div className="mb-2">
                <p className="text-[10px] text-zinc-600 uppercase tracking-wide font-semibold mb-3 max-w-[720px] mx-auto">
                  Root thread ·{' '}
                  <button
                    onClick={onSignInClick}
                    className="text-blue-500 hover:underline"
                  >
                    Back to root
                  </button>
                </p>
              </div>

              {/* msg-1: user question */}
              {DEMO_MESSAGES['msg-1'] && (
                <DemoMessageBlock
                  key="msg-1"
                  message={DEMO_MESSAGES['msg-1']}
                  underlineMap={{}}
                  onSignInClick={onSignInClick}
                />
              )}

              {/* msg-2: AI response with code block + annotations + childLead underline */}
              {DEMO_MESSAGES['msg-2'] && (
                <DemoMessageBlock
                  key="msg-2"
                  message={DEMO_MESSAGES['msg-2']}
                  underlineMap={{ 1: childThread.accentColor }}
                  onSignInClick={onSignInClick}
                />
              )}

              {/* Divider to show thread branch */}
              <div className="max-w-[720px] mx-auto mb-6 flex items-center gap-3">
                <div className="flex-1 h-px bg-zinc-700" />
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${childThread.accentColor}22`,
                    color: childThread.accentColor,
                  }}
                >
                  ↗ Branched into child thread
                </span>
                <div className="flex-1 h-px bg-zinc-700" />
              </div>

              {/* Context card — child thread is the active view */}
              <ContextCard thread={childThread} />

              {/* Child thread messages */}
              {childMessages.map(msg => (
                <DemoMessageBlock
                  key={msg.id}
                  message={msg}
                  underlineMap={{}}
                  onSignInClick={onSignInClick}
                />
              ))}

              {/* ---------------------------------------------------------- */}
              {/* Static Action Bubble (always visible for demo purposes)     */}
              {/* ---------------------------------------------------------- */}
              <div className="max-w-[720px] mx-auto mb-6">
                <div className="flex justify-end">
                  <div className="bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-600 rounded-xl shadow-lg p-2 flex items-center gap-1">
                    <button
                      onClick={onSignInClick}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors whitespace-nowrap"
                    >
                      <span>→</span> Go Deeper
                    </button>
                    <button
                      onClick={onSignInClick}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:bg-zinc-700 transition-colors whitespace-nowrap"
                    >
                      🔎 Find Sources
                    </button>
                    <button
                      onClick={onSignInClick}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:bg-zinc-700 transition-colors whitespace-nowrap"
                    >
                      ✺ Simplify
                    </button>
                  </div>
                </div>
                <p className="text-right text-[10px] text-zinc-500 mt-1 pr-1">
                  Select any text to see this menu
                </p>
              </div>

              {/* ---------------------------------------------------------- */}
              {/* Sign-in CTA banner — persistent above input                */}
              {/* ---------------------------------------------------------- */}
              <div className="max-w-[720px] mx-auto mb-4">
                <div className="rounded-xl bg-zinc-800/80 border border-zinc-700 px-4 py-3 flex items-center justify-between gap-3">
                  <p className="text-sm text-zinc-300">
                    Sign in to explore branching, annotations, and more →
                  </p>
                  <button
                    onClick={onSignInClick}
                    className="shrink-0 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors font-medium"
                  >
                    Sign in
                  </button>
                </div>
              </div>
            </div>

            {/* ---------------------------------------------------------------- */}
            {/* Gutter column — static pill + preview card                       */}
            {/* ---------------------------------------------------------------- */}
            <aside className="hidden lg:flex flex-col w-[200px] shrink-0 pt-6 pr-4 space-y-2">
              {/* Lead pill */}
              <button
                onClick={onSignInClick}
                className="flex items-start gap-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-md shadow-sm px-2.5 py-2 text-left hover:shadow-md transition-shadow w-full"
              >
                <span
                  className="mt-0.5 w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: childThread.accentColor }}
                />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate leading-tight">
                    → {childThread.title}
                  </p>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                    {childThread.messageIds.length} messages
                  </span>
                </div>
              </button>

              {/* Hover preview card — always visible in demo */}
              <div
                className="rounded-lg border bg-white dark:bg-zinc-800 shadow-md overflow-hidden"
                style={{ borderColor: childThread.accentColor }}
              >
                <div
                  className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide"
                  style={{
                    backgroundColor: `${childThread.accentColor}22`,
                    color: childThread.accentColor,
                  }}
                >
                  Thread preview
                </div>
                <div className="px-2.5 py-2 space-y-1.5">
                  {childMessages.slice(0, 2).map(msg => (
                    <div key={msg.id} className="text-[10px] leading-snug">
                      <span className={`font-semibold ${msg.role === 'user' ? 'text-blue-400' : 'text-zinc-400'}`}>
                        {msg.role === 'user' ? 'You: ' : 'AI: '}
                      </span>
                      <span className="text-zinc-500 dark:text-zinc-400">
                        {msg.content.slice(0, 70)}…
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-zinc-700 px-2.5 py-1.5">
                  <button
                    onClick={onSignInClick}
                    className="text-[10px] font-medium hover:underline transition-colors"
                    style={{ color: childThread.accentColor }}
                  >
                    Open thread →
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </main>

        {/* ------------------------------------------------------------------ */}
        {/* Disabled input area                                                 */}
        {/* ------------------------------------------------------------------ */}
        <footer className="border-t border-zinc-800 p-4 shrink-0">
          <div className="max-w-[720px] mx-auto">
            <p className="text-xs text-zinc-500 mb-2 text-center">
              Sign in to start your own conversation
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                disabled
                placeholder="Sign in to start your own conversation…"
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-sm text-zinc-500 placeholder-zinc-600 cursor-not-allowed"
              />
              <button
                onClick={onSignInClick}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors whitespace-nowrap font-medium"
              >
                Sign in
              </button>
            </div>
          </div>
        </footer>
      </div>

    </div>
  );
}
