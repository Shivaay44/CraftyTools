import React, { useState } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import { validatePdfFile, formatFileSize } from '../utils/pdfValidation';
import { trackEvent } from '../../../lib/analytics';
import {
  Upload,
  Download,
  RotateCw,
  RotateCcw,
  RefreshCw,
  ShieldCheck,
  FileCheck,
  AlertCircle
} from 'lucide-react';

interface PageItem {
  pageIndex: number; // 0-indexed
  dataUrl: string;
  rotation: number; // 0, 90, 180, 270
}

export const RotatePdfWidget: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [isLoadingThumbnails, setIsLoadingThumbnails] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleFileSelect = async (file: File | undefined) => {
    if (!file) return;
    setErrorMsg(null);
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl(null);
    setPages([]);

    const validation = await validatePdfFile(file);
    if (!validation.valid || !validation.pageCount) {
      setErrorMsg(validation.error || 'Invalid PDF file.');
      return;
    }

    setSelectedFile(file);
    setPageCount(validation.pageCount);
    loadThumbnails(file, validation.pageCount);
    trackEvent('tool_started', { tool: 'rotate-pdf' });
  };

  const loadThumbnails = async (file: File, total: number) => {
    setIsLoadingThumbnails(true);
    try {
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
      if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '5.6.205'}/legacy/build/pdf.worker.min.mjs`;
      }

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      const loadedPages: PageItem[] = [];
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
          loadedPages.push({
            pageIndex: i - 1,
            dataUrl: canvas.toDataURL('image/jpeg', 0.8),
            rotation: 0,
          });
        }
      }

      setPages(loadedPages);
    } catch (err: any) {
      console.error('Failed to render PDF thumbnails:', err);
      setErrorMsg('Failed to render PDF page previews.');
    } finally {
      setIsLoadingThumbnails(false);
    }
  };

  const rotateSinglePage = (pageIndex: number, delta: number) => {
    setPages((prev) =>
      prev.map((p) => {
        if (p.pageIndex === pageIndex) {
          const newRot = (p.rotation + delta + 360) % 360;
          return { ...p, rotation: newRot };
        }
        return p;
      })
    );
  };

  const rotateAllPages = (delta: number) => {
    setPages((prev) =>
      prev.map((p) => ({
        ...p,
        rotation: (p.rotation + delta + 360) % 360,
      }))
    );
  };

  const handleSaveAndDownload = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const docPages = pdfDoc.getPages();

      pages.forEach((p) => {
        if (p.pageIndex < docPages.length && p.rotation !== 0) {
          const page = docPages[p.pageIndex];
          const currentRotation = page.getRotation().angle;
          page.setRotation(degrees((currentRotation + p.rotation) % 360));
        }
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);

      trackEvent('tool_completed', { tool: 'rotate-pdf', pages: pageCount });
    } catch (err: any) {
      console.error('Rotate PDF error:', err);
      setErrorMsg(err.message || 'Failed to rotate and save PDF.');
      trackEvent('tool_error', { tool: 'rotate-pdf' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span>100% Client-Side Privacy: PDF pages are rotated locally inside your browser without uploading to any server.</span>
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
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl p-12 text-center transition-all bg-slate-50/50 dark:bg-slate-900/50 cursor-pointer"
        >
          <label className="cursor-pointer flex flex-col items-center justify-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 pointer-events-none">
              <Upload className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 pointer-events-none">
              Select or drag & drop a PDF to rotate pages
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 pointer-events-none">
              Rotate individual pages or all pages 90°, 180°, or 270°
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
          {/* Top Action Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <FileCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {selectedFile.name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {pageCount} pages • {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => rotateAllPages(90)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" /> Rotate All +90°
              </button>
              <button
                type="button"
                onClick={() => rotateAllPages(180)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" /> Rotate All 180°
              </button>
              <button
                type="button"
                onClick={handleSaveAndDownload}
                disabled={isProcessing}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {isProcessing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>{isProcessing ? 'Generating...' : 'Save & Export PDF'}</span>
              </button>
            </div>
          </div>

          {/* Download Box */}
          {downloadUrl && (
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Rotated PDF is ready for download!
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  All page rotations applied successfully.
                </p>
              </div>
              <a
                href={downloadUrl}
                download={`rotated-${selectedFile.name}`}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </a>
            </div>
          )}

          {/* Loading Thumbnails */}
          {isLoadingThumbnails && (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
              <span>Generating page previews...</span>
            </div>
          )}

          {/* Pages Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {pages.map((p) => (
              <div
                key={p.pageIndex}
                className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-between space-y-3 shadow-sm hover:border-blue-400 transition-all group"
              >
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Page {p.pageIndex + 1}
                  {p.rotation !== 0 && (
                    <span className="ml-1 text-blue-600 dark:text-blue-400">({p.rotation}°)</span>
                  )}
                </span>

                <div className="w-full h-44 flex items-center justify-center overflow-hidden rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-2">
                  <img
                    src={p.dataUrl}
                    alt={`Page ${p.pageIndex + 1}`}
                    style={{ transform: `rotate(${p.rotation}deg)` }}
                    className="max-h-full max-w-full object-contain transition-transform duration-200 shadow-sm"
                  />
                </div>

                <div className="flex items-center gap-1.5 w-full justify-center">
                  <button
                    type="button"
                    onClick={() => rotateSinglePage(p.pageIndex, -90)}
                    title="Rotate 90° Counter-Clockwise"
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => rotateSinglePage(p.pageIndex, 90)}
                    title="Rotate 90° Clockwise"
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs transition-colors"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
