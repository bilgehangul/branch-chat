/**
 * AnnotationShimmer
 *
 * Shared loading placeholder for citation and simplification blocks.
 * Uses Tailwind animate-pulse. Matches the border and shape of the final blocks
 * to prevent layout shift on load completion.
 *
 * Requirements: INLINE-01 (loading state), INLINE-05 (loading state)
 */
interface AnnotationShimmerProps {
  type: 'source' | 'simplification';
}

export function AnnotationShimmer({ type }: AnnotationShimmerProps) {
  return (
    <div className="mt-2 max-w-[720px] mx-auto rounded-lg border border-zinc-700 bg-zinc-800 p-3 animate-pulse">
      {/* Header placeholder */}
      <div className="h-3 bg-zinc-600 rounded w-1/3 mb-3" />

      {type === 'source' && (
        <>
          <div className="h-3 bg-zinc-600 rounded w-full mb-2" />
          <div className="h-3 bg-zinc-600 rounded w-4/5 mb-2" />
          <div className="h-3 bg-zinc-600 rounded w-full mb-2" />
          <hr className="border-zinc-700 my-2" />
          <div className="h-3 bg-zinc-600 rounded w-2/3" />
        </>
      )}

      {type === 'simplification' && (
        <>
          <div className="h-3 bg-zinc-600 rounded w-3/4 mb-2" />
          <div className="h-10 bg-zinc-600 rounded w-full" />
        </>
      )}
    </div>
  );
}
