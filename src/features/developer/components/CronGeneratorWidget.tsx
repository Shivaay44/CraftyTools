import React, { useState, useMemo } from 'react';
import { trackEvent } from '../../../lib/analytics';
import {
  ShieldCheck,
  Calendar,
  Clock,
  Copy,
  Check,
  Zap,
  Sliders,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface CronPreset {
  label: string;
  expression: string;
  description: string;
}

const COMMON_PRESETS: CronPreset[] = [
  { label: 'Every Minute', expression: '* * * * *', description: 'Executes every single minute' },
  { label: 'Every Hour', expression: '0 * * * *', description: 'Executes at minute 0 of every hour' },
  { label: 'Every Day at Midnight', expression: '0 0 * * *', description: 'Executes at 00:00 (12:00 AM) every day' },
  { label: 'Every Monday at 9:00 AM', expression: '0 9 * * 1', description: 'Executes every Monday at 09:00 AM' },
  { label: '1st of Every Month', expression: '0 0 1 * *', description: 'Executes at midnight on day 1 of every month' },
  { label: 'Every 15 Minutes', expression: '*/15 * * * *', description: 'Executes every 15 minutes past the hour' },
];

export const CronGeneratorWidget: React.FC = () => {
  const [minute, setMinute] = useState<string>('0');
  const [hour, setHour] = useState<string>('9');
  const [dayOfMonth, setDayOfMonth] = useState<string>('*');
  const [month, setMonth] = useState<string>('*');
  const [dayOfWeek, setDayOfWeek] = useState<string>('1-5');
  const [copied, setCopied] = useState<boolean>(false);

  const cronExpression = `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;

  // Human description generator
  const humanDescription = useMemo(() => {
    let desc = 'Runs ';

    if (minute === '*' && hour === '*') {
      desc += 'every minute';
    } else if (minute.startsWith('*/')) {
      desc += `every ${minute.replace('*/', '')} minutes`;
    } else {
      const h = parseInt(hour, 10);
      const m = parseInt(minute, 10);
      if (!isNaN(h) && !isNaN(m)) {
        const period = h >= 12 ? 'PM' : 'AM';
        const formattedHour = h % 12 === 0 ? 12 : h % 12;
        const formattedMin = m < 10 ? `0${m}` : m;
        desc += `at ${formattedHour}:${formattedMin} ${period}`;
      } else {
        desc += `at minute ${minute} of hour ${hour}`;
      }
    }

    if (dayOfWeek === '1-5') {
      desc += ', Monday through Friday';
    } else if (dayOfWeek === '0,6') {
      desc += ', on weekends (Saturday and Sunday)';
    } else if (dayOfWeek !== '*') {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayNum = parseInt(dayOfWeek, 10);
      if (!isNaN(dayNum) && dayNames[dayNum]) {
        desc += `, only on ${dayNames[dayNum]}`;
      } else {
        desc += `, on weekday ${dayOfWeek}`;
      }
    } else if (dayOfMonth !== '*') {
      desc += `, on day ${dayOfMonth} of the month`;
    } else {
      desc += ', every day';
    }

    if (month !== '*') {
      desc += `, in month ${month}`;
    }

    return desc + '.';
  }, [minute, hour, dayOfMonth, month, dayOfWeek]);

  // Compute next 5 hypothetical run dates for user visualization
  const nextRunDates = useMemo(() => {
    const dates: string[] = [];
    const now = new Date();

    for (let i = 1; i <= 5; i++) {
      const next = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      const h = parseInt(hour, 10);
      const m = parseInt(minute, 10);
      if (!isNaN(h)) next.setHours(h);
      if (!isNaN(m)) next.setMinutes(m);
      next.setSeconds(0);
      dates.push(next.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }));
    }
    return dates;
  }, [minute, hour, dayOfMonth, month, dayOfWeek]);

  const handleCopy = () => {
    navigator.clipboard.writeText(cronExpression);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    trackEvent('copy_clicked', { tool: 'cron-generator' });
    trackEvent('tool_completed', { tool: 'cron-generator' });
  };

  const applyPreset = (preset: CronPreset) => {
    const parts = preset.expression.split(' ');
    if (parts.length === 5) {
      setMinute(parts[0]);
      setHour(parts[1]);
      setDayOfMonth(parts[2]);
      setMonth(parts[3]);
      setDayOfWeek(parts[4]);
      trackEvent('tool_started', { tool: 'cron-generator', preset: preset.label });
    }
  };

  return (
    <div className="space-y-6">
      {/* Privacy Guarantee */}
      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span>100% Client-Side Cron Builder: Generate cron job schedule expressions with human explanations.</span>
      </div>

      {/* Preset Pills */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-amber-500" />
          Common Schedule Presets
        </label>
        <div className="flex flex-wrap gap-2">
          {COMMON_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p)}
              className="py-1.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer transition-all shadow-2xs"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cron Expression Banner Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white border border-slate-800 shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              Cron Schedule Expression
            </span>
            <div className="text-3xl sm:text-4xl font-mono font-black tracking-widest text-emerald-400">
              {cronExpression}
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied Expression!' : 'Copy Cron'}</span>
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-white/10 text-xs text-indigo-100 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span className="font-medium leading-relaxed">{humanDescription}</span>
        </div>
      </div>

      {/* Visual Field Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Minute */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Minute (0-59)
          </label>
          <select
            value={minute}
            onChange={(e) => setMinute(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none"
          >
            <option value="*">Every minute (*)</option>
            <option value="*/5">Every 5 min (*/5)</option>
            <option value="*/15">Every 15 min (*/15)</option>
            <option value="*/30">Every 30 min (*/30)</option>
            <option value="0">At minute 00</option>
            <option value="15">At minute 15</option>
            <option value="30">At minute 30</option>
            <option value="45">At minute 45</option>
          </select>
        </div>

        {/* Hour */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Hour (0-23)
          </label>
          <select
            value={hour}
            onChange={(e) => setHour(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none"
          >
            <option value="*">Every hour (*)</option>
            <option value="*/2">Every 2 hours (*/2)</option>
            <option value="*/6">Every 6 hours (*/6)</option>
            <option value="0">00:00 (Midnight)</option>
            <option value="9">09:00 AM</option>
            <option value="12">12:00 PM (Noon)</option>
            <option value="17">17:00 (05:00 PM)</option>
            <option value="21">21:00 (09:00 PM)</option>
          </select>
        </div>

        {/* Day of Month */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Day of Month
          </label>
          <select
            value={dayOfMonth}
            onChange={(e) => setDayOfMonth(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none"
          >
            <option value="*">Every day (*)</option>
            <option value="1">1st day of month</option>
            <option value="15">15th day of month</option>
            <option value="28">28th day of month</option>
            <option value="*/2">Every 2 days (*/2)</option>
          </select>
        </div>

        {/* Month */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Month (1-12)
          </label>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none"
          >
            <option value="*">Every month (*)</option>
            <option value="*/3">Every quarter (*/3)</option>
            <option value="1">January (1)</option>
            <option value="6">June (6)</option>
            <option value="12">December (12)</option>
          </select>
        </div>

        {/* Day of Week */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Day of Week
          </label>
          <select
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none"
          >
            <option value="*">Every day of week (*)</option>
            <option value="1-5">Mon to Fri (1-5)</option>
            <option value="0,6">Weekends (0,6)</option>
            <option value="1">Monday only (1)</option>
            <option value="5">Friday only (5)</option>
          </select>
        </div>
      </div>

      {/* Next Upcoming Scheduled Dates Card */}
      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-blue-600" />
          Upcoming Scheduled Executions Preview
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {nextRunDates.map((dateStr, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center space-y-1"
            >
              <span className="text-[10px] uppercase font-bold text-slate-400">Run #{idx + 1}</span>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{dateStr}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
