import React, { useState } from 'react';
import {
  ShieldCheck,
  ArrowRightLeft,
  Plus,
  Minus
} from 'lucide-react';

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
  originalLineNum?: number;
  modifiedLineNum?: number;
}

function computeSimpleDiff(original: string, modified: string): DiffLine[] {
  const origLines = original.split('\n');
  const modLines = modified.split('\n');
  const result: DiffLine[] = [];

  let i = 0;
  let j = 0;

  while (i < origLines.length || j < modLines.length) {
    if (i < origLines.length && j < modLines.length) {
      if (origLines[i] === modLines[j]) {
        result.push({
          type: 'unchanged',
          text: origLines[i],
          originalLineNum: i + 1,
          modifiedLineNum: j + 1,
        });
        i++;
        j++;
      } else {
        // Lookahead to see if line was added or removed
        const nextMatchInMod = modLines.slice(j).indexOf(origLines[i]);
        const nextMatchInOrig = origLines.slice(i).indexOf(modLines[j]);

        if (nextMatchInMod !== -1 && (nextMatchInOrig === -1 || nextMatchInMod <= nextMatchInOrig)) {
          // Lines in modified were added
          result.push({
            type: 'added',
            text: modLines[j],
            modifiedLineNum: j + 1,
          });
          j++;
        } else {
          // Line in original was removed
          result.push({
            type: 'removed',
            text: origLines[i],
            originalLineNum: i + 1,
          });
          i++;
        }
      }
    } else if (i < origLines.length) {
      result.push({
        type: 'removed',
        text: origLines[i],
        originalLineNum: i + 1,
      });
      i++;
    } else {
      result.push({
        type: 'added',
        text: modLines[j],
        modifiedLineNum: j + 1,
      });
      j++;
    }
  }

  return result;
}

export const TextDiffWidget: React.FC = () => {
  const [originalText, setOriginalText] = useState<string>(
    'The quick brown fox jumps over the lazy dog.\nWeb developers love fast browser tools.\nEnjoy 100% privacy with client-side computation.'
  );
  const [modifiedText, setModifiedText] = useState<string>(
    'The fast brown fox leaps over the sleepy dog.\nWeb developers and designers love fast browser tools.\nEnjoy 100% privacy with client-side computation.\nInstant speed and zero server latency!'
  );
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');

  const diffLines = computeSimpleDiff(originalText, modifiedText);

  const addedCount = diffLines.filter((l) => l.type === 'added').length;
  const removedCount = diffLines.filter((l) => l.type === 'removed').length;

  const swapInputs = () => {
    const temp = originalText;
    setOriginalText(modifiedText);
    setModifiedText(temp);
  };

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span>100% Client-Side Privacy: Text comparison and diff analysis run locally in your browser.</span>
      </div>

      {/* Editor Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Original */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-red-500 flex items-center gap-1">
              <Minus className="w-3.5 h-3.5" /> Original Text
            </span>
            <button
              type="button"
              onClick={() => setOriginalText('')}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          </div>
          <textarea
            rows={6}
            value={originalText}
            onChange={(e) => setOriginalText(e.target.value)}
            placeholder="Paste original text here..."
            className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Modified */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Modified Text
            </span>
            <button
              type="button"
              onClick={swapInputs}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1"
            >
              <ArrowRightLeft className="w-3 h-3" /> Swap
            </button>
          </div>
          <textarea
            rows={6}
            value={modifiedText}
            onChange={(e) => setModifiedText(e.target.value)}
            placeholder="Paste modified text here..."
            className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Diff Results Viewer */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Diff Visualizer
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              +{addedCount} Added
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
              -{removedCount} Removed
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('unified')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'unified'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Unified Diff
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'split'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Side-by-Side View
            </button>
          </div>
        </div>

        {/* Diff Content Box */}
        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 font-mono text-xs max-h-96 overflow-y-auto">
          {diffLines.map((line, idx) => {
            const isAdded = line.type === 'added';
            const isRemoved = line.type === 'removed';

            return (
              <div
                key={idx}
                className={`flex items-stretch border-b border-slate-100 dark:border-slate-900/50 last:border-0 ${
                  isAdded
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                    : isRemoved
                    ? 'bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200'
                    : 'bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-300'
                }`}
              >
                {/* Line number indicators */}
                <div className="w-12 py-1 px-2 text-right select-none opacity-40 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                  {line.originalLineNum || ''}
                </div>
                <div className="w-12 py-1 px-2 text-right select-none opacity-40 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                  {line.modifiedLineNum || ''}
                </div>
                <div className="w-6 py-1 text-center font-bold select-none">
                  {isAdded ? '+' : isRemoved ? '-' : ' '}
                </div>
                <div className="flex-1 py-1 px-2 whitespace-pre-wrap break-all">
                  {line.text || ' '}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
