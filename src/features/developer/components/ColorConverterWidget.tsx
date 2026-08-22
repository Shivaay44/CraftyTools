import React, { useState } from 'react';
import { trackEvent } from '../../../lib/analytics';
import {
  Copy,
  Check,
  ShieldCheck
} from 'lucide-react';

function hexToRgb(hex: string) {
  let cleaned = hex.replace('#', '');
  if (cleaned.length === 3) {
    cleaned = cleaned.split('').map((c) => c + c).join('');
  }
  const num = parseInt(cleaned, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0')).join('').toUpperCase();
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function rgbToCmyk(r: number, g: number, b: number) {
  if (r === 0 && g === 0 && b === 0) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }
  const c = 1 - r / 255;
  const m = 1 - g / 255;
  const y = 1 - b / 255;
  const k = Math.min(c, Math.min(m, y));
  return {
    c: Math.round(((c - k) / (1 - k)) * 100),
    m: Math.round(((m - k) / (1 - k)) * 100),
    y: Math.round(((y - k) / (1 - k)) * 100),
    k: Math.round(k * 100),
  };
}

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export const ColorConverterWidget: React.FC = () => {
  const [hexColor, setHexColor] = useState<string>('#3B82F6');
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  const rgb = hexToRgb(hexColor);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);

  const lum = getLuminance(rgb.r, rgb.g, rgb.b);
  const contrastWhite = (1 + 0.05) / (lum + 0.05);
  const contrastBlack = (lum + 0.05) / (0 + 0.05);

  const formats: Record<string, string> = {
    HEX: hexColor.toUpperCase(),
    RGB: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
    HSL: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
    CMYK: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`,
    CSS: `--color-primary: ${hexColor.toUpperCase()};`,
  };

  const copyVal = (fmt: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedFormat(fmt);
    setTimeout(() => setCopiedFormat(null), 2000);
    trackEvent('copy_clicked', { tool: 'color-converter', format: fmt });
  };

  // Generate 7 shades / tints
  const shadesAndTints = [-40, -20, -10, 0, 10, 20, 40].map((delta) => {
    const newL = Math.max(0, Math.min(100, hsl.l + delta));
    // convert back to rgb for display
    const hNorm = hsl.h / 360;
    const sNorm = hsl.s / 100;
    const lNorm = newL / 100;

    let r1 = 0, g1 = 0, b1 = 0;
    if (sNorm === 0) {
      r1 = g1 = b1 = lNorm;
    } else {
      const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
      const p = 2 * lNorm - q;
      const hue2rgb = (pVal: number, qVal: number, tVal: number) => {
        if (tVal < 0) tVal += 1;
        if (tVal > 1) tVal -= 1;
        if (tVal < 1 / 6) return pVal + (qVal - pVal) * 6 * tVal;
        if (tVal < 1 / 2) return qVal;
        if (tVal < 2 / 3) return pVal + (qVal - pVal) * (2 / 3 - tVal) * 6;
        return pVal;
      };
      r1 = hue2rgb(p, q, hNorm + 1 / 3);
      g1 = hue2rgb(p, q, hNorm);
      b1 = hue2rgb(p, q, hNorm - 1 / 3);
    }
    const hex = rgbToHex(Math.round(r1 * 255), Math.round(g1 * 255), Math.round(b1 * 255));
    return { delta, hex, l: newL };
  });

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span>100% Client-Side Color Conversion & Accessibility Contrast Calculations.</span>
      </div>

      {/* Main Color Picker Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Color Display */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm flex flex-col justify-between">
          <div
            className="h-44 w-full rounded-xl shadow-inner border border-black/10 relative flex items-center justify-center transition-all"
            style={{ backgroundColor: hexColor }}
          >
            <input
              type="color"
              value={hexColor}
              onChange={(e) => setHexColor(e.target.value)}
              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
            />
            <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-xs font-mono font-bold border border-white/20">
              Click to Pick Color
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">HEX Code:</span>
            <input
              type="text"
              value={hexColor}
              onChange={(e) => setHexColor(e.target.value)}
              className="flex-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-sm font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Color Formats */}
        <div className="md:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Converted Formats
          </span>
          <div className="space-y-2.5">
            {Object.entries(formats).map(([fmt, val]) => (
              <div
                key={fmt}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold w-12 text-slate-500">{fmt}</span>
                  <code className="text-xs sm:text-sm font-mono font-bold text-slate-800 dark:text-slate-200">
                    {val}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={() => copyVal(fmt, val)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold flex items-center gap-1 hover:border-blue-500 text-slate-700 dark:text-slate-300"
                >
                  {copiedFormat === fmt ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedFormat === fmt ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* WCAG Contrast Ratio & Accessibility Check */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* On White */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-900 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider opacity-60">Contrast on White</span>
            <h4 className="text-lg font-black" style={{ color: hexColor }}>
              {contrastWhite.toFixed(2)} : 1
            </h4>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
            contrastWhite >= 4.5 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
          }`}>
            {contrastWhite >= 7 ? 'AAA Pass' : contrastWhite >= 4.5 ? 'AA Pass' : 'Fail'}
          </span>
        </div>

        {/* On Black */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-white flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider opacity-60">Contrast on Black</span>
            <h4 className="text-lg font-black" style={{ color: hexColor }}>
              {contrastBlack.toFixed(2)} : 1
            </h4>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
            contrastBlack >= 4.5 ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-red-950 text-red-300 border border-red-800'
          }`}>
            {contrastBlack >= 7 ? 'AAA Pass' : contrastBlack >= 4.5 ? 'AA Pass' : 'Fail'}
          </span>
        </div>
      </div>

      {/* Tints & Shades Scale */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Tints & Shades Palette
        </span>
        <div className="grid grid-cols-7 gap-2">
          {shadesAndTints.map((s, i) => (
            <div
              key={i}
              onClick={() => setHexColor(s.hex)}
              className="cursor-pointer group flex flex-col items-center space-y-1"
            >
              <div
                className="h-14 w-full rounded-xl shadow-inner border border-black/5 group-hover:scale-105 transition-transform"
                style={{ backgroundColor: s.hex }}
              />
              <span className="text-[10px] font-mono text-slate-500">{s.hex}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
