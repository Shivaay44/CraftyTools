import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ArrowRight, X, Sparkles, Image, FileText, Video, Type, Code, Clock, Flame, Calculator } from 'lucide-react';
import { TOOLS, CATEGORIES } from '../../data/tools';
import type { ToolDefinition } from '../../types';

const POPULAR_SLUGS = [
  'image-compressor',
  'image-upscaler',
  'merge-pdf',
  'json-formatter',
  'regex-tester',
  'qr-code-generator',
  'age-calculator',
  'youtube-thumbnail-downloader',
];

import { matchToolsByQuery } from '../../data/tools';

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSlugs, setRecentSlugs] = useState<string[]>([]);
  const [starredSlugs, setStarredSlugs] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Load Recent & Starred tools from LocalStorage on open
  useEffect(() => {
    if (isOpen) {
      try {
        const savedRecents = localStorage.getItem('freetools_recent_tools') || localStorage.getItem('craftytool_recent_tools');
        if (savedRecents) setRecentSlugs(JSON.parse(savedRecents));

        const savedStars = localStorage.getItem('freetools_starred_tools') || localStorage.getItem('craftytool_starred_tools');
        if (savedStars) setStarredSlugs(JSON.parse(savedStars));
      } catch (e) {
        console.warn('LocalStorage error:', e);
      }
    }
  }, [isOpen]);

  // Toggle modal on Ctrl+K / Cmd+K / Slash key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setIsOpen(true);
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
    }
  }, [isOpen]);

  // Record tool click to recents
  const handleSelectTool = (tool: ToolDefinition) => {
    try {
      const updated = [tool.slug, ...recentSlugs.filter((s) => s !== tool.slug)].slice(0, 8);
      localStorage.setItem('freetools_recent_tools', JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
    setIsOpen(false);
    window.location.href = `/tools/${tool.slug}`;
  };

  // Grouped or filtered tools computation
  const { filteredTools, isDefaultView, recentTools, popularTools } = useMemo(() => {
    if (!query.trim()) {
      const recents = recentSlugs
        .map((s) => TOOLS.find((t) => t.slug === s))
        .filter((t): t is ToolDefinition => !!t)
        .slice(0, 4);

      const starred = starredSlugs
        .filter((s) => !recentSlugs.includes(s))
        .map((s) => TOOLS.find((t) => t.slug === s))
        .filter((t): t is ToolDefinition => !!t);

      const popular = POPULAR_SLUGS
        .filter((s) => !recentSlugs.includes(s) && !starredSlugs.includes(s))
        .map((s) => TOOLS.find((t) => t.slug === s))
        .filter((t): t is ToolDefinition => !!t)
        .slice(0, 6);

      const combined = [...starred, ...recents, ...popular];
      return {
        filteredTools: combined.length > 0 ? combined : TOOLS.slice(0, 8),
        isDefaultView: true,
        recentTools: recents,
        popularTools: popular,
      };
    }

    const matches = matchToolsByQuery(query, TOOLS).slice(0, 10);

    return {
      filteredTools: matches,
      isDefaultView: false,
      recentTools: [],
      popularTools: [],
    };
  }, [query, recentSlugs, starredSlugs]);

  // Reset selected index on query change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle arrow navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < filteredTools.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredTools.length - 1));
    } else if (e.key === 'Enter' && filteredTools[selectedIndex]) {
      e.preventDefault();
      handleSelectTool(filteredTools[selectedIndex]);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'image':
        return <Image className="w-4 h-4 text-pink-500" />;
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-500" />;
      case 'video':
        return <Video className="w-4 h-4 text-indigo-500" />;
      case 'text':
        return <Type className="w-4 h-4 text-amber-500" />;
      case 'developer':
        return <Code className="w-4 h-4 text-emerald-500" />;
      case 'calculator':
        return <Calculator className="w-4 h-4 text-cyan-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <>
      {/* Quick Search Button in Navbar */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 hover:border-purple-500 dark:hover:border-purple-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-2xs group"
        aria-label="Quick search tools"
      >
        <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-500 transition-colors" />
        <span className="hidden sm:inline font-medium">Search 55+ tools...</span>
        <span className="sm:hidden font-medium">Search</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-400 shadow-2xs">
          ⌘K
        </kbd>
      </button>

      {/* Modal Backdrop & Palette */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 md:p-20 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-150">
          <div
            className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
              <Search className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search 55+ utilities by name, category, or task (e.g. crop, pdf, fps, jwt)..."
                className="w-full bg-transparent text-sm sm:text-base font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-400 border border-slate-200 dark:border-slate-700">
                  ESC
                </kbd>
              )}
            </div>

            {/* Quick Category Chips */}
            <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-1.5 overflow-x-auto text-[11px] bg-slate-50/50 dark:bg-slate-950/40">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] mr-1">
                Filter:
              </span>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setQuery(cat.name.toLowerCase().replace(' tools', ''))}
                  className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-purple-500 dark:hover:border-purple-400 transition-colors flex-shrink-0 cursor-pointer"
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Tool List Results */}
            <div ref={listRef} className="overflow-y-auto p-2 space-y-1">
              {filteredTools.length > 0 ? (
                <>
                  {isDefaultView && recentTools.length > 0 && (
                    <div className="px-3 pt-2 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-purple-500" />
                      <span>Recently Used</span>
                    </div>
                  )}

                  {filteredTools.map((tool, idx) => {
                    const isSelected = idx === selectedIndex;
                    const isFirstPopular = isDefaultView && recentTools.length > 0 && idx === recentTools.length;

                    return (
                      <React.Fragment key={tool.slug}>
                        {isFirstPopular && (
                          <div className="px-3 pt-3 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-t border-slate-100 dark:border-slate-800/60 mt-1">
                            <Flame className="w-3 h-3 text-amber-500" />
                            <span>Popular Tools</span>
                          </div>
                        )}
                        <div
                          onMouseEnter={() => setSelectedIndex(idx)}
                          onClick={() => handleSelectTool(tool)}
                          className={`flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer select-none ${
                            isSelected
                              ? 'bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 shadow-2xs'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                isSelected
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {getCategoryIcon(tool.category)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                  {tool.name}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                  {tool.category}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md">
                                {tool.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 hidden sm:inline-block">
                              Free · Local
                            </span>
                            <ArrowRight
                              className={`w-4 h-4 transition-transform ${
                                isSelected
                                  ? 'text-purple-600 dark:text-purple-400 translate-x-0.5'
                                  : 'text-slate-300 dark:text-slate-600'
                              }`}
                            />
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </>
              ) : (
                <div className="p-8 text-center space-y-2">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    No tools found matching "{query}"
                  </p>
                  <p className="text-xs text-slate-400">
                    Try searching for keywords like "resize", "pdf", "code", or "timer"
                  </p>
                </div>
              )}
            </div>

            {/* Footer Shortcuts Info */}
            <div className="p-3 px-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-400 text-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">
                    ↑↓
                  </kbd>{' '}
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">
                    ↵
                  </kbd>{' '}
                  Open
                </span>
              </div>
              <span className="font-semibold text-purple-600 dark:text-purple-400">
                55+ 100% In-Browser Utilities
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
