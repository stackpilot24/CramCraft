'use client';

import { motion } from 'framer-motion';
import { getMasteryColor } from '@/lib/utils';

interface MasteryRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export function MasteryRing({
  percentage,
  size = 80,
  strokeWidth = 8,
  label,
}: MasteryRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const color =
    percentage >= 80
      ? '#4CAF50'
      : percentage >= 50
      ? '#E6B566'
      : percentage >= 20
      ? '#D4994A'
      : '#E57373';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress arc */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            className={`text-sm font-bold font-sans ${getMasteryColor(percentage)}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {percentage}%
          </motion.span>
        </div>
      </div>
      {label && (
        <span className="text-xs text-gray-500 dark:text-gray-400 font-sans text-center">
          {label}
        </span>
      )}
    </div>
  );
}

interface MasteryChartProps {
  mastered: number;
  learning: number;
  newCards: number;
  total: number;
}

export function MasteryBreakdown({ mastered, learning, newCards, total }: MasteryChartProps) {
  if (total === 0) return null;

  const segments = [
    { label: 'Mastered', count: mastered, color: '#4CAF50' },
    { label: 'Learning', count: learning, color: '#E6B566' },
    { label: 'New', count: newCards, color: '#9CA3AF' },
  ];

  return (
    <div className="space-y-2">
      {segments.map((seg) => {
        const pct = total > 0 ? (seg.count / total) * 100 : 0;
        return (
          <div key={seg.label} className="flex items-center gap-3">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-sans w-16 flex-shrink-0">
              {seg.label}
            </span>
            <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: seg.color }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <span className="text-xs font-medium font-sans text-gray-700 dark:text-gray-300 w-8 text-right">
              {seg.count}
            </span>
          </div>
        );
      })}
    </div>
  );
}
