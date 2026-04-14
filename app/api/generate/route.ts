import { NextRequest, NextResponse } from 'next/server';
import { generateWithPromptStrategy } from '@/lib/flashcard-generator';
import { getAuthUserId } from '@/lib/auth';

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const contentType = request.headers.get('content-type') || '';

    let text: string;
    let filename: string;
    let pageCount: number | undefined;

    if (contentType.includes('application/json')) {
      // New path: text was extracted client-side, only JSON is sent
      const body = await request.json();
      text = String(body.text ?? '').trim();
      filename = String(body.filename ?? 'document');
      pageCount = body.pageCount ? Number(body.pageCount) : undefined;

      if (!text || text.length < 50) {
        return NextResponse.json(
          { error: 'Not enough text content to generate flashcards.' },
          { status: 422 }
        );
      }
    } else {
      // Legacy path: file upload (kept for compatibility)
      const { extractAndCleanPDF } = await import('@/lib/pdf-parser');
      const { extractTextFromPPTX, cleanPPTXText } = await import('@/lib/pptx-parser');

      const formData = await request.formData();
      const file = (formData.get('file') ?? formData.get('pdf')) as File | null;

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      filename = file.name;
      const name = file.name.toLowerCase();
      const type = file.type.toLowerCase();
      const isPDF = type.includes('pdf') || name.endsWith('.pdf');
      const isPPTX =
        type.includes('presentationml') ||
        type.includes('powerpoint') ||
        name.endsWith('.pptx') ||
        name.endsWith('.ppt');

      if (!isPDF && !isPPTX) {
        return NextResponse.json(
          { error: 'Unsupported file type. Please upload a PDF or PPTX file.' },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      if (isPDF) {
        const result = await extractAndCleanPDF(buffer);
        text = result.text;
        pageCount = result.pages;
      } else {
        const result = await extractTextFromPPTX(buffer);
        text = cleanPPTXText(result.text);
        pageCount = result.slides;
      }

      if (!text || text.trim().length < 50) {
        return NextResponse.json(
          {
            error: isPDF
              ? 'Could not extract enough text from this PDF. Make sure it contains selectable text (not a scanned image).'
              : 'Could not extract enough text from this presentation. Make sure the slides contain text content.',
          },
          { status: 422 }
        );
      }
    }

    const result = await generateWithPromptStrategy(text, filename);

    return NextResponse.json({ ...result, pages: pageCount });
  } catch (error) {
    console.error('[/api/generate] Error:', error);

    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'AI service is not configured. Please add your API key.' },
          { status: 503 }
        );
      }
      if (error.message.includes('parse') || error.message.includes('corrupted')) {
        return NextResponse.json(
          { error: 'Failed to read the file. It may be corrupted or password-protected.' },
          { status: 422 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate flashcards. Please try again.' },
      { status: 500 }
    );
  }
}
