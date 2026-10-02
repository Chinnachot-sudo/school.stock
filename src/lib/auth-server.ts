import crypto from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { AppUser, UserRole } from '@/types/inventory';
import { can, canAny, getUserPermissions, PermissionKey } from '@/lib/auth/permissions';
import { verifySessionToken } from '@/lib/session';

export function hashPassword(password: string, customSalt?: string): { hash: string; salt: string } {
  const salt = customSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 600000, 64, 'sha512').toString('hex');
  return {
    hash: `${salt}:${hash}`,
    salt
  };
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, originalHash] = storedHash.split(':');
  
  // Try current iteration count first
  const computedHash = crypto.pbkdf2Sync(password, salt, 600000, 64, 'sha512').toString('hex');
  const computedBuffer = Buffer.from(computedHash);
  const originalBuffer = Buffer.from(originalHash);
  if (computedBuffer.length === originalBuffer.length && crypto.timingSafeEqual(computedBuffer, originalBuffer)) {
    return true;
  }
  
  // Backward compatibility: try legacy 1000 iterations (for existing hashes not yet migrated)
  const legacyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  const legacyBuffer = Buffer.from(legacyHash);
  if (legacyBuffer.length === originalBuffer.length && crypto.timingSafeEqual(legacyBuffer, originalBuffer)) {
    return true;
  }
  
  return false;
}

/**
 * Extract and cryptographically verify authenticated user session on the server side
 * Verifies HMAC signature on the session token.
 */
export async function getServerUser(request?: Request): Promise<AppUser | null> {
  try {
    let rawToken: string | undefined;

    // 1. Try reading from Next.js cookieStore
    try {
      const cookieStore = await cookies();
      rawToken = cookieStore.get('school_session')?.value || cookieStore.get('school_user')?.value;
    } catch {
      // Ignore when not in request cookie context
    }

    // 2. Try reading from Request headers
    if (!rawToken && request) {
      const cookieHeader = request.headers.get('cookie') || '';
      const sessionMatch = cookieHeader.match(/school_session=([^;]+)/);
      const userMatch = cookieHeader.match(/school_user=([^;]+)/);
      if (sessionMatch) {
        rawToken = decodeURIComponent(sessionMatch[1]);
      } else if (userMatch) {
        rawToken = decodeURIComponent(userMatch[1]);
      } else {
        const authHeader = request.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
          rawToken = authHeader.substring(7).trim();
        }
      }
    }

    if (!rawToken) return null;

    // 3. Cryptographically verify HMAC-signed session token
    const verified = verifySessionToken(rawToken);
    if (verified) {
      const userObj: AppUser = {
        id: verified.userId,
        username: verified.username,
        name: verified.name,
        email: verified.email,
        role: verified.role as UserRole,
        roles: verified.roles || [verified.role],
        permissions: (verified.permissions && verified.permissions.length > 0)
          ? (verified.permissions as PermissionKey[])
          : getUserPermissions({ role: verified.role as UserRole } as AppUser)
      };
      return userObj;
    }

    // Unsigned tokens are rejected — only HMAC-verified sessions accepted
  } catch (err) {
    console.error('getServerUser error:', err);
  }

  return null;
}

/**
 * Verify user session and return userId and permissions
 */
export async function verifySession(request?: Request): Promise<{
  userId: string;
  permissions: PermissionKey[];
  user: AppUser;
} | null> {
  const user = await getServerUser(request);
  if (!user) return null;
  return {
    userId: user.id,
    permissions: (user.permissions || getUserPermissions(user)) as PermissionKey[],
    user
  };
}

/**
 * Server-side Route Guard: Requires user to be authenticated (any valid session).
 */
export async function requireAuth(
  request: Request
): Promise<{ user: AppUser; errorResponse?: null } | { user?: null; errorResponse: NextResponse }> {
  const user = await getServerUser(request);

  if (!user) {
    return {
      errorResponse: NextResponse.json(
        { error: 'Unauthorized: Session missing or invalid. Please sign in.' },
        { status: 401 }
      )
    };
  }

  return { user };
}

/**
 * Server-side Route Guard for API endpoints.
 * Requires user to have a SPECIFIC permission.
 */
export async function requirePermission(
  request: Request,
  permission: PermissionKey
): Promise<{ user: AppUser; errorResponse?: null } | { user?: null; errorResponse: NextResponse }> {
  const user = await getServerUser(request);

  if (!user) {
    return {
      errorResponse: NextResponse.json(
        { error: 'Unauthorized: Session missing or invalid. Please sign in.' },
        { status: 401 }
      )
    };
  }

  if (!can(user, permission)) {
    return {
      errorResponse: NextResponse.json(
        { error: `Forbidden: Missing required permission "${permission}".` },
        { status: 403 }
      )
    };
  }

  return { user };
}

/**
 * Server-side Route Guard: Requires user to have AT LEAST ONE of the specified permissions.
 */
export async function requireAnyPermission(
  request: Request,
  permissions: PermissionKey[]
): Promise<{ user: AppUser; errorResponse?: null } | { user?: null; errorResponse: NextResponse }> {
  const user = await getServerUser(request);

  if (!user) {
    return {
      errorResponse: NextResponse.json(
        { error: 'Unauthorized: Session missing or invalid. Please sign in.' },
        { status: 401 }
      )
    };
  }

  if (!canAny(user, permissions)) {
    return {
      errorResponse: NextResponse.json(
        { error: `Forbidden: Missing required permissions. Allowed: ${permissions.join(', ')}` },
        { status: 403 }
      )
    };
  }

  return { user };
}
