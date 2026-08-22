import React, { useState, useRef, useEffect } from 'react';
import { trackEvent } from '../../../lib/analytics';
import {
  Download,
  ShieldCheck,
  Sliders,
  RotateCcw,
  AlertCircle
} from 'lucide-react';

interface FilterSettings {
  brightness: number; // 0 to 200 (default 100)
  contrast: number; // 0 to 200 (default 100)
  saturate: number; // 0 to 200 (default 100)
  hueRotate: number; // 0 to 360 (default 0)
  blur: number; // 0 to 20 (default 0)
  sepia: number; // 0 to 100 (default 0)
  grayscale: number; // 0 to 100 (default 0)
  invert: number; // 0 to 100 (default 0)
}

const DEFAULT_FILTERS: FilterSettings = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  hueRotate: 0,
  blur: 0,
  sepia: 0,
  grayscale: 0,
  invert: 0,
};

const PRESETS: Record<string, FilterSettings> = {
  Default: DEFAULT_FILTERS,
  'Vibrant Pop': { ...DEFAULT_FILTERS, brightness: 105, contrast: 125, saturate: 160 },
  'Vintage Warm': { ...DEFAULT_FILTERS, brightness: 110, contrast: 90, sepia: 40, saturate: 85 },
  'Dramatic B&W': { ...DEFAULT_FILTERS, contrast: 150, grayscale: 100, brightness: 95 },
  'Cyberpunk Neon': { ...DEFAULT_FILTERS, contrast: 140, saturate: 180, hueRotate: 290 },
  'Cool Mist': { ...DEFAULT_FILTERS, brightness: 105, saturate: 90, hueRotate: 180 },
  'Night Mood': { ...DEFAULT_FILTERS, brightness: 75, contrast: 130, saturate: 120 },
};

export const ImageFiltersWidget: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterSettings>(DEFAULT_FILTERS);
  const [activePreset, setActivePreset] = useState<string>('Default');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const handleFileChange = (selectedFile: File | undefined) => {
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    setErrorMsg(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setFile(selectedFile);
    setFilters(DEFAULT_FILTERS);
    setActivePreset('Default');

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      renderCanvas();
    };
    img.src = url;

    trackEvent('tool_started', { tool: 'image-filters' });
  };

  const getFilterCssString = (f: FilterSettings) => {
    return `brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturate}%) hue-rotate(${f.hueRotate}deg) blur(${f.blur}px) sepia(${f.sepia}%) grayscale(${f.grayscale}%) invert(${f.invert}%)`;
  };

  const renderCanvas = () => {
    if (!imgRef.current || !canvasRef.current) return;
    const img = imgRef.current;
    const canvas = canvasRef.current;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.filter = getFilterCssString(filters);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    renderCanvas();
  }, [filters]);

  const applyPreset = (name: string) => {
    setActivePreset(name);
    setFilters(PRESETS[name]);
  };

  const updateFilter = (key: keyof FilterSettings, value: number) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setActivePreset('Custom');
  };

  const downloadFilteredImage = () => {
    if (!canvasRef.current || !file) return;
    setIsExporting(true);
    try {
      const url = canvasRef.current.toDataURL('image/png', 0.95);
      const link = document.createElement('a');
      link.download = `filtered-${file.name.replace(/\.[^/.]+$/, '')}.png`;
      link.href = url;
      link.click();
      trackEvent('tool_completed', { tool: 'image-filters', preset: activePreset });
    } catch (e: any) {
      console.error('Download error:', e);
      setErrorMsg('Failed to export filtered image.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span>100% Client-Side Privacy: Filters & visual effects are rendered live in your browser with Canvas API.</span>
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
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-400 rounded-2xl p-12 text-center transition-all bg-slate-50/50 dark:bg-slate-900/50 cursor-pointer"
        >
          <label className="cursor-pointer flex flex-col items-center justify-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 pointer-events-none">
              <Sliders className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 pointer-events-none">
              Select or drag & drop an image to edit & apply filters
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 pointer-events-none">
              Adjust brightness, contrast, saturation, colors & artistic presets
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

      {/* Editor & Controls */}
      {previewUrl && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Canvas Preview Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center min-h-[420px] max-h-[560px] overflow-hidden relative shadow-inner">
              <canvas
                ref={canvasRef}
                className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
              />
            </div>

            {/* Presets Strip */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                1-Click Presets
              </span>
              <div className="flex flex-wrap gap-2">
                {Object.keys(PRESETS).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      activePreset === p
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Adjustments Sidebar */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Fine Adjustments
              </h3>
              <button
                type="button"
                onClick={() => {
                  setFilters(DEFAULT_FILTERS);
                  setActivePreset('Default');
                }}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {/* Brightness */}
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <span>Brightness</span>
                  <span className="font-mono text-blue-600">{filters.brightness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={filters.brightness}
                  onChange={(e) => updateFilter('brightness', Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Contrast */}
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <span>Contrast</span>
                  <span className="font-mono text-blue-600">{filters.contrast}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={filters.contrast}
                  onChange={(e) => updateFilter('contrast', Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Saturation */}
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <span>Saturation</span>
                  <span className="font-mono text-blue-600">{filters.saturate}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={filters.saturate}
                  onChange={(e) => updateFilter('saturate', Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Hue Rotation */}
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <span>Hue Rotate</span>
                  <span className="font-mono text-blue-600">{filters.hueRotate}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={filters.hueRotate}
                  onChange={(e) => updateFilter('hueRotate', Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Sepia */}
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <span>Sepia</span>
                  <span className="font-mono text-blue-600">{filters.sepia}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.sepia}
                  onChange={(e) => updateFilter('sepia', Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Grayscale */}
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <span>Grayscale</span>
                  <span className="font-mono text-blue-600">{filters.grayscale}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.grayscale}
                  onChange={(e) => updateFilter('grayscale', Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Blur */}
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <span>Blur</span>
                  <span className="font-mono text-blue-600">{filters.blur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={filters.blur}
                  onChange={(e) => updateFilter('blur', Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Invert */}
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <span>Invert</span>
                  <span className="font-mono text-blue-600">{filters.invert}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.invert}
                  onChange={(e) => updateFilter('invert', Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <button
                type="button"
                onClick={downloadFilteredImage}
                disabled={isExporting}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Filtered Image</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPreviewUrl(null);
                }}
                className="w-full py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-colors"
              >
                Choose Another Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
