/**
 * SERVER RATE LIMITING ABSTRACTION
 * Interface and in-memory implementation for serverless API endpoints.
 *
 * NOTE ON DEPLOYMENT LIMITATIONS:
 * In serverless environments (such as Vercel), in-memory Map rate limiting is scoped per serverless instance.
 * For production distributed rate limiting across edge instances, swap this provider with Upstash Redis or Vercel KV
 * without modifying the /api/generate endpoint contract.
 */

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export interface RateLimitProvider {
  checkRateLimit(ip: string): Promise<RateLimitResult>;
}

interface RateLimitStore {
  count: number;
  resetTime: number;
}

class InMemoryRateLimiter implements RateLimitProvider {
  private ipMap = new Map<string, RateLimitStore>();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs = 60 * 1000, maxRequests = 15) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  async checkRateLimit(ip: string): Promise<RateLimitResult> {
    const now = Date.now();
    const record = this.ipMap.get(ip);

    if (!record || now > record.resetTime) {
      const newRecord: RateLimitStore = {
        count: 1,
        resetTime: now + this.windowMs,
      };
      this.ipMap.set(ip, newRecord);
      return {
        success: true,
        limit: this.maxRequests,
        remaining: this.maxRequests - 1,
        reset: newRecord.resetTime,
      };
    }

    if (record.count >= this.maxRequests) {
      return {
        success: false,
        limit: this.maxRequests,
        remaining: 0,
        reset: record.resetTime,
      };
    }

    record.count += 1;
    return {
      success: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - record.count,
      reset: record.resetTime,
    };
  }
}

export const rateLimiter: RateLimitProvider = new InMemoryRateLimiter();
