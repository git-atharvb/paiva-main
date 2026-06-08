import React from 'react';
import zxcvbn from 'zxcvbn';
import { cn } from '../lib/utils';

interface PasswordStrengthMeterProps {
  password?: string;
}

const SCORE_CONFIG = [
  { label: 'Very Weak', color: 'oklch(0.57 0.23 22)',   tailwindText: 'text-red-500 dark:text-red-400' },
  { label: 'Weak',      color: 'oklch(0.62 0.20 35)',   tailwindText: 'text-orange-500 dark:text-orange-400' },
  { label: 'Fair',      color: 'oklch(0.75 0.18 75)',    tailwindText: 'text-yellow-500 dark:text-yellow-300' },
  { label: 'Good',      color: 'oklch(0.62 0.19 155)',   tailwindText: 'text-emerald-500 dark:text-emerald-400' },
  { label: 'Strong',    color: 'oklch(0.62 0.20 150)',   tailwindText: 'text-green-500 dark:text-green-400' },
] as const;

const SEGMENT_COUNT = 5;

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password = '' }) => {
  const result = zxcvbn(password);
  const score  = result.score as 0 | 1 | 2 | 3 | 4;
  const config = SCORE_CONFIG[score];
  const filledSegments = password.length === 0 ? 0 : score + 1;

  return (
    <div className="mt-1.5 mb-5 w-full">
      {/* Segmented bar */}
      <div className="flex gap-1.5 w-full">
        {Array.from({ length: SEGMENT_COUNT }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-1.5 rounded-full overflow-hidden bg-border/50 dark:bg-border/30"
          >
            <div
              className="h-full rounded-full transition-all duration-500 ease-bounce-soft"
              style={{
                width:       i < filledSegments ? '100%' : '0%',
                background:  config.color,
                boxShadow:   i < filledSegments
                  ? `0 0 8px ${config.color}60`
                  : 'none',
                transitionDelay: `${i * 60}ms`,
              }}
            />
          </div>
        ))}
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
