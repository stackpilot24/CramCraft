import { NextRequest, NextResponse } from 'next/server';
import { extractAndCleanPDF } from '@/lib/pdf-parser';
import { extractTextFromPPTX, cleanPPTXText } from '@/lib/pptx-parser';
import { generateWithPromptStrategy } from '@/lib/flashcard-generator';
import { getAuthUserId } from '@/lib/auth';

export const maxDuration = 120;

const MAX_SIZE = 500 * 1024 * 1024; // 500 MB

function detectFileType(file: File): 'pdf' | 'pptx' | null {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  if (type.includes('pdf') || name.endsWith('.pdf')) return 'pdf';
  if (
    type.includes('presentationml') ||
    type.includes('powerpoint') ||
    name.endsWith('.pptx') ||
    name.endsWith('.ppt')
  )
    return 'pptx';

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    // Accept field named either "pdf" (legacy) or "file"
    const file = (formData.get('file') ?? formData.get('pdf')) as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileType = detectFileType(file);
    if (!fileType) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload a PDF or PPTX file.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 500 MB.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let text: string;
    let pageCount: number;

    if (fileType === 'pdf') {
      const result = await extractAndCleanPDF(buffer);
      text = result.text;
      pageCount = result.pages;
    } else {
      // PPTX
      const result = await extractTextFromPPTX(buffer);
      text = cleanPPTXText(result.text);
      pageCount = result.slides;
    }

    if (!text || text.trim().length < 50) {
      return NextResponse.json(
        {
          error:
            fileType === 'pdf'
              ? 'Could not extract enough text from this PDF. Make sure it contains selectable text (not a scanned image).'
              : 'Could not extract enough text from this presentation. Make sure the slides contain text content.',
        },
        { status: 422 }
      );
    }

    const result = await generateWithPromptStrategy(text, file.name);

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
