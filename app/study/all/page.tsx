'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Play, CheckCircle, ArrowLeft, BookOpen, Layers } from 'lucide-react';
import StudySession from '@/components/StudySession';
import Button from '@/components/ui/Button';
import type { Card, Deck } from '@/lib/types';

interface DueCard extends Card {
  deck_title: string;
}

function groupByDeck(cards: DueCard[]): { title: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const c of cards) {
    counts[c.deck_title] = (counts[c.deck_title] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([title, count]) => ({ title, count }))
    .sort((a, b) => b.count - a.count);
}

export default function StudyAllPage() {
  const router = useRouter();
  const [dueCards, setDueCards] = useState<DueCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    fetch('/api/cards/due')
      .then((r) => r.json())
      .then((data: DueCard[]) => setDueCards(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  // Synthetic deck for StudySession display
  const syntheticDeck: Deck = {
    id: 'all',
    title: 'All Due Cards',
    description: null,
    source_filename: null,
    card_count: dueCards.length,
    mastery_percentage: 0,
    created_at: new Date().toISOString(),
    last_studied_at: null,
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400 font-sans text-sm">Loading due cards…</p>
      </div>
    );
  }

  // ── All caught up ─────────────────────────────────────────────────────────────
  if (dueCards.length === 0) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center px-4">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #E6B566 0%, #D4994A 100%)' }}
        >
          <CheckCircle className="w-10 h-10 text-[#2C1810]" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="text-3xl font-serif text-gray-900 dark:text-gray-100 mb-2">All caught up!</h2>
          <p className="text-gray-500 dark:text-gray-400 font-sans mb-8 max-w-xs mx-auto">
            No cards are due for review right now. Come back later or study any deck manually.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="ghost" onClick={() => router.push('/')} className="gap-2">
              <ArrowLeft size={15} />
              Dashboard
            </Button>
            <Button onClick={() => router.push('/dashboard')} className="gap-2">
              <BookOpen size={15} />
              Browse decks
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Session active ────────────────────────────────────────────────────────────
  if (started) {
    return <StudySession deck={syntheticDeck} cards={dueCards as Card[]} backHref="/" />;
  }

  // ── Pre-session preview ────────────────────────────────────────────────────────
  const groups = groupByDeck(dueCards);

  return (
    <div className="max-w-lg mx-auto py-12 px-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        {/* Icon */}
        <div className="text-center mb-8">
          <div
            className="w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, #E6B566 0%, #D4994A 100%)' }}
          >
            <Layers className="w-10 h-10 text-[#2C1810]" />
          </div>
          <h1 className="text-3xl font-serif text-gray-900 dark:text-gray-100 mb-2">
            {dueCards.length} cards due
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-sans text-sm">
            Across {groups.length} deck{groups.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Deck breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-card overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 font-sans uppercase tracking-wide">
              Cards by deck
            </p>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {groups.map((g) => (
              <div key={g.title} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <BookOpen size={14} className="text-primary dark:text-primary-300" />
                  </div>
                  <p className="text-sm font-serif text-gray-900 dark:text-gray-100 truncate">{g.title}</p>
                </div>
                <span className="text-sm font-medium text-primary dark:text-primary-300 font-sans flex-shrink-0 ml-3">
                  {g.count} {g.count === 1 ? 'card' : 'cards'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Info note */}
        <p className="text-xs text-gray-400 dark:text-gray-500 font-sans text-center mb-6">
          Cards are sorted by urgency — overdue cards first, then hardest cards.
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => router.push('/')} className="gap-2">
            <ArrowLeft size={15} />
            Back
          </Button>
          <Button onClick={() => setStarted(true)} size="lg" className="flex-1 gap-2">
            <Play size={17} />
            Start session
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
