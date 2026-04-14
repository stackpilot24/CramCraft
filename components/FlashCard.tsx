'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Lightbulb, BookOpen, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import Badge from './ui/Badge';
import type { Card, RichFlashcardBack } from '@/lib/types';

// Parse card.back which may be a plain string or a JSON-encoded RichFlashcardBack
function parseBack(back: string): RichFlashcardBack {
  if (!back) return { answer: '' };
  try {
    const parsed = JSON.parse(back);
    if (parsed && typeof parsed === 'object' && parsed.answer) {
      return parsed as RichFlashcardBack;
    }
  } catch {
    // Not JSON — treat as plain text answer
  }
  return { answer: back };
}

function parseBold(text: string): React.ReactNode {
  if (!text) return null;
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-white">
        {part}
      </strong>
    ) : (
      part
    )
  );
}

interface FlashCardProps {
  card: Card;
  isFlipped: boolean;
  onFlip: () => void;
  cardNumber?: number;
  totalCards?: number;
}

export default function FlashCard({
  card,
  isFlipped,
  onFlip,
  cardNumber,
  totalCards,
}: FlashCardProps) {
  const [rotateY, setRotateY] = useState(0);
  const rich = parseBack(card.back);

  useEffect(() => {
    setRotateY(isFlipped ? 180 : 0);
  }, [isFlipped]);

  return (
    <div
      className="w-full max-w-2xl mx-auto cursor-pointer select-none"
      style={{ perspective: '1200px' }}
      onClick={onFlip}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          onFlip();
        }
      }}
      aria-label={isFlipped ? 'Card back - click to flip to front' : 'Card front - click to flip'}
    >
      <motion.div
        className="relative w-full"
        style={{
          transformStyle: 'preserve-3d',
          height: '400px',
        }}
        animate={{ rotateY }}
        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Front */}
        <div
          className={cn(
            'absolute inset-0 w-full rounded-3xl bg-white dark:bg-gray-800 shadow-card-lg border border-gray-200 dark:border-gray-700 flex flex-col',
            'backface-hidden'
          )}
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Fixed header */}
          <div className="flex items-center justify-between px-8 pt-7 pb-3 flex-shrink-0">
            <Badge variant={card.card_type as Parameters<typeof Badge>[0]['variant']} />
            {cardNumber && totalCards && (
              <span className="text-xs text-gray-400 font-sans">
                {cardNumber} / {totalCards}
              </span>
            )}
          </div>

          {/* Scrollable question area */}
          <div
            className="flex-1 overflow-y-auto flex items-center justify-center px-8 py-2 scrollbar-thin"
            onClick={(e) => e.stopPropagation()}
            style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(156,163,175,0.4) transparent' }}
          >
            <p className="text-xl md:text-2xl font-serif text-center text-gray-900 dark:text-gray-100 leading-relaxed w-full">
              {card.front}
            </p>
          </div>

          {/* Fixed footer */}
          <div className="flex items-center justify-center px-8 pt-3 pb-6 gap-2 text-gray-400 flex-shrink-0">
            <RotateCcw size={14} />
            <span className="text-xs font-sans">Tap to reveal answer</span>
          </div>
        </div>

        {/* Back */}
        <div
          className={cn(
            'absolute inset-0 w-full rounded-3xl shadow-card-lg flex flex-col',
            'backface-hidden'
          )}
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: 'linear-gradient(135deg, #4A2C20 0%, #2C1810 100%)',
          }}
        >
          {/* Fixed header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-3 flex-shrink-0">
            <Badge
              variant={card.card_type as Parameters<typeof Badge>[0]['variant']}
              className="bg-white/20 text-white border-none"
            />
            {cardNumber && totalCards && (
              <span className="text-xs text-white/60 font-sans">
                {cardNumber} / {totalCards}
              </span>
            )}
          </div>

          {/* Scrollable answer + rich details */}
          <div
            className="flex-1 overflow-y-auto px-6 py-2"
            onClick={(e) => e.stopPropagation()}
            style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.3) transparent' }}
          >
            <p className="text-lg md:text-xl font-sans text-center text-white leading-relaxed mb-4">
              {parseBold(rich.answer)}
            </p>

            {(rich.explanation || rich.mnemonic || rich.examTip || rich.keyFormula) && (
              <div className="space-y-2 pb-2">
                {rich.keyFormula && (
                  <div className="bg-white/15 rounded-xl px-3 py-2 flex items-start gap-2">
                    <Star size={13} className="text-yellow-300 mt-0.5 flex-shrink-0" />
                    <p className="text-xs font-mono text-white/90 leading-relaxed">{rich.keyFormula}</p>
                  </div>
                )}
                {rich.explanation && (
                  <div className="bg-white/10 rounded-xl px-3 py-2 flex items-start gap-2">
                    <BookOpen size={13} className="text-white/60 mt-0.5 flex-shrink-0" />
                    <p className="text-xs font-sans text-white/80 leading-relaxed">{parseBold(rich.explanation)}</p>
                  </div>
                )}
                {rich.mnemonic && (
                  <div className="bg-white/10 rounded-xl px-3 py-2 flex items-start gap-2">
                    <span className="text-xs flex-shrink-0 mt-0.5">🧠</span>
                    <p className="text-xs font-sans text-white/80 italic leading-relaxed">{rich.mnemonic}</p>
                  </div>
                )}
                {rich.examTip && (
                  <div className="bg-yellow-400/20 rounded-xl px-3 py-2 flex items-start gap-2">
                    <Lightbulb size={13} className="text-yellow-300 mt-0.5 flex-shrink-0" />
                    <p className="text-xs font-sans text-yellow-100 leading-relaxed">{rich.examTip}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Fixed footer */}
          <div className="flex items-center justify-center px-6 pt-3 pb-6 gap-2 text-white/50 flex-shrink-0">
            <RotateCcw size={14} />
            <span className="text-xs font-sans">Tap to see question</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Static preview card (not interactive — for deck list pages)
export function FlashCardPreview({ card }: { card: Pick<Card, 'front' | 'back' | 'card_type'> }) {
  const rich = parseBack(card.back);
  return (
    <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4 shadow-card">
      <div className="flex items-center gap-2 mb-2">
        <Badge variant={card.card_type as Parameters<typeof Badge>[0]['variant']} />
      </div>
      <p className="text-sm font-serif text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
        {card.front}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 font-sans line-clamp-2">
        {rich.answer}
      </p>
    </div>
  );
}
