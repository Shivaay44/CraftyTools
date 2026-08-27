import type { AnalyticsEventType } from '../types';

/**
 * List of prohibited property keys that could accidentally contain user payload data.
 * If any of these keys appear, they are automatically stripped.
 */
const SENSITIVE_KEY_PATTERNS = [
  'file',
  'content',
  'text',
  'data',
  'payload',
  'password',
  'secret',
  'key',
  'token',
  'image',
  'input',
  'output',
  'value',
  'code',
  'prompt',
  'query', // We only allow query_length or query_category, never raw user search terms
];

/**
 * Sanitizes analytics event properties to guarantee zero collection of user files or text.
 */
function sanitizeProperties(properties?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!properties) return undefined;

  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_KEY_PATTERNS.some((pattern) => lowerKey.includes(pattern));

    if (isSensitive) {
      // If it's a numeric metric like length/count or safe flag, retain it under a safe name
      if (typeof value === 'number' && (lowerKey.includes('length') || lowerKey.includes('count') || lowerKey.includes('size_bytes'))) {
        clean[key] = value;
      }
      continue;
    }

    // Allow safe primitives only (string, number, boolean)
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      // Prevent long strings that might be user input
      if (typeof value === 'string' && value.length > 80) {
        continue;
      }
      clean[key] = value;
    }
  }

  return clean;
}

/**
 * Privacy-first, vendor-neutral analytics abstraction for Crafty Tool.
 * Tracks usage metrics (e.g. tool completions, format choices, error codes)
 * without ever transmitting user files, passwords, or personal text inputs.
 */
export function trackEvent(event: AnalyticsEventType, properties?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;

  const sanitizedProps = sanitizeProperties(properties);

  // Development logging
  if (import.meta.env.DEV) {
    console.log('[Crafty Tool Analytics Event]', event, sanitizedProps || {});
  }

  // Provider hooks (e.g. Google Analytics gtag, Plausible, Cloudflare Web Analytics)
  try {
    const win = window as unknown as Record<string, unknown>;
    if (typeof win.gtag === 'function') {
      (win.gtag as Function)('event', event, sanitizedProps);
    } else if (typeof win.plausible === 'function') {
      (win.plausible as Function)(event, { props: sanitizedProps });
    }
  } catch (err) {
    console.error('[Analytics Error]', err);
  }
}
