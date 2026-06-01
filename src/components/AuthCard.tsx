import React from 'react';
import { Card } from './ui/Card';

export default function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <Card elevated className="w-full max-w-[480px] p-8 md:p-12 relative overflow-hidden group shadow-premium dark:shadow-premium-dark border border-white/20 dark:border-white/10 bg-white/70 dark:bg-black/60 backdrop-blur-3xl">
      {/* Subtle hover gradient effect on the card */}
      <div className="absolute inset-0 bg-linear-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none mix-blend-overlay z-10" />
      <div className="relative z-20">
        {children}
      </div>
    </Card>
  );
}
