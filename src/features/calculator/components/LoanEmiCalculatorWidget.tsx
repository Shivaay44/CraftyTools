import React, { useState, useMemo } from 'react';
import { trackEvent } from '../../../lib/analytics';
import {
  Download,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const LoanEmiCalculatorWidget: React.FC = () => {
  const [loanAmount, setLoanAmount] = useState<number>(1000000); // 10 Lakhs / $1M
  const [interestRate, setInterestRate] = useState<number>(8.5); // 8.5%
  const [tenureYears, setTenureYears] = useState<number>(15); // 15 years
  const [currencySymbol, setCurrencySymbol] = useState<string>('₹');
  const [showAmortization, setShowAmortization] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const emiData = useMemo(() => {
    const P = Math.max(0, loanAmount);
    const r = Math.max(0, interestRate) / 12 / 100;
    const n = Math.max(1, tenureYears) * 12;

    if (P <= 0 || n <= 0) return null;

    let emi = 0;
    let totalPayment = 0;
    let totalInterest = 0;

    if (r === 0) {
      // 0% Interest loan
      emi = P / n;
      totalPayment = P;
      totalInterest = 0;
    } else {
      // Standard monthly EMI formula: P * r * (1+r)^n / ((1+r)^n - 1)
      const factor = Math.pow(1 + r, n);
      emi = (P * r * factor) / (factor - 1);
      totalPayment = emi * n;
      totalInterest = totalPayment - P;
    }

    const interestRatio = totalPayment > 0 ? (totalInterest / totalPayment) * 100 : 0;
    const principalRatio = totalPayment > 0 ? (P / totalPayment) * 100 : 100;

    // Year by Year Amortization Schedule
    const yearlySchedule: Array<{
      year: number;
      openingBalance: number;
      principalPaid: number;
      interestPaid: number;
      totalEmiPaid: number;
      closingBalance: number;
    }> = [];

    let currentBalance = P;

    for (let yr = 1; yr <= tenureYears; yr++) {
      const yearOpening = currentBalance;
      let yrPrincipal = 0;
      let yrInterest = 0;

      for (let m = 1; m <= 12; m++) {
        const monthInterest = r > 0 ? currentBalance * r : 0;
        const monthPrincipal = emi - monthInterest;
        yrInterest += monthInterest;
        yrPrincipal += monthPrincipal;
        currentBalance = Math.max(0, currentBalance - monthPrincipal);
      }

      yearlySchedule.push({
        year: yr,
        openingBalance: Math.round(yearOpening),
        principalPaid: Math.round(yrPrincipal),
        interestPaid: Math.round(yrInterest),
        totalEmiPaid: Math.round(yrPrincipal + yrInterest),
        closingBalance: Math.round(currentBalance),
      });
    }

    return {
      monthlyEmi: Math.round(emi),
      totalInterest: Math.round(totalInterest),
      totalPayment: Math.round(totalPayment),
      interestRatio: parseFloat(interestRatio.toFixed(1)),
      principalRatio: parseFloat(principalRatio.toFixed(1)),
      yearlySchedule,
    };
  }, [loanAmount, interestRate, tenureYears]);

  const handleCopy = () => {
    if (!emiData) return;
    const summary = `💰 Loan EMI Summary:\n• Loan Amount: ${currencySymbol}${loanAmount.toLocaleString()}\n• Interest Rate: ${interestRate}%\n• Tenure: ${tenureYears} Years\n• Monthly EMI: ${currencySymbol}${emiData.monthlyEmi.toLocaleString()}\n• Total Interest: ${currencySymbol}${emiData.totalInterest.toLocaleString()}\n• Total Payment: ${currencySymbol}${emiData.totalPayment.toLocaleString()}\n• Calculated on FreeTools`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    trackEvent('copy_clicked', { tool: 'loan-emi-calculator' });
  };

  const handleDownloadCsv = () => {
    if (!emiData) return;
    let csv = 'Year,Opening Balance,Principal Paid,Interest Paid,Total EMI Paid,Closing Balance\n';
    emiData.yearlySchedule.forEach((row) => {
      csv += `${row.year},${row.openingBalance},${row.principalPaid},${row.interestPaid},${row.totalEmiPaid},${row.closingBalance}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loan-amortization-${loanAmount}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    trackEvent('download_clicked', { tool: 'loan-emi-calculator' });
  };

  return (
    <div className="space-y-8">
      {/* Input Controls */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        {/* Currency Switcher */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Select Currency
          </span>
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800">
            {['₹', '$', '€', '£', '¥'].map((sym) => (
              <button
                key={sym}
                type="button"
                onClick={() => setCurrencySymbol(sym)}
                className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currencySymbol === sym
                    ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {sym}
              </button>
            ))}
          </div>
        </div>

        {/* Loan Amount */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Loan Amount
            </label>
            <div className="text-lg font-black text-slate-900 dark:text-white">
              {currencySymbol} {loanAmount.toLocaleString()}
            </div>
          </div>
          <input
            type="range"
            min="10000"
            max="10000000"
            step="10000"
            value={loanAmount}
            onChange={(e) => setLoanAmount(Number(e.target.value))}
            aria-label="Loan Amount Range"
            className="w-full accent-purple-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
          />
          <div className="flex items-center gap-2 flex-wrap pt-1">
            {[100000, 500000, 1000000, 2500000, 5000000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setLoanAmount(amt)}
                className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-purple-100 hover:text-purple-600 transition-colors cursor-pointer"
              >
                {currencySymbol} {(amt / 100000).toFixed(0)}L
              </button>
            ))}
          </div>
        </div>

        {/* Interest Rate % */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Interest Rate (% p.a.)
            </label>
            <div className="text-lg font-black text-slate-900 dark:text-white">
              {interestRate}%
            </div>
          </div>
          <input
            type="range"
            min="1"
            max="30"
            step="0.1"
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            aria-label="Interest Rate Range"
            className="w-full accent-purple-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
          />
          <div className="flex items-center gap-2 flex-wrap pt-1">
            {[6.5, 7.5, 8.5, 9.5, 10.5, 12.0, 14.5].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => setInterestRate(rate)}
                className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-purple-100 hover:text-purple-600 transition-colors cursor-pointer"
              >
                {rate}%
              </button>
            ))}
          </div>
        </div>

        {/* Loan Tenure */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Loan Tenure
            </label>
            <div className="text-lg font-black text-slate-900 dark:text-white">
              {tenureYears} Years ({tenureYears * 12} Months)
            </div>
          </div>
          <input
            type="range"
            min="1"
            max="30"
            step="1"
            value={tenureYears}
            onChange={(e) => setTenureYears(Number(e.target.value))}
            aria-label="Loan Tenure Range"
            className="w-full accent-purple-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
          />
          <div className="flex items-center gap-2 flex-wrap pt-1">
            {[1, 3, 5, 10, 15, 20, 25, 30].map((yr) => (
              <button
                key={yr}
                type="button"
                onClick={() => setTenureYears(yr)}
                className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-purple-100 hover:text-purple-600 transition-colors cursor-pointer"
              >
                {yr}Y
              </button>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!emiData}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white flex items-center gap-2 shadow-md shadow-purple-500/20 transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied Summary!' : 'Copy Summary'}
          </button>
        </div>
      </div>

      {/* Results & Visual Breakdown */}
      {emiData && (
        <div className="space-y-6">
          {/* Main EMI Card */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 text-white shadow-xl shadow-purple-500/10 relative overflow-hidden">
            <div className="relative z-10 space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-purple-200">
                Monthly Loan EMI
              </span>
              <div className="text-4xl sm:text-6xl font-black tracking-tight">
                {currencySymbol} {emiData.monthlyEmi.toLocaleString()}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/15 text-sm">
                <div>
                  <div className="text-xs text-purple-200">Total Interest Payable</div>
                  <div className="text-xl font-bold mt-0.5">
                    {currencySymbol} {emiData.totalInterest.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-purple-200">Total Payment (Principal + Interest)</div>
                  <div className="text-xl font-bold mt-0.5">
                    {currencySymbol} {emiData.totalPayment.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown Bar & Chart */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Payment Breakdown
            </h4>

            {/* Split Visual Progress Bar */}
            <div className="h-6 w-full rounded-full overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${emiData.principalRatio}%` }}
                className="h-full bg-indigo-500 transition-all duration-500"
                title={`Principal: ${emiData.principalRatio}%`}
              ></div>
              <div
                style={{ width: `${emiData.interestRatio}%` }}
                className="h-full bg-amber-500 transition-all duration-500"
                title={`Interest: ${emiData.interestRatio}%`}
              ></div>
            </div>

            <div className="flex items-center justify-between text-xs font-bold pt-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block"></span>
                <span className="text-slate-700 dark:text-slate-300">
                  Principal: {currencySymbol} {loanAmount.toLocaleString()} ({emiData.principalRatio}%)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                <span className="text-slate-700 dark:text-slate-300">
                  Total Interest: {currencySymbol} {emiData.totalInterest.toLocaleString()} ({emiData.interestRatio}%)
                </span>
              </div>
            </div>
          </div>

          {/* Amortization Schedule Accordion & Table */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Year-by-Year Amortization Schedule
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Breakdown of principal repayment and interest per year
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-100 hover:text-purple-600 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => setShowAmortization(!showAmortization)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  {showAmortization ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {showAmortization && (
              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="pb-3">Year</th>
                      <th className="pb-3">Opening Balance</th>
                      <th className="pb-3">Principal Paid</th>
                      <th className="pb-3">Interest Paid</th>
                      <th className="pb-3">Total Paid</th>
                      <th className="pb-3">Closing Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {emiData.yearlySchedule.map((row) => (
                      <tr key={row.year} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 font-bold text-slate-900 dark:text-white">Year {row.year}</td>
                        <td className="py-2.5 text-slate-600 dark:text-slate-300">
                          {currencySymbol} {row.openingBalance.toLocaleString()}
                        </td>
                        <td className="py-2.5 text-indigo-600 dark:text-indigo-400 font-semibold">
                          {currencySymbol} {row.principalPaid.toLocaleString()}
                        </td>
                        <td className="py-2.5 text-amber-600 dark:text-amber-400 font-semibold">
                          {currencySymbol} {row.interestPaid.toLocaleString()}
                        </td>
                        <td className="py-2.5 text-slate-900 dark:text-white font-bold">
                          {currencySymbol} {row.totalEmiPaid.toLocaleString()}
                        </td>
                        <td className="py-2.5 text-slate-600 dark:text-slate-300">
                          {currencySymbol} {row.closingBalance.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Financial Disclaimer */}
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-300 leading-relaxed flex items-start gap-2.5">
            <span className="text-base flex-shrink-0">⚠️</span>
            <p>
              <strong>Financial & Estimation Disclaimer:</strong> This loan EMI calculator provides mathematical approximations based on standard reducing-balance amortization formulas. Actual bank loan terms, processing fees, taxes, insurance, and exact interest compounding schedules may vary by lending institution. Consult your lender or financial advisor for binding quote details.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
