import { NextRequest, NextResponse } from 'next/server';
import { getCardById, getDeckById, updateCard, updateDeckStats, updateDeckLastStudied, recordStudyActivity } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';
import { sm2 } from '@/lib/spaced-repetition';

type DeckRow = { user_id: string };
type CardRow = { deck_id: string; repetitions: number; easiness_factor: number; interval_days: number };

export async function POST(
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
    const { quality } = body as { quality: number };

    if (typeof quality !== 'number' || quality < 0 || quality > 5) {
      return NextResponse.json({ error: 'quality must be a number between 0 and 5' }, { status: 400 });
    }

    const result = sm2(quality, Number(card.repetitions), Number(card.easiness_factor), Number(card.interval_days));
    const newDifficulty = Math.max(0, Math.min(5, 5 - quality));

    await updateCard(params.id, {
      repetitions: result.repetitions,
      easiness_factor: result.easinessFactor,
      interval_days: result.intervalDays,
      next_review_at: result.nextReviewAt.toISOString(),
      last_reviewed_at: new Date().toISOString(),
      difficulty: newDifficulty,
    });

    await updateDeckStats(card.deck_id);
    await updateDeckLastStudied(card.deck_id);
    await recordStudyActivity(userId, card.deck_id, 1);

    return NextResponse.json({
      card: await getCardById(params.id),
      nextReviewAt: result.nextReviewAt,
      intervalDays: result.intervalDays,
    });
  } catch (error) {
    console.error('[POST /api/cards/[id]/review]', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
