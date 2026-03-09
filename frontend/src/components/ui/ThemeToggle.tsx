import { useTheme } from '../../contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="p-1.5 rounded text-slate-500 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? '🌙' : '☀️'}
    </button>
  );
}
