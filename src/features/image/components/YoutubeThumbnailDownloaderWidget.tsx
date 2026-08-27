import React, { useState, useMemo } from 'react';
import { trackEvent } from '../../../lib/analytics';
import {
  Download,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
  Video,
} from 'lucide-react';

interface ThumbnailQuality {
  id: string;
  name: string;
  resolution: string;
  filename: string;
}

const QUALITIES: ThumbnailQuality[] = [
  { id: 'maxresdefault', name: 'High Definition (HD)', resolution: '1280 × 720', filename: 'maxresdefault.jpg' },
  { id: 'sddefault', name: 'Standard Definition (SD)', resolution: '640 × 480', filename: 'sddefault.jpg' },
  { id: 'hqdefault', name: 'High Quality (HQ)', resolution: '480 × 360', filename: 'hqdefault.jpg' },
  { id: 'mqdefault', name: 'Medium Quality (MQ)', resolution: '320 × 180', filename: 'mqdefault.jpg' },
];

export const YoutubeThumbnailDownloaderWidget: React.FC = () => {
  const [urlInput, setUrlInput] = useState<string>('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Extract YouTube Video ID
  const videoId = useMemo(() => {
    if (!urlInput.trim()) return null;
    const str = urlInput.trim();

    // Regex for various youtube url formats
    const match = str.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
    );
    if (match && match[1]) {
      return match[1];
    }
    // If user pasted raw 11-char ID
    if (/^[\w-]{11}$/.test(str)) {
      return str;
    }
    return null;
  }, [urlInput]);

  const handleCopyUrl = (qualityFile: string, qualityId: string) => {
    if (!videoId) return;
    const fullUrl = `https://img.youtube.com/vi/${videoId}/${qualityFile}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(qualityId);
    setTimeout(() => setCopiedId(null), 2000);
    trackEvent('copy_clicked', { tool: 'youtube-thumbnail-downloader' });
  };

  const handleDownload = async (qualityFile: string, qualityId: string) => {
    if (!videoId) return;
    setDownloadingId(qualityId);
    try {
      const imgUrl = `https://img.youtube.com/vi/${videoId}/${qualityFile}`;
      const response = await fetch(imgUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `youtube-thumbnail-${videoId}-${qualityId}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      trackEvent('download_clicked', { tool: 'youtube-thumbnail-downloader' });
    } catch (e) {
      // Fallback: Open in new tab if CORS restricts direct blob
      window.open(`https://img.youtube.com/vi/${videoId}/${qualityFile}`, '_blank');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Search / Input Box */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Enter YouTube Video or Shorts URL
        </label>
        <div className="relative flex items-center">
          <div className="absolute left-4 text-red-500">
            <Video className="w-6 h-6" />
          </div>
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
            className="w-full pl-13 pr-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-red-500 focus:outline-none transition-all"
          />
        </div>

        {/* Quick Sample Links */}
        <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
          <span className="text-slate-400 font-medium">Try Sample:</span>
          <button
            type="button"
            onClick={() => setUrlInput('https://www.youtube.com/watch?v=dQw4w9WgXcQ')}
            className="text-purple-600 dark:text-purple-400 hover:underline font-semibold cursor-pointer"
          >
            Music Video
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => setUrlInput('https://www.youtube.com/shorts/3f5G_wBwKqg')}
            className="text-purple-600 dark:text-purple-400 hover:underline font-semibold cursor-pointer"
          >
            YouTube Shorts
          </button>
        </div>
      </div>

      {/* Thumbnails Display Grid */}
      {videoId ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Available High-Resolution Thumbnails (Video ID: <span className="font-mono text-purple-600 dark:text-purple-400">{videoId}</span>)
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {QUALITIES.map((q) => {
              const imgUrl = `https://img.youtube.com/vi/${videoId}/${q.filename}`;
              const isCopied = copiedId === q.id;
              const isDownloading = downloadingId === q.id;

              return (
                <div
                  key={q.id}
                  className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 group hover:border-red-400/50 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white block">
                          {q.name}
                        </span>
                        <span className="text-xs text-slate-400 font-semibold">{q.resolution}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(q.filename, q.id)}
                        className="text-xs font-bold text-slate-500 hover:text-purple-600 flex items-center gap-1 cursor-pointer"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {isCopied ? 'Copied' : 'Copy Link'}
                      </button>
                    </div>

                    {/* Image Preview Box */}
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                      <img
                        src={imgUrl}
                        alt={`YouTube Thumbnail ${q.name}`}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          // If maxres doesn't exist for low-res video, fallback gracefully
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </div>

                  {/* Download Button */}
                  <button
                    type="button"
                    onClick={() => handleDownload(q.filename, q.id)}
                    disabled={isDownloading}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-red-500/20 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    {isDownloading ? 'Downloading...' : `Download ${q.name}`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-center space-y-2">
          <AlertCircle className="w-6 h-6 mx-auto text-amber-500" />
          <p className="text-sm font-semibold">
            Please paste a valid YouTube video or shorts link above to preview and download thumbnails.
          </p>
        </div>
      )}
    </div>
  );
};
