import type { ReactNode } from 'react';

interface DashboardLayoutProps {
  header: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
}

export function DashboardLayout({ header, sidebar, children }: DashboardLayoutProps) {
  return (
    <div className="w-full min-h-screen flex flex-col bg-mesh">
      <header className="sticky top-0 z-50 h-20 px-6 md:px-10 flex items-center justify-between bg-white/75 dark:bg-[#050505]/75 backdrop-blur-3xl border-b border-border shadow-sm">
        {header}
      </header>
      <div className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 md:gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <aside className="static lg:sticky lg:top-[112px] h-auto lg:h-[calc(100vh-144px)] flex flex-col z-10">
          {sidebar}
        </aside>
        <main className="flex flex-col min-h-[500px] lg:min-h-[calc(100vh-144px)] z-10">
          {children}
        </main>
      </div>
    </div>
  );
}
