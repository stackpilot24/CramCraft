import { NextResponse } from 'next/server';
import { getAllCardsDue } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';

export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const cards = await getAllCardsDue(userId);
    return NextResponse.json(cards);
  } catch (error) {
    console.error('[GET /api/cards/due]', error);
    return NextResponse.json({ error: 'Failed to fetch due cards' }, { status: 500 });
  }
}
