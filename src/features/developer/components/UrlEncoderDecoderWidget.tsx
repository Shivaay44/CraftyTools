import React, { useState } from 'react';
import { trackEvent } from '../../../lib/analytics';
import {
  ShieldCheck,
  Copy,
  Check,
  ArrowRightLeft,
  Link,
  AlertCircle
} from 'lucide-react';

export const UrlEncoderDecoderWidget: React.FC = () => {
  const [input, setInput] = useState<string>('https://example.com/search?query=hello world & category=AI Tools#top');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [encodeType, setEncodeType] = useState<'component' | 'full'>('component');
  const [copied, setCopied] = useState<boolean>(false);

  const { output, errorMsg } = React.useMemo(() => {
    if (!input.trim()) return { output: '', errorMsg: null };
    try {
      const res = mode === 'encode'
        ? (encodeType === 'component' ? encodeURIComponent(input) : encodeURI(input))
        : (encodeType === 'component' ? decodeURIComponent(input) : decodeURI(input));
      return { output: res, errorMsg: null };
    } catch (err: any) {
      return { output: '', errorMsg: 'Failed to process URL. Please check for malformed URI sequences.' };
    }
  }, [input, mode, encodeType]);

  // Extract query parameters if input is a valid URL or query string
  const getQueryParams = (): Array<{ key: string; value: string }> => {
    try {
      let queryStr = input;
      if (input.includes('?')) {
        queryStr = input.split('?')[1]?.split('#')[0] || '';
      }
      const params = new URLSearchParams(queryStr);
      const list: Array<{ key: string; value: string }> = [];
      params.forEach((value, key) => {
        list.push({ key, value });
      });
      return list;
    } catch {
      return [];
    }
  };

  const queryParams = getQueryParams();

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    trackEvent('copy_clicked', { tool: 'url-encoder-decoder' });
  };

  const toggleMode = () => {
    setMode((prev) => (prev === 'encode' ? 'decode' : 'encode'));
    setInput(output);
  };

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span>100% Client-Side: URL encoding & parameter parsing are processed entirely in browser memory.</span>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Control Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setMode('encode')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === 'encode'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Encode URL
          </button>
          <button
            type="button"
            onClick={() => setMode('decode')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === 'decode'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Decode URL
          </button>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="radio"
              name="encodeType"
              checked={encodeType === 'component'}
              onChange={() => setEncodeType('component')}
              className="accent-blue-600"
            />
            <span>encodeURIComponent (Full safe)</span>
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="radio"
              name="encodeType"
              checked={encodeType === 'full'}
              onChange={() => setEncodeType('full')}
              className="accent-blue-600"
            />
            <span>encodeURI (Preserve protocol)</span>
          </label>
        </div>

        <button
          type="button"
          onClick={toggleMode}
          className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowRightLeft className="w-3.5 h-3.5" /> Swap Input/Output
        </button>
      </div>

      {/* Input & Output Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {mode === 'encode' ? 'Plain Text / Raw URL Input' : 'Encoded URL Input'}
          </label>
          <textarea
            rows={5}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter text or URL to transform..."
            className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Output */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {mode === 'encode' ? 'Encoded URL Output' : 'Decoded URL Output'}
            </label>
            {output && (
              <button
                type="button"
                onClick={handleCopy}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            )}
          </div>
          <textarea
            rows={5}
            readOnly
            value={output}
            placeholder="Result will appear here automatically..."
            className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-mono focus:outline-none"
          />
        </div>
      </div>

      {/* Query Parameters Extractor Table */}
      {queryParams.length > 0 && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Link className="w-4 h-4 text-blue-500" /> Extracted URL Parameters ({queryParams.length})
          </span>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <tr>
                  <th className="py-2 px-3">Parameter Key</th>
                  <th className="py-2 px-3">Decoded Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {queryParams.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2 px-3 font-bold text-blue-600 dark:text-blue-400">{p.key}</td>
                    <td className="py-2 px-3 text-slate-700 dark:text-slate-300 break-all">{p.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
