import React, { useState, useMemo } from 'react';
import { trackEvent } from '../../../lib/analytics';
import {
  ArrowRightLeft,
  Copy,
  Check,
  Download,
  RotateCcw,
  FileSpreadsheet,
  FileCode,
  Table,
  Upload,
} from 'lucide-react';

export const CsvJsonConverterWidget: React.FC = () => {
  const [mode, setMode] = useState<'csv-to-json' | 'json-to-csv'>('csv-to-json');
  const [delimiter, setDelimiter] = useState<string>(',');
  const [indent, setIndent] = useState<number>(2);

  const defaultCsv = `id,name,role,country,salary\n1,Alex Johnson,Lead Architect,USA,145000\n2,Priya Sharma,Full Stack Dev,India,95000\n3,Kenji Sato,UI/UX Designer,Japan,88000\n4,Elena Rostova,Data Scientist,Germany,112000`;
  const [inputContent, setInputContent] = useState<string>(defaultCsv);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Conversion logic
  const { convertedOutput, tableData } = useMemo(() => {
    setErrorMsg(null);
    if (!inputContent.trim()) return { convertedOutput: '', tableData: null };

    if (mode === 'csv-to-json') {
      try {
        const lines = inputContent.trim().split(/\r\n|\n/);
        if (lines.length === 0) return { convertedOutput: '[]', tableData: null };

        const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/^["']|["']$/g, ''));
        const rows: any[] = [];

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const currentline = lines[i].split(delimiter).map((val) => val.trim().replace(/^["']|["']$/g, ''));
          const obj: Record<string, any> = {};

          headers.forEach((header, index) => {
            let val: any = currentline[index] ?? '';
            // Auto parse numbers and booleans
            if (!isNaN(Number(val)) && val !== '') {
              val = Number(val);
            } else if (typeof val === 'string' && val.toLowerCase() === 'true') {
              val = true;
            } else if (typeof val === 'string' && val.toLowerCase() === 'false') {
              val = false;
            }
            obj[header] = val;
          });
          rows.push(obj);
        }

        const jsonStr = JSON.stringify(rows, null, indent);
        return {
          convertedOutput: jsonStr,
          tableData: { headers, rows },
        };
      } catch (err: any) {
        setErrorMsg('Failed to parse CSV. Please check formatting and delimiters.');
        return { convertedOutput: '', tableData: null };
      }
    } else {
      // JSON to CSV
      try {
        const parsed = JSON.parse(inputContent);
        const arrayData = Array.isArray(parsed) ? parsed : [parsed];
        if (arrayData.length === 0) return { convertedOutput: '', tableData: null };

        const headers = Object.keys(arrayData[0]);
        const csvRows = [headers.join(delimiter)];

        arrayData.forEach((row) => {
          const values = headers.map((header) => {
            const val = row[header] !== undefined ? String(row[header]) : '';
            // Wrap in quotes if contains delimiter or newline
            if (val.includes(delimiter) || val.includes('\n') || val.includes('"')) {
              return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
          });
          csvRows.push(values.join(delimiter));
        });

        const csvResult = csvRows.join('\n');
        return {
          convertedOutput: csvResult,
          tableData: { headers, rows: arrayData },
        };
      } catch (err: any) {
        setErrorMsg('Invalid JSON format. Please provide valid JSON array of objects.');
        return { convertedOutput: '', tableData: null };
      }
    }
  }, [inputContent, mode, delimiter, indent]);

  const handleSwapMode = () => {
    if (convertedOutput && !errorMsg) {
      setInputContent(convertedOutput);
    }
    setMode(mode === 'csv-to-json' ? 'json-to-csv' : 'csv-to-json');
  };

  const handleCopy = () => {
    if (!convertedOutput) return;
    navigator.clipboard.writeText(convertedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    trackEvent('copy_clicked', { tool: 'csv-json-converter' });
  };

  const handleDownload = () => {
    if (!convertedOutput) return;
    const blob = new Blob([convertedOutput], {
      type: mode === 'csv-to-json' ? 'application/json' : 'text/csv',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted-${Date.now()}.${mode === 'csv-to-json' ? 'json' : 'csv'}`;
    a.click();
    URL.revokeObjectURL(url);
    trackEvent('download_clicked', { tool: 'csv-json-converter' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setInputContent(reader.result as string);
        if (file.name.endsWith('.json')) setMode('json-to-csv');
        if (file.name.endsWith('.csv')) setMode('csv-to-json');
        trackEvent('tool_started', { tool: 'csv-json-converter' });
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Mode Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setMode('csv-to-json')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === 'csv-to-json'
                ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            CSV ➔ JSON
          </button>
          <button
            type="button"
            onClick={() => setMode('json-to-csv')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === 'json-to-csv'
                ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            JSON ➔ CSV
          </button>
        </div>

        {/* Delimiter / Indent Settings */}
        <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
          <label className="flex items-center gap-1.5">
            <span>Delimiter:</span>
            <select
              value={delimiter}
              onChange={(e) => setDelimiter(e.target.value)}
              className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer"
            >
              <option value=",">Comma (,)</option>
              <option value=";">Semicolon (;)</option>
              <option value="&#9;">Tab (\t)</option>
              <option value="|">Pipe (|)</option>
            </select>
          </label>

          {mode === 'csv-to-json' && (
            <label className="flex items-center gap-1.5">
              <span>Indent:</span>
              <select
                value={indent}
                onChange={(e) => setIndent(Number(e.target.value))}
                className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer"
              >
                <option value={2}>2 Spaces</option>
                <option value={4}>4 Spaces</option>
                <option value={0}>Minified</option>
              </select>
            </label>
          )}

          <label className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-50 cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-purple-600" />
            <span>Upload File</span>
            <input type="file" accept=".csv,.json,.txt" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Split Input & Output Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Pane */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {mode === 'csv-to-json' ? 'Input CSV Content' : 'Input JSON Content'}
              </span>
              <button
                type="button"
                onClick={() => setInputContent('')}
                className="text-xs font-bold text-slate-400 hover:text-red-500 cursor-pointer"
              >
                Clear
              </button>
            </div>
            <textarea
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              placeholder={mode === 'csv-to-json' ? 'Paste CSV lines...' : 'Paste JSON array...'}
              rows={12}
              className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div className="text-xs text-slate-400">
            {inputContent.length.toLocaleString()} characters
          </div>
        </div>

        {/* Output Pane */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                {mode === 'csv-to-json' ? 'Output JSON' : 'Output CSV'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!convertedOutput}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-purple-600 flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={!convertedOutput}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-purple-600 text-white hover:bg-purple-500 flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
              </div>
            </div>

            {errorMsg ? (
              <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-medium">
                ⚠️ {errorMsg}
              </div>
            ) : (
              <textarea
                readOnly
                value={convertedOutput}
                rows={12}
                className="w-full p-4 rounded-2xl bg-purple-50/30 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/60 font-mono text-xs text-purple-900 dark:text-purple-200 focus:outline-none"
              />
            )}
          </div>

          <div className="text-xs text-slate-400">
            {convertedOutput.length.toLocaleString()} characters converted
          </div>
        </div>
      </div>

      {/* Live Tabular Data Preview Table */}
      {tableData && tableData.rows.length > 0 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Table className="w-4 h-4 text-purple-600" />
            Live Data Table Preview ({tableData.rows.length} records)
          </h4>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase">
                  {tableData.headers.map((h, i) => (
                    <th key={i} className="pb-3 px-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tableData.rows.slice(0, 10).map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    {tableData.headers.map((h, colIdx) => (
                      <td key={colIdx} className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                        {String(row[h] ?? '')}
                      </td>
                    ))}
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
