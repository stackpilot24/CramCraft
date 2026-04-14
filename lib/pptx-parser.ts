/**
 * Server-side PPTX text extraction.
 * PPTX files are ZIP archives containing XML slides at ppt/slides/slide*.xml
 * We extract all <a:t> text nodes from each slide in order.
 */

export async function extractTextFromPPTX(
  buffer: Buffer
): Promise<{ text: string; slides: number }> {
  // Dynamic import so jszip stays out of the client bundle
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(buffer);

  // Collect slide file names and sort numerically (slide1, slide2, …)
  const slideNames = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const n = (s: string) => parseInt(s.match(/\d+/)![0], 10);
      return n(a) - n(b);
    });

  if (slideNames.length === 0) {
    throw new Error(
      'No slide content found in this PPTX file. It may be empty or corrupted.'
    );
  }

  const slideTexts: string[] = [];

  for (const name of slideNames) {
    const xml = await zip.files[name].async('string');

    // Pull all text runs: <a:t ...>content</a:t>
    const runs = xml.match(/<a:t(?:\s[^>]*)?>([^<]*)<\/a:t>/g) ?? [];
    const text = runs
      .map((r) => r.replace(/<[^>]+>/g, '').trim())
      .filter(Boolean)
      .join(' ')
      .trim();

    if (text) slideTexts.push(text);
  }

  // Also try to grab slide notes (<p:sp> inside notesSlides) as bonus context
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

  return {
    text: slideTexts.join('\n\n'),
    slides: slideNames.length,
  };
}

export function cleanPPTXText(text: string): string {
  return text
    .replace(/\s{3,}/g, '\n\n')
    .replace(/\r\n/g, '\n')
    .replace(/\0/g, '')
    .trim();
}
