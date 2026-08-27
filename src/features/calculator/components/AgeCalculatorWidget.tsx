import React, { useState, useEffect, useMemo } from 'react';
import { trackEvent } from '../../../lib/analytics';
import {
  Clock,
  Sparkles,
  Heart,
  Moon,
  Wind,
  Gift,
  Copy,
  Check,
  RotateCcw,
  Zap,
} from 'lucide-react';

interface AgeValidResult {
  isFuture: false;
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalWeeks: number;
  remainingDaysAfterWeeks: number;
  totalHours: number;
  totalMinutes: number;
  totalSeconds: number;
  birthDayOfWeek: string;
  nextBdayDays: number;
  nextBdayHours: number;
  nextBdayMinutes: number;
  nextBdaySeconds: number;
  nextBdayDayOfWeek: string;
  westernZodiac: { sign: string; symbol: string; element: string };
  chineseZodiac: string;
  heartbeats: number;
  breaths: number;
  sleepDays: number;
}

interface AgeFutureResult {
  isFuture: true;
}

type AgeData = AgeValidResult | AgeFutureResult | null;

export const AgeCalculatorWidget: React.FC = () => {
  // Default to a sample birth date (e.g. 2000-01-01)
  const [birthDate, setBirthDate] = useState<string>('2000-01-01');
  const [targetDate, setTargetDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [copied, setCopied] = useState<boolean>(false);

  // Live tick for real-time seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const ageData = useMemo<AgeData>(() => {
    if (!birthDate || !targetDate) return null;

    const birth = new Date(birthDate + 'T00:00:00');
    const target = new Date(targetDate + 'T' + currentTime.toTimeString().split(' ')[0]);

    if (isNaN(birth.getTime()) || isNaN(target.getTime())) return null;
    if (birth > target) return { isFuture: true };

    const diffMs = target.getTime() - birth.getTime();

    // Exact years, months, days calculation
    let years = target.getFullYear() - birth.getFullYear();
    let months = target.getMonth() - birth.getMonth();
    let days = target.getDate() - birth.getDate();

    if (days < 0) {
      months -= 1;
      // Get days in previous month
      const prevMonth = new Date(target.getFullYear(), target.getMonth(), 0);
      days += prevMonth.getDate();
    }

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    // Units
    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.floor(totalDays / 7);
    const remainingDaysAfterWeeks = totalDays % 7;
    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const totalSeconds = Math.floor(diffMs / 1000);

    // Day of birth
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const birthDayOfWeek = daysOfWeek[birth.getDay()];

    // Next Birthday calculation
    const currentYear = target.getFullYear();
    let nextBday = new Date(currentYear, birth.getMonth(), birth.getDate());
    if (nextBday < target) {
      nextBday = new Date(currentYear + 1, birth.getMonth(), birth.getDate());
    }

    const diffNextBdayMs = nextBday.getTime() - target.getTime();
    const nextBdayDays = Math.floor(diffNextBdayMs / (1000 * 60 * 60 * 24));
    const nextBdayHours = Math.floor((diffNextBdayMs / (1000 * 60 * 60)) % 24);
    const nextBdayMinutes = Math.floor((diffNextBdayMs / (1000 * 60)) % 60);
    const nextBdaySeconds = Math.floor((diffNextBdayMs / 1000) % 60);
    const nextBdayDayOfWeek = daysOfWeek[nextBday.getDay()];

    // Zodiac and Chinese Zodiac
    const getZodiac = (m: number, d: number): { sign: string; symbol: string; element: string } => {
      // m is 0-indexed
      const month = m + 1;
      if ((month === 3 && d >= 21) || (month === 4 && d <= 19)) return { sign: 'Aries', symbol: '♈', element: 'Fire' };
      if ((month === 4 && d >= 20) || (month === 5 && d <= 20)) return { sign: 'Taurus', symbol: '♉', element: 'Earth' };
      if ((month === 5 && d >= 21) || (month === 6 && d <= 20)) return { sign: 'Gemini', symbol: '♊', element: 'Air' };
      if ((month === 6 && d >= 21) || (month === 7 && d <= 22)) return { sign: 'Cancer', symbol: '♋', element: 'Water' };
      if ((month === 7 && d >= 23) || (month === 8 && d <= 22)) return { sign: 'Leo', symbol: '♌', element: 'Fire' };
      if ((month === 8 && d >= 23) || (month === 9 && d <= 22)) return { sign: 'Virgo', symbol: '♍', element: 'Earth' };
      if ((month === 9 && d >= 23) || (month === 10 && d <= 22)) return { sign: 'Libra', symbol: '♎', element: 'Air' };
      if ((month === 10 && d >= 23) || (month === 11 && d <= 21)) return { sign: 'Scorpio', symbol: '♏', element: 'Water' };
      if ((month === 11 && d >= 22) || (month === 12 && d <= 21)) return { sign: 'Sagittarius', symbol: '♐', element: 'Fire' };
      if ((month === 12 && d >= 22) || (month === 1 && d <= 19)) return { sign: 'Capricorn', symbol: '♑', element: 'Earth' };
      if ((month === 1 && d >= 20) || (month === 2 && d <= 18)) return { sign: 'Aquarius', symbol: '♒', element: 'Air' };
      return { sign: 'Pisces', symbol: '♓', element: 'Water' };
    };

    const chineseAnimals = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'];
    const chineseIndex = ((birth.getFullYear() - 4) % 12 + 12) % 12;
    const chineseZodiac = chineseAnimals[chineseIndex] || 'Dragon';
    const westernZodiac = getZodiac(birth.getMonth(), birth.getDate());

    // Biological approximations
    const heartbeats = Math.floor(totalMinutes * 75); // avg 75 bpm
    const breaths = Math.floor(totalMinutes * 16); // avg 16 bpm
    const sleepDays = Math.floor(totalDays * 0.33); // ~8 hours / day

    return {
      isFuture: false,
      years,
      months,
      days,
      totalDays,
      totalWeeks,
      remainingDaysAfterWeeks,
      totalHours,
      totalMinutes,
      totalSeconds,
      birthDayOfWeek,
      nextBdayDays,
      nextBdayHours,
      nextBdayMinutes,
      nextBdaySeconds,
      nextBdayDayOfWeek,
      westernZodiac,
      chineseZodiac,
      heartbeats,
      breaths,
      sleepDays,
    };
  }, [birthDate, targetDate, currentTime]);

  const handleCopy = () => {
    if (!ageData || ageData.isFuture) return;
    const summary = `🎂 Age Summary:\n• Exact Age: ${ageData.years} Years, ${ageData.months} Months, ${ageData.days} Days\n• Total Days: ${ageData.totalDays.toLocaleString()}\n• Born On: ${ageData.birthDayOfWeek}\n• Next Birthday In: ${ageData.nextBdayDays} days (${ageData.nextBdayDayOfWeek})\n• Zodiac Sign: ${ageData.westernZodiac.symbol} ${ageData.westernZodiac.sign} (${ageData.westernZodiac.element})\n• Calculated on FreeTools`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    trackEvent('copy_clicked', { tool: 'age-calculator' });
  };

  const handleReset = () => {
    setBirthDate('2000-01-01');
    setTargetDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-8">
      {/* Input Selection Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
              📅 Date of Birth:
            </label>
            <div className="relative">
              <input
                type="date"
                value={birthDate}
                onChange={(e) => {
                  setBirthDate(e.target.value);
                  trackEvent('tool_started', { tool: 'age-calculator' });
                }}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
              />
            </div>
            <p className="text-xs text-slate-400">Select or type your birth date</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
              🎯 Age at the Date of:
            </label>
            <div className="relative">
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Defaults to Today</span>
              <button
                type="button"
                onClick={() => setTargetDate(new Date().toISOString().split('T')[0])}
                className="text-purple-600 dark:text-purple-400 hover:underline font-semibold cursor-pointer"
              >
                Set to Today
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!ageData || ageData.isFuture}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white flex items-center gap-2 shadow-md shadow-purple-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied Summary!' : 'Copy Summary'}
          </button>
        </div>
      </div>

      {/* Main Age Result Display */}
      {ageData && !ageData.isFuture && (
        <div className="space-y-6">
          {/* Hero Exact Age Display */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 text-white shadow-xl shadow-purple-500/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Exact Age
              </div>

              <div className="grid grid-cols-3 gap-4 text-center sm:text-left sm:flex sm:items-baseline sm:gap-6">
                <div>
                  <span className="text-4xl sm:text-6xl font-black tracking-tight">
                    {ageData.years}
                  </span>
                  <span className="block text-xs sm:text-sm font-semibold text-purple-200 uppercase tracking-wider mt-1">
                    Years
                  </span>
                </div>
                <div>
                  <span className="text-4xl sm:text-6xl font-black tracking-tight">
                    {ageData.months}
                  </span>
                  <span className="block text-xs sm:text-sm font-semibold text-purple-200 uppercase tracking-wider mt-1">
                    Months
                  </span>
                </div>
                <div>
                  <span className="text-4xl sm:text-6xl font-black tracking-tight">
                    {ageData.days}
                  </span>
                  <span className="block text-xs sm:text-sm font-semibold text-purple-200 uppercase tracking-wider mt-1">
                    Days
                  </span>
                </div>
              </div>

              <div className="pt-2 text-xs sm:text-sm text-purple-100 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>
                  🎉 You were born on a <strong>{ageData.birthDayOfWeek}</strong>
                </span>
                <span>•</span>
                <span>
                  ✨ Western Zodiac: <strong>{ageData.westernZodiac.symbol} {ageData.westernZodiac.sign}</strong> ({ageData.westernZodiac.element})
                </span>
                <span>•</span>
                <span>
                  🐉 Chinese Zodiac: <strong>{ageData.chineseZodiac}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Next Birthday & Life Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Next Birthday Countdown */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 flex items-center justify-center">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    Next Birthday Countdown
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Falling on a {ageData.nextBdayDayOfWeek}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center pt-2">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                  <div className="text-xl font-black text-purple-600 dark:text-purple-400">
                    {ageData.nextBdayDays}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Days</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                  <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                    {ageData.nextBdayHours}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Hours</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                  <div className="text-xl font-black text-blue-600 dark:text-blue-400">
                    {ageData.nextBdayMinutes}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Mins</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                  <div className="text-xl font-black text-amber-500">
                    {ageData.nextBdaySeconds}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Secs</div>
                </div>
              </div>
            </div>

            {/* Total Units Breakdown */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    Age in Other Units
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Lifetime accumulation metrics
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Total Weeks</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {ageData.totalWeeks.toLocaleString()}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Total Days</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {ageData.totalDays.toLocaleString()}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Total Hours</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {ageData.totalHours.toLocaleString()}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Total Minutes</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {ageData.totalMinutes.toLocaleString()}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 col-span-2 sm:col-span-2">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Total Seconds (Live)</div>
                  <div className="text-sm font-black text-purple-600 dark:text-purple-400 font-mono">
                    {ageData.totalSeconds.toLocaleString()} s
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fun Biological Milestones */}
          <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Estimated Biological Milestones Lived
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-500 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Total Heartbeats</div>
                  <div className="text-base font-black text-slate-900 dark:text-white">
                    ~{ageData.heartbeats.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-500 flex items-center justify-center flex-shrink-0">
                  <Wind className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Breaths Taken</div>
                  <div className="text-base font-black text-slate-900 dark:text-white">
                    ~{ageData.breaths.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center flex-shrink-0">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Time Slept</div>
                  <div className="text-base font-black text-slate-900 dark:text-white">
                    ~{ageData.sleepDays.toLocaleString()} Days
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {ageData && ageData.isFuture && (
        <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm font-medium text-center">
          ⚠️ Birth date cannot be in the future relative to the comparison date. Please adjust your dates.
        </div>
      )}
    </div>
  );
};
