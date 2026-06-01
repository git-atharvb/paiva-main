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
          'font-black text-xl tracking-tighter text-gradient-primary select-none hidden sm:block',
          'animate-in fade-in slide-in-from-left-4 duration-500',
        )}
      >
        PAIVA
      </div>

      {/* ── Right controls ───────────────────────────────────────── */}
      <nav className="flex items-center gap-2 md:gap-3 animate-in fade-in slide-in-from-right-4 duration-500">

        {/* User chip */}
        {userName && (
          <div
            className={cn(
              'hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full',
              'bg-secondary/50 dark:bg-secondary/60',
              'border border-border/50',
              'text-foreground text-sm font-medium tracking-snug',
              'transition-all duration-200 ease-smooth',
              'shadow-0',
            )}
          >
            <span className="size-6 rounded-full bg-primary/20 dark:bg-primary/30 flex items-center justify-center">
              <User size={12} strokeWidth={2.5} className="text-primary" />
            </span>
            <span className="max-w-[120px] truncate">{userName}</span>
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
            'hover:shadow-neon-sm hover:border-primary/40',
            // Rotate the icon on theme change
            '[&>*]:transition-transform [&>*]:duration-500 [&>*]:ease-spring',
            theme === 'dark' ? '[&>*]:rotate-180' : '[&>*]:rotate-0',
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
            'hover:bg-destructive/10 dark:hover:bg-destructive/15',
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