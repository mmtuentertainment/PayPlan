import { Redis } from '@upstash/redis';

let redisClient: Redis | null = null;
let initAttempted = false;

export function getRedisClient(): Redis | null {
  if (initAttempted) return redisClient;

  initAttempted = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn('[Redis] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set. Rate limiting and idempotency disabled.');
    return null;
  }

  try {
    redisClient = new Redis({
      url,
      token
    });
    console.log('[Redis] Client initialized successfully');
    return redisClient;
  } catch (error) {
    console.error('[Redis] Failed to initialize client:', error);
    return null;
  }
}

export async function healthCheck(): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    await client.ping();
    return true;
  } catch (error) {
    console.error('[Redis] Health check failed:', error);
    return false;
  }
}