import { NextRequest, NextResponse } from 'next/server';
import { getCardById, getDeckById, updateCard, deleteCard, updateDeckStats } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';

type DeckRow = { user_id: string };
type CardRow = { deck_id: string };

export async function PUT(
  request: NextRequest,
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

    const body = await request.json();
    const updates: { front?: string; back?: string; card_type?: string } = {};
    if (body.front) updates.front = body.front.trim();
    if (body.back) updates.back = body.back.trim();
    if (body.card_type) updates.card_type = body.card_type;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    await updateCard(params.id, updates);
    return NextResponse.json(await getCardById(params.id));
  } catch (error) {
    console.error('[PUT /api/cards/[id]]', error);
    return NextResponse.json({ error: 'Failed to update card' }, { status: 500 });
  }
}

export async function DELETE(
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

    await deleteCard(params.id);
    await updateDeckStats(card.deck_id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/cards/[id]]', error);
    return NextResponse.json({ error: 'Failed to delete card' }, { status: 500 });
  }
}
