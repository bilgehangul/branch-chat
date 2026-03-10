import { useSessionStore } from '../../store/sessionStore';
import { selectCurrentThread } from '../../store/selectors';

export function SpineStrip() {
  const threads = useSessionStore((s) => s.threads);
  const activeThreadId = useSessionStore((s) => s.activeThreadId);
  const setActiveThread = useSessionStore((s) => s.setActiveThread);

  const currentThread = selectCurrentThread(threads, activeThreadId ?? '');

  if (!currentThread || currentThread.depth === 0 || !currentThread.parentThreadId) {
    return null;
  }

  const parentThread = threads[currentThread.parentThreadId];
  if (!parentThread) return null;

  return (
    <div
      className="w-5 sm:w-7 flex-shrink-0 flex items-center justify-center cursor-pointer bg-zinc-900 hover:bg-zinc-800 transition-colors"
      style={{ borderLeft: `3px solid ${parentThread.accentColor}` }}
      onClick={() => setActiveThread(currentThread.parentThreadId!)}
      title={`Back to: ${parentThread.title}`}
    >
      <span
        className="text-xs text-zinc-400 overflow-hidden"
        style={{
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          transform: 'rotate(180deg)',
          maxHeight: '120px',
          display: 'block',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}
      >
        {parentThread.title}
      </span>
    </div>
  );
}
