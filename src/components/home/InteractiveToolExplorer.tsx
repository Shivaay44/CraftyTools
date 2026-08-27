import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Star,
  Sparkles,
  ArrowRight,
  Flame,
  Clock,
  Image as ImageIcon,
  FileText,
  Video,
  Type,
  Code,
  Calculator,
  X
} from 'lucide-react';
import type { ToolDefinition, ToolCategory, CategoryInfo } from '../../types';

import { matchToolsByQuery } from '../../data/tools';

interface InteractiveToolExplorerProps {
  categories: CategoryInfo[];
  tools: ToolDefinition[];
  limit?: number;
  showExploreAllButton?: boolean;
}

export const InteractiveToolExplorer: React.FC<InteractiveToolExplorerProps> = ({
  categories,
  tools,
  limit,
  showExploreAllButton = false,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'popular' | 'starred' | 'recent'>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'name-asc' | 'category'>('popular');
  const [starredSlugs, setStarredSlugs] = useState<string[]>([]);
  const [recentSlugs, setRecentSlugs] = useState<string[]>([]);
  const explorerRef = useRef<HTMLDivElement>(null);

  // Sync with URL hash (e.g. #image, #pdf, #video, #text, #developer, #calculator, #favorites, #recent)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (['image', 'pdf', 'video', 'text', 'developer', 'calculator'].includes(hash)) {
        setSelectedCategory(hash);
        setActiveFilter('all');
        const targetElement = document.getElementById(hash);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth' });
        } else if (explorerRef.current) {
          explorerRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      } else if (hash === 'favorites' || hash === 'starred') {
        setSelectedCategory('all');
        setActiveFilter('starred');
        explorerRef.current?.scrollIntoView({ behavior: 'smooth' });
      } else if (hash === 'recent' || hash === 'recents') {
        setSelectedCategory('all');
        setActiveFilter('recent');
        explorerRef.current?.scrollIntoView({ behavior: 'smooth' });
      } else if (hash === '' || hash === 'all') {
        setSelectedCategory('all');
      }
    };

    // Run on initial mount
    handleHashChange();

    // Listen for navbar clicks & back/forward navigation
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Load Starred and Recent tools from LocalStorage on mount
  useEffect(() => {
    try {
      const savedStars = localStorage.getItem('freetools_starred_tools') || localStorage.getItem('craftytool_starred_tools') || localStorage.getItem('toolchemy_starred_tools');
      if (savedStars) setStarredSlugs(JSON.parse(savedStars));

      const savedRecents = localStorage.getItem('freetools_recent_tools') || localStorage.getItem('craftytool_recent_tools') || localStorage.getItem('toolchemy_recent_tools');
      if (savedRecents) setRecentSlugs(JSON.parse(savedRecents));
    } catch (e) {
      console.warn('LocalStorage access error:', e);
    }
  }, []);

  // Toggle Star / Favorite
  const toggleStar = (e: React.MouseEvent, slug: string) => {
    e.preventDefault();
    e.stopPropagation();
    setStarredSlugs((prev) => {
      const updated = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug];
      try {
        localStorage.setItem('freetools_starred_tools', JSON.stringify(updated));
      } catch (err) {
        console.warn('LocalStorage save error:', err);
      }
      return updated;
    });
  };

  // Record Recent Tool
  const handleToolClick = (slug: string) => {
    try {
      const updated = [slug, ...recentSlugs.filter((s) => s !== slug)].slice(0, 8);
      localStorage.setItem('freetools_recent_tools', JSON.stringify(updated));
      setRecentSlugs(updated);
    } catch (err) {
      console.warn('LocalStorage save error:', err);
    }
  };

  // Popular slugs highlight
  const popularSlugs = useMemo(
    () => [
      'age-calculator',
      'bmi-calculator',
      'loan-emi-calculator',
      'youtube-thumbnail-downloader',
      'screen-recorder',
      'signature-maker',
      'unit-converter',
      'percentage-calculator',
      'image-cropper',
      'image-upscaler',
      'image-compressor',
      'merge-pdf',
      'pdf-page-numberer',
      'video-frame-increaser',
      'css-glassmorphism-generator',
      'regex-tester',
      'json-formatter',
      'timestamp-converter',
      'password-generator',
      'exif-remover',
    ],
    []
  );

  // Filtered Tools Computation with Semantic Match
  const filteredTools = useMemo(() => {
    let list = tools;

    // Filter by Category
    if (selectedCategory !== 'all') {
      list = list.filter((t) => t.category === selectedCategory);
    }

    // Filter by Active Filter Tag
    if (activeFilter === 'popular') {
      list = list.filter((t) => popularSlugs.includes(t.slug));
    } else if (activeFilter === 'starred') {
      list = list.filter((t) => starredSlugs.includes(t.slug));
    } else if (activeFilter === 'recent') {
      list = recentSlugs.map((s) => tools.find((t) => t.slug === s)).filter((t): t is ToolDefinition => !!t);
    }

    // Filter by Semantic Search Query
    if (searchQuery.trim()) {
      list = matchToolsByQuery(searchQuery, list);
    }

    // Sort list
    if (sortBy === 'name-asc') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'category') {
      list = [...list].sort((a, b) => a.category.localeCompare(b.category));
    }

    if (limit && limit > 0 && !searchQuery.trim() && selectedCategory === 'all' && activeFilter === 'all') {
      return list.slice(0, limit);
    }

    return list;
  }, [tools, selectedCategory, activeFilter, searchQuery, starredSlugs, recentSlugs, popularSlugs, sortBy, limit]);

  // Starred Tools List
  const starredTools = useMemo(() => {
    return tools.filter((t) => starredSlugs.includes(t.slug));
  }, [tools, starredSlugs]);

  // Recent Tools List
  const recentTools = useMemo(() => {
    return recentSlugs
      .map((s) => tools.find((t) => t.slug === s))
      .filter((t): t is ToolDefinition => !!t);
  }, [tools, recentSlugs]);

  // Spotlight mouse mover
  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  const getCategoryIcon = (catId: string) => {
    switch (catId) {
      case 'image':
        return <ImageIcon className="w-4 h-4 text-pink-500" />;
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
        return <Sparkles className="w-4 h-4 text-purple-500" />;
    }
  };

  // Helper to render a card
  const renderToolCard = (tool: ToolDefinition) => {
    const isStarred = starredSlugs.includes(tool.slug);
    return (
      <a
        key={tool.slug}
        href={`/tools/${tool.slug}`}
        onClick={() => handleToolClick(tool.slug)}
        onMouseMove={handleMouseMove}
        className="spotlight-card p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-400 transition-all flex flex-col justify-between group shadow-xs hover:shadow-xl hover:shadow-purple-500/5 relative"
      >
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                {getCategoryIcon(tool.category)}
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {tool.name}
              </h4>
            </div>

            {/* Star Button */}
            <button
              type="button"
              onClick={(e) => toggleStar(e, tool.slug)}
              className={`p-1.5 rounded-xl transition-all cursor-pointer z-10 ${
                isStarred
                  ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/60'
                  : 'text-slate-300 dark:text-slate-600 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={isStarred ? 'Unstar tool' : 'Star for quick access'}
            >
              <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-500' : ''}`} />
            </button>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
            {tool.description}
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
            Free · Local
          </span>
          <span className="text-xs font-bold text-slate-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors flex items-center gap-1">
            Use Tool <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </span>
        </div>
      </a>
    );
  };

  const isCategorizedSectionView = selectedCategory === 'all' && activeFilter === 'all' && !searchQuery.trim();

  return (
    <div ref={explorerRef} className="space-y-12 scroll-mt-20">
      {/* Dynamic Search & Control Bar */}
      <div className="space-y-6">
        <div className="max-w-2xl mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-indigo-500 to-amber-500 rounded-3xl blur-md opacity-30 group-hover:opacity-60 transition duration-300"></div>
          <div className="relative flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg shadow-purple-500/5 px-4 py-3.5 focus-within:ring-2 focus-within:ring-purple-500 transition-all">
            <Search className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-3 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 55+ browser utilities (e.g. crop, pdf, glassmorphism, timestamp)..."
              className="w-full bg-transparent text-sm sm:text-base font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors mr-2 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shadow-2xs">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Dynamic Category Tabs & Quick Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setActiveFilter('all');
                history.pushState(null, '', '/');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === 'all' && activeFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400'
              }`}
            >
              <span>All Tools</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 font-extrabold text-slate-600 dark:text-slate-300">
                {tools.length}
              </span>
            </button>

            {categories.map((cat) => {
              const count = tools.filter((t) => t.category === cat.id).length;
              const isSelected = selectedCategory === cat.id && activeFilter === 'all';
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setActiveFilter('all');
                    history.pushState(null, '', `/#${cat.id}`);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 font-extrabold text-slate-600 dark:text-slate-300">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Filters: Popular / Favorites */}
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setActiveFilter(activeFilter === 'popular' ? 'all' : 'popular');
                setSelectedCategory('all');
              }}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                activeFilter === 'popular'
                  ? 'bg-amber-500 text-white border-amber-600 shadow-amber-500/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-500'
              }`}
            >
              <Flame className={`w-3.5 h-3.5 ${activeFilter === 'popular' ? 'text-white' : 'text-amber-500'}`} />
              <span>Popular</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveFilter(activeFilter === 'starred' ? 'all' : 'starred');
                setSelectedCategory('all');
              }}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                activeFilter === 'starred'
                  ? 'bg-purple-600 text-white border-purple-700 shadow-purple-600/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-purple-500'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${activeFilter === 'starred' ? 'text-white fill-white' : 'text-purple-500'}`} />
              <span>Favorites{starredSlugs.length > 0 ? ` (${starredSlugs.length})` : ''}</span>
            </button>

            {recentSlugs.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setActiveFilter(activeFilter === 'recent' ? 'all' : 'recent');
                  setSelectedCategory('all');
                }}
                className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                  activeFilter === 'recent'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-blue-600/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-500'
                }`}
              >
                <Clock className={`w-3.5 h-3.5 ${activeFilter === 'recent' ? 'text-white' : 'text-blue-500'}`} />
                <span>Recent ({recentSlugs.length})</span>
              </button>
            )}

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer outline-none shadow-2xs"
            >
              <option value="popular">Sort: Popular</option>
              <option value="name-asc">Sort: A to Z</option>
              <option value="category">Sort: Category</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pinned Starred Section (If User Starred Tools) */}
      {activeFilter !== 'starred' && !searchQuery && starredTools.length > 0 && (
        <section className="space-y-4 p-6 rounded-3xl bg-gradient-to-r from-purple-50/70 via-indigo-50/50 to-pink-50/70 dark:from-purple-950/30 dark:via-indigo-950/20 dark:to-pink-950/30 border border-purple-200/80 dark:border-purple-800/60 shadow-sm animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Your Starred & Pinned Tools</span>
            </h3>
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
              {starredTools.length} Saved
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {starredTools.map((tool) => (
              <a
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                onClick={() => handleToolClick(tool.slug)}
                onMouseMove={handleMouseMove}
                className="spotlight-card p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-purple-100 dark:border-purple-900/60 hover:border-purple-500 transition-all flex items-center justify-between group shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    {getCategoryIcon(tool.category)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {tool.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">
                      {tool.description}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => toggleStar(e, tool.slug)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-amber-500 cursor-pointer ml-2"
                  title="Remove from Starred"
                >
                  <Star className="w-4 h-4 fill-amber-500" />
                </button>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Main Render: Either Structured by Category Sections (with #id anchors) OR Filtered Grid */}
      {isCategorizedSectionView ? (
        <div className="space-y-16">
          {categories.map((cat) => {
            const categoryTools = tools.filter((t) => t.category === cat.id);
            return (
              <section key={cat.id} id={cat.id} className="space-y-6 scroll-mt-24">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      {getCategoryIcon(cat.id)}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                        {cat.name}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {cat.description}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-400">
                    {categoryTools.length} {categoryTools.length === 1 ? 'Tool' : 'Tools'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryTools.map(renderToolCard)}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <section className="space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {searchQuery
                  ? `Search Results for "${searchQuery}"`
                  : activeFilter === 'popular'
                  ? '🔥 Most Popular Utilities'
                  : activeFilter === 'starred'
                  ? '⭐ Your Starred Tools'
                  : categories.find((c) => c.id === selectedCategory)?.name || 'Utilities'}
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-400">
              {filteredTools.length} {filteredTools.length === 1 ? 'Tool' : 'Tools'}
            </span>
          </div>

          {filteredTools.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTools.map(renderToolCard)}
            </div>
          ) : (
            <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center mx-auto text-purple-600 dark:text-purple-400">
                <Search className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                  No tools found
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {activeFilter === 'starred'
                    ? "You haven't starred any tools yet. Click the star ⭐ on any tool card to save it here!"
                    : `No utility matches "${searchQuery}". Try a different keyword.`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setActiveFilter('all');
                  history.pushState(null, '', '/');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-colors cursor-pointer shadow-sm"
              >
                Reset Filters
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
