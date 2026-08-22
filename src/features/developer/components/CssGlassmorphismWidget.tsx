import React, { useState } from 'react';
import { trackEvent } from '../../../lib/analytics';
import {
  ShieldCheck,
  Sliders,
  Copy,
  Check,
  Layers,
  Palette,
  Eye
} from 'lucide-react';

export const CssGlassmorphismWidget: React.FC = () => {
  const [blur, setBlur] = useState<number>(16);
  const [bgOpacity, setBgOpacity] = useState<number>(25);
  const [bgColor, setBgColor] = useState<string>('#FFFFFF');
  const [borderWidth, setBorderWidth] = useState<number>(1);
  const [borderOpacity, setBorderOpacity] = useState<number>(30);
  const [borderRadius, setBorderRadius] = useState<number>(24);
  const [shadowBlur, setShadowBlur] = useState<number>(32);
  const [shadowOpacity, setShadowOpacity] = useState<number>(15);
  const [backgroundScene, setBackgroundScene] = useState<'aurora' | 'cyber' | 'sunset' | 'dark'>('aurora');
  const [copied, setCopied] = useState<boolean>(false);

  const hexToRgba = (hex: string, alphaPercent: number) => {
    const cleaned = hex.replace('#', '');
    const r = parseInt(cleaned.substring(0, 2), 16) || 255;
    const g = parseInt(cleaned.substring(2, 4), 16) || 255;
    const b = parseInt(cleaned.substring(4, 6), 16) || 255;
    return `rgba(${r}, ${g}, ${b}, ${(alphaPercent / 100).toFixed(2)})`;
  };

  const bgRgba = hexToRgba(bgColor, bgOpacity);
  const borderRgba = hexToRgba(bgColor, borderOpacity);
  const shadowRgba = `rgba(0, 0, 0, ${(shadowOpacity / 100).toFixed(2)})`;

  const cssCode = `/* Glassmorphism CSS */
background: ${bgRgba};
backdrop-filter: blur(${blur}px);
-webkit-backdrop-filter: blur(${blur}px);
border-radius: ${borderRadius}px;
border: ${borderWidth}px solid ${borderRgba};
box-shadow: 0 8px ${shadowBlur}px 0 ${shadowRgba};`;

  const handleCopy = () => {
    navigator.clipboard.writeText(cssCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    trackEvent('copy_clicked', { tool: 'css-glassmorphism-generator' });
    trackEvent('tool_completed', { tool: 'css-glassmorphism-generator' });
  };

  const sceneGradients: Record<string, string> = {
    aurora: 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-teal-400',
    cyber: 'bg-gradient-to-tr from-slate-900 via-purple-950 to-blue-900',
    sunset: 'bg-gradient-to-tr from-rose-500 via-amber-500 to-violet-600',
    dark: 'bg-gradient-to-tr from-slate-950 via-slate-900 to-zinc-900',
  };

  return (
    <div className="space-y-6">
      {/* Privacy Guarantee */}
      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span>100% Client-Side CSS Generation: Build ultra modern frosted glass interfaces with 1-click export.</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls Column */}
        <div className="space-y-4 bg-slate-50 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <Sliders className="w-4 h-4 text-purple-600" />
            Glass & Elevation Parameters
          </h3>

          <div className="space-y-4">
            {/* Blur */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                <span>Backdrop Blur</span>
                <span>{blur}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                value={blur}
                onChange={(e) => setBlur(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
            </div>

            {/* Opacity & Color */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Glass Opacity</span>
                  <span>{bgOpacity}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="90"
                  value={bgOpacity}
                  onChange={(e) => setBgOpacity(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Glass Tint Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                  />
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    {bgColor}
                  </span>
                </div>
              </div>
            </div>

            {/* Border Width & Border Opacity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Border Width</span>
                  <span>{borderWidth}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="8"
                  value={borderWidth}
                  onChange={(e) => setBorderWidth(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Border Opacity</span>
                  <span>{borderOpacity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={borderOpacity}
                  onChange={(e) => setBorderOpacity(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
              </div>
            </div>

            {/* Corner Radius & Shadow Blur */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Border Radius</span>
                  <span>{borderRadius}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="48"
                  value={borderRadius}
                  onChange={(e) => setBorderRadius(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Shadow Blur</span>
                  <span>{shadowBlur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="64"
                  value={shadowBlur}
                  onChange={(e) => setShadowBlur(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Interactive Preview Column */}
        <div className="space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            {/* Background Theme Toggles */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-purple-600" />
                Live Glass Preview
              </span>
              <div className="flex gap-1.5">
                {['aurora', 'cyber', 'sunset', 'dark'].map((scene) => (
                  <button
                    key={scene}
                    type="button"
                    onClick={() => setBackgroundScene(scene as any)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize cursor-pointer transition-all ${
                      backgroundScene === scene
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {scene}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated Glass Scene */}
            <div className={`relative p-8 rounded-3xl min-h-[260px] flex items-center justify-center overflow-hidden transition-colors ${sceneGradients[backgroundScene]}`}>
              {/* Decorative shapes behind glass */}
              <div className="absolute -top-6 -left-6 w-28 h-28 rounded-full bg-amber-400 opacity-80 blur-lg"></div>
              <div className="absolute -bottom-8 -right-8 w-36 h-36 rounded-full bg-pink-500 opacity-80 blur-xl"></div>
              <div className="absolute top-1/2 left-1/4 w-20 h-20 rounded-full bg-cyan-400 opacity-70 blur-md"></div>

              {/* The Dynamic Glass Card */}
              <div
                style={{
                  background: bgRgba,
                  backdropFilter: `blur(${blur}px)`,
                  WebkitBackdropFilter: `blur(${blur}px)`,
                  borderRadius: `${borderRadius}px`,
                  border: `${borderWidth}px solid ${borderRgba}`,
                  boxShadow: `0 8px ${shadowBlur}px 0 ${shadowRgba}`,
                }}
                className="relative z-10 p-6 max-w-sm w-full text-white space-y-2"
              >
                <h4 className="font-extrabold text-lg tracking-tight text-white">
                  Frosted Glass Card
                </h4>
                <p className="text-xs text-white/80 leading-relaxed">
                  Real-time backdrop-filter rendering with dynamic light scattering.
                </p>
              </div>
            </div>
          </div>

          {/* Generated Code Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Generated CSS Code
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="py-1.5 px-3 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy CSS'}</span>
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-900 text-purple-300 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800 select-all">
              {cssCode}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
