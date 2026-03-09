import React, { useRef } from 'react';
import { RateLimitBanner } from '../ui/RateLimitBanner';

interface StreamError {
  messageId: string;
  retry: () => void;
}

interface ChatInputProps {
  onSend: (text: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  rateLimitMinutes?: number | null;
  streamError?: StreamError | null;
}

/**
 * ChatInput
 *
 * Auto-expanding textarea (1–4 lines) with Send/Stop button.
 * Enter key inserts newline (default textarea behavior — no preventDefault).
 * Disabled with reduced opacity while streaming or rate-limited.
 * Shows RateLimitBanner above input when rate limited.
 * Shows mid-stream error with Retry when stream failed.
 */
export function ChatInput({ onSend, onStop, isStreaming, rateLimitMinutes, streamError }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isRateLimited = rateLimitMinutes !== null && rateLimitMinutes !== undefined;
  const isDisabled = isStreaming || isRateLimited;

  function handleInput(e: React.FormEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 24 * 4)}px`;
  }

  function handleSend() {
    const el = textareaRef.current;
    if (!el) return;
    const text = el.value;
    if (!text.trim() || isDisabled) return;
    onSend(text);
    el.value = '';
    el.style.height = 'auto';
  }

  function handleButtonClick() {
    if (isStreaming) {
      onStop();
    } else {
      handleSend();
    }
  }

  return (
    <div className="flex flex-col border-t border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
      {/* Mid-stream error — shown above input when stream failed */}
      {streamError && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-950 border-b border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-sm">
          <span>&#9888;</span>
          <span>Response interrupted.</span>
          <button
            onClick={streamError.retry}
            className="underline font-medium hover:no-underline ml-1"
          >
            Retry
          </button>
        </div>
      )}
      {/* Rate limit banner — shown above textarea */}
      {isRateLimited && <RateLimitBanner minutesRemaining={rateLimitMinutes!} />}
      {/* Input row */}
      <div className="flex items-end gap-2 p-3">
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder="Ask anything..."
          disabled={isDisabled}
          onInput={handleInput}
          className={`flex-1 resize-none rounded-lg border border-stone-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-stone-900 dark:text-slate-100 placeholder-stone-400 dark:placeholder-slate-400 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors${isDisabled ? ' opacity-50' : ''}`}
          style={{ minHeight: '2.25rem', maxHeight: `${24 * 4}px`, overflowY: 'auto' }}
        />
        <button
          type="button"
          onClick={handleButtonClick}
          disabled={isDisabled && !isStreaming}
          className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors${isStreaming ? ' bg-zinc-600 hover:bg-zinc-700' : isRateLimited ? ' bg-zinc-400 cursor-not-allowed' : ' bg-blue-600 hover:bg-blue-700'}`}
        >
          {isStreaming ? 'Stop' : 'Send'}
        </button>
      </div>
    </div>
  );
}

export default ChatInput;
