import React, { useState } from 'react';
import { trackEvent } from '../../../lib/analytics';
import { ShieldCheck, Copy, Check, ArrowRightLeft, AlertCircle } from 'lucide-react';

// Unicode-safe Base64 Encoding using TextEncoder
function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Unicode-safe Base64 Decoding using TextDecoder
function base64ToUtf8(base64: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export const Base64EncoderWidget: React.FC = () => {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleProcess = () => {
    setErrorMsg(null);
    if (!input.trim()) {
      setOutput('');
      return;
    }

    try {
      if (mode === 'encode') {
        const encoded = utf8ToBase64(input);
        setOutput(encoded);
      } else {
        const decoded = base64ToUtf8(input.trim());
        setOutput(decoded);
      }
      trackEvent('tool_completed', { tool: 'base64-encoder' });
    } catch (err: any) {
      console.error('Base64 processing error:', err);
      setErrorMsg(mode === 'decode' ? 'Invalid Base64 string format.' : 'Failed to encode input text.');
      setOutput('');
      trackEvent('tool_error', { tool: 'base64-encoder' });
    }
  };

  const toggleMode = () => {
    setMode((prev) => (prev === 'encode' ? 'decode' : 'encode'));
    setInput(output);
    setOutput(input);
    setErrorMsg(null);
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    trackEvent('copy_clicked', { tool: 'base64-encoder' });
  };

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span>This tool processes Base64 encoding and decoding 100% locally in your browser.</span>
      </div>

      {/* Mode Switcher */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setMode('encode');
              setErrorMsg(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'encode' ? 'bg-blue-600 text-white shadow' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            Encode (Text → Base64)
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('decode');
              setErrorMsg(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'decode' ? 'bg-blue-600 text-white shadow' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            Decode (Base64 → Text)
          </button>
        </div>

        <button
          type="button"
          onClick={toggleMode}
          className="p-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
          title="Swap input and output"
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Swap</span>
        </button>
      </div>

      {/* Input Area */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {mode === 'encode' ? 'Input Text (Supports Unicode, Hindi & Emojis)' : 'Input Base64 String'}
          </label>
          <button
            type="button"
            onClick={() => {
              setInput('');
              setOutput('');
              setErrorMsg(null);
            }}
            disabled={!input}
            className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-red-500 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
          >
            Clear
          </button>
        </div>
        <textarea
          rows={5}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === 'encode' ? 'Enter text to encode...' : 'Paste Base64 string here...'}
          className="w-full p-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono"
        />
      </div>

      <button
        type="button"
        onClick={handleProcess}
        disabled={!input.trim()}
        className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all cursor-pointer shadow-md"
      >
        {mode === 'encode' ? 'Encode to Base64' : 'Decode Base64 to Text'}
      </button>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Output Area */}
      {output && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {mode === 'encode' ? 'Base64 Result' : 'Decoded Text Result'}
            </label>
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Result'}</span>
            </button>
          </div>
          <textarea
            rows={5}
            readOnly
            value={output}
            className="w-full p-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm font-mono outline-none"
          />
        </div>
      )}
    </div>
  );
};
