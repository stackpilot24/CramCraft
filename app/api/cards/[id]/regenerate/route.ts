import { NextRequest, NextResponse } from 'next/server';
import { getCardById, updateCard, updateDeckStats } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';
import { regenerateRichCard } from '@/lib/flashcard-generator';
import type { Card } from '@/lib/types';

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const card = getCardById(params.id) as Card | undefined;
    if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

    const { front, back } = await regenerateRichCard(card.front, card.back);

    updateCard(params.id, { front, back });
    updateDeckStats(card.deck_id);

    return NextResponse.json(getCardById(params.id));
  } catch (error) {
    console.error('[POST /api/cards/[id]/regenerate]', error);
    return NextResponse.json({ error: 'Failed to regenerate card' }, { status: 500 });
  }
}
