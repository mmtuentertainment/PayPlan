import type { IncomingMessage } from 'http';

export function getClientIp(req: IncomingMessage): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];

  if (forwarded) {
    // x-forwarded-for can be comma-separated: "client, proxy1, proxy2"
    // Take the FIRST value (original client)
    const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return ip.split(',')[0].trim();
  }

  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  return undefined;
}