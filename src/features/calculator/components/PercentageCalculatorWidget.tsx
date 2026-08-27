import React, { useState, useMemo } from 'react';
import { trackEvent } from '../../../lib/analytics';
import {
  Percent,
  TrendingUp,
  Tag,
  Copy,
  Check,
  Calculator,
} from 'lucide-react';

export const PercentageCalculatorWidget: React.FC = () => {
  // Mode 1: What is X% of Y?
  const [p1X, setP1X] = useState<number>(15);
  const [p1Y, setP1Y] = useState<number>(250);

  // Mode 2: X is what % of Y?
  const [p2X, setP2X] = useState<number>(45);
  const [p2Y, setP2Y] = useState<number>(180);

  // Mode 3: Percentage Increase / Decrease from X to Y
  const [p3X, setP3X] = useState<number>(80);
  const [p3Y, setP3Y] = useState<number>(120);

  // Mode 4: Discount & Sale Price
  const [p4Price, setP4Price] = useState<number>(150);
  const [p4Discount, setP4Discount] = useState<number>(25);
  const [p4Tax, setP4Tax] = useState<number>(5);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const res1 = useMemo(() => {
    if (isNaN(p1X) || isNaN(p1Y)) return 0;
    return parseFloat(((p1X / 100) * p1Y).toFixed(4));
  }, [p1X, p1Y]);

  const res2 = useMemo(() => {
    if (isNaN(p2X) || isNaN(p2Y) || p2Y === 0) return 0;
    return parseFloat(((p2X / p2Y) * 100).toFixed(4));
  }, [p2X, p2Y]);

  const res3 = useMemo(() => {
    if (isNaN(p3X) || isNaN(p3Y) || p3X === 0) return { change: 0, isIncrease: true, diff: 0 };
    const diff = p3Y - p3X;
    const change = (diff / Math.abs(p3X)) * 100;
    return {
      change: parseFloat(Math.abs(change).toFixed(2)),
      isIncrease: diff >= 0,
      diff: parseFloat(diff.toFixed(2)),
    };
  }, [p3X, p3Y]);

  const res4 = useMemo(() => {
    if (isNaN(p4Price) || isNaN(p4Discount)) return { discountAmount: 0, finalPrice: 0, savings: 0 };
    const discountAmount = (p4Price * p4Discount) / 100;
    const priceAfterDiscount = p4Price - discountAmount;
    const taxAmount = (priceAfterDiscount * (p4Tax || 0)) / 100;
    const finalPrice = priceAfterDiscount + taxAmount;
    return {
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      finalPrice: parseFloat(finalPrice.toFixed(2)),
      totalSavings: parseFloat(discountAmount.toFixed(2)),
    };
  }, [p4Price, p4Discount, p4Tax]);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    trackEvent('copy_clicked', { tool: 'percentage-calculator' });
  };

  return (
    <div className="space-y-8">
      {/* 4 Multi-Scenario Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: What is X% of Y? */}
        <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5" />
                Scenario 1
              </span>
              <button
                type="button"
                onClick={() => handleCopy('c1', `${p1X}% of ${p1Y} is ${res1}`)}
                className="text-xs font-bold text-slate-500 hover:text-purple-600 flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'c1' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === 'c1' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">
              What is <span className="text-purple-600 dark:text-purple-400">X%</span> of <span className="text-purple-600 dark:text-purple-400">Y</span>?
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">Percentage (X %)</label>
                <input
                  type="number"
                  value={p1X}
                  onChange={(e) => setP1X(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">Total Value (Y)</label>
                <input
                  type="number"
                  value={p1Y}
                  onChange={(e) => setP1Y(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/60 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Formula: ({p1X} ÷ 100) × {p1Y}
            </span>
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
              = {res1}
            </span>
          </div>
        </div>

        {/* Card 2: X is what % of Y? */}
        <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5" />
                Scenario 2
              </span>
              <button
                type="button"
                onClick={() => handleCopy('c2', `${p2X} is ${res2}% of ${p2Y}`)}
                className="text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'c2' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === 'c2' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">
              <span className="text-indigo-600 dark:text-indigo-400">X</span> is what <span className="text-indigo-600 dark:text-indigo-400">%</span> of <span className="text-indigo-600 dark:text-indigo-400">Y</span>?
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">Part (X)</label>
                <input
                  type="number"
                  value={p2X}
                  onChange={(e) => setP2X(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">Whole (Y)</label>
                <input
                  type="number"
                  value={p2Y}
                  onChange={(e) => setP2Y(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Formula: ({p2X} ÷ {p2Y}) × 100
            </span>
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              = {res2}%
            </span>
          </div>
        </div>

        {/* Card 3: Percentage Increase / Decrease */}
        <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                Scenario 3
              </span>
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    'c3',
                    `Change from ${p3X} to ${p3Y} is ${res3.isIncrease ? '+' : '-'}${res3.change}%`
                  )
                }
                className="text-xs font-bold text-slate-500 hover:text-emerald-600 flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'c3' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === 'c3' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">
              Percentage <span className="text-emerald-600 dark:text-emerald-400">Increase / Decrease</span>
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">Initial Value (X)</label>
                <input
                  type="number"
                  value={p3X}
                  onChange={(e) => setP3X(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">Final Value (Y)</label>
                <input
                  type="number"
                  value={p3Y}
                  onChange={(e) => setP3Y(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div
            className={`p-4 rounded-2xl border flex items-center justify-between ${
              res3.isIncrease
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/60'
                : 'bg-red-50 dark:bg-red-950/40 border-red-100 dark:border-red-900/60'
            }`}
          >
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {res3.isIncrease ? '📈 Growth / Increase:' : '📉 Reduction / Decrease:'}
            </span>
            <span
              className={`text-2xl font-black ${
                res3.isIncrease ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
              }`}
            >
              {res3.isIncrease ? '+' : '-'}
              {res3.change}%
            </span>
          </div>
        </div>

        {/* Card 4: Discount & Sale Price */}
        <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                Scenario 4 (Shopping)
              </span>
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    'c4',
                    `Original: $${p4Price}, Discount: ${p4Discount}%, Final Price: $${res4.finalPrice}`
                  )
                }
                className="text-xs font-bold text-slate-500 hover:text-amber-500 flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'c4' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === 'c4' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">
              Discount & Sale Price Calculator
            </h4>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Price ($)</label>
                <input
                  type="number"
                  value={p4Price}
                  onChange={(e) => setP4Price(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Discount %</label>
                <input
                  type="number"
                  value={p4Discount}
                  onChange={(e) => setP4Discount(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Tax % (Opt)</label>
                <input
                  type="number"
                  value={p4Tax}
                  onChange={(e) => setP4Tax(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/60 flex items-center justify-between">
            <div className="text-xs">
              <span className="text-slate-500">You Save:</span>{' '}
              <strong className="text-emerald-600 dark:text-emerald-400">${res4.totalSavings}</strong>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Final Price</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                ${res4.finalPrice}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
