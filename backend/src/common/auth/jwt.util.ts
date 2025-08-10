import crypto from 'crypto';

function base64url(input: Buffer | string): string {
  const b = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return b.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64urlDecode(input: string): Buffer {
  const pad = 4 - (input.length % 4 || 4);
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad === 4 ? 0 : pad);
  return Buffer.from(b64, 'base64');
}

export type JwtPayload = Record<string, any>;

export function signJwtHS256(payload: JwtPayload, secret: string, options?: { expiresInSec?: number }): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body: any = { iat: now, ...payload };
  if (options?.expiresInSec) body.exp = now + options.expiresInSec;

  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(body));
  const data = `${headerB64}.${payloadB64}`;
  const sig = crypto.createHmac('sha256', secret).update(data).digest();
  const sigB64 = base64url(sig);
  return `${data}.${sigB64}`;
}

export function verifyJwtHS256(token: string, secret: string): { valid: boolean; payload?: JwtPayload; error?: string } {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return { valid: false, error: 'Malformed token' };
    const [h, p, s] = parts;
    const data = `${h}.${p}`;
    const expected = base64url(crypto.createHmac('sha256', secret).update(data).digest());
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(s))) {
      return { valid: false, error: 'Signature mismatch' };
    }
    const payloadStr = base64urlDecode(p).toString('utf8');
    const payload = JSON.parse(payloadStr);
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return { valid: false, error: 'Token expired' };
    }
    return { valid: true, payload };
  } catch (e: any) {
    return { valid: false, error: e?.message || 'Invalid token' };
  }
}
