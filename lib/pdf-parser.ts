/**
 * Server-side PDF text extraction using pdf-parse.
 * This file must only be imported in server-side code (API routes).
 */

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // Dynamic import to avoid bundling issues with pdf-parse
  const pdf = (await import('pdf-parse')).default;
  const data = await pdf(buffer);
  return data.text;
}

export function cleanPDFText(text: string): string {
  return text
    // Remove excessive whitespace
    .replace(/\s{3,}/g, '\n\n')
    // Remove form feed characters
    .replace(/\f/g, '\n\n')
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    // Remove null bytes
    .replace(/\0/g, '')
    // Trim leading/trailing whitespace
    .trim();
}

export async function extractAndCleanPDF(buffer: Buffer): Promise<{ text: string; pages: number }> {
  const pdf = (await import('pdf-parse')).default;
  const data = await pdf(buffer);
  return {
    text: cleanPDFText(data.text),
    pages: data.numpages,
  };
}
