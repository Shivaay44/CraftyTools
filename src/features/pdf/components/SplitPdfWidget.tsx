import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { validatePdfFile, formatFileSize } from '../utils/pdfValidation';
import { parsePageRange } from '../utils/pageRange';
import { trackEvent } from '../../../lib/analytics';
import { Upload, Download, RefreshCw, AlertCircle, ShieldCheck, FileCheck, CheckSquare, Square } from 'lucide-react';

interface PageThumbnail {
  pageIndex: number;
  dataUrl: string;
}

export const SplitPdfWidget: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [mode, setMode] = useState<'range' | 'all'>('range');
  const [rangeInput, setRangeInput] = useState<string>('');
  
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [thumbnails, setThumbnails] = useState<PageThumbnail[]>([]);
  const [isLoadingThumbnails, setIsLoadingThumbnails] = useState<boolean>(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resultBlobUrl, setResultBlobUrl] = useState<string | null>(null);
  const [resultFileName, setResultFileName] = useState<string>('extracted-pages.pdf');

  const handleFileSelect = async (file: File | undefined) => {
    if (!file) return;
    setErrorMsg(null);
    if (resultBlobUrl) URL.revokeObjectURL(resultBlobUrl);
    setResultBlobUrl(null);
    setThumbnails([]);
    setSelectedPages(new Set());

    const validation = await validatePdfFile(file);
    if (!validation.valid || !validation.pageCount) {
      setErrorMsg(validation.error || 'Invalid file.');
      return;
    }

    setSelectedFile(file);
    setPageCount(validation.pageCount);
    setRangeInput(`1-${Math.min(5, validation.pageCount)}`);
    
    const initialPages = new Set<number>();
    for (let i = 1; i <= Math.min(5, validation.pageCount); i++) {
      initialPages.add(i);
    }
    setSelectedPages(initialPages);

    renderPageThumbnails(file, validation.pageCount);
    trackEvent('tool_started', { tool: 'split-pdf' });
  };

  const renderPageThumbnails = async (file: File, total: number) => {
    setIsLoadingThumbnails(true);
    try {
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
      if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      }

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      const thumbs: PageThumbnail[] = [];
      const renderLimit = Math.min(total, 20);

      for (let i = 1; i <= renderLimit; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.3 });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;
          thumbs.push({
            pageIndex: i - 1,
            dataUrl: canvas.toDataURL('image/jpeg', 0.8),
          });
        }
      }

      setThumbnails(thumbs);
    } catch (err) {
      console.warn('[PDF.js Thumbnail Warning]', err);
    } finally {
      setIsLoadingThumbnails(false);
    }
  };

  const togglePageSelection = (pageNum: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageNum)) {
        next.delete(pageNum);
      } else {
        next.add(pageNum);
      }
      setRangeInput(Array.from(next).sort((a, b) => a - b).join(', '));
      return next;
    });
  };

  const handleRangeInputChange = (val: string) => {
    setRangeInput(val);
    const parse = parsePageRange(val, pageCount);
    if (parse.valid) {
      setSelectedPages(new Set(parse.pages));
      setErrorMsg(null);
    }
  };

  const handleSplit = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const srcPdf = await PDFDocument.load(arrayBuffer);

      if (mode === 'all') {
        const zip = new JSZip();
        const folder = zip.folder('extracted-pages');

        for (let i = 0; i < pageCount; i++) {
          const newPdf = await PDFDocument.create();
          const [copiedPage] = await newPdf.copyPages(srcPdf, [i]);
          newPdf.addPage(copiedPage);
          const pdfBytes = await newPdf.save();
          folder?.file(`page-${i + 1}.pdf`, pdfBytes);
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        if (resultBlobUrl) URL.revokeObjectURL(resultBlobUrl);
        setResultBlobUrl(URL.createObjectURL(zipBlob));
        setResultFileName('split-all-pages.zip');
      } else {
        const parseResult = parsePageRange(rangeInput, pageCount);
        if (!parseResult.valid) {
          setErrorMsg(parseResult.error || 'Invalid page selection range.');
          setIsProcessing(false);
          return;
        }

        const newPdf = await PDFDocument.create();
        const pageIndices = parseResult.pages.map((p) => p - 1);
        const copiedPages = await newPdf.copyPages(srcPdf, pageIndices);
        copiedPages.forEach((p) => newPdf.addPage(p));

        const pdfBytes = await newPdf.save();
        const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });

        if (resultBlobUrl) URL.revokeObjectURL(resultBlobUrl);
        setResultBlobUrl(URL.createObjectURL(blob));
        setResultFileName('extracted-pages.pdf');
      }

      setIsProcessing(false);
      trackEvent('tool_completed', { tool: 'split-pdf' });
    } catch (err: any) {
      console.error('Split PDF error:', err);
      setErrorMsg('Failed to split PDF document. Ensure the file is not encrypted.');
      setIsProcessing(false);
      trackEvent('tool_error', { tool: 'split-pdf' });
    }
  };

  const handleDownload = () => {
    if (!resultBlobUrl) return;
    const a = document.createElement('a');
    a.href = resultBlobUrl;
    a.download = resultFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    trackEvent('download_clicked', { tool: 'split-pdf' });
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPageCount(0);
    setThumbnails([]);
    if (resultBlobUrl) URL.revokeObjectURL(resultBlobUrl);
    setResultBlobUrl(null);
    setErrorMsg(null);
  };

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span>Your PDF is split locally inside your browser. No files are uploaded to our server.</span>
      </div>

      {!selectedFile ? (
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
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl p-8 sm:p-12 text-center bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
        >
          <label className="cursor-pointer flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 pointer-events-none">
              <Upload className="w-7 h-7" />
            </div>
            <span className="text-base font-bold text-slate-800 dark:text-slate-200 pointer-events-none">
              Drag & Drop PDF Here, or <span className="text-blue-600 dark:text-blue-400 underline">Browse</span>
            </span>
            <span className="text-xs text-slate-500 pointer-events-none">Select PDF document (Max 50MB)</span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">{selectedFile.name}</p>
              <p className="text-xs text-slate-500">{pageCount} Total Pages • {formatFileSize(selectedFile.size)}</p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
            >
              Choose Different PDF
            </button>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                <input
                  type="radio"
                  name="splitMode"
                  checked={mode === 'range'}
                  onChange={() => setMode('range')}
                  className="accent-blue-600"
                />
                <span>Extract Custom Page Selection / Ranges</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                <input
                  type="radio"
                  name="splitMode"
                  checked={mode === 'all'}
                  onChange={() => setMode('all')}
                  className="accent-blue-600"
                />
                <span>Extract All Pages as ZIP</span>
              </label>
            </div>

            {mode === 'range' && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Page Selection Range ({selectedPages.size} pages selected)
                </label>
                <input
                  type="text"
                  value={rangeInput}
                  onChange={(e) => handleRangeInputChange(e.target.value)}
                  placeholder="e.g. 1-5, 8, 10-12"
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-500">
                  Use comma-separated page numbers or ranges (e.g. 1-3, 5, 7). Or click thumbnails below.
                </p>
              </div>
            )}

            {mode === 'range' && (
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Click Thumbnails to Select/Deselect Pages
                </span>
                {isLoadingThumbnails ? (
                  <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Rendering page previews...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-64 overflow-y-auto p-1">
                    {thumbnails.map((t) => {
                      const pageNum = t.pageIndex + 1;
                      const isSelected = selectedPages.has(pageNum);
                      return (
                        <div
                          key={pageNum}
                          onClick={() => togglePageSelection(pageNum)}
                          className={`relative border-2 rounded-xl p-1 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/50 ring-2 ring-blue-500/20'
                              : 'border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={t.dataUrl} alt={`Page ${pageNum}`} className="w-full h-auto rounded object-contain" />
                          <div className="mt-1 flex items-center justify-between px-1 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                            <span>Page {pageNum}</span>
                            {isSelected ? <CheckSquare className="w-3 h-3 text-blue-600" /> : <Square className="w-3 h-3 text-slate-400" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleSplit}
            disabled={isProcessing || (mode === 'range' && selectedPages.size === 0)}
            className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Splitting PDF locally...</span>
              </>
            ) : (
              <span>
                {mode === 'all' ? `Extract All ${pageCount} Pages as ZIP` : `Extract ${selectedPages.size} Selected Pages`}
              </span>
            )}
          </button>

          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {resultBlobUrl && (
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <FileCheck className="w-5 h-5" />
                <span>Pages Extracted Successfully!</span>
              </div>
              <button
                type="button"
                onClick={handleDownload}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Download className="w-5 h-5" />
                <span>Download Extracted Files ({resultFileName})</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
