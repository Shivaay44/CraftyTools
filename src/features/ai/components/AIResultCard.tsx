import React from 'react';
import { CopyButton } from './CopyButton';
import { ShareButton } from './ShareButton';
import { RefreshCw } from 'lucide-react';

interface AIResultCardProps {
  toolSlug: string;
  data: any; // Safely inspected below
  onRegenerate: () => void;
}

export const AIResultCard: React.FC<AIResultCardProps> = ({ toolSlug, data, onRegenerate }) => {
  if (!data) return null;

  // Function to extract text for main copy button
  const getRawCopyText = (): string => {
    if (typeof data === 'string') return data;
    if (data.rawText) return data.rawText;
    return JSON.stringify(data, null, 2);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          ✨ Generated Result
        </h3>
        <div className="flex items-center gap-2">
          <CopyButton textToCopy={getRawCopyText()} toolSlug={toolSlug} />
          <ShareButton title="Toolchemy AI Result" text={getRawCopyText()} toolSlug={toolSlug} />
          <button
            type="button"
            onClick={onRegenerate}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Regenerate"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 1. Emoji Art Rendering */}
      {toolSlug === 'text-to-emoji-art' && (
        <div className="p-6 rounded-xl bg-slate-950 text-white font-mono text-center text-xl sm:text-2xl leading-relaxed whitespace-pre-wrap overflow-x-auto shadow-inner">
          {typeof data === 'string' ? data : data.rawText || JSON.stringify(data)}
        </div>
      )}

      {/* 2. AI Recipe Generator Rendering */}
      {toolSlug === 'ai-recipe-generator' && typeof data === 'object' && data.dishName && (
        <div className="space-y-6 bg-slate-50 dark:bg-slate-950/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-2xl font-black text-slate-900 dark:text-white">{data.dishName}</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{data.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                ⏱️ {data.cookingTime || '20 mins'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                Difficulty: {data.difficulty || 'Easy'}
              </span>
            </div>
          </div>

          {Array.isArray(data.ingredients) && (
            <div>
              <h5 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-2">
                Ingredients Needed:
              </h5>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-700 dark:text-slate-300">
                {data.ingredients.map((item: string, idx: number) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {Array.isArray(data.steps) && (
            <div>
              <h5 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-2">
                Preparation Steps:
              </h5>
              <ol className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                {data.steps.map((step: string, idx: number) => (
                  <li key={idx} className="flex gap-3 leading-relaxed">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      {/* 3. Simp-o-Meter Rendering */}
      {toolSlug === 'simp-o-meter' && typeof data === 'object' && (
        <div className="space-y-6 bg-slate-50 dark:bg-slate-950/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Calculated Simp Score</span>
            <div className="text-5xl font-black bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 bg-clip-text text-transparent">
              {data.simpScore ?? 50}%
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 max-w-md mx-auto overflow-hidden">
              <div
                className="bg-gradient-to-r from-pink-500 to-red-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, data.simpScore ?? 50))}%` }}
              ></div>
            </div>
          </div>

          {data.summary && (
            <p className="text-center text-sm font-medium text-slate-700 dark:text-slate-300 italic max-w-xl mx-auto">
              "{data.summary}"
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.isArray(data.redFlags) && data.redFlags.length > 0 && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50">
                <h5 className="font-bold text-red-800 dark:text-red-300 text-sm mb-2">🚩 Red Flags Detected</h5>
                <ul className="space-y-1 text-xs text-red-700 dark:text-red-300">
                  {data.redFlags.map((flag: string, i: number) => (
                    <li key={i}>• {flag}</li>
                  ))}
                </ul>
              </div>
            )}

            {Array.isArray(data.greenFlags) && data.greenFlags.length > 0 && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50">
                <h5 className="font-bold text-emerald-800 dark:text-emerald-300 text-sm mb-2">🟢 Green Flags</h5>
                <ul className="space-y-1 text-xs text-emerald-700 dark:text-emerald-300">
                  {data.greenFlags.map((flag: string, i: number) => (
                    <li key={i}>• {flag}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Explain Like I'm 5 (ELI5) Rendering */}
      {toolSlug === 'explain-like-im-five' && typeof data === 'object' && data.explanation && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 space-y-2">
            <h4 className="font-bold text-blue-900 dark:text-blue-200 text-sm uppercase tracking-wider">Simple Explanation</h4>
            <p className="text-slate-800 dark:text-slate-200 leading-relaxed">{data.explanation}</p>
          </div>

          {data.analogy && (
            <div className="p-5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50 space-y-2">
              <h4 className="font-bold text-purple-900 dark:text-purple-200 text-sm uppercase tracking-wider">💡 Easy Analogy</h4>
              <p className="text-slate-800 dark:text-slate-200 leading-relaxed">{data.analogy}</p>
            </div>
          )}

          {data.oneLiner && (
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-sm text-center">
              Summary: "{data.oneLiner}"
            </div>
          )}
        </div>
      )}

      {/* 5. Meme Captions Rendering */}
      {toolSlug === 'ai-meme-caption-generator' && typeof data === 'object' && Array.isArray(data.captions) && (
        <div className="space-y-3">
          {data.captions.map((caption: string, idx: number) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 group"
            >
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm sm:text-base">
                "{caption}"
              </span>
              <CopyButton textToCopy={caption} toolSlug={toolSlug} />
            </div>
          ))}
        </div>
      )}

      {/* 6. Resume Bullet Points Rendering */}
      {toolSlug === 'resume-bullet-points' && typeof data === 'object' && Array.isArray(data.bullets) && (
        <div className="space-y-3">
          {data.bullets.map((bullet: string, idx: number) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4"
            >
              <div className="flex gap-2 text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                <span className="text-blue-500 font-bold">•</span>
                <span>{bullet}</span>
              </div>
              <CopyButton textToCopy={bullet} toolSlug={toolSlug} />
            </div>
          ))}
        </div>
      )}

      {/* 7. Dream Interpreter Rendering */}
      {toolSlug === 'dream-interpreter' && typeof data === 'object' && data.interpretation && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50">
            <h4 className="font-bold text-indigo-900 dark:text-indigo-200 text-sm uppercase tracking-wider mb-2">Symbolic Interpretation</h4>
            <p className="text-slate-800 dark:text-slate-200 leading-relaxed text-sm">{data.interpretation}</p>
          </div>

          {Array.isArray(data.symbolicThemes) && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Themes:</span>
              {data.symbolicThemes.map((theme: string, i: number) => (
                <span key={i} className="px-2.5 py-1 rounded-full text-xs bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {theme}
                </span>
              ))}
            </div>
          )}

          <p className="text-[11px] text-slate-500 italic">
            * Note: Dream interpretations are provided for self-reflection and entertainment purposes only, not professional psychological diagnosis.
          </p>
        </div>
      )}

      {/* 8. Wedding Vows & Shayari Rendering */}
      {toolSlug === 'wedding-vows-shayari' && typeof data === 'object' && (data.vows || data.shayari) && (
        <div className="space-y-6">
          {data.vows && (
            <div className="p-6 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 space-y-2">
              <h4 className="font-bold text-rose-900 dark:text-rose-200 text-sm uppercase tracking-wider">💍 Personal Wedding Vows</h4>
              <p className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap text-sm">{data.vows}</p>
            </div>
          )}
          {data.shayari && (
            <div className="p-6 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 space-y-2 text-center">
              <h4 className="font-bold text-purple-900 dark:text-purple-200 text-sm uppercase tracking-wider">✨ Romantic Shayari</h4>
              <p className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-serif italic text-base">{data.shayari}</p>
            </div>
          )}
        </div>
      )}

      {/* 9. AI Cover Letter Generator Rendering */}
      {toolSlug === 'ai-cover-letter-generator' && typeof data === 'object' && data.coverLetter && (
        <div className="space-y-6 bg-slate-50 dark:bg-slate-950/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          {data.subjectLine && (
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/50">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">Subject Line</span>
              <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{data.subjectLine}</p>
            </div>
          )}

          {Array.isArray(data.keyHighlights) && data.keyHighlights.length > 0 && (
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Key Value Highlights</h5>
              <div className="flex flex-wrap gap-2">
                {data.keyHighlights.map((highlight: string, idx: number) => (
                  <span key={idx} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    ✓ {highlight}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">Cover Letter</h5>
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
              {data.coverLetter}
            </div>
          </div>
        </div>
      )}

      {/* 10. AI Code Explainer Rendering */}
      {toolSlug === 'ai-code-explainer' && typeof data === 'object' && (data.explanation || data.simplifiedCode) && (
        <div className="space-y-6">
          {data.explanation && (
            <div className="p-5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 space-y-2">
              <h4 className="font-bold text-blue-900 dark:text-blue-200 text-sm uppercase tracking-wider">💡 Code Breakdown</h4>
              <p className="text-slate-800 dark:text-slate-200 leading-relaxed text-sm whitespace-pre-wrap">{data.explanation}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.timeComplexity && (
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">Time Complexity</span>
                <p className="text-sm font-mono font-bold text-purple-900 dark:text-purple-100 mt-1">{data.timeComplexity}</p>
              </div>
            )}
            {data.spaceComplexity && (
              <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">Space Complexity</span>
                <p className="text-sm font-mono font-bold text-indigo-900 dark:text-indigo-100 mt-1">{data.spaceComplexity}</p>
              </div>
            )}
          </div>

          {Array.isArray(data.improvements) && data.improvements.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50">
              <h5 className="font-bold text-amber-900 dark:text-amber-200 text-xs uppercase tracking-wider mb-2">⚡ Suggested Optimizations</h5>
              <ul className="space-y-1.5 text-xs text-amber-800 dark:text-amber-200">
                {data.improvements.map((tip: string, idx: number) => (
                  <li key={idx}>• {tip}</li>
                ))}
              </ul>
            </div>
          )}

          {data.simplifiedCode && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Clean Refactored Code</span>
                <CopyButton textToCopy={data.simplifiedCode} toolSlug={toolSlug} />
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                <code>{data.simplifiedCode}</code>
              </pre>
            </div>
          )}
        </div>
      )}

      {/* 11. AI Bio Generator Rendering */}
      {toolSlug === 'ai-bio-generator' && typeof data === 'object' && Array.isArray(data.bios) && (
        <div className="space-y-3">
          {data.bios.map((bio: string, idx: number) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium whitespace-pre-wrap">
                  {bio}
                </p>
                <CopyButton textToCopy={bio} toolSlug={toolSlug} />
              </div>
              <div className="flex justify-end">
                <span className="text-[11px] font-semibold text-slate-400">
                  {bio.length} characters
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Default Plain Text Fallback (Roast My Pic, AI Gaali Translator, etc.) */}
      {(![
        'text-to-emoji-art',
        'ai-recipe-generator',
        'simp-o-meter',
        'explain-like-im-five',
        'ai-meme-caption-generator',
        'resume-bullet-points',
        'dream-interpreter',
        'wedding-vows-shayari',
        'ai-cover-letter-generator',
        'ai-code-explainer',
        'ai-bio-generator',
      ].includes(toolSlug) || typeof data === 'string' || data.rawText) && (
        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-medium">
          {typeof data === 'string' ? data : data.rawText || JSON.stringify(data, null, 2)}
        </div>
      )}
    </div>
  );
};
