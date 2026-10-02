import crypto from 'crypto';

export interface SessionPayload {
  userId: string;
  username: string;
  name: string;
  email?: string;
  role: string;
  roles?: string[];
  permissions?: string[];
  iat: number;
  exp: number;
}

const SESSION_SECRET = process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SESSION_SECRET) {
  console.error('CRITICAL: SESSION_SECRET environment variable is not set. Using a random secret — sessions will not persist across restarts.');
}
const EFFECTIVE_SECRET = SESSION_SECRET || crypto.randomBytes(32).toString('hex');

/**
 * Creates an HMAC-SHA256 signature for a string payload
 */
function createSignature(data: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64url');
}

/**
 * Signs a session payload into a tamper-proof token: <base64urlPayload>.<signature>
 */
export function signSession(payload: Omit<SessionPayload, 'iat' | 'exp'>, maxAgeSeconds: number = 60 * 60 * 24 * 7): string {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: SessionPayload = {
    ...payload,
    iat: now,
    exp: now + maxAgeSeconds
  };

  const jsonStr = JSON.stringify(fullPayload);
  const encodedPayload = Buffer.from(jsonStr, 'utf-8').toString('base64url');
  const signature = createSignature(encodedPayload, EFFECTIVE_SECRET);

  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies a signed session token. Returns null if invalid, expired, or tampered.
 */
export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [encodedPayload, signature] = parts;
  if (!encodedPayload || !signature) return null;

  const expectedSignature = createSignature(encodedPayload, EFFECTIVE_SECRET);
  // Constant-time comparison to prevent timing attacks
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const jsonStr = Buffer.from(encodedPayload, 'base64url').toString('utf-8');
    const payload = JSON.parse(jsonStr) as SessionPayload;

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}
