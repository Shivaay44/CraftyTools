import React, { useState, useRef, useEffect } from 'react';
import { trackEvent } from '../../../lib/analytics';
import {
  PenTool,
  Type,
  Download,
  Undo2,
  Trash2,
} from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  size: number;
}

const INK_COLORS = ['#0f172a', '#1e40af', '#b91c1c', '#047857', '#6b21a8'];

export const SignatureMakerWidget: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'draw' | 'type'>('draw');

  // Draw Mode State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [inkColor, setInkColor] = useState<string>('#0f172a');
  const [penSize, setPenSize] = useState<number>(3);
  const [isTransparent, setIsTransparent] = useState<boolean>(true);

  // Type Mode State
  const [typedName, setTypedName] = useState<string>('Alex Johnson');
  const [selectedFontIndex, setSelectedFontIndex] = useState<number>(0);
  const cursiveFonts = [
    { name: 'Elegant Script', font: 'Brush Script MT, cursive' },
    { name: 'Classic Calligraphy', font: 'Lucida Handwriting, cursive' },
    { name: 'Modern Signature', font: 'Segoe Script, cursive' },
    { name: 'Casual Flow', font: 'Comic Sans MS, cursive' },
    { name: 'Formal Cursive', font: 'Monotype Corsiva, cursive' },
  ];

  // Redraw canvas whenever strokes or background change
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const width = canvas.parentElement?.clientWidth || 600;
    const height = 280;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!isTransparent) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Render guide line
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(30, canvas.height - 50);
    ctx.lineTo(canvas.width - 30, canvas.height - 50);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw all strokes
    const allStrokes = currentStroke.length > 0
      ? [...strokes, { points: currentStroke, color: inkColor, size: penSize }]
      : strokes;

    allStrokes.forEach((stroke) => {
      if (stroke.points.length < 1) return;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length; i++) {
        const midPointX = (stroke.points[i - 1].x + stroke.points[i].x) / 2;
        const midPointY = (stroke.points[i - 1].y + stroke.points[i].y) / 2;
        ctx.quadraticCurveTo(stroke.points[i - 1].x, stroke.points[i - 1].y, midPointX, midPointY);
      }
      ctx.lineTo(
        stroke.points[stroke.points.length - 1].x,
        stroke.points[stroke.points.length - 1].y
      );
      ctx.stroke();
    });
  };

  useEffect(() => {
    if (activeTab === 'draw') {
      redrawCanvas();
    }
  }, [strokes, currentStroke, isTransparent, activeTab]);

  // Touch / Mouse coordinates
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pt = getCoordinates(e);
    if (!pt) return;
    setIsDrawing(true);
    setCurrentStroke([pt]);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const pt = getCoordinates(e);
    if (!pt) return;
    setCurrentStroke((prev) => [...prev, pt]);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentStroke.length > 0) {
      setStrokes((prev) => [...prev, { points: currentStroke, color: inkColor, size: penSize }]);
      setCurrentStroke([]);
    }
  };

  const handleUndo = () => {
    setStrokes((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setStrokes([]);
    setCurrentStroke([]);
  };

  const handleDownload = () => {
    let dataUrl = '';

    if (activeTab === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas || strokes.length === 0) return;
      dataUrl = canvas.toDataURL('image/png');
    } else {
      // Render typed signature into canvas
      const offCanvas = document.createElement('canvas');
      offCanvas.width = 600;
      offCanvas.height = 200;
      const ctx = offCanvas.getContext('2d');
      if (!ctx) return;

      if (!isTransparent) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 600, 200);
      }
      ctx.fillStyle = inkColor;
      ctx.font = `60px ${cursiveFonts[selectedFontIndex].font}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(typedName, 300, 100);
      dataUrl = offCanvas.toDataURL('image/png');
    }

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `signature-${Date.now()}.png`;
    a.click();
    trackEvent('download_clicked', { tool: 'signature-maker' });
  };

  return (
    <div className="space-y-8">
      {/* Mode Switcher Tabs */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('draw')}
            className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'draw'
                ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <PenTool className="w-4 h-4" />
            Draw Signature
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('type')}
            className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'type'
                ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Type className="w-4 h-4" />
            Type Signature
          </button>
        </div>

        {/* Background Transparency Toggle */}
        <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">
          <input
            type="checkbox"
            checked={isTransparent}
            onChange={(e) => setIsTransparent(e.target.checked)}
            className="rounded accent-purple-600"
          />
          Transparent PNG
        </label>
      </div>

      {/* Main Signing Area Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        {/* Draw Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          {/* Color Palettes */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ink:</span>
            {INK_COLORS.map((col) => (
              <button
                key={col}
                type="button"
                onClick={() => setInkColor(col)}
                style={{ backgroundColor: col }}
                className={`w-7 h-7 rounded-full transition-all cursor-pointer ${
                  inkColor === col ? 'ring-3 ring-purple-500 scale-110' : 'hover:scale-105 opacity-80'
                }`}
              />
            ))}
          </div>

          {activeTab === 'draw' && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400">Thickness:</span>
              <input
                type="range"
                min="1"
                max="8"
                step="1"
                value={penSize}
                onChange={(e) => setPenSize(Number(e.target.value))}
                aria-label="Pen Thickness"
                className="w-24 accent-purple-600 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-4">
                {penSize}px
              </span>
            </div>
          )}

          {activeTab === 'draw' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleUndo}
                disabled={strokes.length === 0}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 disabled:opacity-40 transition-colors cursor-pointer"
                title="Undo last stroke"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={strokes.length === 0}
                className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 disabled:opacity-40 transition-colors cursor-pointer"
                title="Clear canvas"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Canvas / Typing Display */}
        {activeTab === 'draw' ? (
          <div className="relative w-full rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 dark:border-slate-700 bg-checkerboard">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-[280px] cursor-crosshair touch-none"
            />
            {strokes.length === 0 && !isDrawing && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-sm font-semibold">
                ✍️ Draw your digital signature here with mouse or touch
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Type Your Name:
              </label>
              <input
                type="text"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="Alex Johnson"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-lg font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {cursiveFonts.map((f, idx) => (
                <div
                  key={f.name}
                  onClick={() => setSelectedFontIndex(idx)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-32 ${
                    selectedFontIndex === idx
                      ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                  }`}
                >
                  <div className="text-[10px] font-bold text-slate-400 uppercase">{f.name}</div>
                  <div
                    style={{ fontFamily: f.font, color: inkColor }}
                    className="text-3xl text-center truncate py-1"
                  >
                    {typedName || 'Signature'}
                  </div>
                  <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400 text-right">
                    {selectedFontIndex === idx ? '✓ Selected' : 'Select'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Download Button */}
        <div className="flex items-center justify-end pt-2">
          <button
            type="button"
            onClick={handleDownload}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download Signature ({isTransparent ? 'Transparent PNG' : 'White PNG'})
          </button>
        </div>
      </div>
    </div>
  );
};
