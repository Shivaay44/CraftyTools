import React, { useState, useMemo } from 'react';
import { trackEvent } from '../../../lib/analytics';
import {
  ShieldCheck,
  AlertCircle,
  BookOpen,
} from 'lucide-react';

interface RegexPreset {
  name: string;
  pattern: string;
  flags: string;
  description: string;
  sample: string;
}

const PRESETS: RegexPreset[] = [
  {
    name: 'Email Address',
    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
    flags: 'gm',
    description: 'Validate standard email format with username, domain, and TLD.',
    sample: 'hello@freetools.com\ninvalid-email@\ntest.user+tag@domain.co.uk',
  },
  {
    name: 'URL / Web Link',
    pattern: 'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)',
    flags: 'gi',
    description: 'Matches valid HTTP/HTTPS URLs with subdomains, query params, and anchors.',
    sample: 'Visit https://freetools.vercel.app/tools/json-formatter?ref=home or http://example.org/path#section for details.',
  },
  {
    name: 'IPv4 Address',
    pattern: '\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b',
    flags: 'g',
    description: 'Matches valid IPv4 addresses (0.0.0.0 to 255.255.255.255).',
    sample: 'Server 1: 192.168.1.1\nInvalid IP: 999.10.20.30\nDNS: 8.8.8.8 and 1.1.1.1',
  },
  {
    name: 'Hex Color Codes',
    pattern: '#(?:[0-9a-fA-F]{3}){1,2}\\b',
    flags: 'gi',
    description: 'Matches 3-digit and 6-digit CSS hex color codes.',
    sample: 'Brand colors: #3B82F6, #FFF, #0f172a, and accent #8B5CF6.',
  },
  {
    name: 'ISO 8601 Date',
    pattern: '\\b\\d{4}-\\d{2}-\\d{2}\\b',
    flags: 'g',
    description: 'Matches dates in YYYY-MM-DD format.',
    sample: 'Release date: 2026-08-22 (Next cycle: 2026-12-31).',
  },
];

