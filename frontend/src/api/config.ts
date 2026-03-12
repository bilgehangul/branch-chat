// frontend/src/api/config.ts
// Module-level cached fetch for the model display label from /api/config.
// Only the first call triggers a network request; subsequent calls return the cache.

let cachedLabel: string | null = null;

export async function getModelLabel(): Promise<string> {
  if (cachedLabel) return cachedLabel;
  try {
    const res = await fetch('/api/config');
    const data = await res.json();
    cachedLabel = data.modelLabel ?? 'AI';
    return cachedLabel as string;
  } catch {
    return 'AI';
  }
}
