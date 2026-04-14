import { NextRequest, NextResponse } from 'next/server';
import { extractAndCleanPDF } from '@/lib/pdf-parser';
import { extractTextFromPPTX, cleanPPTXText } from '@/lib/pptx-parser';
import { generateExamPrep } from '@/lib/exam-generator';
import { getAuthUserId } from '@/lib/auth';

export const maxDuration = 120;

const MAX_SIZE = 500 * 1024 * 1024;

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
    if (fileType === 'pdf') {
      const result = await extractAndCleanPDF(buffer);
      text = result.text;
    } else {
      const result = await extractTextFromPPTX(buffer);
      text = cleanPPTXText(result.text);
    }

    if (!text || text.trim().length < 50) {
      return NextResponse.json(
        {
          error:
            fileType === 'pdf'
              ? 'Could not extract enough text from this PDF. Make sure it contains selectable text.'
              : 'Could not extract enough text from this presentation.',
        },
        { status: 422 }
      );
    }

    const result = await generateExamPrep(text, file.name);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[/api/exam/generate] Error:', error);
    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { error: 'AI service is not configured. Please add your API key.' },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to generate exam prep. Please try again.' },
      { status: 500 }
    );
  }
}
