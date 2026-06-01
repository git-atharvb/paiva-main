import { MessageSquare, Settings, Plus, ChevronRight } from 'lucide-react';
import paivaLogo from '../assets/paiva_logo.png';
import { cn } from '../lib/utils';

const conversations = [
  { id: '1', title: 'Plan UI Redesign',       active: true },
  { id: '2', title: 'Implement Tailwind v4',  active: false },
  { id: '3', title: 'Fix API Endpoints',      active: false },
];

export default function Sidebar() {
  return (
    <aside className="w-full h-full flex flex-col p-5 text-foreground bg-transparent">

      {/* ── Logo / Brand ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3.5 mb-8 px-1.5 animate-in fade-in slide-in-from-left-4 duration-500">
        <div className="relative size-11 shrink-0 group cursor-default">
          {/* Glow halo behind logo */}
          <div className="absolute inset-0 bg-primary/40 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none animate-pulse-glow" />
          <img
            src={paivaLogo}
            alt="Paiva Logo"
            className="w-full h-full object-contain rounded-xl drop-shadow-lg relative z-10 transition-all duration-500 ease-spring group-hover:scale-110 group-hover:drop-shadow-2xl outline-none border-none ring-0 animate-float"
          />
        </div>
        <div>
          <span className="font-bold text-base tracking-tight text-gradient-primary block">
            PAIVA
          </span>
          <span className="text-caption text-muted-foreground tracking-wide">Workspace</span>
        </div>
      </div>

      {/* ── New Chat button ───────────────────────────────────────── */}
      <button
        className={cn(
          'mb-6 w-full flex items-center gap-2.5 px-4 py-3 rounded-xl',
          'bg-primary/10 dark:bg-primary/15',
          'border border-primary/25 dark:border-primary/30',
          'text-primary text-sm font-semibold tracking-snug',
          'hover:bg-primary/18 dark:hover:bg-primary/22',
          'hover:border-primary/50',
          'hover:shadow-neon-sm',
          'transition-all duration-200 ease-spring',
          'hover:scale-[1.02] hover:-translate-y-px',
          'active:scale-[0.97] active:transition-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'animate-in fade-in slide-in-from-left-4 duration-500 delay-75',
        )}
      >
        <Plus size={16} strokeWidth={2.5} className="shrink-0" />
        New Conversation
      </button>

      {/* ── Conversations label ───────────────────────────────────── */}
      <div className="text-label text-muted-foreground/70 mb-3 px-2 animate-in fade-in duration-500 delay-100">
        Recent
      </div>

      {/* ── Conversation list ─────────────────────────────────────── */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1 -mr-1">
        {conversations.map((c, i) => (
          <div
            key={c.id}
            className={cn(
              'group relative px-3.5 py-3 rounded-xl cursor-pointer',
              'flex items-center gap-3',
              'text-sm font-medium tracking-snug',
              'transition-all duration-200 ease-spring',
              'hover:scale-[1.015] hover:-translate-y-px',
              'active:scale-[0.98] active:transition-none',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'animate-in fade-in slide-in-from-left-4',
              // Active state
              c.active
                ? 'bg-primary/12 dark:bg-primary/18 text-primary border border-primary/25 dark:border-primary/30 shadow-neon-sm'
                : 'text-foreground hover:bg-secondary/55 hover:text-primary border border-transparent hover:border-border/50',
            )}
            style={{ animationDelay: `${(i + 2) * 80}ms`, animationFillMode: 'both' }}
            role="button"
            tabIndex={0}
          >
            <MessageSquare
              size={15}
              strokeWidth={c.active ? 2.5 : 1.75}
              className="shrink-0 transition-transform duration-200 group-hover:scale-110"
            />
            <span className="truncate flex-1">{c.title}</span>
            <ChevronRight
              size={14}
              strokeWidth={2}
              className="shrink-0 opacity-0 group-hover:opacity-60 transition-all duration-200 -translate-x-1 group-hover:translate-x-0"
            />
          </div>
        ))}
      </nav>

      {/* ── Settings panel ────────────────────────────────────────── */}
      <div className="mt-auto pt-5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
        <div
          className={cn(
            'p-4 rounded-2xl',
            'bg-secondary/30 dark:bg-secondary/50',
            'border border-border/50 dark:border-border/40',
            'shadow-1',
            'transition-all duration-300 ease-smooth',
            'hover:shadow-2 hover:border-primary/25',
          )}
        >
          <div className="text-sm font-semibold mb-0.5 flex items-center gap-2 tracking-tight">
            <Settings size={15} strokeWidth={1.75} className="text-primary" />
            Settings
          </div>
          <div className="text-caption text-muted-foreground mb-4 leading-relaxed">
            Manage workspace preferences.
          </div>
          <button
            className={cn(
              'w-full py-2.5 rounded-xl text-xs font-bold tracking-wider',
              'bg-foreground/90 text-background',
              'dark:bg-white/10 dark:text-foreground dark:border dark:border-white/10',
              'hover:bg-primary hover:text-primary-foreground',
              'hover:shadow-neon-sm',
              'transition-all duration-200 ease-spring',
              'hover:scale-[1.02] active:scale-[0.97] active:transition-none',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          >
            Open Settings
          </button>
        </div>
      </div>
    </aside>
  );
}