import React, { useState, useRef, useEffect } from 'react';
import { trackEvent } from '../../../lib/analytics';
import {
  Download,
  Sliders,
} from 'lucide-react';

interface MemeTemplate {
  name: string;
  url: string;
}

const TEMPLATES: MemeTemplate[] = [
  { name: 'Drake Hotline', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80' },
  { name: 'Workspace Thinker', url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80' },
  { name: 'Coding Hacker', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80' },
  { name: 'Happy Coffee', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80' },
];

export const MemeGeneratorWidget: React.FC = () => {
  const [topText, setTopText] = useState<string>('WHEN THE CODE WORKS');
  const [bottomText, setBottomText] = useState<string>('ON THE FIRST TRY');
  const [fontSize, setFontSize] = useState<number>(36);
  const [textColor, setTextColor] = useState<string>('#ffffff');
  const [strokeColor, setStrokeColor] = useState<string>('#000000');
  const [isUppercase, setIsUppercase] = useState<boolean>(true);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const activeImageUrl = customImage || TEMPLATES[selectedTemplateIndex].url;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = 600;
      canvas.height = (img.height / img.width) * 600;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      ctx.font = `900 ${fontSize}px Impact, Arial Black, sans-serif`;
      ctx.fillStyle = textColor;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = Math.max(3, fontSize / 8);
      ctx.textAlign = 'center';
      ctx.lineJoin = 'round';

      const renderText = (txt: string, y: number) => {
        const processed = isUppercase ? txt.toUpperCase() : txt;
        ctx.strokeText(processed, canvas.width / 2, y);
        ctx.fillText(processed, canvas.width / 2, y);
      };

      if (topText) {
        renderText(topText, fontSize + 20);
      }
      if (bottomText) {
        renderText(bottomText, canvas.height - 25);
      }
    };
    img.src = activeImageUrl;
  }, [activeImageUrl, topText, bottomText, fontSize, textColor, strokeColor, isUppercase]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCustomImage(reader.result as string);
        trackEvent('tool_started', { tool: 'meme-generator' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `meme-${Date.now()}.png`;
    a.click();
    trackEvent('download_clicked', { tool: 'meme-generator' });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Controls Sidebar */}
      <div className="lg:col-span-5 space-y-6">
        <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            Meme Text & Styles
          </h4>

          {/* Top Text Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase text-slate-500">Top Text</label>
            <input
              type="text"
              value={topText}
              onChange={(e) => setTopText(e.target.value)}
              placeholder="Top Text"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          {/* Bottom Text Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase text-slate-500">Bottom Text</label>
            <input
              type="text"
              value={bottomText}
              onChange={(e) => setBottomText(e.target.value)}
              placeholder="Bottom Text"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          {/* Font Size Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Font Size</span>
              <span>{fontSize}px</span>
            </div>
            <input
              type="range"
              min="18"
              max="72"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              aria-label="Meme Font Size"
              className="w-full accent-purple-600 cursor-pointer"
            />
          </div>

          {/* Color Selectors & Uppercase toggle */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">Text Color</label>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-full h-9 rounded-lg cursor-pointer bg-transparent border-0"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">Outline Color</label>
              <input
                type="color"
                value={strokeColor}
                onChange={(e) => setStrokeColor(e.target.value)}
                className="w-full h-9 rounded-lg cursor-pointer bg-transparent border-0"
              />
            </div>
          </div>

          {/* Uppercase Toggle */}
          <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isUppercase}
              onChange={(e) => setIsUppercase(e.target.checked)}
              className="rounded accent-purple-600"
            />
            Convert Text to UPPERCASE
          </label>

          {/* Template Selection */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <label className="block text-xs font-bold uppercase text-slate-400">Choose Meme Template</label>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map((tmpl, idx) => (
                <button
                  key={tmpl.name}
                  type="button"
                  onClick={() => {
                    setCustomImage(null);
                    setSelectedTemplateIndex(idx);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold text-left transition-all cursor-pointer truncate ${
                    !customImage && selectedTemplateIndex === idx
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-50'
                  }`}
                >
                  {tmpl.name}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Upload or Template selection */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <label className="block text-xs font-bold uppercase text-slate-400">Or Upload Custom Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-50 file:text-purple-600 hover:file:bg-purple-100 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Live Canvas Preview & Download */}
      <div className="lg:col-span-7 space-y-6">
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 flex flex-col items-center">
          <div className="w-full max-w-[500px] rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700 bg-black">
            <canvas ref={canvasRef} className="w-full h-auto object-contain" />
          </div>

          <button
            type="button"
            onClick={handleDownload}
            className="w-full max-w-[500px] py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-purple-500/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download Meme (PNG)
          </button>
        </div>
      </div>
    </div>
  );
};
