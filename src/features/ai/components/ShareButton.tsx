import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { trackEvent } from '../../../lib/analytics';

interface ShareButtonProps {
  title: string;
  text: string;
  toolSlug?: string;
  className?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ title, text, toolSlug, className = '' }) => {
  const [shared, setShared] = useState(false);

  const handleShare = async () => {
    if (toolSlug) {
      trackEvent('share_clicked', { tool: toolSlug });
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url: window.location.href,
        });
        return;
      } catch (err) {
        // User cancelled or share failed, fallback to copy
      }
    }

    try {
      await navigator.clipboard.writeText(`${title}\n\n${text}\n\nVia FreeTools: ${window.location.href}`);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch (err) {
      console.error('Share fallback copy failed', err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer ${className}`}
      aria-label="Share result"
    >
      {shared ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-500" />
          <span>Link Copied!</span>
        </>
      ) : (
        <>
          <Share2 className="w-3.5 h-3.5" />
          <span>Share</span>
        </>
      )}
    </button>
  );
};
