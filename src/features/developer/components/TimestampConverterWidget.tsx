import React, { useState, useEffect } from 'react';
import { trackEvent } from '../../../lib/analytics';
import {
  ShieldCheck,
  Clock,
  Calendar,
  Copy,
  Check,
  RefreshCw,
  Zap,
  ArrowRightLeft,
  Play,
  Pause
} from 'lucide-react';

export const TimestampConverterWidget: React.FC = () => {
  const [currentEpoch, setCurrentEpoch] = useState<number>(Math.floor(Date.now() / 1000));
  const [isLive, setIsLive] = useState<boolean>(true);

  // Epoch to Date inputs
  const [inputEpoch, setInputEpoch] = useState<string>(Math.floor(Date.now() / 1000).toString());
  const [epochUnit, setEpochUnit] = useState<'s' | 'ms'>('s');

  // Date to Epoch inputs
  const [inputDate, setInputDate] = useState<string>(new Date().toISOString().slice(0, 16));

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Live timer tick
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      setCurrentEpoch(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isLive]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    trackEvent('copy_clicked', { tool: 'timestamp-converter', item: key });
  };

  // Calculations for Epoch -> Date
  const parsedEpochNum = parseInt(inputEpoch, 10);
  const epochDateObj = !isNaN(parsedEpochNum)
    ? new Date(epochUnit === 's' ? parsedEpochNum * 1000 : parsedEpochNum)
    : null;

  const isValidEpochDate = epochDateObj && !isNaN(epochDateObj.getTime());

  // Calculations for Date -> Epoch
  const parsedDateObj = new Date(inputDate);
  const isValidDateObj = !isNaN(parsedDateObj.getTime());
  const generatedSec = isValidDateObj ? Math.floor(parsedDateObj.getTime() / 1000) : 0;
  const generatedMs = isValidDateObj ? parsedDateObj.getTime() : 0;

  // Relative Time Helper
  const getRelativeTime = (d: Date): string => {
    const diffSec = Math.round((d.getTime() - Date.now()) / 1000);
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

    if (Math.abs(diffSec) < 60) return rtf.format(diffSec, 'second');
    if (Math.abs(diffSec) < 3600) return rtf.format(Math.round(diffSec / 60), 'minute');
    if (Math.abs(diffSec) < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour');
    return rtf.format(Math.round(diffSec / 86400), 'day');
  };

  return (
    <div className="space-y-6">
      {/* Privacy Guarantee */}
      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span>100% Client-Side Time Calculations: Live Unix timestamps & conversions calculated in local browser memory.</span>
      </div>

      {/* Live Unix Epoch Header Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white border border-blue-800 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            Current Live Unix Epoch Timestamp
          </div>
          <div className="text-3xl sm:text-4xl font-mono font-black tracking-tight text-white">
            {currentEpoch}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsLive(!isLive)}
            className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            {isLive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isLive ? 'Pause' : 'Resume'}
          </button>

          <button
            type="button"
            onClick={() => copyToClipboard(currentEpoch.toString(), 'live')}
            className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            {copiedKey === 'live' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedKey === 'live' ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Converter 1: Epoch to Human Date */}
        <div className="space-y-4 bg-slate-50 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <Clock className="w-4 h-4 text-blue-600" />
            Convert Timestamp to Human Date
          </h3>

          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputEpoch}
                onChange={(e) => setInputEpoch(e.target.value)}
                placeholder="Enter Unix timestamp (e.g. 1740000000)"
                className="flex-1 p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={epochUnit}
                onChange={(e) => setEpochUnit(e.target.value as any)}
                className="p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="s">Seconds (s)</option>
                <option value="ms">Milliseconds (ms)</option>
              </select>
            </div>

            {/* Quick Helper Buttons */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setInputEpoch(Math.floor(Date.now() / 1000).toString())}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:border-blue-400 cursor-pointer"
              >
                Now
              </button>
              <button
                type="button"
                onClick={() => setInputEpoch((Math.floor(Date.now() / 1000) + 86400).toString())}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:border-blue-400 cursor-pointer"
              >
                +1 Day
              </button>
              <button
                type="button"
                onClick={() => setInputEpoch((Math.floor(Date.now() / 1000) + 604800).toString())}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:border-blue-400 cursor-pointer"
              >
                +1 Week
              </button>
            </div>

            {/* Conversion Result Card */}
            {isValidEpochDate && epochDateObj ? (
              <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Local Time:</span>
                  <div className="flex items-center gap-1.5">
                    <strong className="text-slate-900 dark:text-slate-100 font-mono">
                      {epochDateObj.toLocaleString()}
                    </strong>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(epochDateObj.toLocaleString(), 'local')}
                      className="text-slate-400 hover:text-blue-500 cursor-pointer"
                    >
                      {copiedKey === 'local' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">UTC / GMT:</span>
                  <div className="flex items-center gap-1.5">
                    <strong className="text-slate-900 dark:text-slate-100 font-mono">
                      {epochDateObj.toUTCString()}
                    </strong>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(epochDateObj.toUTCString(), 'utc')}
                      className="text-slate-400 hover:text-blue-500 cursor-pointer"
                    >
                      {copiedKey === 'utc' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">ISO 8601:</span>
                  <div className="flex items-center gap-1.5">
                    <strong className="text-slate-900 dark:text-slate-100 font-mono">
                      {epochDateObj.toISOString()}
                    </strong>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(epochDateObj.toISOString(), 'iso')}
                      className="text-slate-400 hover:text-blue-500 cursor-pointer"
                    >
                      {copiedKey === 'iso' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Relative Time:</span>
                  <strong className="text-blue-600 dark:text-blue-400">
                    {getRelativeTime(epochDateObj)}
                  </strong>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 text-amber-800 text-xs">
                Please enter a valid numeric Unix timestamp.
              </div>
            )}
          </div>
        </div>

        {/* Converter 2: Human Date to Epoch */}
        <div className="space-y-4 bg-slate-50 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <Calendar className="w-4 h-4 text-indigo-600" />
            Convert Human Date & Time to Timestamp
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Pick Date & Time
              </label>
              <input
                type="datetime-local"
                value={inputDate}
                onChange={(e) => setInputDate(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {isValidDateObj && (
              <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                <div>
                  <div className="text-slate-500 dark:text-slate-400 mb-1">Epoch Timestamp (Seconds):</div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 font-mono font-bold text-slate-900 dark:text-slate-100">
                    <span>{generatedSec}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(generatedSec.toString(), 'genSec')}
                      className="py-1 px-2.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'genSec' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-slate-500 dark:text-slate-400 mb-1">Epoch Timestamp (Milliseconds):</div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 font-mono font-bold text-slate-900 dark:text-slate-100">
                    <span>{generatedMs}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(generatedMs.toString(), 'genMs')}
                      className="py-1 px-2.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'genMs' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
