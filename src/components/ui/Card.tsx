import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, elevated, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl border border-white/20 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-3xl overflow-hidden',
          elevated ? 'shadow-2xl dark:shadow-[0_20px_40px_rgba(0,0,0,0.8),0_0_40px_rgba(139,92,246,0.15)]' : 'shadow-xl',
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';
