import { NextRequest, NextResponse } from 'next/server';
import { getCardById, getDeckById, updateCard, updateDeckStats } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';
import { regenerateRichCard } from '@/lib/flashcard-generator';

type DeckRow = { user_id: string };
type CardRow = { deck_id: string; front: string; back: string };

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const card = await getCardById(params.id) as unknown as CardRow | null;
    if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

    // Ownership check
    const deck = await getDeckById(card.deck_id) as unknown as DeckRow | null;
    if (!deck || deck.user_id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { front, back } = await regenerateRichCard(card.front, card.back);

    await updateCard(params.id, { front, back });
    await updateDeckStats(card.deck_id);

    return NextResponse.json(await getCardById(params.id));
  } catch (error) {
    console.error('[POST /api/cards/[id]/regenerate]', error);
    return NextResponse.json({ error: 'Failed to regenerate card' }, { status: 500 });
  }
}
