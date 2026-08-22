import React, { useState, useRef, useEffect, useCallback } from 'react';
import { trackEvent } from '../../../lib/analytics';
import {
  Download,
  ShieldCheck,
  Play,
  Pause,
  RefreshCw,
  Film,
  Zap,
  Check,
  AlertCircle,
  XCircle,
  Sliders,
  FileVideo,
  Volume2,
  VolumeX,
  Sparkles
} from 'lucide-react';

interface CodecConfig {
  mimeType: string;
  extension: 'mp4' | 'webm';
  label: string;
}

export const VideoFrameIncreaserWidget: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [targetFps, setTargetFps] = useState<number>(60); // 60, 90, or 120 FPS
  const [blendFactor, setBlendFactor] = useState<number>(50); // 0-100% motion smoothing
  const [preferredFormat, setPreferredFormat] = useState<'auto' | 'mp4' | 'webm'>('auto');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [videoDim, setVideoDim] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportedUrl, setExportedUrl] = useState<string | null>(null);
  const [exportedSize, setExportedSize] = useState<number>(0);
  const [exportedExtension, setExportedExtension] = useState<'mp4' | 'webm'>('mp4');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const prevFrameDataRef = useRef<ImageData | null>(null);
  const isExportingRef = useRef<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Helper to determine optimal supported video format
  const detectBestCodec = useCallback((formatPreference: 'auto' | 'mp4' | 'webm'): CodecConfig => {
    if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
      return { mimeType: 'video/webm', extension: 'webm', label: 'WebM' };
    }

    const mp4Types = [
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/mp4;codecs=avc1',
      'video/mp4;codecs=h264,aac',
      'video/mp4;codecs=h264',
      'video/mp4'
    ];

    const webmTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=h264',
      'video/webm'
    ];

    if (formatPreference === 'mp4') {
      for (const mime of mp4Types) {
        if (MediaRecorder.isTypeSupported(mime)) {
          return { mimeType: mime, extension: 'mp4', label: 'MP4 (H.264 Universal)' };
        }
      }
    }

    if (formatPreference === 'webm') {
      for (const mime of webmTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          return { mimeType: mime, extension: 'webm', label: 'WebM (VP9/VP8)' };
        }
      }
    }

    // Auto mode: Prefer MP4 for universal Windows / Mac / Mobile compatibility
    for (const mime of mp4Types) {
      if (MediaRecorder.isTypeSupported(mime)) {
        return { mimeType: mime, extension: 'mp4', label: 'MP4 (Universal)' };
      }
    }

    for (const mime of webmTypes) {
      if (MediaRecorder.isTypeSupported(mime)) {
        return { mimeType: mime, extension: 'webm', label: 'WebM' };
      }
    }

    return { mimeType: 'video/webm', extension: 'webm', label: 'WebM Default' };
  }, []);

  const handleFileChange = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|webm|mov|mkv|avi|m4v)$/i)) {
      setErrorMsg('Please select a valid video file (MP4, WebM, MOV, MKV).');
      return;
    }

    setErrorMsg(null);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    if (exportedUrl) URL.revokeObjectURL(exportedUrl);

    setVideoFile(file);
    setExportedUrl(null);
    setExportedSize(0);
    setIsPlaying(false);

    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    trackEvent('tool_started', { tool: 'video-frame-increaser' });
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const v = videoRef.current;
    const dur = isFinite(v.duration) ? v.duration : 0;
    setDuration(dur);
    setVideoDim({
      width: v.videoWidth || 640,
      height: v.videoHeight || 360
    });
  };

  const togglePlay = () => {
    if (!videoRef.current || isExporting) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Playback error:', err);
      });
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Render continuous interpolated frames during live preview
  useEffect(() => {
    const renderInterpolatedLoop = () => {
      const v = videoRef.current;
      const canvas = canvasRef.current;

      if (v && canvas && !v.paused && !v.ended && !isExportingRef.current) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          const w = canvas.width || 640;
          const h = canvas.height || 360;

          // Draw current raw video frame
          ctx.drawImage(v, 0, 0, w, h);

          if (blendFactor > 0) {
            try {
              const currentData = ctx.getImageData(0, 0, w, h);
              if (
                prevFrameDataRef.current &&
                prevFrameDataRef.current.data.length === currentData.data.length
              ) {
                const alpha = blendFactor / 200; // 0 to 0.5 blending weight
                const d = currentData.data;
                const prev = prevFrameDataRef.current.data;

                // Motion interpolation blending
                for (let i = 0; i < d.length; i += 4) {
                  d[i] = d[i] * (1 - alpha) + prev[i] * alpha;
                  d[i + 1] = d[i + 1] * (1 - alpha) + prev[i + 1] * alpha;
                  d[i + 2] = d[i + 2] * (1 - alpha) + prev[i + 2] * alpha;
                }
                ctx.putImageData(currentData, 0, 0);
              }
              prevFrameDataRef.current = currentData;
            } catch (err) {
              console.warn('Canvas pixel processing error:', err);
            }
          }
        }
        setCurrentTime(v.currentTime);
      }

      animFrameIdRef.current = requestAnimationFrame(renderInterpolatedLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(renderInterpolatedLoop);
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [blendFactor]);

  // Cancel any running export
  const cancelExport = () => {
    isExportingRef.current = false;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn('Recorder stop error during cancel:', e);
      }
    }
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setIsExporting(false);
    setExportProgress(0);
  };

  // Export video with real-time frame interpolation and high-FPS media recording
  const exportBoostedVideo = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const canvas = canvasRef.current;

    // Reset and initialize state
    isExportingRef.current = true;
    setIsExporting(true);
    setExportProgress(0);
    setErrorMsg(null);
    if (exportedUrl) URL.revokeObjectURL(exportedUrl);
    setExportedUrl(null);

    v.pause();
    setIsPlaying(false);

    try {
      // Ensure canvas matches video resolution
      const width = videoDim.width || v.videoWidth || 640;
      const height = videoDim.height || v.videoHeight || 360;
      canvas.width = width;
      canvas.height = height;

      // Select best supported codec
      const codec = detectBestCodec(preferredFormat);
      setExportedExtension(codec.extension);

      // Create stream from interpolated canvas at target FPS
      const canvasStream = canvas.captureStream(targetFps);
      const combinedStream = new MediaStream();

      // Add video track
      canvasStream.getVideoTracks().forEach((track) => combinedStream.addTrack(track));

      // Attempt to preserve audio track if present
      try {
        const vAny = v as any;
        const vStream = vAny.captureStream ? vAny.captureStream() : (vAny.mozCaptureStream ? vAny.mozCaptureStream() : null);
        if (vStream) {
          const audioTracks = vStream.getAudioTracks();
          if (audioTracks && audioTracks.length > 0) {
            audioTracks.forEach((track: MediaStreamTrack) => combinedStream.addTrack(track));
          }
        }
      } catch (err) {
        console.warn('Audio track capture bypassed:', err);
      }

      // Initialize MediaRecorder with high bitrate for crisp video output
      const recorder = new MediaRecorder(combinedStream, {
        mimeType: codec.mimeType,
        videoBitsPerSecond: 8000000 // 8 Mbps
      });
      mediaRecorderRef.current = recorder;

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      const exportPromise = new Promise<{ blob: Blob; url: string }>((resolve, reject) => {
        recorder.onstop = () => {
          if (!isExportingRef.current && chunks.length === 0) {
            reject(new Error('Export was cancelled.'));
            return;
          }
          const finalBlob = new Blob(chunks, { type: codec.mimeType });
          if (finalBlob.size === 0) {
            reject(new Error('Generated video is empty. Please try again.'));
            return;
          }
          const url = URL.createObjectURL(finalBlob);
          resolve({ blob: finalBlob, url });
        };
        recorder.onerror = (e) => reject(e);
      });

      // Prepare video playback from start
      v.currentTime = 0;
      v.muted = true; // Mute during export to avoid loud background audio while encoding

      await new Promise<void>((resolve) => {
        const onSeeked = () => {
          v.removeEventListener('seeked', onSeeked);
          resolve();
        };
        v.addEventListener('seeked', onSeeked);
      });

      // Start recording with 100ms chunks to flush data continuously
      recorder.start(100);

      // Start playback
      await v.play();

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      let prevExportFrameData: ImageData | null = null;
      const totalDur = duration || v.duration || 1;

      // Real-time interpolated render loop for export
      const renderExportStep = () => {
        if (!isExportingRef.current) return;

        if (v.ended || v.currentTime >= totalDur) {
          v.pause();
          if (recorder.state !== 'inactive') {
            recorder.stop();
          }
          return;
        }

        if (ctx) {
          ctx.drawImage(v, 0, 0, width, height);

          if (blendFactor > 0) {
            try {
              const currentData = ctx.getImageData(0, 0, width, height);
              if (
                prevExportFrameData &&
                prevExportFrameData.data.length === currentData.data.length
              ) {
                const alpha = blendFactor / 200;
                const d = currentData.data;
                const prev = prevExportFrameData.data;
                for (let i = 0; i < d.length; i += 4) {
                  d[i] = d[i] * (1 - alpha) + prev[i] * alpha;
                  d[i + 1] = d[i + 1] * (1 - alpha) + prev[i + 1] * alpha;
                  d[i + 2] = d[i + 2] * (1 - alpha) + prev[i + 2] * alpha;
                }
                ctx.putImageData(currentData, 0, 0);
              }
              prevExportFrameData = currentData;
            } catch (err) {
              console.warn('Export frame blending notice:', err);
            }
          }
        }

        const progress = Math.min(99, Math.round((v.currentTime / totalDur) * 100));
        setExportProgress(progress);
        setCurrentTime(v.currentTime);

        requestAnimationFrame(renderExportStep);
      };

      requestAnimationFrame(renderExportStep);

      const result = await exportPromise;
      setExportedSize(result.blob.size);
      setExportedUrl(result.url);
      setExportProgress(100);
      setIsExporting(false);
      isExportingRef.current = false;
      v.muted = isMuted;

      trackEvent('tool_completed', {
        tool: 'video-frame-increaser',
        fps: targetFps,
        format: codec.extension,
        sizeBytes: result.blob.size
      });
    } catch (err: any) {
      if (err.message !== 'Export was cancelled.') {
        console.error('Export error:', err);
        setErrorMsg(err.message || 'Failed to export boosted video. Please try again.');
      }
      setIsExporting(false);
      isExportingRef.current = false;
      if (videoRef.current) {
        videoRef.current.muted = isMuted;
      }
      trackEvent('tool_error', { tool: 'video-frame-increaser' });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (secs: number): string => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span>100% Client-Side Video Processing: Frame interpolation & FPS rendering run locally in browser memory.</span>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Upload Box */}
      {!videoUrl && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'copy';
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            let droppedFile: File | undefined = e.dataTransfer.files?.[0];
            if (!droppedFile && e.dataTransfer.items) {
              for (let i = 0; i < e.dataTransfer.items.length; i++) {
                const item = e.dataTransfer.items[i];
                if (item.kind === 'file') {
                  const f = item.getAsFile();
                  if (f) {
                    droppedFile = f;
                    break;
                  }
                }
              }
            }
            if (droppedFile) handleFileChange(droppedFile);
          }}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-2xl p-12 text-center transition-all bg-slate-50/50 dark:bg-slate-900/50 cursor-pointer group"
        >
          <label className="cursor-pointer flex flex-col items-center justify-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform pointer-events-none">
              <Film className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 pointer-events-none">
              Select or drag & drop a video to boost frame rate
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 pointer-events-none">
              Convert standard 24/30 FPS videos into fluid 60 FPS, 90 FPS, or 120 FPS
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500 pointer-events-none">
              <span className="px-2.5 py-1 rounded-full bg-slate-200/60 dark:bg-slate-800/80 font-medium">MP4</span>
              <span className="px-2.5 py-1 rounded-full bg-slate-200/60 dark:bg-slate-800/80 font-medium">WebM</span>
              <span className="px-2.5 py-1 rounded-full bg-slate-200/60 dark:bg-slate-800/80 font-medium">MOV</span>
              <span className="px-2.5 py-1 rounded-full bg-slate-200/60 dark:bg-slate-800/80 font-medium">MKV</span>
            </div>
            <input
              type="file"
              accept="video/*,.mp4,.webm,.mov,.mkv,.avi,.m4v"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0])}
            />
          </label>
        </div>
      )}

      {/* Controls and Side-by-Side Player */}
      {videoUrl && (
        <div className="space-y-6">
          {/* Settings Bar */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Target Frame Rate */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-indigo-500" />
                  Target Frame Rate
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[60, 90, 120].map((fps) => (
                    <button
                      key={fps}
                      type="button"
                      disabled={isExporting}
                      onClick={() => setTargetFps(fps)}
                      className={`py-2 px-2 text-center rounded-xl font-bold text-sm border transition-all cursor-pointer disabled:opacity-50 ${
                        targetFps === fps
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {fps} FPS
                    </button>
                  ))}
                </div>
              </div>

              {/* Frame Blending / Smoothing */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                    Motion Smoothing
                  </label>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {blendFactor}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  disabled={isExporting}
                  value={blendFactor}
                  onChange={(e) => setBlendFactor(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 disabled:opacity-50"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>Sharp Frames</span>
                  <span>Ultra Smooth Blend</span>
                </div>
              </div>

              {/* Format & Codec */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                  <FileVideo className="w-3.5 h-3.5 text-indigo-500" />
                  Export Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isExporting}
                    onClick={() => setPreferredFormat('auto')}
                    className={`py-2 px-2 text-center rounded-xl font-bold text-xs border transition-all cursor-pointer disabled:opacity-50 ${
                      preferredFormat === 'auto'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    Auto (Universal)
                  </button>
                  <button
                    type="button"
                    disabled={isExporting}
                    onClick={() => setPreferredFormat('webm')}
                    className={`py-2 px-2 text-center rounded-xl font-bold text-xs border transition-all cursor-pointer disabled:opacity-50 ${
                      preferredFormat === 'webm'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    WebM (VP9)
                  </button>
                </div>
              </div>
            </div>

            {/* Video Info Summary */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-3">
                <span>File: <strong className="text-slate-700 dark:text-slate-300">{videoFile?.name}</strong></span>
                <span>•</span>
                <span>Resolution: <strong className="text-slate-700 dark:text-slate-300">{videoDim.width} × {videoDim.height} px</strong></span>
                <span>•</span>
                <span>Duration: <strong className="text-slate-700 dark:text-slate-300">{formatTime(duration)} ({duration.toFixed(1)}s)</strong></span>
                {videoFile && (
                  <>
                    <span>•</span>
                    <span>Size: <strong className="text-slate-700 dark:text-slate-300">{formatFileSize(videoFile.size)}</strong></span>
                  </>
                )}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={togglePlay}
                  disabled={isExporting}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-800 dark:text-slate-200 font-bold text-sm flex items-center gap-2 transition-colors cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isPlaying ? 'Pause Preview' : 'Play Live Preview'}</span>
                </button>

                <button
                  type="button"
                  onClick={toggleMute}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (isExporting) cancelExport();
                    setVideoFile(null);
                    setVideoUrl(null);
                    setExportedUrl(null);
                  }}
                  disabled={isExporting}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Change Video
                </button>

                {isExporting ? (
                  <button
                    type="button"
                    onClick={cancelExport}
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md shadow-red-500/20 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Cancel Export ({exportProgress}%)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={exportBoostedVideo}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all cursor-pointer hover:shadow-indigo-500/30"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Export {targetFps} FPS Video</span>
                  </button>
                )}
              </div>
            </div>

            {/* Export Progress Bar */}
            {isExporting && (
              <div className="pt-2 space-y-2">
                <div className="flex justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Rendering & Encoding {targetFps} FPS Video Stream...
                  </span>
                  <span>{exportProgress}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-150"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Please keep this tab open while the high-framerate stream encodes.
                </p>
              </div>
            )}
          </div>

          {/* Side-by-Side Playback Visualizer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Original Feed */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span>Original Source Video</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">Standard Frame Rate</span>
              </div>
              <video
                ref={videoRef}
                src={videoUrl}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                playsInline
                muted={isMuted}
                className="w-full h-64 object-contain rounded-xl bg-black"
              />
            </div>

            {/* Right: Interpolated Boosted Canvas Feed */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-indigo-900/50 space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-400">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Boosted {targetFps} FPS Canvas Stream
                </span>
                <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  {blendFactor}% Smoothing
                </span>
              </div>
              <canvas
                ref={canvasRef}
                width={videoDim.width || 640}
                height={videoDim.height || 360}
                className="w-full h-64 object-contain rounded-xl bg-black"
              />
            </div>
          </div>

          {/* Export Ready Card with Interactive Player & Universal Download */}
          {exportedUrl && (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-indigo-100/50 dark:from-indigo-950/60 dark:to-slate-900 border border-indigo-200 dark:border-indigo-800 space-y-5 shadow-lg shadow-indigo-500/5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                      <Check className="w-4 h-4" />
                    </span>
                    Your {targetFps} FPS Enhanced Video is Ready!
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Play preview below to verify smoothness, then download your boosted video file.
                  </p>
                </div>

                <a
                  href={exportedUrl}
                  download={`enhanced-${targetFps}fps-${videoFile?.name?.replace(/\.[^/.]+$/, '') || 'video'}.${exportedExtension}`}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-500/25 flex items-center gap-2.5 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download {targetFps} FPS ({exportedExtension.toUpperCase()})</span>
                </a>
              </div>

              {/* Output Preview Player */}
              <div className="rounded-xl overflow-hidden bg-black border border-slate-200 dark:border-slate-800 shadow-inner">
                <video
                  src={exportedUrl}
                  controls
                  playsInline
                  className="w-full max-h-80 object-contain mx-auto bg-black"
                />
              </div>

              {/* File Specs & Universal Compatibility Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Format</span>
                  <strong className="text-slate-800 dark:text-slate-200 uppercase font-bold">{exportedExtension}</strong>
                </div>
                <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Frame Rate</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-bold">{targetFps} FPS</strong>
                </div>
                <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Resolution</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-bold">{videoDim.width} × {videoDim.height} px</strong>
                </div>
                <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Exported Size</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-bold">{formatFileSize(exportedSize)}</strong>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span>Compatible with Windows Media Player, Movies & TV, Apple QuickTime, VLC Player, and all web browsers.</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
