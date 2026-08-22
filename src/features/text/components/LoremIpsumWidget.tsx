import React, { useState } from 'react';
import { trackEvent } from '../../../lib/analytics';
import {
  ShieldCheck,
  Copy,
  Check,
  RefreshCw
} from 'lucide-react';

const LOREM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do',
  'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua', 'enim',
  'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi',
  'aliquip', 'ex', 'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit',
  'voluptate', 'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
  'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia', 'deserunt',
  'mollit', 'anim', 'id', 'est', 'laborum', 'placerat', 'vestibulum', 'lectus', 'mauris',
  'ultrices', 'eros', 'in', 'cursus', 'turpis', 'massa', 'tincidunt', 'nunc', 'pulvinar',
  'sapien', 'et', 'ligula', 'ullamcorper', 'malesuada', 'proin', 'libero', 'nunc', 'consequat',
  'interdum', 'varius', 'sit', 'amet', 'mattis', 'vulputate', 'enim', 'nulla', 'aliquet',
  'porttitor', 'lacus', 'luctus', 'accumsan', 'tortor', 'posuere', 'ac', 'ut', 'consequat'
];

function generateSentence(startWithLorem = false): string {
  const len = Math.floor(Math.random() * 10) + 8;
  const words: string[] = [];
  if (startWithLorem) {
    words.push('Lorem', 'ipsum', 'dolor', 'sit', 'amet,');
  }
  while (words.length < len) {
    const w = LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)];
    words.push(w);
  }
  const sentence = words.join(' ');
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.';
}

function generateParagraph(startWithLorem = false): string {
  const sentences = Math.floor(Math.random() * 4) + 4;
  const parts: string[] = [];
  for (let i = 0; i < sentences; i++) {
    parts.push(generateSentence(startWithLorem && i === 0));
  }
  return parts.join(' ');
}

export const LoremIpsumWidget: React.FC = () => {
  const [type, setType] = useState<'paragraphs' | 'sentences' | 'words' | 'lists'>('paragraphs');
  const [count, setCount] = useState<number>(3);
  const [startWithLorem, setStartWithLorem] = useState<boolean>(true);
  const [htmlTags, setHtmlTags] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const generateContent = (): string => {
    if (type === 'paragraphs') {
      const paras: string[] = [];
      for (let i = 0; i < count; i++) {
        const text = generateParagraph(startWithLorem && i === 0);
        paras.push(htmlTags ? `<p>${text}</p>` : text);
      }
      return paras.join(htmlTags ? '\n\n' : '\n\n');
    }

    if (type === 'sentences') {
      const sents: string[] = [];
      for (let i = 0; i < count; i++) {
        sents.push(generateSentence(startWithLorem && i === 0));
      }
      return sents.join(' ');
    }

    if (type === 'words') {
      const words: string[] = [];
      if (startWithLorem) {
        words.push('lorem', 'ipsum', 'dolor', 'sit', 'amet');
      }
      while (words.length < count) {
        words.push(LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)]);
      }
      return words.slice(0, count).join(' ');
    }

    if (type === 'lists') {
      const items: string[] = [];
      for (let i = 0; i < count; i++) {
        const text = generateSentence(startWithLorem && i === 0);
        items.push(htmlTags ? `  <li>${text}</li>` : `• ${text}`);
      }
      return htmlTags ? `<ul>\n${items.join('\n')}\n</ul>` : items.join('\n');
    }

    return '';
  };

  const [output, setOutput] = useState<string>(() => generateContent());

  const handleGenerate = () => {
    setOutput(generateContent());
    trackEvent('tool_completed', { tool: 'lorem-ipsum-generator', type, count });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    trackEvent('copy_clicked', { tool: 'lorem-ipsum-generator' });
  };

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span>100% Client-Side Generator: Instant dummy placeholder text for your mockups and designs.</span>
      </div>

      {/* Settings Bar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Format Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Generate Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="paragraphs">Paragraphs</option>
              <option value="sentences">Sentences</option>
              <option value="words">Words</option>
              <option value="lists">Bullet Lists</option>
            </select>
          </div>

          {/* Count */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Count ({count})
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={count}
              onChange={(e) => setCount(Math.max(1, Number(e.target.value)))}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Toggles */}
          <div className="flex flex-col justify-center space-y-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={startWithLorem}
                onChange={(e) => setStartWithLorem(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 accent-blue-600"
              />
              <span>Start with "Lorem ipsum"</span>
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={htmlTags}
                onChange={(e) => setHtmlTags(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 accent-blue-600"
              />
              <span>Wrap in HTML tags</span>
            </label>
          </div>

          {/* Action */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleGenerate}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Generate Text</span>
            </button>
          </div>
        </div>
      </div>

      {/* Output Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Generated Dummy Text
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Text'}</span>
          </button>
        </div>

        <textarea
          rows={10}
          readOnly
          value={output}
          className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-sm leading-relaxed focus:outline-none font-sans"
        />
      </div>
    </div>
  );
};
