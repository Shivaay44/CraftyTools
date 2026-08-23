import React, { useState, useMemo } from 'react';
import { trackEvent } from '../../../lib/analytics';
import {
  Palette,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Shuffle,
  Plus,
  Trash2,
  Sliders,
} from 'lucide-react';

interface ColorStop {
  id: string;
  color: string;
  position: number; // 0 to 100
}

const PRESETS = [
  { name: 'Aurora Borealis', type: 'linear', angle: 135, stops: [{ id: '1', color: '#6366f1', position: 0 }, { id: '2', color: '#a855f7', position: 50 }, { id: '3', color: '#ec4899', position: 100 }] },
  { name: 'Sunset Vibe', type: 'linear', angle: 90, stops: [{ id: '1', color: '#f97316', position: 0 }, { id: '2', color: '#e11d48', position: 50 }, { id: '3', color: '#7c3aed', position: 100 }] },
  { name: 'Ocean Depths', type: 'linear', angle: 180, stops: [{ id: '1', color: '#0ea5e9', position: 0 }, { id: '2', color: '#2563eb', position: 50 }, { id: '3', color: '#1e1b4b', position: 100 }] },
  { name: 'Cyberpunk Neon', type: 'linear', angle: 45, stops: [{ id: '1', color: '#06b6d4', position: 0 }, { id: '2', color: '#d946ef', position: 100 }] },
  { name: 'Emerald Velvet', type: 'linear', angle: 120, stops: [{ id: '1', color: '#10b981', position: 0 }, { id: '2', color: '#047857', position: 50 }, { id: '3', color: '#064e3b', position: 100 }] },
  { name: 'Golden Hour', type: 'linear', angle: 60, stops: [{ id: '1', color: '#fbbf24', position: 0 }, { id: '2', color: '#f59e0b', position: 50 }, { id: '3', color: '#b45309', position: 100 }] },
];

export const CssGradientGeneratorWidget: React.FC = () => {
  const [gradientType, setGradientType] = useState<'linear' | 'radial' | 'conic'>('linear');
  const [angle, setAngle] = useState<number>(135);
  const [stops, setStops] = useState<ColorStop[]>([
    { id: '1', color: '#8b5cf6', position: 0 },
    { id: '2', color: '#ec4899', position: 50 },
    { id: '3', color: '#3b82f6', position: 100 },
  ]);

  const [copiedCss, setCopiedCss] = useState<boolean>(false);

  // Generate CSS string
  const cssGradientString = useMemo(() => {
    const sortedStops = [...stops].sort((a, b) => a.position - b.position);
    const stopsStr = sortedStops.map((s) => `${s.color} ${s.position}%`).join(', ');

    if (gradientType === 'linear') {
      return `linear-gradient(${angle}deg, ${stopsStr})`;
    } else if (gradientType === 'radial') {
      return `radial-gradient(circle at center, ${stopsStr})`;
    } else {
      return `conic-gradient(from ${angle}deg at center, ${stopsStr})`;
    }
  }, [gradientType, angle, stops]);

  const fullCssRule = `background: ${cssGradientString};`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullCssRule);
    setCopiedCss(true);
    setTimeout(() => setCopiedCss(false), 2000);
    trackEvent('copy_clicked', { tool: 'css-gradient-generator' });
  };

  const handleAddStop = () => {
    if (stops.length >= 6) return;
    const newId = String(Date.now());
    const randomHex = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    setStops([...stops, { id: newId, color: randomHex, position: 75 }]);
  };

  const handleRemoveStop = (id: string) => {
    if (stops.length <= 2) return;
    setStops(stops.filter((s) => s.id !== id));
  };

  const handleUpdateStop = (id: string, updates: Partial<ColorStop>) => {
    setStops(stops.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const handleRandomize = () => {
    const getRandomHex = () =>
      '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    const randomAngle = Math.floor(Math.random() * 360);
    setAngle(randomAngle);
    setStops([
      { id: '1', color: getRandomHex(), position: 0 },
      { id: '2', color: getRandomHex(), position: 50 },
      { id: '3', color: getRandomHex(), position: 100 },
    ]);
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setGradientType(preset.type as any);
    setAngle(preset.angle);
    setStops(preset.stops);
  };

  return (
    <div className="space-y-8">
      {/* Visual Live Gradient Preview Banner */}
      <div
        style={{ background: cssGradientString }}
        className="w-full h-64 sm:h-80 rounded-3xl shadow-xl flex items-end p-6 sm:p-8 transition-all duration-300 relative overflow-hidden"
      >
        <div className="p-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/20 text-white flex items-center justify-between gap-4 w-full">
          <div className="font-mono text-xs truncate select-all">{fullCssRule}</div>
          <button
            type="button"
            onClick={handleCopy}
            className="px-4 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-md hover:bg-slate-100 transition-all cursor-pointer flex-shrink-0"
          >
            {copiedCss ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedCss ? 'Copied CSS!' : 'Copy CSS'}
          </button>
        </div>
      </div>

      {/* Controls & Color Stops Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Settings Box */}
        <div className="lg:col-span-6 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Gradient Controls
            </h4>
            <button
              type="button"
              onClick={handleRandomize}
              className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 text-xs font-bold flex items-center gap-1 hover:bg-purple-100 transition-colors cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5" />
              Random
            </button>
          </div>

          {/* Type Switcher */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-500">Gradient Style</label>
            <div className="grid grid-cols-3 gap-2">
              {(['linear', 'radial', 'conic'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setGradientType(t)}
                  className={`py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                    gradientType === t
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Angle Slider (For Linear and Conic) */}
          {gradientType !== 'radial' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Angle</span>
                <span>{angle}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={angle}
                onChange={(e) => setAngle(Number(e.target.value))}
                aria-label="Gradient Angle"
                className="w-full accent-purple-600 cursor-pointer"
              />
            </div>
          )}

          {/* Color Stops List */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-500">Color Stops ({stops.length}/6)</span>
              <button
                type="button"
                onClick={handleAddStop}
                disabled={stops.length >= 6}
                className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" /> Add Stop
              </button>
            </div>

            <div className="space-y-2.5">
              {stops.map((stop) => (
                <div
                  key={stop.id}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
                >
                  <input
                    type="color"
                    value={stop.color}
                    onChange={(e) => handleUpdateStop(stop.id, { color: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={stop.color}
                    onChange={(e) => handleUpdateStop(stop.id, { color: e.target.value })}
                    className="w-20 px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white"
                  />
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={stop.position}
                      onChange={(e) => handleUpdateStop(stop.id, { position: Number(e.target.value) })}
                      aria-label="Stop Position"
                      className="w-full accent-purple-600 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-400 w-9 text-right">{stop.position}%</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveStop(stop.id)}
                    disabled={stops.length <= 2}
                    className="p-1.5 text-slate-400 hover:text-red-500 disabled:opacity-30 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Preset Library */}
        <div className="lg:col-span-6 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Curated Gradient Presets
          </h4>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {PRESETS.map((preset) => {
              const bg = `linear-gradient(${preset.angle}deg, ${preset.stops.map((s) => `${s.color} ${s.position}%`).join(', ')})`;
              return (
                <div
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-purple-500 transition-all cursor-pointer space-y-2 group"
                >
                  <div style={{ background: bg }} className="w-full h-16 rounded-xl shadow-xs group-hover:scale-102 transition-transform"></div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {preset.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
