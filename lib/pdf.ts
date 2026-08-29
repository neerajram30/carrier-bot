import { extractText } from 'unpdf';

// Layer 3: Native Regex PDF Stream Extractor for scanned/raw PDF text streams
function extractRawTextFromPdfBuffer(buffer: Buffer): string {
  try {
    const content = buffer.toString('binary');
    const matches = content.match(/\(([^()]+)\)/g);
    if (!matches || matches.length === 0) return '';

    const textParts = matches
      .map((m) => m.slice(1, -1))
      .filter((s) => s.trim().length > 1 && !/[^\x20-\x7E\s]/.test(s));

    return textParts.join(' ').replace(/\s+/g, ' ').trim();
  } catch {
    return '';
  }
}

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // Layer 1: Primary unpdf Extractor with Uint8Array conversion
  try {
    const uint8Array = new Uint8Array(buffer);
    const res = await extractText(uint8Array);
    const textData: unknown = res?.text;

    let resultText = '';
    if (Array.isArray(textData)) {
      resultText = textData.join('\n').trim();
    } else if (typeof textData === 'string') {
      resultText = textData.trim();
    }

    if (resultText.length > 10) {
      return resultText;
    }
  } catch (err) {
    console.warn('[PDF Parser] Layer 1 unpdf warning:', err);
  }

  // Layer 2: pdf-parse Class Constructor
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParseModule = require('pdf-parse');
    if (pdfParseModule?.PDFParse) {
      const parser = new pdfParseModule.PDFParse({ data: buffer });
      const result = await parser.getText();
      if (result.text && result.text.trim().length > 10) {
        return result.text.trim();
      }
    }
  } catch (err) {
    console.warn('[PDF Parser] Layer 2 pdf-parse warning:', err);
  }

  // Layer 3: Native PDF Stream Text Extraction
  const rawText = extractRawTextFromPdfBuffer(buffer);
  if (rawText.length > 10) {
    console.log('[PDF Parser] Successfully extracted text via Layer 3 Native PDF Stream Reader');
    return rawText;
  }

  throw new Error('Could not extract readable text from this PDF file. Please ensure it is a valid text-based PDF resume.');
}
