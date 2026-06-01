import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface DashboardLayoutProps {
  header: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
}

export function DashboardLayout({ header, sidebar, children }: DashboardLayoutProps) {
  return (
    <div className="flex h-dvh w-full overflow-hidden transition-colors duration-700 bg-background bg-aurora relative">

      {/* ── Subtle dot-grid overlay ─────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none z-0 mix-blend-overlay opacity-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ccircle cx='1' cy='1' r='1' fill='oklch(0.5 0 0 / 0.15)'/%3E%3C/svg%3E")`,
          backgroundSize: '20px 20px',
        }}
      />

      {/* ── Floating Sidebar (bento box) ─────────────────────────────── */}
      <div className="hidden md:flex w-72 p-4 shrink-0 z-10">
        <div
          className={cn(
            'w-full h-full rounded-3xl overflow-hidden',
            'glass-surface bg-noise',
            'transition-all duration-500 ease-smooth',
            'hover:border-primary/30',
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
            'h-[68px] shrink-0 mb-4 px-6 flex items-center justify-between',
            'rounded-3xl',
            'glass-surface bg-noise',
            'transition-all duration-500 ease-smooth',
            'hover:border-primary/25',
          )}
        >
          {header}
        </header>

        {/* ── Main Content ────────────────────────────────────────────── */}
        <main
          className={cn(
            'flex-1 overflow-hidden rounded-3xl',
            // Lighter glass for main — more translucent so chat bubbles pop
            'bg-card/35 dark:bg-card/45 backdrop-blur-2xl',
            'border border-border/40 dark:border-border/30',
            'shadow-1 dark:shadow-2',
            'transition-all duration-500 ease-smooth',
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
