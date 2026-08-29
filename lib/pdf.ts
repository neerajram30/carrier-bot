// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParseModule = require('pdf-parse');

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    // Handle pdf-parse v2.4+ class constructor API
    if (pdfParseModule?.PDFParse) {
      const parser = new pdfParseModule.PDFParse({ data: buffer });
      const result = await parser.getText();
      return result.text ? result.text.trim() : '';
    }

    // Handle legacy pdf-parse v1.x function API
    const parseFn = typeof pdfParseModule === 'function' ? pdfParseModule : pdfParseModule?.default;
    if (typeof parseFn === 'function') {
      const data = await parseFn(buffer);
      return data.text ? data.text.trim() : '';
    }

    throw new Error('No valid PDF parser function or class found');
  } catch (error) {
    console.error('[PDF Parser] Error parsing PDF buffer:', error);
    throw new Error('Failed to parse PDF document');
  }
}
