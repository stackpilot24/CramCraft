'use client';

import { cn, getMasteryBg } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  showLabel?: boolean;
  color?: 'mastery' | 'primary' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export default function ProgressBar({
  value,
  className,
  showLabel = false,
  color = 'mastery',
  size = 'md',
  animated = true,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value));

  const trackSizes = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };
  const barColor =
    color === 'mastery'
      ? getMasteryBg(pct)
      : color === 'accent'
      ? 'bg-accent'
      : 'bg-primary';

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'w-full rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700',
          trackSizes[size]
        )}
      >
        {animated ? (
          <motion.div
            className={cn('h-full rounded-full', barColor)}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        ) : (
          <div
            className={cn('h-full rounded-full transition-all', barColor)}
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
      {showLabel && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-sans">
          {pct}% mastered
        </p>
      )}
    </div>
  );
}