export const RegexTesterWidget: React.FC = () => {
  const [pattern, setPattern] = useState<string>(PRESETS[0].pattern);
  const [flags, setFlags] = useState<{ [key: string]: boolean }>({
    g: true,
    i: false,
    m: true,
    s: false,
    u: false,
  });
  const [testText, setTestText] = useState<string>(PRESETS[0].sample);
  const [replacePattern, setReplacePattern] = useState<string>('[$&]');
  const [activeTab, setActiveTab] = useState<'matches' | 'replace'>('matches');

  const activeFlagsString = Object.keys(flags)
    .filter((k) => flags[k])
    .join('');

  const toggleFlag = (flag: string) => {
    setFlags((prev) => ({ ...prev, [flag]: !prev[flag] }));
  };

  const { regexError, matchResults, replacedText } = useMemo(() => {
    if (!pattern) {
      return { regexError: null, matchResults: [], replacedText: testText };
    }

    try {
      const reg = new RegExp(pattern, activeFlagsString);
      const matches: Array<{ text: string; index: number; groups?: string[] }> = [];

      if (flags.g) {
        let match: RegExpExecArray | null;
        let count = 0;
        while ((match = reg.exec(testText)) !== null && count < 500) {
          matches.push({
            text: match[0],
            index: match.index,
            groups: match.slice(1),
          });
          if (match.index === reg.lastIndex) {
            reg.lastIndex++;
          }
          count++;
        }
      } else {
        const match = reg.exec(testText);
        if (match) {
          matches.push({
            text: match[0],
            index: match.index,
            groups: match.slice(1),
          });
        }
      }

      let replaced = '';
      try {
        const replaceReg = new RegExp(pattern, activeFlagsString);
        replaced = testText.replace(replaceReg, replacePattern);
      } catch {
        replaced = testText;
      }

      return { regexError: null, matchResults: matches, replacedText: replaced };
    } catch (err: any) {
      return { regexError: err.message, matchResults: [], replacedText: testText };
    }
  }, [pattern, activeFlagsString, testText, replacePattern, flags.g]);

  const loadPreset = (p: RegexPreset) => {
    setPattern(p.pattern);
    setTestText(p.sample);
    const newFlags = { g: false, i: false, m: false, s: false, u: false };
    p.flags.split('').forEach((f) => {
      (newFlags as any)[f] = true;
    });
    setFlags(newFlags);
    trackEvent('tool_started', { tool: 'regex-tester', preset: p.name });
  };

  return (
    <div className="space-y-6">
      {/* Privacy Guarantee */}
      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span>100% In-Browser RegExp Engine: Expressions and test data are evaluated locally in your browser JS engine.</span>
      </div>

      {/* Preset Cheatsheet Pills */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-blue-600" />
          Common Pattern Presets
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => loadPreset(p)}
              className="py-1.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer transition-all shadow-2xs"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Regex Expression Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-mono text-lg font-black">/</span>
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="Enter regular expression..."
            className="flex-1 bg-transparent text-emerald-400 font-mono font-bold text-sm outline-none placeholder:text-slate-600"
          />
          <span className="text-slate-500 font-mono text-lg font-black">/</span>
          <span className="text-amber-400 font-mono font-bold text-sm min-w-[30px]">
            {activeFlagsString}
          </span>
        </div>

        {/* Flag Toggles */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800 text-xs">
          <span className="text-slate-400 text-[11px] font-bold mr-1">Flags:</span>
          {[
            { id: 'g', label: 'g (Global)' },
            { id: 'i', label: 'i (Insensitive)' },
            { id: 'm', label: 'm (Multiline)' },
            { id: 's', label: 's (DotAll)' },
            { id: 'u', label: 'u (Unicode)' },
          ].map((flag) => (
            <button
              key={flag.id}
              type="button"
              onClick={() => toggleFlag(flag.id)}
              className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs cursor-pointer transition-colors ${
                flags[flag.id]
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {flag.label}
            </button>
          ))}
        </div>
      </div>

      {regexError && (
        <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>Regex Syntax Error: {regexError}</span>
        </div>
      )}

      {/* Test String & Output Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test String Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Test String</span>
            <span className="text-slate-400">{testText.length} characters</span>
          </label>
          <textarea
            rows={10}
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            placeholder="Type or paste text to test pattern against..."
            className="w-full p-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed resize-y"
          />
        </div>

        {/* Matches / Substitution Tabs */}
        <div className="space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('matches')}
                className={`py-1 px-3 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  activeTab === 'matches'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                Match Results ({matchResults.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('replace')}
                className={`py-1 px-3 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  activeTab === 'replace'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                Replace / Substitution
              </button>
            </div>
          </div>

          {activeTab === 'matches' ? (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 min-h-[220px] max-h-[280px] overflow-y-auto space-y-2 text-xs">
              {matchResults.length === 0 ? (
                <div className="text-slate-400 text-center py-10">
                  {regexError ? 'Fix syntax error above' : 'No matches found in test string.'}
                </div>
              ) : (
                matchResults.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1"
                  >
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                      <span>Match #{idx + 1}</span>
                      <span>Index: {m.index}</span>
                    </div>
                    <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded-md">
                      {m.text}
                    </div>
                    {m.groups && m.groups.length > 0 && (
                      <div className="pl-2 border-l-2 border-slate-300 dark:border-slate-600 space-y-0.5 mt-1 text-[11px] text-slate-600 dark:text-slate-300 font-mono">
                        {m.groups.map((g, gIdx) => (
                          <div key={gIdx}>
                            Group {gIdx + 1}: <span className="text-blue-500 font-bold">{g}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Substitution Replacement Pattern
                </label>
                <input
                  type="text"
                  value={replacePattern}
                  onChange={(e) => setReplacePattern(e.target.value)}
                  placeholder="e.g. [$1] or REPLACED"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-xs outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Replaced Output Preview
                </label>
                <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto min-h-[140px] max-h-[180px] border border-slate-800 whitespace-pre-wrap">
                  {replacedText}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
