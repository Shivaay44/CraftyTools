import React, { useState } from 'react';
import imageCompression from 'browser-image-compression';
import { validateImageFile, formatFileSize } from '../utils/imageValidation';
import { trackEvent } from '../../../lib/analytics';
import { Upload, Download, RefreshCw, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

export const ImageCompressorWidget: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [quality, setQuality] = useState<number>(80);
  const [maxWidth, setMaxWidth] = useState<string>('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [, setCompressedBlob] = useState<Blob | null>(null);
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);

  const handleFileSelect = async (file: File | undefined) => {
    if (!file) return;
    setErrorMsg(null);
    setCompressedBlob(null);
    if (compressedUrl) URL.revokeObjectURL(compressedUrl);
    setCompressedUrl(null);

    const validation = await validateImageFile(file);
    if (!validation.valid) {
      setErrorMsg(validation.error || 'Invalid file.');
      return;
    }

    setSelectedFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    trackEvent('tool_started', { tool: 'image-compressor' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
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
  };

  const handleCompress = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const options = {
        maxSizeMB: 10,
        initialQuality: quality / 100,
        useWebWorker: true,
        maxWidthOrHeight: maxWidth ? parseInt(maxWidth, 10) : undefined,
      };

      const compressedFile = await imageCompression(selectedFile, options);
      setCompressedBlob(compressedFile);
      setCompressedSize(compressedFile.size);

      if (compressedUrl) URL.revokeObjectURL(compressedUrl);
      const url = URL.createObjectURL(compressedFile);
      setCompressedUrl(url);

      trackEvent('tool_completed', { tool: 'image-compressor' });
    } catch (err: any) {
      console.error('Compression error:', err);
      setErrorMsg('Failed to compress image. Please try adjusting quality or file size.');
      trackEvent('tool_error', { tool: 'image-compressor' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!compressedUrl || !selectedFile) return;
    const a = document.createElement('a');
    a.href = compressedUrl;
    const extension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.'));
    a.download = `compressed-${selectedFile.name.replace(/\.[^/.]+$/, '')}${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    trackEvent('download_clicked', { tool: 'image-compressor' });
  };

  const handleReset = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (compressedUrl) URL.revokeObjectURL(compressedUrl);
    setPreviewUrl(null);
    setCompressedUrl(null);
    setCompressedBlob(null);
    setCompressedSize(null);
    setErrorMsg(null);
  };

  const reductionPercentage =
    selectedFile && compressedSize
      ? Math.max(0, Math.round(((selectedFile.size - compressedSize) / selectedFile.size) * 100))
      : 0;

  return (
    <div className="space-y-6">
      {/* Privacy Banner */}
      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span>Your image is processed 100% locally in your browser. It is never uploaded to our server.</span>
      </div>

      {/* Upload Zone */}
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
          onDrop={handleDrop}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl p-8 sm:p-12 text-center bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
        >
          <label className="cursor-pointer flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 pointer-events-none">
              <Upload className="w-7 h-7" />
            </div>
            <span className="text-base font-bold text-slate-800 dark:text-slate-200 pointer-events-none">
              Drag & Drop Image Here, or <span className="text-blue-600 dark:text-blue-400 underline">Browse</span>
            </span>
            <span className="text-xs text-slate-500 pointer-events-none">Supports JPG, PNG, WebP, AVIF</span>
            <input
              type="file"
              accept="image/*,.jpg,.jpeg,.png,.webp,.avif"
              onChange={handleInputChange}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        /* Processing Controls & Previews */
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="space-y-1">
              <p className="font-bold text-slate-900 dark:text-white text-sm truncate max-w-xs sm:max-w-md">
                {selectedFile.name}
              </p>
              <p className="text-xs text-slate-500">Original Size: {formatFileSize(selectedFile.size)}</p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
            >
              Choose Different Image
            </button>
          </div>

          {/* Quality & Max Dimension Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Compression Quality</span>
                <span>{quality}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Max Width / Height (Optional)
              </label>
              <input
                type="number"
                placeholder="e.g. 1920"
                value={maxWidth}
                onChange={(e) => setMaxWidth(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Compress Action Button */}
          <button
            type="button"
            onClick={handleCompress}
            disabled={isProcessing}
            className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Compressing locally in browser...</span>
              </>
            ) : (
              <span>Compress Image Now</span>
            )}
          </button>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Compression Results */}
          {compressedUrl && compressedSize !== null && (
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Compression Successful!</span>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Original</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {formatFileSize(selectedFile.size)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Compressed</span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {formatFileSize(compressedSize)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
                  <span className="block text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Reduction</span>
                  <span className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                    {reductionPercentage}% Saved
                  </span>
                </div>
              </div>

              {/* Image Preview */}
              <div className="text-center">
                <img src={compressedUrl} alt="Compressed preview" className="max-h-64 mx-auto rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 object-contain" />
              </div>

              {/* Download Button */}
              <button
                type="button"
                onClick={handleDownload}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Download className="w-5 h-5" />
                <span>Download Compressed Image</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
