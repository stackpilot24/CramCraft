'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RotateCcw, Trophy, ThumbsDown, ThumbsUp, Keyboard } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useRouter } from 'next/navigation';
import FlashCard from './FlashCard';
import Button from './ui/Button';
import type { Card, Deck } from '@/lib/types';
import { QUALITY_MAP, formatInterval } from '@/lib/spaced-repetition';

interface StudySessionProps {
  deck: Deck;
  cards: Card[];
  backHref?: string;
}

const RATING_BUTTONS = [
  {
    key: 'again',
    label: 'Again',
    quality: QUALITY_MAP.again,
    bg: 'bg-red-500 hover:bg-red-600 active:bg-red-700',
    shortcut: '1',
    emoji: '✗',
    desc: 'Completely forgot',
  },
  {
    key: 'hard',
    label: 'Hard',
    quality: QUALITY_MAP.hard,
    bg: 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700',
    shortcut: '2',
    emoji: '~',
    desc: 'With difficulty',
  },
  {
    key: 'good',
    label: 'Good',
    quality: QUALITY_MAP.good,
    bg: 'bg-primary hover:bg-primary-700 active:bg-primary-800',
    shortcut: '3',
    emoji: '✓',
    desc: 'After hesitation',
  },
  {
    key: 'easy',
    label: 'Easy',
    quality: QUALITY_MAP.easy,
    bg: 'bg-green-500 hover:bg-green-600 active:bg-green-700',
    shortcut: '4',
    emoji: '★',
    desc: 'Perfect recall',
  },
] as const;

