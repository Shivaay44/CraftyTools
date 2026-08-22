import type { AnalyticsEventType } from '../types';

/**
 * Vendor-neutral analytics abstraction for ToolBox.
 * Safe no-op by default until a real provider (Google Analytics, Plausible, etc.) is configured.
 */
export function trackEvent(event: AnalyticsEventType, properties?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;

  // Log in development mode for debugging
  if (import.meta.env.DEV) {
    console.log('[Analytics Event]', event, properties);
  }

  // Placeholder for provider hooks (e.g. window.gtag, window.plausible, window.va)
  try {
    const win = window as unknown as Record<string, unknown>;
    if (typeof win.gtag === 'function') {
      (win.gtag as Function)('event', event, properties);
    }
  } catch (err) {
    console.error('[Analytics Error]', err);
  }
}
