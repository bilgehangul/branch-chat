interface RateLimitBannerProps {
  minutesRemaining: number;
}

export function RateLimitBanner({ minutesRemaining }: RateLimitBannerProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm rounded-t-lg mx-3">
      <span>&#9888;</span>
      <span>
        Rate limit reached.{' '}
        {minutesRemaining > 0 ? `Try again in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}.` : 'Please wait a moment.'}
      </span>
    </div>
  );
}
