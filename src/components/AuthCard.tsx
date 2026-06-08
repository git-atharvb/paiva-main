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
        // Animated conic border on hover
        'conic-border',
      )}
    >
      {/* ── Animated gradient sheen on hover ────────────────────────── */}
      <div
        className={cn(
          'absolute inset-0 z-10 pointer-events-none',
          'bg-gradient-to-br from-white/25 via-primary/4 to-transparent',
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
          '[box-shadow:inset_0_0_0_1px_oklch(from_var(--color-ring)_l_c_h_/_0.15),inset_0_1px_0_oklch(1_0_0_/_0.05)]',
        )}
      />

      {/* ── Top-edge specular highlight — broader, softer glow ────── */}
      <div
        className={cn(
          'absolute top-0 left-8 right-8 h-[2px] z-20 pointer-events-none',
          'bg-gradient-to-r from-transparent via-white/60 to-transparent',
          'dark:via-white/10',
          'rounded-full blur-[0.5px]',
        )}
      />

      {/* ── Bottom-edge subtle reflection ─────────────────────────── */}
      <div
        className={cn(
          'absolute bottom-0 left-12 right-12 h-px z-20 pointer-events-none',
          'bg-gradient-to-r from-transparent via-primary/15 to-transparent',
          'dark:via-primary/10',
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
