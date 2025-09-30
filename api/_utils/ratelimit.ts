import { Ratelimit } from '@upstash/ratelimit';
import { getRedisClient } from './redis';
import { buildProblem, PROBLEM_TYPES } from './problem';
import type { ServerResponse } from 'http';

const RATE_LIMIT = parseInt(process.env.RATE_LIMIT_PER_HOUR || '60', 10);
const WINDOW_MS = 60 * 60 * 1000; // 1 hour in milliseconds

let limiter: Ratelimit | null = null;

function getLimiter(): Ratelimit | null {
  if (limiter) return limiter;

  const redis = getRedisClient();
  if (!redis) return null;

  const env = process.env.NODE_ENV || 'development';
  limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(RATE_LIMIT, `${WINDOW_MS} ms`),
    prefix: `PAYPLAN:${env}:rl`,
    analytics: false
  });

  return limiter;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;  // Unix timestamp (seconds)
  retryAfterSeconds?: number;
}

export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  const limiter = getLimiter();

  // If Redis not available, allow request (fail open)
  if (!limiter || !ip) {
    return {
      allowed: true,
      limit: RATE_LIMIT,
      remaining: RATE_LIMIT - 1,
      reset: Math.floor((Date.now() + WINDOW_MS) / 1000)
    };
  }

  try {
    const result = await limiter.limit(ip);

    return {
      allowed: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: Math.floor(result.reset / 1000), // Convert ms to seconds
      retryAfterSeconds: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000)
    };
  } catch (error) {
    console.error('[RateLimit] Check failed, allowing request:', error);
    // Fail open on errors
    return {
      allowed: true,
      limit: RATE_LIMIT,
      remaining: RATE_LIMIT - 1,
      reset: Math.floor((Date.now() + WINDOW_MS) / 1000)
    };
  }
}

export function setRateLimitHeaders(res: ServerResponse, result: RateLimitResult): void {
  res.setHeader('X-RateLimit-Limit', result.limit.toString());
  res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
  res.setHeader('X-RateLimit-Reset', result.reset.toString());

  if (result.retryAfterSeconds !== undefined) {
    res.setHeader('Retry-After', result.retryAfterSeconds.toString());
  }
}

export function sendRateLimitExceeded(res: ServerResponse, result: RateLimitResult, host: string): void {
  const problem = buildProblem(
    PROBLEM_TYPES.RATE_LIMIT_EXCEEDED,
    `Rate limit of ${result.limit} requests per hour exceeded. Please retry after ${result.retryAfterSeconds} seconds.`,
    host
  );

  setRateLimitHeaders(res, result);
  res.statusCode = 429;
  res.setHeader('Content-Type', 'application/problem+json');
  res.end(JSON.stringify(problem));
}