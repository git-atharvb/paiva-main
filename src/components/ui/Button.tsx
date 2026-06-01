import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const variants = {
      /**
       * PRIMARY — violet gradient with neon glow.
       * Hover: scale up + intensify glow (spring easing via .interactive).
       * Active: snap back with ease timing.
       */
      primary: [
        'bg-primary text-primary-foreground',
        'shadow-neon-sm hover:shadow-neon',
        'hover:brightness-[1.12]',
        'relative overflow-hidden',
        // Sheen sweep on hover
        'after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent',
        'after:translate-x-[-150%] after:skew-x-[-20deg]',
        'hover:after:translate-x-[150%] after:transition-transform after:duration-500',
      ].join(' '),

      /**
       * SECONDARY — frosted glass panel button.
       * Subtle border + backdrop-blur for a glass-like feel.
       */
      secondary: [
        'bg-secondary/45 text-secondary-foreground',
        'border border-border/60',
        'backdrop-blur-sm',
        'shadow-1',
        'hover:bg-secondary/70 hover:border-primary/40 hover:shadow-2',
      ].join(' '),

      /**
       * GHOST — text-only, minimal chrome.
       * Hover: muted surface swatch appears with spring transition.
       */
      ghost: [
        'bg-transparent text-muted-foreground',
        'hover:text-foreground hover:bg-secondary/40',
        'hover:shadow-0',
      ].join(' '),

      /**
       * DANGER — warm destructive action.
       */
      danger: [
        'bg-destructive text-destructive-foreground',
        'shadow-1 hover:brightness-[1.10] hover:shadow-2',
      ].join(' '),
    };

    const sizes = {
      sm:   'h-9  px-4   text-xs   font-semibold  tracking-wide  gap-1.5',
      md:   'h-11 px-5   text-sm   font-semibold  tracking-snug  gap-2',
      lg:   'h-14 px-8   text-base font-bold      tracking-tight gap-2.5',
      icon: 'size-11 p-0 flex items-center justify-center',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          // ── Base layout ──────────────────────────────────────────────
          'inline-flex items-center justify-center rounded-xl',
          // ── Spring-physics motion (transform + shadow + border) ──────
          'transition-all duration-200 ease-spring',
          'hover:scale-[1.035] hover:-translate-y-px',
          'active:scale-[0.96] active:translate-y-0 active:transition-none',
          // ── Accessibility — theme-aware focus ring ───────────────────
          'focus-visible:outline-none',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'focus-visible:ring-offset-background',
          'focus-visible:shadow-[0_0_0_4px_oklch(from_var(--color-ring)_l_c_h_/_0.20)]',
          // ── Disabled state ───────────────────────────────────────────
          'disabled:opacity-45 disabled:pointer-events-none disabled:shadow-none',
          // ── Selected variant & size ──────────────────────────────────
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-0.5 h-4 w-4 text-current shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12" cy="12" r="10"
              stroke="currentColor" strokeWidth="4"
            />
            <path
              className="opacity-80"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
