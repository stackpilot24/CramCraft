import { NextRequest, NextResponse } from 'next/server';
import { getDeckById, getCardsDueForReview, getCardsByDeckId } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';
import type { Card } from '@/lib/types';

type DeckRow = { user_id: string; [key: string]: unknown };

export async function GET(
  request: NextRequest,
  { params }: { params: { deckId: string } }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const deck = getDeckById(params.deckId) as DeckRow | undefined;
    if (!deck) return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    if (deck.user_id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') ?? 'due';

    let cards: Card[];

    if (mode === 'all') {
      cards = getCardsByDeckId(params.deckId) as Card[];
    } else if (mode === 'new') {
      const allCards = getCardsByDeckId(params.deckId) as Card[];
      cards = allCards.filter((c) => c.repetitions === 0);
    } else {
      cards = getCardsDueForReview(params.deckId) as Card[];
    }

    return NextResponse.json({
      deck,
      cards,
      totalDue: (getCardsDueForReview(params.deckId) as Card[]).length,
    });
  } catch (error) {
    console.error('[GET /api/study/[deckId]]', error);
    return NextResponse.json({ error: 'Failed to load study session' }, { status: 500 });
  }
}
