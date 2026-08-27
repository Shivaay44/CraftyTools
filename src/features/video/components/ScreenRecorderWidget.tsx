import React, { useState, useRef, useEffect } from 'react';
import { trackEvent } from '../../../lib/analytics';
import {
  Video,
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  Download,
  RotateCcw,
  Sparkles,
  Film,
} from 'lucide-react';

export const ScreenRecorderWidget: React.FC = () => {
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'paused' | 'stopped'>('idle');
  const [includeMic, setIncludeMic] = useState<boolean>(true);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null);
  const [recordedSize, setRecordedSize] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // Timer interval
  useEffect(() => {
    if (recordingState === 'recording') {
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [recordingState]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      chunksRef.current = [];
      setDuration(0);
      setRecordedBlobUrl(null);

      // Request display media
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'monitor' },
        audio: true,
      });

      let combinedStream = displayStream;

      // If user enabled microphone
      if (includeMic) {
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const audioTracks = [...displayStream.getAudioTracks(), ...micStream.getAudioTracks()];
          combinedStream = new MediaStream([...displayStream.getVideoTracks(), ...audioTracks]);
        } catch (micErr) {
          console.warn('Microphone permission denied or not available:', micErr);
        }
      }

      streamRef.current = combinedStream;

      // Setup MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      const recorder = new MediaRecorder(combinedStream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(finalBlob);
        setRecordedBlobUrl(url);
        setRecordedSize(finalBlob.size);
        setRecordingState('stopped');

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
        trackEvent('tool_completed', { tool: 'screen-recorder' });
      };

      // If user clicks browser "Stop Sharing" button
      displayStream.getVideoTracks()[0].onended = () => {
        if (recorder.state !== 'inactive') {
          recorder.stop();
        }
      };

      recorder.start(1000);
      setRecordingState('recording');
      trackEvent('tool_started', { tool: 'screen-recorder' });
    } catch (err: any) {
      console.error('Screen recording error:', err);
      alert('Screen recording could not be started: ' + (err.message || 'Permission denied'));
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleDownload = () => {
    if (!recordedBlobUrl) return;
    const a = document.createElement('a');
    a.href = recordedBlobUrl;
    a.download = `screen-recording-${Date.now()}.webm`;
    a.click();
    trackEvent('download_clicked', { tool: 'screen-recorder' });
  };

  const handleReset = () => {
    setRecordedBlobUrl(null);
    setRecordedSize(0);
    setDuration(0);
    setRecordingState('idle');
  };

  return (
    <div className="space-y-8">
      {/* Recording Control Center */}
      <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 text-center">
        {/* State Status Banner */}
        <div className="space-y-2 max-w-md mx-auto">
          {recordingState === 'recording' && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 font-bold text-xs animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
              REC — Recording in progress
            </div>
          )}
          {recordingState === 'paused' && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 font-bold text-xs">
              ⏸️ Recording Paused
            </div>
          )}
          {recordingState === 'idle' && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-bold text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              100% In-Browser Screen Recorder (No Watermark)
            </div>
          )}

          {/* Big Timer */}
          <div className="text-5xl sm:text-6xl font-black tracking-tight font-mono text-slate-900 dark:text-white py-2">
            {formatTime(duration)}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {recordingState === 'idle' && (
            <button
              type="button"
              onClick={startRecording}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-base flex items-center gap-3 shadow-xl shadow-red-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Video className="w-5 h-5" />
              Start Screen Recording
            </button>
          )}

          {recordingState === 'recording' && (
            <>
              <button
                type="button"
                onClick={pauseRecording}
                className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Pause className="w-4 h-4" />
                Pause
              </button>
              <button
                type="button"
                onClick={stopRecording}
                className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-red-500/20 transition-all cursor-pointer"
              >
                <Square className="w-4 h-4" />
                Stop & Finish
              </button>
            </>
          )}

          {recordingState === 'paused' && (
            <>
              <button
                type="button"
                onClick={resumeRecording}
                className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4" />
                Resume
              </button>
              <button
                type="button"
                onClick={stopRecording}
                className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-red-500/20 transition-all cursor-pointer"
              >
                <Square className="w-4 h-4" />
                Stop & Finish
              </button>
            </>
          )}
        </div>

        {/* Microphone Toggle (When idle) */}
        {recordingState === 'idle' && (
          <div className="flex items-center justify-center gap-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400">
            <button
              type="button"
              onClick={() => setIncludeMic(!includeMic)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                includeMic
                  ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}
            >
              {includeMic ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              {includeMic ? 'Microphone Audio: ON' : 'Microphone Audio: OFF'}
            </button>
          </div>
        )}
      </div>

      {/* Recorded Video Playback & Download */}
      {recordedBlobUrl && (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Film className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Recording Ready for Download!
                </h4>
                <p className="text-xs text-slate-400">
                  Duration: {formatTime(duration)} • File Size: {(recordedSize / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              New Recording
            </button>
          </div>

          {/* Video Preview */}
          <div className="aspect-video rounded-2xl overflow-hidden bg-black border border-slate-800">
            <video src={recordedBlobUrl} controls className="w-full h-full object-contain" />
          </div>

          {/* Download Button */}
          <button
            type="button"
            onClick={handleDownload}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-purple-500/20 transition-all cursor-pointer"
          >
            <Download className="w-5 h-5" />
            Download Video (WebM / HD)
          </button>
        </div>
      )}
    </div>
  );
};
