import React, { useState } from 'react';
import imageCompression from 'browser-image-compression';
import {
  Sparkles,
  ArrowRight,
  Upload,
  Download,
  CheckCircle2,
  RefreshCw,
  Sliders,
  FileCode,
  Copy,
  Check,
  Play
} from 'lucide-react';
import { formatFileSize } from '../../image/utils/imageValidation';

type WorkflowId = 'media-pipeline' | 'developer-pipeline' | 'custom-builder';

export const WorkflowRunner: React.FC = () => {
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowId>('media-pipeline');

  // --- Media Pipeline State ---
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [compressionQuality, setCompressionQuality] = useState<number>(80);
  const [targetWidth, setTargetWidth] = useState<number>(1200);
  const [targetFormat, setTargetFormat] = useState<'image/webp' | 'image/jpeg' | 'image/png'>('image/webp');
  
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [mediaResultUrl, setMediaResultUrl] = useState<string | null>(null);
  const [mediaResultSize, setMediaResultSize] = useState<number | null>(null);

  // --- Developer Pipeline State ---
  const [devInput, setDevInput] = useState<string>(
    'name,role,department,status\nAlice,Lead Engineer,Platform,Active\nBob,Product Designer,UX,Active\nCharlie,Security Analyst,SecOps,Remote'
  );
  const [devJsonOutput, setDevJsonOutput] = useState<string>('');
  const [devBase64Output, setDevBase64Output] = useState<string>('');
  const [devHashOutput, setDevHashOutput] = useState<string>('');
  const [devCopied, setDevCopied] = useState<string | null>(null);

  // Media file drop handler
  const handleMediaUpload = (file: File) => {
    setImageFile(file);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
    if (mediaResultUrl) URL.revokeObjectURL(mediaResultUrl);
    setMediaResultUrl(null);
    setCurrentStep(2);
  };

  // Run Media Optimization Pipeline in browser RAM
  const runMediaPipeline = async () => {
    if (!imageFile) return;
    setIsProcessing(true);

    try {
      // Step 1: Compress with browser-image-compression
      const compressOptions = {
        maxSizeMB: 5,
        initialQuality: compressionQuality / 100,
        useWebWorker: true,
        maxWidthOrHeight: targetWidth > 0 ? targetWidth : undefined,
      };
      const compressedFile = await imageCompression(imageFile, compressOptions);

      // Step 2: Render to canvas and convert to Target Format (e.g. WebP)
      const img = new Image();
      const tempUrl = URL.createObjectURL(compressedFile);
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Image decode error'));
        img.src = tempUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
      }
      URL.revokeObjectURL(tempUrl);

      // Step 3: Export blob in target format
      const finalBlob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), targetFormat, compressionQuality / 100);
      });

      if (finalBlob) {
        setMediaResultSize(finalBlob.size);
        if (mediaResultUrl) URL.revokeObjectURL(mediaResultUrl);
        setMediaResultUrl(URL.createObjectURL(finalBlob));
        setCurrentStep(3);
      }
    } catch (err) {
      console.error('Workflow error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Run Developer Pipeline
  const runDevPipeline = async () => {
    try {
      let parsedData: any = null;
      const trimmed = devInput.trim();

      // Check if CSV or JSON
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        parsedData = JSON.parse(trimmed);
      } else {
        // Parse CSV
        const lines = trimmed.split('\n').filter((l) => l.trim().length > 0);
        if (lines.length > 1) {
          const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
          parsedData = lines.slice(1).map((line) => {
            const values = line.split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
            const obj: Record<string, string> = {};
            headers.forEach((h, i) => {
              obj[h] = values[i] || '';
            });
            return obj;
          });
        }
      }

      const formattedJson = JSON.stringify(parsedData, null, 2);
      setDevJsonOutput(formattedJson);

      // Base64
      const utf8Bytes = new TextEncoder().encode(formattedJson);
      let binaryStr = '';
      utf8Bytes.forEach((b) => (binaryStr += String.fromCharCode(b)));
      setDevBase64Output(btoa(binaryStr));

      // SHA-256 Hash
      const hashBuffer = await crypto.subtle.digest('SHA-256', utf8Bytes);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      setDevHashOutput(hashHex);
    } catch (e: any) {
      setDevJsonOutput(`// Error processing input: ${e.message}`);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setDevCopied(id);
    setTimeout(() => setDevCopied(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Workflow Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => {
            setActiveWorkflow('media-pipeline');
            setCurrentStep(1);
          }}
          className={`px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 shadow-2xs ${
            activeWorkflow === 'media-pipeline'
              ? 'bg-purple-600 text-white shadow-purple-500/25 ring-2 ring-purple-600/30'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-purple-500'
          }`}
        >
          <span className="text-base">🖼️</span>
          <span>Media Optimization Pipeline</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveWorkflow('developer-pipeline');
            runDevPipeline();
          }}
          className={`px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 shadow-2xs ${
            activeWorkflow === 'developer-pipeline'
              ? 'bg-purple-600 text-white shadow-purple-500/25 ring-2 ring-purple-600/30'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-purple-500'
          }`}
        >
          <span className="text-base">💻</span>
          <span>Developer Data Pipeline</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveWorkflow('custom-builder')}
          className={`px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 shadow-2xs ${
            activeWorkflow === 'custom-builder'
              ? 'bg-purple-600 text-white shadow-purple-500/25 ring-2 ring-purple-600/30'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-purple-500'
          }`}
        >
          <span className="text-base">🛠️</span>
          <span>Pipeline Templates</span>
        </button>
      </div>

      {/* --- MEDIA PIPELINE WORKFLOW --- */}
      {activeWorkflow === 'media-pipeline' && (
        <div className="space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="space-y-1 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Chained In-Browser Pipeline</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Compress → Resize → Convert to WebP
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Input passes automatically through all three steps in browser memory without manual intermediate downloads.
            </p>
          </div>

          {/* Pipeline Step Indicator */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
            <div
              className={`p-3 rounded-2xl border text-xs font-bold transition-all ${
                currentStep >= 1
                  ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400'
              }`}
            >
              <div className="text-[10px] uppercase font-bold text-slate-400">Step 1</div>
              <div>Upload Image</div>
            </div>

            <div
              className={`p-3 rounded-2xl border text-xs font-bold transition-all ${
                currentStep >= 2
                  ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400'
              }`}
            >
              <div className="text-[10px] uppercase font-bold text-slate-400">Step 2</div>
              <div>Tune Pipeline Settings</div>
            </div>

            <div
              className={`p-3 rounded-2xl border text-xs font-bold transition-all ${
                currentStep >= 3
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400'
              }`}
            >
              <div className="text-[10px] uppercase font-bold text-slate-400">Step 3</div>
              <div>Export Asset</div>
            </div>
          </div>

          {/* Step 1: Upload */}
          {!imageFile ? (
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-500 rounded-2xl p-8 sm:p-12 text-center bg-slate-50 dark:bg-slate-950 transition-colors">
              <label className="cursor-pointer flex flex-col items-center justify-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <Upload className="w-7 h-7" />
                </div>
                <span className="text-base font-bold text-slate-800 dark:text-slate-200">
                  Drop image to start pipeline, or <span className="text-purple-600 dark:text-purple-400 underline">Browse</span>
                </span>
                <span className="text-xs text-slate-400">Supports JPG, PNG, WebP, AVIF</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleMediaUpload(f);
                  }}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Pipeline Configuration Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                {/* 1. Quality */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>1. Compression Quality</span>
                    <span>{compressionQuality}%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={compressionQuality}
                    onChange={(e) => setCompressionQuality(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                </div>

                {/* 2. Max Width */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>2. Max Width Bound</span>
                    <span>{targetWidth}px</span>
                  </div>
                  <input
                    type="number"
                    value={targetWidth}
                    onChange={(e) => setTargetWidth(parseInt(e.target.value, 10) || 0)}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs"
                  />
                </div>

                {/* 3. Output Format */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>3. Output Format</span>
                  </div>
                  <select
                    value={targetFormat}
                    onChange={(e: any) => setTargetFormat(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold"
                  >
                    <option value="image/webp">WebP (Modern & Lightweight)</option>
                    <option value="image/jpeg">JPEG (High Compatibility)</option>
                    <option value="image/png">PNG (Lossless Transparency)</option>
                  </select>
                </div>
              </div>

              {/* Run Action */}
              <button
                type="button"
                onClick={runMediaPipeline}
                disabled={isProcessing}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Executing Pipeline across Web Workers...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Execute Pipeline Now</span>
                  </>
                )}
              </button>

              {/* Output Result */}
              {mediaResultUrl && mediaResultSize !== null && (
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-6">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Pipeline Executed Successfully!</span>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="block text-[10px] uppercase font-bold text-slate-400">Original</span>
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {formatFileSize(imageFile.size)}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="block text-[10px] uppercase font-bold text-slate-400">Optimized</span>
                      <span className="text-xs sm:text-sm font-bold text-purple-600 dark:text-purple-400">
                        {formatFileSize(mediaResultSize)}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
                      <span className="block text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Saved</span>
                      <span className="text-xs sm:text-sm font-black text-emerald-700 dark:text-emerald-300">
                        {Math.max(0, Math.round(((imageFile.size - mediaResultSize) / imageFile.size) * 100))}% Smaller
                      </span>
                    </div>
                  </div>

                  {/* Preview Image */}
                  <div className="text-center">
                    <img
                      src={mediaResultUrl}
                      alt="Optimized result"
                      className="max-h-64 mx-auto rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 object-contain"
                    />
                  </div>

                  {/* Download */}
                  <a
                    href={mediaResultUrl}
                    download={`optimized-${imageFile.name.replace(/\.[^/.]+$/, '')}.${targetFormat.split('/')[1]}`}
                    className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <Download className="w-5 h-5" />
                    <span>Download Final Optimized File</span>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* --- DEVELOPER PIPELINE WORKFLOW --- */}
      {activeWorkflow === 'developer-pipeline' && (
        <div className="space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="space-y-1 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
              <FileCode className="w-3.5 h-3.5" />
              <span>Developer Data Chaining</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              CSV → JSON → Prettify → SHA-256 & Base64
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Transform raw tabular datasets into formatted JSON, compute cryptographic hash signatures, and generate Base64 payloads simultaneously.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Input CSV or Raw JSON
            </label>
            <textarea
              rows={4}
              value={devInput}
              onChange={(e) => setDevInput(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-mono focus:ring-2 focus:ring-purple-500 outline-none"
            />
            <button
              type="button"
              onClick={runDevPipeline}
              className="px-4 py-2 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-500 text-xs transition-colors cursor-pointer"
            >
              Parse & Transform Pipeline
            </button>
          </div>

          {/* Multi-Output Stream */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* JSON Output */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">1. Formatted JSON</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(devJsonOutput, 'json')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-purple-600 transition-colors flex items-center gap-1"
                >
                  {devCopied === 'json' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{devCopied === 'json' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-800 dark:text-slate-200 max-h-48 overflow-y-auto">
                {devJsonOutput || '// Click Parse & Transform'}
              </pre>
            </div>

            {/* Base64 Output */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">2. Base64 Payload</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(devBase64Output, 'b64')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-purple-600 transition-colors flex items-center gap-1"
                >
                  {devCopied === 'b64' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{devCopied === 'b64' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-800 dark:text-slate-200 max-h-48 overflow-y-auto break-all">
                {devBase64Output || '// Base64 payload will appear here'}
              </pre>
            </div>
            {/* SHA-256 Output */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">3. SHA-256 Checksum</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(devHashOutput, 'hash')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-purple-600 transition-colors flex items-center gap-1"
                >
                  {devCopied === 'hash' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{devCopied === 'hash' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-800 dark:text-slate-200 truncate">
                {devHashOutput || '// SHA-256 checksum'}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* --- CUSTOM WORKFLOW BUILDER --- */}
      {activeWorkflow === 'custom-builder' && (
        <div className="space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="space-y-1 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              <Sliders className="w-3.5 h-3.5" />
              <span>Interactive Workflow Templates</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Prebuilt Multi-Tool Pipelines
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Explore prebuilt multi-step processing chains. Execute automated pipelines locally in your browser memory with zero uploads.
            </p>
          </div>

          {/* Workflow Chain Visualizer */}
          <div className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pipeline Steps (Sequential Execution)
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800 text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-2">
                <span>1. Upload Media Asset</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <span>2. In-Memory Compression (80%)</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <span>3. Format Conversion to WebP</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <span>4. Export Clean File</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-600 dark:text-slate-400">
                💾 <strong>Local Persistence:</strong> Custom pipelines are stored strictly in your browser's <code className="font-mono text-purple-600 dark:text-purple-400">localStorage</code>.
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveWorkflow('media-pipeline');
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Run Media Workflow Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
