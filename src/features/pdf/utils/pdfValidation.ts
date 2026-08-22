import { PDFDocument } from 'pdf-lib';

export interface PDFValidationResult {
  valid: boolean;
  pageCount?: number;
  error?: string;
  isEncrypted?: boolean;
}

export const MAX_PDF_SIZE_BYTES = 50 * 1024 * 1024; // 50MB browser limit

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export async function validatePdfFile(file: File): Promise<PDFValidationResult> {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
    return { valid: false, error: 'Invalid file format. Please select a valid PDF document.' };
  }

  if (file.size > MAX_PDF_SIZE_BYTES) {
    return {
      valid: false,
      error: 'This PDF file is too large to process in your browser. Please select a file under 50MB.',
    };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    
    if (pdfDoc.isEncrypted) {
      return {
        valid: false,
        isEncrypted: true,
        error: 'This PDF document is password-protected or encrypted.',
      };
    }

    const pageCount = pdfDoc.getPageCount();
    return { valid: true, pageCount };
  } catch (err: any) {
    console.error('PDF Validation Error:', err);
    return {
      valid: false,
      error: 'Failed to read PDF file. The document may be corrupted or unreadable.',
    };
  }
}
