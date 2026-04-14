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

    const deck = getDeckById(params.id) as DeckRow | undefined;
    if (!deck) return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    if (deck.user_id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const cards = getCardsByDeckId(params.id) as Card[];
    if (cards.length === 0) {
      return NextResponse.json({ error: 'No cards in deck' }, { status: 400 });
    }

    const cardSummary = cards
      .map((c, i) => `${i + 1}. Q: ${c.front}\n   A: ${c.back}`)
      .join('\n\n');

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `You are an expert educator. Based on the following flashcard deck titled "${deck.title}", write comprehensive study notes that a student can read and understand the full topic.

The notes should:
- Be structured with clear headings and subheadings using markdown (# ## ###)
- Synthesise all the key concepts into flowing, readable prose — not just a list of Q&As
- Group related ideas together naturally
- Include key definitions, formulas, relationships, and examples
- Be comprehensive but concise — written like a great textbook summary
- End with a "Key Takeaways" section (bullet points of the most important points)

Flashcards:
${cardSummary}

Write the study notes in markdown format:`,
        },
      ],
    });

    const notes = response.content[0].type === 'text' ? response.content[0].text : '';
    if (!notes) throw new Error('AI returned empty notes');

    saveDeckNotes(params.id, notes);

    return NextResponse.json({ notes });
  } catch (error) {
    console.error('[POST /api/decks/[id]/notes]', error);
    return NextResponse.json({ error: 'Failed to generate notes' }, { status: 500 });
  }
}
