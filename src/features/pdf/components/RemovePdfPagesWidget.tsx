import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { validatePdfFile } from '../utils/pdfValidation';
import { trackEvent } from '../../../lib/analytics';
import {
  Download,
  Trash2,
  RefreshCw,
  ShieldCheck,
  FileCheck,
  CheckSquare,
  Square,
  AlertCircle
} from 'lucide-react';

interface PageThumbnail {
  pageIndex: number; // 1-indexed
  dataUrl: string;
}

export const RemovePdfPagesWidget: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [pagesToDelete, setPagesToDelete] = useState<Set<number>>(new Set());
  const [thumbnails, setThumbnails] = useState<PageThumbnail[]>([]);
  const [isLoadingThumbnails, setIsLoadingThumbnails] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleFileSelect = async (file: File | undefined) => {
    if (!file) return;
    setErrorMsg(null);
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl(null);
    setThumbnails([]);
    setPagesToDelete(new Set());

    const validation = await validatePdfFile(file);
    if (!validation.valid || !validation.pageCount) {
      setErrorMsg(validation.error || 'Invalid PDF file.');
      return;
    }

    setSelectedFile(file);
    setPageCount(validation.pageCount);
    loadThumbnails(file, validation.pageCount);
    trackEvent('tool_started', { tool: 'remove-pdf-pages' });
  };

  const loadThumbnails = async (file: File, total: number) => {
    setIsLoadingThumbnails(true);
    try {
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
      if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      }

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      const loaded: PageThumbnail[] = [];
      const renderLimit = Math.min(total, 50);

      for (let i = 1; i <= renderLimit; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.3 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
          loaded.push({
            pageIndex: i,
            dataUrl: canvas.toDataURL('image/jpeg', 0.8),
          });
        }
      }
      setThumbnails(loaded);
    } catch (err: any) {
      console.error('Thumbnail generation error:', err);
      setErrorMsg('Failed to render PDF page previews.');
    } finally {
      setIsLoadingThumbnails(false);
    }
  };

  const togglePageToDelete = (pageIndex: number) => {
    setPagesToDelete((prev) => {
      const next = new Set(prev);
      if (next.has(pageIndex)) next.delete(pageIndex);
      else next.add(pageIndex);
      return next;
    });
  };

  const selectOddPages = () => {
    const next = new Set<number>();
    for (let i = 1; i <= pageCount; i += 2) next.add(i);
    setPagesToDelete(next);
  };

  const selectEvenPages = () => {
    const next = new Set<number>();
    for (let i = 2; i <= pageCount; i += 2) next.add(i);
    setPagesToDelete(next);
  };

  const clearSelection = () => {
    setPagesToDelete(new Set());
  };

  const handleProcessDelete = async () => {
    if (!selectedFile) return;
    if (pagesToDelete.size >= pageCount) {
      setErrorMsg('Cannot remove all pages! At least 1 page must remain.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const newDoc = await PDFDocument.create();

      const remainingPageIndices: number[] = [];
      for (let i = 1; i <= pageCount; i++) {
        if (!pagesToDelete.has(i)) {
          remainingPageIndices.push(i - 1); // 0-indexed for pdf-lib
        }
      }

      const copiedPages = await newDoc.copyPages(srcDoc, remainingPageIndices);
      copiedPages.forEach((page) => newDoc.addPage(page));

      const pdfBytes = await newDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);

      trackEvent('tool_completed', {
        tool: 'remove-pdf-pages',
        removedCount: pagesToDelete.size,
        remainingCount: remainingPageIndices.length,
      });
    } catch (err: any) {
      console.error('Remove PDF pages error:', err);
      setErrorMsg(err.message || 'Failed to remove selected pages.');
      trackEvent('tool_error', { tool: 'remove-pdf-pages' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span>100% Client-Side Privacy: PDF pages are removed locally in your browser memory.</span>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Upload Box */}
      {!selectedFile && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'copy';
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            let droppedFile: File | undefined = e.dataTransfer.files?.[0];
            if (!droppedFile && e.dataTransfer.items) {
              for (let i = 0; i < e.dataTransfer.items.length; i++) {
                const item = e.dataTransfer.items[i];
                if (item.kind === 'file') {
                  const f = item.getAsFile();
                  if (f) {
                    droppedFile = f;
                    break;
                  }
                }
              }
            }
            if (droppedFile) handleFileSelect(droppedFile);
          }}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-red-500 dark:hover:border-red-400 rounded-2xl p-12 text-center transition-all bg-slate-50/50 dark:bg-slate-900/50 cursor-pointer"
        >
          <label className="cursor-pointer flex flex-col items-center justify-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-800 flex items-center justify-center text-red-600 dark:text-red-400 pointer-events-none">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 pointer-events-none">
              Select or drag & drop a PDF to remove pages
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 pointer-events-none">
              Select unwanted pages visually and export a clean PDF document
            </p>
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
            />
          </label>
        </div>
      )}

      {/* Workspace */}
      {selectedFile && (
        <div className="space-y-6">
          {/* Top Controls Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <FileCheck className="w-6 h-6 text-red-600 dark:text-red-400" />
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {selectedFile.name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {pageCount} total pages • <strong className="text-red-500">{pagesToDelete.size} selected to remove</strong>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={selectOddPages}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
              >
                Select Odd
              </button>
              <button
                type="button"
                onClick={selectEvenPages}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
              >
                Select Even
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={handleProcessDelete}
                disabled={isProcessing || pagesToDelete.size === 0}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-red-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {isProcessing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{isProcessing ? 'Removing...' : `Remove ${pagesToDelete.size} Pages & Export`}</span>
              </button>
            </div>
          </div>

          {/* Download Box */}
          {downloadUrl && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Cleaned PDF document is ready!
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Removed {pagesToDelete.size} pages • {pageCount - pagesToDelete.size} pages remaining
                </p>
              </div>
              <a
                href={downloadUrl}
                download={`cleaned-${selectedFile.name}`}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-500/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Cleaned PDF</span>
              </a>
            </div>
          )}

          {/* Loading */}
          {isLoadingThumbnails && (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-red-500" />
              <span>Generating page previews...</span>
            </div>
          )}

          {/* Thumbnails Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {thumbnails.map((p) => {
              const isMarked = pagesToDelete.has(p.pageIndex);
              return (
                <div
                  key={p.pageIndex}
                  onClick={() => togglePageToDelete(p.pageIndex)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col items-center justify-between space-y-3 relative group ${
                    isMarked
                      ? 'bg-red-50 dark:bg-red-950/40 border-red-400 dark:border-red-800 shadow-md ring-2 ring-red-500/40'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
                  }`}
                >
                  <div className="w-full flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isMarked ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Page {p.pageIndex}
                    </span>
                    {isMarked ? (
                      <CheckSquare className="w-4 h-4 text-red-600 dark:text-red-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                    )}
                  </div>

                  <div className="w-full h-44 flex items-center justify-center overflow-hidden rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-2 relative">
                    <img
                      src={p.dataUrl}
                      alt={`Page ${p.pageIndex}`}
                      className={`max-h-full max-w-full object-contain transition-opacity ${
                        isMarked ? 'opacity-30' : 'opacity-100'
                      }`}
                    />
                    {isMarked && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="p-2 rounded-full bg-red-600 text-white shadow-lg">
                          <Trash2 className="w-5 h-5" />
                        </div>
                      </div>
                    )}
                  </div>

                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      isMarked ? 'text-red-600 dark:text-red-400' : 'text-slate-400'
                    }`}
                  >
                    {isMarked ? 'Will Delete' : 'Keep Page'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
