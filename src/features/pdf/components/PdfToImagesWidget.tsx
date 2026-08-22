import React, { useState } from 'react';
import JSZip from 'jszip';
import { validatePdfFile, formatFileSize } from '../utils/pdfValidation';
import { trackEvent } from '../../../lib/analytics';
import { Upload, Download, RefreshCw, AlertCircle, ShieldCheck, Archive } from 'lucide-react';

interface RenderedPageImage {
  pageNumber: number;
  dataUrl: string;
  blob: Blob;
}

export const PdfToImagesWidget: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [format, setFormat] = useState<'image/png' | 'image/jpeg'>('image/jpeg');
  const [scale, setScale] = useState<number>(2.0);

  const [isRendering, setIsRendering] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [renderedImages, setRenderedImages] = useState<RenderedPageImage[]>([]);

  const handleFileSelect = async (file: File | undefined) => {
    if (!file) return;
    setErrorMsg(null);
    setRenderedImages([]);

    const validation = await validatePdfFile(file);
    if (!validation.valid || !validation.pageCount) {
      setErrorMsg(validation.error || 'Invalid file.');
      return;
    }

    setSelectedFile(file);
    setPageCount(validation.pageCount);
    trackEvent('tool_started', { tool: 'pdf-to-images' });
  };

  const handleRenderPdf = async () => {
    if (!selectedFile) return;
    setIsRendering(true);
    setErrorMsg(null);
    setRenderedImages([]);

    try {
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
      if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '5.6.205'}/legacy/build/pdf.worker.min.mjs`;
      }

      const arrayBuffer = await selectedFile.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      const rendered: RenderedPageImage[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        setProgressMsg(`Rendering page ${i} of ${pdf.numPages}...`);

        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) throw new Error('Canvas context unavailable.');

        if (format === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        await page.render({ canvasContext: ctx, viewport, canvas }).promise;

        const dataUrl = canvas.toDataURL(format, 0.92);

        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => resolve(b!), format, 0.92);
        });

        rendered.push({
          pageNumber: i,
          dataUrl,
          blob,
        });
      }

      setRenderedImages(rendered);
      setIsRendering(false);
      setProgressMsg('');
      trackEvent('tool_completed', { tool: 'pdf-to-images' });
    } catch (err: any) {
      console.error('PDF Rendering error:', err);
      setErrorMsg('Failed to render PDF pages into images.');
      setIsRendering(false);
      setProgressMsg('');
      trackEvent('tool_error', { tool: 'pdf-to-images' });
    }
  };

  const downloadSingleImage = (img: RenderedPageImage) => {
    const a = document.createElement('a');
    const ext = format === 'image/png' ? '.png' : '.jpg';
    a.href = img.dataUrl;
    a.download = `page-${img.pageNumber}${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    trackEvent('download_clicked', { tool: 'pdf-to-images' });
  };

  const downloadAllAsZip = async () => {
    if (renderedImages.length === 0) return;
    const zip = new JSZip();
    const folder = zip.folder('pdf-images');
    const ext = format === 'image/png' ? 'png' : 'jpg';

    renderedImages.forEach((img) => {
      folder?.file(`page-${img.pageNumber}.${ext}`, img.blob);
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pdf-rendered-images.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    trackEvent('download_clicked', { tool: 'pdf-to-images' });
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPageCount(0);
    setRenderedImages([]);
    setErrorMsg(null);
    setProgressMsg('');
  };

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span>Your PDF pages are rendered into images 100% locally in your browser using PDF.js. No files are uploaded.</span>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Image Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="image/jpeg">JPG / JPEG</option>
                <option value="image/png">PNG</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Image Quality / Resolution</label>
              <select
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1.5}>Standard Quality (1.5x)</option>
                <option value={2.0}>High Quality (2.0x)</option>
                <option value={3.0}>Ultra High Quality (3.0x)</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRenderPdf}
            disabled={isRendering}
            className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            {isRendering ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>{progressMsg || 'Rendering PDF Pages...'}</span>
              </>
            ) : (
              <span>Convert All {pageCount} Pages to {format === 'image/png' ? 'PNG' : 'JPG'}</span>
            )}
          </button>

          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {renderedImages.length > 0 && (
            <div className="space-y-6 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  Rendered {renderedImages.length} Image Pages
                </span>
                <button
                  type="button"
                  onClick={downloadAllAsZip}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-2 cursor-pointer shadow"
                >
                  <Archive className="w-4 h-4" />
                  <span>Download All as ZIP</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto p-1">
                {renderedImages.map((img) => (
                  <div
                    key={img.pageNumber}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>Page {img.pageNumber}</span>
                      <span>{formatFileSize(img.blob.size)}</span>
                    </div>
                    <img src={img.dataUrl} alt={`Page ${img.pageNumber}`} className="max-h-48 mx-auto rounded-lg border border-slate-200 dark:border-slate-800 object-contain" />
                    <button
                      type="button"
                      onClick={() => downloadSingleImage(img)}
                      className="w-full py-2 rounded-lg text-xs font-bold bg-slate-200 dark:bg-slate-800 hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Page {img.pageNumber}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
