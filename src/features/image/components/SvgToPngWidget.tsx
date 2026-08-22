import React, { useState, useRef, useEffect } from 'react';
import { trackEvent } from '../../../lib/analytics';
import {
  ShieldCheck,
  Upload,
  Download,
  Code,
  FileImage,
  RefreshCw,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';

export const SvgToPngWidget: React.FC = () => {
  const [svgContent, setSvgContent] = useState<string>('');
  const [scale, setScale] = useState<number>(2);
  const [format, setFormat] = useState<'image/png' | 'image/jpeg' | 'image/webp'>('image/png');
  const [bgColor, setBgColor] = useState<string>('transparent');
  const [customColor, setCustomColor] = useState<string>('#FFFFFF');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [svgDimensions, setSvgDimensions] = useState<{ width: number; height: number }>({ width: 300, height: 300 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const sampleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8B5CF6"/>
      <stop offset="50%" stop-color="#6366F1"/>
      <stop offset="100%" stop-color="#F59E0B"/>
    </linearGradient>
  </defs>
  <circle cx="100" cy="100" r="80" fill="url(#grad)"/>
  <path d="M70,100 L90,120 L130,80" fill="none" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

  useEffect(() => {
    setSvgContent(sampleSvg);
  }, []);

  const handleFileUpload = async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await file.text();
      setSvgContent(text);
      trackEvent('tool_started', { tool: 'svg-to-png' });
    } catch (err) {
      setErrorMsg('Failed to read SVG file. Please ensure it is a valid XML file.');
    }
  };

  const renderRaster = () => {
    setErrorMsg(null);
    if (!svgContent.trim() || !canvasRef.current) return;

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgContent, 'image/svg+xml');
      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        setErrorMsg('Invalid SVG code structure.');
        return;
      }

      const svgEl = doc.querySelector('svg');
      let baseWidth = 300;
      let baseHeight = 300;

      if (svgEl) {
        if (svgEl.hasAttribute('viewBox')) {
          const vb = svgEl.getAttribute('viewBox')?.split(/\s+|,/) || [];
          if (vb.length === 4) {
            baseWidth = parseFloat(vb[2]) || 300;
            baseHeight = parseFloat(vb[3]) || 300;
          }
        } else {
          baseWidth = parseFloat(svgEl.getAttribute('width') || '300');
          baseHeight = parseFloat(svgEl.getAttribute('height') || '300');
        }
      }

      setSvgDimensions({ width: baseWidth, height: baseHeight });

      const targetWidth = Math.round(baseWidth * scale);
      const targetHeight = Math.round(baseHeight * scale);

      const canvas = canvasRef.current;
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, targetWidth, targetHeight);

        // Fill background if not transparent
        if (bgColor === 'white') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, targetWidth, targetHeight);
        } else if (bgColor === 'black') {
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, targetWidth, targetHeight);
        } else if (bgColor === 'custom') {
          ctx.fillStyle = customColor;
          ctx.fillRect(0, 0, targetWidth, targetHeight);
        }

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        URL.revokeObjectURL(url);
      };
      img.onerror = () => {
        setErrorMsg('Could not render SVG to image canvas. Verify SVG tags.');
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } catch (err) {
      setErrorMsg('Rendering error.');
    }
  };

  useEffect(() => {
    renderRaster();
  }, [svgContent, scale, bgColor, customColor, format]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const ext = format === 'image/png' ? 'png' : format === 'image/jpeg' ? 'jpg' : 'webp';
    canvasRef.current.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `rendered-svg-${Math.round(svgDimensions.width * scale)}x${Math.round(svgDimensions.height * scale)}.${ext}`;
      link.click();

      trackEvent('download_clicked', { tool: 'svg-to-png' });
      trackEvent('tool_completed', { tool: 'svg-to-png' });
    }, format, 0.95);
  };

  return (
    <div className="space-y-6">
      {/* Privacy Guarantee */}
      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span>100% In-Browser SVG Rasterization: Render SVGs to ultra crisp PNGs with zero server roundtrips.</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Code className="w-4 h-4 text-blue-600" />
              SVG Code or File Upload
            </label>
            <label className="text-xs font-bold text-blue-600 dark:text-blue-400 cursor-pointer hover:underline flex items-center gap-1">
              <Upload className="w-3.5 h-3.5" />
              Upload .svg
              <input
                type="file"
                accept=".svg,image/svg+xml"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files?.[0])}
              />
            </label>
          </div>

          <textarea
            rows={10}
            value={svgContent}
            onChange={(e) => setSvgContent(e.target.value)}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.dataTransfer.dropEffect = 'copy';
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const f = e.dataTransfer.files?.[0];
              if (f) handleFileUpload(f);
            }}
            placeholder="Paste <svg>...</svg> XML markup here or drag & drop an .svg file..."
            className="w-full p-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed resize-y"
          />

          {/* Raster Settings */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Resolution Scaling Multiplier
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 4, 8].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setScale(s)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      scale === s
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {s}x ({Math.round(svgDimensions.width * s)}px)
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Output Format
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
                >
                  <option value="image/png">PNG (Lossless)</option>
                  <option value="image/jpeg">JPG (Solid background)</option>
                  <option value="image/webp">WebP</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Background
                </label>
                <select
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
                >
                  <option value="transparent">Transparent</option>
                  <option value="white">White (#FFF)</option>
                  <option value="black">Black (#000)</option>
                  <option value="custom">Custom Color</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Live Canvas Preview Column */}
        <div className="space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileImage className="w-4 h-4 text-emerald-600" />
                Live Raster Preview
              </span>
              <span>
                Render Output: <strong>{Math.round(svgDimensions.width * scale)} × {Math.round(svgDimensions.height * scale)} px</strong>
              </span>
            </div>

            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center min-h-[320px] max-h-[420px] overflow-hidden">
              <canvas
                ref={canvasRef}
                className="max-h-[360px] max-w-full w-auto h-auto object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownload}
            className="w-full py-3.5 px-4 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 shadow-md cursor-pointer transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download {format === 'image/png' ? 'PNG' : format === 'image/jpeg' ? 'JPG' : 'WebP'} Image</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
