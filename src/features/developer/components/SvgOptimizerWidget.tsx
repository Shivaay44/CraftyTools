import React, { useState, useEffect } from 'react';
import { trackEvent } from '../../../lib/analytics';
import {
  ShieldCheck,
  Code,
  Download,
  Copy,
  Check,
  Zap,
  Eye,
  Upload,
  AlertCircle
} from 'lucide-react';

export const SvgOptimizerWidget: React.FC = () => {
  const [inputSvg, setInputSvg] = useState<string>('');
  const [optimizedSvg, setOptimizedSvg] = useState<string>('');
  const [originalBytes, setOriginalBytes] = useState<number>(0);
  const [optimizedBytes, setOptimizedBytes] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [checkerTheme, setCheckerTheme] = useState<'dark' | 'light'>('dark');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sampleSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" version="1.1" viewBox="0 0 100 100" width="100" height="100">
  <!-- Generator: Adobe Illustrator 28.0, SVG Export Plug-In -->
  <metadata>
    <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
      <cc:Work xmlns:cc="http://creativecommons.org/ns#" rdf:about=""/>
    </rdf:RDF>
  </metadata>
  <defs>
    <!-- Unused definition comments -->
  </defs>
  <g id="layer1" inkscape:label="Layer 1" inkscape:groupmode="layer">
    <circle cx="50.00000" cy="50.00000" r="40.00000" fill="#3B82F6" stroke="#1D4ED8" stroke-width="4.00000"/>
    <polygon points="50.00000,25.00000 60.00000,45.00000 80.00000,50.00000 65.00000,65.00000 70.00000,85.00000 50.00000,75.00000 30.00000,85.00000 35.00000,65.00000 20.00000,50.00000 40.00000,45.00000" fill="#FBBF24"/>
  </g>
</svg>`;

  useEffect(() => {
    setInputSvg(sampleSvg);
  }, []);

  const optimizeSvgString = (raw: string): string => {
    if (!raw.trim()) return '';

    let cleaned = raw;

    // Remove XML comments: <!-- ... -->
    cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');

    // Remove XML prolog & doctype
    cleaned = cleaned.replace(/<\?xml[\s\S]*?\?>/gi, '');
    cleaned = cleaned.replace(/<!DOCTYPE[\s\S]*?>/gi, '');

    // Remove metadata and editor tags
    cleaned = cleaned.replace(/<metadata[\s\S]*?<\/metadata>/gi, '');
    cleaned = cleaned.replace(/<sodipodi:namedview[\s\S]*?\/>/gi, '');

    // Remove editor namespaces (inkscape, sodipodi, sketch, etc.)
    cleaned = cleaned.replace(/\sxmlns:inkscape="[^"]*"/gi, '');
    cleaned = cleaned.replace(/\sxmlns:sodipodi="[^"]*"/gi, '');
    cleaned = cleaned.replace(/\sxmlns:sketch="[^"]*"/gi, '');
    cleaned = cleaned.replace(/\sinkscape:[a-z0-9_-]+="[^"]*"/gi, '');
    cleaned = cleaned.replace(/\ssodipodi:[a-z0-9_-]+="[^"]*"/gi, '');

    // Clean redundant float decimals: 50.00000 -> 50
    cleaned = cleaned.replace(/(\d+)\.00+(\b|[^\d])/g, '$1$2');
    cleaned = cleaned.replace(/(\.\d{2})\d+/g, '$1'); // Limit float to 2 decimal places

    // Remove empty groups <g></g>
    cleaned = cleaned.replace(/<g[^>]*>\s*<\/g>/gi, '');

    // Collapse multiple whitespace
    cleaned = cleaned.replace(/\s+/g, ' ');
    cleaned = cleaned.replace(/>\s+</g, '><');

    return cleaned.trim();
  };

  useEffect(() => {
    try {
      setErrorMsg(null);
      const opt = optimizeSvgString(inputSvg);
      setOptimizedSvg(opt);

      const enc = new TextEncoder();
      setOriginalBytes(enc.encode(inputSvg).length);
      setOptimizedBytes(enc.encode(opt).length);
    } catch (err) {
      setErrorMsg('Error processing SVG code.');
    }
  }, [inputSvg]);

  const handleFileUpload = async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await file.text();
      setInputSvg(text);
      trackEvent('tool_started', { tool: 'svg-optimizer' });
    } catch (err) {
      setErrorMsg('Failed to read uploaded SVG.');
    }
  };

  const handleCopy = () => {
    if (!optimizedSvg) return;
    navigator.clipboard.writeText(optimizedSvg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    trackEvent('copy_clicked', { tool: 'svg-optimizer' });
    trackEvent('tool_completed', { tool: 'svg-optimizer' });
  };

  const handleDownload = () => {
    if (!optimizedSvg) return;
    const blob = new Blob([optimizedSvg], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'optimized.svg';
    link.click();
    trackEvent('download_clicked', { tool: 'svg-optimizer' });
  };

  const savingsPercent = originalBytes > 0
    ? Math.max(0, Math.round(((originalBytes - optimizedBytes) / originalBytes) * 100))
    : 0;

  return (
    <div className="space-y-6">
      {/* Privacy Guarantee */}
      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span>100% In-Browser SVG Sanitization: Remove bloated metadata, namespaces, and compress vector markup safely.</span>
      </div>

      {/* Savings Metric Stats Banner */}
      <div className="grid grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center">
        <div>
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Original Size</div>
          <div className="text-lg font-black text-slate-800 dark:text-slate-200 mt-0.5">
            {(originalBytes / 1024).toFixed(2)} KB
          </div>
        </div>
        <div>
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Optimized Size</div>
          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
            {(optimizedBytes / 1024).toFixed(2)} KB
          </div>
        </div>
        <div>
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Savings</div>
          <div className="text-lg font-black text-blue-600 dark:text-blue-400 mt-0.5 flex items-center justify-center gap-1">
            <Zap className="w-4 h-4 text-amber-500" />
            {savingsPercent}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor Input Column */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Code className="w-4 h-4 text-blue-600" />
              Raw SVG Source
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
            rows={12}
            value={inputSvg}
            onChange={(e) => setInputSvg(e.target.value)}
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
            placeholder="Paste your raw SVG XML here or drag & drop an .svg file..."
            className="w-full p-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed resize-y"
          />
        </div>

        {/* Live Vector Preview & Output Column */}
        <div className="space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-emerald-600" />
                Live Vector Preview
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setCheckerTheme('dark')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                    checkerTheme === 'dark'
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Dark Grid
                </button>
                <button
                  type="button"
                  onClick={() => setCheckerTheme('light')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                    checkerTheme === 'light'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Light Grid
                </button>
              </div>
            </div>

            {/* Vector Render Box */}
            <div
              className={`p-6 rounded-2xl border flex items-center justify-center min-h-[220px] max-h-[260px] overflow-hidden ${
                checkerTheme === 'dark'
                  ? 'bg-slate-950 border-slate-800'
                  : 'bg-slate-100 border-slate-300'
              }`}
            >
              {optimizedSvg ? (
                <div
                  className="max-h-[200px] max-w-[200px] flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: optimizedSvg }}
                />
              ) : (
                <span className="text-xs text-slate-400">No valid SVG to preview</span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!optimizedSvg}
              className="py-3 px-4 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied SVG!' : 'Copy Minified SVG'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={!optimizedSvg}
              className="py-3 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download .svg</span>
            </button>
          </div>
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
