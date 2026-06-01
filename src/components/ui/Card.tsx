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
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, elevated, glass, ...props }, ref) => {
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
            'hover:shadow-2 hover:border-primary/20',
          ],

          // ── Glass surface (sidebar, panels) ───────────────────────────
          glass && !elevated && [
            'glass-surface bg-noise',
          ],

          // ── Elevated card (auth card, modal) ──────────────────────────
          elevated && [
            // Light: warm white glass
            'bg-white/72 backdrop-blur-[36px] saturate-150 brightness-105',
            'border border-white/55',
            'shadow-premium',
            // Bright inner-top highlight (light) + soft bottom darkening
            '[box-shadow:var(--shadow-premium),inset_0_1px_0_oklch(1_0_0_/_0.82),inset_0_-1px_0_oklch(0_0_0_/_0.04)]',
            // Dark: obsidian glass + neon ring
            'dark:bg-[oklch(0.148_0.022_258_/_0.92)] dark:backdrop-blur-[36px]',
            'dark:border-[oklch(0.245_0.028_260_/_0.65)]',
            'dark:[box-shadow:var(--shadow-premium-dark)]',
            // Noise texture for tactile depth
            'bg-noise',
          ],

          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';
