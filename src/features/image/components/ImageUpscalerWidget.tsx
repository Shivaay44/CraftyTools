import React, { useState, useRef } from 'react';
import { trackEvent } from '../../../lib/analytics';
import {
  Upload,
  Download,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Sliders,
  Check,
  AlertCircle
} from 'lucide-react';

export const ImageUpscalerWidget: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [upscaledUrl, setUpscaledUrl] = useState<string | null>(null);
  const [scaleFactor, setScaleFactor] = useState<number>(2); // 2x or 4x
  const [sharpenIntensity, setSharpenIntensity] = useState<number>(35); // 0 - 100
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [originalDim, setOriginalDim] = useState<{ width: number; height: number } | null>(null);
  const [upscaledDim, setUpscaledDim] = useState<{ width: number; height: number } | null>(null);
  const [sliderPosition, setSliderPosition] = useState<number>(50); // 0 to 100%
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  const handleFileChange = (selectedFile: File | undefined) => {
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    setErrorMsg(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (upscaledUrl) URL.revokeObjectURL(upscaledUrl);

    setFile(selectedFile);
    setUpscaledUrl(null);
    setUpscaledDim(null);

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    const img = new Image();
    img.onload = () => {
      setOriginalDim({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = url;

    trackEvent('tool_started', { tool: 'image-upscaler' });
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
    if (droppedFile) {
      handleFileChange(droppedFile);
    }
  };

  const applyUnsharpMask = (ctx: CanvasRenderingContext2D, width: number, height: number, amount: number) => {
    if (amount <= 0) return;
    try {
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;
      const copy = new Uint8ClampedArray(data);

      const strength = (amount / 100) * 1.5;

      // 3x3 Sharpen Convolution Kernel: [0, -1, 0, -1, 4+strength, -1, 0, -1, 0]
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = (y * width + x) * 4;

          for (let c = 0; c < 3; c++) {
            const current = copy[idx + c];
            const top = copy[((y - 1) * width + x) * 4 + c];
            const bottom = copy[((y + 1) * width + x) * 4 + c];
            const left = copy[(y * width + (x - 1)) * 4 + c];
            const right = copy[(y * width + (x + 1)) * 4 + c];

            const laplacian = 4 * current - (top + bottom + left + right);
            const val = current + strength * laplacian;
            data[idx + c] = Math.min(255, Math.max(0, val));
          }
        }
      }
      ctx.putImageData(imgData, 0, 0);
    } catch (e) {
      console.warn('Canvas pixel manipulation restricted:', e);
    }
  };

  const processUpscale = async () => {
    if (!file || !originalDim) return;
    setIsProcessing(true);
    setProgress(10);
    setErrorMsg(null);

    try {
      const img = new Image();
      img.src = previewUrl!;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const targetW = Math.round(originalDim.width * scaleFactor);
      const targetH = Math.round(originalDim.height * scaleFactor);

      setProgress(30);

      // Multi-step Lanczos/Bicubic progressive stepping for ultra-clean scaling
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (!ctx) throw new Error('Could not initialize canvas context.');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Progressive 2-pass scaling if 4x
      if (scaleFactor === 4) {
        const intermediateCanvas = document.createElement('canvas');
        intermediateCanvas.width = originalDim.width * 2;
        intermediateCanvas.height = originalDim.height * 2;
        const intCtx = intermediateCanvas.getContext('2d');
        if (intCtx) {
          intCtx.imageSmoothingEnabled = true;
          intCtx.imageSmoothingQuality = 'high';
          intCtx.drawImage(img, 0, 0, intermediateCanvas.width, intermediateCanvas.height);
          setProgress(50);
          ctx.drawImage(intermediateCanvas, 0, 0, targetW, targetH);
        } else {
          ctx.drawImage(img, 0, 0, targetW, targetH);
        }
      } else {
        ctx.drawImage(img, 0, 0, targetW, targetH);
      }

      setProgress(70);

      // Apply sharpening kernel
      applyUnsharpMask(ctx, targetW, targetH, sharpenIntensity);

      setProgress(90);

      const mime = `image/${format}`;
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), mime, 0.95)
      );

      if (!blob) throw new Error('Failed to generate upscaled image blob.');

      if (upscaledUrl) URL.revokeObjectURL(upscaledUrl);
      const outputUrl = URL.createObjectURL(blob);
      setUpscaledUrl(outputUrl);
      setUpscaledDim({ width: targetW, height: targetH });
      setProgress(100);
      trackEvent('tool_completed', { tool: 'image-upscaler', scale: scaleFactor });
    } catch (err: any) {
      console.error('Upscaling error:', err);
      setErrorMsg(err.message || 'Failed to upscale image.');
      trackEvent('tool_error', { tool: 'image-upscaler' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSliderMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pos = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(pos);
  };

  const handleMouseDown = () => {
    isDraggingRef.current = true;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      handleSliderMove(e.clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      handleSliderMove(e.touches[0].clientX);
    }
  };

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span>100% Client-Side Privacy: Super-resolution processing runs directly in your browser.</span>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Upload Zone */}
      {!previewUrl && (
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
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl p-12 text-center transition-all bg-slate-50/50 dark:bg-slate-900/50 cursor-pointer"
        >
          <label className="cursor-pointer flex flex-col items-center justify-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 pointer-events-none">
              <Upload className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 pointer-events-none">
              Select or drag & drop an image to upscale
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 pointer-events-none">
              Supports PNG, JPG, and WebP (up to 50MB)
            </p>
            <input
              type="file"
              accept="image/*,.png,.jpg,.jpeg,.webp,.avif"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0])}
            />
          </label>
        </div>
      )}

      {/* Controls and Viewer */}
      {previewUrl && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Scale Multiplier */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Upscale Factor
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setScaleFactor(2)}
                    className={`py-2 px-3 rounded-xl font-bold text-sm border transition-all ${
                      scaleFactor === 2
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    2x (200%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setScaleFactor(4)}
                    className={`py-2 px-3 rounded-xl font-bold text-sm border transition-all ${
                      scaleFactor === 4
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    4x (400%)
                  </button>
                </div>
              </div>

              {/* Sharpening Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Sharpness Enhancement
                  </label>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    {sharpenIntensity}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sharpenIntensity}
                  onChange={(e) => setSharpenIntensity(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Output Format */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Export Format
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as any)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="png">PNG (Lossless High Quality)</option>
                  <option value="jpeg">JPG (Optimized)</option>
                  <option value="webp">WebP (Modern Compact)</option>
                </select>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                {originalDim && (
                  <span>
                    Original: <strong className="text-slate-700 dark:text-slate-200">{originalDim.width} × {originalDim.height} px</strong>
                  </span>
                )}
                {originalDim && (
                  <span>
                    → Target: <strong className="text-blue-600 dark:text-blue-400">{Math.round(originalDim.width * scaleFactor)} × {Math.round(originalDim.height * scaleFactor)} px</strong>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setPreviewUrl(null);
                    setUpscaledUrl(null);
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Choose New Image
                </button>

                <button
                  type="button"
                  onClick={processUpscale}
                  disabled={isProcessing}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Upscaling ({progress}%)...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>{upscaledUrl ? 'Re-Upscale' : 'Upscale Image Now'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Before/After Split Viewer */}
          {upscaledUrl ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Drag the slider to compare Before (Left) vs After {scaleFactor}x Upscale (Right)
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="w-4 h-4" /> Upscaled to {upscaledDim?.width} × {upscaledDim?.height} px
                </span>
              </div>

              <div
                ref={containerRef}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                onTouchMove={handleTouchMove}
                className="relative h-[480px] w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 select-none cursor-ew-resize shadow-inner"
              >
                {/* After Image (Full background) */}
                <img
                  src={upscaledUrl}
                  alt="Upscaled"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                />

                {/* Before Image (Clipped overlay) */}
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{ width: `${sliderPosition}%` }}
                >
                  <img
                    src={previewUrl}
                    alt="Original"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    style={{
                      width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%',
                      maxWidth: 'none',
                    }}
                  />
                  <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/10">
                    Original
                  </div>
                </div>

                <div className="absolute top-4 right-4 bg-blue-600/85 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/20">
                  {scaleFactor}x Upscaled
                </div>

                {/* Split Handle Bar */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-lg pointer-events-none"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-slate-800 shadow-xl border-2 border-blue-500 flex items-center justify-center">
                    <Sliders className="w-4 h-4 transform rotate-90" />
                  </div>
                </div>
              </div>

              {/* Download Bar */}
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Your high-resolution image is ready!
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Upscaled by {scaleFactor}x • {upscaledDim?.width} × {upscaledDim?.height} pixels • .{format.toUpperCase()}
                  </p>
                </div>
                <a
                  href={upscaledUrl}
                  download={`upscaled-${scaleFactor}x-${file?.name?.replace(/\.[^/.]+$/, '') || 'image'}.${format}`}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Upscaled Image</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-center">
              <img
                src={previewUrl}
                alt="Selected"
                className="max-h-72 mx-auto rounded-xl shadow-md border border-slate-200 dark:border-slate-700 object-contain mb-4"
              />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Click <strong>"Upscale Image Now"</strong> above to enhance details and increase resolution to {originalDim ? Math.round(originalDim.width * scaleFactor) : 0} × {originalDim ? Math.round(originalDim.height * scaleFactor) : 0} px.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
