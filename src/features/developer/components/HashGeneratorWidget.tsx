import React, { useState, useEffect } from 'react';
import { trackEvent } from '../../../lib/analytics';
import {
  ShieldCheck,
  Copy,
  Check,
  Upload
} from 'lucide-react';

// Lightweight pure JS MD5 implementation
function md5(input: string | Uint8Array): string {
  function safeAdd(x: number, y: number) {
    const lsw = (x & 0xffff) + (y & 0xffff);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
  }
  function bitRotateLeft(num: number, cnt: number) {
    return (num << cnt) | (num >>> (32 - cnt));
  }
  function md5cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
    return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
  }
  function md5ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return md5cmn((b & c) | (~b & d), a, b, x, s, t);
  }
  function md5gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return md5cmn((b & d) | (c & ~d), a, b, x, s, t);
  }
  function md5hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return md5cmn(b ^ c ^ d, a, b, x, s, t);
  }
  function md5ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return md5cmn(c ^ (b | ~d), a, b, x, s, t);
  }

  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  const n = bytes.length;
  const words: number[] = [];
  for (let i = 0; i < n; i++) {
    words[i >> 2] |= bytes[i] << ((i % 4) * 8);
  }
  words[n >> 2] |= 0x80 << ((n % 4) * 8);
  words[(((n + 8) >> 6) << 4) + 14] = n * 8;

  let a = 1732584193;
  let b = -271733879;
  let c = -1732584194;
  let d = 271733878;

  for (let i = 0; i < words.length; i += 16) {
    const olda = a;
    const oldb = b;
    const oldc = c;
    const oldd = d;

    const x = words.slice(i, i + 16);
    for (let k = 0; k < 16; k++) if (x[k] === undefined) x[k] = 0;

    a = md5ff(a, b, c, d, x[0], 7, -680876936);
    d = md5ff(d, a, b, c, x[1], 12, -389564586);
    c = md5ff(c, d, a, b, x[2], 17, 606105819);
    b = md5ff(b, c, d, a, x[3], 22, -1044525330);
    a = md5ff(a, b, c, d, x[4], 7, -176418897);
    d = md5ff(d, a, b, c, x[5], 12, 1200080426);
    c = md5ff(c, d, a, b, x[6], 17, -1473231341);
    b = md5ff(b, c, d, a, x[7], 22, -45705983);
    a = md5ff(a, b, c, d, x[8], 7, 1770035416);
    d = md5ff(d, a, b, c, x[9], 12, -1958414417);
    c = md5ff(c, d, a, b, x[10], 17, -42063);
    b = md5ff(b, c, d, a, x[11], 22, -1990404162);
    a = md5ff(a, b, c, d, x[12], 7, 1804603682);
    d = md5ff(d, a, b, c, x[13], 12, -40341101);
    c = md5ff(c, d, a, b, x[14], 17, -1502002290);
    b = md5ff(b, c, d, a, x[15], 22, 1236535329);

    a = md5gg(a, b, c, d, x[1], 5, -165796510);
    d = md5gg(d, a, b, c, x[6], 9, -1069501632);
    c = md5gg(c, d, a, b, x[11], 14, 643717713);
    b = md5gg(b, c, d, a, x[0], 20, -373897302);
    a = md5gg(a, b, c, d, x[5], 5, -701558691);
    d = md5gg(d, a, b, c, x[10], 9, 38016083);
    c = md5gg(c, d, a, b, x[15], 14, -660478335);
    b = md5gg(b, c, d, a, x[4], 20, -405537848);
    a = md5gg(a, b, c, d, x[9], 5, 568446438);
    d = md5gg(d, a, b, c, x[14], 9, -1019803690);
    c = md5gg(c, d, a, b, x[3], 14, -187363961);
    b = md5gg(b, c, d, a, x[8], 20, 1163531501);
    a = md5gg(a, b, c, d, x[13], 5, -1444681467);
    d = md5gg(d, a, b, c, x[2], 9, -51403784);
    c = md5gg(c, d, a, b, x[7], 14, 1735328473);
    b = md5gg(b, c, d, a, x[12], 20, -1926607734);

    a = md5hh(a, b, c, d, x[5], 4, -378558);
    d = md5hh(d, a, b, c, x[8], 11, -2022574463);
    c = md5hh(c, d, a, b, x[11], 16, 1839030562);
    b = md5hh(b, c, d, a, x[14], 23, -35309556);
    a = md5hh(a, b, c, d, x[1], 4, -1530992060);
    d = md5hh(d, a, b, c, x[4], 11, 1272893353);
    c = md5hh(c, d, a, b, x[7], 16, -155497632);
    b = md5hh(b, c, d, a, x[10], 23, -1094730640);
    a = md5hh(a, b, c, d, x[13], 4, 681279174);
    d = md5hh(d, a, b, c, x[0], 11, -358537222);
    c = md5hh(c, d, a, b, x[3], 16, -722521979);
    b = md5hh(b, c, d, a, x[6], 23, 76029189);
    a = md5hh(a, b, c, d, x[9], 4, -640364487);
    d = md5hh(d, a, b, c, x[12], 11, -421815835);
    c = md5hh(c, d, a, b, x[15], 16, 530742520);
    b = md5hh(b, c, d, a, x[2], 23, -995338651);

    a = md5ii(a, b, c, d, x[0], 6, -198630844);
    d = md5ii(d, a, b, c, x[7], 10, 1126891415);
    c = md5ii(c, d, a, b, x[14], 15, -1416354905);
    b = md5ii(b, c, d, a, x[5], 21, -57434055);
    a = md5ii(a, b, c, d, x[12], 6, 1700485571);
    d = md5ii(d, a, b, c, x[3], 10, -1894986606);
    c = md5ii(c, d, a, b, x[10], 15, -1051523);
    b = md5ii(b, c, d, a, x[1], 21, -2054922799);
    a = md5ii(a, b, c, d, x[8], 6, 1873313359);
    d = md5ii(d, a, b, c, x[15], 10, -30611744);
    c = md5ii(c, d, a, b, x[6], 15, -1560198380);
    b = md5ii(b, c, d, a, x[13], 21, 1309151649);
    a = md5ii(a, b, c, d, x[4], 6, -145523070);
    d = md5ii(d, a, b, c, x[11], 10, -1120210379);
    c = md5ii(c, d, a, b, x[2], 15, 718787259);
    b = md5ii(b, c, d, a, x[9], 21, -343485551);

    a = safeAdd(a, olda);
    b = safeAdd(b, oldb);
    c = safeAdd(c, oldc);
    d = safeAdd(d, oldd);
  }

  const hexChars = '0123456789abcdef';
  let result = '';
  for (const num of [a, b, c, d]) {
    for (let i = 0; i < 4; i++) {
      const byte = (num >>> (i * 8)) & 0xff;
      result += hexChars[(byte >> 4) & 0x0f] + hexChars[byte & 0x0f];
    }
  }
  return result;
}

