import React from 'react';
import { Card } from './ui/Card';

export default function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <Card elevated className="w-full max-w-[480px] p-8 md:p-12 relative overflow-hidden group shadow-premium dark:shadow-premium-dark border border-black/5 dark:border-white/10">
      {/* Subtle hover gradient effect on the card */}
      <div className="absolute inset-0 bg-linear-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none mix-blend-overlay" />
      <div className="relative z-10">
        {children}
      </div>
    </Card>
  );
}
