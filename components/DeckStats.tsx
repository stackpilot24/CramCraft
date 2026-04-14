'use client';

import { motion } from 'framer-motion';
import { BookOpen, CheckCircle2, Clock, Flame, Star } from 'lucide-react';
import type { DeckStats } from '@/lib/types';

interface DeckStatsProps {
  stats: DeckStats;
}

export default function DeckStats({ stats }: DeckStatsProps) {
  const items = [
    {
      label: 'Total Cards',
      value: stats.total,
      icon: BookOpen,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Mastered',
      value: stats.mastered,
      icon: Star,
      color: 'text-green-500',
      bg: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      label: 'Learning',
      value: stats.learning,
      icon: CheckCircle2,
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
    },
    {
      label: 'Due Today',
      value: stats.dueToday,
      icon: Clock,
      color: 'text-red-500',
      bg: 'bg-red-50 dark:bg-red-900/20',
    },
    {
      label: 'New',
      value: stats.new,
      icon: Flame,
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`rounded-xl p-4 ${item.bg} border border-transparent`}
          >
            <Icon size={18} className={`${item.color} mb-2`} />
            <p className="text-2xl font-serif text-gray-900 dark:text-gray-100">
              {item.value}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-sans mt-0.5">
              {item.label}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
