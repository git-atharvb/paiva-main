import { forwardRef, useState, useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, type = 'text', className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const id = useId();

    return (
      <div className="relative mb-7 text-left w-full group">
        <div className="relative w-full">
          <input
            id={id}
            ref={ref}
            type={isPassword && showPassword ? 'text' : type}
            className={cn(
              // ── Base layout ─────────────────────────────────────────
              'peer w-full h-14 px-4 pt-5 pb-2 rounded-xl',
              'text-foreground text-sm font-medium tracking-snug',
              // ── Surface ──────────────────────────────────────────────
              'bg-input/40 dark:bg-input/60',
              // ── Border — bottom-ruled style with full border on focus ─
              'border-b-2 border-border/60',
              'outline-none',
              // ── Smooth transitions ────────────────────────────────────
              'transition-all duration-250 ease-smooth',
              // ── Focus state — themed ring ─────────────────────────────
              'focus:border-primary focus:bg-input/20 dark:focus:bg-input/40',
              'focus:shadow-[0_0_0_3px_oklch(from_var(--color-ring)_l_c_h_/_0.18)]',
              // ── Placeholder (hidden — label acts as placeholder) ──────
              'placeholder-transparent',
              // ── Password right padding ────────────────────────────────
              isPassword && 'pr-12',
              // ── Error state ───────────────────────────────────────────
              error && 'border-destructive focus:border-destructive focus:shadow-[0_0_0_3px_oklch(from_var(--color-destructive)_l_c_h_/_0.18)]',
              className
            )}
            placeholder={label}
            {...props}
          />

          {/* Floating label */}
          <label
            htmlFor={id}
            className={cn(
              'absolute left-4 pointer-events-none origin-left',
              // ── Typography ──────────────────────────────────────────
              'text-muted-foreground font-medium',
              // ── Default position (placeholder acting) ────────────────
              'top-4 text-sm tracking-snug',
              // ── Spring-like movement on float ─────────────────────────
              'transition-all duration-200 ease-spring',
              // ── Float up when focused or filled ───────────────────────
              'peer-focus:top-2 peer-focus:text-[0.6875rem] peer-focus:tracking-wider peer-focus:font-bold peer-focus:text-primary',
              'peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-[0.6875rem] peer-[:not(:placeholder-shown)]:tracking-wider peer-[:not(:placeholder-shown)]:font-bold',
              // ── Error label colour ────────────────────────────────────
              error && 'text-destructive peer-focus:text-destructive',
            )}
          >
            {label}
          </label>

          {/* Password toggle */}
          {isPassword && (
            <button
              type="button"
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2',
                'size-8 flex items-center justify-center rounded-lg',
                'text-muted-foreground hover:text-foreground',
                'hover:bg-secondary/50',
                'transition-all duration-150 ease-smooth',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
              )}
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword
                ? <EyeOff size={18} strokeWidth={1.75} />
                : <Eye    size={18} strokeWidth={1.75} />
              }
            </button>
          )}
        </div>

        {/* Error message */}
        {error && (
          <span
            className="absolute -bottom-5 left-1 text-xs text-destructive font-medium tracking-wide animate-in fade-in slide-in-from-top-1 duration-200"
          >
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
