import React, { useState, useRef, useEffect } from 'react';
import { trackEvent } from '../../../lib/analytics';
import {
  ShieldCheck,
  Download,
  Stamp,
  Type,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

type WatermarkPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'tiled';

export const ImageWatermarkWidget: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [watermarkType, setWatermarkType] = useState<'text' | 'image'>('text');
  const [watermarkText, setWatermarkText] = useState<string>('© FreeTools');
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState<number>(36);
  const [opacity, setOpacity] = useState<number>(60);
  const [color, setColor] = useState<string>('#FFFFFF');
  const [rotation, setRotation] = useState<number>(-25);
  const [position, setPosition] = useState<WatermarkPosition>('bottom-right');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const logoImgRef = useRef<HTMLImageElement | null>(null);

  const handleBaseImageChange = (selectedFile: File | undefined) => {
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    setErrorMsg(null);
    if (imgSrc) URL.revokeObjectURL(imgSrc);

    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setImgSrc(url);

    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      renderWatermark();
    };
    img.src = url;
    trackEvent('tool_started', { tool: 'image-watermark' });
  };

  const handleLogoChange = (selectedFile: File | undefined) => {
    if (!selectedFile) return;
    const url = URL.createObjectURL(selectedFile);
    setLogoSrc(url);

    const logo = new Image();
    logo.onload = () => {
      logoImgRef.current = logo;
      renderWatermark();
    };
    logo.src = url;
  };

  const renderWatermark = () => {
    if (!imgRef.current || !canvasRef.current) return;

    const img = imgRef.current;
    const canvas = canvasRef.current;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    ctx.save();
    ctx.globalAlpha = opacity / 100;

    if (watermarkType === 'text') {
      if (!watermarkText.trim()) {
        ctx.restore();
        return;
      }

      ctx.fillStyle = color;
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textBaseline = 'middle';

      if (position === 'tiled') {
        const stepX = fontSize * 8;
        const stepY = fontSize * 4;
        for (let x = -canvas.width; x < canvas.width * 2; x += stepX) {
          for (let y = -canvas.height; y < canvas.height * 2; y += stepY) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.fillText(watermarkText, 0, 0);
            ctx.restore();
          }
        }
      } else {
        const metrics = ctx.measureText(watermarkText);
        const textWidth = metrics.width;
        const margin = 40;

        let posX = margin;
        let posY = margin + fontSize / 2;

        if (position.includes('center') && !position.includes('left') && !position.includes('right')) {
          posX = (canvas.width - textWidth) / 2;
        } else if (position.includes('right')) {
          posX = canvas.width - textWidth - margin;
        }

        if (position.startsWith('center')) {
          posY = canvas.height / 2;
        } else if (position.startsWith('bottom')) {
          posY = canvas.height - margin - fontSize / 2;
        }

        ctx.save();
        ctx.translate(posX + textWidth / 2, posY);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.textAlign = 'center';
        ctx.fillText(watermarkText, 0, 0);
        ctx.restore();
      }
    } else if (watermarkType === 'image' && logoImgRef.current) {
      const logo = logoImgRef.current;
      const targetWidth = Math.min(canvas.width * 0.25, 300);
      const targetHeight = (targetWidth / logo.width) * logo.height;
      const margin = 40;

      let posX = margin;
      let posY = margin;

      if (position.includes('right')) posX = canvas.width - targetWidth - margin;
      else if (position.includes('center') && !position.includes('left') && !position.includes('right')) posX = (canvas.width - targetWidth) / 2;

      if (position.startsWith('bottom')) posY = canvas.height - targetHeight - margin;
      else if (position.startsWith('center')) posY = (canvas.height - targetHeight) / 2;

      ctx.drawImage(logo, posX, posY, targetWidth, targetHeight);
    }

    ctx.restore();
  };

  useEffect(() => {
    renderWatermark();
  }, [watermarkText, fontSize, opacity, color, rotation, position, watermarkType]);

  const handleDownload = () => {
    if (!canvasRef.current || !file) return;

    canvasRef.current.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = `watermarked-${file.name}`;
      link.click();
      URL.revokeObjectURL(url);

      trackEvent('download_clicked', { tool: 'image-watermark' });
      trackEvent('tool_completed', { tool: 'image-watermark' });
    }, 'image/png');
  };

  return (
    <div className="space-y-6">
      {/* Privacy Guarantee */}
      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span>100% In-Browser Stamping: Your original images and logos are rendered locally on canvas.</span>
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
            if (droppedFile) handleBaseImageChange(droppedFile);
          }}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-12 text-center hover:border-amber-500 transition-colors bg-slate-50/50 dark:bg-slate-900/50 cursor-pointer space-y-4"
        >
          <label className="cursor-pointer flex flex-col items-center justify-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400 pointer-events-none">
              <Stamp className="w-8 h-8" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-800 dark:text-slate-200 pointer-events-none">
                Drop an image to add a watermark, or <span className="text-amber-600 dark:text-amber-400 underline">browse</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 pointer-events-none">
                Supports JPG, PNG, WebP, AVIF photos
              </p>
            </div>
            <input
              type="file"
              accept="image/*,.png,.jpg,.jpeg,.webp,.avif"
              className="hidden"
              onChange={(e) => handleBaseImageChange(e.target.files?.[0])}
            />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Column */}
          <div className="space-y-5 lg:order-2 bg-slate-50 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 h-fit">
            {/* Watermark Type Selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setWatermarkType('text')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                  watermarkType === 'text'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                Text Stamp
              </button>
              <button
                type="button"
                onClick={() => setWatermarkType('image')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                  watermarkType === 'image'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Stamp className="w-3.5 h-3.5" />
                Logo Image
              </button>
            </div>

            {watermarkType === 'text' ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Watermark Text
                  </label>
                  <input
                    type="text"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    placeholder="e.g. © Confidential / Brand Name"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                      />
                      <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                        {color}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Font Size ({fontSize}px)
                    </label>
                    <input
                      type="range"
                      min="16"
                      max="120"
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Opacity ({opacity}%)
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={opacity}
                      onChange={(e) => setOpacity(parseInt(e.target.value, 10))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-2"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Rotation ({rotation}°)
                    </label>
                    <input
                      type="range"
                      min="-90"
                      max="90"
                      value={rotation}
                      onChange={(e) => setRotation(parseInt(e.target.value, 10))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-2"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Upload Logo PNG
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={(e) => handleLogoChange(e.target.files?.[0])}
                  className="text-xs text-slate-500 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 dark:file:bg-slate-800 dark:file:text-slate-300"
                />
              </div>
            )}

            {/* Position Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Placement Position
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                {[
                  { id: 'top-left', label: '↖ Top L' },
                  { id: 'top-center', label: '↑ Top C' },
                  { id: 'top-right', label: '↗ Top R' },
                  { id: 'center-left', label: '← Mid L' },
                  { id: 'center', label: '• Center' },
                  { id: 'center-right', label: '→ Mid R' },
                  { id: 'bottom-left', label: '↙ Bot L' },
                  { id: 'bottom-center', label: '↓ Bot C' },
                  { id: 'bottom-right', label: '↘ Bot R' },
                ].map((pos) => (
                  <button
                    key={pos.id}
                    type="button"
                    onClick={() => setPosition(pos.id as WatermarkPosition)}
                    className={`py-1.5 px-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                      position === pos.id
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setPosition('tiled')}
                className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold mt-1 cursor-pointer transition-colors ${
                  position === 'tiled'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-400'
                }`}
              >
                🔁 Repeating Diagonal Tiled Pattern
              </button>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={handleDownload}
                className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2 shadow-md cursor-pointer transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Watermarked Image</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setImgSrc(null);
                  setFile(null);
                }}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Upload New Image</span>
              </button>
            </div>
          </div>

          {/* Canvas Live Preview Column */}
          <div className="lg:col-span-2 space-y-4 lg:order-1">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center min-h-[360px] max-h-[500px] overflow-hidden">
              <canvas
                ref={canvasRef}
                className="max-h-[460px] max-w-full w-auto h-auto object-contain rounded-lg shadow-md"
              />
            </div>
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
