import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import {
  getAllDecks,
  createDeck,
  createCard,
  createRevisionSheet,
  updateDeckStats,
} from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';
import type { GeneratedCard, GeneratedRevisionSheet } from '@/lib/types';

export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decks = getAllDecks(userId);
    return NextResponse.json(decks);
  } catch (error) {
    console.error('[GET /api/decks]', error);
    return NextResponse.json({ error: 'Failed to load decks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { title, description, sourceFilename, cards, revisionSheets } = body as {
      title: string;
      description?: string;
      sourceFilename?: string;
      cards: GeneratedCard[];
      revisionSheets?: GeneratedRevisionSheet[];
    };

    if (!title || !cards || !Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json(
        { error: 'title and cards are required' },
        { status: 400 }
      );
    }

    const deckId = uuidv4();

    createDeck({
      id: deckId,
      user_id: userId,
      title: title.trim(),
      description: description?.trim(),
      source_filename: sourceFilename,
    });

    for (const card of cards) {
      createCard({
        id: uuidv4(),
        deck_id: deckId,
        front: card.front,
        back: card.back,
        card_type: card.type,
      });
    }

    if (revisionSheets && revisionSheets.length > 0) {
      for (let i = 0; i < revisionSheets.length; i++) {
        const sheet = revisionSheets[i];
        createRevisionSheet({
          id: uuidv4(),
          deck_id: deckId,
          title: sheet.title,
          subtitle: sheet.subtitle,
          sections: JSON.stringify(sheet.sections),
          one_line_answer: sheet.oneLineAnswer,
          mnemonics: JSON.stringify(sheet.mnemonics ?? []),
          order_index: i,
        });
      }
    }

    updateDeckStats(deckId);

    const newDeck = (await import('@/lib/db')).getDeckById(deckId);
    return NextResponse.json(newDeck, { status: 201 });
  } catch (error) {
    console.error('[POST /api/decks]', error);
    return NextResponse.json({ error: 'Failed to create deck' }, { status: 500 });
  }
}
