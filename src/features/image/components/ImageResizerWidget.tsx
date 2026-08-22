import React, { useState } from 'react';
import { validateImageFile } from '../utils/imageValidation';
import { trackEvent } from '../../../lib/analytics';
import { Upload, Download, RefreshCw, AlertCircle, Lock, Unlock, ShieldCheck, AlertTriangle } from 'lucide-react';

export const ImageResizerWidget: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [origDimensions, setOrigDimensions] = useState<{ width: number; height: number } | null>(null);
  const [aspectRatio, setAspectRatio] = useState<number>(1);
  const [lockAspect, setLockAspect] = useState<boolean>(true);

  const [targetWidth, setTargetWidth] = useState<number>(0);
  const [targetHeight, setTargetHeight] = useState<number>(0);
  const [outputFormat, setOutputFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
  const [quality, setQuality] = useState<number>(90);

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resizedUrl, setResizedUrl] = useState<string | null>(null);
  const [, setResizedBlob] = useState<Blob | null>(null);

  const handleFileSelect = async (file: File | undefined) => {
    if (!file) return;
    setErrorMsg(null);
    if (resizedUrl) URL.revokeObjectURL(resizedUrl);
    setResizedUrl(null);
    setResizedBlob(null);

    const validation = await validateImageFile(file);
    if (!validation.valid || !validation.dimensions) {
      setErrorMsg(validation.error || 'Invalid file.');
      return;
    }

    setSelectedFile(file);
    setOrigDimensions(validation.dimensions);
    setTargetWidth(validation.dimensions.width);
    setTargetHeight(validation.dimensions.height);
    setAspectRatio(validation.dimensions.width / validation.dimensions.height);

    // Default format matches uploaded file if valid
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setOutputFormat(file.type as 'image/jpeg' | 'image/png' | 'image/webp');
    }

    trackEvent('tool_started', { tool: 'image-resizer' });
  };

  const handleWidthChange = (val: number) => {
    setTargetWidth(val);
    if (lockAspect && aspectRatio > 0) {
      setTargetHeight(Math.round(val / aspectRatio));
    }
  };

  const handleHeightChange = (val: number) => {
    setTargetHeight(val);
    if (lockAspect && aspectRatio > 0) {
      setTargetWidth(Math.round(val * aspectRatio));
    }
  };

  const handleResize = async () => {
    if (!selectedFile || !origDimensions || targetWidth <= 0 || targetHeight <= 0) return;
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
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Canvas context not available.');
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      URL.revokeObjectURL(tempUrl);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setErrorMsg('Failed to process image on Canvas.');
            setIsProcessing(false);
            return;
          }

          setResizedBlob(blob);
          if (resizedUrl) URL.revokeObjectURL(resizedUrl);
          setResizedUrl(URL.createObjectURL(blob));
          setIsProcessing(false);
          trackEvent('tool_completed', { tool: 'image-resizer' });
        },
        outputFormat,
        quality / 100
      );
    } catch (err: any) {
      console.error('Resize error:', err);
      setErrorMsg('An error occurred while resizing the image.');
      setIsProcessing(false);
      trackEvent('tool_error', { tool: 'image-resizer' });
    }
  };

  const handleDownload = () => {
    if (!resizedUrl || !selectedFile) return;
    const a = document.createElement('a');
    a.href = resizedUrl;
    const ext = outputFormat === 'image/png' ? '.png' : outputFormat === 'image/webp' ? '.webp' : '.jpg';
    a.download = `resized-${targetWidth}x${targetHeight}-${selectedFile.name.replace(/\.[^/.]+$/, '')}${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    trackEvent('download_clicked', { tool: 'image-resizer' });
  };

  const handleReset = () => {
    setSelectedFile(null);
    setOrigDimensions(null);
    if (resizedUrl) URL.revokeObjectURL(resizedUrl);
    setResizedUrl(null);
    setResizedBlob(null);
    setErrorMsg(null);
  };

  const isUpscaling = origDimensions && (targetWidth > origDimensions.width * 1.5 || targetHeight > origDimensions.height * 1.5);

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span>Your image is processed 100% locally in your browser. It is not uploaded to our server.</span>
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
            <span className="text-xs text-slate-500 pointer-events-none">Supports JPG, PNG, WebP, AVIF</span>
            <input
              type="file"
              accept="image/*,.jpg,.jpeg,.png,.webp,.avif"
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
              <p className="text-xs text-slate-500">Original Dimensions: {origDimensions?.width} × {origDimensions?.height} px</p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
            >
              Choose Different Image
            </button>
          </div>

          {/* Controls */}
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Target Dimensions</h4>
              <button
                type="button"
                onClick={() => setLockAspect(!lockAspect)}
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-3 py-1.5 rounded-lg cursor-pointer"
              >
                {lockAspect ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                <span>{lockAspect ? 'Aspect Ratio Locked' : 'Aspect Ratio Unlocked'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Width (px)</label>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={targetWidth}
                  onChange={(e) => handleWidthChange(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Height (px)</label>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={targetHeight}
                  onChange={(e) => handleHeightChange(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Output format & Quality */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Export Format</label>
                <select
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value as any)}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="image/jpeg">JPG / JPEG</option>
                  <option value="image/png">PNG</option>
                  <option value="image/webp">WebP</option>
                </select>
              </div>

              {outputFormat !== 'image/png' && (
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

          {/* Upscaling Warning */}
          {isUpscaling && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Upscaling may reduce image quality.</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleResize}
            disabled={isProcessing || targetWidth <= 0 || targetHeight <= 0}
            className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Resizing Image...</span>
              </>
            ) : (
              <span>Resize Image Now</span>
            )}
          </button>

          {/* Errors */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Resized Result */}
          {resizedUrl && (
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-5 text-center">
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Resized to {targetWidth} × {targetHeight} px ({outputFormat.split('/')[1].toUpperCase()})
              </div>
              <img src={resizedUrl} alt="Resized output" className="max-h-64 mx-auto rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 object-contain" />
              <button
                type="button"
                onClick={handleDownload}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Download className="w-5 h-5" />
                <span>Download Resized Image</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
