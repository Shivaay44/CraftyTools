import React, { useState, useMemo } from 'react';
import { trackEvent } from '../../../lib/analytics';
import {
  Copy,
  Check,
  Sparkles,
  Eye,
  Globe,
  Share2,
} from 'lucide-react';

export const MetaTagGeneratorWidget: React.FC = () => {
  const [title, setTitle] = useState<string>('FreeTools — 55+ Free Online In-Browser Utilities');
  const [description, setDescription] = useState<string>(
    'Free online tools for developers, creators, and professionals. Fast, private, client-side browser tools.'
  );
  const [url, setUrl] = useState<string>('https://freetools.vercel.app');
  const [imageUrl, setImageUrl] = useState<string>('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=630&fit=crop');
  const [siteName, setSiteName] = useState<string>('FreeTools');
  const [twitterHandle, setTwitterHandle] = useState<string>('@freetools');
  const [copied, setCopied] = useState<boolean>(false);
  const [activePreview, setActivePreview] = useState<'google' | 'facebook' | 'twitter'>('google');

  // Generated Meta HTML
  const generatedHtml = useMemo(() => {
    return `<!-- Primary Meta Tags -->
<title>${title}</title>
<meta name="title" content="${title}" />
<meta name="description" content="${description}" />

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website" />
<meta property="og:url" content="${url}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:image" content="${imageUrl}" />
<meta property="og:site_name" content="${siteName}" />

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image" />
<meta property="twitter:url" content="${url}" />
<meta property="twitter:title" content="${title}" />
<meta property="twitter:description" content="${description}" />
<meta property="twitter:image" content="${imageUrl}" />
<meta property="twitter:site" content="${twitterHandle}" />`;
  }, [title, description, url, imageUrl, siteName, twitterHandle]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    trackEvent('copy_clicked', { tool: 'meta-tag-generator' });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Inputs Form */}
      <div className="lg:col-span-6 space-y-6">
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Metadata Details
          </h4>

          {/* Title */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-500">Page Title</span>
              <span className={title.length > 60 ? 'text-amber-500' : 'text-slate-400'}>
                {title.length}/60 chars
              </span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-500">Meta Description</span>
              <span className={description.length > 160 ? 'text-amber-500' : 'text-slate-400'}>
                {description.length}/160 chars
              </span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          {/* Canonical URL */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500">Canonical URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          {/* Social Image URL */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500">Social Share Image (OG Image) URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Site Name</label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Twitter Handle</label>
              <input
                type="text"
                value={twitterHandle}
                onChange={(e) => setTwitterHandle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium"
              />
            </div>
          </div>
        </div>

        {/* Generated HTML Code */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Generated Meta HTML
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied HTML!' : 'Copy Tags'}
            </button>
          </div>
          <pre className="p-4 rounded-2xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed max-h-60 scrollbar-thin">
            {generatedHtml}
          </pre>
        </div>
      </div>

      {/* Live Social Previews */}
      <div className="lg:col-span-6 space-y-6">
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Eye className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Live Previews
            </h4>
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
              {(['google', 'facebook', 'twitter'] as const).map((platform) => (
                <button
                  key={platform}
                  type="button"
                  onClick={() => setActivePreview(platform)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                    activePreview === platform
                      ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {platform}
                </button>
              ))}
            </div>
          </div>

          {/* Google Preview */}
          {activePreview === 'google' && (
            <div className="p-5 rounded-2xl bg-white border border-slate-200 text-left space-y-1 font-sans">
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px]">
                  🌐
                </span>
                <div>
                  <div className="font-bold text-slate-800">{siteName}</div>
                  <div className="text-[11px] text-slate-500 truncate max-w-sm">{url}</div>
                </div>
              </div>
              <div className="text-blue-700 text-lg hover:underline cursor-pointer font-medium pt-1">
                {title}
              </div>
              <div className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {description}
              </div>
            </div>
          )}

          {/* Facebook Preview */}
          {activePreview === 'facebook' && (
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-sans shadow-sm">
              <div className="aspect-video bg-slate-100 overflow-hidden">
                <img src={imageUrl} alt="OG Preview" className="w-full h-full object-cover" />
              </div>
              <div className="p-4 space-y-1 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-bold uppercase text-slate-400 truncate">
                  {url.replace(/^https?:\/\//, '')}
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                  {title}
                </div>
                <div className="text-xs text-slate-500 line-clamp-2">{description}</div>
              </div>
            </div>
          )}

          {/* Twitter Preview */}
          {activePreview === 'twitter' && (
            <div className="rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black text-white font-sans shadow-sm">
              <div className="aspect-video bg-slate-900 overflow-hidden">
                <img src={imageUrl} alt="Twitter Preview" className="w-full h-full object-cover" />
              </div>
              <div className="p-4 space-y-1 bg-slate-950 border-t border-slate-800">
                <div className="text-xs text-slate-400">{url.replace(/^https?:\/\//, '')}</div>
                <div className="text-sm font-bold line-clamp-1">{title}</div>
                <div className="text-xs text-slate-400 line-clamp-2">{description}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
