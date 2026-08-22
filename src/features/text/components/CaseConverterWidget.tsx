import React, { useState } from 'react';
import { trackEvent } from '../../../lib/analytics';
import { ShieldCheck, Copy, Check } from 'lucide-react';

export const CaseConverterWidget: React.FC = () => {
  const [text, setText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const convertUppercase = () => {
    setText((prev) => prev.toUpperCase());
    trackEvent('tool_completed', { tool: 'case-converter' });
  };

  const convertLowercase = () => {
    setText((prev) => prev.toLowerCase());
    trackEvent('tool_completed', { tool: 'case-converter' });
  };

  // Sensible Title Case algorithm
  const convertTitleCase = () => {
    const minorWords = new Set(['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from', 'by', 'of', 'in', 'with']);
    const converted = text
      .toLowerCase()
      .replace(/\b[a-z0-9'-]+\b/gi, (word, index) => {
        if (index === 0 || !minorWords.has(word)) {
          return word.charAt(0).toUpperCase() + word.slice(1);
        }
        return word;
      });

    setText(converted);
    trackEvent('tool_completed', { tool: 'case-converter' });
  };

  // Sensible Sentence case algorithm
  const convertSentenceCase = () => {
    const converted = text
      .toLowerCase()
      .replace(/(^\s*|[.!?]\s+)(\w)/g, (_, prefix, char) => prefix + char.toUpperCase());

    setText(converted);
    trackEvent('tool_completed', { tool: 'case-converter' });
  };

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    trackEvent('copy_clicked', { tool: 'case-converter' });
  };

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span>This tool converts text case locally inside your browser. No text is sent to our server.</span>
      </div>

      {/* Conversion Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={convertUppercase}
          disabled={!text}
          className="py-3 px-4 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-900 hover:bg-blue-600 hover:text-white border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 disabled:opacity-40 transition-all cursor-pointer shadow-sm"
        >
          UPPERCASE
        </button>

        <button
          type="button"
          onClick={convertLowercase}
          disabled={!text}
          className="py-3 px-4 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-900 hover:bg-blue-600 hover:text-white border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 disabled:opacity-40 transition-all cursor-pointer shadow-sm"
        >
          lowercase
        </button>

        <button
          type="button"
          onClick={convertTitleCase}
          disabled={!text}
          className="py-3 px-4 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-900 hover:bg-blue-600 hover:text-white border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 disabled:opacity-40 transition-all cursor-pointer shadow-sm"
        >
          Title Case
        </button>

        <button
          type="button"
          onClick={convertSentenceCase}
          disabled={!text}
          className="py-3 px-4 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-900 hover:bg-blue-600 hover:text-white border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 disabled:opacity-40 transition-all cursor-pointer shadow-sm"
        >
          Sentence case
        </button>
      </div>

      {/* Textarea */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Type or Paste Text to Convert
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setText('')}
              disabled={!text}
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-red-500 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!text}
              className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 transition-colors flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Result'}</span>
            </button>
          </div>
        </div>

        <textarea
          rows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste or type text here..."
          className="w-full p-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-sans"
        />
      </div>
    </div>
  );
};
