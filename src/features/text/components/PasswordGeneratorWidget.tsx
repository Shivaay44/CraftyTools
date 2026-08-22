import React, { useState, useEffect } from 'react';
import { trackEvent } from '../../../lib/analytics';
import { ShieldCheck, Copy, Check, RefreshCw, AlertCircle } from 'lucide-react';

export const PasswordGeneratorWidget: React.FC = () => {
  const [length, setLength] = useState<number>(16);
  const [useLowercase, setUseLowercase] = useState<boolean>(true);
  const [useUppercase, setUseUppercase] = useState<boolean>(true);
  const [useNumbers, setUseNumbers] = useState<boolean>(true);
  const [useSymbols, setUseSymbols] = useState<boolean>(true);

  const [password, setPassword] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const generatePassword = () => {
    setErrorMsg(null);
    let charset = '';
    if (useLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (useUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (useNumbers) charset += '0123456789';
    if (useSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!charset) {
      setErrorMsg('Please select at least one character set.');
      setPassword('');
      return;
    }

    // Cryptographically secure random character selection using Web Crypto API
    const randomValues = new Uint32Array(length);
    window.crypto.getRandomValues(randomValues);

    let res = '';
    for (let i = 0; i < length; i++) {
      res += charset[randomValues[i] % charset.length];
    }

    setPassword(res);
    setCopied(false);
    trackEvent('tool_started', { tool: 'password-generator' });
  };

  useEffect(() => {
    generatePassword();
  }, [length, useLowercase, useUppercase, useNumbers, useSymbols]);

  const handleCopy = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    trackEvent('copy_clicked', { tool: 'password-generator' });
  };

  // Evaluate visual security strength score
  const getStrength = () => {
    if (!password) return { label: 'None', color: 'bg-slate-300' };
    let score = 0;
    if (length >= 12) score += 2;
    if (length >= 16) score += 1;
    if (useLowercase) score += 1;
    if (useUppercase) score += 1;
    if (useNumbers) score += 1;
    if (useSymbols) score += 1;

    if (score <= 3) return { label: 'Weak', color: 'bg-red-500' };
    if (score <= 5) return { label: 'Fair', color: 'bg-amber-500' };
    if (score <= 6) return { label: 'Strong', color: 'bg-blue-500' };
    return { label: 'Ultra Strong', color: 'bg-emerald-500' };
  };

  const strength = getStrength();

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span>Generated passwords are not sent to our server or stored by Toolchemy.</span>
      </div>

      {/* Generated Password Result Display */}
      <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-4">
          <span className="font-mono text-lg font-bold text-slate-900 dark:text-slate-100 break-all select-all tracking-wider">
            {password || 'Select character set'}
          </span>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={generatePassword}
              className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title="Regenerate Password"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!password}
              className="px-4 py-2.5 rounded-lg font-bold text-xs text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Strength Indicator */}
        {password && (
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-500">Security Strength</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div className={`h-full ${strength.color} transition-all duration-300`} style={{ width: '100%' }} />
              </div>
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{strength.label}</span>
            </div>
          </div>
        )}
      </div>

      {/* Generator Controls */}
      <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs font-bold text-slate-800 dark:text-slate-200">
            <span>Password Length</span>
            <span className="font-mono text-sm px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              {length} characters
            </span>
          </div>
          <input
            type="range"
            min={6}
            max={64}
            value={length}
            onChange={(e) => setLength(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={useLowercase}
              onChange={(e) => setUseLowercase(e.target.checked)}
              className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
            />
            <span>Lowercase (a-z)</span>
          </label>

          <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={useUppercase}
              onChange={(e) => setUseUppercase(e.target.checked)}
              className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
            />
            <span>Uppercase (A-Z)</span>
          </label>

          <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={useNumbers}
              onChange={(e) => setUseNumbers(e.target.checked)}
              className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
            />
            <span>Numbers (0-9)</span>
          </label>

          <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={useSymbols}
              onChange={(e) => setUseSymbols(e.target.checked)}
              className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
            />
            <span>Symbols (!@#$%)</span>
          </label>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
