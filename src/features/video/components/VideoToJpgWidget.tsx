import React, { useState, useRef, useEffect } from 'react';
import { trackEvent } from '../../../lib/analytics';
import { Upload, Download, AlertCircle, ShieldCheck, Play, Pause, Camera, Image as ImageIcon } from 'lucide-react';

export const VideoToJpgWidget: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [capturedSnapshot, setCapturedSnapshot] = useState<{ url: string; blob: Blob } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (capturedSnapshot) URL.revokeObjectURL(capturedSnapshot.url);
    };
  }, [videoUrl, capturedSnapshot]);

  const handleFileSelect = (file: File | undefined) => {
    if (!file) return;
    setErrorMsg(null);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    if (capturedSnapshot) URL.revokeObjectURL(capturedSnapshot.url);

    setCapturedSnapshot(null);
    setVideoFile(file);

    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    trackEvent('tool_started', { tool: 'video-to-jpg' });
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleVideoError = () => {
    setErrorMsg('This video format or codec is not supported by your browser.');
    trackEvent('tool_error', { tool: 'video-to-jpg' });
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (time: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleCaptureFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1920;
    canvas.height = video.videoHeight || 1080;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setErrorMsg('Failed to capture frame context.');
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) {
        setErrorMsg('Failed to generate image blob.');
        return;
      }
      if (capturedSnapshot) URL.revokeObjectURL(capturedSnapshot.url);
      const url = URL.createObjectURL(blob);
      setCapturedSnapshot({ url, blob });
      trackEvent('tool_completed', { tool: 'video-to-jpg' });
    }, 'image/jpeg', 0.95);
  };

  const handleDownload = () => {
    if (!capturedSnapshot) return;
    const a = document.createElement('a');
    a.href = capturedSnapshot.url;
    a.download = `video-frame-snapshot-${Math.round(currentTime)}s.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    trackEvent('download_clicked', { tool: 'video-to-jpg' });
  };

  const handleReset = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    if (capturedSnapshot) URL.revokeObjectURL(capturedSnapshot.url);
    setVideoFile(null);
    setVideoUrl(null);
    setCapturedSnapshot(null);
    setErrorMsg(null);
    setIsPlaying(false);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span>Your video is processed 100% locally in your browser. It is not uploaded to our server.</span>
      </div>

      {!videoUrl ? (
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
            if (droppedFile) handleFileSelect(droppedFile);
          }}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl p-8 sm:p-12 text-center bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
        >
          <label className="cursor-pointer flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 pointer-events-none">
              <Upload className="w-7 h-7" />
            </div>
            <span className="text-base font-bold text-slate-800 dark:text-slate-200 pointer-events-none">
              Drag & Drop Video Here, or <span className="text-blue-600 dark:text-blue-400 underline">Browse</span>
            </span>
            <span className="text-xs text-slate-500 pointer-events-none">Supports MP4, WebM, MOV, MKV (Max 500MB)</span>
            <input
              type="file"
              accept="video/*,.mp4,.webm,.mov,.mkv,.avi,.m4v"
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm truncate max-w-xs">{videoFile?.name}</p>
              <p className="text-xs text-slate-500">{formatTime(duration)} Duration</p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
            >
              Choose Different Video
            </button>
          </div>

          {/* Video Player */}
          <div className="relative rounded-2xl overflow-hidden bg-black max-h-[420px] flex items-center justify-center border border-slate-800">
            <video
              ref={videoRef}
              src={videoUrl}
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
              onError={handleVideoError}
              className="w-full max-h-[400px] object-contain"
            />
          </div>

          {/* Video Player Controls */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={togglePlay}
                className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500 transition-colors cursor-pointer flex-shrink-0"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>

              <div className="flex-1 space-y-1">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.01}
                  value={currentTime}
                  onChange={(e) => handleSeek(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[11px] font-bold text-slate-500">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCaptureFrame}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Camera className="w-5 h-5" />
              <span>Capture Current Frame ({formatTime(currentTime)})</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Captured Frame Result */}
          {capturedSnapshot && (
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  Captured Frame ({formatTime(currentTime)})
                </span>
              </div>
              <img src={capturedSnapshot.url} alt="Captured video frame" className="w-full max-h-80 object-contain rounded-xl border border-slate-200 dark:border-slate-800" />
              <button
                type="button"
                onClick={handleDownload}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Download className="w-5 h-5" />
                <span>Download High Quality JPG</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
