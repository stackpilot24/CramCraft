'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Card, StudyCardResult } from '@/lib/types';

interface StudyState {
  // Session state
  deckId: string | null;
  cards: Card[];
  currentIndex: number;
  isFlipped: boolean;
  results: StudyCardResult[];
  sessionStarted: boolean;
  sessionComplete: boolean;

  // Actions
  startSession: (deckId: string, cards: Card[]) => void;
  flipCard: () => void;
  submitReview: (quality: number) => void;
  nextCard: () => void;
  resetSession: () => void;
  setSessionComplete: (val: boolean) => void;
}

export const useStudyStore = create<StudyState>()(
  persist(
    (set, get) => ({
      deckId: null,
      cards: [],
      currentIndex: 0,
      isFlipped: false,
      results: [],
      sessionStarted: false,
      sessionComplete: false,

      startSession: (deckId, cards) =>
        set({
          deckId,
          cards,
          currentIndex: 0,
          isFlipped: false,
          results: [],
          sessionStarted: true,
          sessionComplete: false,
        }),

      flipCard: () => set((s) => ({ isFlipped: !s.isFlipped })),

      submitReview: (quality) => {
        const { cards, currentIndex, results } = get();
        const card = cards[currentIndex];
        if (!card) return;

        const newResult: StudyCardResult = { cardId: card.id, quality };
        set({ results: [...results, newResult] });
      },

      nextCard: () => {
        const { currentIndex, cards } = get();
        if (currentIndex + 1 >= cards.length) {
          set({ sessionComplete: true, isFlipped: false });
        } else {
          set({ currentIndex: currentIndex + 1, isFlipped: false });
        }
      },

      resetSession: () =>
        set({
          deckId: null,
          cards: [],
          currentIndex: 0,
          isFlipped: false,
          results: [],
          sessionStarted: false,
          sessionComplete: false,
        }),

      setSessionComplete: (val) => set({ sessionComplete: val }),
    }),
    {
      name: 'cramcraft-study-session',
      // Only persist lightweight data, not full card objects
      partialize: (state) => ({
        deckId: state.deckId,
        currentIndex: state.currentIndex,
        results: state.results,
        sessionStarted: state.sessionStarted,
      }),
    }
  )
);

// Theme store
interface ThemeState {
  isDark: boolean;
  toggle: () => void;
  setDark: (val: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDark: false,
      toggle: () => set((s) => ({ isDark: !s.isDark })),
      setDark: (val) => set({ isDark: val }),
    }),
    { name: 'cramcraft-theme' }
  )
);
