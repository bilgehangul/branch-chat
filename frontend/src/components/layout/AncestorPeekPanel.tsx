import type { Thread, Message } from '../../types/index';

interface AncestorPeekPanelProps {
  thread: Thread;
  allMessages: Record<string, Message>;
  width: number;
  onClick: () => void;
}

export function AncestorPeekPanel({ thread, allMessages, width, onClick }: AncestorPeekPanelProps) {
  const threadMessages = thread.messageIds
    .map(id => allMessages[id])
    .filter(Boolean)
    .slice(-3); // last 3 messages

  return (
    <div
      className="relative flex-shrink-0 overflow-hidden cursor-pointer group transition-all"
      style={{ width, borderRight: `3px solid ${thread.accentColor}` }}
      onClick={onClick}
      title={`← ${thread.title}`}
    >
      {/* Thread content (visible behind frosted overlay) */}
      <div className="absolute inset-0 px-2 py-3 overflow-hidden">
        <p className="text-xs font-semibold text-slate-600 truncate mb-2">{thread.title}</p>
        <div className="space-y-2">
          {threadMessages.map(msg => (
            <div key={msg.id} className="text-xs text-slate-400 leading-relaxed">
              <span className="font-medium text-slate-500">{msg.role === 'user' ? 'You' : 'AI'}: </span>
              {msg.content.slice(0, 80)}
            </div>
          ))}
        </div>
      </div>
      {/* Frosted overlay — slightly more transparent on hover to "peek" */}
      <div className="absolute inset-0 bg-slate-50/75 group-hover:bg-slate-50/55 backdrop-blur-[2px] transition-all" />
    </div>
  );
}
