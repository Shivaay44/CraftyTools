import React, { useState } from 'react';
import { validateImageFile, formatFileSize } from '../utils/imageValidation';
import { trackEvent } from '../../../lib/analytics';
import { Upload, Download, RefreshCw, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

export const ImageFormatConverterWidget: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [targetFormat, setTargetFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/webp');
  const [quality, setQuality] = useState<number>(90);

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);

  const handleFileSelect = async (file: File | undefined) => {
    if (!file) return;
    setErrorMsg(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (convertedUrl) URL.revokeObjectURL(convertedUrl);
    setConvertedUrl(null);
    setConvertedBlob(null);

    const validation = await validateImageFile(file);
    if (!validation.valid) {
      setErrorMsg(validation.error || 'Invalid file.');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));

    // Default target format logic (if uploaded file is PNG, default target to JPG/WebP)
    if (file.type === 'image/png') {
      setTargetFormat('image/jpeg');
    } else if (file.type === 'image/jpeg') {
      setTargetFormat('image/webp');
    } else {
      setTargetFormat('image/png');
    }

    trackEvent('tool_started', { tool: 'image-format-converter' });
  };

  const handleConvert = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const img = new Image();
      const tempUrl = URL.createObjectURL(selectedFile);

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = tempUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Canvas context unavailable.');

      // If converting to JPEG, draw white background first to avoid black transparent PNG background
      if (targetFormat === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(tempUrl);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setErrorMsg('Failed to convert image format.');
            setIsProcessing(false);
            return;
          }

          setConvertedBlob(blob);
          if (convertedUrl) URL.revokeObjectURL(convertedUrl);
          setConvertedUrl(URL.createObjectURL(blob));
          setIsProcessing(false);
          trackEvent('tool_completed', { tool: 'image-format-converter' });
        },
        targetFormat,
        quality / 100
      );
    } catch (err: any) {
      console.error('Format conversion error:', err);
      setErrorMsg('An error occurred while converting the image format.');
      setIsProcessing(false);
      trackEvent('tool_error', { tool: 'image-format-converter' });
    }
  };

  const handleDownload = () => {
    if (!convertedUrl || !selectedFile) return;
    const a = document.createElement('a');
    a.href = convertedUrl;
    const ext = targetFormat === 'image/png' ? '.png' : targetFormat === 'image/webp' ? '.webp' : '.jpg';
    a.download = `converted-${selectedFile.name.replace(/\.[^/.]+$/, '')}${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    trackEvent('download_clicked', { tool: 'image-format-converter' });
  };

  const handleReset = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (convertedUrl) URL.revokeObjectURL(convertedUrl);
    setPreviewUrl(null);
    setConvertedUrl(null);
    setConvertedBlob(null);
    setErrorMsg(null);
  };

  const getFormatLabel = (mime: string) => {
    if (mime === 'image/jpeg') return 'JPG';
    if (mime === 'image/png') return 'PNG';
    if (mime === 'image/webp') return 'WebP';
    return mime;
  };

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span>Your image format conversion happens 100% locally in your browser via Canvas API. No files are uploaded.</span>
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
              Drag & Drop Image Here, or <span className="text-blue-600 dark:text-blue-400 underline">Browse</span>
            </span>
            <span className="text-xs text-slate-500 pointer-events-none">Supports JPG, PNG, WebP, AVIF, BMP, GIF</span>
            <input
              type="file"
              accept="image/*,.jpg,.jpeg,.png,.webp,.avif,.bmp,.gif"
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
              <p className="text-xs text-slate-500">
                Original Format: <span className="font-bold uppercase">{getFormatLabel(selectedFile.type)}</span> ({formatFileSize(selectedFile.size)})
              </p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
            >
              Choose Different Image
            </button>
          </div>

          {/* Options */}
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Convert To Format</label>
                <select
                  value={targetFormat}
                  onChange={(e) => setTargetFormat(e.target.value as any)}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="image/jpeg">JPG / JPEG</option>
                  <option value="image/png">PNG</option>
                  <option value="image/webp">WebP</option>
                </select>
              </div>

              {targetFormat !== 'image/png' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>Quality</span>
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
              )}
            </div>
          </div>

          {/* Convert Action */}
          <button
            type="button"
            onClick={handleConvert}
            disabled={isProcessing}
            className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Converting Format...</span>
              </>
            ) : (
              <span>Convert to {getFormatLabel(targetFormat)}</span>
            )}
          </button>

          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Converted Output */}
          {convertedUrl && convertedBlob && (
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-5 text-center">
              <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Converted to {getFormatLabel(targetFormat)} ({formatFileSize(convertedBlob.size)})</span>
              </div>
              <img src={convertedUrl} alt="Converted output preview" className="max-h-64 mx-auto rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 object-contain" />
              <button
                type="button"
                onClick={handleDownload}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Download className="w-5 h-5" />
                <span>Download Converted {getFormatLabel(targetFormat)} Image</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
