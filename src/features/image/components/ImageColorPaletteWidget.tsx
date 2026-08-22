import React, { useState } from 'react';
import { trackEvent } from '../../../lib/analytics';
import {
  Copy,
  Check,
  Palette,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface ColorItem {
  hex: string;
  rgb: string;
  hsl: string;
  isLight: boolean;
  population: number;
}

export const ImageColorPaletteWidget: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [palette, setPalette] = useState<ColorItem[]>([]);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);

  const handleFileChange = (selectedFile: File | undefined) => {
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    setErrorMsg(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    extractPalette(url);
    trackEvent('tool_started', { tool: 'image-color-palette' });
  };

  const extractPalette = (imageUrl: string) => {
    setIsExtracting(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context not available');

        // Sample at reasonable dimension
        const maxDim = 150;
        const scale = Math.min(maxDim / img.naturalWidth, maxDim / img.naturalHeight, 1);
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Color quantization using 5-bit bucket clustering
        const colorBuckets = new Map<string, { r: number; g: number; b: number; count: number }>();

        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3];
          if (a < 128) continue; // Ignore transparent pixels

          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Quantize to 5-bit (step of 8)
          const qr = Math.round(r / 8) * 8;
          const qg = Math.round(g / 8) * 8;
          const qb = Math.round(b / 8) * 8;
          const key = `${qr},${qg},${qb}`;

          const existing = colorBuckets.get(key);
          if (existing) {
            existing.count++;
            existing.r = Math.round((existing.r + r) / 2);
            existing.g = Math.round((existing.g + g) / 2);
            existing.b = Math.round((existing.b + b) / 2);
          } else {
            colorBuckets.set(key, { r, g, b, count: 1 });
          }
        }

        // Sort by frequency and filter distinct hues
        const sorted = Array.from(colorBuckets.values()).sort((a, b) => b.count - a.count);
        const distinctColors: ColorItem[] = [];

        for (const item of sorted) {
          const hex = `#${((1 << 24) + (item.r << 16) + (item.g << 8) + item.b).toString(16).slice(1).toUpperCase()}`;
          const isLight = (item.r * 299 + item.g * 587 + item.b * 114) / 1000 > 130;

          // Convert to HSL
          const rNorm = item.r / 255;
          const gNorm = item.g / 255;
          const bNorm = item.b / 255;
          const max = Math.max(rNorm, gNorm, bNorm);
          const min = Math.min(rNorm, gNorm, bNorm);
          let h = 0;
          let s = 0;
          const l = (max + min) / 2;

          if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
              case rNorm:
                h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
                break;
              case gNorm:
                h = (bNorm - rNorm) / d + 2;
                break;
              case bNorm:
                h = (rNorm - gNorm) / d + 4;
                break;
            }
            h /= 6;
          }

          const hsl = `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;

          // Ensure color is visually distinct from already added colors
          const isTooClose = distinctColors.some((c) => {
            const [cr, cg, cb] = c.rgb.replace(/[^\d,]/g, '').split(',').map(Number);
            const dist = Math.sqrt((item.r - cr) ** 2 + (item.g - cg) ** 2 + (item.b - cb) ** 2);
            return dist < 35;
          });

          if (!isTooClose) {
            distinctColors.push({
              hex,
              rgb: `rgb(${item.r}, ${item.g}, ${item.b})`,
              hsl,
              isLight,
              population: item.count,
            });
          }

          if (distinctColors.length >= 10) break;
        }

        setPalette(distinctColors);
        setIsExtracting(false);
        trackEvent('tool_completed', { tool: 'image-color-palette', count: distinctColors.length });
      } catch (err: any) {
        console.error('Palette extraction error:', err);
        setErrorMsg('Failed to extract color palette from image.');
        setIsExtracting(false);
      }
    };

    img.onerror = () => {
      setErrorMsg('Failed to load image for color analysis.');
      setIsExtracting(false);
    };

    img.src = imageUrl;
  };

  const copyColor = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
    trackEvent('copy_clicked', { tool: 'image-color-palette', hex });
  };

  const copyAllAsCss = () => {
    const cssVars = palette
      .map((c, i) => `  --color-palette-${i + 1}: ${c.hex}; /* ${c.rgb} */`)
      .join('\n');
    const output = `:root {\n${cssVars}\n}`;
    navigator.clipboard.writeText(output);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span>100% Client-Side Privacy: Colors are extracted in-memory using HTML5 Canvas.</span>
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
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-400 rounded-2xl p-12 text-center transition-all bg-slate-50/50 dark:bg-slate-900/50 cursor-pointer"
        >
          <label className="cursor-pointer flex flex-col items-center justify-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400 pointer-events-none">
              <Palette className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 pointer-events-none">
              Select or drag & drop an image to extract colors
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 pointer-events-none">
              Supports PNG, JPG, WebP, AVIF, SVG
            </p>
            <input
              type="file"
              accept="image/*,.png,.jpg,.jpeg,.webp,.avif,.svg"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0])}
            />
          </label>
        </div>
      )}

      {/* Extracted Colors Grid */}
      {previewUrl && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left: Image Preview */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="h-64 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative">
                <img
                  src={previewUrl}
                  alt="Uploaded"
                  className="max-h-full max-w-full object-contain"
                />
                {isExtracting && (
                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center text-white text-xs font-bold gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
                    <span>Extracting Palette...</span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPreviewUrl(null);
                  setPalette([]);
                }}
                className="w-full py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium transition-colors cursor-pointer"
              >
                Upload Different Image
              </button>
            </div>

            {/* Right: Extracted Color Palette */}
            <div className="md:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    Extracted Dominant Palette ({palette.length} Colors)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {file?.name ? `Source: ${file.name}` : 'Click any color card or code to copy to clipboard'}
                  </p>
                </div>
                {palette.length > 0 && (
                  <button
                    type="button"
                    onClick={copyAllAsCss}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-bold text-xs hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedAll ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedAll ? 'Copied CSS!' : 'Copy as CSS Variables'}</span>
                  </button>
                )}
              </div>

              {/* Swatches strip */}
              {palette.length > 0 && (
                <div className="h-10 w-full rounded-xl overflow-hidden flex shadow-inner">
                  {palette.map((c, i) => (
                    <div
                      key={i}
                      style={{ backgroundColor: c.hex }}
                      className="flex-1 cursor-pointer hover:opacity-90 transition-opacity"
                      title={`${c.hex} (${c.rgb})`}
                      onClick={() => copyColor(c.hex)}
                    />
                  ))}
                </div>
              )}

              {/* Individual Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
                {palette.map((c, idx) => (
                  <div
                    key={idx}
                    onClick={() => copyColor(c.hex)}
                    className="group p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:border-purple-500 dark:hover:border-purple-400 cursor-pointer transition-all flex flex-col justify-between space-y-2 shadow-sm"
                  >
                    <div
                      className="h-16 w-full rounded-lg shadow-inner relative flex items-center justify-center"
                      style={{ backgroundColor: c.hex }}
                    >
                      {copiedHex === c.hex && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-900/90 text-white text-[10px] font-bold flex items-center gap-1 shadow">
                          <Check className="w-3 h-3" /> Copied
                        </span>
                      )}
                    </div>

                    <div className="space-y-0.5 text-center">
                      <span className="block text-xs font-mono font-bold text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                        {c.hex}
                      </span>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {c.rgb}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
