import React, { useState, useMemo } from 'react';
import { trackEvent } from '../../../lib/analytics';
import {
  Flame,
  Copy,
  Check,
  RotateCcw,
  Zap,
} from 'lucide-react';

type UnitSystem = 'metric' | 'imperial';
type Gender = 'male' | 'female';

export const BmiCalculatorWidget: React.FC = () => {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  const [gender, setGender] = useState<Gender>('male');
  const [age, setAge] = useState<number>(25);

  // Metric inputs
  const [heightCm, setHeightCm] = useState<number>(175);
  const [weightKg, setWeightKg] = useState<number>(70);

  // Imperial inputs
  const [heightFt, setHeightFt] = useState<number>(5);
  const [heightIn, setHeightIn] = useState<number>(9);
  const [weightLbs, setWeightLbs] = useState<number>(154);

  const [copied, setCopied] = useState<boolean>(false);

  const bmiResults = useMemo(() => {
    let heightInMeters = 0;
    let weightInKg = 0;

    if (unitSystem === 'metric') {
      heightInMeters = heightCm / 100;
      weightInKg = weightKg;
    } else {
      const totalInches = heightFt * 12 + heightIn;
      heightInMeters = totalInches * 0.0254;
      weightInKg = weightLbs * 0.45359237;
    }

    if (heightInMeters <= 0 || weightInKg <= 0) return null;

    const bmi = weightInKg / (heightInMeters * heightInMeters);
    const primeBmi = bmi / 25;
    const ponderalIndex = weightInKg / Math.pow(heightInMeters, 3);

    // Categories
    let category = '';
    let categoryColor = '';
    let categoryTextColor = '';
    let needlePercentage = 0; // 0 to 100 on gauge

    if (bmi < 18.5) {
      category = 'Underweight';
      categoryColor = 'bg-blue-500';
      categoryTextColor = 'text-blue-500 dark:text-blue-400';
      needlePercentage = Math.max(5, (bmi / 18.5) * 25);
    } else if (bmi < 25) {
      category = 'Normal Weight';
      categoryColor = 'bg-emerald-500';
      categoryTextColor = 'text-emerald-500 dark:text-emerald-400';
      needlePercentage = 25 + ((bmi - 18.5) / (25 - 18.5)) * 25;
    } else if (bmi < 30) {
      category = 'Overweight';
      categoryColor = 'bg-amber-500';
      categoryTextColor = 'text-amber-500 dark:text-amber-400';
      needlePercentage = 50 + ((bmi - 25) / (30 - 25)) * 25;
    } else {
      category = 'Obese';
      categoryColor = 'bg-red-500';
      categoryTextColor = 'text-red-500 dark:text-red-400';
      needlePercentage = Math.min(95, 75 + ((bmi - 30) / (40 - 30)) * 25);
    }

    // Ideal Weight Range (BMI 18.5 to 24.9)
    const minIdealKg = 18.5 * (heightInMeters * heightInMeters);
    const maxIdealKg = 24.9 * (heightInMeters * heightInMeters);

    // BMR (Mifflin-St Jeor formula)
    let bmr = 10 * weightInKg + 6.25 * (heightInMeters * 100) - 5 * age;
    if (gender === 'male') {
      bmr += 5;
    } else {
      bmr -= 161;
    }

    // Daily maintenance calories (Sedentary ~1.2x)
    const maintenanceCalories = Math.round(bmr * 1.375);

    return {
      bmi: parseFloat(bmi.toFixed(1)),
      category,
      categoryColor,
      categoryTextColor,
      needlePercentage,
      primeBmi: parseFloat(primeBmi.toFixed(2)),
      ponderalIndex: parseFloat(ponderalIndex.toFixed(1)),
      minIdealKg: parseFloat(minIdealKg.toFixed(1)),
      maxIdealKg: parseFloat(maxIdealKg.toFixed(1)),
      minIdealLbs: parseFloat((minIdealKg * 2.20462).toFixed(1)),
      maxIdealLbs: parseFloat((maxIdealKg * 2.20462).toFixed(1)),
      bmr: Math.round(bmr),
      maintenanceCalories,
      weightInKg: parseFloat(weightInKg.toFixed(1)),
      weightInLbs: parseFloat((weightInKg * 2.20462).toFixed(1)),
    };
  }, [unitSystem, gender, age, heightCm, weightKg, heightFt, heightIn, weightLbs]);

  const handleCopy = () => {
    if (!bmiResults) return;
    const summary = `📊 BMI & Health Metrics:\n• BMI Score: ${bmiResults.bmi} (${bmiResults.category})\n• Ideal Weight Range: ${bmiResults.minIdealKg} - ${bmiResults.maxIdealKg} kg\n• Basal Metabolic Rate (BMR): ${bmiResults.bmr} kcal/day\n• Daily Maintenance Calories: ${bmiResults.maintenanceCalories} kcal/day\n• Calculated on Toolchemy`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    trackEvent('copy_clicked', { tool: 'bmi-calculator' });
  };

  const handleReset = () => {
    setHeightCm(175);
    setWeightKg(70);
    setHeightFt(5);
    setHeightIn(9);
    setWeightLbs(154);
    setAge(25);
  };

  return (
    <div className="space-y-8">
      {/* Controls & Inputs */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        {/* Top System Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          {/* Unit System Switcher */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setUnitSystem('metric')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                unitSystem === 'metric'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Metric (kg, cm)
            </button>
            <button
              type="button"
              onClick={() => setUnitSystem('imperial')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                unitSystem === 'imperial'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Imperial (lbs, ft, in)
            </button>
          </div>

          {/* Gender Selector */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setGender('male')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                gender === 'male'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              ♂ Male
            </button>
            <button
              type="button"
              onClick={() => setGender('female')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                gender === 'female'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              ♀ Female
            </button>
          </div>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Age Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Age (Years)
            </label>
            <input
              type="number"
              min="2"
              max="120"
              value={age}
              onChange={(e) => setAge(Math.max(2, parseInt(e.target.value) || 0))}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          {/* Height Input */}
          {unitSystem === 'metric' ? (
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Height (cm)
              </label>
              <input
                type="number"
                min="50"
                max="260"
                value={heightCm}
                onChange={(e) => setHeightCm(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Height (ft & in)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="2"
                  max="8"
                  value={heightFt}
                  onChange={(e) => setHeightFt(Math.max(1, parseInt(e.target.value) || 0))}
                  placeholder="ft"
                  className="w-full px-3 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
                <input
                  type="number"
                  min="0"
                  max="11"
                  value={heightIn}
                  onChange={(e) => setHeightIn(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="in"
                  className="w-full px-3 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Weight Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Weight ({unitSystem === 'metric' ? 'kg' : 'lbs'})
            </label>
            {unitSystem === 'metric' ? (
              <input
                type="number"
                min="10"
                max="300"
                value={weightKg}
                onChange={(e) => setWeightKg(Math.max(1, parseFloat(e.target.value) || 0))}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            ) : (
              <input
                type="number"
                min="20"
                max="650"
                value={weightLbs}
                onChange={(e) => setWeightLbs(Math.max(1, parseFloat(e.target.value) || 0))}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
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
            disabled={!bmiResults}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white flex items-center gap-2 shadow-md shadow-purple-500/20 transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied Stats!' : 'Copy Stats'}
          </button>
        </div>
      </div>

      {/* BMI Results & Visual Gauge */}
      {bmiResults && (
        <div className="space-y-6">
          {/* Main Hero Card */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Your Body Mass Index
                </span>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-5xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white">
                    {bmiResults.bmi}
                  </span>
                  <span className={`text-xl font-bold ${bmiResults.categoryTextColor}`}>
                    {bmiResults.category}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 text-center sm:text-right">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Healthy Weight For Your Height
                </div>
                <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                  {unitSystem === 'metric'
                    ? `${bmiResults.minIdealKg} — ${bmiResults.maxIdealKg} kg`
                    : `${bmiResults.minIdealLbs} — ${bmiResults.maxIdealLbs} lbs`}
                </div>
              </div>
            </div>

            {/* Visual Color Spectrum Bar with Needle */}
            <div className="space-y-2 pt-2">
              <div className="relative h-6 w-full rounded-full overflow-hidden flex shadow-inner">
                <div className="h-full w-1/4 bg-blue-500" title="Underweight (< 18.5)"></div>
                <div className="h-full w-1/4 bg-emerald-500" title="Normal (18.5 - 24.9)"></div>
                <div className="h-full w-1/4 bg-amber-500" title="Overweight (25 - 29.9)"></div>
                <div className="h-full w-1/4 bg-red-500" title="Obese (>= 30)"></div>
              </div>

              {/* Dynamic Indicator Pointer */}
              <div className="relative w-full h-4">
                <div
                  className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-500"
                  style={{ left: `${bmiResults.needlePercentage}%` }}
                >
                  <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-slate-900 dark:border-b-white"></div>
                  <span className="text-[10px] font-black text-slate-900 dark:text-white mt-0.5">
                    {bmiResults.bmi}
                  </span>
                </div>
              </div>

              {/* Legend Labels */}
              <div className="grid grid-cols-4 text-[11px] font-bold text-center text-slate-500 dark:text-slate-400 pt-1">
                <div>Underweight (&lt; 18.5)</div>
                <div>Normal (18.5 - 24.9)</div>
                <div>Overweight (25 - 29.9)</div>
                <div>Obese (&ge; 30)</div>
              </div>
            </div>
          </div>

          {/* Calorie & Metabolism Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center flex-shrink-0">
                <Flame className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Basal Metabolic Rate (BMR)
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {bmiResults.bmr} <span className="text-sm font-bold text-slate-500">kcal/day</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Calories burned at absolute complete resting state
                </p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Maintenance Calories
                </div>
                <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
                  {bmiResults.maintenanceCalories}{' '}
                  <span className="text-sm font-bold text-slate-500">kcal/day</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Estimated daily energy needed with light/moderate activity
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
