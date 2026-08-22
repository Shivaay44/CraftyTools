import React, { useState } from 'react';
import { trackEvent } from '../../../lib/analytics';
import { ShieldCheck, Copy, Check, AlertCircle, FileCheck, Code } from 'lucide-react';

export const JsonFormatterWidget: React.FC = () => {
  const [jsonInput, setJsonInput] = useState<string>('');
  const [indent, setIndent] = useState<number>(2);
  const [validationStatus, setValidationStatus] = useState<{ valid: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleFormat = () => {
    if (!jsonInput.trim()) {
      setValidationStatus(null);
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      const formatted = JSON.stringify(parsed, null, indent);
      setJsonInput(formatted);
      setValidationStatus({ valid: true, message: 'Valid JSON — Successfully Formatted!' });
      trackEvent('tool_completed', { tool: 'json-formatter' });
    } catch (err: any) {
      setValidationStatus({ valid: false, message: `JSON Syntax Error: ${err.message}` });
      trackEvent('tool_error', { tool: 'json-formatter' });
    }
  };

  const handleMinify = () => {
    if (!jsonInput.trim()) return;

    try {
      const parsed = JSON.parse(jsonInput);
      const minified = JSON.stringify(parsed);
      setJsonInput(minified);
      setValidationStatus({ valid: true, message: 'Valid JSON — Successfully Minified!' });
      trackEvent('tool_completed', { tool: 'json-formatter' });
    } catch (err: any) {
      setValidationStatus({ valid: false, message: `JSON Syntax Error: ${err.message}` });
      trackEvent('tool_error', { tool: 'json-formatter' });
    }
  };

  const handleValidate = () => {
    if (!jsonInput.trim()) {
      setValidationStatus({ valid: false, message: 'Please enter JSON content to validate.' });
      return;
    }

    try {
      JSON.parse(jsonInput);
      setValidationStatus({ valid: true, message: 'Valid JSON Document!' });
      trackEvent('tool_completed', { tool: 'json-formatter' });
    } catch (err: any) {
      setValidationStatus({ valid: false, message: `JSON Syntax Error: ${err.message}` });
      trackEvent('tool_error', { tool: 'json-formatter' });
    }
  };

  const handleCopy = () => {
    if (!jsonInput) return;
    navigator.clipboard.writeText(jsonInput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    trackEvent('copy_clicked', { tool: 'json-formatter' });
  };

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span>This tool validates and formats JSON locally in your browser. No JSON data is uploaded.</span>
      </div>

      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Indentation:</label>
          <select
            value={indent}
            onChange={(e) => setIndent(parseInt(e.target.value, 10))}
            className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200"
          >
            <option value={2}>2 Spaces</option>
            <option value={4}>4 Spaces</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleFormat}
            disabled={!jsonInput}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 transition-colors cursor-pointer shadow-sm"
          >
            Format JSON
          </button>

          <button
            type="button"
            onClick={handleMinify}
            disabled={!jsonInput}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 disabled:opacity-40 transition-colors cursor-pointer"
          >
            Minify
          </button>

          <button
            type="button"
            onClick={handleValidate}
            disabled={!jsonInput}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 transition-colors cursor-pointer shadow-sm"
          >
            Validate
          </button>

          <button
            type="button"
            onClick={() => {
              setJsonInput('');
              setValidationStatus(null);
            }}
            disabled={!jsonInput}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-red-500 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Validation Banner */}
      {validationStatus && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-2 text-xs font-bold ${
            validationStatus.valid
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
          }`}
        >
          {validationStatus.valid ? (
            <FileCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          )}
          <span>{validationStatus.message}</span>
        </div>
      )}

      {/* Code Editor Textarea */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Code className="w-4 h-4 text-blue-600" />
            JSON Content
          </label>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!jsonInput}
            className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 transition-colors flex items-center gap-1 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy JSON'}</span>
          </button>
        </div>

        <textarea
          rows={14}
          value={jsonInput}
          onChange={(e) => {
            setJsonInput(e.target.value);
            setValidationStatus(null);
          }}
          placeholder='{"key": "value", "numbers": [1, 2, 3]}'
          className="w-full p-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-900 text-emerald-400 font-mono text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all leading-relaxed"
        />
      </div>
    </div>
  );
};
