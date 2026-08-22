import React, { useState, useEffect } from 'react';
import { GenerateButton } from './GenerateButton';
import { AIResultCard } from './AIResultCard';
import { generateCacheKey, getCachedResult, setCachedResult } from '../../../lib/cache/clientCache';
import { trackEvent } from '../../../lib/analytics';
import { Upload, X, AlertCircle } from 'lucide-react';

interface OptionField {
  id: string;
  label: string;
  type: 'select' | 'text';
  options?: string[];
  placeholder?: string;
  defaultValue?: string;
}

interface BaseAIToolWidgetProps {
  toolSlug: string;
  inputPlaceholder?: string;
  inputLabel?: string;
  requiresImage?: boolean;
  optionsConfig?: OptionField[];
}

export const BaseAIToolWidget: React.FC<BaseAIToolWidgetProps> = ({
  toolSlug,
  inputPlaceholder = 'Enter text or details here...',
  inputLabel = 'Your Input',
  requiresImage = false,
  optionsConfig = [],
}) => {
  const [inputText, setInputText] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [optionsState, setOptionsState] = useState<Record<string, string>>({});
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize option default values
  useEffect(() => {
    const initialOptions: Record<string, string> = {};
    optionsConfig.forEach((opt) => {
      if (opt.defaultValue) {
        initialOptions[opt.id] = opt.defaultValue;
      } else if (opt.options && opt.options.length > 0) {
        initialOptions[opt.id] = opt.options[0];
      }
    });
    setOptionsState(initialOptions);
  }, [optionsConfig]);

  // Track tool view analytics on mount
  useEffect(() => {
    trackEvent('tool_view', { tool: toolSlug });
  }, [toolSlug]);

  // Image Upload Handler
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrorMsg('Please upload a valid image file (JPG, PNG, or WEBP).');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 4MB. Please choose a smaller image.');
      return;
    }

    setErrorMsg(null);
    setMimeType(file.type);

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageBase64(null);
    setMimeType(null);
  };

  const handleOptionChange = (id: string, value: string) => {
    setOptionsState((prev) => ({ ...prev, [id]: value }));
  };

  const executeGeneration = async (forceBypassCache: boolean = false) => {
    if (requiresImage && !imageBase64 && !inputText) {
      setErrorMsg('Please upload an image or enter details to continue.');
      return;
    }

    if (!requiresImage && !inputText.trim()) {
      setErrorMsg('Please enter input text to continue.');
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);
    trackEvent('tool_started', { tool: toolSlug });

    // 1. Check local cache
    const cacheKey = generateCacheKey(toolSlug, inputText + (imageBase64 || ''), optionsState);
    if (!forceBypassCache && !imageBase64) {
      const cached = getCachedResult(cacheKey);
      if (cached) {
        setResult(cached);
        setIsLoading(false);
        trackEvent('tool_completed', { tool: toolSlug, fromCache: true });
        return;
      }
    }

    // 2. Call API
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: toolSlug,
          input: inputText,
          imageBase64: imageBase64 || undefined,
          mimeType: mimeType || undefined,
          options: optionsState,
        }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        const errorText = resData.error?.message || 'Failed to generate AI response. Please try again.';
        setErrorMsg(errorText);
        trackEvent('tool_error', { tool: toolSlug, code: resData.error?.code });
        setIsLoading(false);
        return;
      }

      setResult(resData.result);
      if (!imageBase64) {
        setCachedResult(cacheKey, resData.result);
      }
      trackEvent('tool_completed', { tool: toolSlug, fromCache: false });
    } catch (err: any) {
      console.error('API Error:', err);
      setErrorMsg('Network error while connecting to Toolchemy AI. Please check your connection.');
      trackEvent('tool_error', { tool: toolSlug, code: 'NETWORK_ERROR' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    executeGeneration(false);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Image Input Section (for Roast My Pic) */}
        {requiresImage && (
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-800 dark:text-slate-200">
              Upload Image <span className="text-red-500">*</span>
            </label>
            {imageBase64 ? (
              <div className="relative inline-block border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-2 bg-slate-50 dark:bg-slate-950">
                <img src={imageBase64} alt="Upload preview" className="max-h-64 rounded-xl object-contain" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 text-white hover:bg-red-600 transition-colors cursor-pointer"
                  title="Remove Image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl cursor-pointer bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-500 dark:text-slate-400">
                  <Upload className="w-8 h-8 mb-2 text-blue-500" />
                  <p className="mb-1 text-sm font-semibold">Click to upload or drag & drop</p>
                  <p className="text-xs">JPG, PNG, or WEBP (Max 4MB)</p>
                </div>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
              </label>
            )}
          </div>
        )}

        {/* Text Input Field */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-800 dark:text-slate-200">
            {inputLabel} {!requiresImage && <span className="text-red-500">*</span>}
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={inputPlaceholder}
            rows={4}
            className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm leading-relaxed"
          />
        </div>

        {/* Dynamic Options Config (Dropdowns / Selects) */}
        {optionsConfig.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {optionsConfig.map((opt) => (
              <div key={opt.id} className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {opt.label}
                </label>
                {opt.type === 'select' && opt.options ? (
                  <select
                    value={optionsState[opt.id] || opt.options[0]}
                    onChange={(e) => handleOptionChange(opt.id, e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    {opt.options.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={optionsState[opt.id] || ''}
                    placeholder={opt.placeholder}
                    onChange={(e) => handleOptionChange(opt.id, e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Submit Generate Button */}
        <GenerateButton isLoading={isLoading} />
      </form>

      {/* Error Message Box */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Error: </span>
            {errorMsg}
          </div>
        </div>
      )}

      {/* Privacy Notice Badge */}
      <div className="p-3 rounded-xl bg-slate-100/60 dark:bg-slate-900/60 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
        <span>🔒</span>
        <span>
          Privacy Note: Input text & images are transmitted securely to the Toolchemy AI endpoint for generation. No data is stored permanently.
        </span>
      </div>

      {/* Result Section */}
      {result && (
        <div className="pt-4">
          <AIResultCard toolSlug={toolSlug} data={result} onRegenerate={() => executeGeneration(true)} />
        </div>
      )}
    </div>
  );
};
