import React, { useState } from 'react';
import { trackEvent } from '../../../lib/analytics';
import {
  ShieldCheck,
  Copy,
  Check,
  Bold,
  Italic,
  List,
  Code,
  Quote,
  Eye,
  FileCode
} from 'lucide-react';

function renderMarkdownToHtml(md: string): string {
  let html = md
    // Escape basic HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

    // Headers
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold my-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold my-3">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-black my-4">$1</h1>')

    // Bold & Italic
    .replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')

    // Code blocks
    .replace(/```([\s\S]*?)```/gim, '<pre class="p-3 my-2 rounded-lg bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto">$1</pre>')
    .replace(/`([^`]+)`/gim, '<code class="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-xs text-rose-500">$1</code>')

    // Blockquotes
    .replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-blue-500 pl-3 my-2 italic text-slate-600 dark:text-slate-400">$1</blockquote>')

    // Lists
    .replace(/^\* (.*$)/gim, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc">$1</li>')

    // Paragraph line breaks
    .replace(/\n\n/gim, '<br/><br/>')
    .replace(/\n/gim, '<br/>');

  return html;
}

const DEFAULT_MARKDOWN = `# Welcome to Crafty Tool Markdown Editor 🚀

**Crafty Tool** provides fast, private, client-side web utility tools.

## Key Highlights
- **100% Client-Side:** Everything runs right inside your browser
- **Ultra-Fast:** Zero server roundtrips
- **Completely Private:** Your files and text never leave your machine

> *"Simplicity is the soul of efficiency."*

\`\`\`typescript
const greeting = "Hello, Developer!";
console.log(greeting);
\`\`\`
`;

export const MarkdownPreviewWidget: React.FC = () => {
  const [markdown, setMarkdown] = useState<string>(DEFAULT_MARKDOWN);
  const [copiedHtml, setCopiedHtml] = useState<boolean>(false);
  const [copiedMd, setCopiedMd] = useState<boolean>(false);

  const htmlOutput = renderMarkdownToHtml(markdown);

  const insertSyntax = (before: string, after: string = '') => {
    const textarea = document.getElementById('md-textarea') as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = markdown.substring(start, end);
    const replacement = `${before}${selected || 'text'}${after}`;

    const newMd = markdown.substring(0, start) + replacement + markdown.substring(end);
    setMarkdown(newMd);
  };

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(htmlOutput);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
    trackEvent('copy_clicked', { tool: 'markdown-previewer', type: 'html' });
  };

  const handleCopyMd = () => {
    navigator.clipboard.writeText(markdown);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
    trackEvent('copy_clicked', { tool: 'markdown-previewer', type: 'markdown' });
  };

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span>100% Client-Side Markdown Editor: Live side-by-side preview with instant HTML conversion.</span>
      </div>

      {/* Editor & Preview Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Markdown Editor */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-blue-500" /> Markdown Input
              </span>
              <button
                type="button"
                onClick={handleCopyMd}
                className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 flex items-center gap-1"
              >
                {copiedMd ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedMd ? 'Copied' : 'Copy MD'}</span>
              </button>
            </div>

            {/* Quick Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              <button
                type="button"
                onClick={() => insertSyntax('**', '**')}
                title="Bold"
                className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-xs"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertSyntax('*', '*')}
                title="Italic"
                className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-xs"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertSyntax('# ', '')}
                title="Heading 1"
                className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-xs font-bold"
              >
                H1
              </button>
              <button
                type="button"
                onClick={() => insertSyntax('## ', '')}
                title="Heading 2"
                className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-xs font-bold"
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => insertSyntax('- ', '')}
                title="Bullet List"
                className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-xs"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertSyntax('`', '`')}
                title="Inline Code"
                className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-xs"
              >
                <Code className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertSyntax('> ', '')}
                title="Quote"
                className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-xs"
              >
                <Quote className="w-3.5 h-3.5" />
              </button>
            </div>

            <textarea
              id="md-textarea"
              rows={14}
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder="Type your markdown here..."
              className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Right: Live Rendered Preview */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-emerald-500" /> Live HTML Preview
              </span>
              <button
                type="button"
                onClick={handleCopyHtml}
                className="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedHtml ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedHtml ? 'Copied HTML!' : 'Copy HTML'}</span>
              </button>
            </div>

            <div
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm leading-relaxed min-h-[380px] max-h-[460px] overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: htmlOutput }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
