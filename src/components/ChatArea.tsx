import { Button } from './ui/Button';
import { Send, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

const messages = [
  {
    id: 1,
    role: 'assistant' as const,
    content: 'Hi — I\'m PAIVA. How can I help you today?',
    delay: 0,
  },
  {
    id: 2,
    role: 'user' as const,
    content: 'Please help me draft a massive UI upgrade plan.',
    delay: 150,
  },
  {
    id: 3,
    role: 'assistant' as const,
    content: 'Absolutely! I\'ll set up a glassmorphic layout with light and dark mode toggles, sleek gradients, and responsive components.',
    delay: 300,
  },
];

export default function ChatArea() {
  return (
    <div className="flex flex-col h-full p-5 lg:p-7 gap-5">

      {/* ── Chat header strip ────────────────────────────────────────── */}
      <div className="flex items-center gap-2 shrink-0">
        <div className={cn(
          'size-7 rounded-full flex items-center justify-center',
          'bg-primary/15 dark:bg-primary/25',
          'animate-pulse-glow',
        )}>
          <Sparkles size={14} strokeWidth={2} className="text-primary" />
        </div>
        <span className="text-sm font-semibold text-muted-foreground tracking-snug">
          PAIVA Assistant
        </span>
        {/* Status dot */}
        <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <span className="size-2 rounded-full bg-emerald-400 dark:bg-emerald-300 shadow-[0_0_6px_oklch(0.80_0.17_160_/_0.8)] animate-pulse" />
          Online
        </span>
      </div>

      {/* ── Messages ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 -mr-1">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex animate-in fade-in slide-in-from-bottom-2 duration-500',
              msg.role === 'user' ? 'justify-end' : 'justify-start',
            )}
            style={{ animationDelay: `${msg.delay}ms`, animationFillMode: 'both' }}
          >
            <div
              className={cn(
                'max-w-[82%] px-5 py-3.5 rounded-2xl text-sm leading-body tracking-snug',
                msg.role === 'assistant'
                  ? [
                      // Glass bubble for assistant
                      'bg-card/70 dark:bg-card/80 backdrop-blur-sm',
                      'border border-border/50 dark:border-border/40',
                      'text-foreground rounded-bl-sm',
                      'shadow-1',
                    ].join(' ')
                  : [
                      // Gradient bubble for user
                      'bg-gradient-to-br from-primary to-[oklch(0.62_0.22_250)]',
                      'dark:from-primary dark:to-[oklch(0.58_0.22_250)]',
                      'text-primary-foreground rounded-br-sm',
                      'shadow-neon-sm',
                    ].join(' '),
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      {/* ── Composer ─────────────────────────────────────────────────── */}
      <form
        className="flex flex-col sm:flex-row gap-3 shrink-0"
        onSubmit={e => e.preventDefault()}
      >
        <div className="relative flex-1">
          <input
            placeholder="Message PAIVA…"
            className={cn(
              'w-full px-5 py-4 rounded-2xl',
              'bg-secondary/40 dark:bg-secondary/55',
              'border-2 border-transparent',
              'text-foreground text-sm font-medium tracking-snug',
              'placeholder:text-muted-foreground/60',
              'outline-none',
              'transition-all duration-200 ease-smooth',
              'focus:border-primary/60 focus:bg-card/60 dark:focus:bg-card/50',
              'focus:shadow-[0_0_0_4px_oklch(from_var(--color-ring)_l_c_h_/_0.15)]',
              'shadow-inner',
            )}
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          size="icon"
          className={cn(
            'rounded-2xl size-14 shrink-0',
            'shadow-neon-sm hover:shadow-neon',
          )}
          aria-label="Send message"
        >
          <Send size={18} strokeWidth={2} />
        </Button>
      </form>
    </div>
  );
}