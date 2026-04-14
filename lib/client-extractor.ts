/**
 * Client-side text extraction from PDF and PPTX files.
 * Runs entirely in the browser — no file is uploaded to the server.
 * PDF.js is loaded from CDN at runtime (not bundled) to avoid webpack/canvas issues.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

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

/** Load PDF.js 3.x from CDN as a global script (avoids webpack bundling and canvas issues). */
function loadPdfJs(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Browser only'));

  // Return cached instance if already loaded
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      const lib = window.pdfjsLib;
      if (!lib) { reject(new Error('PDF.js did not load correctly')); return; }
      lib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve(lib);
    };
    script.onerror = () => reject(new Error('Failed to load PDF reader. Please check your internet connection.'));
    document.head.appendChild(script);
  });
}

async function extractPDF(file: File): Promise<{ text: string; pages: number }> {
  const pdfjsLib = await loadPdfJs();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pageTexts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .filter((item: any) => typeof item.str === 'string')
      .map((item: any) => item.str)
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
