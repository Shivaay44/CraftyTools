import React, { useState } from 'react';
import { trackEvent } from '../../../lib/analytics';
import { ShieldCheck, Copy, Check } from 'lucide-react';

export const WordCounterWidget: React.FC = () => {
  const [text, setText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Real-time text calculations
  const totalChars = text.length;
  const charsNoSpaces = text.replace(/\s/g, '').length;

  // Safe word count calculation (handles multiple spaces, unicode, leading/trailing whitespace)
  const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;

  // Sentence count (matches . ! ? followed by whitespace or end)
  const sentences = text.trim() ? text.split(/[.!?]+(?:\s+|$)/).filter((s) => s.trim().length > 0).length : 0;

  // Paragraph count (matches non-empty lines separated by newlines)
  const paragraphs = text.trim() ? text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length : 0;

  // Reading time (average 200 words per minute)
  const readingTimeMins = Math.ceil(words / 200);

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    trackEvent('copy_clicked', { tool: 'word-character-counter' });
  };

  const handleClear = () => {
    setText('');
  };

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span>This tool processes your text locally in your browser. Your text is never stored or sent anywhere.</span>
      </div>

      {/* Real-time Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
          <p className="text-xl font-black text-blue-600 dark:text-blue-400">{words.toLocaleString()}</p>
          <p className="text-[11px] font-bold text-slate-500">Words</p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
          <p className="text-xl font-black text-slate-900 dark:text-white">{totalChars.toLocaleString()}</p>
          <p className="text-[11px] font-bold text-slate-500">Characters</p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
          <p className="text-xl font-black text-slate-900 dark:text-white">{charsNoSpaces.toLocaleString()}</p>
          <p className="text-[11px] font-bold text-slate-500">No Spaces</p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
          <p className="text-xl font-black text-slate-900 dark:text-white">{sentences.toLocaleString()}</p>
          <p className="text-[11px] font-bold text-slate-500">Sentences</p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
          <p className="text-xl font-black text-slate-900 dark:text-white">{paragraphs.toLocaleString()}</p>
          <p className="text-[11px] font-bold text-slate-500">Paragraphs</p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
            {words === 0 ? '0s' : `${readingTimeMins}m`}
          </p>
          <p className="text-[11px] font-bold text-slate-500">Read Time</p>
        </div>
      </div>

      {/* Textarea Input */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Type or Paste Text Below
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClear}
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
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>
          </div>
        </div>

        <textarea
          rows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste or start typing your document content here..."
          className="w-full p-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-sans"
        />
      </div>
    </div>
  );
};
