import React, { useState } from 'react';
import { trackEvent } from '../../../lib/analytics';
import {
  Copy,
  Check,
  Sparkles,
  Minimize2,
} from 'lucide-react';

const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN',
  'OUTER JOIN', 'CROSS JOIN', 'JOIN', 'ON', 'GROUP BY', 'HAVING', 'ORDER BY',
  'LIMIT', 'OFFSET', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM',
  'CREATE TABLE', 'DROP TABLE', 'ALTER TABLE', 'ADD COLUMN', 'UNION ALL', 'UNION',
  'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'AS', 'DISTINCT', 'IN', 'NOT IN',
  'EXISTS', 'NOT EXISTS', 'LIKE', 'ILIKE', 'IS NULL', 'IS NOT NULL', 'BETWEEN',
  'ASC', 'DESC', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX'
];

export const SqlFormatterWidget: React.FC = () => {
  const sampleQuery = `select u.id, u.name, u.email, count(o.id) as total_orders, sum(o.amount) as total_spent from users u left join orders o on u.id = o.user_id where u.status = 'active' and u.created_at >= '2025-01-01' group by u.id, u.name, u.email having count(o.id) > 5 order by total_spent desc limit 50;`;

  const [inputSql, setInputSql] = useState<string>(sampleQuery);
  const [keywordCase, setKeywordCase] = useState<'upper' | 'lower'>('upper');
  const [indentSpaces, setIndentSpaces] = useState<number>(2);
  const [copied, setCopied] = useState<boolean>(false);

  // Client-side SQL Beautifier
  const formatSql = (sql: string, uppercase: boolean, indent: number): string => {
    if (!sql.trim()) return '';

    let formatted = sql.trim();

    // Standardize newlines and spaces
    formatted = formatted.replace(/\s+/g, ' ');

    // Match keywords and add appropriate indentation
    const indentStr = ' '.repeat(indent);

    const majorClauses = [
      'SELECT',
      'FROM',
      'WHERE',
      'LEFT JOIN',
      'RIGHT JOIN',
      'INNER JOIN',
      'OUTER JOIN',
      'CROSS JOIN',
      'JOIN',
      'GROUP BY',
      'HAVING',
      'ORDER BY',
      'LIMIT',
      'OFFSET',
      'INSERT INTO',
      'VALUES',
      'UPDATE',
      'SET',
      'DELETE FROM',
      'UNION ALL',
      'UNION',
    ];

    // Regex replace for major clauses to put on newlines
    majorClauses.forEach((clause) => {
      const regex = new RegExp(`\\b${clause}\\b`, 'gi');
      formatted = formatted.replace(regex, (match) => `\n${uppercase ? match.toUpperCase() : match.toLowerCase()}`);
    });

    // Indent sub-clauses like AND, OR, ON
    ['AND', 'OR', 'ON'].forEach((sub) => {
      const regex = new RegExp(`\\b${sub}\\b`, 'gi');
      formatted = formatted.replace(regex, (match) => `\n${indentStr}${uppercase ? match.toUpperCase() : match.toLowerCase()}`);
    });

    // Format all other keywords
    SQL_KEYWORDS.forEach((kw) => {
      const regex = new RegExp(`\\b${kw}\\b`, 'gi');
      formatted = formatted.replace(regex, (match) => (uppercase ? match.toUpperCase() : match.toLowerCase()));
    });

    // Clean up empty lines
    return formatted
      .split('\n')
      .map((line) => line.trimEnd())
      .filter((line, i) => (i === 0 ? line.trim().length > 0 : true))
      .join('\n')
      .trim();
  };

  const handleBeautify = () => {
    const res = formatSql(inputSql, keywordCase === 'upper', indentSpaces);
    setInputSql(res);
    trackEvent('tool_completed', { tool: 'sql-formatter' });
  };

  const handleMinify = () => {
    const minified = inputSql.replace(/\s+/g, ' ').trim();
    setInputSql(minified);
    trackEvent('tool_completed', { tool: 'sql-formatter' });
  };

  const handleCopy = () => {
    if (!inputSql) return;
    navigator.clipboard.writeText(inputSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    trackEvent('copy_clicked', { tool: 'sql-formatter' });
  };

  return (
    <div className="space-y-8">
      {/* Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setKeywordCase('upper')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                keywordCase === 'upper'
                  ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              UPPERCASE
            </button>
            <button
              type="button"
              onClick={() => setKeywordCase('lower')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                keywordCase === 'lower'
                  ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              lowercase
            </button>
          </div>

          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <span>Indent:</span>
            <select
              value={indentSpaces}
              onChange={(e) => setIndentSpaces(Number(e.target.value))}
              className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer"
            >
              <option value={2}>2 Spaces</option>
              <option value={4}>4 Spaces</option>
            </select>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleMinify}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            Minify
          </button>
          <button
            type="button"
            onClick={handleBeautify}
            className="px-5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-500/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Format SQL
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:text-purple-600 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* SQL Editor Area */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <textarea
          value={inputSql}
          onChange={(e) => setInputSql(e.target.value)}
          rows={14}
          placeholder="Paste or write your SQL queries here..."
          className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none leading-relaxed"
        />
      </div>
    </div>
  );
};
