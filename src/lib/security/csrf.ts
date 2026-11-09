import crypto from 'crypto';
import { env } from '../../config/env';

export const CSRF_HEADER_NAME = 'x-csrf-token';
export const CSRF_FIELD_NAME = 'csrf_token';
export const CSRF_COOKIE_NAME = 'agy_csrf_token';




export function generateCsrfToken(sessionId: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hmac = crypto
    .createHmac('sha256', env.CSRF_SECRET)
    .update(`${sessionId}:${salt}`)
    .digest('hex');
  return `${salt}.${hmac}`;
}




export function verifyCsrfToken(token: string | null | undefined, sessionId: string): boolean {
  if (!token || typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [salt, hmac] = parts;
  if (!salt || !hmac) return false;

  const expectedHmac = crypto
    .createHmac('sha256', env.CSRF_SECRET)
    .update(`${sessionId}:${salt}`)
    .digest('hex');

  const bufActual = Buffer.from(hmac, 'utf-8');
  const bufExpected = Buffer.from(expectedHmac, 'utf-8');

  if (bufActual.length !== bufExpected.length) return false;

  return crypto.timingSafeEqual(bufActual, bufExpected);
}




export function verifyOriginAndReferer(request: Request): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');

  if (!host) return false;

  
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      return originHost === host;
    } catch {
      return false;
    }
  }

  if (referer) {
    try {
      const refererHost = new URL(referer).host;
      return refererHost === host;
    } catch {
      return false;
    }
  }

  
  return true;
}
