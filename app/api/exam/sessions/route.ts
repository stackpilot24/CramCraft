import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getAllExamSessions, createExamSession, createExamQuestion } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';
import type { GeneratedExamQuestion } from '@/lib/types';

export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sessions = await getAllExamSessions(userId);
    return NextResponse.json(sessions);
  } catch (error) {
    console.error('[GET /api/exam/sessions]', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { title, sourceFilename, summary, questions } = body as {
      title: string; sourceFilename?: string; summary?: string; questions: GeneratedExamQuestion[];
    };

    if (!title || !questions?.length) {
      return NextResponse.json({ error: 'title and questions are required' }, { status: 400 });
    }

    const sessionId = randomUUID();
    await createExamSession({ id: sessionId, user_id: userId, title, source_filename: sourceFilename, summary, question_count: questions.length });

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      await createExamQuestion({
        id: randomUUID(), session_id: sessionId, question: q.question, answer: q.answer,
        importance: q.importance, question_type: q.type, topic: q.topic, order_index: i,
      });
    }

    return NextResponse.json({ id: sessionId, title, question_count: questions.length });
  } catch (error) {
    console.error('[POST /api/exam/sessions]', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
