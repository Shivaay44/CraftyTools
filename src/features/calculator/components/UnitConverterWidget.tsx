import React, { useState, useMemo } from 'react';
import { trackEvent } from '../../../lib/analytics';
import {
  ArrowRightLeft,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Ruler,
  Scale,
  Thermometer,
  Layers,
  Box,
  Gauge,
  HardDrive,
  Clock,
} from 'lucide-react';

type Dimension =
  | 'length'
  | 'weight'
  | 'temperature'
  | 'area'
  | 'volume'
  | 'speed'
  | 'storage'
  | 'time';

interface UnitOption {
  id: string;
  name: string;
  symbol: string;
  toBase: (v: number) => number;
  fromBase: (v: number) => number;
}

const DIMENSION_CONFIG: Record<
  Dimension,
  { label: string; icon: any; baseUnit: string; units: UnitOption[] }
> = {
  length: {
    label: 'Length',
    icon: Ruler,
    baseUnit: 'Meter',
    units: [
      { id: 'km', name: 'Kilometer', symbol: 'km', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'm', name: 'Meter', symbol: 'm', toBase: (v) => v, fromBase: (v) => v },
      { id: 'cm', name: 'Centimeter', symbol: 'cm', toBase: (v) => v * 0.01, fromBase: (v) => v / 0.01 },
      { id: 'mm', name: 'Millimeter', symbol: 'mm', toBase: (v) => v * 0.001, fromBase: (v) => v / 0.001 },
      { id: 'mi', name: 'Mile', symbol: 'mi', toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
      { id: 'yd', name: 'Yard', symbol: 'yd', toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
      { id: 'ft', name: 'Foot', symbol: 'ft', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
      { id: 'in', name: 'Inch', symbol: 'in', toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
      { id: 'nmi', name: 'Nautical Mile', symbol: 'nmi', toBase: (v) => v * 1852, fromBase: (v) => v / 1852 },
    ],
  },
  weight: {
    label: 'Weight & Mass',
    icon: Scale,
    baseUnit: 'Kilogram',
    units: [
      { id: 't', name: 'Metric Ton', symbol: 't', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'kg', name: 'Kilogram', symbol: 'kg', toBase: (v) => v, fromBase: (v) => v },
      { id: 'g', name: 'Gram', symbol: 'g', toBase: (v) => v * 0.001, fromBase: (v) => v / 0.001 },
      { id: 'mg', name: 'Milligram', symbol: 'mg', toBase: (v) => v * 0.000001, fromBase: (v) => v / 0.000001 },
      { id: 'lb', name: 'Pound', symbol: 'lb', toBase: (v) => v * 0.45359237, fromBase: (v) => v / 0.45359237 },
      { id: 'oz', name: 'Ounce', symbol: 'oz', toBase: (v) => v * 0.028349523, fromBase: (v) => v / 0.028349523 },
      { id: 'st', name: 'Stone', symbol: 'st', toBase: (v) => v * 6.35029318, fromBase: (v) => v / 6.35029318 },
    ],
  },
  temperature: {
    label: 'Temperature',
    icon: Thermometer,
    baseUnit: 'Celsius',
    units: [
      { id: 'c', name: 'Celsius', symbol: '°C', toBase: (v) => v, fromBase: (v) => v },
      { id: 'f', name: 'Fahrenheit', symbol: '°F', toBase: (v) => ((v - 32) * 5) / 9, fromBase: (v) => (v * 9) / 5 + 32 },
      { id: 'k', name: 'Kelvin', symbol: 'K', toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
    ],
  },
  area: {
    label: 'Area',
    icon: Layers,
    baseUnit: 'Square Meter',
    units: [
      { id: 'sq_km', name: 'Square Kilometer', symbol: 'km²', toBase: (v) => v * 1000000, fromBase: (v) => v / 1000000 },
      { id: 'sq_m', name: 'Square Meter', symbol: 'm²', toBase: (v) => v, fromBase: (v) => v },
      { id: 'sq_mi', name: 'Square Mile', symbol: 'mi²', toBase: (v) => v * 2589988.11, fromBase: (v) => v / 2589988.11 },
      { id: 'sq_yd', name: 'Square Yard', symbol: 'yd²', toBase: (v) => v * 0.836127, fromBase: (v) => v / 0.836127 },
      { id: 'sq_ft', name: 'Square Foot', symbol: 'ft²', toBase: (v) => v * 0.092903, fromBase: (v) => v / 0.092903 },
      { id: 'sq_in', name: 'Square Inch', symbol: 'in²', toBase: (v) => v * 0.00064516, fromBase: (v) => v / 0.00064516 },
      { id: 'acre', name: 'Acre', symbol: 'ac', toBase: (v) => v * 4046.85642, fromBase: (v) => v / 4046.85642 },
      { id: 'ha', name: 'Hectare', symbol: 'ha', toBase: (v) => v * 10000, fromBase: (v) => v / 10000 },
    ],
  },
  volume: {
    label: 'Volume',
    icon: Box,
    baseUnit: 'Liter',
    units: [
      { id: 'cu_m', name: 'Cubic Meter', symbol: 'm³', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'l', name: 'Liter', symbol: 'L', toBase: (v) => v, fromBase: (v) => v },
      { id: 'ml', name: 'Milliliter', symbol: 'mL', toBase: (v) => v * 0.001, fromBase: (v) => v / 0.001 },
      { id: 'gal_us', name: 'Gallon (US)', symbol: 'gal', toBase: (v) => v * 3.78541, fromBase: (v) => v / 3.78541 },
      { id: 'qt_us', name: 'Quart (US)', symbol: 'qt', toBase: (v) => v * 0.946353, fromBase: (v) => v / 0.946353 },
      { id: 'pt_us', name: 'Pint (US)', symbol: 'pt', toBase: (v) => v * 0.473176, fromBase: (v) => v / 0.473176 },
      { id: 'cup_us', name: 'Cup (US)', symbol: 'cup', toBase: (v) => v * 0.24, fromBase: (v) => v / 0.24 },
      { id: 'fl_oz_us', name: 'Fluid Ounce (US)', symbol: 'fl oz', toBase: (v) => v * 0.0295735, fromBase: (v) => v / 0.0295735 },
    ],
  },
  speed: {
    label: 'Speed',
    icon: Gauge,
    baseUnit: 'Meter/Second',
    units: [
      { id: 'kmh', name: 'Kilometer/Hour', symbol: 'km/h', toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
      { id: 'mph', name: 'Mile/Hour', symbol: 'mph', toBase: (v) => v * 0.44704, fromBase: (v) => v / 0.44704 },
      { id: 'ms', name: 'Meter/Second', symbol: 'm/s', toBase: (v) => v, fromBase: (v) => v },
      { id: 'kn', name: 'Knot', symbol: 'kn', toBase: (v) => v * 0.514444, fromBase: (v) => v / 0.514444 },
      { id: 'fts', name: 'Foot/Second', symbol: 'ft/s', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
    ],
  },
  storage: {
    label: 'Digital Storage',
    icon: HardDrive,
    baseUnit: 'Byte',
    units: [
      { id: 'b', name: 'Byte', symbol: 'B', toBase: (v) => v, fromBase: (v) => v },
      { id: 'kb', name: 'Kilobyte', symbol: 'KB', toBase: (v) => v * 1024, fromBase: (v) => v / 1024 },
      { id: 'mb', name: 'Megabyte', symbol: 'MB', toBase: (v) => v * Math.pow(1024, 2), fromBase: (v) => v / Math.pow(1024, 2) },
      { id: 'gb', name: 'Gigabyte', symbol: 'GB', toBase: (v) => v * Math.pow(1024, 3), fromBase: (v) => v / Math.pow(1024, 3) },
      { id: 'tb', name: 'Terabyte', symbol: 'TB', toBase: (v) => v * Math.pow(1024, 4), fromBase: (v) => v / Math.pow(1024, 4) },
      { id: 'pb', name: 'Petabyte', symbol: 'PB', toBase: (v) => v * Math.pow(1024, 5), fromBase: (v) => v / Math.pow(1024, 5) },
    ],
  },
  time: {
    label: 'Time',
    icon: Clock,
    baseUnit: 'Second',
    units: [
      { id: 'yr', name: 'Year (365 days)', symbol: 'yr', toBase: (v) => v * 31536000, fromBase: (v) => v / 31536000 },
      { id: 'mo', name: 'Month (30 days)', symbol: 'mo', toBase: (v) => v * 2592000, fromBase: (v) => v / 2592000 },
      { id: 'wk', name: 'Week', symbol: 'wk', toBase: (v) => v * 604800, fromBase: (v) => v / 604800 },
      { id: 'd', name: 'Day', symbol: 'd', toBase: (v) => v * 86400, fromBase: (v) => v / 86400 },
      { id: 'h', name: 'Hour', symbol: 'h', toBase: (v) => v * 3600, fromBase: (v) => v / 3600 },
      { id: 'min', name: 'Minute', symbol: 'min', toBase: (v) => v * 60, fromBase: (v) => v / 60 },
      { id: 's', name: 'Second', symbol: 's', toBase: (v) => v, fromBase: (v) => v },
      { id: 'ms', name: 'Millisecond', symbol: 'ms', toBase: (v) => v * 0.001, fromBase: (v) => v / 0.001 },
    ],
  },
};

export const UnitConverterWidget: React.FC = () => {
  const [activeDimension, setActiveDimension] = useState<Dimension>('length');
  const [inputValue, setInputValue] = useState<number>(1);
  const [fromUnitId, setFromUnitId] = useState<string>('km');
  const [toUnitId, setToUnitId] = useState<string>('mi');
  const [copied, setCopied] = useState<boolean>(false);

  const currentConfig = DIMENSION_CONFIG[activeDimension];

  const handleDimensionChange = (dim: Dimension) => {
    setActiveDimension(dim);
    const config = DIMENSION_CONFIG[dim];
    setFromUnitId(config.units[0].id);
    setToUnitId(config.units[1] ? config.units[1].id : config.units[0].id);
  };

  const handleSwap = () => {
    const temp = fromUnitId;
    setFromUnitId(toUnitId);
    setToUnitId(temp);
  };

  // Conversions
  const fromUnit = currentConfig.units.find((u) => u.id === fromUnitId) || currentConfig.units[0];
  const toUnit = currentConfig.units.find((u) => u.id === toUnitId) || currentConfig.units[1] || currentConfig.units[0];

  const convertedValue = useMemo(() => {
    if (isNaN(inputValue)) return 0;
    const baseVal = fromUnit.toBase(inputValue);
    const result = toUnit.fromBase(baseVal);
    // Format precision cleanly
    if (Math.abs(result) < 0.000001 && result !== 0) {
      return parseFloat(result.toExponential(4));
    }
    return parseFloat(result.toFixed(6));
  }, [inputValue, fromUnit, toUnit]);

  // Complete conversion matrix for all units in current dimension
  const allConversions = useMemo(() => {
    if (isNaN(inputValue)) return [];
    const baseVal = fromUnit.toBase(inputValue);
    return currentConfig.units.map((u) => {
      const val = u.fromBase(baseVal);
      const formatted =
        Math.abs(val) < 0.00001 && val !== 0 ? val.toExponential(4) : parseFloat(val.toFixed(6));
      return {
        ...u,
        convertedValue: formatted,
      };
    });
  }, [inputValue, fromUnit, currentConfig]);

  const handleCopy = () => {
    const text = `${inputValue} ${fromUnit.symbol} = ${convertedValue} ${toUnit.symbol}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    trackEvent('copy_clicked', { tool: 'unit-converter' });
  };

  return (
    <div className="space-y-8">
      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {(Object.keys(DIMENSION_CONFIG) as Dimension[]).map((dim) => {
          const cfg = DIMENSION_CONFIG[dim];
          const Icon = cfg.icon;
          const isActive = activeDimension === dim;
          return (
            <button
              key={dim}
              type="button"
              onClick={() => handleDimensionChange(dim)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-purple-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Main Converter Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
          {/* FROM Unit Block */}
          <div className="md:col-span-5 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              From ({fromUnit.name})
            </label>
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-2xl font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
            <select
              value={fromUnitId}
              onChange={(e) => setFromUnitId(e.target.value)}
              aria-label="From Unit"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            >
              {currentConfig.units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <div className="md:col-span-1 flex justify-center py-2">
            <button
              type="button"
              onClick={handleSwap}
              aria-label="Swap Units"
              className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 hover:bg-purple-100 hover:scale-110 active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              <ArrowRightLeft className="w-5 h-5" />
            </button>
          </div>

          {/* TO Unit Block */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                To ({toUnit.name})
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="w-full px-4 py-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/60 text-2xl font-black text-purple-600 dark:text-purple-400 overflow-x-auto">
              {convertedValue}
            </div>
            <select
              value={toUnitId}
              onChange={(e) => setToUnitId(e.target.value)}
              aria-label="To Unit"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            >
              {currentConfig.units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Value Presets */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex-wrap">
          <span className="text-xs font-bold text-slate-400">Quick Values:</span>
          {[1, 5, 10, 25, 50, 100, 500, 1000].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setInputValue(num)}
              className="px-3 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-100 dark:hover:bg-purple-900 hover:text-purple-600 transition-colors cursor-pointer"
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      {/* Comprehensive Conversion Matrix Table */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          {currentConfig.label} Conversion Matrix for {inputValue} {fromUnit.symbol}
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
          {allConversions.map((u) => (
            <div
              key={u.id}
              onClick={() => {
                setToUnitId(u.id);
                navigator.clipboard.writeText(`${u.convertedValue} ${u.symbol}`);
              }}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                u.id === toUnitId
                  ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500/50 text-purple-700 dark:text-purple-300 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 hover:border-slate-400'
              }`}
            >
              <div>
                <div className="text-[11px] font-bold text-slate-400">{u.name}</div>
                <div className="text-sm font-black text-slate-900 dark:text-white">
                  {u.convertedValue}{' '}
                  <span className="text-xs font-semibold text-slate-400">{u.symbol}</span>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Click
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
