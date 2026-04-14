/**
 * Client-side text extraction from PDF and PPTX files.
 * Runs entirely in the browser — no file is uploaded to the server.
 * This lets files of any size work regardless of server request limits.
 */

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

async function extractPDF(file: File): Promise<{ text: string; pages: number }> {
  const pdfjsLib = await import('pdfjs-dist');

  // Use unpkg CDN for the worker — avoids Next.js bundler/worker complexity
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pageTexts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((item): item is any => 'str' in item)
      .map((item: { str: string }) => item.str)
      .join(' ')
      .trim();
    if (text) pageTexts.push(text);
  }

  const fullText = pageTexts.join('\n\n');
  if (!fullText.trim() || fullText.trim().length < 50) {
    throw new Error(
      'Could not extract text from this PDF. Make sure it contains selectable text (not a scanned image).'
    );
  }

  return { text: fullText, pages: pdf.numPages };
}

async function extractPPTX(file: File): Promise<{ text: string; slides: number }> {
  const JSZip = (await import('jszip')).default;
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const slideNames = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const n = (s: string) => parseInt(s.match(/\d+/)![0], 10);
      return n(a) - n(b);
    });

  if (slideNames.length === 0) {
    throw new Error('No slide content found. The file may be empty or corrupted.');
  }

  const slideTexts: string[] = [];

  for (const name of slideNames) {
    const xml = await zip.files[name].async('string');
    const runs = xml.match(/<a:t(?:\s[^>]*)?>([^<]*)<\/a:t>/g) ?? [];
    const text = runs
      .map((r) => r.replace(/<[^>]+>/g, '').trim())
      .filter(Boolean)
      .join(' ')
      .trim();
    if (text) slideTexts.push(text);
  }

  // Also grab slide notes for extra context
  const noteNames = Object.keys(zip.files).filter((name) =>
    /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(name)
  );
  for (const name of noteNames) {
    const xml = await zip.files[name].async('string');
    const runs = xml.match(/<a:t(?:\s[^>]*)?>([^<]*)<\/a:t>/g) ?? [];
    const text = runs
      .map((r) => r.replace(/<[^>]+>/g, '').trim())
      .filter(Boolean)
      .join(' ')
      .trim();
    if (text) slideTexts.push(`[Notes] ${text}`);
  }

  const fullText = slideTexts.join('\n\n');
  if (!fullText.trim() || fullText.trim().length < 50) {
    throw new Error(
      'Could not extract text from this presentation. Make sure the slides contain text content.'
    );
  }

  return { text: fullText, slides: slideNames.length };
}

export interface ExtractResult {
  text: string;
  pageCount: number;
  fileType: 'pdf' | 'pptx';
}

/**
 * Extract text from a PDF or PPTX file entirely in the browser.
 * Throws with a user-friendly message on failure.
 */
export async function extractFileText(file: File): Promise<ExtractResult> {
  const fileType = detectFileType(file);
  if (!fileType) {
    throw new Error('Unsupported file type. Please upload a PDF or PPTX file.');
  }

  if (fileType === 'pdf') {
    const { text, pages } = await extractPDF(file);
    return { text, pageCount: pages, fileType };
  } else {
    const { text, slides } = await extractPPTX(file);
    return { text, pageCount: slides, fileType };
  }
}
