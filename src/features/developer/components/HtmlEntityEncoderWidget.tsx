import React, { useState, useMemo } from 'react';
import { trackEvent } from '../../../lib/analytics';
import {
  Code,
  Copy,
  Check,
  RotateCcw,
  ArrowRightLeft,
  Sparkles,
} from 'lucide-react';

export const HtmlEntityEncoderWidget: React.FC = () => {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [entityType, setEntityType] = useState<'named' | 'numeric' | 'hex'>('named');
  const [inputText, setInputText] = useState<string>(
    '<div class="card" id="hero">\n  <h1>Hello & Welcome to "FreeTools"!</h1>\n  <p>Price: $10 & <50% discount</p>\n</div>'
  );
  const [copied, setCopied] = useState<boolean>(false);

  const convertedText = useMemo(() => {
    if (!inputText) return '';

    if (mode === 'encode') {
      if (entityType === 'named') {
        return inputText
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');
      } else if (entityType === 'numeric') {
        return inputText
          .split('')
          .map((char) => (char.charCodeAt(0) > 127 || ['<', '>', '&', '"', "'"].includes(char) ? `&#${char.charCodeAt(0)};` : char))
          .join('');
      } else {
        return inputText
          .split('')
          .map((char) => (char.charCodeAt(0) > 127 || ['<', '>', '&', '"', "'"].includes(char) ? `&#x${char.charCodeAt(0).toString(16)};` : char))
          .join('');
      }
    } else {
      // Decode entities
      const doc = new DOMParser().parseFromString(inputText, 'text/html');
      return doc.documentElement.textContent || '';
    }
  }, [inputText, mode, entityType]);

  const handleCopy = () => {
    if (!convertedText) return;
    navigator.clipboard.writeText(convertedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    trackEvent('copy_clicked', { tool: 'html-entity-encoder' });
  };

  const handleSwap = () => {
    if (convertedText) {
      setInputText(convertedText);
    }
    setMode(mode === 'encode' ? 'decode' : 'encode');
  };

  return (
    <div className="space-y-8">
      {/* Settings Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Mode */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setMode('encode')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === 'encode'
                ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Encode Entities
          </button>
          <button
            type="button"
            onClick={() => setMode('decode')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === 'decode'
                ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Decode Entities
          </button>
        </div>

        {mode === 'encode' && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Format:</span>
            {(['named', 'numeric', 'hex'] as const).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setEntityType(fmt)}
                className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                  entityType === fmt
                    ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {mode === 'encode' ? 'Raw HTML / Text Input' : 'HTML Entities Input'}
            </span>
            <button
              type="button"
              onClick={() => setInputText('')}
              className="text-xs font-bold text-slate-400 hover:text-red-500 cursor-pointer"
            >
              Clear
            </button>
          </div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={10}
            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              {mode === 'encode' ? 'Encoded Output' : 'Decoded Text Output'}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!convertedText}
              className="px-3.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-purple-600 flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <textarea
            readOnly
            value={convertedText}
            rows={10}
            className="w-full p-4 rounded-2xl bg-purple-50/30 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/60 font-mono text-xs text-purple-900 dark:text-purple-200 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};
