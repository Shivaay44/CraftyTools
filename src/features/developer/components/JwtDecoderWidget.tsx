import React, { useState, useEffect } from 'react';
import { trackEvent } from '../../../lib/analytics';
import {
  ShieldCheck,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export const JwtDecoderWidget: React.FC = () => {
  const [token, setToken] = useState<string>('');
  const [headerJson, setHeaderJson] = useState<string>('');
  const [payloadJson, setPayloadJson] = useState<string>('');
  const [claims, setClaims] = useState<{ exp?: number; iat?: number; iss?: string; sub?: string; aud?: string }>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedHeader, setCopiedHeader] = useState<boolean>(false);
  const [copiedPayload, setCopiedPayload] = useState<boolean>(false);

  useEffect(() => {
    setErrorMsg(null);
    if (!token.trim()) {
      setHeaderJson('');
      setPayloadJson('');
      setClaims({});
      return;
    }

    const parts = token.trim().split('.');
    if (parts.length !== 3) {
      setErrorMsg('Invalid JWT format: A valid token must contain 3 dot-separated parts (header.payload.signature).');
      return;
    }

    try {
      const decodedHeader = base64UrlDecode(parts[0]);
      const decodedPayload = base64UrlDecode(parts[1]);

      const parsedHeader = JSON.parse(decodedHeader);
      const parsedPayload = JSON.parse(decodedPayload);

      setHeaderJson(JSON.stringify(parsedHeader, null, 2));
      setPayloadJson(JSON.stringify(parsedPayload, null, 2));

      setClaims({
        exp: parsedPayload.exp,
        iat: parsedPayload.iat,
        iss: parsedPayload.iss,
        sub: parsedPayload.sub,
        aud: parsedPayload.aud,
      });

      trackEvent('tool_completed', { tool: 'jwt-decoder' });
    } catch (err: any) {
      setErrorMsg('Failed to parse JWT payload. Ensure the token is properly Base64URL-encoded.');
    }
  }, [token]);

  const isExpired = claims.exp ? Date.now() >= claims.exp * 1000 : null;

  return (
    <div className="space-y-6">
      {/* Privacy Notice & Security Disclaimer */}
      <div className="space-y-2">
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>100% Client-Side Privacy: Tokens are decoded purely in your browser. Secrets or payloads are never sent to any server.</span>
        </div>
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <span>⚠️</span>
          <span><strong>Note for Developers:</strong> Decoding a JWT extracts and inspects the claims locally. It does not verify the cryptographic signature without the server secret or public key.</span>
        </div>
      </div>

      {/* Input */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Paste Encoded JSON Web Token (JWT)
        </label>
        <textarea
          rows={4}
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
          className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none break-all"
        />
        {errorMsg && (
          <p className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" /> {errorMsg}
          </p>
        )}
      </div>

      {/* Token Claims & Expiration Status */}
      {claims.exp && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between ${
          isExpired
            ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
            : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {isExpired ? <XCircle className="w-5 h-5 text-red-500" /> : <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
            <div>
              <span className="text-xs font-bold block">
                {isExpired ? 'Token Expired' : 'Token Active'}
              </span>
              <span className="text-xs opacity-80">
                Expires: {new Date(claims.exp * 1000).toLocaleString()} ({isExpired ? 'Past' : 'Valid'})
              </span>
            </div>
          </div>

          {claims.iat && (
            <span className="text-xs opacity-75 hidden sm:inline">
              Issued: {new Date(claims.iat * 1000).toLocaleString()}
            </span>
          )}
        </div>
      )}

      {/* Decoded Sections Grid */}
      {(headerJson || payloadJson) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Header */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-500">
                Header (Algorithm & Token Type)
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(headerJson);
                  setCopiedHeader(true);
                  setTimeout(() => setCopiedHeader(false), 2000);
                }}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                {copiedHeader ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copiedHeader ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3.5 rounded-xl bg-slate-950 text-rose-300 font-mono text-xs overflow-x-auto">
              {headerJson}
            </pre>
          </div>

          {/* Payload */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-500">
                Payload (Decoded Claims & Data)
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(payloadJson);
                  setCopiedPayload(true);
                  setTimeout(() => setCopiedPayload(false), 2000);
                }}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                {copiedPayload ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copiedPayload ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3.5 rounded-xl bg-slate-950 text-indigo-300 font-mono text-xs overflow-x-auto max-h-72">
              {payloadJson}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
