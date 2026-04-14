import { NextRequest, NextResponse } from 'next/server';
import { getDeckById, getCardsDueForReview, getCardsByDeckId } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';
import type { Card } from '@/lib/types';

type DeckRow = { user_id: string };

export async function GET(
  request: NextRequest,
  { params }: { params: { deckId: string } }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const deck = await getDeckById(params.deckId) as unknown as DeckRow | null;
    if (!deck) return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    if (deck.user_id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') ?? 'due';

    let cards: Card[];
    if (mode === 'all') {
      cards = await getCardsByDeckId(params.deckId) as unknown as Card[];
    } else if (mode === 'new') {
      const allCards = await getCardsByDeckId(params.deckId) as unknown as Card[];
      cards = allCards.filter((c) => Number(c.repetitions) === 0);
    } else {
      cards = await getCardsDueForReview(params.deckId) as unknown as Card[];
    }

    const dueCards = await getCardsDueForReview(params.deckId) as unknown as Card[];
    return NextResponse.json({ deck, cards, totalDue: dueCards.length });
  } catch (error) {
    console.error('[GET /api/study/[deckId]]', error);
    return NextResponse.json({ error: 'Failed to load study session' }, { status: 500 });
  }
}
