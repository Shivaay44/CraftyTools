import React, { useState, useRef, useEffect } from 'react';
import { trackEvent } from '../../../lib/analytics';
import {
  Mic,
  Square,
  Play,
  Pause,
  Download,
  RotateCcw,
  Sparkles,
  Volume2,
  AlertCircle,
} from 'lucide-react';

export const VoiceRecorderWidget: React.FC = () => {
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'paused' | 'stopped'>('idle');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

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

  // Audio Visualizer loop
  const drawVisualizer = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight: number;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;

        // Gradient color for audio visualizer bars
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#9333ea');
        gradient.addColorStop(1, '#6366f1');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };
    render();
  };

  const startRecording = async () => {
    try {
      chunksRef.current = [];
      setDuration(0);
      setAudioUrl(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Web Audio Analyser
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      // Start Visualizer
      drawVisualizer();

      // Media Recorder
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(finalBlob);
        setAudioUrl(url);
        setRecordingState('stopped');

        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
        trackEvent('tool_completed', { tool: 'voice-recorder' });
      };

      recorder.start(500);
      setRecordingState('recording');
      trackEvent('tool_started', { tool: 'voice-recorder' });
    } catch (err: any) {
      console.error('Audio recording failed:', err);
      alert('Microphone access denied or unavailable.');
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
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `voice-recording-${Date.now()}.webm`;
    a.click();
    trackEvent('download_clicked', { tool: 'voice-recorder' });
  };

  const handleReset = () => {
    setAudioUrl(null);
    setDuration(0);
    setRecordingState('idle');
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8">
      <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 text-center">
        {/* Status */}
        <div className="space-y-2 max-w-md mx-auto">
          {recordingState === 'recording' && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 font-bold text-xs animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
              LIVE RECORDING
            </div>
          )}
          {recordingState === 'paused' && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 font-bold text-xs">
              PAUSED
            </div>
          )}
          {recordingState === 'idle' && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-bold text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              Private In-Browser Audio Dictaphone
            </div>
          )}

          {/* Big Timer */}
          <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-slate-900 dark:text-white py-2">
            {formatTime(duration)}
          </div>
        </div>

        {/* Live Audio Visualizer Canvas */}
        <div className="w-full max-w-lg mx-auto h-24 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center p-2">
          {recordingState === 'recording' ? (
            <canvas ref={canvasRef} width={400} height={80} className="w-full h-full" />
          ) : (
            <div className="text-xs text-slate-400 font-medium">
              Audio visualizer will activate during live recording
            </div>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-4 flex-wrap pt-2">
          {recordingState === 'idle' && (
            <button
              type="button"
              onClick={startRecording}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-base flex items-center gap-3 shadow-xl shadow-purple-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Mic className="w-5 h-5" />
              Start Voice Recording
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
                Stop Recording
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
                Stop Recording
              </button>
            </>
          )}
        </div>
      </div>

      {/* Audio Playback & Download */}
      {audioUrl && (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Recorded Audio Playback ({formatTime(duration)})
            </h4>
            <button
              type="button"
              onClick={handleReset}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>

          <audio src={audioUrl} controls className="w-full" />

          <button
            type="button"
            onClick={handleDownload}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download Audio (.webm)
          </button>
        </div>
      )}
    </div>
  );
};
