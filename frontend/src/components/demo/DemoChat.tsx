interface DemoChatProps {
  onSignInClick: () => void;
}

interface DemoMessage {
  role: 'user' | 'ai';
  content: string;
}

const DEMO_MESSAGES: DemoMessage[] = [
  {
    role: 'user',
    content: 'Explain how attention mechanisms work in transformers',
  },
  {
    role: 'ai',
    content:
      'Attention mechanisms allow a transformer to weigh the importance of each token in the input sequence relative to every other token. Rather than processing tokens sequentially, the model computes query, key, and value projections for all positions simultaneously, then uses scaled dot-product attention to produce context-aware representations.',
  },
  {
    role: 'user',
    content: 'What is the softmax function doing in that context?',
  },
  {
    role: 'ai',
    content:
      'In attention, softmax normalises the raw dot-product scores between queries and keys into a probability distribution that sums to 1. This ensures the weighted sum of value vectors is a valid convex combination, amplifying the most relevant positions and suppressing noise — the temperature of the distribution is controlled by dividing scores by the square root of the key dimension.',
  },
];

export function DemoChat({ onSignInClick }: DemoChatProps) {
  return (
    <div className="flex flex-col h-screen bg-zinc-900 text-zinc-100">
      {/* Header */}
      <header className="h-12 border-b border-zinc-800 flex items-center justify-between px-4">
        <span className="font-semibold text-zinc-100">DeepDive Chat</span>
        <button
          onClick={onSignInClick}
          className="px-3 py-1.5 text-sm bg-zinc-700 hover:bg-zinc-600 text-zinc-100 rounded-md transition-colors"
        >
          Sign in
        </button>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto py-6 px-4">
        <div className="max-w-[720px] mx-auto space-y-4">
          {DEMO_MESSAGES.map((msg, idx) => (
            <article
              key={idx}
              className={
                msg.role === 'user'
                  ? 'flex justify-end'
                  : 'flex justify-start'
              }
            >
              <div
                className={
                  msg.role === 'user'
                    ? 'max-w-[70%] bg-zinc-700 text-zinc-100 rounded-2xl rounded-tr-sm px-4 py-2 text-sm'
                    : 'max-w-[80%] text-zinc-300 text-sm leading-relaxed'
                }
              >
                {msg.content}
              </div>
            </article>
          ))}
        </div>
      </main>

      {/* Disabled input area */}
      <footer className="border-t border-zinc-800 p-4">
        <div className="max-w-[720px] mx-auto">
          <p className="text-xs text-zinc-500 mb-2 text-center">
            Sign in to start your own conversation
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              disabled
              placeholder="Sign in to start your own conversation"
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-sm text-zinc-500 placeholder-zinc-500 cursor-not-allowed"
            />
            <button
              onClick={onSignInClick}
              className="px-4 py-2 text-sm bg-zinc-700 hover:bg-zinc-600 text-zinc-100 rounded-xl transition-colors whitespace-nowrap"
            >
              Sign in
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
