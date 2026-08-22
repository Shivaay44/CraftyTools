import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { validatePdfFile, formatFileSize } from '../utils/pdfValidation';
import { trackEvent } from '../../../lib/analytics';
import { Upload, Download, RefreshCw, AlertCircle, Trash2, ArrowUp, ArrowDown, ShieldCheck, FileCheck } from 'lucide-react';

interface PdfFileItem {
  id: string;
  file: File;
  pageCount: number;
}

export const MergePdfWidget: React.FC = () => {
  const [pdfItems, setPdfItems] = useState<PdfFileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [mergedBlobUrl, setMergedBlobUrl] = useState<string | null>(null);
  const [mergedPageCount, setMergedPageCount] = useState<number | null>(null);

  const handleFilesSelect = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setErrorMsg(null);
    if (mergedBlobUrl) URL.revokeObjectURL(mergedBlobUrl);
    setMergedBlobUrl(null);

    const newItems: PdfFileItem[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const validation = await validatePdfFile(file);
      if (validation.valid && validation.pageCount) {
        newItems.push({
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file,
          pageCount: validation.pageCount,
        });
      } else if (validation.error) {
        setErrorMsg(`"${file.name}": ${validation.error}`);
      }
    }

    if (newItems.length > 0) {
      setPdfItems((prev) => [...prev, ...newItems]);
      trackEvent('tool_started', { tool: 'merge-pdf' });
    }
  };

  const removePdf = (id: string) => {
    setPdfItems((prev) => prev.filter((item) => item.id !== id));
  };

  const movePdf = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= pdfItems.length) return;

    setPdfItems((prev) => {
      const list = [...prev];
      const temp = list[index];
      list[index] = list[targetIndex];
      list[targetIndex] = temp;
      return list;
    });
  };

  const handleMerge = async () => {
    if (pdfItems.length < 2) {
      setErrorMsg('Please select at least 2 PDF files to merge.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const item of pdfItems) {
        const arrayBuffer = await item.file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });

      if (mergedBlobUrl) URL.revokeObjectURL(mergedBlobUrl);
      const url = URL.createObjectURL(blob);

      setMergedBlobUrl(url);
      setMergedPageCount(mergedPdf.getPageCount());
      setIsProcessing(false);
      trackEvent('tool_completed', { tool: 'merge-pdf' });
    } catch (err: any) {
      console.error('Merge PDF Error:', err);
      setErrorMsg('An error occurred while merging PDFs. Ensure none of the files are corrupted.');
      setIsProcessing(false);
      trackEvent('tool_error', { tool: 'merge-pdf' });
    }
  };

  const handleDownload = () => {
    if (!mergedBlobUrl) return;
    const a = document.createElement('a');
    a.href = mergedBlobUrl;
    a.download = 'merged-document.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    trackEvent('download_clicked', { tool: 'merge-pdf' });
  };

  const handleReset = () => {
    setPdfItems([]);
    if (mergedBlobUrl) URL.revokeObjectURL(mergedBlobUrl);
    setMergedBlobUrl(null);
    setMergedPageCount(null);
    setErrorMsg(null);
  };

  const totalPagesSum = pdfItems.reduce((sum, item) => sum + item.pageCount, 0);

  return (
    <div className="space-y-6">
      {/* Privacy Badge */}
      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span>Your PDF is processed locally in your browser. It is not uploaded to our server.</span>
      </div>

      {/* File Upload Zone */}
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
          const droppedFiles: File[] = [];
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            for (let i = 0; i < e.dataTransfer.files.length; i++) {
              droppedFiles.push(e.dataTransfer.files[i]);
            }
          } else if (e.dataTransfer.items) {
            for (let i = 0; i < e.dataTransfer.items.length; i++) {
              const item = e.dataTransfer.items[i];
              if (item.kind === 'file') {
                const f = item.getAsFile();
                if (f) droppedFiles.push(f);
              }
            }
          }
          if (droppedFiles.length > 0) {
            handleFilesSelect(droppedFiles);
          }
        }}
        className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl p-8 text-center bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
      >
        <label className="cursor-pointer flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 pointer-events-none">
            <Upload className="w-6 h-6" />
          </div>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200 pointer-events-none">
            Add PDF Files ({pdfItems.length} selected)
          </span>
          <span className="text-xs text-slate-500 pointer-events-none">Drag & Drop or browse 2 or more PDF documents</span>
          <input
            type="file"
            multiple
            accept="application/pdf,.pdf"
            onChange={(e) => handleFilesSelect(e.target.files)}
            className="hidden"
          />
        </label>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Selected PDF File List */}
      {pdfItems.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Merge Order ({pdfItems.length} Files • {totalPagesSum} Pages)
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
            >
              Clear List
            </button>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {pdfItems.map((item, index) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.file.name}</p>
                    <p className="text-xs text-slate-500">
                      {item.pageCount} {item.pageCount === 1 ? 'page' : 'pages'} • {formatFileSize(item.file.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => movePdf(index, 'up')}
                    disabled={index === 0}
                    className="p-1.5 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 disabled:opacity-30 cursor-pointer"
                    title="Move Up"
                  >
                    <ArrowUp className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                  </button>
                  <button
                    type="button"
                    onClick={() => movePdf(index, 'down')}
                    disabled={index === pdfItems.length - 1}
                    className="p-1.5 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 disabled:opacity-30 cursor-pointer"
                    title="Move Down"
                  >
                    <ArrowDown className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removePdf(item.id)}
                    className="p-1.5 rounded bg-slate-200 dark:bg-slate-800 hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
                    title="Remove File"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Merge Action Button */}
          <button
            type="button"
            onClick={handleMerge}
            disabled={isProcessing || pdfItems.length < 2}
            className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Merging PDFs locally...</span>
              </>
            ) : (
              <span>Merge {pdfItems.length} PDFs ({totalPagesSum} Pages)</span>
            )}
          </button>

          {/* Result Card */}
          {mergedBlobUrl && (
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <FileCheck className="w-5 h-5" />
                <span>PDFs Merged Successfully! ({mergedPageCount} Total Pages from {pdfItems.length} files)</span>
              </div>
              <button
                type="button"
                onClick={handleDownload}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Download className="w-5 h-5" />
                <span>Download Merged PDF</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
