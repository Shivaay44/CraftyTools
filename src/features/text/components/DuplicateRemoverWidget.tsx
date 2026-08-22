import React, { useState } from 'react';
import { trackEvent } from '../../../lib/analytics';
import {
  ShieldCheck,
  Copy,
  Check
} from 'lucide-react';

export const DuplicateRemoverWidget: React.FC = () => {
  const [input, setInput] = useState<string>(
    'Apple\nBanana\nOrange\nApple\nMango\nBanana\nGrape\napple\nStrawberry'
  );
  const [caseSensitive, setCaseSensitive] = useState<boolean>(false);
  const [trimWhitespace, setTrimWhitespace] = useState<boolean>(true);
  const [removeEmptyLines, setRemoveEmptyLines] = useState<boolean>(true);
  const [sortOrder, setSortOrder] = useState<'original' | 'az' | 'za' | 'length'>('original');
  const [copied, setCopied] = useState<boolean>(false);

  const getCleanedLines = (): string[] => {
    if (!input) return [];
    let lines = input.split('\n');

    if (trimWhitespace) {
      lines = lines.map((l) => l.trim());
    }

    if (removeEmptyLines) {
      lines = lines.filter((l) => l.length > 0);
    }

    const seen = new Set<string>();
    const unique: string[] = [];

    for (const line of lines) {
      const key = caseSensitive ? line : line.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(line);
      }
    }

    if (sortOrder === 'az') {
      unique.sort((a, b) => a.localeCompare(b));
    } else if (sortOrder === 'za') {
      unique.sort((a, b) => b.localeCompare(a));
    } else if (sortOrder === 'length') {
      unique.sort((a, b) => a.length - b.length);
    }

    return unique;
  };

  const cleanedLines = getCleanedLines();
  const outputText = cleanedLines.join('\n');

  const totalInputLines = input ? input.split('\n').length : 0;
  const duplicatesRemoved = totalInputLines - cleanedLines.length;

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    trackEvent('copy_clicked', { tool: 'duplicate-line-remover' });
  };

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span>100% Client-Side Text Processing: Clean and deduplicate lines safely in your browser memory.</span>
      </div>

      {/* Settings Bar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Sorting */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Sort Order
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="original">Preserve Original Order</option>
              <option value="az">Alphabetical (A → Z)</option>
              <option value="za">Alphabetical (Z → A)</option>
              <option value="length">By Line Length (Shortest first)</option>
            </select>
          </div>

          {/* Toggles */}
          <div className="flex flex-col justify-center space-y-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={caseSensitive}
                onChange={(e) => setCaseSensitive(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 accent-blue-600"
              />
              <span>Case Sensitive</span>
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={trimWhitespace}
                onChange={(e) => setTrimWhitespace(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 accent-blue-600"
              />
              <span>Trim Whitespace</span>
            </label>
          </div>

          <div className="flex flex-col justify-center space-y-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={removeEmptyLines}
                onChange={(e) => setRemoveEmptyLines(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 accent-blue-600"
              />
              <span>Remove Empty Lines</span>
            </label>
          </div>

          {/* Stats */}
          <div className="flex flex-col justify-center bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] uppercase font-bold text-slate-400">Stats</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {cleanedLines.length} unique lines
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              {duplicatesRemoved > 0 ? `${duplicatesRemoved} duplicates removed` : 'No duplicates'}
            </span>
          </div>
        </div>
      </div>

      {/* Input / Output Editors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Input List ({totalInputLines} lines)
            </label>
            <button
              type="button"
              onClick={() => setInput('')}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          </div>
          <textarea
            rows={10}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste multiple lines of text here..."
            className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Output */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Cleaned Unique List ({cleanedLines.length} lines)
            </label>
            <button
              type="button"
              onClick={handleCopy}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
          <textarea
            rows={10}
            readOnly
            value={outputText}
            placeholder="Cleaned list will appear here..."
            className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-mono focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};
