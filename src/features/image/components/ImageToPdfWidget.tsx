import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { validateImageFile, formatFileSize } from '../utils/imageValidation';
import { trackEvent } from '../../../lib/analytics';
import { Upload, Download, RefreshCw, AlertCircle, Trash2, ArrowUp, ArrowDown, ShieldCheck, FileCheck } from 'lucide-react';

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
}

export const ImageToPdfWidget: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = useState<'a4' | 'letter' | 'fit'>('a4');
  const [orientation, setOrientation] = useState<'p' | 'l' | 'auto'>('auto');
  const [margin, setMargin] = useState<number>(10); // mm

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  const handleFilesSelect = async (fileList: FileList | File[] | null) => {
    if (!fileList || fileList.length === 0) return;
    setErrorMsg(null);
    if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    setPdfBlobUrl(null);

    const newItems: ImageItem[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const validation = await validateImageFile(file);
      if (validation.valid) {
        newItems.push({
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file,
          previewUrl: URL.createObjectURL(file),
        });
      }
    }

    if (newItems.length === 0) {
      setErrorMsg('No valid image files selected.');
      return;
    }

    setImages((prev) => [...prev, ...newItems]);
    trackEvent('tool_started', { tool: 'image-to-pdf' });
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    setImages((prev) => {
      const list = [...prev];
      const temp = list[index];
      list[index] = list[targetIndex];
      list[targetIndex] = temp;
      return list;
    });
  };

  const handleGeneratePdf = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      let doc: jsPDF | null = null;

      for (let i = 0; i < images.length; i++) {
        const item = images[i];
        
        // Read file into Image object to get dimensions
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = item.previewUrl;
        });

        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;

        // Determine orientation if auto
        let pageOrient: 'p' | 'l' = 'p';
        if (orientation === 'auto') {
          pageOrient = imgWidth > imgHeight ? 'l' : 'p';
        } else {
          pageOrient = orientation;
        }

        const format = pageSize === 'fit' ? [imgWidth, imgHeight] : pageSize;

        if (i === 0) {
          doc = new jsPDF({
            orientation: pageOrient,
            unit: 'mm',
            format: format as any,
          });
        } else if (doc) {
          doc.addPage(format as any, pageOrient);
        }

        if (!doc) continue;

        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = doc.internal.pageSize.getHeight();

        const availWidth = pdfWidth - margin * 2;
        const availHeight = pdfHeight - margin * 2;

        // Calculate aspect fit inside page margins
        const widthRatio = availWidth / imgWidth;
        const heightRatio = availHeight / imgHeight;
        const scale = Math.min(widthRatio, heightRatio);

        const renderWidth = imgWidth * scale;
        const renderHeight = imgHeight * scale;

        const x = (pdfWidth - renderWidth) / 2;
        const y = (pdfHeight - renderHeight) / 2;

        // Draw image onto canvas to get standard data URL
        const canvas = document.createElement('canvas');
        canvas.width = imgWidth;
        canvas.height = imgHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          doc.addImage(dataUrl, 'JPEG', x, y, renderWidth, renderHeight);
        }
      }

      if (!doc) throw new Error('Failed to create PDF document.');

      const pdfBlob = doc.output('blob');
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(URL.createObjectURL(pdfBlob));

      setIsProcessing(false);
      trackEvent('tool_completed', { tool: 'image-to-pdf' });
    } catch (err: any) {
      console.error('PDF Generation Error:', err);
      setErrorMsg('Failed to generate PDF document. Please try again.');
      setIsProcessing(false);
      trackEvent('tool_error', { tool: 'image-to-pdf' });
    }
  };

  const handleDownload = () => {
    if (!pdfBlobUrl) return;
    const a = document.createElement('a');
    a.href = pdfBlobUrl;
    a.download = `toolchemy-converted-images.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    trackEvent('download_clicked', { tool: 'image-to-pdf' });
  };

  const handleReset = () => {
    images.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setImages([]);
    if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    setPdfBlobUrl(null);
    setErrorMsg(null);
  };

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span>Your images are converted locally in your browser using jsPDF. No files are uploaded.</span>
      </div>

      {/* Drag & Drop Upload Zone */}
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
            Add Images to PDF ({images.length} selected)
          </span>
          <span className="text-xs text-slate-500 pointer-events-none">Drag & Drop or click to browse (JPG, PNG, WebP)</span>
          <input
            type="file"
            multiple
            accept="image/*,.jpg,.jpeg,.png,.webp,.avif"
            onChange={(e) => handleFilesSelect(e.target.files)}
            className="hidden"
          />
        </label>
      </div>

      {/* Selected Images List */}
      {images.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Page Order ({images.length} Pages)
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline"
            >
              Clear All Images
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
            {images.map((item, index) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                    {index + 1}
                  </span>
                  <img src={item.previewUrl} alt="Thumbnail" className="w-12 h-12 object-cover rounded-lg flex-shrink-0 border border-slate-200 dark:border-slate-800" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.file.name}</p>
                    <p className="text-[10px] text-slate-500">{formatFileSize(item.file.size)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveImage(index, 'up')}
                    disabled={index === 0}
                    className="p-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 disabled:opacity-30 cursor-pointer"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(index, 'down')}
                    disabled={index === images.length - 1}
                    className="p-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 disabled:opacity-30 cursor-pointer"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImage(item.id)}
                    className="p-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* PDF Page Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Page Size</label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="a4">A4 Standard</option>
                <option value="letter">US Letter</option>
                <option value="fit">Fit to Image Size</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Orientation</label>
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="auto">Auto (Match Image)</option>
                <option value="p">Portrait</option>
                <option value="l">Landscape</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Page Margins</label>
              <select
                value={margin}
                onChange={(e) => setMargin(parseInt(e.target.value, 10))}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>No Margins</option>
                <option value={10}>Small (10mm)</option>
                <option value={20}>Medium (20mm)</option>
              </select>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={handleGeneratePdf}
            disabled={isProcessing || images.length === 0}
            className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Creating PDF Document...</span>
              </>
            ) : (
              <span>Convert {images.length} Images to PDF</span>
            )}
          </button>

          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* PDF Result */}
          {pdfBlobUrl && (
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <FileCheck className="w-5 h-5" />
                <span>PDF Generated Successfully!</span>
              </div>
              <button
                type="button"
                onClick={handleDownload}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Download className="w-5 h-5" />
                <span>Download PDF Document</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
