import { NextRequest, NextResponse } from 'next/server';
import { getCardById, updateCard, updateDeckStats, updateDeckLastStudied, recordStudyActivity } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';
import { sm2 } from '@/lib/spaced-repetition';
import type { Card } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const card = getCardById(params.id) as Card | undefined;
    if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

    const body = await request.json();
    const { quality } = body as { quality: number };

    if (typeof quality !== 'number' || quality < 0 || quality > 5) {
      return NextResponse.json(
        { error: 'quality must be a number between 0 and 5' },
        { status: 400 }
      );
    }

    const result = sm2(quality, card.repetitions, card.easiness_factor, card.interval_days);
    const newDifficulty = Math.max(0, Math.min(5, 5 - quality));

    updateCard(params.id, {
      repetitions: result.repetitions,
      easiness_factor: result.easinessFactor,
      interval_days: result.intervalDays,
      next_review_at: result.nextReviewAt.toISOString(),
      last_reviewed_at: new Date().toISOString(),
      difficulty: newDifficulty,
    });

    updateDeckStats(card.deck_id);
    updateDeckLastStudied(card.deck_id);
    recordStudyActivity(userId, card.deck_id, 1);

    const updatedCard = getCardById(params.id);
    return NextResponse.json({
      card: updatedCard,
      nextReviewAt: result.nextReviewAt,
      intervalDays: result.intervalDays,
    });
  } catch (error) {
    console.error('[POST /api/cards/[id]/review]', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