export default function StudySession({ deck, cards: initialCards, backHref }: StudySessionProps) {
  const router = useRouter();
  const [cards] = useState(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [results, setResults] = useState<Array<{ card: Card; quality: number; nextInterval: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const currentCard = cards[currentIndex];
  const progress = (currentIndex / cards.length) * 100;

  const handleFlip = useCallback(() => {
    if (!isSubmitting) setIsFlipped((f) => !f);
  }, [isSubmitting]);

  const handleRate = useCallback(
    (quality: number) => {
      if (!currentCard || !isFlipped || isSubmitting) return;
      setIsSubmitting(true);

      // Optimistic: move to next card immediately — save in background
      const cardId = currentCard.id;
      const newResult = { card: currentCard, quality, nextInterval: '…' };
      const newResults = [...results, newResult];

      if (currentIndex + 1 >= cards.length) {
        setResults(newResults);
        setIsComplete(true);
        const correct = newResults.filter((r) => r.quality >= 3).length;
        if (correct / newResults.length >= 0.6) {
          setTimeout(() => {
            confetti({
              particleCount: 120,
              spread: 80,
              origin: { y: 0.6 },
              colors: ['#E6B566', '#D4994A', '#C77DFF', '#FDF6EC', '#F5C85A'],
            });
          }, 300);
        }
      } else {
        setResults(newResults);
        setCurrentIndex((i) => i + 1);
        setIsFlipped(false);
      }

      setIsSubmitting(false);

      // Save review in the background — no await, no blocking
      fetch(`/api/cards/${cardId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quality }),
      })
        .then((r) => r.json())
        .then((data) => {
          // Update the interval display once we have the real value
          const interval = formatInterval(data.intervalDays ?? 0);
          setResults((prev) =>
            prev.map((r) => (r.card.id === cardId && r.nextInterval === '…' ? { ...r, nextInterval: interval } : r))
          );
        })
        .catch((err) => console.error('Failed to save review:', err));
    },
    [currentCard, currentIndex, cards.length, isFlipped, isSubmitting, results]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') { e.preventDefault(); handleFlip(); }
      if (isFlipped && !isSubmitting) {
        if (e.key === '1') handleRate(QUALITY_MAP.again);
        if (e.key === '2') handleRate(QUALITY_MAP.hard);
        if (e.key === '3') handleRate(QUALITY_MAP.good);
        if (e.key === '4') handleRate(QUALITY_MAP.easy);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isFlipped, isSubmitting, handleFlip, handleRate]);

  // ─── Session complete ─────────────────────────────────────────────────────

  if (isComplete) {
    const correct  = results.filter((r) => r.quality >= 3).length;
    const accuracy = Math.round((correct / results.length) * 100);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg mx-auto text-center py-12 px-4"
      >
        {/* Trophy */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
          className="w-24 h-24 rounded-3xl mx-auto mb-6 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #E6B566 0%, #D4994A 100%)' }}
        >
          <Trophy className="w-12 h-12 text-[#2C1810]" />
        </motion.div>

        <h2 className="text-3xl font-serif text-gray-900 dark:text-gray-100 mb-2">
          Session Complete!
        </h2>
        <p className="text-gray-500 dark:text-gray-400 font-sans mb-8">
          You reviewed{' '}
          <strong className="text-gray-700 dark:text-gray-300">{results.length} cards</strong> from{' '}
          <span className="text-gray-700 dark:text-gray-300">{deck.title}</span>
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4">
            <p className="text-2xl font-serif text-green-600 dark:text-green-400">{correct}</p>
            <p className="text-xs text-gray-500 font-sans mt-1">Correct</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4">
            <p className="text-2xl font-serif text-red-500">{results.length - correct}</p>
            <p className="text-xs text-gray-500 font-sans mt-1">Missed</p>
          </div>
          <div className="rounded-2xl p-4" style={{ background: 'rgba(230,181,102,0.12)' }}>
            <p className="text-2xl font-serif text-primary dark:text-primary-300">{accuracy}%</p>
            <p className="text-xs text-gray-500 font-sans mt-1">Accuracy</p>
          </div>
        </div>

        {/* Accuracy bar */}
        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-8">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #E6B566, #D4994A)' }}
            initial={{ width: 0 }}
            animate={{ width: `${accuracy}%` }}
            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          />
        </div>

        {/* Card review list */}
        <div className="text-left space-y-2 mb-8 max-h-52 overflow-y-auto">
          {results.map((r, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800"
            >
              <p className="text-xs text-gray-700 dark:text-gray-300 font-sans truncate flex-1 mr-2">
                {r.card.front}
              </p>
              <div className="flex items-center gap-2 flex-shrink-0">
                {r.quality >= 3 ? (
                  <ThumbsUp size={12} className="text-green-500" />
                ) : (
                  <ThumbsDown size={12} className="text-red-400" />
                )}
                <span className="text-xs text-gray-400 font-sans">{r.nextInterval}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => router.push(backHref ?? `/deck/${deck.id}`)} className="flex-1">
            <ArrowLeft size={16} />
            Back to deck
          </Button>
          <Button
            onClick={() => {
              setCurrentIndex(0);
              setIsFlipped(false);
              setIsComplete(false);
              setResults([]);
            }}
            className="flex-1"
          >
            <RotateCcw size={16} />
            Study again
          </Button>
        </div>
      </motion.div>
    );
  }

  if (!currentCard) return null;

  // ─── Active session ───────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => router.push(backHref ?? `/deck/${deck.id}`)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 font-sans transition-colors"
        >
          <ArrowLeft size={16} />
          {deck.title}
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400 font-sans">
            {currentIndex + 1} / {cards.length}
          </span>
          <button
            onClick={() => setShowShortcuts((s) => !s)}
            className="p-1.5 rounded-lg text-gray-300 hover:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Keyboard shortcuts"
          >
            <Keyboard size={15} />
          </button>
        </div>
      </div>

      {/* Keyboard shortcut hint */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-xs font-sans text-gray-500 dark:text-gray-400 flex flex-wrap gap-x-6 gap-y-1"
          >
            <span><kbd className="font-mono bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600">Space</kbd> — flip card</span>
            <span><kbd className="font-mono bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600">1</kbd> Again &nbsp;
                  <kbd className="font-mono bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600">2</kbd> Hard &nbsp;
                  <kbd className="font-mono bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600">3</kbd> Good &nbsp;
                  <kbd className="font-mono bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600">4</kbd> Easy</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Segmented progress bar */}
      <div className="flex gap-1 mb-8">
        {cards.map((_, i) => (
          <div
            key={i}
            className="flex-1 h-1.5 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700"
          >
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #E6B566, #D4994A)' }}
              initial={{ width: 0 }}
              animate={{ width: i < currentIndex ? '100%' : i === currentIndex ? '50%' : '0%' }}
              transition={{ duration: 0.3 }}
            />
          </div>
        ))}
      </div>

      {/* Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentCard.id}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.2 }}
        >
          <FlashCard
            card={currentCard}
            isFlipped={isFlipped}
            onFlip={handleFlip}
            cardNumber={currentIndex + 1}
            totalCards={cards.length}
          />
        </motion.div>
      </AnimatePresence>

      {/* Flip hint */}
      {!isFlipped && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-gray-400 dark:text-gray-500 font-sans mt-5"
        >
          Tap card or press{' '}
          <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono border border-gray-200 dark:border-gray-700">
            Space
          </kbd>{' '}
          to reveal
        </motion.p>
      )}

      {/* Rating buttons */}
      <AnimatePresence>
        {isFlipped && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="mt-6"
          >
            <p className="text-center text-xs text-gray-400 font-sans mb-3 uppercase tracking-wide">
              How well did you know this?
            </p>
            <div className="grid grid-cols-4 gap-2">
              {RATING_BUTTONS.map((btn) => (
                <button
                  key={btn.key}
                  onClick={() => handleRate(btn.quality)}
                  disabled={isSubmitting}
                  className={`${btn.bg} text-white rounded-2xl py-3 px-2 text-center font-sans transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed select-none`}
                >
                  <div className="text-base mb-0.5">{btn.emoji}</div>
                  <div className="text-sm font-bold leading-none">{btn.label}</div>
                  <div className="text-xs opacity-60 mt-1 hidden sm:block leading-tight">{btn.desc}</div>
                  <div className="text-xs opacity-50 mt-0.5 font-mono">[{btn.shortcut}]</div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress indicator */}
      <div className="mt-6 text-center">
        <span className="text-xs text-gray-300 dark:text-gray-600 font-sans">
          {Math.round(progress)}% complete ·{' '}
          {cards.length - currentIndex} card{cards.length - currentIndex !== 1 ? 's' : ''} remaining
        </span>
      </div>
    </div>
  );
}
