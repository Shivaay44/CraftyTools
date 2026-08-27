import React, { useState, useRef, useEffect } from 'react';
import { trackEvent } from '../../../lib/analytics';
import {
  Download,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  ShieldCheck,
  Upload,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

type AspectRatio = 'free' | '1:1' | '16:9' | '9:16' | '4:3' | '3:2';

interface CropBox {
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  width: number; // percentage (0 - 100)
  height: number; // percentage (0 - 100)
}

export const ImageCropperWidget: React.FC = () => {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('free');
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [cropBox, setCropBox] = useState<CropBox>({ x: 10, y: 10, width: 80, height: 80 });
  const [format, setFormat] = useState<'image/png' | 'image/jpeg' | 'image/webp'>('image/png');
  const [quality, setQuality] = useState<number>(0.92);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [initialBox, setInitialBox] = useState<CropBox | null>(null);
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string | null>(null);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleFileChange = (selectedFile: File | undefined) => {
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    setErrorMsg(null);
    if (imgSrc) URL.revokeObjectURL(imgSrc);
    if (croppedPreviewUrl) URL.revokeObjectURL(croppedPreviewUrl);

    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setCroppedPreviewUrl(null);

    const url = URL.createObjectURL(selectedFile);
    setImgSrc(url);
    setCropBox({ x: 10, y: 10, width: 80, height: 80 });
    trackEvent('tool_started', { tool: 'image-cropper' });
  };

  // Adjust crop box when aspect ratio changes
  useEffect(() => {
    if (aspectRatio === 'free') return;

    let targetRatio = 1;
    if (aspectRatio === '1:1') targetRatio = 1;
    else if (aspectRatio === '16:9') targetRatio = 16 / 9;
    else if (aspectRatio === '9:16') targetRatio = 9 / 16;
    else if (aspectRatio === '4:3') targetRatio = 4 / 3;
    else if (aspectRatio === '3:2') targetRatio = 3 / 2;

    setCropBox((prev) => {
      let newWidth = prev.width;
      let newHeight = newWidth / targetRatio;

      if (newHeight > 90) {
        newHeight = 80;
        newWidth = newHeight * targetRatio;
      }
      if (newWidth > 90) {
        newWidth = 80;
        newHeight = newWidth / targetRatio;
      }

      return {
        x: Math.max(0, Math.min(100 - newWidth, prev.x)),
        y: Math.max(0, Math.min(100 - newHeight, prev.y)),
        width: Math.min(100, Math.max(10, newWidth)),
        height: Math.min(100, Math.max(10, newHeight)),
      };
    });
  }, [aspectRatio]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialBox({ ...cropBox });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart || !initialBox || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const deltaXPercent = ((e.clientX - dragStart.x) / rect.width) * 100;
    const deltaYPercent = ((e.clientY - dragStart.y) / rect.height) * 100;

    let newX = initialBox.x + deltaXPercent;
    let newY = initialBox.y + deltaYPercent;

    newX = Math.max(0, Math.min(100 - initialBox.width, newX));
    newY = Math.max(0, Math.min(100 - initialBox.height, newY));

    setCropBox({
      ...initialBox,
      x: newX,
      y: newY,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
    setInitialBox(null);
  };

  const generateCroppedBlob = async (): Promise<Blob | null> => {
    if (!imgRef.current) return null;

    const img = imgRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const natW = img.naturalWidth;
    const natH = img.naturalHeight;

    const cropPixelX = (cropBox.x / 100) * natW;
    const cropPixelY = (cropBox.y / 100) * natH;
    const cropPixelW = (cropBox.width / 100) * natW;
    const cropPixelH = (cropBox.height / 100) * natH;

    canvas.width = cropPixelW;
    canvas.height = cropPixelH;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(
      img,
      cropPixelX,
      cropPixelY,
      cropPixelW,
      cropPixelH,
      -canvas.width / 2,
      -canvas.height / 2,
      canvas.width,
      canvas.height
    );
    ctx.restore();

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob),
        format,
        format === 'image/png' ? undefined : quality
      );
    });
  };

  const handleDownload = async () => {
    const blob = await generateCroppedBlob();
    if (!blob) return;

    const ext = format === 'image/png' ? 'png' : format === 'image/jpeg' ? 'jpg' : 'webp';
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `cropped-image.${ext}`;
    link.click();

    trackEvent('download_clicked', { tool: 'image-cropper' });
    trackEvent('tool_completed', { tool: 'image-cropper' });
  };

  return (
    <div className="space-y-6">
      {/* Privacy Guarantee */}
      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span>100% In-Browser Cropping: Your photos never leave your device memory.</span>
      </div>

      {!imgSrc ? (
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
            if (droppedFile) handleFileChange(droppedFile);
          }}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-12 text-center hover:border-blue-500 transition-colors bg-slate-50/50 dark:bg-slate-900/50 cursor-pointer space-y-4"
        >
          <label className="cursor-pointer flex flex-col items-center justify-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400 pointer-events-none">
              <Upload className="w-8 h-8" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-800 dark:text-slate-200 pointer-events-none">
                Drop an image here, or <span className="text-blue-600 dark:text-blue-400 underline">browse</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 pointer-events-none">
                Supports JPG, PNG, WebP, AVIF photos
              </p>
            </div>
            <input
              type="file"
              accept="image/*,.png,.jpg,.jpeg,.webp,.avif"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0])}
            />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Column */}
          <div className="space-y-6 lg:order-2 bg-slate-50 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 h-fit">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Aspect Ratio
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'free', label: 'Free' },
                  { id: '1:1', label: '1:1 Square' },
                  { id: '16:9', label: '16:9 Landscape' },
                  { id: '9:16', label: '9:16 Story' },
                  { id: '4:3', label: '4:3 Standard' },
                  { id: '3:2', label: '3:2 Photo' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAspectRatio(item.id as AspectRatio)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                      aspectRatio === item.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Transform Controls */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Rotate & Flip
              </label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                  className="py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 flex items-center justify-center text-slate-700 dark:text-slate-300 cursor-pointer"
                  title="Rotate -90°"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 flex items-center justify-center text-slate-700 dark:text-slate-300 cursor-pointer"
                  title="Rotate +90°"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setFlipH((f) => !f)}
                  className={`py-2.5 rounded-xl border flex items-center justify-center cursor-pointer ${
                    flipH
                      ? 'bg-blue-50 dark:bg-blue-950 border-blue-500 text-blue-600'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                  title="Flip Horizontal"
                >
                  <FlipHorizontal className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setFlipV((f) => !f)}
                  className={`py-2.5 rounded-xl border flex items-center justify-center cursor-pointer ${
                    flipV
                      ? 'bg-blue-50 dark:bg-blue-950 border-blue-500 text-blue-600'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                  title="Flip Vertical"
                >
                  <FlipVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Export Settings */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Format
                  </label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
                  >
                    <option value="image/png">PNG</option>
                    <option value="image/jpeg">JPG</option>
                    <option value="image/webp">WebP</option>
                  </select>
                </div>
                {format !== 'image/png' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Quality ({Math.round(quality * 100)}%)
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="1.0"
                      step="0.05"
                      value={quality}
                      onChange={(e) => setQuality(parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-2"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2 shadow-md cursor-pointer transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Cropped Photo</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setImgSrc(null);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Upload Different Photo</span>
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Crop Canvas Column */}
          <div className="lg:col-span-2 space-y-4 lg:order-1">
            <div
              ref={containerRef}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="relative select-none overflow-hidden rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center min-h-[360px] max-h-[500px]"
            >
              <img
                ref={imgRef}
                src={imgSrc}
                alt="Source preview"
                className="max-h-[460px] w-auto object-contain pointer-events-none transition-transform"
                style={{
                  transform: `rotate(${rotation}deg) scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1})`,
                }}
              />

              {/* Crop Box Overlay */}
              <div
                onMouseDown={handleMouseDown}
                style={{
                  left: `${cropBox.x}%`,
                  top: `${cropBox.y}%`,
                  width: `${cropBox.width}%`,
                  height: `${cropBox.height}%`,
                }}
                className={`absolute border-2 border-blue-400 bg-blue-500/15 cursor-move shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] ${
                  isDragging ? 'border-amber-400 bg-amber-500/20' : ''
                }`}
              >
                {/* Rule of Thirds Grid */}
                <div className="w-full h-full grid grid-cols-3 grid-rows-3 pointer-events-none">
                  <div className="border-r border-b border-white/30"></div>
                  <div className="border-r border-b border-white/30"></div>
                  <div className="border-b border-white/30"></div>
                  <div className="border-r border-b border-white/30"></div>
                  <div className="border-r border-b border-white/30"></div>
                  <div className="border-b border-white/30"></div>
                  <div className="border-r border-white/30"></div>
                  <div className="border-r border-white/30"></div>
                  <div></div>
                </div>

                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/75 text-[10px] font-mono text-white pointer-events-none">
                  Drag to move
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-slate-500 dark:text-slate-400">
              💡 Drag the glowing crop box over your photo to select your framing area.
            </p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
