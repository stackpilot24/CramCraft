'use client';

import { motion } from 'framer-motion';
import type { NoteCardCategory, GeneratedNoteCard } from '@/lib/types';

// Category colour config
const categoryConfig: Record<
  NoteCardCategory,
  { label: string; headerBg: string; headerText: string; accent: string; dotBg: string; badge: string }
> = {
  overview: {
    label: 'Overview',
    headerBg: 'bg-[#2C1810]',
    headerText: 'text-[#FDF6EC]',
    accent: 'border-gray-200 dark:border-gray-700',
    dotBg: 'bg-primary',
    badge: 'bg-primary/15 dark:bg-primary/20 text-[#2C1810] dark:text-primary-300',
  },
  definition: {
    label: 'Definition',
    headerBg: 'bg-violet-600',
    headerText: 'text-white',
    accent: 'border-violet-200 dark:border-violet-800',
    dotBg: 'bg-violet-500',
    badge: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
  },
  process: {
    label: 'Process',
    headerBg: 'bg-sky-600',
    headerText: 'text-white',
    accent: 'border-sky-200 dark:border-sky-800',
    dotBg: 'bg-sky-500',
    badge: 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300',
  },
  important: {
    label: 'Important',
    headerBg: 'bg-rose-600',
    headerText: 'text-white',
    accent: 'border-rose-200 dark:border-rose-800',
    dotBg: 'bg-rose-500',
    badge: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300',
  },
  formula: {
    label: 'Formula',
    headerBg: 'bg-emerald-600',
    headerText: 'text-white',
    accent: 'border-emerald-200 dark:border-emerald-800',
    dotBg: 'bg-emerald-500',
    badge: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
  },
  remember: {
    label: 'Remember',
    headerBg: 'bg-amber-500',
    headerText: 'text-white',
    accent: 'border-amber-200 dark:border-amber-800',
    dotBg: 'bg-amber-500',
    badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  },
  example: {
    label: 'Example',
    headerBg: 'bg-teal-600',
    headerText: 'text-white',
    accent: 'border-teal-200 dark:border-teal-800',
    dotBg: 'bg-teal-500',
    badge: 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300',
  },
};

interface NoteCardProps {
  index: number;
  title: string;
  key_points: string[];
  example?: string | null;
  category: NoteCardCategory;
  animate?: boolean;
}

export default function NoteCardDisplay({
  index,
  title,
  key_points,
  example,
  category,
  animate = true,
}: NoteCardProps) {
  const cfg = categoryConfig[category] ?? categoryConfig.overview;

  const inner = (
    <div className={`rounded-2xl overflow-hidden border ${cfg.accent} shadow-card bg-white dark:bg-gray-800 h-full flex flex-col`}>
      {/* Coloured header */}
      <div className={`${cfg.headerBg} px-4 py-3 flex items-center justify-between gap-2`}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {index + 1}
          </span>
          <h3 className={`font-serif font-semibold text-sm sm:text-base ${cfg.headerText} truncate`}>
            {title}
          </h3>
        </div>
        <span className={`text-xs font-sans px-2 py-0.5 rounded-full bg-white/20 ${cfg.headerText} flex-shrink-0`}>
          {cfg.label}
        </span>
      </div>

      {/* Key points */}
      <div className="px-4 py-3 flex-1">
        <ul className="space-y-2">
          {key_points.map((point, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotBg} flex-shrink-0 mt-1.5`} />
              <span className="text-sm font-sans text-gray-700 dark:text-gray-300 leading-snug">
                {point}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Example / Remember */}
      {example && (
        <div className={`mx-3 mb-3 px-3 py-2 rounded-xl ${cfg.badge} border ${cfg.accent}`}>
          <p className="text-xs font-sans leading-relaxed">{example}</p>
        </div>
      )}
    </div>
  );

  if (!animate) return inner;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="h-full"
    >
      {inner}
    </motion.div>
  );
}

// Version for generated (preview) note cards
export function GeneratedNoteCardDisplay({
  index,
  card,
}: {
  index: number;
  card: GeneratedNoteCard;
}) {
  return (
    <NoteCardDisplay
      index={index}
      title={card.title}
      key_points={card.key_points}
      example={card.example}
      category={card.category}
    />
  );
}
