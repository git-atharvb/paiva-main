import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface DashboardLayoutProps {
  header: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
}

export function DashboardLayout({ header, sidebar, children }: DashboardLayoutProps) {
  return (
    <div className="flex h-dvh w-full overflow-hidden transition-colors duration-700 bg-background bg-mesh bg-aurora relative">

      {/* ── Floating ambient orb ────────────────────────────────────── */}
      <div
        className="absolute top-1/3 right-1/4 w-[450px] h-[450px] rounded-full pointer-events-none z-0 opacity-20 blur-3xl animate-spotlight"
        style={{ background: 'radial-gradient(circle, oklch(0.56 0.260 280 / 0.25), transparent 70%)' }}
      />

      {/* ── Floating Sidebar (bento box) ─────────────────────────────── */}
      <div className="hidden md:flex w-72 p-4 shrink-0 z-10">
        <div
          className={cn(
            'w-full h-full rounded-3xl overflow-hidden',
            'glass-surface bg-noise',
            'transition-all duration-500 ease-smooth',
            'hover:border-primary/25',
          )}
        >
          {sidebar}
        </div>
      </div>

      {/* ── Right column (header + main) ─────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 p-4 pl-0 md:pl-2 z-10">

        {/* ── Floating Header ─────────────────────────────────────────── */}
        <header
          className={cn(
            'h-[64px] shrink-0 mb-3 px-6 flex items-center justify-between',
            'rounded-2xl',
            'glass-surface bg-noise',
            'transition-all duration-500 ease-smooth',
            'hover:border-primary/20',
          )}
        >
          {header}
        </header>

        {/* ── Gradient divider line ──────────────────────────────────── */}
        <div className="h-px mb-3 mx-4 bg-gradient-to-r from-transparent via-border/50 to-transparent" />

        {/* ── Main Content ────────────────────────────────────────────── */}
        <main
          className={cn(
            'flex-1 overflow-hidden rounded-2xl',
            // Lighter glass for main — more translucent so chat bubbles pop
            'glass-surface-subtle bg-noise',
            'transition-all duration-500 ease-smooth',
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
