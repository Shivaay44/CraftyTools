export interface PageRangeParseResult {
  valid: boolean;
  pages: number[]; // 1-indexed page numbers
  error?: string;
}

export function parsePageRange(input: string, totalPages: number): PageRangeParseResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { valid: false, pages: [], error: 'Page range cannot be empty.' };
  }

  // Regex check for allowed range pattern (numbers, commas, hyphens)
  if (!/^[\d\s,-]+$/.test(trimmed)) {
    return {
      valid: false,
      pages: [],
      error: 'Invalid format. Use numbers, commas, and hyphens (e.g. 1-5, 8, 10-12).',
    };
  }

  const parts = trimmed.split(',').map((p) => p.trim()).filter(Boolean);
  const pageSet = new Set<number>();

  for (const part of parts) {
    if (part.includes('-')) {
      const rangeParts = part.split('-').map((p) => p.trim());
      if (rangeParts.length !== 2 || rangeParts[0] === '' || rangeParts[1] === '') {
        return { valid: false, pages: [], error: `Invalid range format: "${part}".` };
      }

      const start = parseInt(rangeParts[0], 10);
      const end = parseInt(rangeParts[1], 10);

      if (isNaN(start) || isNaN(end) || start <= 0 || end <= 0 || start > end) {
        return {
          valid: false,
          pages: [],
          error: `Invalid range range "${start}-${end}". Start must be <= end and > 0.`,
        };
      }

      for (let i = start; i <= end; i++) {
        if (i > totalPages) {
          return {
            valid: false,
            pages: [],
            error: `Page ${i} exceeds total document pages (${totalPages}).`,
          };
        }
        pageSet.add(i);
      }
    } else {
      const pageNum = parseInt(part, 10);
      if (isNaN(pageNum) || pageNum <= 0) {
        return { valid: false, pages: [], error: `Invalid page number "${part}".` };
      }
      if (pageNum > totalPages) {
        return {
          valid: false,
          pages: [],
          error: `Page ${pageNum} exceeds total document pages (${totalPages}).`,
        };
      }
      pageSet.add(pageNum);
    }
  }

  const sortedPages = Array.from(pageSet).sort((a, b) => a - b);
  if (sortedPages.length === 0) {
    return { valid: false, pages: [], error: 'No valid pages found.' };
  }

  return { valid: true, pages: sortedPages };
}
