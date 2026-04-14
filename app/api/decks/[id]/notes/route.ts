import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getDeckById, getCardsByDeckId, saveDeckNotes } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';
import type { Card } from '@/lib/types';

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type DeckRow = { title: string; description: string | null; user_id: string };

export async function POST(
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
    if (cards.length === 0) return NextResponse.json({ error: 'No cards in deck' }, { status: 400 });

    const cardSummary = cards.map((c, i) => `${i + 1}. Q: ${c.front}\n   A: ${c.back}`).join('\n\n');

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `You are an expert educator. Based on the following flashcard deck titled "${deck.title}", write comprehensive study notes.

The notes should:
- Be structured with clear headings using markdown (# ## ###)
- Synthesise all key concepts into flowing, readable prose
- Group related ideas together naturally
- Include key definitions, formulas, relationships, and examples
- End with a "Key Takeaways" section

Flashcards:
${cardSummary}

Write the study notes in markdown format:`,
      }],
    });

    const notes = response.content[0].type === 'text' ? response.content[0].text : '';
    if (!notes) throw new Error('AI returned empty notes');

    await saveDeckNotes(params.id, notes);
    return NextResponse.json({ notes });
  } catch (error) {
    console.error('[POST /api/decks/[id]/notes]', error);
    return NextResponse.json({ error: 'Failed to generate notes' }, { status: 500 });
  }
}
