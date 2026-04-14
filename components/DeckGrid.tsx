'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Clock, BookOpen, Play, FileText } from 'lucide-react';
import type { Deck } from '@/lib/types';
import { MasteryRing } from './MasteryChart';
import ProgressBar from './ui/ProgressBar';
import { formatRelativeDate, truncate } from '@/lib/utils';

interface DeckCardProps {
  deck: Deck;
  index?: number;
}

export function DeckCard({ deck, index = 0 }: DeckCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
    >
      <Link href={`/deck/${deck.id}`} className="block group">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-card hover:shadow-card-hover border border-gray-100 dark:border-gray-700 transition-all duration-200 h-full">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="font-serif text-lg text-gray-900 dark:text-gray-100 leading-snug group-hover:text-primary dark:group-hover:text-primary-300 transition-colors">
              {deck.title}
            </h3>
            <MasteryRing
              percentage={Math.round(deck.mastery_percentage)}
              size={48}
              strokeWidth={5}
            />
          </div>

          {/* Description */}
          {deck.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 font-sans mb-3 line-clamp-2">
              {truncate(deck.description, 100)}
            </p>
          )}

          {/* Progress bar */}
          <ProgressBar
            value={deck.mastery_percentage}
            size="sm"
            animated={false}
            className="mb-3"
          />

          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500 font-sans flex-wrap">
            <span className="flex items-center gap-1">
              <BookOpen size={12} />
              {deck.card_count} cards
            </span>
            {deck.last_studied_at && (
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {formatRelativeDate(deck.last_studied_at)}
              </span>
            )}
            {deck.source_filename && (
              <span className="flex items-center gap-1 truncate max-w-[120px]">
                <FileText size={12} />
                {deck.source_filename}
              </span>
            )}
          </div>

          {/* Footer */}
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-sans">
                {Math.round(deck.mastery_percentage)}% mastered
              </span>
              {(deck.due_count ?? 0) > 0 && (
                <span className="px-1.5 py-0.5 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-300 rounded-full text-xs font-medium font-sans">
                  {deck.due_count} due
                </span>
              )}
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-primary dark:text-primary-300 font-sans opacity-0 group-hover:opacity-100 transition-opacity">
              <Play size={12} />
              Open
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

interface DeckGridProps {
  decks: Deck[];
}

export default function DeckGrid({ decks }: DeckGridProps) {
  if (decks.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {decks.map((deck, i) => (
        <DeckCard key={deck.id} deck={deck} index={i} />
      ))}
    </div>
  );
}