export const HashGeneratorWidget: React.FC = () => {
  const [inputType, setInputType] = useState<'text' | 'file'>('text');
  const [textInput, setTextInput] = useState<string>('Hello, World!');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [uppercase, setUppercase] = useState<boolean>(false);
  const [copiedAlgo, setCopiedAlgo] = useState<string | null>(null);
  const [hashes, setHashes] = useState<Record<string, string>>({});

  const computeHashes = async (data: Uint8Array) => {
    try {
      const bufferToHex = (buf: ArrayBuffer) =>
        Array.from(new Uint8Array(buf))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');

      const bufferSource = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;

      const [sha256Buf, sha512Buf, sha384Buf, sha1Buf] = await Promise.all([
        crypto.subtle.digest('SHA-256', bufferSource),
        crypto.subtle.digest('SHA-512', bufferSource),
        crypto.subtle.digest('SHA-384', bufferSource),
        crypto.subtle.digest('SHA-1', bufferSource),
      ]);

      const md5Result = md5(data);

      setHashes({
        'SHA-256': bufferToHex(sha256Buf),
        'SHA-512': bufferToHex(sha512Buf),
        'SHA-384': bufferToHex(sha384Buf),
        'SHA-1': bufferToHex(sha1Buf),
        MD5: md5Result,
      });
    } catch (err) {
      console.error('Hash calculation error:', err);
    }
  };

  useEffect(() => {
    if (inputType === 'text') {
      const encoded = new TextEncoder().encode(textInput);
      computeHashes(encoded);
    } else if (fileBytes) {
      computeHashes(fileBytes);
    }
  }, [textInput, fileBytes, inputType]);

  const handleFileUpload = async (file: File | undefined) => {
    if (!file) return;
    setFileName(file.name);
    const buf = await file.arrayBuffer();
    setFileBytes(new Uint8Array(buf));
    trackEvent('tool_completed', { tool: 'hash-generator', type: 'file' });
  };

  const copyHash = (algo: string, val: string) => {
    const formatted = uppercase ? val.toUpperCase() : val.toLowerCase();
    navigator.clipboard.writeText(formatted);
    setCopiedAlgo(algo);
    setTimeout(() => setCopiedAlgo(null), 2000);
    trackEvent('copy_clicked', { tool: 'hash-generator', algo });
  };

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span>100% Client-Side Privacy: Hashes are calculated securely using browser Web Crypto API.</span>
      </div>

      {/* Input Mode Switcher */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setInputType('text')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                inputType === 'text'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Hash Text
            </button>
            <button
              type="button"
              onClick={() => setInputType('file')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                inputType === 'file'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Hash File / Document
            </button>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={uppercase}
              onChange={(e) => setUppercase(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 accent-blue-600"
            />
            <span>Uppercase Hashes</span>
          </label>
        </div>

        {inputType === 'text' ? (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Input Text String
            </label>
            <textarea
              rows={3}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type or paste text to calculate cryptographic hashes..."
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.dataTransfer.dropEffect = 'copy';
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const f = e.dataTransfer.files?.[0];
              if (f) handleFileUpload(f);
            }}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-xl p-8 text-center cursor-pointer bg-slate-50/50 dark:bg-slate-900/50"
          >
            <label className="cursor-pointer flex flex-col items-center justify-center">
              <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400 pointer-events-none" />
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300 block pointer-events-none">
                {fileName ? `File: ${fileName}` : 'Drag & Drop or click to select any file for checksum'}
              </span>
              <input
                type="file"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files?.[0])}
              />
            </label>
          </div>
        )}
      </div>

      {/* Calculated Hashes Cards */}
      <div className="space-y-3">
        {['SHA-256', 'SHA-512', 'SHA-384', 'SHA-1', 'MD5'].map((algo) => {
          const rawHash = hashes[algo] || '';
          const displayHash = uppercase ? rawHash.toUpperCase() : rawHash.toLowerCase();
          const isCopied = copiedAlgo === algo;

          return (
            <div
              key={algo}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:border-blue-400 transition-colors"
            >
              <div className="space-y-1 overflow-hidden pr-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400">
                  {algo}
                </span>
                <p className="text-xs sm:text-sm font-mono text-slate-800 dark:text-slate-200 break-all pt-1">
                  {displayHash || 'Calculating...'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => copyHash(algo, rawHash)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors self-end sm:self-center flex-shrink-0 cursor-pointer"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
