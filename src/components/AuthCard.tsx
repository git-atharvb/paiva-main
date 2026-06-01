import React from 'react';
import { Card } from './ui/Card';
import { cn } from '../lib/utils';

export default function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <Card
      elevated
      className={cn(
        'w-full max-w-[480px]',
        'p-8 md:p-12',
        'relative overflow-hidden group',
        // Rounded corners for auth context
        'rounded-3xl',
      )}
    >
      {/* ── Animated gradient sheen on hover (light mode only) ─────── */}
      <div
        className={cn(
          'absolute inset-0 z-10 pointer-events-none',
          'bg-gradient-to-br from-white/30 via-primary/5 to-transparent',
          'opacity-0 group-hover:opacity-100',
          'transition-opacity duration-1000',
          'mix-blend-overlay',
        )}
      />

      {/* ── Dark mode: neon inner-border glow ───────────────────────── */}
      <div
        className={cn(
          'absolute inset-0 z-10 pointer-events-none rounded-3xl',
          'opacity-0 dark:opacity-100',
          'transition-opacity duration-700',
          // Subtle inner neon ring using box-shadow inset
          '[box-shadow:inset_0_0_0_1px_oklch(0.66_0.250_283_/_0.18),inset_0_1px_0_oklch(1_0_0_/_0.055)]',
        )}
      />

      {/* ── Top-edge specular highlight ─────────────────────────────── */}
      <div
        className={cn(
          'absolute top-0 left-6 right-6 h-px z-20 pointer-events-none',
          'bg-gradient-to-r from-transparent via-white/70 to-transparent',
          'dark:via-white/12',
          'rounded-full',
        )}
      />

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div className="relative z-20">
        {children}
      </div>
    </Card>
  );
}
