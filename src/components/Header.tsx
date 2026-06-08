import { useTheme } from '../context/ThemeContext';
import { Button } from './ui/Button';
import { Sun, Moon, LogOut, User } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Header({
  userName,
  onLogout,
}: {
  userName?: string;
  onLogout?: () => void;
}) {
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      {/* ── Brand wordmark ───────────────────────────────────────── */}
      <div
        className={cn(
          'font-black text-xl tracking-tighter select-none hidden sm:block relative group',
          'text-gradient-primary',
          'animate-in fade-in slide-in-from-left-4 duration-500',
        )}
      >
        PAIVA
        {/* Gradient underline on hover */}
        <div className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full bg-gradient-to-r from-primary/0 via-primary/60 to-primary/0 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-bounce-soft origin-center" />
      </div>

      {/* ── Right controls ───────────────────────────────────────── */}
      <nav className="flex items-center gap-2 md:gap-3 animate-in fade-in slide-in-from-right-4 duration-500">

        {/* User chip */}
        {userName && (
          <div
            className={cn(
              'hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full',
              'bg-secondary/40 dark:bg-secondary/50',
              'border border-border/40',
              'text-foreground text-sm font-medium tracking-snug',
              'transition-all duration-300 ease-smooth',
              'shadow-0',
              'hover:border-primary/25 hover:shadow-1',
            )}
          >
            <span className="size-6 rounded-full bg-primary/15 dark:bg-primary/25 flex items-center justify-center">
              <User size={12} strokeWidth={2.5} className="text-primary" />
            </span>
            <span className="max-w-[120px] truncate">{userName}</span>
            {/* Online status dot */}
            <span className="size-2 rounded-full bg-emerald-400 dark:bg-emerald-300 shadow-[0_0_5px_oklch(0.70_0.19_155/0.7)] animate-pulse" />
          </div>
        )}

        {/* Theme toggle */}
        <Button
          variant="secondary"
          size="icon"
          onClick={toggleTheme}
          title="Toggle Theme"
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          className={cn(
            'rounded-full size-10',
            'transition-all duration-300 ease-spring',
            'hover:shadow-neon-sm hover:border-primary/35',
            // Rotate the icon on theme change
            '[&>*]:transition-transform [&>*]:duration-500 [&>*]:ease-spring',
            theme === 'dark' || theme === 'cyberpunk' || theme === 'midnight'
              ? '[&>*]:rotate-180'
              : '[&>*]:rotate-0',
          )}
        >
          {theme === 'light'
            ? <Moon   size={17} strokeWidth={1.75} className="text-foreground" />
            : <Sun    size={17} strokeWidth={1.75} className="text-yellow-400 dark:text-yellow-300" />
          }
        </Button>

        {/* Logout */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className={cn(
            'gap-1.5 text-muted-foreground hover:text-destructive',
            'hover:bg-destructive/8 dark:hover:bg-destructive/12',
            'rounded-xl tracking-wide',
          )}
        >
          <LogOut size={15} strokeWidth={1.75} className="shrink-0" />
          <span className="hidden md:inline">Logout</span>
        </Button>
      </nav>
    </>
  );
}