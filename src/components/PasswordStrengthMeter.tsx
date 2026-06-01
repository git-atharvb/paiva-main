import React from 'react';
import zxcvbn from 'zxcvbn';
import { cn } from '../lib/utils';

interface PasswordStrengthMeterProps {
  password?: string;
}

const SCORE_CONFIG = [
  { label: 'Very Weak', color: 'oklch(0.58 0.22 25)',  tailwindText: 'text-red-500 dark:text-red-400' },
  { label: 'Weak',      color: 'oklch(0.60 0.20 35)',  tailwindText: 'text-orange-500 dark:text-orange-400' },
  { label: 'Fair',      color: 'oklch(0.72 0.17 85)',  tailwindText: 'text-yellow-500 dark:text-yellow-300' },
  { label: 'Good',      color: 'oklch(0.62 0.20 155)', tailwindText: 'text-emerald-500 dark:text-emerald-400' },
  { label: 'Strong',    color: 'oklch(0.60 0.22 150)', tailwindText: 'text-green-500 dark:text-green-400' },
] as const;

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password = '' }) => {
  const result = zxcvbn(password);
  const score  = result.score as 0 | 1 | 2 | 3 | 4;
  const config = SCORE_CONFIG[score];

  const barWidth = password.length === 0 ? '0%' : `${(score + 1) * 20}%`;

  return (
    <div className="mt-1.5 mb-5 w-full">
      {/* Track */}
      <div className="w-full h-1 bg-border/60 dark:bg-border/40 rounded-full overflow-hidden">
        {/* Fill bar */}
        <div
          className="h-full rounded-full transition-all duration-500 ease-bounce-soft"
          style={{
            width:      barWidth,
            background: config.color,
            boxShadow:  password.length > 0
              ? `0 0 8px ${config.color}80`
              : 'none',
          }}
        />
      </div>

      {/* Label */}
      {password && (
        <div className="flex justify-end mt-1.5 animate-in fade-in duration-200">
          <span className={cn('text-caption font-bold tracking-wider', config.tailwindText)}>
            {config.label}
          </span>
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthMeter;
