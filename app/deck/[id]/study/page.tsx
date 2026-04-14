'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { BookOpen, Clock } from 'lucide-react';
import StudySession from '@/components/StudySession';
import { CardSkeleton } from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import type { Card, Deck } from '@/lib/types';

export default function StudyPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') ?? 'due';

  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/study/${id}?mode=${mode}`)
      .then(async (r) => {
        if (!r.ok) throw new Error('Failed to load study session');
        return r.json();
      })
      .then(({ deck, cards }) => {
        setDeck(deck);
        setCards(cards);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, mode]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <CardSkeleton />
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="text-center py-20">
        <p className="text-danger font-sans mb-4">{error ?? 'Deck not found.'}</p>
        <Link href="/dashboard">
          <Button variant="ghost">Back to library</Button>
        </Link>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-sm mx-auto text-center py-20"
      >
        <div className="w-20 h-20 rounded-3xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-6">
          <Clock size={36} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-serif text-gray-900 dark:text-gray-100 mb-2">
          Nothing due today!
        </h2>
        <p className="text-gray-500 dark:text-gray-400 font-sans mb-6 text-sm">
          All cards in <strong className="text-gray-700 dark:text-gray-300">{deck.title}</strong>{' '}
          are scheduled for a future date. Come back later, or study all cards now.
        </p>
        <div className="flex flex-col gap-3">
          <Link href={`/deck/${id}/study?mode=all`}>
            <Button className="w-full gap-2">
              <BookOpen size={16} />
              Study all {deck.card_count} cards
            </Button>
          </Link>
          <Link href={`/deck/${id}`}>
            <Button variant="ghost" className="w-full">
              Back to deck
            </Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="bg-background dark:bg-gray-950 min-h-[calc(100vh-64px)]">
      <StudySession deck={deck} cards={cards} />
    </div>
  );
}
