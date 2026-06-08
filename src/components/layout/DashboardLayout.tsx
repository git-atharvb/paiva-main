import { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface DashboardLayoutProps {
  header: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
}

export function DashboardLayout({ header, sidebar, children }: DashboardLayoutProps) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('sidebarWidth');
    return saved ? parseInt(saved, 10) : 288;
  });
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newWidth = Math.max(220, Math.min(600, e.clientX));
      setSidebarWidth(newWidth);
    }
  }, [isResizing]);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
    localStorage.setItem('sidebarWidth', sidebarWidth.toString());
  }, [sidebarWidth]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', resize);
      document.addEventListener('mouseup', stopResizing);
    } else {
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResizing);
    }
    return () => {
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  return (
    <div className={cn(
      "flex h-dvh w-full overflow-hidden transition-colors duration-700 bg-background bg-mesh bg-aurora relative",
      isResizing && "select-none cursor-col-resize"
    )}>

      {/* ── Floating ambient orb ────────────────────────────────────── */}
      <div
        className="absolute top-1/3 right-1/4 w-[450px] h-[450px] rounded-full pointer-events-none z-0 opacity-20 blur-3xl animate-spotlight"
        style={{ background: 'radial-gradient(circle, oklch(0.56 0.260 280 / 0.25), transparent 70%)' }}
      />

      {/* ── Floating Sidebar (bento box) ─────────────────────────────── */}
      <div 
        className={cn(
          "hidden md:flex relative p-4 shrink-0 z-10",
          !isResizing && "transition-[width] duration-300 ease-smooth"
        )}
        style={{ width: `${sidebarWidth}px` }}
      >
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

        {/* ── Resize Handle ───────────────────────────────────────────── */}
        <div
          className="absolute top-0 right-0 w-4 h-full cursor-col-resize z-50 flex items-center justify-center group"
          onMouseDown={startResizing}
        >
          <div className={cn(
            "w-1 h-12 rounded-full transition-colors duration-200",
            isResizing ? "bg-primary shadow-neon-sm" : "bg-border/30 group-hover:bg-primary/50"
          )} />
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
        <div className="h-px mb-3 mx-4 bg-linear-to-r from-transparent via-border/50 to-transparent" />

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
