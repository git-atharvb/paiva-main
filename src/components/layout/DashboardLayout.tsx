import type { ReactNode } from 'react';

interface DashboardLayoutProps {
  header: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
}

export function DashboardLayout({ header, sidebar, children }: DashboardLayoutProps) {
  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background transition-colors duration-700">
      {/* High-Performance Bright Mesh Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-400/40 via-transparent to-transparent dark:from-blue-900/40 opacity-80 z-0" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-fuchsia-400/40 via-transparent to-transparent dark:from-purple-900/40 opacity-80 z-0" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgMGg0MHYxSDB6bTAgNDBoMXYtNDBoLTEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz4KPC9zdmc+')] mix-blend-overlay z-0" />
      
      {/* Floating Sidebar (Bento Box style) */}
      <div className="hidden md:block w-72 p-4 shrink-0">
        <div className="h-full rounded-3xl bg-card/60 backdrop-blur-3xl border border-border/50 shadow-premium dark:shadow-premium-dark overflow-hidden transition-all duration-500 hover:shadow-neon hover:border-primary/30">
          {sidebar}
        </div>
      </div>

      <div className="flex flex-col flex-1 min-w-0 p-4 pl-0 md:pl-2">
        {/* Floating Header */}
        <header className="h-20 shrink-0 mb-4 px-8 flex items-center justify-between rounded-3xl bg-card/60 backdrop-blur-3xl border border-border/50 shadow-sm transition-all duration-500 hover:border-primary/30 z-20">
          {header}
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden relative rounded-3xl bg-card/40 backdrop-blur-3xl border border-border/50 shadow-inner z-10">
          {children}
        </main>
      </div>
    </div>
  );
}
