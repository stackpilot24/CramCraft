import { NextRequest, NextResponse } from 'next/server';
import { getExamSessionById, getExamQuestionsBySessionId, deleteExamSession } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';

type SessionRow = { user_id: string };

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = await getExamSessionById(params.id) as unknown as SessionRow | null;
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    if (session.user_id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const questions = await getExamQuestionsBySessionId(params.id);
    return NextResponse.json({ ...session, questions });
  } catch (error) {
    console.error('[GET /api/exam/sessions/[id]]', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = await getExamSessionById(params.id) as unknown as SessionRow | null;
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    if (session.user_id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await deleteExamSession(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/exam/sessions/[id]]', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
