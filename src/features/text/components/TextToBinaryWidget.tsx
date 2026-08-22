import React, { useState, useMemo } from 'react';
import { trackEvent } from '../../../lib/analytics';
import {
  ShieldCheck,
  Binary,
  ArrowRightLeft,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  Code2
} from 'lucide-react';

export const TextToBinaryWidget: React.FC = () => {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [inputText, setInputText] = useState<string>('Hello World! 🚀');
  const [delimiter, setDelimiter] = useState<'space' | 'none' | 'comma'>('space');
  const [decodeFormat, setDecodeFormat] = useState<'binary' | 'hex' | 'decimal'>('binary');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    trackEvent('copy_clicked', { tool: 'text-to-binary', format: key });
  };

  const delimChar = delimiter === 'space' ? ' ' : delimiter === 'comma' ? ', ' : '';

  // Encode Text -> Multiple Formats
  const { binaryOut, hexOut, decimalOut, octalOut } = useMemo(() => {
    if (mode !== 'encode' || !inputText) {
      return { binaryOut: '', hexOut: '', decimalOut: '', octalOut: '' };
    }

    const utf8Encoder = new TextEncoder();
    const bytes = utf8Encoder.encode(inputText);

    const binArr: string[] = [];
    const hexArr: string[] = [];
    const decArr: string[] = [];
    const octArr: string[] = [];

    bytes.forEach((b) => {
      binArr.push(b.toString(2).padStart(8, '0'));
      hexArr.push(b.toString(16).padStart(2, '0').toUpperCase());
      decArr.push(b.toString(10));
      octArr.push(b.toString(8).padStart(3, '0'));
    });

    return {
      binaryOut: binArr.join(delimChar),
      hexOut: hexArr.join(delimChar),
      decimalOut: decArr.join(delimChar),
      octalOut: octArr.join(delimChar),
    };
  }, [inputText, mode, delimChar]);

  // Decode Binary / Hex / Dec -> Text
  const decodedText = useMemo(() => {
    if (mode !== 'decode' || !inputText.trim()) return '';

    try {
      let tokens: string[] = [];

      if (decodeFormat === 'binary') {
        // Split on whitespace or commas or groups of 8
        const clean = inputText.replace(/[^01]/g, ' ');
        tokens = clean.trim().split(/\s+/).filter(Boolean);
        const bytes = new Uint8Array(tokens.map((t) => parseInt(t, 2)));
        return new TextDecoder().decode(bytes);
      } else if (decodeFormat === 'hex') {
        const clean = inputText.replace(/[^0-9a-fA-F]/g, ' ');
        tokens = clean.trim().split(/\s+/).filter(Boolean);
        const bytes = new Uint8Array(tokens.map((t) => parseInt(t, 16)));
        return new TextDecoder().decode(bytes);
      } else if (decodeFormat === 'decimal') {
        tokens = inputText.trim().split(/[\s,]+/).filter(Boolean);
        const bytes = new Uint8Array(tokens.map((t) => parseInt(t, 10)));
        return new TextDecoder().decode(bytes);
      }
      return '';
    } catch {
      return 'Invalid input format for selected decode mode.';
    }
  }, [inputText, mode, decodeFormat]);

  return (
    <div className="space-y-6">
      {/* Privacy Guarantee */}
      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span>100% In-Browser UTF-8 Encoding: Instant bi-directional Binary, Hex, Decimal, and Octal conversions.</span>
      </div>

      {/* Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => {
              setMode('encode');
              setInputText('Hello World! 🚀');
            }}
            className={`py-2 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === 'encode'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:text-blue-500'
            }`}
          >
            Text ➔ Binary / Hex / Dec
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('decode');
              setInputText('01001000 01100101 01101100 01101100 01101111');
            }}
            className={`py-2 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === 'decode'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:text-blue-500'
            }`}
          >
            Binary / Hex ➔ Text
          </button>
        </div>

        {mode === 'encode' && (
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-500 dark:text-slate-400">Byte Delimiter:</span>
            <select
              value={delimiter}
              onChange={(e) => setDelimiter(e.target.value as any)}
              className="p-1.5 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="space">Space (0100 0101)</option>
              <option value="comma">Comma (0100, 0101)</option>
              <option value="none">No Space (01000101)</option>
            </select>
          </div>
        )}

        {mode === 'decode' && (
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-500 dark:text-slate-400">Input Type:</span>
            <select
              value={decodeFormat}
              onChange={(e) => setDecodeFormat(e.target.value as any)}
              className="p-1.5 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="binary">Binary (Base 2)</option>
              <option value="hex">Hexadecimal (Base 16)</option>
              <option value="decimal">ASCII Decimal (Base 10)</option>
            </select>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
          <span>{mode === 'encode' ? 'Input Plain Text' : `Input ${decodeFormat.toUpperCase()} Code`}</span>
          <span className="text-slate-400">{inputText.length} chars</span>
        </div>
        <textarea
          rows={4}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={mode === 'encode' ? 'Type or paste text to convert...' : 'Paste binary numbers (01001000 01100101)...'}
          className="w-full p-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed resize-y"
        />
      </div>

      {/* Output Sections */}
      {mode === 'encode' ? (
        <div className="space-y-4">
          {/* Binary Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Binary className="w-4 h-4 text-blue-600" />
                Binary (Base 2 - 8-bit Bytes)
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(binaryOut, 'bin')}
                className="py-1 px-2.5 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'bin' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'bin' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3.5 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800 whitespace-pre-wrap select-all">
              {binaryOut || 'Enter text above to encode'}
            </pre>
          </div>

          {/* Hexadecimal Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-purple-600" />
                Hexadecimal (Base 16)
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(hexOut, 'hex')}
                className="py-1 px-2.5 rounded-lg text-xs font-bold bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 hover:bg-purple-100 flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'hex' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'hex' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3.5 rounded-xl bg-slate-900 text-purple-300 font-mono text-xs overflow-x-auto border border-slate-800 whitespace-pre-wrap select-all">
              {hexOut || 'Enter text above to encode'}
            </pre>
          </div>

          {/* Decimal / ASCII Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  ASCII Decimal (Base 10)
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(decimalOut, 'dec')}
                  className="py-1 px-2.5 rounded-lg text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'dec' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'dec' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-3.5 rounded-xl bg-slate-900 text-amber-300 font-mono text-xs overflow-x-auto border border-slate-800 whitespace-pre-wrap select-all">
                {decimalOut || '...'}
              </pre>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Octal (Base 8)
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(octalOut, 'oct')}
                  className="py-1 px-2.5 rounded-lg text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'oct' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'oct' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-3.5 rounded-xl bg-slate-900 text-teal-300 font-mono text-xs overflow-x-auto border border-slate-800 whitespace-pre-wrap select-all">
                {octalOut || '...'}
              </pre>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Decoded Plain Text
            </span>
            <button
              type="button"
              onClick={() => copyToClipboard(decodedText, 'decoded')}
              className="py-1 px-3 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1 cursor-pointer shadow-xs"
            >
              {copiedKey === 'decoded' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'decoded' ? 'Copied Text' : 'Copy Decoded Text'}</span>
            </button>
          </div>
          <pre className="p-4 rounded-2xl bg-slate-900 text-slate-100 font-sans text-sm min-h-[140px] border border-slate-800 whitespace-pre-wrap select-all leading-relaxed">
            {decodedText || 'Enter valid encoded tokens above'}
          </pre>
        </div>
      )}
    </div>
  );
};
