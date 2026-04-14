'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Plus, Upload, BookOpen, Flame, Trophy, Home } from 'lucide-react';
import DeckGrid from '@/components/DeckGrid';
import SearchBar from '@/components/SearchBar';
import Button from '@/components/ui/Button';
import { DeckCardSkeleton } from '@/components/ui/Skeleton';
import type { Deck, StreakData } from '@/lib/types';

type SortKey = 'recent' | 'mastery' | 'name' | 'due';

const sortOptions: { key: SortKey; label: string }[] = [
  { key: 'recent', label: 'Recent' },
  { key: 'due', label: 'Due' },
  { key: 'mastery', label: 'Mastery' },
  { key: 'name', label: 'Name' },
];

export default function DashboardPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('recent');
  const [streak, setStreak] = useState<StreakData | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/decks').then((r) => r.json()),
      fetch('/api/stats').then((r) => r.json()).catch(() => null),
    ]).then(([decksData, statsData]) => {
      setDecks(decksData);
      if (statsData?.streak) setStreak(statsData.streak);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = decks
    .filter(
      (d) =>
        d.title.toLowerCase().includes(search.toLowerCase()) ||
        (d.description?.toLowerCase().includes(search.toLowerCase()) ?? false)
    )
    .sort((a, b) => {
      if (sort === 'mastery') return b.mastery_percentage - a.mastery_percentage;
      if (sort === 'name') return a.title.localeCompare(b.title);
      if (sort === 'due') return (b.due_count ?? 0) - (a.due_count ?? 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const totalCards = decks.reduce((s, d) => s + d.card_count, 0);
  const avgMastery =
    decks.length > 0
      ? Math.round(decks.reduce((s, d) => s + d.mastery_percentage, 0) / decks.length)
      : 0;

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-primary dark:hover:text-primary-300 font-sans mb-2 transition-colors"
          >
            <Home size={12} />
            Dashboard
          </Link>
          <h1 className="text-3xl font-serif text-gray-900 dark:text-gray-100">Your Library</h1>
          {!loading && decks.length > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 font-sans mt-1">
              {decks.length} deck{decks.length !== 1 ? 's' : ''} · {totalCards} cards
            </p>
          )}
        </div>
        <Link href="/upload">
          <Button size="md" className="gap-2 flex-shrink-0">
            <Plus size={16} />
            New Deck
          </Button>
        </Link>
      </div>

      {/* Stats bar */}
      {!loading && decks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-card border border-gray-100 dark:border-gray-700 flex items-center gap-3">
            <BookOpen size={20} className="text-blue-500" />
            <div>
              <p className="text-xl font-serif text-gray-900 dark:text-gray-100">{decks.length}</p>
              <p className="text-xs text-gray-500 font-sans">Decks</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-card border border-gray-100 dark:border-gray-700 flex items-center gap-3">
            <Trophy size={20} className="text-amber-500" />
            <div>
              <p className="text-xl font-serif text-gray-900 dark:text-gray-100">{avgMastery}%</p>
              <p className="text-xs text-gray-500 font-sans">Avg. Mastery</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-card border border-gray-100 dark:border-gray-700 flex items-center gap-3">
            <BookOpen size={20} className="text-green-500" />
            <div>
              <p className="text-xl font-serif text-gray-900 dark:text-gray-100">{totalCards}</p>
              <p className="text-xs text-gray-500 font-sans">Total Cards</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-card border border-gray-100 dark:border-gray-700 flex items-center gap-3">
            <Flame size={20} className="text-orange-500" />
            <div>
              <p className="text-xl font-serif text-gray-900 dark:text-gray-100">
                {streak?.currentStreak ?? 0}
              </p>
              <p className="text-xs text-gray-500 font-sans">Day Streak</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Search & sort */}
      {!loading && decks.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <SearchBar
            value={search}
            onChange={setSearch}
            className="flex-1"
          />
          <div className="flex gap-2">
            {sortOptions.map((o) => (
              <button
                key={o.key}
                onClick={() => setSort(o.key)}
                className={`px-3 py-2 rounded-xl text-sm font-medium font-sans transition-colors ${
                  sort === o.key
                    ? 'bg-primary text-[#2C1810]'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-primary/40'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <DeckCardSkeleton key={i} />
          ))}
        </div>
      ) : decks.length === 0 ? (
        /* Empty state */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="w-24 h-24 rounded-3xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-6">
            <Upload size={40} className="text-gray-300 dark:text-gray-600" />
          </div>
          <h2 className="text-2xl font-serif text-gray-900 dark:text-gray-100 mb-2">
            Your library is empty
          </h2>
          <p className="text-gray-500 dark:text-gray-400 font-sans mb-8 max-w-sm mx-auto">
            Drop your first PDF to start learning. The AI will generate a full
            deck of flashcards in seconds.
          </p>
          <Link href="/upload">
            <Button size="lg" className="mx-auto">
              <Upload size={18} />
              Upload a PDF
            </Button>
          </Link>
        </motion.div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 font-sans">
            No decks match &ldquo;{search}&rdquo;
          </p>
          <button
            onClick={() => setSearch('')}
            className="mt-2 text-sm text-primary dark:text-primary-300 hover:underline font-sans"
          >
            Clear search
          </button>
        </div>
      ) : (
        <DeckGrid decks={filtered} />
      )}
    </div>
  );
}
