import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { trackEvent } from '../../../lib/analytics';
import { ShieldCheck, Download, Copy, Check, QrCode as QrIcon, AlertCircle } from 'lucide-react';

export const QrCodeGeneratorWidget: React.FC = () => {
  const [text, setText] = useState<string>('https://freetools.vercel.app');
  const [size, setSize] = useState<number>(300);
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const generateQr = async () => {
    setErrorMsg(null);
    if (!text.trim()) {
      setQrDataUrl('');
      return;
    }

    try {
      const url = await QRCode.toDataURL(text.trim(), {
        width: size,
        margin: 2,
        errorCorrectionLevel,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrDataUrl(url);
      trackEvent('tool_completed', { tool: 'qr-code-generator' });
    } catch (err: any) {
      console.error('QR Generation error:', err);
      setErrorMsg('Failed to generate QR code. Content may be too long for selected error correction level.');
      setQrDataUrl('');
      trackEvent('tool_error', { tool: 'qr-code-generator' });
    }
  };

  useEffect(() => {
    generateQr();
  }, [text, size, errorCorrectionLevel]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = 'freetools-qr-code.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    trackEvent('download_clicked', { tool: 'qr-code-generator' });
  };

  const handleCopy = async () => {
    if (!qrDataUrl) return;
    try {
      const res = await fetch(qrDataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      trackEvent('copy_clicked', { tool: 'qr-code-generator' });
    } catch (err) {
      // Fallback to copying Data URL string if clipboard item writing is restricted by browser
      navigator.clipboard.writeText(qrDataUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span>Your QR code is generated 100% locally in your browser. Your URL or text is never sent to our server.</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Controls Column */}
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Enter Website URL or Plain Text
            </label>
            <textarea
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. https://example.com or any contact text..."
              className="w-full p-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-sans"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Dimensions</label>
              <select
                value={size}
                onChange={(e) => setSize(parseInt(e.target.value, 10))}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={200}>200 x 200 px</option>
                <option value={300}>300 x 300 px</option>
                <option value={400}>400 x 400 px</option>
                <option value={500}>500 x 500 px</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Error Correction</label>
              <select
                value={errorCorrectionLevel}
                onChange={(e) => setErrorCorrectionLevel(e.target.value as any)}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="L">Low (~7% recovery)</option>
                <option value="M">Medium (~15% recovery)</option>
                <option value="Q">Quartile (~25% recovery)</option>
                <option value="H">High (~30% recovery)</option>
              </select>
            </div>
          </div>
        </div>

        {/* QR Preview Column */}
        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-between space-y-4">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <QrIcon className="w-4 h-4 text-blue-600" />
            Live QR Preview
          </span>

          {qrDataUrl ? (
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm inline-block">
              <img src={qrDataUrl} alt="Generated QR code" className="max-w-[200px] h-auto mx-auto" />
            </div>
          ) : (
            <div className="w-48 h-48 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs text-slate-400">
              Enter text to render QR
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 w-full">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!qrDataUrl}
              className="py-3 px-4 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 disabled:opacity-40 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={!qrDataUrl}
              className="py-3 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>Download PNG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
