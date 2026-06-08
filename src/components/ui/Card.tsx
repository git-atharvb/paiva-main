import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * elevated — premium auth/modal card style
   *   Light: translucent frosted panel with bright inner-top highlight
   *   Dark:  deep obsidian + neon border glow + volumetric shadow
   */
  elevated?: boolean;
  /**
   * glass — lighter surface-level glass panel (sidebar, header)
   */
  glass?: boolean;
  /**
   * interactive — adds hover tilt/lift effect
   */
  interactive?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, elevated, glass, interactive, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // ── Base structural styles ────────────────────────────────────
          'rounded-2xl overflow-hidden',
          // ── Transition all glass properties ───────────────────────────
          'transition-all duration-350 ease-smooth',

          // ── Default card (non-glass) ───────────────────────────────────
          !elevated && !glass && [
            'bg-card/80 border border-border/50',
            'shadow-1',
            'hover:shadow-2 hover:border-primary/15',
          ],

          // ── Glass surface (sidebar, panels) ───────────────────────────
          glass && !elevated && [
            'glass-surface bg-noise',
          ],

          // ── Elevated card (auth card, modal) ──────────────────────────
          elevated && [
            // Light: warm white glass
            'bg-white/68 backdrop-blur-[36px] saturate-150 brightness-105',
            'border border-white/50',
            'shadow-premium',
            // Bright inner-top highlight (light) + soft bottom darkening
            '[box-shadow:var(--shadow-premium),inset_0_1px_0_oklch(1_0_0/0.78),inset_0_-1px_0_oklch(0_0_0/0.03)]',
            // Dark: obsidian glass + neon ring
            'dark:bg-[oklch(0.130_0.024_262/0.90)] dark:backdrop-blur-[36px]',
            'dark:border-[oklch(0.230_0.026_262/0.60)]',
            'dark:[box-shadow:var(--shadow-premium-dark)]',
            // Noise texture for tactile depth
            'bg-noise',
          ],

          // ── Interactive variant ────────────────────────────────────────
          interactive && [
            'hover:scale-[1.01] hover:-translate-y-0.5',
            'active:scale-[0.99] active:transition-none',
            'cursor-pointer',
            'magical-border',
          ],

          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';
