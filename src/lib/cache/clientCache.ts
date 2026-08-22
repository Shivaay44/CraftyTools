const CACHE_PREFIX = 'toolbox_ai_cache_';
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheItem<T = unknown> {
  timestamp: number;
  data: T;
}

export function generateCacheKey(tool: string, input: string, options?: Record<string, unknown>): string {
  const normalizedInput = input.trim().toLowerCase().replace(/\s+/g, ' ');
  const optionsString = options ? JSON.stringify(options) : '';
  const rawKey = `${tool}:${normalizedInput}:${optionsString}`;
  
  // Simple hash for localStorage key stability
  let hash = 0;
  for (let i = 0; i < rawKey.length; i++) {
    const char = rawKey.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `${CACHE_PREFIX}${tool}_${Math.abs(hash)}`;
}

export function getCachedResult<T = unknown>(key: string, ttlMs: number = DEFAULT_TTL_MS): T | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const item: CacheItem<T> = JSON.parse(raw);
    const now = Date.now();

    if (now - item.timestamp > ttlMs) {
      localStorage.removeItem(key);
      return null;
    }

    return item.data;
  } catch (e) {
    console.warn('[Cache Read Error]', e);
    return null;
  }
}

export function setCachedResult<T = unknown>(key: string, data: T): void {
  if (typeof window === 'undefined') return;

  try {
    const item: CacheItem<T> = {
      timestamp: Date.now(),
      data,
    };
    localStorage.setItem(key, JSON.stringify(item));
  } catch (e) {
    console.warn('[Cache Write Error]', e);
  }
}
