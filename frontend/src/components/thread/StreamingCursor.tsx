export function StreamingCursor({
  isStreaming,
  hasContent,
}: {
  isStreaming: boolean;
  hasContent: boolean;
}) {
  if (!isStreaming) return null;

  return (
    <>
      <style>{`
        @keyframes bounce-dot {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
      {!hasContent ? (
        <span className="inline-flex items-center gap-0.5 text-zinc-400 ml-1" aria-label="typing">
          <span style={{ animation: 'bounce-dot 1.4s infinite', animationDelay: '0ms', display: 'inline-block' }}>.</span>
          <span style={{ animation: 'bounce-dot 1.4s infinite', animationDelay: '150ms', display: 'inline-block' }}>.</span>
          <span style={{ animation: 'bounce-dot 1.4s infinite', animationDelay: '300ms', display: 'inline-block' }}>.</span>
        </span>
      ) : (
        <span
          className="text-zinc-300 ml-0.5"
          style={{ animation: 'blink 1s step-end infinite', display: 'inline-block' }}
          aria-hidden="true"
        >
          _
        </span>
      )}
    </>
  );
}
