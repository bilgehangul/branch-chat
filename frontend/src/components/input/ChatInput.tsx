import React, { useRef } from 'react';

interface ChatInputProps {
  onSend: (text: string) => void;
  onStop: () => void;
  isStreaming: boolean;
}

/**
 * ChatInput
 *
 * Auto-expanding textarea (1–4 lines) with Send/Stop button.
 * Enter key inserts newline (default textarea behavior — no preventDefault).
 * Disabled with reduced opacity while streaming is active.
 */
export function ChatInput({ onSend, onStop, isStreaming }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleInput(e: React.FormEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 24 * 4)}px`;
  }

  function handleSend() {
    const el = textareaRef.current;
    if (!el) return;
    const text = el.value;
    if (!text.trim() || isStreaming) return;
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
    <div className="flex items-end gap-2 p-3 border-t border-slate-200 bg-white">
      <textarea
        ref={textareaRef}
        rows={1}
        placeholder="Ask anything..."
        disabled={isStreaming}
        onInput={handleInput}
        className={`flex-1 resize-none rounded-lg border border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors${isStreaming ? ' opacity-50' : ''}`}
        style={{ minHeight: '2.25rem', maxHeight: `${24 * 4}px`, overflowY: 'auto' }}
      />
      <button
        type="button"
        onClick={handleButtonClick}
        className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors${isStreaming ? ' bg-zinc-600 hover:bg-zinc-700' : ' bg-blue-600 hover:bg-blue-700'}`}
      >
        {isStreaming ? 'Stop' : 'Send'}
      </button>
    </div>
  );
}

export default ChatInput;
