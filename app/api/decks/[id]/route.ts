import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import {
  getDeckById,
  getCardsByDeckId,
  deleteDeck,
  updateDeckStats,
  updateDeck,
  getCardsDueForReview,
  createCard,
  getCardById,
  getNoteCardsByDeckId,
  getRevisionSheetsByDeckId,
} from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';
import type { Card, DeckStats } from '@/lib/types';

type DeckRow = { user_id: string; [key: string]: unknown };

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const deck = await getDeckById(params.id) as unknown as DeckRow | null;
    if (!deck) return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    if (deck.user_id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const cards = await getCardsByDeckId(params.id) as unknown as Card[];
    const dueCards = await getCardsDueForReview(params.id) as unknown as Card[];

    const mastered = cards.filter((c) => Number(c.repetitions) >= 3 && Number(c.easiness_factor) >= 2.0).length;
    const learning = cards.filter(
      (c) => Number(c.repetitions) > 0 && (Number(c.repetitions) < 3 || Number(c.easiness_factor) < 2.0)
    ).length;
    const newCards = cards.filter((c) => Number(c.repetitions) === 0).length;

    const stats: DeckStats = {
      total: cards.length,
      mastered,
      learning,
      dueToday: dueCards.length,
      new: newCards,
    };

    const noteCards = await getNoteCardsByDeckId(params.id);
    const revisionSheets = await getRevisionSheetsByDeckId(params.id);
    return NextResponse.json({ ...deck, cards, stats, noteCards, revisionSheets });
  } catch (error) {
    console.error('[GET /api/decks/[id]]', error);
    return NextResponse.json({ error: 'Failed to load deck' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const deck = await getDeckById(params.id) as unknown as DeckRow | null;
    if (!deck) return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    if (deck.user_id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const data: { title?: string; description?: string | null } = {};
    if (body.title) data.title = body.title.trim();
    if (body.description !== undefined) data.description = body.description?.trim() || null;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    await updateDeck(params.id, data);
    await updateDeckStats(params.id);
    return NextResponse.json(await getDeckById(params.id));
  } catch (error) {
    console.error('[PUT /api/decks/[id]]', error);
    return NextResponse.json({ error: 'Failed to update deck' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const deck = await getDeckById(params.id) as unknown as DeckRow | null;
    if (!deck) return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    if (deck.user_id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { front, back, card_type } = body as { front: string; back: string; card_type?: string };

    if (!front?.trim() || !back?.trim()) {
      return NextResponse.json({ error: 'front and back are required' }, { status: 400 });
    }

    const cardId = uuidv4();
    await createCard({ id: cardId, deck_id: params.id, front: front.trim(), back: back.trim(), card_type: card_type ?? 'concept' });
    await updateDeckStats(params.id);

    return NextResponse.json(await getCardById(cardId), { status: 201 });
  } catch (error) {
    console.error('[POST /api/decks/[id]]', error);
    return NextResponse.json({ error: 'Failed to create card' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const deck = await getDeckById(params.id) as unknown as DeckRow | null;
    if (!deck) return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    if (deck.user_id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await deleteDeck(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/decks/[id]]', error);
    return NextResponse.json({ error: 'Failed to delete deck' }, { status: 500 });
  }
}
